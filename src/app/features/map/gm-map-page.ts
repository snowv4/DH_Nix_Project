import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  Injector,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CharacterRepository } from '../../core/firebase/character.repository';
import { MapRepository } from '../../core/firebase/map.repository';
import { MapGrid, MapToken } from '../../core/models/map';
import { cellKey, freeSpawnPoint, gridDimensions, paintFog } from '../../core/rules/map';
import { resizeImageToDataUrl } from '../../shared/ui/resize-image';
import { MapCanvas, MapTool } from './map-canvas';

const MONSTER_COLORS = ['#d64545', '#e07b2c', '#3fae5a', '#3b82f6', '#8b5cf6', '#6b7280'];
/** Keeps the map picture well under Firestore's 1 MB document limit. */
const MAP_MAX_SIZE = 1600;

/** `/mestre/mapa` — GM battle map editor: picture, grid, fog brush and tokens (spec 4.7). */
@Component({
  selector: 'app-gm-map-page',
  imports: [MapCanvas, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gm-map-page.html',
})
export class GmMapPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly maps = inject(MapRepository);
  protected readonly state = this.maps.watchState(this.destroyRef);
  protected readonly characters = inject(CharacterRepository).watchAll(this.destroyRef);
  private readonly canvas = viewChild(MapCanvas);

  protected readonly image = this.maps.watchCurrentImage(this.state, inject(Injector));
  protected readonly tool = signal<MapTool>('move');
  protected readonly selectedId = signal('');
  protected readonly panel = signal<'tokens' | 'map'>('tokens');
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly monsterName = signal('');
  protected readonly monsterColor = signal(MONSTER_COLORS[0]);
  protected readonly colors = MONSTER_COLORS;
  protected readonly gridRows: {
    key: 'size' | 'offsetX' | 'offsetY';
    label: string;
    step: number;
  }[] = [
    { key: 'size', label: 'Tamanho', step: 5 },
    { key: 'offsetX', label: 'Deslocar ↔', step: 2 },
    { key: 'offsetY', label: 'Deslocar ↕', step: 2 },
  ];

  protected readonly portraits = computed(() =>
    Object.fromEntries(this.characters().map((c) => [c.id, c.portraitUrl])),
  );
  protected readonly tokenList = computed(() =>
    Object.values(this.state().tokens).sort((a, b) => a.label.localeCompare(b.label)),
  );
  protected readonly selected = computed(() => this.state().tokens[this.selectedId()]);
  /** PCs not on the map yet. */
  protected readonly missingPcs = computed(() => {
    const onMap = new Set(
      this.tokenList()
        .filter((t) => t.kind === 'pc')
        .map((t) => t.refId),
    );
    return this.characters().filter((c) => !onMap.has(c.id));
  });

  // ---------- Picture & grid ----------

  protected async uploadMap(e: Event): Promise<void> {
    const el = e.target as HTMLInputElement;
    const file = el.files?.[0];
    el.value = '';
    if (!file) return;
    this.busy.set(true);
    this.error.set('');
    try {
      let quality = 0.72;
      let url = await resizeImageToDataUrl(file, MAP_MAX_SIZE, quality);
      while (url.length > 950_000 && quality > 0.3) {
        quality -= 0.12;
        url = await resizeImageToDataUrl(file, MAP_MAX_SIZE, quality);
      }
      const { width, height } = await imageSize(url);
      await this.maps.setImage(url, width, height, this.state().imageId);
    } catch (err: unknown) {
      console.error(err);
      this.error.set('Não consegui usar essa imagem. Tente outra (JPG ou PNG).');
    } finally {
      this.busy.set(false);
    }
  }

  protected stepGrid(key: 'size' | 'offsetX' | 'offsetY', delta: number): void {
    this.setGrid({ [key]: this.state().grid[key] + delta });
  }

  protected setGrid(patch: Partial<MapGrid>): void {
    const grid = { ...this.state().grid, ...patch };
    grid.size = Math.max(10, Math.min(400, grid.size));
    void this.maps.setGrid(grid);
  }

  // ---------- Fog ----------

  protected toggleFog(): void {
    const fog = this.state().fog;
    void this.maps.setFog({ ...fog, enabled: !fog.enabled });
  }

  protected onFogPainted(e: { cells: string[]; reveal: boolean }): void {
    const fog = this.state().fog;
    void this.maps.setFog({ ...fog, revealed: paintFog(fog.revealed, e.cells, e.reveal) });
  }

  protected revealAll(): void {
    const s = this.state();
    const { cols, rows, startCol, startRow } = gridDimensions(s);
    const all: string[] = [];
    for (let c = 0; c < cols; c++)
      for (let r = 0; r < rows; r++) all.push(cellKey(startCol + c, startRow + r));
    void this.maps.setFog({ ...s.fog, revealed: all });
  }

  protected hideAll(): void {
    void this.maps.setFog({ ...this.state().fog, revealed: [] });
  }

  // ---------- Tokens ----------

  /** New tokens appear in the free cell closest to the center. */
  private spawnPoint(): { x: number; y: number } {
    return freeSpawnPoint(this.state());
  }

  protected addPc(e: Event): void {
    const select = e.target as HTMLSelectElement;
    const c = this.characters().find((x) => x.id === select.value);
    select.value = '';
    if (!c) return;
    const token: MapToken = {
      id: `pc-${c.id}`,
      kind: 'pc',
      refId: c.id,
      label: c.name,
      color: '#f5b83d',
      ...this.spawnPoint(),
      size: 1,
      hidden: false,
    };
    void this.maps.upsertToken(token);
    this.selectedId.set(token.id);
  }

  protected addMonster(): void {
    const label = this.monsterName().trim() || 'Monstro';
    const id = `m-${Date.now().toString(36)}`;
    const token: MapToken = {
      id,
      kind: 'monster',
      refId: '',
      label,
      color: this.monsterColor(),
      ...this.spawnPoint(),
      size: 1,
      // Monsters start hidden so the GM can place them before the reveal.
      hidden: true,
    };
    void this.maps.upsertToken(token);
    this.selectedId.set(id);
    this.monsterName.set('');
  }

  protected updateSelected(patch: Partial<MapToken>): void {
    const t = this.selected();
    if (t) void this.maps.upsertToken({ ...t, ...patch });
  }

  protected removeSelected(): void {
    const t = this.selected();
    if (!t) return;
    void this.maps.removeToken(t.id);
    this.selectedId.set('');
  }

  protected onTokenMoved(e: { id: string; x: number; y: number }): void {
    void this.maps.moveToken(e.id, e.x, e.y);
  }

  // ---------- View ----------

  protected fit(): void {
    this.canvas()?.fit();
  }

  protected zoom(f: number): void {
    this.canvas()?.zoom(f);
  }

  protected openTv(): void {
    window.open('tv', 'dh-nix-tv', 'popup,width=1280,height=720');
  }

  protected value(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }
}

function imageSize(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = url;
  });
}
