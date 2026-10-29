import {
  ADVANCEMENTS,
  AdvancementId,
  AdvancementOption,
  COMBO_DICE,
  COMPANION_UPGRADES,
  DomainCard,
  DomainId,
  TIER1_STANCES,
  TIER2_STANCES,
  findCard,
  findClass,
} from '../data/srd';
import { TRAIT_LABELS } from '../data/traits';
import { Character, LevelRecord, OwnedCard, TRAIT_IDS, TraitId } from '../models/character';

/** Levels with transcribed content (Tier 2 cards go up to level 4). */
export const MAX_SUPPORTED_LEVEL = 4;
export const MAX_LEVEL = 10;
export const ADVANCEMENT_POINTS = 2;
export const MAX_ACTIVE_CARDS = 5;

export function tierOf(level: number): 1 | 2 | 3 | 4 {
  if (level <= 1) return 1;
  if (level <= 4) return 2;
  if (level <= 7) return 3;
  return 4;
}

/** Levels 2, 5 and 8 grant a new Experience and +1 Proficiency (5 and 8 also clear trait marks). */
export function hasTierAchievement(level: number): boolean {
  return level === 2 || level === 5 || level === 8;
}

export function canLevelUp(c: Character, levelUnlocked: number): boolean {
  return c.level < Math.min(levelUnlocked, MAX_SUPPORTED_LEVEL, MAX_LEVEL);
}

export type AdvancementPick =
  | { id: 'traits'; traits: TraitId[] }
  | { id: 'experiences'; indexes: number[] }
  | { id: 'domainCard'; cardId: string }
  | { id: Exclude<AdvancementId, 'traits' | 'experiences' | 'domainCard'> };

export interface LevelUpChoices {
  newExperience: { name: string; note: string };
  advancements: AdvancementPick[];
  newCardId: string;
  stanceId: string;
  companionUpgradeId: string;
}

export function emptyChoices(): LevelUpChoices {
  return {
    newExperience: { name: '', note: '' },
    advancements: [],
    newCardId: '',
    stanceId: '',
    companionUpgradeId: '',
  };
}

// ---------- Advancement slots ----------

/** How many slots of an advancement were already used in a tier, from the level history. */
export function usedSlots(c: Character, tier: number, id: AdvancementId): number {
  return (c.levelHistory ?? [])
    .filter((r) => tierOf(r.level) === tier)
    .reduce((n, r) => n + r.advancements.filter((a) => a === id).length, 0);
}

export interface AvailableAdvancement {
  option: AdvancementOption;
  tier: number;
  total: number;
  used: number;
}

/** Options for the new level: its tier's table (Tier 3+ may also use earlier tiers — TODO when supported). */
export function availableAdvancements(c: Character, newLevel: number): AvailableAdvancement[] {
  const tier = tierOf(newLevel);
  return ADVANCEMENTS.filter(
    (o) => o.slots[tier] > 0 && (!o.classId || o.classId === c.classId),
  ).map((option) => ({
    option,
    tier,
    total: option.slots[tier],
    used: usedSlots(c, tier, option.id),
  }));
}

export function pointsSpent(picks: AdvancementPick[]): number {
  return picks.reduce((n, p) => n + (ADVANCEMENTS.find((o) => o.id === p.id)?.cost ?? 1), 0);
}

/** Cards the character can take now: class domains, level ≤ newLevel, not owned, not excluded. */
export function cardChoices(
  c: Character,
  newLevel: number,
  all: readonly DomainCard[],
  exclude: string[] = [],
): DomainCard[] {
  const domains: readonly DomainId[] = findClass(c.classId)?.domains ?? [];
  const owned = new Set([...(c.cards ?? []).map((o) => o.id), ...exclude]);
  return all.filter(
    (card) => card.level <= newLevel && domains.includes(card.domain) && !owned.has(card.id),
  );
}

export function unmarkedTraits(c: Character, newLevel: number): TraitId[] {
  const marked = hasTierAchievement(newLevel) && newLevel >= 5 ? [] : (c.markedTraits ?? []);
  return TRAIT_IDS.filter((t) => !marked.includes(t));
}

export function stanceChoices(c: Character, newLevel: number) {
  const known = new Set(c.stances ?? []);
  const pool = tierOf(newLevel) >= 2 ? [...TIER1_STANCES, ...TIER2_STANCES] : [...TIER1_STANCES];
  return pool.filter((s) => !known.has(s.id));
}

export function needsStance(c: Character): boolean {
  return c.subclass === 'Artista Marcial';
}

export function needsCompanion(c: Character): boolean {
  return c.subclass === 'Vínculo Bestial';
}

// ---------- Validation ----------

