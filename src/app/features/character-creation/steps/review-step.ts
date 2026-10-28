import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { findClass } from '../../../core/data/srd';
import { TRAIT_LABELS } from '../../../core/data/traits';
import { TRAIT_IDS } from '../../../core/models/character';
import { buildCharacter, firstIncompleteStep, StepId } from '../../../core/rules/creation';
import { CreationStore } from '../creation.store';

@Component({
  selector: 'app-review-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let c = preview();
    <p class="text-muted">Confira tudo. Toque em “Editar” para voltar a qualquer passo.</p>
    @if (missing() !== 'review') {
      <p class="mt-3 rounded-lg bg-hp/15 px-3 py-2 text-sm text-hp" role="alert">
        Falta completar um passo.
        <button type="button" class="underline" (click)="edit.emit(missing())">Ir para ele</button>
      </p>
    }

    <section class="card mt-4">
      <div class="flex items-start justify-between gap-2">
        <div>
          <h3 class="font-display text-2xl font-bold">{{ c.name || 'Sem nome' }}</h3>
          <p class="text-sm text-muted">
            Nível 1 · {{ className() }} · {{ c.subclass }}<br />{{ c.ancestry }} · {{ c.community
            }}{{ c.pronouns ? ' · ' + c.pronouns : '' }}
          </p>
        </div>
        <button type="button" class="btn-ghost min-h-9 text-sm" (click)="edit.emit('class')">
          Editar
        </button>
      </div>
      <div class="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
        <div class="rounded-lg bg-panel-2 p-2">
          <p class="text-muted">Evasão</p>
          <p class="font-display text-2xl">{{ c.evasion }}</p>
        </div>
        <div class="rounded-lg bg-panel-2 p-2">
          <p class="text-muted">PV</p>
          <p class="font-display text-2xl text-hp">{{ c.hp.max }}</p>
        </div>
        <div class="rounded-lg bg-panel-2 p-2">
          <p class="text-muted">Estresse</p>
          <p class="font-display text-2xl text-stress">{{ c.stress.max }}</p>
        </div>
        <div class="rounded-lg bg-panel-2 p-2">
          <p class="text-muted">Esperança</p>
          <p class="font-display text-2xl text-hope">{{ c.hope.current }}</p>
        </div>
        <div class="rounded-lg bg-panel-2 p-2">
          <p class="text-muted">Armadura</p>
          <p class="font-display text-2xl">{{ c.armor.score }}</p>
        </div>
        <div class="rounded-lg bg-panel-2 p-2">
          <p class="text-muted">Limiares</p>
          <p class="font-display text-2xl">{{ c.thresholds.major }}/{{ c.thresholds.severe }}</p>
        </div>
      </div>
    </section>

    <section class="card mt-3 text-sm">
      <div class="flex items-center justify-between">
        <h3 class="label">Atributos</h3>
        <button type="button" class="btn-ghost min-h-9 text-sm" (click)="edit.emit('traits')">
          Editar
        </button>
      </div>
      <div class="mt-2 grid grid-cols-3 gap-2 text-center">
        @for (t of traitIds; track t) {
          <div class="rounded-lg bg-panel-2 p-2">
            <p class="text-xs text-muted">{{ traitLabels[t] }}</p>
            <p class="font-display text-xl">{{ signed(c.traits[t]) }}</p>
          </div>
        }
      </div>
    </section>

    <section class="card mt-3 text-sm">
      <div class="flex items-center justify-between">
        <h3 class="label">Equipamento</h3>
        <button type="button" class="btn-ghost min-h-9 text-sm" (click)="edit.emit('equipment')">
          Editar
        </button>
      </div>
      <p class="mt-2">{{ c.primaryWeapon }}</p>
      @if (c.secondaryWeapon) {
        <p class="mt-1">{{ c.secondaryWeapon }}</p>
      }
      <p class="mt-1">Armadura: {{ c.armor.name || 'nenhuma' }}</p>
      <p class="mt-2 whitespace-pre-line text-muted">{{ c.items }}</p>
    </section>

    <section class="card mt-3 text-sm">
      <div class="flex items-center justify-between">
        <h3 class="label">Experiências</h3>
        <button type="button" class="btn-ghost min-h-9 text-sm" (click)="edit.emit('experiences')">
          Editar
        </button>
      </div>
      @for (e of c.experiences; track $index) {
        <p class="mt-1">
          {{ e.name }} <span class="text-hope">+{{ e.bonus }}</span>
        </p>
      }
    </section>

    <section class="card mt-3 text-sm">
      <div class="flex items-center justify-between">
        <h3 class="label">Cartas de domínio</h3>
        <button type="button" class="btn-ghost min-h-9 text-sm" (click)="edit.emit('cards')">
          Editar
        </button>
      </div>
      <p class="mt-2 whitespace-pre-line">{{ c.domainCards.loadout }}</p>
    </section>

    <section class="card mt-3 text-sm">
      <div class="flex items-center justify-between">
        <h3 class="label">Características</h3>
        <button type="button" class="btn-ghost min-h-9 text-sm" (click)="edit.emit('subclass')">
          Editar
        </button>
      </div>
      <p class="mt-2 whitespace-pre-line">{{ c.features }}</p>
    </section>

    @if (c.background || c.appearance) {
      <section class="card mt-3 text-sm">
        <div class="flex items-center justify-between">
          <h3 class="label">História</h3>
          <button type="button" class="btn-ghost min-h-9 text-sm" (click)="edit.emit('story')">
            Editar
          </button>
        </div>
        @if (c.appearance) {
          <p class="mt-2 whitespace-pre-line">{{ c.appearance }}</p>
        }
        <p class="mt-2 whitespace-pre-line text-muted">{{ c.background }}</p>
      </section>
    }
  `,
})
export class ReviewStep {
  readonly edit = output<StepId>();
  private readonly store = inject(CreationStore);
  protected readonly traitIds = TRAIT_IDS;
  protected readonly traitLabels = TRAIT_LABELS;
  protected readonly preview = computed(() => buildCharacter(this.store.draft()));
  protected readonly missing = computed(() => firstIncompleteStep(this.store.draft()));
  protected readonly className = computed(() => findClass(this.store.draft().classId)?.name ?? '');

  protected signed(n: number): string {
    return n > 0 ? `+${n}` : `${n}`;
  }
}
