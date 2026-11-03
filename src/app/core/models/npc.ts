import { Tracked } from './character';

/** GM-only NPC / adversary sheet: `campaigns/nix/npcs/{id}` (kept apart from the players). */
export interface Npc {
  id: string;
  name: string;
  /** Adversary type id (ADVERSARY_TYPES) or '' for a non-combat NPC. */
  type: string;
  tier: number;
  difficulty: number;
  thresholds: { major: number; severe: number };
  hp: Tracked;
  stress: Tracked;
  attack: { modifier: number; name: string; range: string; damage: string };
  experiences: string;
  features: string;
  description: string;
  motives: string;
  notes: string;
  portraitUrl: string;
  /** Free tags for quick filtering ("aliado", "vila", "chefe"…). */
  tags: string;
  updatedAt: number;
}

export function createNpc(id: string, name: string, now = Date.now()): Npc {
  return {
    id,
    name,
    type: 'standard',
    tier: 1,
    difficulty: 11,
    thresholds: { major: 7, severe: 12 },
    hp: { max: 0, marked: 0 },
    stress: { max: 0, marked: 0 },
    attack: { modifier: 1, name: '', range: 'melee', damage: '' },
    experiences: '',
    features: '',
    description: '',
    motives: '',
    notes: '',
    portraitUrl: '',
    tags: '',
    updatedAt: now,
  };
}
