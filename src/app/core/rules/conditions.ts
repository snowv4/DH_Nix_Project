import { CONDITION_BY_ID } from '../data/conditions';
import { ConditionTag } from '../models/character';

export interface ConditionView {
  key: string;
  label: string;
  icon: string;
  summary: string;
  custom: boolean;
}

/** Turns a stored tag into what the UI shows; unknown ids are dropped. */
export function conditionView(tag: ConditionTag): ConditionView | undefined {
  if (tag.label) {
    return {
      key: tag.id,
      label: tag.label,
      icon: tag.icon ?? '📌',
      summary: 'Marcador personalizado',
      custom: true,
    };
  }
  const def = CONDITION_BY_ID.get(tag.id);
  return (
    def && { key: def.id, label: def.label, icon: def.icon, summary: def.summary, custom: false }
  );
}

export function conditionViews(tags: readonly ConditionTag[] | undefined): ConditionView[] {
  return (tags ?? []).map(conditionView).filter((v): v is ConditionView => !!v);
}

/** Adds the condition, or removes it if already there (the same condition can't stack). */
export function toggleCondition(
  tags: readonly ConditionTag[] | undefined,
  tag: ConditionTag,
): ConditionTag[] {
  const list = tags ?? [];
  return list.some((t) => t.id === tag.id) ? list.filter((t) => t.id !== tag.id) : [...list, tag];
}

/** A custom marker with a unique id; blank names are rejected. */
export function customMarker(
  label: string,
  icon: string,
  now = Date.now(),
): ConditionTag | undefined {
  const name = label.trim().slice(0, 24);
  return name ? { id: `custom-${now.toString(36)}`, label: name, icon } : undefined;
}
