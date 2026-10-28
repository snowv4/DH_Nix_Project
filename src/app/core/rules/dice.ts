/** Returns an integer in [1, sides]. Injected so tests can be deterministic. */
export type DieRoller = (sides: number) => number;

/** Uniform die roll using crypto.getRandomValues with rejection sampling (no modulo bias). */
export const cryptoDie: DieRoller = (sides) => {
  const limit = Math.floor(0x100000000 / sides) * sides;
  const buf = new Uint32Array(1);
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return (buf[0] % sides) + 1;
};

export type DualityOutcome = 'hope' | 'fear' | 'critical';
export type AdvantageMode = 'none' | 'advantage' | 'disadvantage';

export interface DualityRequest {
  modifier: number;
  advantage: AdvantageMode;
  difficulty?: number;
}

export interface DualityResult {
  hope: number;
  fear: number;
  /** d6 rolled for advantage (+) or disadvantage (−), 0 when none. */
  advantageDie: number;
  modifier: number;
  total: number;
  outcome: DualityOutcome;
  /** undefined when no difficulty was given. Criticals always succeed. */
  success?: boolean;
}

export function rollDuality(req: DualityRequest, die: DieRoller = cryptoDie): DualityResult {
  const hope = die(12);
  const fear = die(12);
  const d6 = req.advantage === 'none' ? 0 : die(6);
  const advantageDie = req.advantage === 'disadvantage' ? -d6 : d6;
  const total = hope + fear + advantageDie + req.modifier;
  const outcome: DualityOutcome = hope === fear ? 'critical' : hope > fear ? 'hope' : 'fear';
  const success =
    req.difficulty === undefined ? undefined : outcome === 'critical' || total >= req.difficulty;
  return { hope, fear, advantageDie, modifier: req.modifier, total, outcome, success };
}

export interface ResourceEffects {
  hopeGained: number;
  stressCleared: number;
  fearGained: number;
}

/** Automatic resource changes after a duality roll (spec 3.3). */
export function dualityEffects(outcome: DualityOutcome): ResourceEffects {
  switch (outcome) {
    case 'hope':
      return { hopeGained: 1, stressCleared: 0, fearGained: 0 };
    case 'fear':
      return { hopeGained: 0, stressCleared: 0, fearGained: 1 };
    case 'critical':
      return { hopeGained: 1, stressCleared: 1, fearGained: 0 };
  }
}

export function outcomeLabel(result: DualityResult): string {
  if (result.outcome === 'critical') return 'Crítico!';
  const side = result.outcome === 'hope' ? 'com Esperança' : 'com Medo';
  if (result.success === undefined) return `Rolou ${side}`;
  return `${result.success ? 'Sucesso' : 'Falha'} ${side}`;
}
