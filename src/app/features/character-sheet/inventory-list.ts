import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { InventoryItem, ItemCategory } from '../../core/models/character';
import { ITEM_CATEGORIES, moveItem, useItem } from '../../core/rules/inventory';

/** Inventory as editable blocks: category icon, name, quantity stepper, note, use/reorder/remove. */
@Component({
  selector: 'app-inventory-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap gap-1" role="group" aria-label="Filtrar por categoria">
      <button
        type="button"
        class="btn min-h-9 px-3 text-xs"
        [class]="filter() === '' ? 'bg-panel-2 text-hope' : 'text-muted'"
        (click)="filter.set('')"
      >
        Tudo ({{ items().length }})
      </button>
      @for (cat of categories; track cat.id) {
        @if (count(cat.id)) {
          <button
            type="button"
            class="btn min-h-9 px-3 text-xs"
            [class]="filter() === cat.id ? 'bg-panel-2 text-hope' : 'text-muted'"
            (click)="filter.set(cat.id)"
          >
            {{ cat.icon }} {{ cat.label }} ({{ count(cat.id) }})
          </button>
        }
      }
    </div>

    <ul class="mt-3 flex flex-col gap-2">
      @for (it of visible(); track it.id) {
        <li
          class="rounded-xl border border-line bg-panel-2 p-2.5"
          [class.opacity-55]="it.qty === 0"
        >
          <div class="flex items-center gap-2">
            <label class="relative shrink-0" [title]="categoryLabel(it.category)">
              <span
                class="grid size-11 place-items-center rounded-lg bg-ink text-xl"
                aria-hidden="true"
                >{{ icon(it.category) }}</span
              >
              <select
                class="absolute inset-0 cursor-pointer opacity-0"
                [attr.aria-label]="'Categoria de ' + it.name"
                (change)="patch(it.id, { category: category($event) })"
              >
                @for (cat of categories; track cat.id) {
                  <option [value]="cat.id" [selected]="cat.id === it.category">
                    {{ cat.icon }} {{ cat.label }}
                  </option>
                }
              </select>
            </label>
            <input
              class="min-w-0 flex-1 rounded-md bg-transparent px-1 py-1 font-semibold text-white focus:bg-ink focus:outline-none"
              [value]="it.name"
              [attr.aria-label]="'Nome do item ' + it.name"
              (change)="patch(it.id, { name: text($event) })"
            />
            <div class="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                class="btn size-9 p-0 text-lg text-muted"
                [attr.aria-label]="'Menos ' + it.name"
                (click)="patch(it.id, { qty: it.qty - 1 })"
              >
                −
              </button>
              <span
                class="w-7 text-center font-display text-lg tabular-nums"
                [class.text-hope]="it.qty > 1"
                >{{ it.qty }}</span
              >
              <button
                type="button"
                class="btn size-9 p-0 text-lg text-muted"
                [attr.aria-label]="'Mais ' + it.name"
                (click)="patch(it.id, { qty: it.qty + 1 })"
              >
                +
              </button>
            </div>
          </div>
          <textarea
            class="mt-1 w-full resize-none rounded-md bg-transparent px-1 text-sm text-muted field-sizing-content placeholder:text-muted/40 focus:bg-ink focus:text-white focus:outline-none"
            rows="1"
            placeholder="Descrição ou efeito…"
            [attr.aria-label]="'Descrição de ' + it.name"
            [value]="it.note"
            (change)="patch(it.id, { note: text($event) })"
          ></textarea>
          <div class="mt-1 flex items-center justify-end gap-1">
            @if (it.category === 'consumable') {
              <button
                type="button"
                class="btn-hope min-h-9 px-3 text-xs"
                [disabled]="it.qty === 0"
                (click)="use(it.id)"
              >
                Usar
              </button>
            }
            <span class="flex-1"></span>
            <button
              type="button"
              class="btn size-9 p-0 text-muted"
              [attr.aria-label]="'Subir ' + it.name"
              (click)="move(it.id, -1)"
            >
              ↑
            </button>
            <button
              type="button"
              class="btn size-9 p-0 text-muted"
              [attr.aria-label]="'Descer ' + it.name"
              (click)="move(it.id, 1)"
            >
              ↓
            </button>
            <button
              type="button"
              class="btn min-h-9 px-2 text-xs text-muted hover:text-hp"
              (click)="remove(it.id)"
            >
              Remover
            </button>
          </div>
        </li>
      } @empty {
        <li class="text-sm text-muted">Nada por aqui ainda.</li>
      }
    </ul>

    <form
      class="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]"
      (submit)="add($event)"
    >
      <input
        class="field min-w-0 flex-[2]"
        name="name"
        placeholder="Novo item. Ex.: 3x Poção de Vida"
        aria-label="Nome do novo item"
        [value]="draftName()"
        (input)="draftName.set(text($event))"
      />
      <select
        class="field w-auto flex-1"
        aria-label="Categoria do novo item"
        (change)="draftCategory.set(category($event))"
      >
        @for (cat of categories; track cat.id) {
          <option [value]="cat.id" [selected]="cat.id === draftCategory()">
            {{ cat.icon }} {{ cat.label }}
          </option>
        }
      </select>
      <button type="submit" class="btn-hope" [disabled]="!draftName().trim()">Adicionar</button>
    </form>
  `,
})
export class InventoryList {
  readonly items = input.required<InventoryItem[]>();
  readonly changed = output<InventoryItem[]>();

  protected readonly categories = ITEM_CATEGORIES;
  protected readonly filter = signal<ItemCategory | ''>('');
  protected readonly draftName = signal('');
  protected readonly draftCategory = signal<ItemCategory>('gear');
  protected readonly visible = computed(() => {
    const f = this.filter();
    return f ? this.items().filter((i) => i.category === f) : this.items();
  });

  protected count(cat: ItemCategory): number {
    return this.items().filter((i) => i.category === cat).length;
  }

  protected icon(cat: ItemCategory): string {
    return ITEM_CATEGORIES.find((c) => c.id === cat)?.icon ?? '📜';
  }

  protected categoryLabel(cat: ItemCategory): string {
    return ITEM_CATEGORIES.find((c) => c.id === cat)?.label ?? '';
  }

  protected text(e: Event): string {
    return (e.target as HTMLInputElement | HTMLTextAreaElement).value;
  }

  protected category(e: Event): ItemCategory {
    return (e.target as HTMLSelectElement).value as ItemCategory;
  }

  protected patch(id: string, p: Partial<InventoryItem>): void {
    const next = this.items().map((it) =>
      it.id === id ? { ...it, ...p, qty: Math.max(0, p.qty ?? it.qty) } : it,
    );
    this.changed.emit(next);
  }

  protected use(id: string): void {
    this.changed.emit(useItem(this.items(), id));
  }

  protected move(id: string, delta: -1 | 1): void {
    this.changed.emit(moveItem(this.items(), id, delta));
  }

  protected remove(id: string): void {
    const it = this.items().find((i) => i.id === id);
    if (it && window.confirm(`Remover ${it.name}?`))
      this.changed.emit(this.items().filter((i) => i.id !== id));
  }

  protected add(e: Event): void {
    e.preventDefault();
    const raw = this.draftName().trim();
    if (!raw) return;
    const qtyMatch = /^(\d+)\s*x\s*(.+)$/i.exec(raw);
    const item: InventoryItem = {
      id: `it-${Date.now().toString(36)}`,
      name: qtyMatch ? qtyMatch[2] : raw,
      qty: qtyMatch ? Number(qtyMatch[1]) : 1,
      category: this.draftCategory(),
      note: '',
    };
    this.changed.emit([...this.items(), item]);
    this.draftName.set('');
  }
}
