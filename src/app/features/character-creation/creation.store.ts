import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { CharacterRepository } from '../../core/firebase/character.repository';
import { DraftRepository } from '../../core/firebase/draft.repository';
import { createEmptyDraft, CreationDraft } from '../../core/models/creation';
import {
  buildCharacter,
  CREATION_STEPS,
  deriveStats,
  firstIncompleteStep,
  StepId,
  stepError,
} from '../../core/rules/creation';

const SAVE_DELAY_MS = 800;

/**
 * State of one wizard run. Provided by the creation page (not root), so each visit starts
 * clean and the pending save is flushed when the page is destroyed.
 */
@Injectable()
export class CreationStore {
  private readonly drafts = inject(DraftRepository);
  private readonly characters = inject(CharacterRepository);

  private id = '';
  private saveTimer: ReturnType<typeof setTimeout> | undefined;

  readonly draft = signal<CreationDraft>(createEmptyDraft(''));
  readonly loaded = signal(false);
  readonly saving = signal(false);
  readonly stepIndex = signal(0);

  readonly step = computed(() => CREATION_STEPS[this.stepIndex()]);
  readonly error = computed(() => stepError(this.step().id, this.draft()));
  readonly stats = computed(() => deriveStats(this.draft()));
  readonly progress = computed(() => ((this.stepIndex() + 1) / CREATION_STEPS.length) * 100);

  constructor() {
    inject(DestroyRef).onDestroy(() => void this.flush());
  }

  async load(id: string, name: string): Promise<void> {
    this.id = id;
    const saved = await this.drafts.load(id);
    const draft = saved ?? createEmptyDraft(name);
    this.draft.set(draft);
    // Resume where the player stopped: the first step that still needs input.
    const resumeAt = CREATION_STEPS.findIndex((s) => s.id === firstIncompleteStep(draft));
    this.stepIndex.set(saved ? Math.max(0, resumeAt) : 0);
    if (!saved) await this.drafts.save(id, draft);
    this.loaded.set(true);
  }

  update(patch: Partial<CreationDraft>): void {
    this.draft.update((d) => ({ ...d, ...patch }));
    this.scheduleSave();
  }

  updateChoices(patch: Partial<CreationDraft['classChoices']>): void {
    this.update({ classChoices: { ...this.draft().classChoices, ...patch } });
  }

  goTo(step: StepId): void {
    this.stepIndex.set(CREATION_STEPS.findIndex((s) => s.id === step));
  }

  next(): void {
    if (this.error()) return;
    this.stepIndex.update((i) => Math.min(CREATION_STEPS.length - 1, i + 1));
  }

  back(): void {
    this.stepIndex.update((i) => Math.max(0, i - 1));
  }

  /** Creates the real sheet and deletes the draft. Returns the character id. */
  async finish(): Promise<string> {
    clearTimeout(this.saveTimer);
    const character = buildCharacter(this.draft());
    // The id was fixed at login; keep it even if the display name gained accents/case.
    await this.characters.create({ ...character, id: this.id });
    await this.drafts.remove(this.id);
    return this.id;
  }

  private scheduleSave(): void {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => void this.flush(), SAVE_DELAY_MS);
  }

  private async flush(): Promise<void> {
    clearTimeout(this.saveTimer);
    this.saveTimer = undefined;
    if (!this.id || !this.loaded()) return;
    this.saving.set(true);
    try {
      await this.drafts.save(this.id, this.draft());
    } finally {
      this.saving.set(false);
    }
  }
}
