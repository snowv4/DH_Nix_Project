import {
  DestroyRef,
  effect,
  inject,
  Injectable,
  Injector,
  Signal,
  signal,
  untracked,
} from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  setDoc,
  Unsubscribe,
  updateDoc,
} from 'firebase/firestore';
import { emptyMapState, MapGrid, MapState, MapToken } from '../models/map';
import { CAMPAIGN_ID } from './campaign.repository';
import { FirebaseService } from './firebase.service';
import { snapshotSignal } from './snapshot-signal';

/**
 * Battle map: one live state document plus the map pictures, stored apart so moving a token
 * doesn't re-send the (large) image to every viewer.
 */
@Injectable({ providedIn: 'root' })
export class MapRepository {
  private readonly db = inject(FirebaseService).db;
  private readonly stateRef = doc(this.db, 'campaigns', CAMPAIGN_ID, 'map', 'state');
  private readonly imagesRef = collection(this.db, 'campaigns', CAMPAIGN_ID, 'mapImages');

  watchState(destroyRef: DestroyRef): Signal<MapState> {
    return snapshotSignal<MapState>(
      (next) =>
        onSnapshot(this.stateRef, (s) =>
          next({ ...emptyMapState(), ...(s.data() as Partial<MapState>) }),
        ),
      emptyMapState(),
      destroyRef,
    );
  }

  /** Live image data URL for an id; returns the unsubscribe so callers can switch pictures. */
  watchImage(id: string, onImage: (dataUrl: string) => void): Unsubscribe {
    if (!id) {
      onImage('');
      return () => undefined;
    }
    return onSnapshot(doc(this.imagesRef, id), (s) => {
      // A deleted (replaced) picture fires once with no data; ignore it, the new one is coming.
      if (s.exists()) onImage(String(s.data()['image'] ?? ''));
    });
  }

  /**
   * Signal of the current map picture that follows `imageId` changes. Pass the page's injector so
   * the effect and the listener die with the page.
   */
  watchCurrentImage(state: Signal<MapState>, injector: Injector): Signal<string> {
    const image = signal('');
    let watchedId: string | null = null;
    let stop: Unsubscribe = () => undefined;
    effect(
      () => {
        const id = state().imageId;
        if (id === watchedId) return;
        watchedId = id;
        stop();
        stop = untracked(() => this.watchImage(id, (url) => image.set(url)));
      },
      { injector },
    );
    injector.get(DestroyRef).onDestroy(() => stop());
    return image.asReadonly();
  }

  /** Stores a new map picture, points the state at it (fog resets) and drops the previous one. */
  async setImage(dataUrl: string, width: number, height: number, previousId = ''): Promise<void> {
    const ref = await addDoc(this.imagesRef, { image: dataUrl, createdAt: Date.now() });
    await setDoc(
      this.stateRef,
      {
        imageId: ref.id,
        width,
        height,
        fog: { enabled: false, revealed: [] },
        updatedAt: Date.now(),
      },
      { merge: true },
    );
    if (previousId) await deleteDoc(doc(this.imagesRef, previousId));
  }

  async setGrid(grid: MapGrid): Promise<void> {
    await setDoc(this.stateRef, { grid, updatedAt: Date.now() }, { merge: true });
  }

  async setFog(fog: MapState['fog']): Promise<void> {
    await setDoc(this.stateRef, { fog, updatedAt: Date.now() }, { merge: true });
  }

  /** Writes one token through a field path, so two people moving different tokens don't clash. */
  async upsertToken(token: MapToken): Promise<void> {
    await setDoc(
      this.stateRef,
      { tokens: { [token.id]: token }, updatedAt: Date.now() },
      { merge: true },
    );
  }

  async moveToken(id: string, x: number, y: number): Promise<void> {
    await updateDoc(this.stateRef, {
      [`tokens.${id}.x`]: x,
      [`tokens.${id}.y`]: y,
      updatedAt: Date.now(),
    });
  }

  async removeToken(id: string): Promise<void> {
    await updateDoc(this.stateRef, { [`tokens.${id}`]: deleteField(), updatedAt: Date.now() });
  }
}
