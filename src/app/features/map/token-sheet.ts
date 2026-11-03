import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { findClass } from '../../core/data/srd';
import { ADVERSARY_TYPES, RANGE_LABELS } from '../../core/data/srd';
import { TRAIT_LABELS } from '../../core/data/traits';
import { CharacterRepository } from '../../core/firebase/character.repository';
import { NpcRepository } from '../../core/firebase/npc.repository';
import { Character, TRAIT_IDS } from '../../core/models/character';
import { Npc } from '../../core/models/npc';
import { toggleSlot } from '../../core/rules/character';
import { TokenIconView } from '../../shared/ui/icon-picker';
import { ResourceTrack } from '../../shared/ui/resource-track';
import { RichText } from '../../shared/ui/rich-text';

/**
 * Quick sheet for the token selected on the battle map: the GM marks HP, Stress, Hope and Armor
 * without leaving the map. "Resumo" keeps it to the trackers; "Completo" adds the rest.
 */
@Component({
  selector: 'app-token-sheet',
  imports: [ResourceTrack, RichText, TokenIconView],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="flex flex-col gap-3 rounded-2xl border border-line bg-panel/95 p-3 shadow-2xl backdrop-blur"
    >
      <header class="flex items-center gap-2">
        @if (portrait()) {
          <img
            class="size-11 shrink-0 rounded-lg border-2 object-cover"
            [class]="borderClass()"
            [src]="portrait()"
            alt=""
          />
        } @else {
          <span
            class="grid size-11 shrink-0 place-items-center rounded-lg border-2 bg-panel-2 font-display text-lg"
            [class]="borderClass()"
            aria-hidden="true"
          >
            @if (npc()?.icon) {
              <app-token-icon class="size-7 text-white" [icon]="npc()?.icon ?? ''" />
            } @else {
              {{ name().charAt(0).toUpperCase() }}
            }
          </span>
        }
        <div class="min-w-0 flex-1">
          <h2 class="truncate font-display text-base font-bold text-white">{{ name() }}</h2>
          <p class="truncate text-xs text-muted">{{ subtitle() }}</p>
        </div>
        <button
          type="button"
          class="btn min-h-11 shrink-0 px-2 text-xs"
          (click)="dismiss.emit()"
          aria-label="Fechar ficha rápida"
        >
          ✕
        </button>
      </header>

      <div class="flex gap-1 rounded-xl bg-ink/60 p-1" role="group" aria-label="Detalhe da ficha">
        <button
          type="button"
          class="btn min-h-9 flex-1 text-xs"
          [class]="extended() ? 'text-muted' : 'bg-panel-2 text-hope'"
          [attr.aria-pressed]="!extended()"
          (click)="extended.set(false)"
        >
          Resumo
        </button>
        <button
          type="button"
          class="btn min-h-9 flex-1 text-xs"
          [class]="extended() ? 'bg-panel-2 text-hope' : 'text-muted'"
          [attr.aria-pressed]="extended()"
          (click)="extended.set(true)"
        >
          Completo
        </button>
        <button type="button" class="btn min-h-9 flex-1 text-xs" (click)="openFull.emit()">
          Ficha ↗
        </button>
      </div>

      @if (character(); as c) {
        <app-resource-track
          label="PV"
          tone="hp"
          [value]="c.hp.marked"
          [max]="c.hp.max"
          (tap)="tapPc('hp', $event)"
        />
        <app-resource-track
          label="Estresse"
          tone="stress"
          [value]="c.stress.marked"
          [max]="c.stress.max"
          (tap)="tapPc('stress', $event)"
        />
        <app-resource-track
          label="Esperança"
          tone="hope"
          [value]="c.hope.current"
          [max]="c.hope.max"
          (tap)="tapPc('hope', $event)"
        />
        <app-resource-track
          label="Armadura"
          tone="armor"
          [value]="c.armor.slotsMarked"
          [max]="c.armor.score"
          (tap)="tapPc('armor', $event)"
        />
        <div class="grid grid-cols-3 gap-1 text-center text-xs">
          <div class="rounded-lg bg-panel-2 p-1.5">
            <p class="text-muted">Evasão</p>
            <p class="text-base font-semibold">{{ c.evasion }}</p>
          </div>
          <div class="rounded-lg bg-panel-2 p-1.5">
            <p class="text-muted">Maior</p>
            <p class="text-base font-semibold">{{ c.thresholds.major }}</p>
          </div>
          <div class="rounded-lg bg-panel-2 p-1.5">
            <p class="text-muted">Grave</p>
            <p class="text-base font-semibold">{{ c.thresholds.severe }}</p>
          </div>
        </div>
        @if (extended()) {
          <div class="grid grid-cols-3 gap-1 text-center text-xs">
            @for (t of traitIds; track t) {
              <div class="rounded-lg bg-panel-2 p-1.5">
                <p class="text-muted">{{ traitLabels[t] }}</p>
                <p class="text-base font-semibold">{{ signed(c.traits[t]) }}</p>
              </div>
            }
          </div>
          <p class="text-xs"><span class="text-muted">Proficiência:</span> {{ c.proficiency }}</p>
          @if (c.primaryWeapon || c.secondaryWeapon) {
            <p class="text-xs">
              <span class="text-muted">Armas:</span> {{ c.primaryWeapon
              }}{{ c.secondaryWeapon ? ' · ' + c.secondaryWeapon : '' }}
            </p>
          }
          @if (namedExperiences().length) {
            <p class="text-xs">
              <span class="text-muted">Experiências:</span>
              @for (e of namedExperiences(); track $index; let last = $last) {
                {{ e.name }} {{ signed(e.bonus) }}{{ last ? '' : ' · ' }}
              }
            </p>
          }
        }
      } @else if (npc(); as n) {
        @if (n.hp.max) {
          <app-resource-track
            label="PV"
            tone="hp"
            [value]="n.hp.marked"
            [max]="n.hp.max"
            (tap)="tapNpc('hp', $event)"
          />
        }
        @if (n.stress.max) {
          <app-resource-track
            label="Estresse"
            tone="stress"
            [value]="n.stress.marked"
            [max]="n.stress.max"
            (tap)="tapNpc('stress', $event)"
          />
        }
        <div class="grid grid-cols-3 gap-1 text-center text-xs">
          <div class="rounded-lg bg-panel-2 p-1.5">
            <p class="text-muted">Dificuldade</p>
            <p class="text-base font-semibold text-fear">{{ n.difficulty }}</p>
          </div>
          <div class="rounded-lg bg-panel-2 p-1.5">
            <p class="text-muted">Maior</p>
            <p class="text-base font-semibold">{{ n.thresholds.major || '—' }}</p>
          </div>
          <div class="rounded-lg bg-panel-2 p-1.5">
            <p class="text-muted">Grave</p>
            <p class="text-base font-semibold">{{ n.thresholds.severe || '—' }}</p>
          </div>
        </div>
        @if (n.attack.name || n.attack.damage) {
          <p class="rounded-lg bg-panel-2 px-3 py-2 text-xs">
            <span class="font-semibold text-white">⚔ {{ n.attack.name || 'Ataque' }}</span>
            <span class="text-hope"> {{ signed(n.attack.modifier) }}</span>
            · {{ rangeLabel(n) }} · {{ n.attack.damage }}
          </p>
        }
        @if (extended()) {
          @if (n.motives) {
            <p class="text-xs"><span class="text-muted">Motivações:</span> {{ n.motives }}</p>
          }
          @if (n.experiences) {
            <p class="text-xs"><span class="text-muted">Experiências:</span> {{ n.experiences }}</p>
          }
          @if (n.features) {
            <app-rich-text [text]="n.features" />
          }
          <label class="flex flex-col gap-1 text-xs text-muted">
            Anotações do mestre
            <textarea
              class="field min-h-20 text-sm text-white"
              [value]="n.notes"
              (change)="saveNpcNotes($event)"
            ></textarea>
          </label>
        }
      } @else {
        <p class="text-sm text-muted">
          Este token não está ligado a uma ficha. Monstros rápidos não têm PV; para controlar PV,
          crie um NPC (ou importe do Bestiário) e ponha no mapa.
        </p>
      }
    </article>
  `,
})
export class TokenSheet {
  readonly character = input<Character>();
  readonly npc = input<Npc>();
  /** Fallback name for tokens without a sheet. */
  readonly label = input('');
  readonly extended = model(false);
  readonly dismiss = output();
  readonly openFull = output();

  private readonly characters = inject(CharacterRepository);
  private readonly npcs = inject(NpcRepository);
  protected readonly traitIds = TRAIT_IDS;
  protected readonly traitLabels = TRAIT_LABELS;

  protected readonly name = computed(
    () => this.character()?.name ?? this.npc()?.name ?? this.label(),
  );
  protected readonly portrait = computed(
    () => this.character()?.portraitUrl ?? this.npc()?.portraitUrl ?? '',
  );
  protected readonly borderClass = computed(() =>
    this.character() ? 'border-hope/70' : 'border-fear/60',
  );
  protected readonly namedExperiences = computed(() =>
    (this.character()?.experiences ?? []).filter((e) => e.name.trim()),
  );
  protected readonly subtitle = computed(() => {
    const c = this.character();
    if (c)
      return [`Nv ${c.level}`, findClass(c.classId)?.name, c.subclass].filter(Boolean).join(' · ');
    const n = this.npc();
    if (n) return ADVERSARY_TYPES.find((t) => t.id === n.type)?.name ?? 'NPC';
    return 'Token sem ficha';
  });

  protected tapPc(track: 'hp' | 'stress' | 'hope' | 'armor', index: number): void {
    const c = this.character();
    if (!c) return;
    switch (track) {
      case 'hp':
      case 'stress':
        void this.characters.update(c.id, { [track]: toggleSlot(c[track], index) });
        return;
      case 'hope': {
        const current = toggleSlot({ max: c.hope.max, marked: c.hope.current }, index).marked;
        void this.characters.update(c.id, { hope: { ...c.hope, current } });
        return;
      }
      case 'armor': {
        const slotsMarked = toggleSlot(
          { max: c.armor.score, marked: c.armor.slotsMarked },
          index,
        ).marked;
        void this.characters.update(c.id, { armor: { ...c.armor, slotsMarked } });
      }
    }
  }

  protected tapNpc(track: 'hp' | 'stress', index: number): void {
    const n = this.npc();
    if (n) void this.npcs.update(n.id, { [track]: toggleSlot(n[track], index) });
  }

  protected saveNpcNotes(e: Event): void {
    const n = this.npc();
    if (n) void this.npcs.update(n.id, { notes: (e.target as HTMLTextAreaElement).value });
  }

  protected rangeLabel(n: Npc): string {
    return RANGE_LABELS[n.attack.range as keyof typeof RANGE_LABELS] ?? n.attack.range;
  }

  protected signed(v: number): string {
    return v > 0 ? `+${v}` : `${v}`;
  }
}
