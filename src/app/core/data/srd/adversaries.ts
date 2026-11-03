// Source: Daggerheart SRD 2.0, "Adversary Stat Blocks" and "Benchmarks" (pp. 93–95), translated.

export const ADVERSARY_TYPES = [
  { id: 'bruiser', name: 'Brutamontes', nameEn: 'Bruiser', hint: 'Resistente; ataques poderosos.' },
  {
    id: 'horde',
    name: 'Horda',
    nameEn: 'Horde',
    hint: 'Grupo de criaturas iguais agindo como uma só (X por PV).',
  },
  { id: 'leader', name: 'Líder', nameEn: 'Leader', hint: 'Comanda e invoca outros adversários.' },
  { id: 'minion', name: 'Lacaio', nameEn: 'Minion', hint: 'Cai fácil, mas é perigoso em números.' },
  {
    id: 'ranged',
    name: 'Atirador',
    nameEn: 'Ranged',
    hint: 'Frágil de perto, causa muito dano à distância.',
  },
  {
    id: 'skulk',
    name: 'Furtivo',
    nameEn: 'Skulk',
    hint: 'Manobra e aproveita brechas para emboscar.',
  },
  {
    id: 'social',
    name: 'Social',
    nameEn: 'Social',
    hint: 'Desafia com conversa em vez de combate.',
  },
  { id: 'solo', name: 'Solo', nameEn: 'Solo', hint: 'Desafio formidável para o grupo inteiro.' },
  {
    id: 'standard',
    name: 'Padrão',
    nameEn: 'Standard',
    hint: 'Representante típico do seu grupo.',
  },
  {
    id: 'support',
    name: 'Suporte',
    nameEn: 'Support',
    hint: 'Fortalece aliados e atrapalha oponentes.',
  },
] as const;

export type AdversaryTypeId = (typeof ADVERSARY_TYPES)[number]['id'];

/** Typical numbers per tier, used to pre-fill a new NPC when the tier changes. */
export const ADVERSARY_BENCHMARKS: Record<
  1 | 2 | 3 | 4,
  { attack: number; damage: string; difficulty: number; major: number; severe: number }
> = {
  1: { attack: 1, damage: '1d6+2 a 1d12+4', difficulty: 11, major: 7, severe: 12 },
  2: { attack: 2, damage: '2d6+3 a 2d12+4', difficulty: 14, major: 10, severe: 20 },
  3: { attack: 3, damage: '3d8+3 a 3d12+5', difficulty: 17, major: 20, severe: 32 },
  4: { attack: 4, damage: '4d8+10 a 4d12+15', difficulty: 20, major: 25, severe: 45 },
};

export const ADVERSARY_EXAMPLE_EXPERIENCES = [
  'Acrobacia',
  'Caçar do Alto',
  'Navegação',
  'Emboscador',
  'Intimidação',
  'Nobreza',
  'Barganha',
  'Invasão',
  'Reflexos Rápidos',
  'Mestre da Lâmina',
  'Sentidos Aguçados',
  'Sociável',
  'Guarda-costas',
  'Conhecimento Mágico',
  'Furtividade',
  'Comandante',
  'Amigo da Natureza',
  'Rastreador',
];
