// Source: Daggerheart SRD 2.0 "Leveling Up" (p. 53–54); slot counts from the official character
// sheet level-up page (Tier 2–4 columns).

export type AdvancementId =
  | 'traits'
  | 'hp'
  | 'stress'
  | 'experiences'
  | 'domainCard'
  | 'evasion'
  | 'subclass'
  | 'proficiency'
  | 'multiclass'
  | 'comboDie';

export interface AdvancementOption {
  id: AdvancementId;
  label: string;
  hint: string;
  /** Slots per tier (index = tier). 0 = not offered in that tier. */
  slots: [0, number, number, number, number];
  /** Proficiency and Multiclass use both of the level's advancements. */
  cost: 1 | 2;
  /** Only offered to this class (Brawler "Combo Strike"). */
  classId?: string;
}

export const ADVANCEMENTS: readonly AdvancementOption[] = [
  {
    id: 'traits',
    label: '+1 em dois atributos não marcados',
    hint: 'Os dois atributos ficam marcados e só podem subir de novo no próximo patamar.',
    slots: [0, 0, 3, 3, 3],
    cost: 1,
  },
  {
    id: 'hp',
    label: '+1 espaço de PV',
    hint: 'Ganhe permanentemente um espaço de Pontos de Vida.',
    slots: [0, 0, 2, 2, 2],
    cost: 1,
  },
  {
    id: 'stress',
    label: '+1 espaço de Estresse',
    hint: 'Ganhe permanentemente um espaço de Estresse.',
    slots: [0, 0, 2, 2, 2],
    cost: 1,
  },
  {
    id: 'experiences',
    label: '+1 em duas Experiências',
    hint: 'Escolha duas Experiências e ganhe +1 permanente em cada.',
    slots: [0, 0, 1, 1, 1],
    cost: 1,
  },
  {
    id: 'domainCard',
    label: 'Carta de domínio extra',
    hint: 'Uma carta adicional do seu nível ou abaixo, dos domínios da sua classe.',
    slots: [0, 0, 1, 1, 1],
    cost: 1,
  },
  {
    id: 'evasion',
    label: '+1 de Evasão',
    hint: 'Ganhe +1 permanente na Evasão.',
    slots: [0, 0, 1, 1, 1],
    cost: 1,
  },
  {
    id: 'subclass',
    label: 'Carta de subclasse melhorada',
    hint: 'Pegue a Especialização (ou a Maestria, se já tiver a Especialização). Risca a multiclasse deste patamar.',
    slots: [0, 0, 0, 1, 1],
    cost: 1,
  },
  {
    id: 'proficiency',
    label: '+1 de Proficiência',
    hint: 'Gasta os dois avanços do nível. Você rola um dado de dano a mais.',
    slots: [0, 0, 0, 1, 1],
    cost: 2,
  },
  {
    id: 'multiclass',
    label: 'Multiclasse',
    hint: 'Gasta os dois avanços do nível. Ganhe outra classe, um domínio dela e a Fundação de uma subclasse.',
    slots: [0, 0, 0, 1, 1],
    cost: 2,
  },
  {
    id: 'comboDie',
    label: 'Aumentar o Dado de Combo',
    hint: 'Lutador: seu Dado de Combo sobe um passo (d4 → d6 → d8…). Uma vez por patamar.',
    slots: [0, 0, 1, 1, 1],
    cost: 1,
    classId: 'brawler',
  },
];

export const COMBO_DICE = ['d4', 'd6', 'd8', 'd10', 'd12'] as const;

/** Martial Artist stances by tier (SRD p. 13). Tier 1 lives in classes.ts. */
export const TIER2_STANCES = [
  {
    id: 'aggressive',
    name: 'Agressiva',
    nameEn: 'Aggressive',
    text: '−1 de Evasão. Num ataque bem-sucedido, role um dado de dano a mais e descarte o menor.',
  },
  {
    id: 'anchored',
    name: 'Ancorada',
    nameEn: 'Anchored',
    text: '+2 nos limiares de dano. Nesta postura, você não pode ser movido contra a vontade.',
  },
  {
    id: 'defensive',
    name: 'Defensiva',
    nameEn: 'Defensive',
    text: 'Ataques contra você vindos de Corpo a corpo têm desvantagem, a menos que o atacante marque 1 Estresse para anular.',
  },
  {
    id: 'otherworldly',
    name: 'Sobrenatural',
    nameEn: 'Otherworldly',
    text: 'Num ataque bem-sucedido, você pode causar dano físico ou mágico.',
  },
] as const;

/** Beastbound Ranger: one companion upgrade per level (SRD p. 22). */
export const COMPANION_UPGRADES = [
  {
    id: 'intelligent',
    name: 'Inteligente',
    text: '+1 permanente numa Experiência do companheiro à sua escolha.',
  },
  {
    id: 'light-in-the-dark',
    name: 'Luz na Escuridão',
    text: 'Um espaço de Esperança adicional que seu personagem pode marcar.',
  },
  {
    id: 'creature-comfort',
    name: 'Conforto Animal',
    text: 'Uma vez por descanso, num momento tranquilo dando carinho e atenção ao companheiro, você ganha 1 Esperança ou vocês dois limpam 1 Estresse.',
  },
  {
    id: 'armored',
    name: 'Blindado',
    text: 'Quando o companheiro sofrer dano, você pode marcar um Espaço de Armadura seu em vez de ele marcar Estresse.',
  },
  {
    id: 'vicious',
    name: 'Feroz',
    text: 'Aumente um passo o dado de dano ou o alcance do companheiro (d6→d8, Perto→Longe…).',
  },
  {
    id: 'resilient',
    name: 'Resistente',
    text: 'O companheiro ganha um espaço de Estresse adicional.',
  },
  {
    id: 'bonded',
    name: 'Vínculo',
    text: 'Quando você marcar seu último PV, o companheiro corre para te confortar: role d6 iguais aos Estresse livres dele e marque-os. Com algum 6, ele te ajuda a levantar: limpe seu último PV e volte à cena.',
  },
  { id: 'aware', name: 'Atento', text: '+2 permanente na Evasão do companheiro.' },
] as const;
