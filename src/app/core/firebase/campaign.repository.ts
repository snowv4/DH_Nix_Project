import { DestroyRef, inject, Injectable, Signal } from '@angular/core';
import {
  collection,
  CollectionReference,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  runTransaction,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { isGmPin, tablePinHash } from '../auth/pin';
import { DEFAULT_TABLE_ID, TableService } from '../auth/table.service';
import { Campaign } from '../models/campaign';
import { clamp, characterIdFromName } from '../rules/character';
import { FirebaseService } from './firebase.service';
import { snapshotSignal } from './snapshot-signal';

export const MAX_FEAR = 12;

export interface TableEntry {
  id: string;
  name: string;
}

const defaultName = (id: string) => (id === DEFAULT_TABLE_ID ? 'Mesa Nix' : 'Mesa');

/** One document per table: `campaigns/{tableId}` (Fear, released level, GM PIN hash). */
@Injectable({ providedIn: 'root' })
export class CampaignRepository {
  private readonly db = inject(FirebaseService).db;
  private readonly table = inject(TableService);

  private get campaignRef() {
    return doc(this.db, 'campaigns', this.table.id());
  }

  watchCampaign(destroyRef: DestroyRef): Signal<Campaign> {
    const id = this.table.id();
    return snapshotSignal(
      (next) =>
        onSnapshot(doc(this.db, 'campaigns', id), (s) =>
          next({ name: defaultName(id), fear: 0, ...s.data() }),
        ),
      { name: defaultName(id), fear: 0 },
      destroyRef,
    );
  }

  /** All tables, Mesa Nix first even before its document has a name. */
  async listTables(): Promise<TableEntry[]> {
    const snap = await getDocs(collection(this.db, 'campaigns'));
    const list = snap.docs.map((d) => ({
      id: d.id,
      name: (d.data()['name'] as string | undefined) ?? defaultName(d.id),
    }));
    if (!list.some((t) => t.id === DEFAULT_TABLE_ID)) {
      list.push({ id: DEFAULT_TABLE_ID, name: defaultName(DEFAULT_TABLE_ID) });
    }
    return list.sort((a, b) =>
      a.id === DEFAULT_TABLE_ID ? -1 : b.id === DEFAULT_TABLE_ID ? 1 : a.name.localeCompare(b.name),
    );
  }

  /** Creates a table with its own GM PIN; returns its id (slug of the name, made unique). */
  async createTable(name: string, gmPin: string): Promise<string> {
    const base = characterIdFromName(name) || 'mesa';
    let id = base;
    for (let n = 2; (await getDoc(doc(this.db, 'campaigns', id))).exists(); n++)
      id = `${base}-${n}`;
    await setDoc(doc(this.db, 'campaigns', id), {
      name: name.trim(),
      fear: 0,
      levelUnlocked: 1,
      gmPinHash: await tablePinHash(id, gmPin),
      createdAt: Date.now(),
    });
    return id;
  }

  /** New tables keep their own PIN hash; Mesa Nix keeps the original PIN. */
  async checkGmPin(pin: string): Promise<boolean> {
    const id = this.table.id();
    const hash = (await getDoc(doc(this.db, 'campaigns', id))).data()?.['gmPinHash'] as
      string | undefined;
    return hash ? hash === (await tablePinHash(id, pin)) : isGmPin(pin);
  }

  async renameTable(name: string): Promise<void> {
    const clean = name.trim().slice(0, 40);
    if (clean) await setDoc(this.campaignRef, { name: clean }, { merge: true });
  }

  async setGmPin(pin: string): Promise<void> {
    await setDoc(
      this.campaignRef,
      { gmPinHash: await tablePinHash(this.table.id(), pin) },
      { merge: true },
    );
  }

  /**
   * Deletes the current table and everything under it (Firestore doesn't delete subcollections
   * on its own). Mesa Nix can't be deleted from the app.
   */
  async deleteTable(): Promise<void> {
    const id = this.table.id();
    if (id === DEFAULT_TABLE_ID) throw new Error('Mesa Nix não pode ser excluída.');
    const sub = (...path: string[]) => collection(this.db, 'campaigns', id, ...path);
    const characters = await getDocs(sub('characters'));
    for (const c of characters.docs) await this.deleteAll(sub('characters', c.id, 'sessionNotes'));
    for (const name of ['characters', 'drafts', 'npcs', 'maps', 'map', 'mapImages', 'cardArt']) {
      await this.deleteAll(sub(name));
    }
    await deleteDoc(doc(this.db, 'campaigns', id));
  }

  /** Deletes every doc of a collection in batches (Firestore allows 500 writes per batch). */
  private async deleteAll(ref: CollectionReference): Promise<void> {
    const docs = (await getDocs(ref)).docs.map((d) => d.ref);
    for (let i = 0; i < docs.length; i += 400) {
      const batch = writeBatch(this.db);
      docs.slice(i, i + 400).forEach((d) => batch.delete(d));
      await batch.commit();
    }
  }

  /** GM releases a level for the whole table (1–10). */
  async setLevelUnlocked(level: number): Promise<void> {
    await setDoc(this.campaignRef, { levelUnlocked: clamp(level, 1, 10) }, { merge: true });
  }

  /** Clamped 0–12 inside a transaction so two quick taps can't race each other. */
  adjustFear(delta: number): Promise<void> {
    const ref = this.campaignRef;
    return runTransaction(this.db, async (tx) => {
      const current = ((await tx.get(ref)).data()?.['fear'] as number | undefined) ?? 0;
      tx.set(ref, { fear: clamp(current + delta, 0, MAX_FEAR) }, { merge: true });
    });
  }
}
