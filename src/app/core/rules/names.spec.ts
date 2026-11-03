import { NAME_STYLES, randomName, RandomIndex } from './names';

function sequence(...values: number[]): RandomIndex {
  let i = 0;
  return (n) => values[i++ % values.length] % n;
}

describe('randomName', () => {
  it('builds start + middle + end and a surname', () => {
    // dwarf: start[0]=Bal, middle[0]='', end[0]=in; roll 0 → surname Pedra + -Fria
    expect(randomName('dwarf', sequence(0, 0, 0, 0, 0, 0))).toBe('Balin Pedra-Fria');
  });

  it('can add an epithet or stay a single name', () => {
    expect(randomName('orc', sequence(0, 0, 0, 6, 0))).toBe('Gromash o Ruivo');
    expect(randomName('orc', sequence(0, 0, 0, 9))).toBe('Gromash');
  });

  it('always returns something for every style', () => {
    for (const s of NAME_STYLES) expect(randomName(s.id).length).toBeGreaterThan(2);
  });
});
