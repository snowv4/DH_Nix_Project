import { TraitId } from '../../models/character';

/**
 * Game content transcribed from the Daggerheart SRD 2.0 and translated to pt-BR.
 * `nameEn` keeps the original term so players can cross-check with the book.
 */
export interface Feature {
  name: string;
  nameEn: string;
  text: string;
}

export type DomainId =
  | 'arcana'
  | 'blade'
  | 'bone'
  | 'codex'
  | 'dread'
  | 'grace'
  | 'midnight'
  | 'sage'
  | 'splendor'
  | 'valor';

export interface DomainData {
  id: DomainId;
  name: string;
  nameEn: string;
  summary: string;
}

/** Flat bonuses applied when building the character (spec 3.4). */
export interface StatMods {
  hp?: number;
  stress?: number;
  evasion?: number;
  armorScore?: number;
  /** Added to both Major and Severe thresholds. */
  thresholds?: number;
  severe?: number;
  /** Galapa "Shell": thresholds + Proficiency. */
  thresholdsPlusProficiency?: boolean;
  /** Mage Robes "Enchanted": thresholds + Spellcast trait value. */
  thresholdsPlusSpellcast?: boolean;
  traits?: Partial<Record<TraitId, number>>;
}

export interface SubclassData {
  id: string;
  name: string;
  nameEn: string;
  pitch: string;
  spellcastTrait?: TraitId;
  foundation: Feature[];
  mods?: StatMods;
  /** School of Knowledge "Prepared": one extra level-1 domain card at creation. */
  extraDomainCards?: number;
}

export type ClassChoiceKind = 'element' | 'patron' | 'stances' | 'companion' | 'strangePatterns';

export interface ClassData {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  domains: [DomainId, DomainId];
  evasion: number;
  hp: number;
  /** "Choose one" starting class items. */
  items: [string, string];
  hopeFeature: Feature;
  features: Feature[];
  subclasses: [SubclassData, SubclassData];
  backgroundQuestions: string[];
  connectionQuestions: string[];
  /** Extra decisions the class (or one of its subclasses) asks for at creation. */
  choices?: { kind: ClassChoiceKind; subclassId?: string }[];
}

export interface AncestryData {
  id: string;
  name: string;
  nameEn: string;
  summary: string;
  /** [top feature, bottom feature] — mixed ancestry takes the top of one and the bottom of another. */
  features: [Feature, Feature];
  mods?: [StatMods?, StatMods?];
}

export interface CommunityData {
  id: string;
  name: string;
  nameEn: string;
  summary: string;
  adjectives: string[];
  feature: Feature;
}

export type CardType = 'spell' | 'ability' | 'grimoire';

export interface DomainCard {
  id: string;
  name: string;
  nameEn: string;
  domain: DomainId;
  level: number;
  type: CardType;
  recallCost: number;
  text: string;
}

export type Range = 'melee' | 'veryClose' | 'close' | 'far' | 'veryFar';

export interface Weapon {
  id: string;
  name: string;
  nameEn: string;
  category: 'primary' | 'secondary';
  /** 'spellcast' = uses the subclass Spellcast trait (Arcane-Frame Wheelchair). */
  trait: TraitId | 'spellcast';
  range: Range;
  damage: string;
  damageType: 'phy' | 'mag' | 'phy/mag';
  hands: 1 | 2;
  feature?: Feature;
  mods?: StatMods;
}

export interface Armor {
  id: string;
  name: string;
  nameEn: string;
  thresholds: [number, number];
  score: number;
  feature?: Feature;
  mods?: StatMods;
}