/** Why the choices can't be applied yet, or null. */
export function levelUpError(c: Character, newLevel: number, ch: LevelUpChoices): string | null {
  if (newLevel !== c.level + 1) return 'Suba um nível por vez.';
  if (newLevel > MAX_SUPPORTED_LEVEL)
    return `O conteúdo do nível ${newLevel} ainda não foi transcrito.`;
  if (hasTierAchievement(newLevel) && !ch.newExperience.name.trim())
    return 'Escreva a nova Experiência.';

  const spent = pointsSpent(ch.advancements);
  if (spent !== ADVANCEMENT_POINTS)
    return `Escolha ${ADVANCEMENT_POINTS} avanços (faltam ${ADVANCEMENT_POINTS - spent}).`;

  const available = availableAdvancements(c, newLevel);
  for (const opt of available) {
    const taking = ch.advancements.filter((p) => p.id === opt.option.id).length;
    if (taking > opt.total - opt.used)
      return `“${opt.option.label}” não tem mais espaços neste patamar.`;
  }
  for (const pick of ch.advancements) {
    if (!available.some((a) => a.option.id === pick.id))
      return 'Avanço indisponível neste patamar.';
    if (pick.id === 'traits') {
      const free = unmarkedTraits(c, newLevel);
      if (pick.traits.length !== 2 || new Set(pick.traits).size !== 2)
        return 'Escolha dois atributos diferentes.';
      if (pick.traits.some((t) => !free.includes(t)))
        return 'Só atributos não marcados podem subir.';
    }
    if (pick.id === 'experiences') {
      const total = c.experiences.length + (hasTierAchievement(newLevel) ? 1 : 0);
      if (pick.indexes.length !== 2 || new Set(pick.indexes).size !== 2)
        return 'Escolha duas Experiências diferentes.';
      if (pick.indexes.some((i) => i < 0 || i >= total)) return 'Experiência inválida.';
    }
    if (
      pick.id === 'comboDie' &&
      COMBO_DICE.indexOf((c.comboDie ?? 'd4') as (typeof COMBO_DICE)[number]) >=
        COMBO_DICE.length - 1
    ) {
      return 'Seu Dado de Combo já está no máximo.';
    }
  }
  const traitPicks = ch.advancements
    .filter((p) => p.id === 'traits')
    .flatMap((p) => (p.id === 'traits' ? p.traits : []));
  if (new Set(traitPicks).size !== traitPicks.length)
    return 'Cada atributo só pode subir uma vez por nível.';

  const extraCards = ch.advancements.flatMap((p) => (p.id === 'domainCard' ? [p.cardId] : []));
  const allCards = [ch.newCardId, ...extraCards];
  if (!ch.newCardId) return 'Escolha a nova carta de domínio.';
  if (new Set(allCards).size !== allCards.length) return 'Escolha cartas diferentes.';
  for (const id of allCards) {
    const card = findCard(id);
    const domains: readonly DomainId[] = findClass(c.classId)?.domains ?? [];
    if (!card || card.level > newLevel || !domains.includes(card.domain))
      return 'Carta inválida para o seu nível ou classe.';
    if ((c.cards ?? []).some((o) => o.id === id)) return 'Você já tem essa carta.';
  }

  if (needsStance(c) && !ch.stanceId) return 'Escolha uma nova postura.';
  if (needsCompanion(c) && !ch.companionUpgradeId)
    return 'Escolha uma melhoria para o companheiro.';
  return null;
}

// ---------- Apply / undo ----------

const SNAPSHOT_FIELDS = [
  'level',
  'proficiency',
  'traits',
  'markedTraits',
  'hp',
  'stress',
  'evasion',
  'experiences',
  'thresholds',
  'cards',
  'features',
  'stances',
  'comboDie',
] as const;

