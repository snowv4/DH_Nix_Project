import { TraitId } from '../models/character';

export const TRAIT_LABELS: Record<TraitId, string> = {
  agility: 'Agilidade',
  strength: 'Força',
  finesse: 'Acurácia',
  instinct: 'Instinto',
  presence: 'Presença',
  knowledge: 'Conhecimento',
};

/** SRD step 3: what each trait is used for. */
export const TRAIT_HINTS: Record<TraitId, string> = {
  agility: 'Correr, saltar, manobrar. Reagir rápido ao perigo.',
  strength: 'Erguer, esmagar, agarrar. Força bruta e resistência.',
  finesse: 'Controlar, esconder, mexer em mecanismos. Precisão e furtividade.',
  instinct: 'Perceber, sentir, navegar. Intuição e atenção ao redor.',
  presence: 'Encantar, atuar, enganar. Força de personalidade.',
  knowledge: 'Lembrar, analisar, compreender. Dedução e informação.',
};
