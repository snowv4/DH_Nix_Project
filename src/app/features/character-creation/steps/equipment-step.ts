import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import {
  ARMORS,
  PRIMARY_WEAPONS,
  SECONDARY_WEAPONS,
  STARTING_ITEMS,
  STARTING_POTIONS,
  Weapon,
} from '../../../core/data/srd';
import { BRAWLER_STRIKE_ID } from '../../../core/models/creation';
import {
  canUseSecondary,
  canWield,
  describeWeapon,
  selectedClass,
  spellcastTrait,
} from '../../../core/rules/creation';
import { CreationStore } from '../creation.store';

interface WeaponGroup {
  label: string;
  weapons: readonly Weapon[];
}

@Component({
  selector: 'app-equipment-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="text-muted">
      Escolha <strong class="text-white">uma arma primária de duas mãos</strong>, ou
      <strong class="text-white">uma primária de uma mão + uma secundária</strong> (opcional).
      Depois, uma armadura.
    </p>

    <div
      class="sticky top-0 z-10 -mx-3 mt-3 grid grid-cols-3 gap-2 bg-ink/95 px-3 py-2 text-center backdrop-blur"
    >
      <div class="rounded-lg bg-panel p-2">
        <p class="text-xs text-muted">Evasão</p>
        <p class="font-display text-2xl">{{ stats().evasion }}</p>
      </div>
      <div class="rounded-lg bg-panel p-2">
        <p class="text-xs text-muted">Armadura</p>
        <p class="font-display text-2xl">{{ stats().armorScore }}</p>
      </div>
      <div class="rounded-lg bg-panel p-2">
        <p class="text-xs text-muted">Limiares</p>
        <p class="font-display text-2xl">{{ stats().major }}/{{ stats().severe }}</p>
      </div>
    </div>

    <h3 class="label mt-4">Arma primária</h3>
    @if (isBrawler()) {
      <button
        type="button"
        class="card mt-2 w-full text-left text-sm"
        [class.!border-hope]="draft().primaryWeaponId === brawlerStrike"
        (click)="pickPrimary(brawlerStrike)"
      >
        <strong>Golpe de Lutador</strong> (Eu Sou a Arma) — atributo à sua escolha, Corpo a corpo,
        d8+d6 físico. +1 de Evasão enquanto você não tiver outra arma ativa.
      </button>
    }
    @for (g of primaryGroups(); track g.label) {
      <p class="mt-3 text-sm font-semibold text-muted">{{ g.label }}</p>
      <div class="mt-1 flex flex-col gap-2">
        @for (w of g.weapons; track w.id) {
          @let usable = wieldable(w);
          <button
            type="button"
            class="rounded-xl border border-line bg-panel px-3 py-2 text-left text-sm disabled:opacity-40"
            [class.!border-hope]="draft().primaryWeaponId === w.id"
            [attr.aria-pressed]="draft().primaryWeaponId === w.id"
            [disabled]="!usable"
            (click)="pickPrimary(w.id)"
          >
            <span class="font-semibold">{{ w.name }}</span>
            <span class="text-muted">
              ({{ w.nameEn }}) · {{ w.hands === 2 ? 'duas mãos' : 'uma mão' }}</span
            >
            <span class="block text-xs text-muted">{{ describe(w) }}</span>
          </button>
        }
      </div>
    }

    @if (secondaryAllowed()) {
      <h3 class="label mt-5">Arma secundária (opcional)</h3>
      <div class="mt-2 flex flex-col gap-2">
        <button
          type="button"
          class="rounded-xl border border-line bg-panel px-3 py-2 text-left text-sm"
          [class.!border-hope]="!draft().secondaryWeaponId"
          (click)="store.update({ secondaryWeaponId: '' })"
        >
          Nenhuma
        </button>
        @for (w of secondary; track w.id) {
          <button
            type="button"
            class="rounded-xl border border-line bg-panel px-3 py-2 text-left text-sm disabled:opacity-40"
            [class.!border-hope]="draft().secondaryWeaponId === w.id"
            [attr.aria-pressed]="draft().secondaryWeaponId === w.id"
            [disabled]="!wieldable(w)"
            (click)="store.update({ secondaryWeaponId: w.id })"
          >
            <span class="font-semibold">{{ w.name }}</span>
            <span class="text-muted">&ngsp;({{ w.nameEn }})</span>
            <span class="block text-xs text-muted">{{ describe(w) }}</span>
          </button>
        }
      </div>
    }

    <h3 class="label mt-5">Armadura</h3>
    <p class="text-xs text-muted">
      Limiares = base da armadura + seu nível (1). O Valor de Armadura é quantos Espaços de Armadura
      você tem.
    </p>
    <div class="mt-2 flex flex-col gap-2">
      @for (a of armors; track a.id) {
        <button
          type="button"
          class="rounded-xl border border-line bg-panel px-3 py-2 text-left text-sm"
          [class.!border-hope]="draft().armorId === a.id"
          [attr.aria-pressed]="draft().armorId === a.id"
          (click)="store.update({ armorId: a.id })"
        >
          <span class="font-semibold">{{ a.name }}</span>
          <span class="text-muted">&ngsp;({{ a.nameEn }})</span>
          <span class="block text-xs text-muted">
            Limiares base {{ a.thresholds[0] }}/{{ a.thresholds[1] }} · Armadura {{ a.score
            }}{{ a.feature ? ' · ' + a.feature.name + ': ' + a.feature.text : '' }}
          </span>
        </button>
      }
      <button
        type="button"
        class="rounded-xl border border-line bg-panel px-3 py-2 text-left text-sm"
        [class.!border-hope]="!draft().armorId"
        (click)="store.update({ armorId: '' })"
      >
        Sem armadura
        <span class="block text-xs text-muted">Armadura 0, limiares = nível / 2× nível.</span>
      </button>
    </div>

    <h3 class="label mt-5">Poção inicial</h3>
    <div class="mt-2 grid grid-cols-2 gap-2">
      @for (p of potions; track p.id) {
        <button
          type="button"
          class="btn-ghost h-auto flex-col py-2 text-sm"
          [class.!border-hope]="draft().potionId === p.id"
          [attr.aria-pressed]="draft().potionId === p.id"
          (click)="store.update({ potionId: p.id })"
        >
          {{ p.name }}<span class="text-xs font-normal text-muted">{{ p.text }}</span>
        </button>
      }
    </div>

    @if (cls(); as c) {
      <h3 class="label mt-5">Item da classe</h3>
      <div class="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        @for (item of c.items; track item) {
          <button
            type="button"
            class="btn-ghost h-auto py-2 text-sm"
            [class.!border-hope]="draft().classItem === item"
            [attr.aria-pressed]="draft().classItem === item"
            (click)="store.update({ classItem: item })"
          >
            {{ item }}
          </button>
        }
      </div>
    }

    <p class="mt-4 text-sm text-muted">
      Você também leva: {{ startingItems }} e um punhado de ouro.
    </p>
  `,
})
export class EquipmentStep {
  protected readonly store = inject(CreationStore);
  protected readonly draft = this.store.draft;
  protected readonly stats = this.store.stats;
  protected readonly secondary = SECONDARY_WEAPONS;
  protected readonly armors = ARMORS;
  protected readonly potions = STARTING_POTIONS;
  protected readonly startingItems = STARTING_ITEMS.join(', ').toLowerCase();
  protected readonly brawlerStrike = BRAWLER_STRIKE_ID;

  protected readonly cls = computed(() => selectedClass(this.draft()));
  protected readonly isBrawler = computed(() => this.draft().classId === 'brawler');
  protected readonly secondaryAllowed = computed(() => canUseSecondary(this.draft()));
  protected readonly primaryGroups = computed<WeaponGroup[]>(() => {
    const hasCast = !!spellcastTrait(this.draft());
    return [
      {
        label: 'Armas físicas',
        weapons: PRIMARY_WEAPONS.filter(
          (w) => w.damageType === 'phy' && !w.id.endsWith('wheelchair'),
        ),
      },
      {
        label: hasCast
          ? 'Armas mágicas'
          : 'Armas mágicas (exigem subclasse com atributo de Conjuração)',
        weapons: PRIMARY_WEAPONS.filter(
          (w) => w.damageType !== 'phy' && !w.id.endsWith('wheelchair'),
        ),
      },
      {
        label: 'Cadeiras de rodas de combate',
        weapons: PRIMARY_WEAPONS.filter((w) => w.id.endsWith('wheelchair')),
      },
    ];
  });

  protected wieldable(w: Weapon): boolean {
    return canWield(this.draft(), w);
  }

  protected describe(w: Weapon): string {
    // Drop the name: it is already shown in bold.
    return describeWeapon(w, spellcastTrait(this.draft())).replace(`${w.name} — `, '');
  }

  protected pickPrimary(id: string): void {
    this.store.update({ primaryWeaponId: id });
    if (!canUseSecondary(this.store.draft())) this.store.update({ secondaryWeaponId: '' });
  }
}
