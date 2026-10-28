import { DestroyRef, inject, Injectable, Signal } from '@angular/core';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { Character, CharacterPatch } from '../models/character';
import { CAMPAIGN_ID } from './campaign.repository';
import { FirebaseService } from './firebase.service';
import { snapshotSignal } from './snapshot-signal';

@Injectable({ providedIn: 'root' })
export class CharacterRepository {
  private readonly db = inject(FirebaseService).db;
  private readonly charactersRef = collection(this.db, 'campaigns', CAMPAIGN_ID, 'characters');

  async exists(id: string): Promise<boolean> {
    return (await getDoc(doc(this.charactersRef, id))).exists();
  }

  async create(character: Character): Promise<void> {
    const { id, ...data } = character;
    await setDoc(doc(this.charactersRef, id), data);
  }

  /** `undefined` while loading, `null` if the sheet does not exist. */
  watch(id: string, destroyRef: DestroyRef): Signal<Character | null | undefined> {
    return snapshotSignal<Character | null | undefined>(
      (next) =>
        onSnapshot(doc(this.charactersRef, id), (s) =>
          next(s.exists() ? { ...(s.data() as Omit<Character, 'id'>), id: s.id } : null),
        ),
      undefined,
      destroyRef,
    );
  }

  watchAll(destroyRef: DestroyRef): Signal<Character[]> {
    return snapshotSignal<Character[]>(
      (next) =>
        onSnapshot(query(this.charactersRef, orderBy('name')), (s) =>
          next(s.docs.map((d) => ({ ...(d.data() as Omit<Character, 'id'>), id: d.id }))),
        ),
      [],
      destroyRef,
    );
  }

  /** Fire-and-forget friendly: Firestore applies the write locally first (optimistic UI). */
  async update(id: string, patch: CharacterPatch): Promise<void> {
    await updateDoc(doc(this.charactersRef, id), { ...patch, updatedAt: Date.now() });
  }
}