/** Returns the patch for the new level, including the history record used to undo it. */
export function applyLevelUp(
  c: Character,
  newLevel: number,
  ch: LevelUpChoices,
  now = Date.now(),
): Partial<Character> {
  const before: LevelRecord['before'] = {};
  for (const f of SNAPSHOT_FIELDS) {
    // Firestore rejects undefined: missing optional fields are stored as null-equivalent defaults.
    (before as Record<string, unknown>)[f] = c[f] ?? defaultFor(f);
  }

  const summary: string[] = [`Nível ${newLevel}`];
  const traits = { ...c.traits };
  let marked = [...(c.markedTraits ?? [])];
  let experiences = c.experiences.map((e) => ({ ...e }));
  let proficiency = c.proficiency;
  let hp = { ...c.hp };
  let stress = { ...c.stress };
  let evasion = c.evasion;
  let comboDie = c.comboDie ?? 'd4';
  let features = c.features;
  const stances = [...(c.stances ?? [])];
  let cards: OwnedCard[] = [...(c.cards ?? [])];

  if (hasTierAchievement(newLevel)) {
    experiences.push({
      name: ch.newExperience.name.trim(),
      bonus: 2,
      note: ch.newExperience.note.trim(),
    });
    proficiency += 1;
    summary.push(
      `Conquista de patamar: nova Experiência “${ch.newExperience.name.trim()}” (+2) e +1 de Proficiência`,
    );
    if (newLevel >= 5) {
      marked = [];
      summary.push('Marcas de atributos limpas');
    }
  }

  for (const pick of ch.advancements) {
    switch (pick.id) {
      case 'traits':
        for (const t of pick.traits) traits[t] += 1;
        marked.push(...pick.traits);
        summary.push(`+1 em ${pick.traits.map((t) => TRAIT_LABELS[t]).join(' e ')}`);
        break;
      case 'hp':
        hp = { ...hp, max: hp.max + 1 };
        summary.push('+1 espaço de PV');
        break;
      case 'stress':
        stress = { ...stress, max: stress.max + 1 };
        summary.push('+1 espaço de Estresse');
        break;
      case 'experiences':
        experiences = experiences.map((e, i) =>
          pick.indexes.includes(i) ? { ...e, bonus: e.bonus + 1 } : e,
        );
        summary.push(`+1 em ${pick.indexes.map((i) => experiences[i]?.name).join(' e ')}`);
        break;
      case 'domainCard':
        cards = addCard(cards, pick.cardId);
        summary.push(`Carta extra: ${findCard(pick.cardId)?.name ?? pick.cardId}`);
        break;
      case 'evasion':
        evasion += 1;
        summary.push('+1 de Evasão');
        break;
      case 'comboDie': {
        const next =
          COMBO_DICE[
            Math.min(
              COMBO_DICE.length - 1,
              COMBO_DICE.indexOf(comboDie as (typeof COMBO_DICE)[number]) + 1,
            )
          ];
        comboDie = next;
        summary.push(`Dado de Combo agora é ${next}`);
        break;
      }
      case 'proficiency':
        proficiency += 1;
        summary.push('+1 de Proficiência');
        break;
      case 'subclass':
      case 'multiclass':
        // TODO(regra): Tier 3+ (Especialização/Maestria e multiclasse) ainda não transcritos.
        summary.push(pick.id === 'subclass' ? 'Carta de subclasse melhorada' : 'Multiclasse');
        break;
    }
  }

  const thresholds = { major: c.thresholds.major + 1, severe: c.thresholds.severe + 1 };
  summary.push('+1 em todos os limiares de dano');

  cards = addCard(cards, ch.newCardId);
  summary.push(`Nova carta: ${findCard(ch.newCardId)?.name ?? ch.newCardId}`);

  const extras: string[] = [];
  if (ch.stanceId) {
    const s = [...TIER1_STANCES, ...TIER2_STANCES].find((x) => x.id === ch.stanceId);
    if (s) {
      stances.push(s.id);
      extras.push(`Nova postura (nível ${newLevel}) — ${s.name} (${s.nameEn}): ${s.text}`);
      summary.push(`Nova postura: ${s.name}`);
    }
  }
  if (ch.companionUpgradeId) {
    const u = COMPANION_UPGRADES.find((x) => x.id === ch.companionUpgradeId);
    if (u) {
      extras.push(`Companheiro (nível ${newLevel}) — ${u.name}: ${u.text}`);
      summary.push(`Companheiro: ${u.name}`);
    }
  }
  if (extras.length) features = [features.trim(), ...extras].filter(Boolean).join('\n\n');

  const record: LevelRecord = {
    level: newLevel,
    advancements: ch.advancements.map((p) => p.id),
    summary,
    before,
    appliedAt: now,
  };

  return {
    level: newLevel,
    proficiency,
    traits,
    markedTraits: marked,
    hp,
    stress,
    evasion,
    experiences,
    thresholds,
    cards,
    features,
    stances,
    comboDie,
    levelHistory: [...(c.levelHistory ?? []), record],
  };
}

/** Restores the fields saved before the last level-up. Marked HP/Stress are clamped to the old maximum. */
export function undoLastLevel(c: Character): Partial<Character> | null {
  const history = c.levelHistory ?? [];
  const last = history.at(-1);
  if (!last) return null;
  const restored = { ...last.before } as Partial<Character>;
  if (restored.hp) restored.hp = { ...restored.hp, marked: Math.min(c.hp.marked, restored.hp.max) };
  if (restored.stress)
    restored.stress = {
      ...restored.stress,
      marked: Math.min(c.stress.marked, restored.stress.max),
    };
  return { ...restored, levelHistory: history.slice(0, -1) };
}

function addCard(cards: OwnedCard[], id: string): OwnedCard[] {
  if (!id || cards.some((o) => o.id === id)) return cards;
  const active = cards.filter((o) => o.active).length < MAX_ACTIVE_CARDS;
  return [...cards, { id, active }];
}

function defaultFor(field: (typeof SNAPSHOT_FIELDS)[number]): unknown {
  switch (field) {
    case 'markedTraits':
    case 'cards':
    case 'stances':
      return [];
    case 'comboDie':
      return 'd4';
    default:
      return '';
  }
}
