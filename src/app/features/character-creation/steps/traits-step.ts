import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TRAIT_HINTS, TRAIT_LABELS } from '../../../core/data/traits';
import { TRAIT_IDS, TraitId } from '../../../core/models/character';
import { assignTrait, remainingTraitValues, spellcastTrait } from '../../../core/rules/creation';
import { CreationStore } from '../creation.store';

@Component({
  selector: 'app-traits-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="text-muted">
      Distribua os modificadores <strong class="text-white">+2, +1, +1, +0, +0 e −1</strong>, um em
      cada atributo. Toque num valor; se ele já estiver em uso, os atributos trocam.
    </p>
    <p class="mt-2 rounded-lg bg-panel-2 px-3 py-2 text-sm" aria-live="polite">
      Faltam: <strong class="text-hope">{{ remainingLabel() }}</strong>
    </p>
    @if (cast(); as t) {
      <p class="mt-2 text-sm text-muted">
        Dica: sua subclasse conjura com <strong class="text-white">{{ labels[t] }}</strong
        >.
      </p>
    }
    <div class="mt-4 flex flex-col gap-3">
      @for (t of traitIds; track t) {
        <div class="card flex flex-col gap-2">
          <div class="flex items-baseline justify-between gap-2">
            <h3 class="font-bold">{{ labels[t] }}</h3>
            <span class="font-display text-2xl" [class.text-muted]="value(t) === undefined">{{
              display(t)
            }}</span>
          </div>
          <p class="text-xs text-muted">{{ hints[t] }}</p>
          <div
            class="grid grid-cols-4 gap-1"
            role="group"
            [attr.aria-label]="'Valor de ' + labels[t]"
          >
            @for (v of options; track v) {
              <button
                type="button"
                class="btn border border-line p-0"
                [class.bg-hope]="value(t) === v"
                [class.text-ink]="value(t) === v"
                [attr.aria-pressed]="value(t) === v"
                (click)="set(t, v)"
              >
                {{ signed(v) }}
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class TraitsStep {
  protected readonly store = inject(CreationStore);
  protected readonly traitIds = TRAIT_IDS;
  protected readonly labels = TRAIT_LABELS;
  protected readonly hints = TRAIT_HINTS;
  protected readonly options = [2, 1, 0, -1];
  protected readonly cast = computed(() => spellcastTrait(this.store.draft()));
  protected readonly remainingLabel = computed(() => {
    const left = remainingTraitValues(this.store.draft().traits);
    return left.length ? left.map((v) => this.signed(v)).join(', ') : 'nada — tudo certo!';
  });

  protected value(t: TraitId): number | undefined {
    return this.store.draft().traits[t];
  }

  protected display(t: TraitId): string {
    const v = this.value(t);
    return v === undefined ? '—' : this.signed(v);
  }

  protected set(t: TraitId, v: number): void {
    this.store.update({ traits: assignTrait(this.store.draft().traits, t, v) });
  }

  protected signed(n: number): string {
    return n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '+0';
  }
}
