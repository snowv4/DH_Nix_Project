import {
  ClassData,
  DomainCard,
  Feature,
  RANGE_LABELS,
  STARTING_ITEMS,
  STARTING_POTIONS,
  StatMods,
  SubclassData,
  TIER1_STANCES,
  Weapon,
  findAncestry,
  findArmor,
  findCard,
  findClass,
  findCommunity,
  findWeapon,
} from '../data/srd';
import { TRAIT_LABELS } from '../data/traits';
import { Character, TRAIT_IDS, TraitId, Traits } from '../models/character';
import { BRAWLER_STRIKE_ID, CreationDraft } from '../models/creation';
import { characterIdFromName, createBlankCharacter } from './character';

/** SRD step 3: assign each of these modifiers exactly once. */
export const TRAIT_VALUES: readonly number[] = [2, 1, 1, 0, 0, -1];

export const STARTING_LEVEL = 1;
export const STARTING_PROFICIENCY = 1;
export const STARTING_STRESS = 6;
export const STARTING_HOPE = 2;
export const MAX_ARMOR_SCORE = 12;
export const EXPERIENCE_BONUS = 2;
export const STANCES_AT_CREATION = 2;

// ---------- Traits ----------

/** Values from TRAIT_VALUES not yet used by the assignment (keeps duplicates, e.g. [1, 0]). */
export function remainingTraitValues(traits: Partial<Record<TraitId, number>>): number[] {
  const left = [...TRAIT_VALUES];
  for (const id of TRAIT_IDS) {
    const v = traits[id];
    if (v === undefined) continue;
    const i = left.indexOf(v);
    if (i >= 0) left.splice(i, 1);
  }
  return left;
}

/** Valid when all six traits are set and the values are exactly +2, +1, +1, +0, +0, −1. */
export function validateTraitAssignment(traits: Partial<Record<TraitId, number>>): boolean {
  const values = TRAIT_IDS.map((id) => traits[id]);
  if (values.some((v) => v === undefined)) return false;
  const sorted = (values as number[]).slice().sort((a, b) => a - b);
  const expected = [...TRAIT_VALUES].sort((a, b) => a - b);
  return sorted.every((v, i) => v === expected[i]);
}

/**
 * Puts `value` on `trait`. If the value is no longer available, it is taken from the
 * trait that currently holds it (so tapping swaps instead of failing).
 */
export function assignTrait(
  traits: Partial<Record<TraitId, number>>,
  trait: TraitId,
  value: number,
): Partial<Record<TraitId, number>> {
  const next = { ...traits };
  delete next[trait];
  if (!remainingTraitValues(next).includes(value)) {
    const holder = TRAIT_IDS.find((id) => id !== trait && next[id] === value);
    if (holder) delete next[holder];
  }
  next[trait] = value;
  return next;
}

// ---------- Lookups ----------

export function selectedClass(d: CreationDraft): ClassData | undefined {
  return findClass(d.classId);
}

export function selectedSubclass(d: CreationDraft): SubclassData | undefined {
  return selectedClass(d)?.subclasses.find((s) => s.id === d.subclassId);
}

export function spellcastTrait(d: CreationDraft): TraitId | undefined {
  return selectedSubclass(d)?.spellcastTrait;
}

/** The two ancestry features the character gets, with their stat bonuses. */
export function ancestryFeatures(d: CreationDraft): { feature: Feature; mods?: StatMods }[] {
  const first = findAncestry(d.ancestry.primaryId);
  if (!first) return [];
  const second = d.ancestry.mixed ? findAncestry(d.ancestry.secondaryId) : first;
  if (!second) return [{ feature: first.features[0], mods: first.mods?.[0] }];
  return [
    { feature: first.features[0], mods: first.mods?.[0] },
    { feature: second.features[1], mods: second.mods?.[1] },
  ];
}

export function ancestryLabel(d: CreationDraft): string {
  const first = findAncestry(d.ancestry.primaryId);
  if (!first) return '';
  if (!d.ancestry.mixed) return first.name;
  if (d.ancestry.label.trim()) return d.ancestry.label.trim();
  const second = findAncestry(d.ancestry.secondaryId);
  return second ? `${first.name}-${second.name}` : first.name;
}

export function hasClankDesign(d: CreationDraft): boolean {
  return ancestryFeatures(d).some((f) => f.feature.nameEn === 'Purposeful Design');
}

// ---------- Equipment ----------

export function isMagicWeapon(w: Weapon): boolean {
  return w.damageType !== 'phy';
}

