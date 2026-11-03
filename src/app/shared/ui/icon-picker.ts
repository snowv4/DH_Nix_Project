import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';
import { TOKEN_ICON_BY_ID, TOKEN_ICON_BOX, TOKEN_ICONS } from '../../core/data/token-icons';

/** A single token icon as inline SVG (inherits the text color). */
@Component({
  selector: 'app-token-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (path(); as d) {
      <svg [attr.viewBox]="viewBox" class="size-full" aria-hidden="true">
        <path [attr.d]="d" fill="currentColor" />
      </svg>
    }
  `,
  host: { class: 'inline-block' },
})
export class TokenIconView {
  readonly icon = input('');
  protected readonly viewBox = `0 0 ${TOKEN_ICON_BOX} ${TOKEN_ICON_BOX}`;
  protected readonly path = computed(() => TOKEN_ICON_BY_ID.get(this.icon())?.path ?? '');
}

/**
 * Collapsible grid to pick a token icon. Collapsed by default so it costs one row in tight
 * panels; "Letra" clears the icon and the token shows its initial again.
 */
@Component({
  selector: 'app-icon-picker',
  imports: [TokenIconView],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-2">
      <span class="grid size-11 shrink-0 place-items-center rounded-full bg-panel-2 text-white">
        @if (value()) {
          <app-token-icon class="size-7" [icon]="value()" />
        } @else {
          <span class="text-sm text-muted">Aa</span>
        }
      </span>
      <button
        type="button"
        class="btn flex-1 text-sm"
        (click)="open.set(!open())"
        [attr.aria-expanded]="open()"
      >
        {{ open() ? 'Fechar ícones' : value() ? 'Ícone: ' + label() : 'Escolher ícone' }}
      </button>
    </div>
    @if (open()) {
      <div
        class="mt-2 grid max-h-56 grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1 overflow-y-auto rounded-xl border border-line bg-ink/60 p-1"
      >
        <button
          type="button"
          class="grid min-h-11 place-items-center rounded-lg text-xs text-muted hover:bg-panel-2"
          [class.ring-2]="!value()"
          [class.ring-hope]="!value()"
          title="Sem ícone (letra)"
          (click)="pick('')"
        >
          Letra
        </button>
        @for (i of icons; track i.id) {
          <button
            type="button"
            class="grid min-h-11 place-items-center rounded-lg p-1.5 text-white hover:bg-panel-2"
            [class.ring-2]="value() === i.id"
            [class.ring-hope]="value() === i.id"
            [title]="i.label"
            [attr.aria-label]="i.label"
            (click)="pick(i.id)"
          >
            <app-token-icon class="size-7" [icon]="i.id" />
          </button>
        }
      </div>
      <p class="mt-1 text-[11px] text-muted/80">
        Ícones dos tokens:
        <a class="underline" href="https://game-icons.net" target="_blank" rel="noopener"
          >game-icons.net</a
        >
        (Lorc, Delapouite e colaboradores),
        <a
          class="underline"
          href="https://creativecommons.org/licenses/by/3.0/"
          target="_blank"
          rel="noopener"
          >CC BY 3.0</a
        >.
      </p>
    }
  `,
  host: { class: 'block' },
})
export class IconPicker {
  readonly value = model('');
  protected readonly icons = TOKEN_ICONS;
  protected readonly open = signal(false);
  protected readonly label = computed(() => TOKEN_ICON_BY_ID.get(this.value())?.label ?? '');

  protected pick(id: string): void {
    this.value.set(id);
    this.open.set(false);
  }
}
