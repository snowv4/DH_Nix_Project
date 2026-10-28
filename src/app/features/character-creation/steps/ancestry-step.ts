import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ANCESTRIES } from '../../../core/data/srd';
import { ancestryFeatures } from '../../../core/rules/creation';
import { CreationStore } from '../creation.store';

@Component({
  selector: 'app-ancestry-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="text-muted">
      A ancestralidade é sua linhagem: afeta a aparência e dá duas características.
    </p>

    <label class="mt-3 flex min-h-11 items-center gap-3 rounded-xl border border-line bg-panel p-3">
      <input
        type="checkbox"
        class="size-5 accent-[var(--color-hope)]"
        [checked]="mixed()"
        (change)="setMixed(checked($event))"
      />
      <span>
        <strong>Ancestralidade mista</strong>
        <span class="block text-sm text-muted"
          >Pegue a 1ª característica de uma e a 2ª de outra.</span
        >
      </span>
    </label>

    @if (mixed()) {
      <div
        class="mt-3 grid grid-cols-2 gap-2"
        role="group"
        aria-label="Qual ancestralidade escolher agora"
      >
        <button
          type="button"
          class="btn-ghost text-sm"
          [class.!border-hope]="slot() === 'primary'"
          (click)="slot.set('primary')"
        >
          1ª: {{ nameOf(store.draft().ancestry.primaryId) || 'escolher' }}
        </button>
        <button
          type="button"
          class="btn-ghost text-sm"
          [class.!border-hope]="slot() === 'secondary'"
          (click)="slot.set('secondary')"
        >
          2ª: {{ nameOf(store.draft().ancestry.secondaryId) || 'escolher' }}
        </button>
      </div>
      <label class="mt-2 flex flex-col gap-1 text-sm">
        Como seu personagem se identifica? (opcional)
        <input
          class="field"
          [value]="store.draft().ancestry.label"
          (input)="setLabel(value($event))"
          placeholder="Ex.: goblin-orc"
        />
      </label>
    }

    @if (features().length) {
      <div class="card mt-3 !border-hope/60 text-sm">
        <p class="label">Suas características</p>
        @for (f of features(); track f.feature.nameEn) {
          <p class="mt-1">
            <strong class="text-hope">{{ f.feature.name }}:</strong> {{ f.feature.text }}
          </p>
        }
      </div>
    }

    <input
      class="field mt-3"
      type="search"
      placeholder="Buscar ancestralidade…"
      [value]="query()"
      (input)="query.set(value($event))"
      aria-label="Buscar ancestralidade"
    />

    <div class="mt-3 flex flex-col gap-3">
      @for (a of filtered(); track a.id) {
        @let chosen = isChosen(a.id);
        <button
          type="button"
          class="card flex flex-col gap-2 text-left"
          [class.!border-hope]="chosen"
          [attr.aria-pressed]="chosen"
          (click)="choose(a.id)"
        >
          <h3 class="font-display text-lg font-bold">
            {{ a.name }} <span class="text-sm font-normal text-muted">({{ a.nameEn }})</span>
          </h3>
          <p class="text-sm text-muted">{{ a.summary }}</p>
          @for (f of a.features; track f.nameEn; let i = $index) {
            <p class="text-sm" [class.opacity-40]="mixed() && !featureUsable(i)">
              <strong>{{ i + 1 }}ª · {{ f.name }}:</strong> {{ f.text }}
            </p>
          }
        </button>
      } @empty {
        <p class="text-muted">Nenhuma ancestralidade encontrada.</p>
      }
    </div>
  `,
})
export class AncestryStep {
  protected readonly store = inject(CreationStore);
  protected readonly query = signal('');
  protected readonly slot = signal<'primary' | 'secondary'>('primary');
  protected readonly mixed = computed(() => this.store.draft().ancestry.mixed);
  protected readonly features = computed(() => ancestryFeatures(this.store.draft()));
  protected readonly filtered = computed(() => {
    const q = normalize(this.query());
    return ANCESTRIES.filter((a) => !q || normalize(`${a.name} ${a.nameEn}`).includes(q));
  });

  protected value(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }

  protected checked(e: Event): boolean {
    return (e.target as HTMLInputElement).checked;
  }

  protected nameOf(id: string): string {
    return ANCESTRIES.find((a) => a.id === id)?.name ?? '';
  }

  protected isChosen(id: string): boolean {
    const a = this.store.draft().ancestry;
    return a.primaryId === id || (a.mixed && a.secondaryId === id);
  }

  /** While picking for a slot, highlight the feature that slot contributes. */
  protected featureUsable(index: number): boolean {
    return this.slot() === 'primary' ? index === 0 : index === 1;
  }

  protected choose(id: string): void {
    const a = this.store.draft().ancestry;
    if (a.mixed && this.slot() === 'secondary') {
      this.store.update({ ancestry: { ...a, secondaryId: id } });
    } else {
      this.store.update({ ancestry: { ...a, primaryId: id }, clankBonusIndex: -1 });
      if (a.mixed) this.slot.set('secondary');
    }
  }

  protected setMixed(mixed: boolean): void {
    this.slot.set('primary');
    this.store.update({
      ancestry: { ...this.store.draft().ancestry, mixed, secondaryId: '' },
      clankBonusIndex: -1,
    });
  }

  protected setLabel(label: string): void {
    this.store.update({ ancestry: { ...this.store.draft().ancestry, label } });
  }
}

function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
