import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { selectedClass } from '../../../core/rules/creation';
import { CreationStore } from '../creation.store';

@Component({
  selector: 'app-story-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="text-muted">
      A história não tem efeito mecânico, mas muda muito quem você vai interpretar. Responda o que
      quiser — pode deixar mistérios para descobrir em jogo.
    </p>
    <div class="mt-4 flex flex-col gap-3">
      <label class="flex flex-col gap-1">
        <span class="label">Nome</span>
        <input
          class="field"
          [value]="draft().name"
          (input)="store.update({ name: value($event) })"
        />
      </label>
      <label class="flex flex-col gap-1">
        <span class="label">Pronomes</span>
        <input
          class="field"
          [value]="draft().pronouns"
          (input)="store.update({ pronouns: value($event) })"
          placeholder="Ex.: ela/dela"
        />
      </label>
      <label class="flex flex-col gap-1">
        <span class="label">Aparência</span>
        <textarea
          class="field min-h-24"
          [value]="draft().appearance"
          (input)="store.update({ appearance: value($event) })"
          placeholder="Roupas, olhos, corpo, jeito de se mover…"
        ></textarea>
      </label>
      @for (q of questions(); track $index; let i = $index) {
        <label class="flex flex-col gap-1">
          <span class="text-sm font-semibold">{{ q }}</span>
          <textarea
            class="field min-h-24"
            [value]="draft().backgroundAnswers[i] ?? ''"
            (input)="answer(i, value($event))"
          ></textarea>
        </label>
      }
    </div>
  `,
})
export class StoryStep {
  protected readonly store = inject(CreationStore);
  protected readonly draft = this.store.draft;
  protected readonly questions = computed(
    () => selectedClass(this.draft())?.backgroundQuestions ?? [],
  );

  protected value(e: Event): string {
    return (e.target as HTMLInputElement | HTMLTextAreaElement).value;
  }

  protected answer(i: number, v: string): void {
    const answers = [...this.draft().backgroundAnswers];
    while (answers.length <= i) answers.push('');
    answers[i] = v;
    this.store.update({ backgroundAnswers: answers });
  }
}
