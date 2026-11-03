import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ADVERSARY_TYPES, RANGE_LABELS, TIER1_ADVERSARIES } from '../../core/data/srd';
import { SrdAdversary } from '../../core/data/srd/adversaries-tier1';
import { NpcRepository } from '../../core/firebase/npc.repository';
import { npcFromAdversary, searchAdversaries } from '../../core/rules/npc-import';
import { TokenIconView } from '../../shared/ui/icon-picker';
import { RichText } from '../../shared/ui/rich-text';

/** SRD Tier 1 catalog: search, read the stat block, import as an editable NPC. */
@Component({
  selector: 'app-bestiary-dialog',
  imports: [TokenIconView, RichText],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex max-h-[calc(100dvh-1.5rem)] flex-col overflow-hidden rounded-2xl border border-line bg-panel"
    >
      <div class="flex items-center justify-between gap-2 border-b border-line p-3">
        <h2 class="font-display text-lg text-fear">Bestiário · Patamar 1</h2>
        <button type="button" class="btn px-3 text-sm" (click)="ref.close()">Fechar</button>
      </div>
      <div class="flex flex-col gap-2 border-b border-line p-3 sm:flex-row">
        <input
          class="field min-w-0 flex-1"
          type="search"
          placeholder="Buscar (pt ou inglês)…"
          aria-label="Buscar adversário"
          [value]="query()"
          (input)="query.set(value($event))"
        />
        <select
          class="field sm:w-44"
          aria-label="Filtrar por tipo"
          (change)="type.set(value($event))"
        >
          <option value="">Todos os tipos</option>
          @for (t of types; track t.id) {
            <option [value]="t.id">{{ t.name }}</option>
          }
        </select>
      </div>
      @if (message()) {
        <p class="mx-3 mt-3 rounded-lg bg-hope/15 px-3 py-2 text-sm text-hope" role="status">
          {{ message() }}
        </p>
      }
      <ul class="flex flex-col gap-2 overflow-y-auto p-3">
        @for (a of results(); track a.id) {
          <li class="rounded-xl border border-line bg-panel-2/60">
            <div class="flex items-center gap-3 p-2">
              <span
                class="grid size-11 shrink-0 place-items-center rounded-full bg-fear/30 text-white"
              >
                <app-token-icon class="size-7" [icon]="a.icon" />
              </span>
              <button
                type="button"
                class="min-h-11 min-w-0 flex-1 text-left"
                (click)="toggle(a.id)"
                [attr.aria-expanded]="openId() === a.id"
              >
                <span class="block truncate font-semibold text-white">{{ a.name }}</span>
                <span class="block truncate text-xs text-muted">
                  {{ typeName(a) }} · Dif {{ a.difficulty }} · PV {{ a.hp }} · Est {{ a.stress }}
                </span>
              </button>
              <button
                type="button"
                class="btn-fear shrink-0 px-3 text-sm"
                [disabled]="busy()"
                (click)="importOne(a)"
              >
                + Importar
              </button>
            </div>
            @if (openId() === a.id) {
              <div class="flex flex-col gap-2 border-t border-line p-3 text-sm">
                <p class="italic text-muted">{{ a.description }}</p>
                <p><span class="text-muted">Motivações e táticas:</span> {{ a.motives }}</p>
                <p>
                  <span class="text-muted">Limiares:</span> {{ thresholds(a) }} ·
                  <span class="text-muted">Ataque:</span>
                  {{ a.attack.modifier >= 0 ? '+' : '' }}{{ a.attack.modifier }} ·
                  {{ a.attack.name }} · {{ rangeLabel(a) }} · {{ a.attack.damage }}
                </p>
                @if (a.experiences) {
                  <p><span class="text-muted">Experiências:</span> {{ a.experiences }}</p>
                }
                <app-rich-text [text]="a.features" />
                <p class="text-xs text-muted">{{ a.nameEn }} — SRD 2.0</p>
              </div>
            }
          </li>
        } @empty {
          <li class="text-sm text-muted">Nenhum adversário encontrado.</li>
        }
      </ul>
      <p class="border-t border-line px-3 py-2 text-[11px] text-muted/80">
        SRD 2.0 © Critical Role, LLC (DPCGL), traduzido. Ícones dos tokens:
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
    </div>
  `,
})
export class BestiaryDialog {
  protected readonly ref = inject(DialogRef);
  private readonly npcs = inject(NpcRepository);
  protected readonly types = ADVERSARY_TYPES;
  protected readonly query = signal('');
  protected readonly type = signal('');
  protected readonly openId = signal('');
  protected readonly busy = signal(false);
  protected readonly message = signal('');
  protected readonly results = computed(() =>
    searchAdversaries(TIER1_ADVERSARIES, this.query(), this.type()),
  );

  protected typeName(a: SrdAdversary): string {
    const name = ADVERSARY_TYPES.find((t) => t.id === a.type)?.name ?? a.type;
    return a.hordeHp ? `${name} (${a.hordeHp}/PV)` : name;
  }

  protected thresholds(a: SrdAdversary): string {
    const { major, severe } = a.thresholds;
    if (major === null) return 'nenhum (Lacaio)';
    return `${major} / ${severe ?? '—'}`;
  }

  protected rangeLabel(a: SrdAdversary): string {
    return RANGE_LABELS[a.attack.range];
  }

  protected toggle(id: string): void {
    this.openId.set(this.openId() === id ? '' : id);
  }

  protected async importOne(a: SrdAdversary): Promise<void> {
    this.busy.set(true);
    try {
      await this.npcs.save(npcFromAdversary(a, this.npcs.newId()));
      this.message.set(`${a.name} entrou na lista de NPCs. Edite à vontade.`);
    } finally {
      this.busy.set(false);
    }
  }

  protected value(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }
}
