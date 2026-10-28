import { TraitId } from '../models/character';

export interface ClassInfo {
  id: string;
  name: string;
  domains: [string, string];
  // TODO(regra): conferir Evasão/PV iniciais no SRD (vieram da tabela da spec, seção 3.6).
  startingEvasion: number;
  startingHp: number;
}

export const CLASSES: readonly ClassInfo[] = [
  { id: 'bard', name: 'Bardo', domains: ['Graça', 'Códice'], startingEvasion: 10, startingHp: 5 },
  { id: 'druid', name: 'Druida', domains: ['Sábio', 'Arcano'], startingEvasion: 10, startingHp: 6 },
  {
    id: 'guardian',
    name: 'Guardião',
    domains: ['Valor', 'Lâmina'],
    startingEvasion: 9,
    startingHp: 7,
  },
  {
    id: 'ranger',
    name: 'Patrulheiro',
    domains: ['Osso', 'Sábio'],
    startingEvasion: 12,
    startingHp: 6,
  },
  {
    id: 'rogue',
    name: 'Ladino',
    domains: ['Meia-Noite', 'Graça'],
    startingEvasion: 12,
    startingHp: 6,
  },
  {
    id: 'seraph',
    name: 'Serafim',
    domains: ['Esplendor', 'Valor'],
    startingEvasion: 9,
    startingHp: 7,
  },
  {
    id: 'sorcerer',
    name: 'Feiticeiro',
    domains: ['Arcano', 'Meia-Noite'],
    startingEvasion: 10,
    startingHp: 6,
  },
  {
    id: 'warrior',
    name: 'Guerreiro',
    domains: ['Lâmina', 'Osso'],
    startingEvasion: 11,
    startingHp: 6,
  },
  {
    id: 'wizard',
    name: 'Mago',
    domains: ['Códice', 'Esplendor'],
    startingEvasion: 11,
    startingHp: 5,
  },
];

export function findClass(id: string): ClassInfo | undefined {
  return CLASSES.find((c) => c.id === id);
}

export const TRAIT_LABELS: Record<TraitId, string> = {
  agility: 'Agilidade',
  strength: 'Força',
  finesse: 'Acurácia',
  instinct: 'Instinto',
  presence: 'Presença',
  knowledge: 'Conhecimento',
};
