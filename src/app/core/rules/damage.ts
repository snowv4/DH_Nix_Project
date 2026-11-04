import { Tracked } from '../models/character';

import { Resistance, Severity } from '../models/damage';

export type { Resistance, Severity } from '../models/damage';

/** SRD "Hit Points & Damage Thresholds" (+ optional Massive Damage). */
export const SEVERITY_HP: Record<Severity, number> = {
  none: 0,
  minor: 1,
  major: 2,
  severe: 3,
  massive: 4,
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  none: 'Sem dano',
  minor: 'Menor',
  major: 'Maior',
  severe: 'Grave',
  massive: 'Massivo',
};

const ORDER: Severity[] = ['none', 'minor', 'major', 'severe', 'massive'];

/**
 * Damage amount → severity. A target without thresholds (Minions) marks 1 HP from any damage.
 * Massive (optional rule): damage ≥ twice the Severe threshold marks 4 HP.
 */
export function severityFromDamage(
  amount: number,
  thresholds: { major: number; severe: number },
  massiveRule = false,
): Severity {
  if (amount <= 0) return 'none';
  const { major, severe } = thresholds;
  if (major <= 0) return 'minor';
  if (severe > 0 && amount >= severe) {
    return massiveRule && amount >= severe * 2 ? 'massive' : 'severe';
  }
  return amount >= major ? 'major' : 'minor';
}

/** Marking one Armor Slot drops the severity one threshold (Severe → Major → Minor → none). */
export function reduceSeverity(s: Severity): Severity {
  // Massive also drops one step: 4 HP → 3 HP.
  return ORDER[Math.max(0, ORDER.indexOf(s) - 1)];
}

/** Resistance halves the damage before the thresholds; immunity ignores it. */
export function applyResistance(amount: number, resistance: Resistance): number {
  if (resistance === 'immune') return 0;
  // TODO(regra): conferir o arredondamento da resistência (o SRD só diz "pela metade").
  return resistance === 'resistant' ? Math.floor(amount / 2) : amount;
}

export interface DamageInput {
  /** Either a rolled amount (compared to thresholds) … */
  amount?: number;
  /** … or the severity the table already decided. */
  severity?: Severity;
  thresholds: { major: number; severe: number };
  resistance: Resistance;
  /** Direct damage can't be reduced by Armor Slots. */
  direct: boolean;
  useArmor: boolean;
  armorSlotsLeft: number;
  massiveRule?: boolean;
}

export interface DamageResult {
  /** Severity before armor. */
  base: Severity;
  /** Severity actually taken. */
  final: Severity;
  hp: number;
  armorUsed: boolean;
}

export function resolveDamage(d: DamageInput): DamageResult {
  let base: Severity;
  if (d.resistance === 'immune') base = 'none';
  else if (d.amount !== undefined) {
    base = severityFromDamage(applyResistance(d.amount, d.resistance), d.thresholds, d.massiveRule);
  } else base = d.severity ?? 'none';
  const armorUsed = d.useArmor && !d.direct && d.armorSlotsLeft > 0 && base !== 'none';
  const final = armorUsed ? reduceSeverity(base) : base;
  return { base, final, hp: SEVERITY_HP[final], armorUsed };
}

/** Marks HP on a track (never past the max). */
export function applyDamage(hp: Tracked, amount: number): Tracked {
  return { ...hp, marked: Math.min(hp.max, Math.max(0, hp.marked + amount)) };
}
