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
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  Unsubscribe,
  updateDoc,
} from 'firebase/firestore';
import { emptyMapState, MapEvent, MapGrid, MapInfo, MapState, MapToken } from '../models/map';
import { CAMPAIGN_ID } from './campaign.repository';
import { FirebaseService } from './firebase.service';
import { snapshotSignal } from './snapshot-signal';

/**
 * Battle maps: a library of scenes (`maps/{id}`), a pointer to the one on the TV (`map/active`)
 * and the pictures stored apart so moving a token doesn't re-send the image to every viewer.
 */
@Injectable({ providedIn: 'root' })
export class MapRepository {
  private readonly db = inject(FirebaseService).db;
  private readonly mapsRef = collection(this.db, 'campaigns', CAMPAIGN_ID, 'maps');
  private readonly activeRef = doc(this.db, 'campaigns', CAMPAIGN_ID, 'map', 'active');
  /** Single-map location used before the library existed; migrated on first read. */
  private readonly legacyRef = doc(this.db, 'campaigns', CAMPAIGN_ID, 'map', 'state');
  private readonly imagesRef = collection(this.db, 'campaigns', CAMPAIGN_ID, 'mapImages');

  // ---------- Library ----------

  /** Id of the map shown on the TV ('' when there is none yet). Migrates the legacy single map. */
  watchActiveId(destroyRef: DestroyRef): Signal<string | undefined> {
    return snapshotSignal<string | undefined>(
      (next) =>
        onSnapshot(this.activeRef, (s) => {
          const id = String(s.data()?.['mapId'] ?? '');
          if (id || s.metadata.fromCache) {
            next(id);
            return;
          }
          void this.migrateLegacy().then((migrated) => next(migrated));
        }),
      undefined,
      destroyRef,
    );
  }

  watchList(destroyRef: DestroyRef): Signal<MapInfo[]> {
    return snapshotSignal<MapInfo[]>(
      (next) =>
        onSnapshot(this.mapsRef, (s) =>
          next(
            s.docs
              .map((d) => {
                const m = d.data() as Partial<MapState>;
                return {
                  id: d.id,
                  name: m.name ?? 'Mapa',
                  imageId: m.imageId ?? '',
                  tokenCount: Object.keys(m.tokens ?? {}).length,
                  updatedAt: m.updatedAt ?? 0,
                };
              })
              .sort((a, b) => a.name.localeCompare(b.name)),
          ),
        ),
      [],
      destroyRef,
    );
  }

  /** Live state of whichever map id the signal points at. */
  watchMap(id: Signal<string | undefined>, injector: Injector): Signal<MapState> {
    const state = signal<MapState>(emptyMapState());
    let watched: string | undefined | null = null;
    let stop: Unsubscribe = () => undefined;
    effect(
      () => {
        const current = id();
        if (current === watched) return;
        watched = current;
        stop();
        state.set(emptyMapState());
        if (!current) return;
        stop = untracked(() =>
          onSnapshot(doc(this.mapsRef, current), (s) => {
            if (s.exists()) state.set({ ...emptyMapState(), ...(s.data() as Partial<MapState>) });
          }),
        );
      },
      { injector },
    );
    injector.get(DestroyRef).onDestroy(() => stop());
    return state.asReadonly();
  }

  async createMap(name: string): Promise<string> {
    const ref = await addDoc(this.mapsRef, { ...emptyMapState(), name, updatedAt: Date.now() });
    return ref.id;
  }

  async setActive(mapId: string): Promise<void> {
    await setDoc(this.activeRef, { mapId });
  }

  async rename(mapId: string, name: string): Promise<void> {
    await updateDoc(doc(this.mapsRef, mapId), { name, updatedAt: Date.now() });
  }

  /** Copies the scene (same picture, grid, fog and tokens) under a new name. */
  async duplicate(mapId: string, name: string): Promise<string> {
    const snap = await getDoc(doc(this.mapsRef, mapId));
    const data = {
      ...emptyMapState(),
      ...(snap.data() as Partial<MapState>),
      name,
      updatedAt: Date.now(),
    };
    delete data.lastEvent;
    const ref = await addDoc(this.mapsRef, data);
    return ref.id;
  }

