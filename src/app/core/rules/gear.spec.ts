import { ARMORS, findArmor, findWeapon } from '../data/srd';
import { describeWeapon } from './creation';
import { parseArmorName, parseWeaponText, swapArmor } from './gear';

describe('weapon reskin', () => {
  it('keeps the stats and renames the weapon', () => {
    const text = describeWeapon(findWeapon('longsword')!, undefined, 'Lâmina do Dragão');
    expect(
      text.startsWith(
        'Lâmina do Dragão (reskin de Espada Longa) — Agilidade, Corpo a corpo, d10+3',
      ),
    ).toBe(true);
  });

  it('reads back plain and reskinned weapons', () => {
    expect(parseWeaponText(describeWeapon(findWeapon('twisted-dagger')!))?.weapon.id).toBe(
      'twisted-dagger',
    );
    const parsed = parseWeaponText(
      describeWeapon(findWeapon('greatstaff')!, 'knowledge', 'Conta-Mãe'),
    );
    expect(parsed?.weapon.id).toBe('greatstaff');
    expect(parsed?.reskin).toBe('Conta-Mãe');
    expect(parseWeaponText('Machado do vovô')).toBeNull();
  });
});

describe('armor', () => {
  it('reads reskinned armor names', () => {
    expect(parseArmorName('Casaco de Couro (reskin de Armadura de Couro)', ARMORS)?.armor.id).toBe(
      'leather',
    );
  });

  it('keeps bonuses when swapping armor', () => {
    // Leather 6/13 score 3 at level 2 with Stalwart +1: 9/16, score 3.
    const next = swapArmor(
      { score: 3, major: 9, severe: 16 },
      findArmor('leather')!,
      findArmor('chainmail')!,
      2,
    );
    expect(next).toEqual({ score: 4, major: 10, severe: 18 });
  });

  it('starts a blank sheet (0/0) from the armor base + level', () => {
    expect(swapArmor({ score: 0, major: 0, severe: 0 }, null, findArmor('leather')!, 1)).toEqual({
      score: 3,
      major: 7,
      severe: 14,
    });
  });

  it('handles taking armor off', () => {
    expect(swapArmor({ score: 3, major: 7, severe: 14 }, findArmor('leather')!, null, 1)).toEqual({
      score: 0,
      major: 1,
      severe: 2,
    });
  });
});