export function canWield(d: CreationDraft, w: Weapon): boolean {
  return !isMagicWeapon(w) || spellcastTrait(d) !== undefined;
}

/** Warrior "Combat Training" ignores burden, so they can add a secondary to a two-handed weapon. */
export function canUseSecondary(d: CreationDraft): boolean {
  if (!d.primaryWeaponId || d.primaryWeaponId === BRAWLER_STRIKE_ID) return false;
  if (d.classId === 'warrior') return true;
  return findWeapon(d.primaryWeaponId)?.hands === 1;
}

export function weaponLoadoutError(d: CreationDraft): string | null {
  if (!d.primaryWeaponId) return 'Escolha uma arma primária.';
  if (d.primaryWeaponId === BRAWLER_STRIKE_ID) {
    if (d.classId !== 'brawler') return 'Só o Lutador pode usar o Golpe de Lutador.';
    return d.secondaryWeaponId ? 'O Golpe de Lutador só vale sem outras armas ativas.' : null;
  }
  const primary = findWeapon(d.primaryWeaponId);
  if (!primary || primary.category !== 'primary') return 'Arma primária inválida.';
  if (!canWield(d, primary))
    return 'Armas mágicas exigem uma subclasse com atributo de Conjuração.';
  if (d.secondaryWeaponId) {
    const secondary = findWeapon(d.secondaryWeaponId);
    if (!secondary || secondary.category !== 'secondary') return 'Arma secundária inválida.';
    if (!canUseSecondary(d)) return 'Uma arma de duas mãos não deixa mão livre para a secundária.';
    if (!canWield(d, secondary))
      return 'Armas mágicas exigem uma subclasse com atributo de Conjuração.';
  }
  return null;
}

// ---------- Derived values ----------

export interface DerivedStats {
  level: number;
  proficiency: number;
  evasion: number;
  hp: number;
  stress: number;
  hope: number;
  armorScore: number;
  major: number;
  severe: number;
  traits: Traits;
  /** Human-readable explanation of every bonus applied, for the wizard. */
  notes: string[];
}

function activeMods(d: CreationDraft): { source: string; mods: StatMods }[] {
  const list: { source: string; mods: StatMods }[] = [];
  for (const { feature, mods } of ancestryFeatures(d))
    if (mods) list.push({ source: feature.name, mods });
  const sub = selectedSubclass(d);
  if (sub?.mods) list.push({ source: sub.name, mods: sub.mods });
  for (const id of [d.primaryWeaponId, d.secondaryWeaponId]) {
    const w = findWeapon(id);
    if (w?.mods) list.push({ source: w.name, mods: w.mods });
  }
  const armor = findArmor(d.armorId);
  if (armor?.mods) list.push({ source: armor.name, mods: armor.mods });
  return list;
}

