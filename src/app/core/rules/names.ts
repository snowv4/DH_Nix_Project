/** Returns an integer in [0, n). Injected so tests are deterministic. */
export type RandomIndex = (n: number) => number;

/** crypto.getRandomValues with rejection sampling (CLAUDE.md: never Math.random). */
export const cryptoIndex: RandomIndex = (n) => {
  const limit = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % n;
};

export const NAME_STYLES = [
  { id: 'human', label: 'Humano' },
  { id: 'elf', label: 'Élfico' },
  { id: 'dwarf', label: 'Anão' },
  { id: 'orc', label: 'Orc' },
  { id: 'goblin', label: 'Goblin / Halfling' },
  { id: 'fae', label: 'Feérico' },
  { id: 'infernal', label: 'Infernal' },
] as const;

export type NameStyle = (typeof NAME_STYLES)[number]['id'];

// Syllables tuned per culture: start + optional middle + end.
const SYLLABLES: Record<NameStyle, { start: string[]; middle: string[]; end: string[] }> = {
  human: {
    start: [
      'Al',
      'Bran',
      'Cael',
      'Da',
      'Ed',
      'Fen',
      'Gar',
      'Hal',
      'Isa',
      'Jor',
      'Lu',
      'Mar',
      'Ne',
      'Os',
      'Ra',
      'Se',
      'Tal',
      'Vi',
      'Wil',
    ],
    middle: ['', '', 'a', 'e', 'i', 'o', 'ri', 'la'],
    end: ['ric', 'na', 'win', 'den', 'mira', 'ton', 'ra', 'el', 'ius', 'ia', 'bert', 'tha'],
  },
  elf: {
    start: ['Ae', 'Ca', 'El', 'Fae', 'Gal', 'Il', 'Lae', 'Mel', 'Nai', 'Syl', 'Tha', 'Vae', 'Yl'],
    middle: ['', 'a', 'ri', 'la', 'the', 'lo', 'ae'],
    end: [
      'driel',
      'wen',
      'lith',
      'thas',
      'riel',
      'nor',
      'las',
      'ndra',
      'mir',
      'sae',
      'thil',
      'iel',
    ],
  },
  dwarf: {
    start: ['Bal', 'Bom', 'Dur', 'Gim', 'Thor', 'Brun', 'Har', 'Kil', 'Mor', 'Rur', 'Thra', 'Dag'],
    middle: ['', '', 'a', 'o', 'u'],
    end: ['in', 'grim', 'dak', 'rik', 'bur', 'gar', 'ni', 'dra', 'mund', 'hild', 'na'],
  },
  orc: {
    start: ['Gro', 'Ur', 'Mak', 'Thra', 'Dur', 'Kra', 'Rok', 'Zug', 'Bru', 'Ghor', 'Shak'],
    middle: ['', '', 'a', 'u', 'o'],
    end: ['mash', 'gul', 'nak', 'rok', 'tha', 'zog', 'gar', 'dush', 'ka', 'ruk'],
  },
  goblin: {
    start: ['Bim', 'Fiz', 'Nib', 'Pip', 'Snik', 'Tob', 'Wib', 'Zib', 'Mog', 'Rin', 'Dob'],
    middle: ['', '', 'ble', 'ri', 'pi', 'o'],
    end: ['wick', 'bit', 'ble', 'gle', 'nok', 'zle', 'kin', 'ny', 'pot', 'sy'],
  },
  fae: {
    start: ['Bri', 'Fen', 'Lu', 'Mo', 'Nim', 'Pe', 'Quil', 'Sel', 'Tin', 'Wy', 'Zi'],
    middle: ['', 'a', 'ri', 'li', 'na'],
    end: ['wyn', 'thistle', 'bell', 'nella', 'quill', 'mirth', 'dew', 'shade', 'lark', 'ra'],
  },
  infernal: {
    start: ['Az', 'Bel', 'Ka', 'Mal', 'Ner', 'Sar', 'Vel', 'Xa', 'Zar', 'Ira', 'Mor'],
    middle: ['', 'a', 'ra', 'ze', 'xi', 'go'],
    end: ['zeth', 'goth', 'phas', 'rael', 'kas', 'mon', 'thar', 'iel', 'vex', 'ria'],
  },
};

const SURNAME_PARTS = {
  first: [
    'Pedra',
    'Corvo',
    'Sombra',
    'Ferro',
    'Cinza',
    'Brasa',
    'Névoa',
    'Espinho',
    'Lua',
    'Raiz',
    'Trovão',
    'Prata',
    'Sete',
    'Folha',
  ],
  second: [
    '-Fria',
    '-Negra',
    '-Funda',
    '-Velha',
    '-Torta',
    '-Alta',
    '-Rubra',
    '-Mansa',
    '-Raízes',
    '-Ventos',
    '-Ponte',
    '-Brava',
  ],
};

const EPITHETS = [
  'o Ruivo',
  'a Silenciosa',
  'o Velho',
  'Mão-Leve',
  'Olho-de-Corvo',
  'o Justo',
  'a Ardilosa',
  'Dente-Quebrado',
  'o Errante',
  'a Implacável',
  'Língua-de-Prata',
  'o Gentil',
];

function pick<T>(list: readonly T[], rand: RandomIndex): T {
  return list[rand(list.length)];
}

/** One fantasy name in the given style, with a surname or epithet most of the time. */
export function randomName(style: NameStyle, rand: RandomIndex = cryptoIndex): string {
  const s = SYLLABLES[style];
  const given = pick(s.start, rand) + pick(s.middle, rand) + pick(s.end, rand);
  const roll = rand(10);
  if (roll < 5)
    return `${given} ${pick(SURNAME_PARTS.first, rand)}${pick(SURNAME_PARTS.second, rand)}`;
  if (roll < 8) return `${given} ${pick(EPITHETS, rand)}`;
  return given;
}
