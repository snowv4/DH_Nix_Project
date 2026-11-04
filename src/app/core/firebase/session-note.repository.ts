import { DestroyRef, inject, Injectable, Signal } from '@angular/core';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore';
import { SessionNote } from '../models/session-note';
import { TableService } from '../auth/table.service';
import { FirebaseService } from './firebase.service';
import { snapshotSignal } from './snapshot-signal';

/** A player's private session notebook pages. */
@Injectable({ providedIn: 'root' })
export class SessionNoteRepository {
  private readonly db = inject(FirebaseService).db;
  private readonly table = inject(TableService);

  private ref(characterId: string) {
    return collection(
      this.db,
      'campaigns',
      this.table.id(),
      'characters',
      characterId,
      'sessionNotes',
    );
  }

  watch(characterId: string, destroyRef: DestroyRef): Signal<SessionNote[] | undefined> {
    return snapshotSignal<SessionNote[] | undefined>(
      (next) =>
        onSnapshot(query(this.ref(characterId), orderBy('number', 'desc')), (s) =>
          next(s.docs.map((d) => ({ ...(d.data() as Omit<SessionNote, 'id'>), id: d.id }))),
        ),
      undefined,
      destroyRef,
    );
  }

  newId(characterId: string): string {
    return doc(this.ref(characterId)).id;
  }

  async save(characterId: string, page: SessionNote): Promise<void> {
    const { id, ...data } = page;
    await setDoc(doc(this.ref(characterId), id), { ...data, updatedAt: Date.now() });
  }

  async remove(characterId: string, pageId: string): Promise<void> {
    await deleteDoc(doc(this.ref(characterId), pageId));
  }
}
