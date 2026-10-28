import { Character, Tracked } from '../models/character';

/** Turns a typed character name into a stable document id ("Kotinho Ávila" -> "kotinho-avila"). */
export function characterIdFromName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Tapping slot `index` (0-based): marks up to it, or unmarks it if it is the last marked slot. */
export function toggleSlot(track: Tracked, index: number): Tracked {
  const target = index + 1 === track.marked ? index : index + 1;
  return { ...track, marked: clamp(target, 0, track.max) };
}

export function createBlankCharacter(name: string, now = Date.now()): Character {
  return {
    id: characterIdFromName(name),
    status: 'active',
    name: name.trim(),
    pronouns: '',
    portraitUrl: '',
    level: 1,
    classId: '',
    subclass: '',
    ancestry: '',
    community: '',
    traits: { agility: 0, strength: 0, finesse: 0, instinct: 0, presence: 0, knowledge: 0 },
    // TODO(regra): conferir valores iniciais (spec seção 3.4); Evasão/PV dependem da classe.
    evasion: 10,
    proficiency: 1,
    hp: { max: 6, marked: 0 },
    stress: { max: 6, marked: 0 },
    hope: { max: 6, current: 2 },
    armor: { name: '', score: 0, slotsMarked: 0 },
    thresholds: { major: 0, severe: 0 },
    experiences: [
      { name: '', bonus: 2 },
      { name: '', bonus: 2 },
    ],
    primaryWeapon: '',
    secondaryWeapon: '',
    items: '',
    gold: { handfuls: 1, bags: 0, chests: 0 },
    domainCards: { loadout: '', vault: '' },
    features: '',
    appearance: '',
    background: '',
    connections: '',
    notes: '',
    updatedAt: now,
  };
}