export function deriveStats(d: CreationDraft): DerivedStats {
  const cls = selectedClass(d);
  const level = STARTING_LEVEL;
  const proficiency = STARTING_PROFICIENCY;
  const notes: string[] = [];

  const traits = {} as Traits;
  for (const id of TRAIT_IDS) traits[id] = d.traits[id] ?? 0;

  let evasion = cls?.evasion ?? 0;
  let hp = cls?.hp ?? 0;
  let stress = STARTING_STRESS;
  let armorBonus = 0;
  let thresholdBonus = 0;
  let severeBonus = 0;
  let plusProficiency = false;
  let plusSpellcast = false;

  for (const { source, mods } of activeMods(d)) {
    if (mods.evasion) {
      evasion += mods.evasion;
      notes.push(`${signed(mods.evasion)} Evasão (${source})`);
    }
    if (mods.hp) {
      hp += mods.hp;
      notes.push(`${signed(mods.hp)} PV (${source})`);
    }
    if (mods.stress) {
      stress += mods.stress;
      notes.push(`${signed(mods.stress)} Estresse (${source})`);
    }
    if (mods.armorScore) {
      armorBonus += mods.armorScore;
      notes.push(`${signed(mods.armorScore)} Armadura (${source})`);
    }
    if (mods.thresholds) {
      thresholdBonus += mods.thresholds;
      notes.push(`${signed(mods.thresholds)} nos limiares (${source})`);
    }
    if (mods.severe) {
      severeBonus += mods.severe;
      notes.push(`${signed(mods.severe)} no limiar Grave (${source})`);
    }
    if (mods.thresholdsPlusProficiency) {
      plusProficiency = true;
      notes.push(`+Proficiência nos limiares (${source})`);
    }
    if (mods.thresholdsPlusSpellcast) {
      plusSpellcast = true;
      notes.push(`+atributo de Conjuração nos limiares (${source})`);
    }
    for (const id of TRAIT_IDS) {
      const t = mods.traits?.[id];
      if (t) {
        traits[id] += t;
        notes.push(`${signed(t)} ${TRAIT_LABELS[id]} (${source})`);
      }
    }
  }

  if (d.classId === 'brawler' && d.primaryWeaponId === BRAWLER_STRIKE_ID && !d.secondaryWeaponId) {
    evasion += 1;
    notes.push('+1 Evasão (Golpe de Lutador ativo)');
  }

  if (plusProficiency) thresholdBonus += proficiency;
  const cast = spellcastTrait(d);
  if (plusSpellcast && cast) thresholdBonus += d.traits[cast] ?? 0;

  const armor = findArmor(d.armorId);
  let armorScore: number;
  let major: number;
  let severe: number;
  if (armor) {
    armorScore = armor.score + armorBonus;
    major = armor.thresholds[0] + level + thresholdBonus;
    severe = armor.thresholds[1] + level + thresholdBonus + severeBonus;
  } else if (d.domainCardIds.includes('bare-bones')) {
    // Valor "Bare Bones": unarmored base Armor Score 3 + Strength, Tier 1 base thresholds 9/19.
    armorScore = 3 + traits.strength + armorBonus;
    major = 9 + level + thresholdBonus;
    severe = 19 + level + thresholdBonus + severeBonus;
    notes.push('Sem armadura com Peito Aberto: Armadura 3 + Força, limiares 9/19');
  } else {
    // Unarmored: Major = level, Severe = 2 × level.
    armorScore = armorBonus;
    major = level + thresholdBonus;
    severe = level * 2 + thresholdBonus + severeBonus;
  }

  return {
    level,
    proficiency,
    evasion,
    hp,
    stress,
    hope: STARTING_HOPE,
    armorScore: Math.max(0, Math.min(MAX_ARMOR_SCORE, armorScore)),
    major,
    severe,
    traits,
    notes,
  };
}

// ---------- Domain cards ----------

export function domainCardLimit(d: CreationDraft): number {
  return 2 + (selectedSubclass(d)?.extraDomainCards ?? 0);
}

export function availableCards(d: CreationDraft, all: readonly DomainCard[]): DomainCard[] {
  const cls = selectedClass(d);
  if (!cls) return [];
  return all.filter((c) => c.level <= STARTING_LEVEL && cls.domains.includes(c.domain));
}

/** Toggle a card, respecting the limit (oldest pick is dropped when full). */
export function toggleCard(d: CreationDraft, cardId: string): string[] {
  if (d.domainCardIds.includes(cardId)) return d.domainCardIds.filter((id) => id !== cardId);
  const next = [...d.domainCardIds, cardId];
  const limit = domainCardLimit(d);
  return next.length > limit ? next.slice(next.length - limit) : next;
}

// ---------- Steps ----------

export const CREATION_STEPS = [
  { id: 'class', label: 'Classe' },
  { id: 'subclass', label: 'Subclasse' },
  { id: 'ancestry', label: 'Ancestralidade' },
  { id: 'community', label: 'Comunidade' },
  { id: 'traits', label: 'Atributos' },
  { id: 'derived', label: 'Valores' },
  { id: 'equipment', label: 'Equipamento' },
  { id: 'experiences', label: 'Experiências' },
  { id: 'cards', label: 'Cartas' },
  { id: 'story', label: 'História' },
  { id: 'connections', label: 'Vínculos' },
  { id: 'review', label: 'Revisão' },
] as const;

export type StepId = (typeof CREATION_STEPS)[number]['id'];

