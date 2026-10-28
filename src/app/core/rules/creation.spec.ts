import { createEmptyDraft, CreationDraft, BRAWLER_STRIKE_ID } from '../models/creation';
import { DOMAIN_CARDS } from '../data/srd';
import {
  assignTrait,
  availableCards,
  buildCharacter,
  deriveStats,
  domainCardLimit,
  firstIncompleteStep,
  remainingTraitValues,
  stepError,
  toggleCard,
  validateTraitAssignment,
  weaponLoadoutError,
} from './creation';

const goodTraits = { agility: 2, strength: 1, finesse: 1, instinct: 0, presence: 0, knowledge: -1 };

function draft(patch: Partial<CreationDraft> = {}): CreationDraft {
  return { ...createEmptyDraft('Nix', 0), ...patch };
}

function rogue(patch: Partial<CreationDraft> = {}): CreationDraft {
  return draft({
    classId: 'rogue',
    subclassId: 'nightwalker',
    ancestry: { mixed: false, primaryId: 'human', secondaryId: '', label: '' },
    communityId: 'slyborne',
    traits: goodTraits,
    primaryWeaponId: 'dagger',
    secondaryWeaponId: 'small-dagger',
    armorId: 'leather',
    potionId: 'minor-health',
    classItem: 'Um gancho de escalada',
    experiences: ['Ladra de rua', 'Mãos Rápidas'],
    domainCardIds: ['pick-and-pull', 'deft-deceiver'],
    ...patch,
  });
}

describe('trait assignment', () => {
  it('accepts exactly +2, +1, +1, +0, +0, −1', () => {
    expect(validateTraitAssignment(goodTraits)).toBe(true);
    expect(validateTraitAssignment({ ...goodTraits, knowledge: 0 })).toBe(false);
    expect(validateTraitAssignment({ agility: 2 })).toBe(false);
  });

  it('tracks remaining values including duplicates', () => {
    expect(remainingTraitValues({ agility: 1 }).sort()).toEqual([-1, 0, 0, 1, 2].sort());
  });

  it('moves a value from another trait when it is used up', () => {
    const t = assignTrait({ agility: 2 }, 'strength', 2);
    expect(t).toEqual({ strength: 2 });
  });
});

describe('weapons', () => {
  it('blocks a secondary with a two-handed primary', () => {
    expect(
      weaponLoadoutError(
        rogue({ primaryWeaponId: 'longsword', secondaryWeaponId: 'small-dagger' }),
      ),
    ).toMatch(/duas mãos/);
  });

  it('lets warriors ignore burden', () => {
    expect(
      weaponLoadoutError(
        rogue({
          classId: 'warrior',
          subclassId: 'call-of-the-brave',
          primaryWeaponId: 'longsword',
          secondaryWeaponId: 'round-shield',
        }),
      ),
    ).toBeNull();
  });

  it('requires a Spellcast trait for magic weapons', () => {
    const brawler = rogue({
      classId: 'brawler',
      subclassId: 'juggernaut',
      primaryWeaponId: 'wand',
      secondaryWeaponId: '',
    });
    expect(weaponLoadoutError(brawler)).toMatch(/Conjuração/);
    expect(
      weaponLoadoutError(rogue({ primaryWeaponId: 'wand', secondaryWeaponId: '' })),
    ).toBeNull();
  });

  it('allows the Brawler Strike only alone', () => {
    const b = rogue({
      classId: 'brawler',
      subclassId: 'juggernaut',
      primaryWeaponId: BRAWLER_STRIKE_ID,
      secondaryWeaponId: '',
    });
    expect(weaponLoadoutError(b)).toBeNull();
    expect(weaponLoadoutError({ ...b, secondaryWeaponId: 'round-shield' })).not.toBeNull();
  });
});

