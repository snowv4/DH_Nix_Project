import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Minor ▸ Major ▸ Severe strip, styled after the official character sheet. */
@Component({
  selector: 'app-damage-thresholds',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-stretch" role="group" aria-label="Limiares de dano">
      <div class="tier">
        <p class="title">Dano<br />Menor</p>
        <p class="hint">Marque 1 PV</p>
      </div>
      <div class="value" [attr.aria-label]="'Limiar Maior ' + major()">
        <span>{{ major() }}</span>
      </div>
      <div class="tier">
        <p class="title">Dano<br />Maior</p>
        <p class="hint">Marque 2 PV</p>
      </div>
      <div class="value" [attr.aria-label]="'Limiar Grave ' + severe()">
        <span>{{ severe() }}</span>
      </div>
      <div class="tier">
        <p class="title">Dano<br />Grave</p>
        <p class="hint">Marque 3 PV</p>
      </div>
    </div>
  `,
  styles: `
    .tier {
      flex: 1 1 0;
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      padding: 10px 2px;
      background: #3a3150;
      clip-path: polygon(
        6px 0,
        calc(100% - 6px) 0,
        100% 6px,
        100% calc(100% - 6px),
        calc(100% - 6px) 100%,
        6px 100%,
        0 calc(100% - 6px),
        0 6px
      );
      text-align: center;
    }
    .title {
      font-weight: 800;
      font-size: 0.8rem;
      line-height: 1.05;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      color: #fff;
    }
    .hint {
      font-size: 0.68rem;
      color: var(--color-muted);
    }
    .value {
      position: relative;
      z-index: 1;
      display: grid;
      place-items: center;
      align-self: center;
      margin: 0 -4px;
      min-width: 2.6rem;
      height: 2.6rem;
      padding: 0 10px 0 6px;
      background: #f4f1fa;
      color: var(--color-ink);
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 1.35rem;
      clip-path: polygon(0 0, calc(100% - 9px) 0, 100% 50%, calc(100% - 9px) 100%, 0 100%);
      border-radius: 4px 0 0 4px;
    }
    @media (min-width: 640px) {
      .title {
        font-size: 0.95rem;
      }
      .hint {
        font-size: 0.75rem;
      }
      .value {
        min-width: 3.2rem;
        height: 3rem;
        font-size: 1.7rem;
      }
    }
  `,
})
export class DamageThresholds {
  readonly major = input.required<number>();
  readonly severe = input.required<number>();
}
