import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import {
  COMPANION_EXPERIENCES,
  ELEMENTS,
  PATRON_SPHERES,
  TIER1_STANCES,
} from '../../../core/data/srd';
import { TRAIT_LABELS } from '../../../core/data/traits';
import { selectedClass, STANCES_AT_CREATION } from '../../../core/rules/creation';
import { CreationStore } from '../creation.store';

@Component({
  selector: 'app-subclass-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (cls(); as c) {
      <p class="text-muted">
        Cada classe tem duas subclasses. Você ganha a característica de Fundação agora; as outras
        vêm ao subir de nível.
      </p>
      <div class="mt-4 flex flex-col gap-3">
        @for (s of c.subclasses; track s.id) {
          @let selected = store.draft().subclassId === s.id;
          <button
            type="button"
            class="card flex flex-col gap-2 text-left transition"
            [class.!border-hope]="selected"
            [attr.aria-pressed]="selected"
            (click)="store.update({ subclassId: s.id, domainCardIds: [] })"
          >
            <div class="flex items-start justify-between gap-2">
              <h3 class="font-display text-lg font-bold">
                {{ s.name }} <span class="text-sm font-normal text-muted">({{ s.nameEn }})</span>
              </h3>
              @if (selected) {
                <span class="rounded-full bg-hope px-2 py-0.5 text-xs font-bold text-ink"
                  >Escolhida</span
                >
              }
            </div>
            <p class="text-sm text-muted">{{ s.pitch }}</p>
            <p class="text-sm">
              Atributo de Conjuração:
              <strong>{{
                s.spellcastTrait ? traitLabels[s.spellcastTrait] : 'nenhum (não usa armas mágicas)'
              }}</strong>
            </p>
            @for (f of s.foundation; track f.nameEn) {
              <p class="whitespace-pre-line text-sm">
                <strong class="text-hope">{{ f.name }}:</strong> {{ f.text }}
              </p>
            }
          </button>
        }
      </div>

      @for (choice of activeChoices(); track choice.kind) {
        <section class="card mt-4 flex flex-col gap-3 !border-fear/60">
          @switch (choice.kind) {
            @case ('element') {
              <h3 class="label">Elementalista: escolha seu elemento</h3>
              <div class="flex flex-wrap gap-2">
                @for (e of elements; track e) {
                  <button
                    type="button"
                    class="btn-ghost"
                    [class.!border-hope]="choices().element === e"
                    [attr.aria-pressed]="choices().element === e"
                    (click)="store.updateChoices({ element: e })"
                  >
                    {{ e }}
                  </button>
                }
              </div>
            }
            @case ('patron') {
              <h3 class="label">Pacto do Patrono</h3>
              <label class="flex flex-col gap-1 text-sm">
                Nome do patrono
                <input
                  class="field"
                  [value]="choices().patronName"
                  (input)="store.updateChoices({ patronName: value($event) })"
                  placeholder="Ex.: A Dama das Cinzas"
                />
              </label>
              <label class="flex flex-col gap-1 text-sm">
                Esfera de influência
                <input
                  class="field"
                  list="spheres"
                  [value]="choices().patronSphere"
                  (input)="store.updateChoices({ patronSphere: value($event) })"
                  placeholder="Escolha ou escreva"
                />
                <datalist id="spheres">
                  @for (s of spheres; track s) {
                    <option [value]="s"></option>
                  }
                </datalist>
              </label>
              <p class="text-xs text-muted">
                Combine os detalhes com o mestre. Você começa com 3 Favores.
              </p>
            }
            @case ('stances') {
              <h3 class="label">
                Artista Marcial: escolha {{ stanceCount }} posturas do Patamar 1
              </h3>
              @for (s of stances; track s.id) {
                @let on = choices().stances.includes(s.id);
                <button
                  type="button"
                  class="rounded-xl border border-line bg-panel-2 p-3 text-left text-sm"
                  [class.!border-hope]="on"
                  [attr.aria-pressed]="on"
                  (click)="toggleStance(s.id)"
                >
                  <strong>{{ s.name }}</strong>
                  <span class="text-muted">&ngsp;({{ s.nameEn }})</span><br />{{ s.text }}
                </button>
              }
            }
            @case ('companion') {
              <h3 class="label">Seu companheiro animal</h3>
              <div class="grid grid-cols-2 gap-2">
                <label class="flex flex-col gap-1 text-sm">
                  Nome
                  <input
                    class="field"
                    [value]="choices().companionName"
                    (input)="store.updateChoices({ companionName: value($event) })"
                  />
                </label>
                <label class="flex flex-col gap-1 text-sm">
                  Que animal?
                  <input
                    class="field"
                    [value]="choices().companionAnimal"
                    (input)="store.updateChoices({ companionAnimal: value($event) })"
                    placeholder="Ex.: lobo"
                  />
                </label>
              </div>
              @for (i of [0, 1]; track i) {
                <label class="flex flex-col gap-1 text-sm">
                  Experiência {{ i + 1 }} (+2)
                  <input
                    class="field"
                    list="companion-exp"
                    [value]="choices().companionExperiences[i]"
                    (input)="setCompanionExp(i, value($event))"
                  />
                </label>
              }
              <datalist id="companion-exp">
                @for (e of companionExperiences; track e) {
                  <option [value]="e"></option>
                }
              </datalist>
              <div class="flex gap-2 text-sm">
                Dano (d6, Corpo a corpo):
                <button
                  type="button"
                  class="btn-ghost min-h-9 text-sm"
                  [class.!border-hope]="choices().companionDamageType === 'phy'"
                  (click)="store.updateChoices({ companionDamageType: 'phy' })"
                >
                  Físico
                </button>
                <button
                  type="button"
                  class="btn-ghost min-h-9 text-sm"
                  [class.!border-hope]="choices().companionDamageType === 'mag'"
                  (click)="store.updateChoices({ companionDamageType: 'mag' })"
                >
                  Mágico
                </button>
              </div>
            }
            @case ('strangePatterns') {
              <h3 class="label">Padrões Estranhos: escolha um número de 1 a 12</h3>
              <div class="grid grid-cols-6 gap-1">
                @for (n of numbers; track n) {
                  <button
                    type="button"
                    class="btn-ghost p-0"
                    [class.!border-hope]="choices().strangeNumber === n"
                    [attr.aria-pressed]="choices().strangeNumber === n"
                    (click)="store.updateChoices({ strangeNumber: n })"
                  >
                    {{ n }}
                  </button>
                }
              </div>
            }
          }
        </section>
      }
    }
  `,
})
export class SubclassStep {
  protected readonly store = inject(CreationStore);
  protected readonly traitLabels = TRAIT_LABELS;
  protected readonly elements = ELEMENTS;
  protected readonly spheres = PATRON_SPHERES;
  protected readonly stances = TIER1_STANCES;
  protected readonly stanceCount = STANCES_AT_CREATION;
  protected readonly companionExperiences = COMPANION_EXPERIENCES;
  protected readonly numbers = Array.from({ length: 12 }, (_, i) => i + 1);

  protected readonly cls = computed(() => selectedClass(this.store.draft()));
  protected readonly choices = computed(() => this.store.draft().classChoices);
  protected readonly activeChoices = computed(() =>
    (this.cls()?.choices ?? []).filter(
      (c) => !c.subclassId || c.subclassId === this.store.draft().subclassId,
    ),
  );

  protected value(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }

  protected toggleStance(id: string): void {
    const cur = this.choices().stances;
    const next = cur.includes(id)
      ? cur.filter((s) => s !== id)
      : [...cur, id].slice(-STANCES_AT_CREATION);
    this.store.updateChoices({ stances: next });
  }

  protected setCompanionExp(i: number, v: string): void {
    const exps: [string, string] = [...this.choices().companionExperiences];
    exps[i] = v;
    this.store.updateChoices({ companionExperiences: exps });
  }
}
