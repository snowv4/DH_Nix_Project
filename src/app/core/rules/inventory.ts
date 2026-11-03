import { InventoryItem, ItemCategory } from '../models/character';

export const ITEM_CATEGORIES: { id: ItemCategory; label: string; icon: string }[] = [
  { id: 'consumable', label: 'Consumível', icon: '🧪' },
  { id: 'weapon', label: 'Arma', icon: '⚔️' },
  { id: 'gear', label: 'Equipamento', icon: '🎒' },
  { id: 'treasure', label: 'Tesouro', icon: '💎' },
  { id: 'other', label: 'Outros', icon: '📜' },
];

const GUESSES: [RegExp, ItemCategory][] = [
  [/po[cç][aã]o|elixir|ant[ií]doto|ra[cç][aã]o|comida|veneno/i, 'consumable'],
  [/espada|adaga|arco|besta|machad|lan[cç]a|ma[cç]a|cajado|martelo|faca|chicote/i, 'weapon'],
  [/ouro|gema|joia|j[oó]ia|anel|colar|moeda|tesouro|[aâ]mbar/i, 'treasure'],
  [/tocha|corda|suprimento|kit|mochila|gancho|ferramenta|lanterna|saco|cantil|livro/i, 'gear'],
];

export function guessCategory(name: string): ItemCategory {
  return GUESSES.find(([re]) => re.test(name))?.[1] ?? 'other';
}

/** "Poção de Vida Menor (Limpa 1d4 PV.)" → name + note; "3x Tocha" / "Tocha x3" → qty 3. */
export function parseItemLine(line: string, id: string): InventoryItem {
  let text = line.trim();
  let qty = 1;
  const lead = /^(\d+)\s*x\s*(.+)$/i.exec(text);
  const trail = /^(.+?)\s*x\s*(\d+)$/i.exec(text);
  if (lead) {
    qty = Number(lead[1]);
    text = lead[2];
  } else if (trail) {
    qty = Number(trail[2]);
    text = trail[1];
  }
  const paren = /^(.*?)\s*\((.+)\)$/.exec(text);
  const name = (paren ? paren[1] : text).trim();
  const note = paren ? paren[2].trim() : '';
  return { id, name, qty, category: guessCategory(name), note };
}

/** Converts the legacy text inventory, one item per non-empty line. */
export function itemsFromText(text: string, makeId: (i: number) => string): InventoryItem[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l, i) => parseItemLine(l, makeId(i)));
}

/** The structured list if present, otherwise the converted legacy text. */
export function currentInventory(c: {
  inventory?: InventoryItem[];
  items: string;
}): InventoryItem[] {
  return c.inventory ?? itemsFromText(c.items, (i) => `legacy-${i}`);
}

export function useItem(items: InventoryItem[], id: string): InventoryItem[] {
  return items.map((it) => (it.id === id ? { ...it, qty: Math.max(0, it.qty - 1) } : it));
}

export function moveItem(items: InventoryItem[], id: string, delta: -1 | 1): InventoryItem[] {
  const i = items.findIndex((it) => it.id === id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= items.length) return items;
  const next = [...items];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}
