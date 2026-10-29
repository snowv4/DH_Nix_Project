import { DOMAIN_CARDS } from '../data/srd';
import { Character } from '../models/character';
import { createEmptyDraft } from '../models/creation';
import { buildCharacter } from './creation';
import {
  applyLevelUp,
  availableAdvancements,
  canLevelUp,
  cardChoices,
  emptyChoices,
  LevelUpChoices,
  levelUpError,
  tierOf,
  undoLastLevel,
} from './leveling';

function rogue(): Character {
  return buildCharacter(
    {
      ...createEmptyDraft('Nix', 0),
      classId: 'rogue',
      subclassId: 'nightwalker',
      ancestry: { mixed: false, primaryId: 'human', secondaryId: '', label: '' },
      communityId: 'slyborne',
      traits: { agility: 2, strength: 1, finesse: 1, instinct: 0, presence: 0, knowledge: -1 },
      primaryWeaponId: 'dagger',
      armorId: 'leather',
      potionId: 'minor-health',
      classItem: 'x',
      experiences: ['Ladra de rua', 'Mãos Rápidas'],
      domainCardIds: ['pick-and-pull', 'deft-deceiver'],
    },
    0,
  );
}

function choices(patch: Partial<LevelUpChoices> = {}): LevelUpChoices {
  return {
    ...emptyChoices(),
    newExperience: { name: 'Telhados', note: '' },
    advancements: [{ id: 'hp' }, { id: 'evasion' }],
    newCardId: 'shadowbind',
    ...patch,
  };
}

describe('tiers and release', () => {
  it('maps levels to tiers', () => {
    expect([1, 2, 4, 5, 7, 8, 10].map(tierOf)).toEqual([1, 2, 2, 3, 3, 4, 4]);
  });

  it('only allows levelling up to the level the GM released', () => {
    const c = rogue();
    expect(canLevelUp(c, 1)).toBe(false);
    expect(canLevelUp(c, 2)).toBe(true);
  });
});

describe('levelUpError', () => {
  it('accepts a valid level 2', () => {
    expect(levelUpError(rogue(), 2, choices())).toBeNull();
  });

  it('requires the tier achievement Experience at level 2', () => {
    expect(levelUpError(rogue(), 2, choices({ newExperience: { name: '', note: '' } }))).toMatch(
      /Experiência/,
    );
  });

  it('requires exactly two advancement points', () => {
    expect(levelUpError(rogue(), 2, choices({ advancements: [{ id: 'hp' }] }))).toMatch(
      /2 avanços/,
    );
  });

  it('respects slot limits per tier', () => {
    expect(
      levelUpError(rogue(), 2, choices({ advancements: [{ id: 'evasion' }, { id: 'evasion' }] })),
    ).toMatch(/espaços/);
    expect(
      levelUpError(rogue(), 2, choices({ advancements: [{ id: 'hp' }, { id: 'hp' }] })),
    ).toBeNull();
  });

  it('only offers Tier 2 options at level 2 (no Proficiency/Multiclass)', () => {
    const ids = availableAdvancements(rogue(), 2).map((a) => a.option.id);
    expect(ids).toEqual(['traits', 'hp', 'stress', 'experiences', 'domainCard', 'evasion']);
  });

  it('checks cards against level and class domains', () => {
    expect(levelUpError(rogue(), 2, choices({ newCardId: 'veil-of-night' }))).toMatch(
      /Carta inválida/,
    ); // level 3
    expect(levelUpError(rogue(), 2, choices({ newCardId: 'cinder-grasp' }))).toMatch(
      /Carta inválida/,
    ); // Arcana
    expect(cardChoices(rogue(), 2, DOMAIN_CARDS).every((c) => c.level <= 2)).toBe(true);
  });

  it('needs two different unmarked traits', () => {
    const traits = choices({
      advancements: [{ id: 'traits', traits: ['agility', 'agility'] }, { id: 'hp' }],
    });
    expect(levelUpError(rogue(), 2, traits)).toMatch(/diferentes/);
  });
});

describe('applyLevelUp / undoLastLevel', () => {
  it('applies the tier achievement, advancements, thresholds and new card', () => {
    const c = rogue();
    const patch = applyLevelUp(
      c,
      2,
      choices({ advancements: [{ id: 'traits', traits: ['finesse', 'presence'] }, { id: 'hp' }] }),
      0,
    );
    expect(patch.level).toBe(2);
    expect(patch.proficiency).toBe(2);
    expect(patch.experiences?.at(-1)).toEqual({ name: 'Telhados', bonus: 2, note: '' });
    expect(patch.traits?.finesse).toBe(2);
    expect(patch.markedTraits).toEqual(['finesse', 'presence']);
    expect(patch.hp?.max).toBe(c.hp.max + 1);
    expect(patch.thresholds).toEqual({
      major: c.thresholds.major + 1,
      severe: c.thresholds.severe + 1,
    });
    expect(patch.cards?.map((o) => o.id)).toContain('shadowbind');
    expect(patch.levelHistory?.[0].advancements).toEqual(['traits', 'hp']);
  });

  it('counts used slots across levels of the same tier', () => {
    const c = {
      ...rogue(),
      ...applyLevelUp(rogue(), 2, choices({ advancements: [{ id: 'evasion' }, { id: 'hp' }] }), 0),
    };
    const evasion = availableAdvancements(c, 3).find((a) => a.option.id === 'evasion');
    expect(evasion?.used).toBe(1);
    expect(
      levelUpError(
        c,
        3,
        choices({ advancements: [{ id: 'evasion' }, { id: 'stress' }], newCardId: 'chokehold' }),
      ),
    ).toMatch(/espaços/);
  });

  it('undoes the last level exactly', () => {
    const c = rogue();
    const leveled = { ...c, ...applyLevelUp(c, 2, choices(), 0) };
    const undone = { ...leveled, ...undoLastLevel(leveled) };
    expect(undone.level).toBe(1);
    expect(undone.hp).toEqual(c.hp);
    expect(undone.evasion).toBe(c.evasion);
    expect(undone.cards).toEqual(c.cards);
    expect(undone.levelHistory).toEqual([]);
  });
});
