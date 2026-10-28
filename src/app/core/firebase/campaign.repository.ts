import { DestroyRef, inject, Injectable, Signal } from '@angular/core';
import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
} from 'firebase/firestore';
import { Campaign, RollLogEntry } from '../models/campaign';
import { clamp } from '../rules/character';
import { FirebaseService } from './firebase.service';
import { snapshotSignal } from './snapshot-signal';

/** The group plays a single table, so everything hangs from this one campaign document. */
export const CAMPAIGN_ID = 'nix';
export const MAX_FEAR = 12;

@Injectable({ providedIn: 'root' })
export class CampaignRepository {
  private readonly db = inject(FirebaseService).db;
  private readonly campaignRef = doc(this.db, 'campaigns', CAMPAIGN_ID);
  private readonly rollsRef = collection(this.db, 'campaigns', CAMPAIGN_ID, 'rolls');

  watchCampaign(destroyRef: DestroyRef): Signal<Campaign> {
    return snapshotSignal(
      (next) =>
        onSnapshot(this.campaignRef, (s) => next({ name: 'Mesa Nix', fear: 0, ...s.data() })),
      { name: 'Mesa Nix', fear: 0 },
      destroyRef,
    );
  }

  /** Clamped 0–12 inside a transaction so the GM and a player roll can't race each other. */
  adjustFear(delta: number): Promise<void> {
    return runTransaction(this.db, async (tx) => {
      const current =
        ((await tx.get(this.campaignRef)).data()?.['fear'] as number | undefined) ?? 0;
      tx.set(this.campaignRef, { fear: clamp(current + delta, 0, MAX_FEAR) }, { merge: true });
    });
  }

  async logRoll(entry: Omit<RollLogEntry, 'id'>): Promise<void> {
    await addDoc(this.rollsRef, entry);
  }

  watchRecentRolls(destroyRef: DestroyRef, count = 15): Signal<RollLogEntry[]> {
    const q = query(this.rollsRef, orderBy('createdAt', 'desc'), limit(count));
    return snapshotSignal<RollLogEntry[]>(
      (next) =>
        onSnapshot(q, (s) =>
          next(s.docs.map((d) => ({ ...(d.data() as Omit<RollLogEntry, 'id'>), id: d.id }))),
        ),
      [],
      destroyRef,
    );
  }
}
