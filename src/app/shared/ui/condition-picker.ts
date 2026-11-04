import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import {
  CONDITION_GROUPS,
  CONDITIONS,
  ConditionDef,
  ConditionGroup,
  MARKER_ICONS,
} from '../../core/data/conditions';
import { ConditionTag } from '../../core/models/character';
import { conditionViews, customMarker, toggleCondition } from '../../core/rules/conditions';

/**
 * Active conditions as chips (tap to see what it does / remove) plus a picker grouped like the
 * SRD: standard, special from cards, special from adversaries, and custom markers.
 */
@Component({
  selector: 'app-condition-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="@container flex flex-col gap-2">
      <div class="flex items-center justify-between gap-2">
        <span class="label">Condições</span>
        <button
          type="button"
          class="btn min-h-11 px-3 text-sm"
          [attr.aria-expanded]="open()"
          (click)="open.set(!open())"
        >
          {{ open() ? 'Fechar' : '+ Condição' }}
        </button>
      </div>

      @if (views().length) {
        <ul class="flex flex-wrap gap-1.5">
          @for (v of views(); track v.key) {
            <li>
              <button
                type="button"
                class="flex min-h-11 items-center gap-1.5 rounded-full border border-fear/60 bg-fear/15 px-3 text-sm text-white"
                [attr.aria-expanded]="info() === v.key"
                (click)="info.set(info() === v.key ? '' : v.key)"
              >
                <span aria-hidden="true">{{ v.icon }}</span
                >{{ v.label }}
              </button>
            </li>
          }
        </ul>
        @for (v of views(); track v.key) {
          @if (info() === v.key) {
            <div class="rounded-xl border border-line bg-ink/60 p-3 text-sm">
              <p>
                <span aria-hidden="true">{{ v.icon }}</span> <strong>{{ v.label }}</strong>
              </p>
              <p class="mt-1 text-muted">{{ v.summary }}</p>
              <button
                type="button"
                class="btn mt-2 min-h-11 w-full text-sm text-hp"
                (click)="remove(v.key)"
              >
                Remover condição
              </button>
            </div>
          }
        }
      } @else if (!open()) {
        <p class="text-xs text-muted">Nenhuma condição.</p>
      }

      @if (open()) {
        <div class="flex flex-col gap-3 rounded-xl border border-line bg-ink/60 p-2">
          @for (g of groups; track g.id) {
            <div>
              <p class="mb-1 text-xs text-muted">{{ g.label }}</p>
              <div class="grid grid-cols-2 gap-1 @md:grid-cols-3">
                @for (c of g.items; track c.id) {
                  <button
                    type="button"
                    class="flex min-h-11 items-center gap-1.5 rounded-lg border px-2 text-left text-sm"
                    [class]="
                      active().has(c.id)
                        ? 'border-fear bg-fear/25 text-white'
                        : 'border-line text-muted'
                    "
                    [attr.aria-pressed]="active().has(c.id)"
                    [title]="c.summary"
                    (click)="toggle({ id: c.id })"
                  >
                    <span aria-hidden="true">{{ c.icon }}</span
                    >{{ c.label }}
                  </button>
                }
              </div>
            </div>
          }
          <div>
            <p class="mb-1 text-xs text-muted">Marcador personalizado (ex.: Voando, Caído)</p>
            <div class="flex gap-1">
              <input
                class="field min-w-0 flex-1"
                maxlength="24"
                placeholder="Nome do marcador"
                aria-label="Nome do marcador"
                [value]="customName()"
                (input)="customName.set(inputText($event))"
                (keydown.enter)="addCustom()"
              />
              <button type="button" class="btn-hope shrink-0 px-3" (click)="addCustom()">
                Adicionar
              </button>
            </div>
            <div class="mt-1 grid grid-cols-8 gap-1" role="group" aria-label="Ícone do marcador">
              @for (i of icons; track i) {
                <button
                  type="button"
                  class="grid min-h-11 place-items-center rounded-lg text-lg"
                  [class]="customIcon() === i ? 'bg-hope/30 ring-2 ring-hope' : 'hover:bg-panel-2'"
                  [attr.aria-pressed]="customIcon() === i"
                  [attr.aria-label]="'Ícone ' + i"
                  (click)="customIcon.set(i)"
                >
                  {{ i }}
                </button>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ConditionPicker {
  readonly value = input<ConditionTag[] | undefined>([]);
  /** Emits the whole new list; the parent saves it. */
  readonly changed = output<ConditionTag[]>();

  protected readonly open = signal(false);
  protected readonly info = signal('');
  protected readonly customName = signal('');
  protected readonly customIcon = signal<string>(MARKER_ICONS[0]);
  protected readonly icons = MARKER_ICONS;
  protected readonly views = computed(() => conditionViews(this.value()));
  protected readonly active = computed(() => new Set((this.value() ?? []).map((t) => t.id)));
  protected readonly groups = (Object.keys(CONDITION_GROUPS) as ConditionGroup[]).map((id) => ({
    id,
    label: CONDITION_GROUPS[id],
    items: CONDITIONS.filter((c: ConditionDef) => c.group === id),
  }));

  protected toggle(tag: ConditionTag): void {
    this.changed.emit(toggleCondition(this.value(), tag));
  }

  protected remove(id: string): void {
    this.info.set('');
    this.changed.emit((this.value() ?? []).filter((t) => t.id !== id));
  }

  protected addCustom(): void {
    const tag = customMarker(this.customName(), this.customIcon());
    if (!tag) return;
    this.customName.set('');
    this.changed.emit([...(this.value() ?? []), tag]);
  }

  protected inputText(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }
}
