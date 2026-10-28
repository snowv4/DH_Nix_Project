import { characterIdFromName, createBlankCharacter, toggleSlot } from './character';

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
