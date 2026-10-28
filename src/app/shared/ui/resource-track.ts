import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export type TrackTone = 'hope' | 'hp' | 'stress' | 'armor';

/** Row of tappable slots (circles for Hope, boxes for the rest). Emits the tapped index. */
@Component({
  selector: 'app-resource-track',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between gap-2">
      <span class="label">{{ label() }}</span>
      <span class="text-sm tabular-nums text-muted">{{ value() }}/{{ max() }}</span>
    </div>
    <div class="mt-2 flex flex-wrap gap-1.5" role="group" [attr.aria-label]="label()">
      @for (slot of slots(); track $index) {
        <button
          type="button"
          class="slot grid size-11 place-items-center"
          [class.filled]="slot"
          [attr.data-tone]="tone()"
          [attr.aria-label]="label() + ' ' + ($index + 1)"
          [attr.aria-pressed]="slot"
          [disabled]="readonly()"
          (click)="tap.emit($index)"
        >
          <span class="mark" [class.round]="tone() === 'hope'"></span>
        </button>
      }
    </div>
  `,
  styles: `
    .mark {
      display: block;
      width: 1.75rem;
      height: 1.75rem;
      border-radius: 0.4rem;
      border: 2px solid var(--tone);
      transition:
        background-color 150ms,
        box-shadow 150ms,
        transform 150ms;
    }
    .mark.round {
      border-radius: 9999px;
    }
    [data-tone='hope'] {
      --tone: var(--color-hope);
    }
    [data-tone='hp'] {
      --tone: var(--color-hp);
    }
    [data-tone='stress'] {
      --tone: var(--color-stress);
    }
    [data-tone='armor'] {
      --tone: var(--color-armor);
    }
    .filled .mark {
      background: var(--tone);
    }
    .filled[data-tone='hope'] .mark {
      box-shadow: 0 0 12px var(--color-hope);
      animation: glow 450ms ease-out;
    }
    @keyframes glow {
      0% {
        transform: scale(0.6);
        box-shadow: 0 0 0 var(--color-hope);
      }
      60% {
        transform: scale(1.25);
        box-shadow: 0 0 22px var(--color-hope);
      }
      100% {
        transform: scale(1);
      }
    }
    button:disabled {
      cursor: default;
    }
  `,
})
export class ResourceTrack {
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  readonly max = input.required<number>();
  readonly tone = input<TrackTone>('hp');
  readonly readonly = input(false);
  readonly tap = output<number>();

  protected readonly slots = computed(() =>
    Array.from({ length: Math.max(0, this.max()) }, (_, i) => i < this.value()),
  );
}