describe('deriveStats', () => {
  it('uses class Evasion/HP, 6 Stress, 2 Hope and armor + level thresholds', () => {
    const s = deriveStats(
      rogue({ ancestry: { mixed: false, primaryId: 'elf', secondaryId: '', label: '' } }),
    );
    expect(s.evasion).toBe(12);
    expect(s.hp).toBe(6);
    expect(s.stress).toBe(6);
    expect(s.hope).toBe(2);
    expect(s.armorScore).toBe(3);
    expect([s.major, s.severe]).toEqual([7, 14]);
  });

  it('applies ancestry, subclass and equipment bonuses', () => {
    const s = deriveStats(
      rogue({
        classId: 'guardian',
        subclassId: 'stalwart',
        ancestry: { mixed: false, primaryId: 'human', secondaryId: '', label: '' },
        primaryWeaponId: 'mace',
        secondaryWeaponId: 'tower-shield',
        armorId: 'full-plate',
      }),
    );
    expect(s.stress).toBe(7); // Human
    expect(s.evasion).toBe(9 - 2 - 1); // Full Plate, Tower Shield
    expect(s.armorScore).toBe(4 + 2);
    expect([s.major, s.severe]).toEqual([8 + 1 + 1, 17 + 1 + 1]); // + level + Unwavering
    expect(s.traits.agility).toBe(1); // Full Plate −1
  });

  it('uses the top feature of the first ancestry and the bottom of the second when mixed', () => {
    const s = deriveStats(
      rogue({ ancestry: { mixed: true, primaryId: 'giant', secondaryId: 'simiah', label: '' } }),
    );
    expect(s.hp).toBe(7); // Giant Endurance (top)
    expect(s.evasion).toBe(13); // Simiah Nimble (bottom)
  });

  it('handles unarmored and Bare Bones', () => {
    expect(deriveStats(rogue({ armorId: '' }))).toMatchObject({
      armorScore: 0,
      major: 1,
      severe: 2,
    });
    const bare = deriveStats(
      rogue({
        classId: 'guardian',
        subclassId: 'vengeance',
        armorId: '',
        domainCardIds: ['bare-bones', 'get-back-up'],
      }),
    );
    expect(bare).toMatchObject({ armorScore: 3 + 1, major: 10, severe: 20 });
  });
});

describe('domain cards', () => {
  it('offers only level-1 cards from the class domains', () => {
    const cards = availableCards(rogue(), DOMAIN_CARDS);
    expect(cards.length).toBe(6);
    expect(cards.every((c) => c.domain === 'midnight' || c.domain === 'grace')).toBe(true);
  });

  it('gives School of Knowledge a third card', () => {
    expect(domainCardLimit(rogue({ classId: 'wizard', subclassId: 'school-of-knowledge' }))).toBe(
      3,
    );
  });

  it('drops the oldest pick when the hand is full', () => {
    expect(toggleCard(rogue(), 'rain-of-blades')).toEqual(['deft-deceiver', 'rain-of-blades']);
  });
});

describe('steps', () => {
  it('walks to the first incomplete step', () => {
    expect(firstIncompleteStep(draft())).toBe('class');
    expect(firstIncompleteStep(rogue())).toBe('review');
  });

  it('asks class-specific choices', () => {
    const d = rogue({ classId: 'sorcerer', subclassId: 'elemental-origin' });
    expect(stepError('subclass', d)).toMatch(/elemento/);
  });
});

describe('buildCharacter', () => {
  it('produces a playable sheet', () => {
    const c = buildCharacter(rogue(), 0);
    expect(c.id).toBe('nix');
    expect(c.subclass).toBe('Andarilho Noturno');
    expect(c.hp).toEqual({ max: 6, marked: 0 });
    expect(c.stress.max).toBe(7);
    expect(c.experiences).toEqual([
      { name: 'Ladra de rua', bonus: 2 },
      { name: 'Mãos Rápidas', bonus: 2 },
    ]);
    expect(c.features).toContain('Passo Sombrio');
    expect(c.domainCards.loadout).toContain('Abrir e Surrupiar');
    expect(c.items).toContain('Poção de Vida Menor');
  });

  it('gives Clank +1 to the chosen Experience', () => {
    const c = buildCharacter(
      rogue({
        ancestry: { mixed: false, primaryId: 'clank', secondaryId: '', label: '' },
        clankBonusIndex: 1,
      }),
      0,
    );
    expect(c.experiences[1].bonus).toBe(3);
  });
});
