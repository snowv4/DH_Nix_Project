import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CARD_TYPE_LABELS, DOMAINS, DomainCard } from '../../core/data/srd';

/** One domain card laid out like the physical card: name, cost, active toggle, text, recall cost. */
@Component({
  selector: 'app-domain-card-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let c = card();
    <article
      class="card flex h-full flex-col gap-2 transition"
      [class.!border-hope]="active()"
      [class.opacity-70]="!active()"
    >
      <header class="flex items-start gap-2">
        <div class="min-w-0 flex-1">
          <h3 class="font-display text-lg leading-tight font-bold">{{ c.name }}</h3>
          <p class="text-xs text-muted">
            {{ c.nameEn }} · {{ domains[c.domain].name }} · Nível {{ c.level }} ·
            {{ types[c.type] }}
          </p>
          <p
            class="mt-1.5 inline-block rounded-md bg-hope/15 px-2 py-0.5 text-sm font-semibold text-hope"
          >
            {{ c.cost }}
          </p>
        </div>
        <button
          type="button"
          class="btn min-h-11 shrink-0 px-3 text-sm"
          [class]="active() ? 'bg-hope text-ink' : 'border border-line text-muted'"
          [attr.aria-pressed]="active()"
          [attr.aria-label]="(active() ? 'Mover para o cofre: ' : 'Ativar: ') + c.name"
          (click)="activeToggle.emit()"
        >
          {{ active() ? 'Ativa' : 'No cofre' }}
        </button>
      </header>
      <p class="flex-1 text-sm leading-relaxed whitespace-pre-line">{{ c.text }}</p>
      <footer class="flex items-center justify-between gap-2">
        <span
          class="rounded-md bg-fear/20 px-2 py-0.5 text-xs font-semibold text-fear"
          title="Estresse para trazer do cofre fora de um descanso"
        >
          ⚡ Custo de troca: {{ c.recallCost }}
        </span>
        @if (removable()) {
          <button type="button" class="btn min-h-9 px-2 text-xs text-muted" (click)="remove.emit()">
            Remover
          </button>
        }
      </footer>
    </article>
  `,
})
export class DomainCardBlock {
  readonly card = input.required<DomainCard>();
  readonly active = input(true);
  readonly removable = input(true);
  readonly activeToggle = output<void>();
  readonly remove = output<void>();
  protected readonly domains = DOMAINS;
  protected readonly types = CARD_TYPE_LABELS;
}
