import { DestroyRef, inject, Injectable, Signal } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { Npc } from '../models/npc';
import { TableService } from '../auth/table.service';
import { FirebaseService } from './firebase.service';
import { snapshotSignal } from './snapshot-signal';

/** GM-only NPC and adversary sheets, separate from the player characters. */
@Injectable({ providedIn: 'root' })
export class NpcRepository {
  private readonly db = inject(FirebaseService).db;
  private readonly table = inject(TableService);
  private get npcsRef() {
    return collection(this.db, 'campaigns', this.table.id(), 'npcs');
  }

  watchAll(destroyRef: DestroyRef): Signal<Npc[]> {
    return snapshotSignal<Npc[]>(
      (next) =>
        onSnapshot(query(this.npcsRef, orderBy('name')), (s) =>
          next(s.docs.map((d) => ({ ...(d.data() as Omit<Npc, 'id'>), id: d.id }))),
        ),
      [],
      destroyRef,
    );
  }

  /** New id without a round-trip, so the editor can open immediately. */
  newId(): string {
    return doc(this.npcsRef).id;
  }

  async save(npc: Npc): Promise<void> {
    const { id, ...data } = npc;
    await setDoc(doc(this.npcsRef, id), { ...data, updatedAt: Date.now() });
  }

  async update(id: string, patch: Partial<Omit<Npc, 'id'>>): Promise<void> {
    await updateDoc(doc(this.npcsRef, id), { ...patch, updatedAt: Date.now() });
  }

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(this.npcsRef, id));
  }
}
