import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { Auth, connectAuthEmulator, getAuth, signInAnonymously } from 'firebase/auth';
import {
  connectFirestoreEmulator,
  Firestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { environment } from '../../../environments/environment';

/** Single place that boots Firebase; the rest of the app only talks to repositories. */
@Injectable({ providedIn: 'root' })
export class FirebaseService {
  private readonly app = initializeApp(environment.firebase);
  readonly auth: Auth = getAuth(this.app);
  // Local cache keeps the sheet usable if the phone briefly loses signal.
  readonly db: Firestore = initializeFirestore(this.app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });

  constructor() {
    if (environment.useEmulators) {
      connectAuthEmulator(this.auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      connectFirestoreEmulator(this.db, '127.0.0.1', 8080);
    }
  }

  async ensureSignedIn(): Promise<void> {
    await this.auth.authStateReady();
    if (!this.auth.currentUser) await signInAnonymously(this.auth);
  }
}
