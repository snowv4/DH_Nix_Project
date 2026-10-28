import { DestroyRef, inject, Injectable, Signal } from '@angular/core';
import { doc, onSnapshot, runTransaction } from 'firebase/firestore';
import { Campaign } from '../models/campaign';
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

  watchCampaign(destroyRef: DestroyRef): Signal<Campaign> {
    return snapshotSignal(
      (next) =>
        onSnapshot(this.campaignRef, (s) => next({ name: 'Mesa Nix', fear: 0, ...s.data() })),
      { name: 'Mesa Nix', fear: 0 },
      destroyRef,
    );
  }

  /** Clamped 0–12 inside a transaction so two quick taps can't race each other. */
  adjustFear(delta: number): Promise<void> {
    return runTransaction(this.db, async (tx) => {
      const current =
        ((await tx.get(this.campaignRef)).data()?.['fear'] as number | undefined) ?? 0;
      tx.set(this.campaignRef, { fear: clamp(current + delta, 0, MAX_FEAR) }, { merge: true });
    });
  }
}
