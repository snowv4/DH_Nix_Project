import { TraitId } from './character';

/** Pseudo primary weapon from the Brawler's "I Am the Weapon" feature. */
export const BRAWLER_STRIKE_ID = 'brawler-strike';

export interface ClassChoices {
  element: string;
  patronName: string;
  patronSphere: string;
  stances: string[];
  companionName: string;
  companionAnimal: string;
  companionExperiences: [string, string];
  companionDamageType: 'phy' | 'mag';
  strangeNumber: number;
}

/**
 * Work-in-progress character from the creation wizard, saved as `campaigns/nix/drafts/{id}`.
 * Every field has a value (no `undefined`) because Firestore rejects undefined.
 */
export interface CreationDraft {
  name: string;
  classId: string;
  subclassId: string;
  /** Mixed ancestry: first (top) feature from `primaryId`, second (bottom) from `secondaryId`. */
  ancestry: { mixed: boolean; primaryId: string; secondaryId: string; label: string };
  communityId: string;
  traits: Partial<Record<TraitId, number>>;
  primaryWeaponId: string;
  secondaryWeaponId: string;
  armorId: string;
  potionId: string;
  classItem: string;
  experiences: [string, string];
  /** Optional reminders of when to use each Experience (missing on older drafts). */
  experienceNotes?: [string, string];
  /** Clank "Purposeful Design": index of the Experience that gets +1, or -1. */
  clankBonusIndex: number;
  domainCardIds: string[];
  pronouns: string;
  appearance: string;
  backgroundAnswers: string[];
  connectionAnswers: string[];
  connectionNotes: string;
  classChoices: ClassChoices;
  updatedAt: number;
}

export function createEmptyDraft(name: string, now = Date.now()): CreationDraft {
  return {
    name: name.trim(),
    classId: '',
    subclassId: '',
    ancestry: { mixed: false, primaryId: '', secondaryId: '', label: '' },
    communityId: '',
    traits: {},
    primaryWeaponId: '',
    secondaryWeaponId: '',
    armorId: '',
    potionId: '',
    classItem: '',
    experiences: ['', ''],
    experienceNotes: ['', ''],
    clankBonusIndex: -1,
    domainCardIds: [],
    pronouns: '',
    appearance: '',
    backgroundAnswers: [],
    connectionAnswers: [],
    connectionNotes: '',
    classChoices: {
      element: '',
      patronName: '',
      patronSphere: '',
      stances: [],
      companionName: '',
      companionAnimal: '',
      companionExperiences: ['', ''],
      companionDamageType: 'phy',
      strangeNumber: 0,
    },
    updatedAt: now,
  };
}
