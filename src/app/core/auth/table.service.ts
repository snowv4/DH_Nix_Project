import { Injectable, signal } from '@angular/core';

/** The group's original table; its data lives at `campaigns/nix`. */
export const DEFAULT_TABLE_ID = 'nix';
const STORAGE_KEY = 'dh-nix.table';

function readStored(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_TABLE_ID;
  } catch {
    return DEFAULT_TABLE_ID;
  }
}

/**
 * Which table (campaign) this device is using. Every repository builds its Firestore paths from
 * it, so switching tables switches characters, NPCs, maps and the Fear tracker together.
 */
@Injectable({ providedIn: 'root' })
export class TableService {
  private readonly current = signal(readStored());
  readonly id = this.current.asReadonly();

  select(id: string): void {
    this.current.set(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Private mode: lasts until the tab closes.
    }
  }
}
