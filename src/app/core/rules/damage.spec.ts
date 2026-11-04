import { applyDamage, reduceSeverity, resolveDamage, severityFromDamage } from './damage';

const t = { major: 7, severe: 14 };
const base = {
  thresholds: t,
  resistance: 'none' as const,
  direct: false,
  useArmor: false,
  armorSlotsLeft: 3,
};

describe('damage', () => {
  it('maps damage to severity by thresholds', () => {
    expect(severityFromDamage(0, t)).toBe('none');
    expect(severityFromDamage(6, t)).toBe('minor');
    expect(severityFromDamage(7, t)).toBe('major');
    expect(severityFromDamage(14, t)).toBe('severe');
    expect(severityFromDamage(28, t)).toBe('severe');
    expect(severityFromDamage(28, t, true)).toBe('massive');
    expect(severityFromDamage(3, { major: 0, severe: 0 })).toBe('minor');
  });

  it('armor drops one threshold, down to nothing', () => {
    expect(reduceSeverity('severe')).toBe('major');
    expect(reduceSeverity('minor')).toBe('none');
    expect(resolveDamage({ ...base, amount: 9, useArmor: true })).toEqual({
      base: 'major',
      final: 'minor',
      hp: 1,
      armorUsed: true,
    });
  });

  it('direct damage and empty armor ignore the armor choice', () => {
    expect(resolveDamage({ ...base, amount: 9, useArmor: true, direct: true }).hp).toBe(2);
    expect(resolveDamage({ ...base, amount: 9, useArmor: true, armorSlotsLeft: 0 }).armorUsed).toBe(
      false,
    );
  });

  it('resistance halves before thresholds; immunity ignores', () => {
    expect(resolveDamage({ ...base, amount: 15, resistance: 'resistant' }).final).toBe('major');
    expect(resolveDamage({ ...base, amount: 30, resistance: 'immune' }).hp).toBe(0);
  });

  it('accepts a severity decided at the table', () => {
    expect(resolveDamage({ ...base, severity: 'severe', useArmor: true }).hp).toBe(2);
  });

  it('marks HP without passing the max', () => {
    expect(applyDamage({ max: 6, marked: 5 }, 3)).toEqual({ max: 6, marked: 6 });
  });
});
