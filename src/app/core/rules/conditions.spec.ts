import { CONDITIONS } from '../data/conditions';
import { conditionViews, customMarker, toggleCondition } from './conditions';

describe('conditions', () => {
  it('has unique ids and the three standard SRD conditions', () => {
    expect(new Set(CONDITIONS.map((c) => c.id)).size).toBe(CONDITIONS.length);
    expect(CONDITIONS.filter((c) => c.group === 'standard').map((c) => c.id)).toEqual([
      'hidden',
      'restrained',
      'vulnerable',
    ]);
  });

  it('toggles a condition on and off', () => {
    const on = toggleCondition(undefined, { id: 'vulnerable' });
    expect(on).toEqual([{ id: 'vulnerable' }]);
    expect(toggleCondition(on, { id: 'vulnerable' })).toEqual([]);
  });

  it('builds views for built-in and custom markers and drops unknown ids', () => {
    const fly = customMarker('  Voando ', '🪽', 36)!;
    expect(fly).toEqual({ id: 'custom-10', label: 'Voando', icon: '🪽' });
    const views = conditionViews([{ id: 'stunned' }, fly, { id: 'nope' }]);
    expect(views.map((v) => [v.label, v.custom])).toEqual([
      ['Atordoado', false],
      ['Voando', true],
    ]);
  });

  it('rejects blank custom markers', () => {
    expect(customMarker('   ', '⭐')).toBeUndefined();
  });
});
