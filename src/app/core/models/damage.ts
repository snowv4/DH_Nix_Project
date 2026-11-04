/** SRD damage severities ("Massive" is the optional rule). */
export type Severity = 'none' | 'minor' | 'major' | 'severe' | 'massive';
export type Resistance = 'none' | 'resistant' | 'immune';
export type DamageKind = 'physical' | 'magic';

/** What happened to the target of an attack; sent with the map event so the TV can show it. */
export interface DamageOutcome {
  miss: boolean;
  base: Severity;
  final: Severity;
  hp: number;
  armorUsed: boolean;
  direct: boolean;
  resistance: Resistance;
  kind: DamageKind;
  /** The hit took the target's last HP. */
  down: boolean;
}
