import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { DamageKind, Resistance, Severity } from '../../core/models/damage';
import { resolveDamage, SEVERITY_HP, SEVERITY_LABEL } from '../../core/rules/damage';

export interface DamageTarget {
  name: string;
  /** null when the token has no sheet (no HP to change). */
  hp: { marked: number; max: number } | null;
  thresholds: { major: number; severe: number } | null;
  /** Free Armor Slots (PCs only); null for adversaries. */
  armorLeft: number | null;
}

export interface DamageChoice {
  miss: boolean;
  amount?: number;
  severity?: Severity;
  resistance: Resistance;
  direct: boolean;
  useArmor: boolean;
  kind: DamageKind;
}

/**
 * After the GM picks the attack animation: how much damage? The table rolls dice in person, so
 * the GM either types the total (compared to the target's thresholds) or taps the severity the
 * player announced; armor, direct damage and resistance follow the SRD.
 */
@Component({
  selector: 'app-damage-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let t = target();
    <div class="card flex w-full max-w-md flex-col gap-3" role="dialog" aria-label="Dano do ataque">
      <div>
        <p class="label">{{ attacker() }} → {{ t.name }}</p>
        @if (t.thresholds) {
          <p class="text-xs text-muted">
            Limiares: Maior {{ t.thresholds.major || '—' }} · Grave {{ t.thresholds.severe || '—' }}
            @if (t.hp) {
              · PV {{ t.hp.max - t.hp.marked }}/{{ t.hp.max }}
            }
          </p>
        }
      </div>

      <div
        class="flex gap-1 rounded-xl bg-ink/60 p-1"
        role="group"
        aria-label="Como informar o dano"
      >
        <button
          type="button"
          class="btn min-h-11 flex-1 text-sm"
          [class]="mode() === 'severity' ? 'bg-panel-2 text-hope' : 'text-muted'"
          (click)="mode.set('severity')"
        >
          PV perdidos
        </button>
        <button
          type="button"
          class="btn min-h-11 flex-1 text-sm"
          [class]="mode() === 'amount' ? 'bg-panel-2 text-hope' : 'text-muted'"
          [disabled]="!t.thresholds"
          (click)="mode.set('amount')"
        >
          Valor do dano
        </button>
      </div>

      @if (mode() === 'severity') {
        <div class="grid grid-cols-4 gap-1" role="group" aria-label="Gravidade">
          @for (s of severities; track s) {
            <button
              type="button"
              class="flex min-h-14 flex-col items-center justify-center rounded-lg border text-sm"
              [class]="
                severity() === s ? 'border-hp bg-hp/25 text-white' : 'border-line text-muted'
              "
              [attr.aria-pressed]="severity() === s"
              (click)="severity.set(s)"
            >
              <span class="font-semibold">−{{ hpOf(s) }} PV</span>
              <span class="text-[11px]">{{ label(s) }}</span>
            </button>
          }
        </div>
      } @else {
        <label class="flex items-center gap-2 text-sm">
          <span class="text-muted">Dano rolado</span>
          <input
            class="field w-24 text-center text-lg"
            type="number"
            inputmode="numeric"
            min="0"
            [value]="amount()"
            (input)="amount.set(+inputValue($event))"
            aria-label="Dano rolado"
          />
        </label>
      }

      <div class="grid grid-cols-2 gap-1 text-sm">
        <button
          type="button"
          class="btn min-h-11"
          [class]="kind() === 'physical' ? 'ring-2 ring-hope text-hope bg-panel-2' : 'text-muted'"
          [attr.aria-pressed]="kind() === 'physical'"
          (click)="kind.set('physical')"
        >
          🗡 Físico
        </button>
        <button
          type="button"
          class="btn min-h-11"
          [class]="kind() === 'magic' ? 'ring-2 ring-fear text-fear bg-panel-2' : 'text-muted'"
          [attr.aria-pressed]="kind() === 'magic'"
          (click)="kind.set('magic')"
        >
          ✨ Mágico
        </button>
        <button
          type="button"
          class="btn min-h-11"
          [class]="direct() ? 'ring-2 ring-hp text-hp bg-panel-2' : 'text-muted'"
          [attr.aria-pressed]="direct()"
          (click)="direct.set(!direct())"
        >
          ⚡ Dano direto
        </button>
        @if (t.armorLeft !== null) {
          <button
            type="button"
            class="btn min-h-11"
            [class]="useArmor() ? 'ring-2 ring-armor text-armor bg-panel-2' : 'text-muted'"
            [attr.aria-pressed]="useArmor()"
            [disabled]="direct() || !t.armorLeft"
            (click)="useArmor.set(!useArmor())"
          >
            🛡 Usar armadura ({{ t.armorLeft }})
          </button>
        }
      </div>
      <div class="grid grid-cols-3 gap-1 text-xs" role="group" aria-label="Resistência">
        @for (r of resistances; track r.id) {
          <button
            type="button"
            class="btn min-h-11"
            [class]="resistance() === r.id ? 'bg-panel-2 text-hope' : 'text-muted'"
            [attr.aria-pressed]="resistance() === r.id"
            (click)="resistance.set(r.id)"
          >
            {{ r.label }}
          </button>
        }
      </div>

      <p class="rounded-lg bg-ink/60 px-3 py-2 text-sm" aria-live="polite">{{ preview() }}</p>

      <div class="grid grid-cols-3 gap-1">
        <button type="button" class="btn min-h-11 text-sm" (click)="dismiss.emit()">
          Cancelar
        </button>
        <button type="button" class="btn min-h-11 text-sm" (click)="emit(true)">💨 Errou</button>
        <button type="button" class="btn-fear min-h-11 text-sm" (click)="emit(false)">
          Aplicar
        </button>
      </div>
      <button type="button" class="text-xs text-muted underline" (click)="animationOnly.emit()">
        Só a animação, sem mexer na ficha
      </button>
    </div>
  `,
})
export class DamageDialog {
  readonly target = input.required<DamageTarget>();
  readonly attacker = input('');
  readonly defaultKind = input<DamageKind>('physical');
  readonly apply = output<DamageChoice>();
  readonly dismiss = output();
  readonly animationOnly = output();

  protected readonly severities: Severity[] = ['minor', 'major', 'severe', 'massive'];
  protected readonly resistances: { id: Resistance; label: string }[] = [
    { id: 'none', label: 'Normal' },
    { id: 'resistant', label: 'Resistente (½)' },
    { id: 'immune', label: 'Imune' },
  ];
  protected readonly mode = signal<'severity' | 'amount'>('severity');
  protected readonly severity = signal<Severity>('minor');
  protected readonly amount = signal(0);
  protected readonly direct = signal(false);
  protected readonly useArmor = signal(false);
  protected readonly resistance = signal<Resistance>('none');
  /** Starts from the animation's element, but the GM can change it. */
  protected readonly kind = linkedSignal(() => this.defaultKind());

  private readonly result = computed(() => {
    const t = this.target();
    return resolveDamage({
      amount: this.mode() === 'amount' ? this.amount() : undefined,
      severity: this.mode() === 'severity' ? this.severity() : undefined,
      thresholds: t.thresholds ?? { major: 0, severe: 0 },
      resistance: this.resistance(),
      direct: this.direct(),
      useArmor: this.useArmor(),
      armorSlotsLeft: t.armorLeft ?? 0,
      massiveRule: true,
    });
  });

  protected readonly preview = computed(() => {
    const r = this.result();
    const name = this.target().name;
    if (this.resistance() === 'immune') return `${name} é imune: nenhum PV.`;
    if (!r.hp)
      return r.armorUsed ? `A armadura segurou tudo (1 espaço marcado).` : `${name} não perde PV.`;
    const armor = r.armorUsed
      ? ` (${this.label(r.base)} → ${this.label(r.final)} com armadura)`
      : '';
    return `${name} perde ${r.hp} PV${armor}.`;
  });

  protected hpOf(s: Severity): number {
    return SEVERITY_HP[s];
  }

  protected label(s: Severity): string {
    return SEVERITY_LABEL[s];
  }

  protected emit(miss: boolean): void {
    this.apply.emit({
      miss,
      amount: this.mode() === 'amount' ? this.amount() : undefined,
      severity: this.mode() === 'severity' ? this.severity() : undefined,
      resistance: this.resistance(),
      direct: this.direct(),
      useArmor: this.useArmor(),
      kind: this.kind(),
    });
  }

  protected inputValue(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }
}