/** Why the step can't be completed yet, or null when it's done. */
export function stepError(step: StepId, d: CreationDraft): string | null {
  switch (step) {
    case 'class':
      return selectedClass(d) ? null : 'Escolha uma classe.';
    case 'subclass': {
      if (!selectedSubclass(d)) return 'Escolha uma subclasse.';
      return classChoicesError(d);
    }
    case 'ancestry': {
      if (!findAncestry(d.ancestry.primaryId)) return 'Escolha uma ancestralidade.';
      if (d.ancestry.mixed) {
        if (!findAncestry(d.ancestry.secondaryId)) return 'Escolha a segunda ancestralidade.';
        if (d.ancestry.secondaryId === d.ancestry.primaryId)
          return 'Escolha duas ancestralidades diferentes.';
      }
      return null;
    }
    case 'community':
      return findCommunity(d.communityId) ? null : 'Escolha uma comunidade.';
    case 'traits':
      return validateTraitAssignment(d.traits)
        ? null
        : 'Use +2, +1, +1, +0, +0 e −1, cada um uma vez.';
    case 'derived':
      return null;
    case 'equipment': {
      const weapons = weaponLoadoutError(d);
      if (weapons) return weapons;
      if (!d.potionId) return 'Escolha uma poção inicial.';
      if (!d.classItem) return 'Escolha um item da classe.';
      return null;
    }
    case 'experiences': {
      if (d.experiences.some((e) => !e.trim())) return 'Escreva suas duas Experiências.';
      if (hasClankDesign(d) && d.clankBonusIndex < 0)
        return 'Escolha qual Experiência recebe o +1 do Propósito de Fábrica.';
      return null;
    }
    case 'cards': {
      const limit = domainCardLimit(d);
      return d.domainCardIds.length === limit ? null : `Escolha ${limit} cartas.`;
    }
    case 'story':
      return d.name.trim() ? null : 'Dê um nome ao personagem.';
    case 'connections':
      return null;
    case 'review':
      return firstIncompleteStep(d) === 'review' ? null : 'Ainda falta completar algum passo.';
  }
}

export function classChoicesError(d: CreationDraft): string | null {
  const c = d.classChoices;
  for (const choice of selectedClass(d)?.choices ?? []) {
    if (choice.subclassId && choice.subclassId !== d.subclassId) continue;
    switch (choice.kind) {
      case 'element':
        if (!c.element) return 'Escolha seu elemento.';
        break;
      case 'patron':
        if (!c.patronName.trim() || !c.patronSphere.trim())
          return 'Dê um nome e uma esfera de influência ao seu patrono.';
        break;
      case 'stances':
        if (c.stances.length !== STANCES_AT_CREATION)
          return `Escolha ${STANCES_AT_CREATION} posturas.`;
        break;
      case 'companion':
        if (!c.companionName.trim() || !c.companionAnimal.trim())
          return 'Dê nome e espécie ao seu companheiro.';
        if (c.companionExperiences.some((e) => !e.trim()))
          return 'Escreva as duas Experiências do companheiro.';
        break;
      case 'strangePatterns':
        if (c.strangeNumber < 1 || c.strangeNumber > 12) return 'Escolha um número de 1 a 12.';
        break;
    }
  }
  return null;
}

export function firstIncompleteStep(d: CreationDraft): StepId {
  for (const s of CREATION_STEPS) {
    if (s.id === 'review') return 'review';
    if (stepError(s.id, d)) return s.id;
  }
  return 'review';
}

// ---------- Final character ----------

function featureLine(title: string, f: Feature): string {
  return `${title} — ${f.name} (${f.nameEn})\n${f.text}`;
}

export function describeWeapon(w: Weapon, cast?: TraitId): string {
  const trait =
    w.trait === 'spellcast' ? (cast ? TRAIT_LABELS[cast] : 'Conjuração') : TRAIT_LABELS[w.trait];
  const type = { phy: 'físico', mag: 'mágico', 'phy/mag': 'físico/mágico' }[w.damageType];
  const hands = w.hands === 2 ? 'duas mãos' : 'uma mão';
  const feature = w.feature ? ` · ${w.feature.name}: ${w.feature.text}` : '';
  return `${w.name} — ${trait}, ${RANGE_LABELS[w.range]}, ${w.damage} ${type}, ${hands}${feature}`;
}

const BRAWLER_STRIKE_TEXT =
  'Golpe de Lutador — atributo à sua escolha, Corpo a corpo, d8+d6 físico (os dois dados escalam com a Proficiência) · +1 de Evasão enquanto ativo';

