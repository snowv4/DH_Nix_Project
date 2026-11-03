import { SrdAdversary } from '../data/srd/adversaries-tier1';
import { createNpc, Npc } from '../models/npc';

const TYPE_TAG: Record<string, string> = { horde: 'horda', minion: 'lacaio', solo: 'solo' };

/**
 * Turns an SRD stat block into an editable NPC sheet. Minions have no thresholds in the SRD;
 * they are stored as 0 so the sheet shows "—". A missing Severe threshold is stored as 0 too.
 */
export function npcFromAdversary(adv: SrdAdversary, id: string, now = Date.now()): Npc {
  const base = createNpc(id, adv.name, now);
  const horde = adv.hordeHp ? `Horda (${adv.hordeHp}/PV)` : '';
  return {
    ...base,
    type: adv.type,
    tier: 1,
    difficulty: adv.difficulty,
    thresholds: { major: adv.thresholds.major ?? 0, severe: adv.thresholds.severe ?? 0 },
    hp: { max: adv.hp, marked: 0 },
    stress: { max: adv.stress, marked: 0 },
    attack: { ...adv.attack },
    experiences: adv.experiences,
    features: horde ? `${horde}\n${adv.features}` : adv.features,
    description: adv.description,
    motives: adv.motives,
    icon: adv.icon,
    tags: ['srd', TYPE_TAG[adv.type] ?? ''].filter(Boolean).join(', '),
  };
}

/** Lowercase, accent-free text for search. */
export function searchKey(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/** Filters the catalog by pt-BR or English name, motives and type. */
export function searchAdversaries(
  list: readonly SrdAdversary[],
  query: string,
  type = '',
): SrdAdversary[] {
  const q = searchKey(query.trim());
  return list.filter(
    (a) =>
      (!type || a.type === type) &&
      (!q || searchKey(`${a.name} ${a.nameEn} ${a.motives}`).includes(q)),
  );
}
