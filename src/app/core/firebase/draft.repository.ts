import { inject, Injectable } from '@angular/core';
import { collection, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { CreationDraft } from '../models/creation';
import { CAMPAIGN_ID } from './campaign.repository';
import { FirebaseService } from './firebase.service';

/** Creation-wizard drafts, one per character id, so players can stop and resume later. */
@Injectable({ providedIn: 'root' })
export class DraftRepository {
  private readonly db = inject(FirebaseService).db;
  private readonly draftsRef = collection(this.db, 'campaigns', CAMPAIGN_ID, 'drafts');

  async load(id: string): Promise<CreationDraft | null> {
    const snap = await getDoc(doc(this.draftsRef, id));
    return snap.exists() ? (snap.data() as CreationDraft) : null;
  }

  async exists(id: string): Promise<boolean> {
    return (await getDoc(doc(this.draftsRef, id))).exists();
  }

  async save(id: string, draft: CreationDraft): Promise<void> {
    await setDoc(doc(this.draftsRef, id), { ...draft, updatedAt: Date.now() });
  }

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(this.draftsRef, id));
  }
}