/** Turns a finished draft into a playable sheet (spec 4.2 "Finalizar"). */
export function buildCharacter(d: CreationDraft, now = Date.now()): Character {
  const cls = selectedClass(d);
  const sub = selectedSubclass(d);
  const community = findCommunity(d.communityId);
  const stats = deriveStats(d);
  const armor = findArmor(d.armorId);
  const cast = sub?.spellcastTrait;
  const base = createBlankCharacter(d.name, now);

  const features: string[] = [];
  if (cls) {
    for (const f of cls.features) features.push(featureLine('Classe', f));
    features.push(featureLine('Esperança (custa 3)', cls.hopeFeature));
  }
  if (sub) {
    for (const f of sub.foundation) features.push(featureLine(`Subclasse ${sub.name}`, f));
    if (cast) features.push(`Atributo de Conjuração: ${TRAIT_LABELS[cast]}`);
  }
  for (const { feature } of ancestryFeatures(d))
    features.push(featureLine('Ancestralidade', feature));
  if (community) features.push(featureLine(`Comunidade ${community.name}`, community.feature));
  features.push(...classChoiceLines(d));

  const potion = STARTING_POTIONS.find((p) => p.id === d.potionId);
  const items = [
    ...STARTING_ITEMS,
    potion ? `${potion.name} (${potion.text})` : '',
    d.classItem,
    community?.feature.nameEn === 'Nomadic Pack' ? 'Mochila Nômade' : '',
  ].filter(Boolean);

  const primary = findWeapon(d.primaryWeaponId);
  const secondary = findWeapon(d.secondaryWeaponId);

  return {
    ...base,
    id: characterIdFromName(d.name),
    name: d.name.trim(),
    pronouns: d.pronouns.trim(),
    level: stats.level,
    classId: d.classId,
    subclass: sub?.name ?? '',
    ancestry: ancestryLabel(d),
    community: community?.name ?? '',
    traits: stats.traits,
    evasion: stats.evasion,
    proficiency: stats.proficiency,
    hp: { max: stats.hp, marked: 0 },
    stress: { max: stats.stress, marked: 0 },
    hope: { max: 6, current: stats.hope },
    armor: { name: armor?.name ?? '', score: stats.armorScore, slotsMarked: 0 },
    thresholds: { major: stats.major, severe: stats.severe },
    experiences: d.experiences.map((name, i) => ({
      name: name.trim(),
      bonus: EXPERIENCE_BONUS + (hasClankDesign(d) && d.clankBonusIndex === i ? 1 : 0),
      note: (d.experienceNotes?.[i] ?? '').trim(),
    })),
    primaryWeapon:
      d.primaryWeaponId === BRAWLER_STRIKE_ID
        ? BRAWLER_STRIKE_TEXT
        : primary
          ? describeWeapon(primary, cast)
          : '',
    secondaryWeapon: secondary ? describeWeapon(secondary, cast) : '',
    items: items.join('\n'),
    gold: { handfuls: 1, bags: 0, chests: 0 },
    domainCards: { loadout: '', vault: '' },
    cards: d.domainCardIds.filter((id) => !!findCard(id)).map((id) => ({ id, active: true })),
    stances: d.subclassId === 'martial-artist' ? [...d.classChoices.stances] : [],
    ...(d.classId === 'brawler' ? { comboDie: 'd4' } : {}),
    features: features.join('\n\n'),
    appearance: d.appearance.trim(),
    background: questionsAndAnswers(cls?.backgroundQuestions ?? [], d.backgroundAnswers),
    connections: [
      questionsAndAnswers(cls?.connectionQuestions ?? [], d.connectionAnswers),
      d.connectionNotes.trim(),
    ]
      .filter(Boolean)
      .join('\n\n'),
    updatedAt: now,
  };
}

function questionsAndAnswers(questions: string[], answers: string[]): string {
  return questions
    .map((q, i) => ({ q, a: (answers[i] ?? '').trim() }))
    .filter(({ a }) => a)
    .map(({ q, a }) => `${q}\n${a}`)
    .join('\n\n');
}

function classChoiceLines(d: CreationDraft): string[] {
  const c = d.classChoices;
  const lines: string[] = [];
  for (const choice of selectedClass(d)?.choices ?? []) {
    if (choice.subclassId && choice.subclassId !== d.subclassId) continue;
    switch (choice.kind) {
      case 'element':
        lines.push(`Elemento: ${c.element}`);
        break;
      case 'patron':
        lines.push(`Patrono: ${c.patronName} (esfera: ${c.patronSphere}) · Favor inicial: 3`);
        break;
      case 'stances':
        lines.push(
          'Posturas conhecidas:\n' +
            c.stances
              .map((id) => TIER1_STANCES.find((s) => s.id === id))
              .filter((s) => !!s)
              .map((s) => `• ${s.name} (${s.nameEn}): ${s.text}`)
              .join('\n'),
        );
        break;
      case 'companion':
        lines.push(
          `Companheiro: ${c.companionName} (${c.companionAnimal}) · Evasão 10 · Ataque d6 Corpo a corpo ${
            c.companionDamageType === 'mag' ? 'mágico' : 'físico'
          } · Experiências: ${c.companionExperiences.map((e) => `${e} +2`).join(', ')}`,
        );
        break;
      case 'strangePatterns':
        lines.push(`Padrões Estranhos: número ${c.strangeNumber}`);
        break;
    }
  }
  return lines;
}

function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}
