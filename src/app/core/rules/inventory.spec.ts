import { itemsFromText, moveItem, parseItemLine, useItem } from './inventory';

describe('inventory', () => {
  it('parses quantity, name and a note in parentheses', () => {
    expect(parseItemLine('Poção de Vida Menor (Limpa 1d4 PV.)', 'a')).toEqual({
      id: 'a',
      name: 'Poção de Vida Menor',
      qty: 1,
      category: 'consumable',
      note: 'Limpa 1d4 PV.',
    });
    expect(parseItemLine('3x Tocha', 'b')).toMatchObject({
      name: 'Tocha',
      qty: 3,
      category: 'gear',
    });
    expect(parseItemLine('Flecha x20', 'c')).toMatchObject({ name: 'Flecha', qty: 20 });
  });

  it('converts the old text inventory line by line', () => {
    const items = itemsFromText('Uma tocha\n\n15 m de corda\nAnel de prata', (i) => `i${i}`);
    expect(items.map((i) => i.category)).toEqual(['gear', 'gear', 'treasure']);
    expect(items[1].name).toBe('15 m de corda'); // "15 m" is a length, not a quantity
  });

  it('uses consumables down to zero and reorders', () => {
    const items = itemsFromText('Poção\nTocha', (i) => `i${i}`);
    expect(useItem(useItem(items, 'i0'), 'i0')[0].qty).toBe(0);
    expect(moveItem(items, 'i1', -1).map((i) => i.id)).toEqual(['i1', 'i0']);
    expect(moveItem(items, 'i0', -1)).toBe(items);
  });
});
