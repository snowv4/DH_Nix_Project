import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CARD_TYPE_LABELS, DOMAIN_CARDS, DOMAINS } from '../../../core/data/srd';
import {
  availableCards,
  domainCardLimit,
  selectedClass,
  toggleCard,
} from '../../../core/rules/creation';
import { CreationStore } from '../creation.store';

@Component({
  selector: 'app-cards-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="text-muted">
      Escolha <strong class="text-white">{{ limit() }} cartas de nível 1</strong> dos domínios da
      sua classe — pode ser uma de cada ou todas do mesmo domínio. Elas ficam na sua mão (até 5
      cartas ativas).
    </p>
    <p class="mt-2 rounded-lg bg-panel-2 px-3 py-2 text-sm" aria-live="polite">
      Escolhidas:
      <strong class="text-hope">{{ store.draft().domainCardIds.length }}/{{ limit() }}</strong>
    </p>
    @for (domainId of domains(); track domainId) {
      <h3 class="mt-5 font-display text-lg">
        {{ domainInfo[domainId].name }}
        <span class="text-sm text-muted">({{ domainInfo[domainId].nameEn }})</span>
      </h3>
      <p class="text-xs text-muted">{{ domainInfo[domainId].summary }}</p>
      <div class="mt-2 flex flex-col gap-2">
        @for (c of cardsOf(domainId); track c.id) {
          @let on = store.draft().domainCardIds.includes(c.id);
          <button
            type="button"
            class="card flex flex-col gap-1 text-left text-sm"
            [class.!border-hope]="on"
            [attr.aria-pressed]="on"
            (click)="toggle(c.id)"
          >
            <div class="flex items-start justify-between gap-2">
              <strong class="text-base"
                >{{ c.name }} <span class="font-normal text-muted">({{ c.nameEn }})</span></strong
              >
              @if (on) {
                <span class="rounded-full bg-hope px-2 py-0.5 text-xs font-bold text-ink">✓</span>
              }
            </div>
            <p class="text-xs text-muted">
              {{ typeLabels[c.type] }} · Custo de recuperação {{ c.recallCost }}
            </p>
            <p class="whitespace-pre-line">{{ c.text }}</p>
          </button>
        }
      </div>
    }
  `,
})
export class CardsStep {
  protected readonly store = inject(CreationStore);
  protected readonly domainInfo = DOMAINS;
  protected readonly typeLabels = CARD_TYPE_LABELS;
  protected readonly limit = computed(() => domainCardLimit(this.store.draft()));
  protected readonly domains = computed(() => selectedClass(this.store.draft())?.domains ?? []);
  private readonly cards = computed(() => availableCards(this.store.draft(), DOMAIN_CARDS));

  protected cardsOf(domainId: string) {
    return this.cards().filter((c) => c.domain === domainId);
  }

  protected toggle(id: string): void {
    this.store.update({ domainCardIds: toggleCard(this.store.draft(), id) });
  }
}
