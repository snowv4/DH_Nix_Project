import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { EXAMPLE_EXPERIENCES } from '../../../core/data/srd';
import { hasClankDesign } from '../../../core/rules/creation';
import { CreationStore } from '../creation.store';

@Component({
  selector: 'app-experiences-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="text-muted">
      Uma Experiência é uma palavra ou frase que resume habilidades, traços ou vivências do
      personagem. Ao fazer uma rolagem em que ela ajude, você pode gastar 1 Esperança para somar o
      bônus (+2).
    </p>
    <p class="mt-2 text-sm text-muted">
      Não vale algo amplo demais (“Sortudo”, “Muito Habilidoso”) nem algo que dê poderes (“Voo
      Supersônico”, “Invulnerável”).
    </p>

    <div class="mt-4 flex flex-col gap-3">
      @for (i of [0, 1]; track i) {
        <label class="flex flex-col gap-1">
          <span class="label">Experiência {{ i + 1 }} · +{{ bonus(i) }}</span>
          <input
            class="field"
            [value]="draft().experiences[i]"
            (input)="set(i, value($event))"
            placeholder="Ex.: Criado nas ruas"
          />
          <input
            class="field text-sm"
            [value]="draft().experienceNotes?.[i] ?? ''"
            (input)="setNote(i, value($event))"
            placeholder="Quando usar? Ex.: perceber golpes e mentiras (opcional)"
            [attr.aria-label]="'Quando usar a Experiência ' + (i + 1)"
          />
        </label>
      }
    </div>

    @if (clank()) {
      <div class="card mt-4 !border-hope/60 text-sm">
        <p class="label">Propósito de Fábrica (Clank)</p>
        <p class="mt-1 text-muted">
          Qual Experiência combina com o propósito para o qual você foi feito? Ela ganha +1.
        </p>
        <div class="mt-2 grid grid-cols-2 gap-2">
          @for (i of [0, 1]; track i) {
            <button
              type="button"
              class="btn-ghost text-sm"
              [class.!border-hope]="draft().clankBonusIndex === i"
              [attr.aria-pressed]="draft().clankBonusIndex === i"
              (click)="store.update({ clankBonusIndex: i })"
            >
              {{ draft().experiences[i] || 'Experiência ' + (i + 1) }}
            </button>
          }
        </div>
      </div>
    }

    <h3 class="label mt-5">Exemplos (toque para usar)</h3>
    @for (g of examples; track g.group) {
      <p class="mt-3 text-sm font-semibold text-muted">{{ g.group }}</p>
      <div class="mt-1 flex flex-wrap gap-1.5">
        @for (e of g.items; track e) {
          <button
            type="button"
            class="min-h-9 rounded-full border border-line bg-panel px-3 text-sm hover:border-hope"
            (click)="use(e)"
          >
            {{ e }}
          </button>
        }
      </div>
    }
  `,
})
export class ExperiencesStep {
  protected readonly store = inject(CreationStore);
  protected readonly draft = this.store.draft;
  protected readonly examples = EXAMPLE_EXPERIENCES;
  protected readonly clank = computed(() => hasClankDesign(this.draft()));

  protected bonus(i: number): number {
    return 2 + (this.clank() && this.draft().clankBonusIndex === i ? 1 : 0);
  }

  protected value(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }

  protected set(i: number, v: string): void {
    const exps: [string, string] = [this.draft().experiences[0], this.draft().experiences[1]];
    exps[i] = v;
    this.store.update({ experiences: exps });
  }

  protected setNote(i: number, v: string): void {
    const notes: [string, string] = [...(this.draft().experienceNotes ?? ['', ''])];
    notes[i] = v;
    this.store.update({ experienceNotes: notes });
  }

  /** Fills the first empty slot, or replaces the second when both are filled. */
  protected use(e: string): void {
    const [a, b] = this.draft().experiences;
    this.set(!a.trim() ? 0 : !b.trim() ? 1 : 1, e);
  }
}
