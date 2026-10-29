import { DestroyRef, inject, Injectable, Signal } from '@angular/core';
import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { CAMPAIGN_ID } from './campaign.repository';
import { FirebaseService } from './firebase.service';
import { snapshotSignal } from './snapshot-signal';

/**
 * Header art per domain card, uploaded by the table (official card art can't be redistributed
 * under the DPCGL). One shared image per card id: `campaigns/nix/cardArt/{cardId}`.
 */
@Injectable({ providedIn: 'root' })
export class CardArtRepository {
  private readonly db = inject(FirebaseService).db;
  private readonly artRef = collection(this.db, 'campaigns', CAMPAIGN_ID, 'cardArt');

  /** Map cardId → image data URL. */
  watchAll(destroyRef: DestroyRef): Signal<Record<string, string>> {
    return snapshotSignal<Record<string, string>>(
      (next) =>
        onSnapshot(this.artRef, (s) =>
          next(Object.fromEntries(s.docs.map((d) => [d.id, String(d.data()['image'] ?? '')]))),
        ),
      {},
      destroyRef,
    );
  }

  async set(cardId: string, image: string): Promise<void> {
    await setDoc(doc(this.artRef, cardId), { image, updatedAt: Date.now() });
  }

  async remove(cardId: string): Promise<void> {
    await deleteDoc(doc(this.artRef, cardId));
  }
}
