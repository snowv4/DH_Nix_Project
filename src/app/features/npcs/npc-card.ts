import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ADVERSARY_TYPES, RANGE_LABELS, Range } from '../../core/data/srd';
import { Npc } from '../../core/models/npc';
import { DamageThresholds } from '../../shared/ui/damage-thresholds';
import { TokenIconView } from '../../shared/ui/icon-picker';
import { ResourceTrack } from '../../shared/ui/resource-track';
import { RichText } from '../../shared/ui/rich-text';

/** Compact NPC stat block for the GM panel: everything needed mid-combat at a glance. */
@Component({
  selector: 'app-npc-card',
  imports: [ResourceTrack, DamageThresholds, RichText, TokenIconView],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let n = npc();
    <article class="card flex h-full flex-col gap-3 !border-fear/40">
      <header class="flex items-start gap-3">
        @if (n.portraitUrl) {
          <img
            class="size-14 shrink-0 rounded-lg border-2 border-fear/60 object-cover"
            [src]="n.portraitUrl"
            alt=""
          />
        } @else {
          <span
            class="grid size-14 shrink-0 place-items-center rounded-lg border-2 border-fear/40 bg-panel-2 font-display text-2xl text-fear"
            aria-hidden="true"
          >
            @if (n.icon) {
              <app-token-icon class="size-9" [icon]="n.icon" />
            } @else {
              {{ n.name.charAt(0).toUpperCase() }}
            }
          </span>
        }
        <div class="min-w-0 flex-1">
          <button
            type="button"
            class="text-left font-display text-lg leading-tight font-bold hover:underline"
            (click)="edit.emit()"
          >
            {{ n.name }}
          </button>
          <p class="text-xs text-muted">
            {{ typeLabel() }}{{ n.type ? ' · Patamar ' + n.tier : '' }}
          </p>
          @if (n.tags) {
            <p class="mt-1 flex flex-wrap gap-1">
              @for (t of tagList(); track t) {
                <span class="rounded-full bg-panel-2 px-2 py-0.5 text-[0.7rem] text-muted">{{
                  t
                }}</span>
              }
            </p>
          }
        </div>
        @if (n.type) {
          <div class="shrink-0 text-center">
            <p class="text-[0.65rem] font-semibold tracking-wider text-muted uppercase">Dific.</p>
            <p class="font-display text-3xl leading-none text-fear">{{ n.difficulty }}</p>
          </div>
        }
      </header>

      @if (n.type) {
        @if (n.hp.max > 0) {
          <app-resource-track
            label="PV"
            tone="hp"
            [value]="n.hp.marked"
            [max]="n.hp.max"
            (tap)="hpTap.emit($event)"
          />
        }
        @if (n.stress.max > 0) {
          <app-resource-track
            label="Estresse"
            tone="stress"
            [value]="n.stress.marked"
            [max]="n.stress.max"
            (tap)="stressTap.emit($event)"
          />
        }
        @if (!n.hp.max && !n.stress.max) {
          <p class="text-xs text-muted">Defina PV e Estresse em “Editar”.</p>
        }
        @if (n.thresholds.major) {
          <app-damage-thresholds [major]="n.thresholds.major" [severe]="n.thresholds.severe" />
        }
        @if (n.attack.name || n.attack.damage) {
          <p class="rounded-lg bg-panel-2 px-3 py-2 text-sm">
            <span class="font-semibold text-white">⚔ {{ n.attack.name || 'Ataque' }}</span>
            <span class="text-hope">
              {{ n.attack.modifier >= 0 ? '+' : '' }}{{ n.attack.modifier }}</span
            >
            <span class="text-muted"> · {{ rangeLabel() }} · </span>{{ n.attack.damage }}
          </p>
        }
      }

      @if (n.motives) {
        <p class="text-xs"><span class="text-muted">Motivações:</span> {{ n.motives }}</p>
      }
      @if (n.features || n.experiences || n.description || n.notes) {
        <details class="rounded-lg bg-panel-2 px-3 py-2 text-sm">
          <summary class="cursor-pointer text-muted">Características e anotações</summary>
          <div class="mt-2 flex flex-col gap-3">
            @if (n.experiences) {
              <p class="text-xs whitespace-pre-line">
                <span class="text-muted">Experiências:</span> {{ n.experiences }}
              </p>
            }
            @if (n.features) {
              <app-rich-text [text]="n.features" />
            }
            @if (n.description) {
              <p class="text-xs whitespace-pre-line text-muted">{{ n.description }}</p>
            }
            @if (n.notes) {
              <p class="text-xs whitespace-pre-line">
                <span class="text-fear">Mestre:</span> {{ n.notes }}
              </p>
            }
          </div>
        </details>
      }

      <footer class="mt-auto flex flex-wrap justify-end gap-1 border-t border-line/60 pt-2">
        <button
          type="button"
          class="btn min-h-9 px-2 text-xs text-muted hover:text-white"
          (click)="edit.emit()"
        >
          Editar
        </button>
        <button
          type="button"
          class="btn min-h-9 px-2 text-xs text-muted hover:text-white"
          (click)="duplicate.emit()"
        >
          Duplicar
        </button>
        <button
          type="button"
          class="btn min-h-9 px-2 text-xs text-muted hover:text-white"
          (click)="toMap.emit()"
        >
          Pôr no mapa
        </button>
        <button
          type="button"
          class="btn min-h-9 px-2 text-xs text-muted hover:text-hp"
          (click)="remove.emit()"
        >
          Excluir
        </button>
      </footer>
    </article>
  `,
})
export class NpcCard {
  readonly npc = input.required<Npc>();
  readonly edit = output<void>();
  readonly duplicate = output<void>();
  readonly remove = output<void>();
  readonly toMap = output<void>();
  readonly hpTap = output<number>();
  readonly stressTap = output<number>();

  protected readonly typeLabel = computed(
    () => ADVERSARY_TYPES.find((t) => t.id === this.npc().type)?.name ?? 'NPC',
  );
  protected readonly rangeLabel = computed(
    () => RANGE_LABELS[this.npc().attack.range as Range] ?? this.npc().attack.range,
  );
  protected readonly tagList = computed(() =>
    this.npc()
      .tags.split(',')
      .map((t) => t.trim())
      .filter(Boolean),
  );
}
