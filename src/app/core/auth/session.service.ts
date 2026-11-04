import { inject, Injectable, signal } from '@angular/core';
import { DEFAULT_TABLE_ID, TableService } from './table.service';

export type Session = { kind: 'player'; characterId: string } | { kind: 'gm' };
type StoredSession = Session & { tableId: string };

const STORAGE_KEY = 'dh-nix.session';

function readStored(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || !('kind' in parsed)) return null;
    // Sessions saved before tables existed belong to Mesa Nix.
    const tableId =
      'tableId' in parsed && typeof parsed.tableId === 'string' ? parsed.tableId : DEFAULT_TABLE_ID;
    if (parsed.kind === 'gm') return { kind: 'gm', tableId };
    if (
      parsed.kind === 'player' &&
      'characterId' in parsed &&
      typeof parsed.characterId === 'string'
    ) {
      return { kind: 'player', characterId: parsed.characterId, tableId };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Who is using this browser: a player tied to one sheet, or the GM — always of one table.
 * Remembered across reloads; a session from another table counts as logged out.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly table = inject(TableService);
  private readonly current = signal<StoredSession | null>(readStored());

  session(): Session | null {
    const s = this.current();
    return s && s.tableId === this.table.id() ? s : null;
  }

  start(session: Session): void {
    const stored: StoredSession = { ...session, tableId: this.table.id() };
    this.current.set(stored);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // Private mode: the session simply lasts until the tab closes.
    }
  }

  end(): void {
    this.current.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
