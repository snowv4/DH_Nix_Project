import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CharacterRepository } from '../firebase/character.repository';
import { FirebaseService } from '../firebase/firebase.service';
import { SessionService } from './session.service';

export const gmGuard: CanActivateFn = async () => {
  const session = inject(SessionService).session();
  const router = inject(Router);
  if (session?.kind !== 'gm') return router.parseUrl('/');
  await inject(FirebaseService).ensureSignedIn();
  return true;
};

/** Players may only open their own sheet; the GM may open any. */
export const sheetGuard: CanActivateFn = async (route) => {
  const session = inject(SessionService).session();
  const router = inject(Router);
  const id = route.paramMap.get('id');
  const allowed =
    session?.kind === 'gm' || (session?.kind === 'player' && session.characterId === id);
  if (!allowed) return router.parseUrl('/');
  await inject(FirebaseService).ensureSignedIn();
  return true;
};

/** The wizard is only for the logged-in player (or the GM) and only while the sheet doesn't exist yet. */
export const creationGuard: CanActivateFn = async (route) => {
  const session = inject(SessionService).session();
  const router = inject(Router);
  const firebase = inject(FirebaseService);
  const characters = inject(CharacterRepository);
  const id = route.paramMap.get('id') ?? '';
  const allowed =
    session?.kind === 'gm' || (session?.kind === 'player' && session.characterId === id);
  if (!allowed) return router.parseUrl('/');
  await firebase.ensureSignedIn();
  return (await characters.exists(id)) ? router.createUrlTree(['/ficha', id]) : true;
};
