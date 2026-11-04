import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

/**
 * Character portrait in an ornate gold frame. Without a picture, tapping opens the file picker;
 * with one, it opens a menu to view it full screen or change it.
 */
@Component({
  selector: 'app-portrait-frame',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="frame relative block aspect-[4/5] w-full">
      <span class="corner tl" aria-hidden="true"></span>
      <span class="corner tr" aria-hidden="true"></span>
      <span class="corner bl" aria-hidden="true"></span>
      <span class="corner br" aria-hidden="true"></span>
      <span class="inner block size-full overflow-hidden">
        @if (src()) {
          <img class="size-full object-cover" [src]="src()" [alt]="'Retrato de ' + name()" />
        } @else {
          <span class="grid size-full place-items-center bg-panel-2 text-center">
            <span>
              <span class="block font-display text-5xl text-hope">{{
                name().charAt(0).toUpperCase()
              }}</span>
              @if (editable()) {
                <span class="mt-1 block px-2 text-xs text-muted">Toque para adicionar retrato</span>
              }
            </span>
          </span>
        }
      </span>
      @if (src()) {
        <!-- With a picture: tap opens a small menu (view large / change) instead of the picker. -->
        <button
          type="button"
          class="absolute inset-0 z-10 size-full cursor-pointer"
          [attr.aria-label]="'Opções do retrato de ' + name()"
          [attr.aria-expanded]="menu()"
          (click)="menu.set(!menu())"
        ></button>
        @if (menu()) {
          <div
            class="absolute inset-x-2 bottom-2 z-20 flex flex-col gap-1 rounded-xl border border-line bg-ink/95 p-1 shadow-xl"
            role="menu"
          >
            <button
              type="button"
              class="btn min-h-11 text-sm"
              role="menuitem"
              (click)="openViewer()"
            >
              🔍 Ver em tamanho grande
            </button>
            @if (editable()) {
              <label class="btn relative min-h-11 cursor-pointer text-sm" role="menuitem">
                📷 Trocar foto
                <input class="sr-only" type="file" accept="image/*" (change)="onPick($event)" />
              </label>
            }
          </div>
        }
      } @else if (editable()) {
        <input
          class="absolute inset-0 z-10 size-full cursor-pointer opacity-0"
          type="file"
          accept="image/*"
          (change)="onPick($event)"
          [attr.aria-label]="'Adicionar retrato de ' + name()"
        />
      }
      @if (busy()) {
        <span class="absolute inset-0 grid place-items-center bg-ink/70 text-sm">Salvando…</span>
      }
    </div>
    @if (viewer()) {
      <div
        class="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="'Retrato de ' + name()"
        (click)="viewer.set(false)"
        (keydown.escape)="viewer.set(false)"
        tabindex="-1"
      >
        <img
          class="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
          [src]="src()"
          [alt]="'Retrato de ' + name()"
        />
        <button
          type="button"
          class="btn absolute top-3 right-3 bg-panel"
          (click)="viewer.set(false)"
        >
          Fechar ✕
        </button>
      </div>
    }
  `,
  styles: `
    .frame {
      padding: 6px;
      border-radius: 14px;
      background: linear-gradient(145deg, #f8d27a, #b7832a 40%, #f5c35a 60%, #8a5d16);
      box-shadow:
        0 0 0 1px rgb(0 0 0 / 0.6),
        0 0 22px rgb(245 184 61 / 0.25);
    }
    .inner {
      border-radius: 9px;
      border: 2px solid #1a1626;
      box-shadow: inset 0 0 0 1px rgb(245 184 61 / 0.6);
    }
    .corner {
      position: absolute;
      width: 18px;
      height: 18px;
      border: 2px solid #fde7a8;
      z-index: 1;
      pointer-events: none;
    }
    .tl {
      top: -4px;
      left: -4px;
      border-right: 0;
      border-bottom: 0;
      border-top-left-radius: 8px;
    }
    .tr {
      top: -4px;
      right: -4px;
      border-left: 0;
      border-bottom: 0;
      border-top-right-radius: 8px;
    }
    .bl {
      bottom: -4px;
      left: -4px;
      border-right: 0;
      border-top: 0;
      border-bottom-left-radius: 8px;
    }
    .br {
      bottom: -4px;
      right: -4px;
      border-left: 0;
      border-top: 0;
      border-bottom-right-radius: 8px;
    }
    .frame:focus-within {
      outline: 2px solid var(--color-hope);
      outline-offset: 3px;
    }
  `,
})
export class PortraitFrame {
  readonly src = input('');
  readonly name = input('');
  readonly editable = input(false);
  readonly busy = input(false);
  readonly picked = output<File>();
  protected readonly menu = signal(false);
  protected readonly viewer = signal(false);

  protected openViewer(): void {
    this.menu.set(false);
    this.viewer.set(true);
  }

  protected onPick(e: Event): void {
    const el = e.target as HTMLInputElement;
    const file = el.files?.[0];
    if (file) this.picked.emit(file);
    el.value = '';
    this.menu.set(false);
  }
}
