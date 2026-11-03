import { Armor, ALL_WEAPONS, Weapon } from '../data/srd';

/** Recognizes a weapon line written by `describeWeapon`, including reskins. */
export function parseWeaponText(text: string): { weapon: Weapon; reskin: string } | null {
  const head = text.split(' — ')[0]?.trim() ?? '';
  const reskin = /^(.*) \(reskin de (.+)\)$/.exec(head);
  const baseName = reskin ? reskin[2] : head;
  // Longest names first so "Adaga Retorcida" isn't read as "Adaga".
  const weapon = [...ALL_WEAPONS]
    .sort((a, b) => b.name.length - a.name.length)
    .find((w) => w.name === baseName);
  return weapon ? { weapon, reskin: reskin ? reskin[1] : '' } : null;
}

/** Display name for armor, with an optional reskin. */
export function armorDisplayName(a: Armor, reskin: string): string {
  return reskin.trim() ? `${reskin.trim()} (reskin de ${a.name})` : a.name;
}

export function parseArmorName(
  name: string,
  armors: readonly Armor[],
): { armor: Armor; reskin: string } | null {
  const reskin = /^(.*) \(reskin de (.+)\)$/.exec(name.trim());
  const baseName = reskin ? reskin[2] : name.trim();
  const armor = armors.find((a) => a.name === baseName);
  return armor ? { armor, reskin: reskin ? reskin[1] : '' } : null;
}

/**
 * Swapping armor keeps every other bonus: whatever the character had on top of the old armor's
 * base (level, Stalwart, Earthkin, shields…) is carried over to the new base.
 */
export function swapArmor(
  current: { score: number; major: number; severe: number },
  oldArmor: Armor | null,
  newArmor: Armor | null,
  level: number,
): { score: number; major: number; severe: number } {
  const oldBase = oldArmor
    ? { score: oldArmor.score, major: oldArmor.thresholds[0], severe: oldArmor.thresholds[1] }
    : { score: 0, major: 0, severe: 0 };
  // Unarmored thresholds are level / 2×level (SRD p. 72) instead of base + level.
  const bonus = oldArmor
    ? {
        score: current.score - oldBase.score,
        major: current.major - oldBase.major - level,
        severe: current.severe - oldBase.severe - level,
      }
    : // Blank sheets start at 0/0, below the unarmored defaults: never carry a negative bonus.
      {
        score: Math.max(0, current.score),
        major: Math.max(0, current.major - level),
        severe: Math.max(0, current.severe - 2 * level),
      };
  if (!newArmor) {
    return {
      score: Math.max(0, bonus.score),
      major: level + bonus.major,
      severe: 2 * level + bonus.severe,
    };
  }
  return {
    score: Math.max(0, newArmor.score + bonus.score),
    major: newArmor.thresholds[0] + level + bonus.major,
    severe: newArmor.thresholds[1] + level + bonus.severe,
  };
}
