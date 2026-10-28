export const TRAIT_IDS = [
  'agility',
  'strength',
  'finesse',
  'instinct',
  'presence',
  'knowledge',
] as const;
export type TraitId = (typeof TRAIT_IDS)[number];
export type Traits = Record<TraitId, number>;

export interface Tracked {
  max: number;
  marked: number;
}

export interface Experience {
  name: string;
  bonus: number;
}

export interface Gold {
  handfuls: number;
  bags: number;
  chests: number;
}

export interface Character {
  id: string;
  status: 'draft' | 'active' | 'retired';
  name: string;
  pronouns: string;
  portraitUrl: string;
  level: number;
  classId: string;
  subclass: string;
  ancestry: string;
  community: string;
  traits: Traits;
  evasion: number;
  proficiency: number;
  hp: Tracked;
  stress: Tracked;
  hope: { max: number; current: number };
  armor: { name: string; score: number; slotsMarked: number };
  thresholds: { major: number; severe: number };
  experiences: Experience[];
  primaryWeapon: string;
  secondaryWeapon: string;
  items: string;
  gold: Gold;
  domainCards: { loadout: string; vault: string };
  features: string;
  appearance: string;
  background: string;
  connections: string;
  notes: string;
  updatedAt: number;
}

/** Fields the sheet may change through a partial update. */
export type CharacterPatch = Partial<Omit<Character, 'id'>>;