  /** Deletes a map; its picture goes too unless another map still uses it. */
  async remove(mapId: string): Promise<void> {
    const all = await getDocs(this.mapsRef);
    const target = all.docs.find((d) => d.id === mapId);
    const imageId = String(target?.data()['imageId'] ?? '');
    await deleteDoc(doc(this.mapsRef, mapId));
    const shared = all.docs.some((d) => d.id !== mapId && d.data()['imageId'] === imageId);
    if (imageId && !shared) await deleteDoc(doc(this.imagesRef, imageId));
  }

  /** One-off read of the active map (for adding tokens from outside the map page). */
  async readActive(): Promise<{ id: string; state: MapState } | null> {
    const active = String((await getDoc(this.activeRef)).data()?.['mapId'] ?? '');
    if (!active) return null;
    const snap = await getDoc(doc(this.mapsRef, active));
    return {
      id: active,
      state: { ...emptyMapState(), ...(snap.data() as Partial<MapState> | undefined) },
    };
  }

  private async migrateLegacy(): Promise<string> {
    const legacy = await getDoc(this.legacyRef);
    if (!legacy.exists()) return '';
    const ref = await addDoc(this.mapsRef, {
      ...emptyMapState(),
      ...(legacy.data() as Partial<MapState>),
      name: 'Mapa 1',
      updatedAt: Date.now(),
    });
    await this.setActive(ref.id);
    await deleteDoc(this.legacyRef);
    return ref.id;
  }

  // ---------- Picture ----------

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

  /** Signal of the current map picture that follows `imageId` changes (dies with the page). */
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

  /** Stores a new picture for a map (fog resets); the old picture is deleted if unused elsewhere. */
  async setImage(mapId: string, dataUrl: string, width: number, height: number): Promise<void> {
    const all = await getDocs(this.mapsRef);
    const previousId = String(all.docs.find((d) => d.id === mapId)?.data()['imageId'] ?? '');
    const ref = await addDoc(this.imagesRef, { image: dataUrl, createdAt: Date.now() });
    await setDoc(
      doc(this.mapsRef, mapId),
      {
        imageId: ref.id,
        width,
        height,
        fog: { enabled: false, revealed: [] },
        updatedAt: Date.now(),
      },
      { merge: true },
    );
    const shared = all.docs.some((d) => d.id !== mapId && d.data()['imageId'] === previousId);
    if (previousId && !shared) await deleteDoc(doc(this.imagesRef, previousId));
  }

  // ---------- Grid, fog, tokens, events ----------

  async setGrid(mapId: string, grid: MapGrid): Promise<void> {
    await setDoc(doc(this.mapsRef, mapId), { grid, updatedAt: Date.now() }, { merge: true });
  }

  async setFog(mapId: string, fog: MapState['fog']): Promise<void> {
    await setDoc(doc(this.mapsRef, mapId), { fog, updatedAt: Date.now() }, { merge: true });
  }

  /** Writes one token through a field path, so edits to different tokens don't clash. */
  async upsertToken(mapId: string, token: MapToken): Promise<void> {
    await setDoc(
      doc(this.mapsRef, mapId),
      { tokens: { [token.id]: token }, updatedAt: Date.now() },
      { merge: true },
    );
  }

  async moveToken(mapId: string, id: string, x: number, y: number): Promise<void> {
    await updateDoc(doc(this.mapsRef, mapId), {
      [`tokens.${id}.x`]: x,
      [`tokens.${id}.y`]: y,
      updatedAt: Date.now(),
    });
  }

  async removeToken(mapId: string, id: string): Promise<void> {
    await updateDoc(doc(this.mapsRef, mapId), {
      [`tokens.${id}`]: deleteField(),
      updatedAt: Date.now(),
    });
  }

  /** Broadcasts a ruler line or attack animation; the TV plays the newest one. */
  async sendEvent(mapId: string, event: MapEvent): Promise<void> {
    await updateDoc(doc(this.mapsRef, mapId), { lastEvent: event });
  }
}
