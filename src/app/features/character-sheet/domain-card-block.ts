import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CARD_TYPE_LABELS, DOMAIN_COLORS, DOMAINS, DomainCard } from '../../core/data/srd';
import { RichText } from '../../shared/ui/rich-text';

/**
 * One domain card laid out like the physical card: art header (blurred table-uploaded image, or a
 * domain-colored backdrop), name, use cost, active toggle, effect text and recall cost.
 */
@Component({
  selector: 'app-domain-card-block',
  imports: [RichText],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let c = card();
    <article
      class="flex h-full flex-col overflow-hidden rounded-2xl border bg-panel transition"
      [class.border-hope]="active()"
      [class.border-line]="!active()"
    >
      <header class="relative isolate overflow-hidden p-4 pb-3">
        <!-- Background: blurred art when uploaded, otherwise a domain-tinted backdrop with a big watermark letter. -->
        @if (art()) {
          <img
            class="absolute inset-0 -z-20 size-full scale-110 object-cover blur-[3px]"
            [src]="art()"
            alt=""
          />
        } @else {
          <div class="absolute inset-0 -z-20" [style.background]="backdrop()"></div>
          <span
            class="pointer-events-none absolute -top-6 -right-2 -z-10 font-display text-[7rem] leading-none font-bold opacity-15 select-none"
            [style.color]="color()"
            aria-hidden="true"
            >{{ domainName().charAt(0) }}</span
          >
        }
        <div class="absolute inset-0 -z-10 bg-gradient-to-b from-ink/30 via-ink/55 to-panel"></div>

        <div class="flex items-start gap-2">
          <div class="min-w-0 flex-1 drop-shadow">
            <h3 class="font-display text-xl leading-tight font-bold text-white">{{ c.name }}</h3>
            <p class="text-xs text-white/75">
              {{ c.nameEn }} ·
              <span [style.color]="color()" class="font-semibold">{{ domainName() }}</span> · Nível
              {{ c.level }} · {{ types[c.type] }}
            </p>
            <p
              class="mt-2 inline-block rounded-md bg-ink/70 px-2 py-0.5 text-sm font-semibold text-hope ring-1 ring-hope/40"
            >
              {{ c.cost }}
            </p>
          </div>
          <button
            type="button"
            class="btn min-h-11 shrink-0 px-3 text-sm"
            [class]="active() ? 'bg-hope text-ink' : 'border border-line bg-ink/60 text-muted'"
            [attr.aria-pressed]="active()"
            [attr.aria-label]="(active() ? 'Mover para o cofre: ' : 'Ativar: ') + c.name"
            (click)="activeToggle.emit()"
          >
            {{ active() ? 'Ativa' : 'No cofre' }}
          </button>
        </div>
      </header>

      <div class="flex-1 px-4 pb-3" [class.opacity-70]="!active()">
        <app-rich-text [text]="c.text" />
      </div>

      <footer
        class="flex flex-wrap items-center justify-between gap-2 border-t border-line/60 px-4 py-2"
      >
        <span
          class="rounded-md bg-fear/20 px-2 py-0.5 text-xs font-semibold text-fear"
          title="Estresse para trazer do cofre fora de um descanso"
        >
          ⚡ Custo de troca: {{ c.recallCost }}
        </span>
        <span class="flex items-center gap-1">
          <label class="btn min-h-9 cursor-pointer px-2 text-xs text-muted hover:text-white">
            {{ art() ? 'Trocar arte' : 'Pôr arte' }}
            <input class="sr-only" type="file" accept="image/*" (change)="onArt($event)" />
          </label>
          @if (art()) {
            <button
              type="button"
              class="btn min-h-9 px-2 text-xs text-muted"
              (click)="artRemoved.emit()"
            >
              Tirar arte
            </button>
          }
          @if (removable()) {
            <button
              type="button"
              class="btn min-h-9 px-2 text-xs text-muted"
              (click)="remove.emit()"
            >
              Remover
            </button>
          }
        </span>
      </footer>
    </article>
  `,
})
export class DomainCardBlock {
  readonly card = input.required<DomainCard>();
  readonly active = input(true);
  readonly removable = input(true);
  /** Data URL of the table-uploaded art for this card, if any. */
  readonly art = input('');
  readonly activeToggle = output<void>();
  readonly remove = output<void>();
  readonly artPicked = output<File>();
  readonly artRemoved = output<void>();

  protected readonly types = CARD_TYPE_LABELS;
  protected readonly color = computed(() => DOMAIN_COLORS[this.card().domain]);
  protected readonly domainName = computed(() => DOMAINS[this.card().domain].name);
  protected readonly backdrop = computed(() => {
    const c = this.color();
    return `radial-gradient(120% 90% at 85% 0%, color-mix(in srgb, ${c} 70%, transparent), transparent 70%), linear-gradient(135deg, color-mix(in srgb, ${c} 35%, #0f0c18), #1a1626)`;
  });

  protected onArt(e: Event): void {
    const el = e.target as HTMLInputElement;
    const file = el.files?.[0];
    if (file) this.artPicked.emit(file);
    el.value = '';
  }
}
