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
  /** Player reminder of when to use it. */
  note?: string;
}

/** A domain card from the SRD data the character owns; `active` = in the loadout (max 5). */
export interface OwnedCard {
  id: string;
  active: boolean;
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
  /** Free-text card notes (kept for manual sheets and cards not in the SRD data yet). */
  domainCards: { loadout: string; vault: string };
  cards?: OwnedCard[];
  /** Traits raised by the "two unmarked traits" advancement; cleared at levels 5 and 8. */
  markedTraits?: TraitId[];
  /** Martial Artist stances known (ids from TIER1/TIER2 stance lists). */
  stances?: string[];
  /** Brawler Combo Die (d4 at level 1). */
  comboDie?: string;
  levelHistory?: LevelRecord[];
  features: string;
  appearance: string;
  background: string;
  connections: string;
  notes: string;
  updatedAt: number;
}

/** One applied level-up: what was chosen and the fields as they were before, for undo. */
export interface LevelRecord {
  level: number;
  /** Advancement ids taken (Proficiency/Multiclass appear once but cost two). */
  advancements: string[];
  summary: string[];
  before: Partial<Omit<Character, 'id' | 'levelHistory'>>;
  appliedAt: number;
}

/** Fields the sheet may change through a partial update. */
export type CharacterPatch = Partial<Omit<Character, 'id'>>;
