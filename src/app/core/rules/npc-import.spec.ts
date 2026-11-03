import { describe, expect, it } from 'vitest';
import { TIER1_ADVERSARIES } from '../data/srd/adversaries-tier1';
import { TOKEN_ICON_BY_ID } from '../data/token-icons';
import { ADVERSARY_TYPES } from '../data/srd/adversaries';
import { npcFromAdversary, searchAdversaries } from './npc-import';

const byId = (id: string) => TIER1_ADVERSARIES.find((a) => a.id === id)!;

describe('tier 1 adversary catalog', () => {
  it('has unique ids, known types and existing icons', () => {
    const ids = new Set(TIER1_ADVERSARIES.map((a) => a.id));
    expect(ids.size).toBe(TIER1_ADVERSARIES.length);
    const types = new Set<string>(ADVERSARY_TYPES.map((t) => t.id));
    for (const a of TIER1_ADVERSARIES) {
      expect(types.has(a.type), a.id).toBe(true);
      expect(TOKEN_ICON_BY_ID.has(a.icon), a.id).toBe(true);
      expect(a.features.length, a.id).toBeGreaterThan(0);
    }
  });

  it('keeps the SRD numbers (spot check: Bear, Giant Rat)', () => {
    const bear = byId('bear');
    expect([
      bear.difficulty,
      bear.thresholds.major,
      bear.thresholds.severe,
      bear.hp,
      bear.stress,
    ]).toEqual([14, 9, 17, 7, 2]);
    expect(bear.attack).toMatchObject({ modifier: 1, range: 'melee', damage: '1d8+3 fís' });
    const rat = byId('giant-rat');
    expect(rat.type).toBe('minion');
    expect(rat.thresholds).toEqual({ major: null, severe: null });
  });
});

describe('npcFromAdversary', () => {
  it('copies the stat block into a fresh NPC', () => {
    const npc = npcFromAdversary(byId('bear'), 'n1', 5);
    expect(npc).toMatchObject({
      id: 'n1',
      name: 'Urso',
      type: 'bruiser',
      difficulty: 14,
      thresholds: { major: 9, severe: 17 },
      hp: { max: 7, marked: 0 },
      stress: { max: 2, marked: 0 },
      icon: 'bear-head',
      updatedAt: 5,
    });
  });

  it('stores missing thresholds as 0 and notes the horde size', () => {
    expect(npcFromAdversary(byId('giant-rat'), 'r', 0).thresholds).toEqual({ major: 0, severe: 0 });
    const horde = npcFromAdversary(byId('zombie-pack'), 'z', 0);
    expect(horde.features.split('\n')[0]).toMatch(/^Horda \(\d+\/PV\)$/);
    expect(horde.tags).toContain('horda');
  });
});

describe('searchAdversaries', () => {
  it('matches pt-BR and English names without accents, and filters by type', () => {
    expect(searchAdversaries(TIER1_ADVERSARIES, 'escorpiao').map((a) => a.id)).toEqual([
      'giant-scorpion',
    ]);
    expect(searchAdversaries(TIER1_ADVERSARIES, 'ooze').length).toBe(4);
    expect(searchAdversaries(TIER1_ADVERSARIES, '', 'solo').every((a) => a.type === 'solo')).toBe(
      true,
    );
  });
});
