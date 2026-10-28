import { Injectable, signal } from '@angular/core';

export type Session = { kind: 'player'; characterId: string } | { kind: 'gm' };

const STORAGE_KEY = 'dh-nix.session';

function readStored(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || !('kind' in parsed)) return null;
    if (parsed.kind === 'gm') return { kind: 'gm' };
    if (
      parsed.kind === 'player' &&
      'characterId' in parsed &&
      typeof parsed.characterId === 'string'
    ) {
      return { kind: 'player', characterId: parsed.characterId };
    }
    return null;
  } catch {
    return null;
  }
}

/** Who is using this browser: a player tied to one sheet, or the GM. Remembered across reloads. */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly current = signal<Session | null>(readStored());
  readonly session = this.current.asReadonly();

  start(session: Session): void {
    this.current.set(session);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
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
