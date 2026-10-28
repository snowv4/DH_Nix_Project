import { firebase } from './firebase-config';

// `ng serve` talks to the local Firebase Emulator Suite, never to production.
export const environment = {
  useEmulators: true,
  firebase,
};
