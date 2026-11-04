import {
  characterIdFromName,
  createBlankCharacter,
  remainingTapIndex,
  toggleSlot,
} from './character';

describe('characterIdFromName', () => {
  it('normalizes accents, case and spaces', () => {
    expect(characterIdFromName('  Kotinho Ávila ')).toBe('kotinho-avila');
  });
});

describe('toggleSlot', () => {
  it('marks up to the tapped slot', () => {
    expect(toggleSlot({ max: 6, marked: 1 }, 3).marked).toBe(4);
  });

  it('unmarks the last marked slot when tapped again', () => {
    expect(toggleSlot({ max: 6, marked: 4 }, 3).marked).toBe(3);
  });
});

describe('createBlankCharacter', () => {
  it('uses the name as id', () => {
    const c = createBlankCharacter('Nix', 0);
    expect(c.id).toBe('nix');
    expect(c.hope.current).toBe(2);
  });
});

describe('remainingTapIndex', () => {
  const tapRemaining = (marked: number, max: number, i: number) =>
    toggleSlot({ marked, max }, remainingTapIndex(marked, max, i)).marked;

  it('tapping the 5th box of a full 6/6 track leaves 5 (marks 1)', () => {
    expect(tapRemaining(0, 6, 4)).toBe(1);
  });
  it('tapping the last remaining box removes it', () => {
    expect(tapRemaining(1, 6, 4)).toBe(2);
  });
  it('tapping a lower box drops to that many remaining', () => {
    expect(tapRemaining(0, 6, 1)).toBe(4);
  });
  it('tapping a box above the remaining ones heals back up to it', () => {
    expect(tapRemaining(4, 6, 5)).toBe(0);
  });
  it('can empty the track', () => {
    expect(tapRemaining(5, 6, 0)).toBe(6);
  });
});
