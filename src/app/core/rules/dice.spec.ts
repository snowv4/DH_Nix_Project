import { cryptoDie, DieRoller, dualityEffects, outcomeLabel, rollDuality } from './dice';

function fixed(...values: number[]): DieRoller {
  let i = 0;
  return () => values[i++];
}

describe('rollDuality', () => {
  it('sums both dice and the modifier', () => {
    const r = rollDuality({ modifier: 2, advantage: 'none' }, fixed(9, 4));
    expect(r.total).toBe(15);
    expect(r.outcome).toBe('hope');
  });

  it('is with fear when the fear die is higher', () => {
    expect(rollDuality({ modifier: 0, advantage: 'none' }, fixed(3, 8)).outcome).toBe('fear');
  });

  it('is a critical success on matching dice, even below the difficulty', () => {
    const r = rollDuality({ modifier: -1, advantage: 'none', difficulty: 20 }, fixed(2, 2));
    expect(r.outcome).toBe('critical');
    expect(r.success).toBe(true);
  });

  it('adds a d6 on advantage and subtracts it on disadvantage', () => {
    expect(rollDuality({ modifier: 0, advantage: 'advantage' }, fixed(5, 6, 4)).total).toBe(15);
    expect(rollDuality({ modifier: 0, advantage: 'disadvantage' }, fixed(5, 6, 4)).total).toBe(7);
  });

  it('compares against the difficulty', () => {
    expect(
      rollDuality({ modifier: 0, advantage: 'none', difficulty: 12 }, fixed(7, 5)).success,
    ).toBe(true);
    expect(
      rollDuality({ modifier: 0, advantage: 'none', difficulty: 13 }, fixed(7, 5)).success,
    ).toBe(false);
  });
});

describe('dualityEffects', () => {
  it('maps outcomes to resource changes', () => {
    expect(dualityEffects('hope')).toEqual({ hopeGained: 1, stressCleared: 0, fearGained: 0 });
    expect(dualityEffects('fear')).toEqual({ hopeGained: 0, stressCleared: 0, fearGained: 1 });
    expect(dualityEffects('critical')).toEqual({ hopeGained: 1, stressCleared: 1, fearGained: 0 });
  });
});

describe('outcomeLabel', () => {
  it('describes the result in pt-BR', () => {
    expect(
      outcomeLabel(rollDuality({ modifier: 0, advantage: 'none', difficulty: 5 }, fixed(9, 4))),
    ).toBe('Sucesso com Esperança');
    expect(outcomeLabel(rollDuality({ modifier: 0, advantage: 'none' }, fixed(1, 4)))).toBe(
      'Rolou com Medo',
    );
  });
});

describe('cryptoDie', () => {
  it('stays within bounds', () => {
    for (let i = 0; i < 500; i++) {
      const v = cryptoDie(12);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(12);
    }
  });
});
