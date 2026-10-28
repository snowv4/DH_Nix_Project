import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
} from '@angular/core';
import { CharacterRepository } from '../../../core/firebase/character.repository';
import { Character } from '../../../core/models/character';
import { selectedClass } from '../../../core/rules/creation';
import { CreationStore } from '../creation.store';

@Component({
  selector: 'app-connections-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="text-muted">
      Vínculos são as relações entre os personagens. Na mesa, cada um apresenta seu personagem e
      vocês sugerem conexões — aceite as que quiser explorar. Use as perguntas como inspiração.
    </p>

    <div class="card mt-4 text-sm">
      <p class="label">Quem já está na mesa</p>
      @if (others().length) {
        <ul class="mt-2 flex flex-col gap-1">
          @for (c of others(); track c.id) {
            <li>
              <strong>{{ c.name }}</strong> <span class="text-muted">&ngsp;— {{ summary(c) }}</span>
            </li>
          }
        </ul>
      } @else {
        <p class="mt-1 text-muted">Ninguém ainda. Você pode voltar aqui depois pela ficha.</p>
      }
    </div>

    <div class="mt-4 flex flex-col gap-3">
      @for (q of questions(); track $index; let i = $index) {
        <label class="flex flex-col gap-1">
          <span class="text-sm font-semibold">{{ q }}</span>
          <textarea
            class="field min-h-20"
            [value]="store.draft().connectionAnswers[i] ?? ''"
            (input)="answer(i, value($event))"
            placeholder="Para quem você pergunta? O que responderam?"
          ></textarea>
        </label>
      }
      <label class="flex flex-col gap-1">
        <span class="label">Outras conexões</span>
        <textarea
          class="field min-h-20"
          [value]="store.draft().connectionNotes"
          (input)="store.update({ connectionNotes: value($event) })"
        ></textarea>
      </label>
    </div>
  `,
})
export class ConnectionsStep {
  readonly characterId = input.required<string>();
  protected readonly store = inject(CreationStore);
  private readonly all = inject(CharacterRepository).watchAll(inject(DestroyRef));
  protected readonly others = computed(() => this.all().filter((c) => c.id !== this.characterId()));
  protected readonly questions = computed(
    () => selectedClass(this.store.draft())?.connectionQuestions ?? [],
  );

  protected summary(c: Character): string {
    return [c.ancestry, c.subclass].filter((s) => s.trim()).join(' · ') || 'ficha manual';
  }

  protected value(e: Event): string {
    return (e.target as HTMLTextAreaElement).value;
  }

  protected answer(i: number, v: string): void {
    const answers = [...this.store.draft().connectionAnswers];
    while (answers.length <= i) answers.push('');
    answers[i] = v;
    this.store.update({ connectionAnswers: answers });
  }
}
