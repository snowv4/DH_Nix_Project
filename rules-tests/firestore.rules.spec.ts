import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-dh-nix-rules',
    firestore: {
      rules: readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(() => env.cleanup());
beforeEach(() => env.clearFirestore());

describe('firestore.rules', () => {
  const paths = [
    'campaigns/nix',
    'campaigns/nix/characters/kote',
    'campaigns/nix/drafts/lyra',
    'campaigns/nix/cardArt/book-of-ava',
  ];

  for (const path of paths) {
    it(`signed-in visitors can read and write ${path}`, async () => {
      const db = env.authenticatedContext('anon-uid').firestore();
      await assertSucceeds(setDoc(doc(db, path), { name: 'x' }));
      await assertSucceeds(getDoc(doc(db, path)));
    });

    it(`unauthenticated requests are denied on ${path}`, async () => {
      const db = env.unauthenticatedContext().firestore();
      await assertFails(setDoc(doc(db, path), { name: 'x' }));
      await assertFails(getDoc(doc(db, path)));
    });
  }

  it('lets signed-in visitors delete a sheet, but not anonymous requests', async () => {
    await env.withSecurityRulesDisabled((ctx) =>
      setDoc(doc(ctx.firestore(), 'campaigns/nix/characters/teste'), { name: 'Teste' }),
    );
    await assertFails(
      deleteDoc(doc(env.unauthenticatedContext().firestore(), 'campaigns/nix/characters/teste')),
    );
    await assertSucceeds(
      deleteDoc(
        doc(env.authenticatedContext('anon-uid').firestore(), 'campaigns/nix/characters/teste'),
      ),
    );
  });

  it('denies everything outside campaigns', async () => {
    const db = env.authenticatedContext('anon-uid').firestore();
    await assertFails(setDoc(doc(db, 'other/doc'), { a: 1 }));
  });
});
