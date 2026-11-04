/**
 * Conditions from the Daggerheart SRD 2.0: the three standard ones (SRD "Conditions") plus the
 * special conditions that domain cards, class features and Tier 1 adversaries impose.
 * Special conditions work as their source text says; the summary here is only a reminder.
 */
export type ConditionGroup = 'standard' | 'cards' | 'adversaries';

export interface ConditionDef {
  id: string;
  label: string;
  icon: string;
  group: ConditionGroup;
  /** Short reminder of what it does (pt-BR). */
  summary: string;
  /** Where it comes from, for special conditions. */
  source?: string;
}

export const CONDITION_GROUPS: Record<ConditionGroup, string> = {
  standard: 'Condições padrão',
  cards: 'Especiais — cartas e classes',
  adversaries: 'Especiais — adversários',
};

export const CONDITIONS: readonly ConditionDef[] = [
  {
    id: 'hidden',
    label: 'Oculto',
    icon: '👁️‍🗨️',
    group: 'standard',
    summary:
      'Fora da vista dos inimigos: rolagens contra você têm desvantagem. Acaba se te virem, se você entrar na linha de visão ou atacar.',
  },
  {
    id: 'restrained',
    label: 'Imobilizado',
    icon: '⛓️',
    group: 'standard',
    summary: 'Não pode se mover, mas ainda pode agir de onde está.',
  },
  {
    id: 'vulnerable',
    label: 'Vulnerável',
    icon: '🎯',
    group: 'standard',
    summary: 'Todas as rolagens contra a criatura têm vantagem.',
  },
  {
    id: 'cloaked',
    label: 'Encoberto',
    icon: '🌫️',
    group: 'cards',
    summary:
      'Continua invisível se estiver parado quando um adversário chegar onde o veria. Acaba ao se mover na linha de visão ou atacar.',
    source: 'Cartas de Arcano; habilidades de subclasse',
  },
  {
    id: 'charged',
    label: 'Carregado',
    icon: '⚡',
    group: 'cards',
    summary:
      'Ao acertar um ataque de dano mágico, pode gastar a Carga para +10 no dano ou +3 na Dificuldade da rolagem de reação. Some no descanso longo.',
    source: 'Habilidade de classe (Carga Arcana)',
  },
  {
    id: 'asleep',
    label: 'Adormecido',
    icon: '💤',
    group: 'cards',
    summary: 'Dorme até sofrer dano ou o mestre gastar 1 Medo no turno dele.',
    source: 'Livro de Illiat (Sono)',
  },
  {
    id: 'enraptured',
    label: 'Enlevado',
    icon: '😍',
    group: 'cards',
    summary:
      'A atenção do alvo fica presa em quem o encantou; ele mal enxerga ou ouve outra coisa. (temporária)',
    source: 'Cartas de Graça',
  },
  {
    id: 'stunned',
    label: 'Atordoado',
    icon: '💫',
    group: 'cards',
    summary: 'Não pode usar reações nem fazer outras ações até se livrar da condição. (temporária)',
    source: 'Cartas de Graça',
  },
  {
    id: 'silenced',
    label: 'Silenciado',
    icon: '🔇',
    group: 'cards',
    summary:
      'Não faz barulho nem conjura magias. Acaba se o mestre gastar 1 Medo, a magia for lançada de novo ou o conjurador sofrer dano Maior.',
    source: 'Silêncio (Meia-Noite)',
  },
  {
    id: 'horrified',
    label: 'Horrorizado',
    icon: '😱',
    group: 'cards',
    summary: 'Enquanto Horrorizado, fica Vulnerável. (temporária)',
    source: 'Cartas de Meia-Noite',
  },
  {
    id: 'corroded',
    label: 'Corroído',
    icon: '🧪',
    group: 'cards',
    summary: '−1 na Dificuldade a cada 2 Estresse gastos. Permanente e acumula.',
    source: 'Cartas de Meia-Noite',
  },
  {
    id: 'poisoned',
    label: 'Envenenado',
    icon: '☠️',
    group: 'adversaries',
    summary:
      'Efeito de veneno conforme o adversário (ex.: rolar 1d6 ou marcar Estresse antes das rolagens de ação).',
    source: 'Escorpião Gigante, Víbora',
  },
  {
    id: 'shaky',
    label: 'Abalado',
    icon: '😵‍💫',
    group: 'adversaries',
    summary: 'Desvantagem nas rolagens de ataque até passar numa rolagem de Instinto.',
    source: 'Fiandeira Tecetrevas',
  },
  {
    id: 'exhausted',
    label: 'Exausto',
    icon: '🥵',
    group: 'adversaries',
    summary:
      'Marca 1 Estresse sempre que faz uma rolagem de ação, até passar numa rolagem de Força.',
    source: 'Rastejante Tecetrevas',
  },
  {
    id: 'enchanted',
    label: 'Encantado',
    icon: '💘',
    group: 'adversaries',
    summary:
      'Vê o adversário como amigo de confiança e obedece, salvo contra seus valores mais profundos. Acaba ao sofrer dano.',
    source: 'Kelpie',
  },
  {
    id: 'cursed',
    label: 'Amaldiçoado',
    icon: '🪬',
    group: 'adversaries',
    summary:
      'Quando rolar com Esperança, o mestre pode marcar 1 Estresse para a rolagem virar com Medo. (temporária)',
    source: 'Bruxo da Faca Serrilhada',
  },
  {
    id: 'ignited',
    label: 'Em Chamas',
    icon: '🔥',
    group: 'adversaries',
    summary: 'Sofre 1d4 de dano mágico a cada rolagem de ação, até se apagar com Acurácia (14).',
    source: 'Gosma Vermelha',
  },
  {
    id: 'slowed',
    label: 'Lento',
    icon: '🐌',
    group: 'adversaries',
    summary: 'Fica Vulnerável e marca 1 Estresse ao se mover, até rolar com Esperança.',
    source: 'Mago de Alma Partida',
  },
  {
    id: 'pinned',
    label: 'Preso',
    icon: '🤼',
    group: 'adversaries',
    summary: 'Imobilizado e sofrendo dano extra de quem o prende, até escapar (Força).',
    source: 'Masque Muerte, Criatura de Cera',
  },
  {
    id: 'taunted',
    label: 'Provocado',
    icon: '😤',
    group: 'adversaries',
    summary: 'No próximo ataque, desvantagem contra alvos que não sejam quem provocou.',
    source: 'Mestre de Armas',
  },
  {
    id: 'spiders',
    label: 'Coberto de Aranhas',
    icon: '🕷️',
    group: 'adversaries',
    summary: 'Rola 1d6 a cada rolagem de ação; com 4+ marca 1 Estresse ou o mestre ganha 1 Medo.',
    source: 'Enxame Tecetrevas',
  },
];

export const CONDITION_BY_ID: ReadonlyMap<string, ConditionDef> = new Map(
  CONDITIONS.map((c) => [c.id, c]),
);

/** Emoji offered for custom markers ("Voando", "Caído", "Concentrado"…). */
export const MARKER_ICONS = [
  '🪽',
  '⬇️',
  '🛡️',
  '🎵',
  '🧠',
  '✨',
  '💀',
  '🩸',
  '❄️',
  '🌀',
  '⏳',
  '👑',
  '🎯',
  '🔮',
  '🗡️',
  '🏹',
  '🐾',
  '🌿',
  '🌙',
  '☀️',
  '⭐',
  '❗',
  '❓',
  '📌',
] as const;
