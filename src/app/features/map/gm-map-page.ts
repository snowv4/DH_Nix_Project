import {
  linkedSignal,
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
import { NpcRepository } from '../../core/firebase/npc.repository';
import { MapGrid, MapToken } from '../../core/models/map';
import { cellKey, freeSpawnPoint, gridDimensions, paintFog } from '../../core/rules/map';
import { resizeImageToDataUrl } from '../../shared/ui/resize-image';
import { IconPicker } from '../../shared/ui/icon-picker';
import { GRID_OPACITY, MapCanvas, MapTool } from './map-canvas';
import { ATTACK_EFFECTS } from './map-effects';
import { TokenSheet } from './token-sheet';
import { DamageChoice, DamageDialog, DamageTarget } from './damage-dialog';
import { applyDamage, resolveDamage } from '../../core/rules/damage';
import { DamageKind, DamageOutcome } from '../../core/models/damage';
import { Character } from '../../core/models/character';
import { Npc } from '../../core/models/npc';
import { Dialog } from '@angular/cdk/dialog';
import { SheetDialog } from '../gm-panel/sheet-dialog';
import { NpcDialog } from '../npcs/npc-dialog';

const MONSTER_COLORS = ['#d64545', '#e07b2c', '#3fae5a', '#3b82f6', '#8b5cf6', '#6b7280'];
/** Keeps the map picture well under Firestore's 1 MB document limit. */
const MAP_MAX_SIZE = 1600;

/** `/mestre/mapa` — GM battle map editor: map library, grid, fog, tokens, ruler (spec 4.7). */
type PanelTab = 'tokens' | 'map' | 'library';

@Component({
  selector: 'app-gm-map-page',
  imports: [MapCanvas, RouterLink, IconPicker, TokenSheet, DamageDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gm-map-page.html',
})
export class GmMapPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly maps = inject(MapRepository);
  private readonly injector = inject(Injector);
  private readonly canvas = viewChild(MapCanvas);

  // ---------- Which map ----------
  protected readonly activeId = this.maps.watchActiveId(this.destroyRef);
  protected readonly mapList = this.maps.watchList(this.destroyRef);
  /** Map open in the editor; defaults to the one on the TV so the GM can also prep the next scene. */
  private readonly editingId = signal('');
  protected readonly mapId = computed(() => this.editingId() || this.activeId() || '');
  protected readonly state = this.maps.watchMap(this.mapId, this.injector);
  protected readonly image = this.maps.watchCurrentImage(this.state, this.injector);
  protected readonly isActive = computed(() => !!this.mapId() && this.mapId() === this.activeId());

  // ---------- People ----------
  private readonly characterRepo = inject(CharacterRepository);
  private readonly npcRepo = inject(NpcRepository);
  protected readonly characters = this.characterRepo.watchAll(this.destroyRef);
  protected readonly npcs = this.npcRepo.watchAll(this.destroyRef);
  private readonly dialog = inject(Dialog);
  /** characterId / npcId → portrait, for token pictures. */
  protected readonly portraits = computed(() =>
    Object.fromEntries([...this.characters(), ...this.npcs()].map((c) => [c.id, c.portraitUrl])),
  );
  /** characterId / npcId → HP, for the health markers on tokens. */
  protected readonly health = computed(() =>
    Object.fromEntries([...this.characters(), ...this.npcs()].map((c) => [c.id, c.hp])),
  );
  protected readonly conditionsByRef = computed(() =>
    Object.fromEntries([...this.characters(), ...this.npcs()].map((c) => [c.id, c.conditions])),
  );

  // ---------- UI state ----------
  protected readonly tool = signal<MapTool>('move');
  protected readonly showRanges = signal(true);
  protected readonly selectedId = signal('');
  protected readonly panel = signal<PanelTab>('tokens');
  protected readonly panelTabs: readonly { id: PanelTab; label: string }[] = [
    { id: 'tokens', label: 'Tokens' },
    { id: 'map', label: 'Grade e névoa' },
    { id: 'library', label: 'Mapas' },
  ];
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly monsterName = signal('');
  protected readonly monsterColor = signal(MONSTER_COLORS[0]);
  protected readonly monsterIcon = signal('');
  protected readonly colors = MONSTER_COLORS;
  protected readonly gridRows: {
    key: 'size' | 'offsetX' | 'offsetY';
    label: string;
    step: number;
  }[] = [
    { key: 'size', label: 'Tamanho do quadrado', step: 5 },
    { key: 'offsetX', label: 'Deslocar ↔', step: 2 },
    { key: 'offsetY', label: 'Deslocar ↕', step: 2 },
  ];

  protected readonly tokenList = computed(() =>
    Object.values(this.state().tokens).sort((a, b) => a.label.localeCompare(b.label)),
  );
  protected readonly selected = computed(() => this.state().tokens[this.selectedId()]);
  /** Sheet behind the selected token (PC or NPC), for the quick sheet card. */
  protected readonly selectedCharacter = computed(() => {
    const t = this.selected();
    return t?.kind === 'pc' ? this.characters().find((c) => c.id === t.refId) : undefined;
  });
  protected readonly selectedNpc = computed(() => {
    const t = this.selected();
    return t?.kind === 'monster' && t.refId ? this.npcs().find((n) => n.id === t.refId) : undefined;
  });
  /** Reopens on every new selection; the ✕ only hides it for the current token. */
  protected readonly sheetOpen = linkedSignal(() => !!this.selectedId());
  protected readonly sheetExtended = signal(false);
  protected readonly gridOpacityPct = computed(() =>
    Math.round((this.state().grid.opacity ?? GRID_OPACITY) * 100),
  );
  /** PCs not on this map yet. */
  protected readonly missingPcs = computed(() => {
    const onMap = new Set(
      this.tokenList()
        .filter((t) => t.kind === 'pc')
        .map((t) => t.refId),
    );
    return this.characters().filter((c) => !onMap.has(c.id));
  });
  /** How many squares fit across the picture with the current grid. */
  protected readonly squaresWide = computed(() =>
    Math.round(this.state().width / this.state().grid.size),
  );

  // ---------- Library ----------

  protected openMap(id: string): void {
    this.editingId.set(id);
    this.selectedId.set('');
    this.panel.set('tokens');
  }

  protected async newMap(): Promise<void> {
    const name = window.prompt('Nome do novo mapa:', `Mapa ${this.mapList().length + 1}`);
    if (!name?.trim()) return;
    const id = await this.maps.createMap(name.trim());
    // The very first map goes straight to the TV.
    if (!this.activeId()) await this.maps.setActive(id);
    this.editingId.set(id);
    this.panel.set('map');
  }

  protected activate(id: string): void {
    void this.maps.setActive(id);
  }

  protected rename(id: string, current: string): void {
    const name = window.prompt('Novo nome do mapa:', current);
    if (name?.trim()) void this.maps.rename(id, name.trim());
  }

  protected async duplicate(id: string, name: string): Promise<void> {
    const newId = await this.maps.duplicate(id, `${name} (cópia)`);
    this.editingId.set(newId);
  }

  protected async removeMap(id: string, name: string): Promise<void> {
    if (id === this.activeId()) {
      window.alert('Esse mapa está na TV. Ative outro antes de excluir.');
      return;
    }
    if (!window.confirm(`Excluir o mapa “${name}”? Isso não pode ser desfeito.`)) return;
    if (id === this.mapId()) this.editingId.set('');
    await this.maps.remove(id);
  }

  // ---------- Picture & grid ----------

  protected async uploadMap(e: Event): Promise<void> {
    const el = e.target as HTMLInputElement;
    const file = el.files?.[0];
    el.value = '';
    if (!file || !this.mapId()) return;
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
      await this.maps.setImage(this.mapId(), url, width, height);
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

  /** "The map is N squares wide" → cell size, the easiest way to match a printed grid. */
  protected setSquaresWide(e: Event): void {
    const n = Number((e.target as HTMLInputElement).value);
    if (n >= 2 && n <= 200) this.setGrid({ size: this.state().width / n });
  }

  protected setGrid(patch: Partial<MapGrid>): void {
    const grid = { ...this.state().grid, ...patch };
    grid.size = Math.max(10, Math.min(400, Math.round(grid.size * 10) / 10));
    void this.maps.setGrid(this.mapId(), grid);
  }

  // ---------- Fog ----------

  protected toggleFog(): void {
    const fog = this.state().fog;
    void this.maps.setFog(this.mapId(), { ...fog, enabled: !fog.enabled });
  }

  protected onFogPainted(e: { cells: string[]; reveal: boolean }): void {
    const fog = this.state().fog;
    void this.maps.setFog(this.mapId(), {
      ...fog,
      revealed: paintFog(fog.revealed, e.cells, e.reveal),
    });
  }

  protected revealAll(): void {
    const s = this.state();
    const { cols, rows, startCol, startRow } = gridDimensions(s);
    const all: string[] = [];
    for (let c = 0; c < cols; c++)
      for (let r = 0; r < rows; r++) all.push(cellKey(startCol + c, startRow + r));
    void this.maps.setFog(this.mapId(), { ...s.fog, revealed: all });
  }

  protected hideAll(): void {
    void this.maps.setFog(this.mapId(), { ...this.state().fog, revealed: [] });
  }

  // ---------- Tokens ----------

  protected addPc(e: Event): void {
    const select = e.target as HTMLSelectElement;
    const c = this.characters().find((x) => x.id === select.value);
    select.value = '';
    if (!c) return;
    this.addToken({
      id: `pc-${c.id}`,
      kind: 'pc',
      refId: c.id,
      label: c.name,
      color: '#f5b83d',
      hidden: false,
    });
  }

  protected addNpc(e: Event): void {
    const select = e.target as HTMLSelectElement;
    const n = this.npcs().find((x) => x.id === select.value);
    select.value = '';
    if (!n) return;
    this.addToken({
      id: `npc-${n.id}-${Date.now().toString(36)}`,
      kind: 'monster',
      refId: n.id,
      label: n.name,
      icon: n.icon ?? '',
      color: '#8b5cf6',
      hidden: true,
    });
  }

  protected addMonster(): void {
    const label = this.monsterName().trim() || 'Monstro';
    // Monsters start hidden so the GM can place them before the reveal.
    this.addToken({
      id: `m-${Date.now().toString(36)}`,
      kind: 'monster',
      refId: '',
      label,
      icon: this.monsterIcon(),
      color: this.monsterColor(),
      hidden: true,
    });
    this.monsterName.set('');
  }

  protected readonly npcList = this.npcs;

  private addToken(t: Omit<MapToken, 'x' | 'y' | 'size'>): void {
    if (!this.mapId()) return;
    const token: MapToken = { ...t, ...freeSpawnPoint(this.state()), size: 1 };
    void this.maps.upsertToken(this.mapId(), token);
    this.selectedId.set(token.id);
  }

  protected updateSelected(patch: Partial<MapToken>): void {
    const t = this.selected();
    if (t) void this.maps.upsertToken(this.mapId(), { ...t, ...patch });
  }

  protected removeSelected(): void {
    const t = this.selected();
    if (!t) return;
    void this.maps.removeToken(this.mapId(), t.id);
    this.selectedId.set('');
  }

  protected onTokenMoved(e: { id: string; x: number; y: number }): void {
    void this.maps.moveToken(this.mapId(), e.id, e.x, e.y);
  }

  /** Ruler lines are shared with the TV only when this map is the one on it. */
  protected onRuler(e: { from: { x: number; y: number }; to: { x: number; y: number } }): void {
    if (!this.isActive()) return;
    void this.maps.sendEvent(this.mapId(), {
      id: `r-${Date.now()}`,
      type: 'ruler',
      ...e,
      effect: '',
      at: Date.now(),
    });
  }

  // ---------- Attacks ----------

  protected readonly effects = ATTACK_EFFECTS;
  protected readonly meleeEffects = ATTACK_EFFECTS.filter((e) => e.kind === 'melee');
  protected readonly rangedEffects = ATTACK_EFFECTS.filter((e) => e.kind === 'ranged');
  /** Attacker → target waiting for the GM to pick an effect. */
  protected readonly pendingAttack = signal<{ from: string; to: string } | null>(null);

  protected startAttack(): void {
    if (!this.selected()) return;
    this.tool.set('attack');
  }

  protected onAttackTarget(targetId: string): void {
    const from = this.selectedId();
    if (!from || from === targetId) return;
    this.pendingAttack.set({ from, to: targetId });
  }

  /** Animation chosen: now ask how much damage before playing anything. */
  protected playEffect(effect: string): void {
    const p = this.pendingAttack();
    this.pendingAttack.set(null);
    this.tool.set('move');
    if (p) this.pendingDamage.set({ ...p, effect });
  }

  protected readonly pendingDamage = signal<{ from: string; to: string; effect: string } | null>(
    null,
  );

  /** Sheet behind a token: PC, NPC or none (quick monster). */
  private sheetOf(tokenId: string): { pc?: Character; npc?: Npc } {
    const t = this.state().tokens[tokenId];
    if (!t?.refId) return {};
    if (t.kind === 'pc') return { pc: this.characters().find((c) => c.id === t.refId) };
    return { npc: this.npcs().find((n) => n.id === t.refId) };
  }

  protected readonly damageTarget = computed<DamageTarget | null>(() => {
    const p = this.pendingDamage();
    if (!p) return null;
    const { pc, npc } = this.sheetOf(p.to);
    const sheet = pc ?? npc;
    return {
      name: this.tokenLabel(p.to),
      hp: sheet ? sheet.hp : null,
      thresholds: sheet ? sheet.thresholds : null,
      armorLeft: pc ? Math.max(0, pc.armor.score - pc.armor.slotsMarked) : null,
    };
  });

  protected readonly damageKind = computed<DamageKind>(() => {
    const e = this.pendingDamage()?.effect ?? '';
    return ATTACK_EFFECTS.find((x) => x.id === e)?.kind === 'melee' || e === 'arrow'
      ? 'physical'
      : 'magic';
  });

  /** Applies the damage to the target's sheet, then broadcasts animation + outcome. */
  protected async applyDamage(choice: DamageChoice): Promise<void> {
    const p = this.pendingDamage();
    const target = this.damageTarget();
    this.pendingDamage.set(null);
    if (!p || !target) return;
    const r = resolveDamage({
      ...choice,
      thresholds: target.thresholds ?? { major: 0, severe: 0 },
      armorSlotsLeft: target.armorLeft ?? 0,
      massiveRule: true,
    });
    const hp = choice.miss ? 0 : r.hp;
    const armorUsed = !choice.miss && r.armorUsed;
    const { pc, npc } = this.sheetOf(p.to);
    const newHp = target.hp ? applyDamage(target.hp, hp) : null;
    if (pc && (hp || armorUsed)) {
      await this.characterRepo.update(pc.id, {
        hp: newHp ?? pc.hp,
        armor: armorUsed ? { ...pc.armor, slotsMarked: pc.armor.slotsMarked + 1 } : pc.armor,
      });
    } else if (npc && hp && newHp) {
      await this.npcRepo.update(npc.id, { hp: newHp });
    }
    const result: DamageOutcome = {
      miss: choice.miss,
      base: choice.miss ? 'none' : r.base,
      final: choice.miss ? 'none' : r.final,
      hp,
      armorUsed,
      direct: choice.direct,
      resistance: choice.resistance,
      kind: choice.kind,
      down: !!newHp && hp > 0 && newHp.marked >= newHp.max,
    };
    this.sendAttack(p, result);
  }

  protected animationOnly(): void {
    const p = this.pendingDamage();
    this.pendingDamage.set(null);
    if (p) this.sendAttack(p);
  }

  private sendAttack(
    p: { from: string; to: string; effect: string },
    result?: DamageOutcome,
  ): void {
    const a = this.state().tokens[p.from];
    const b = this.state().tokens[p.to];
    if (!a || !b) return;
    // The canvas plays it when the event comes back from Firestore, on this screen and on the TV.
    void this.maps.sendEvent(this.mapId(), {
      id: `a-${Date.now()}`,
      type: 'attack',
      from: { x: a.x, y: a.y },
      to: { x: b.x, y: b.y },
      effect: p.effect,
      at: Date.now(),
      ...(result ? { result } : {}),
    });
  }

  protected openFullSheet(): void {
    const c = this.selectedCharacter();
    const n = this.selectedNpc();
    const size = { maxWidth: 'calc(100vw - 1.5rem)', maxHeight: 'calc(100dvh - 1.5rem)' };
    if (c) this.dialog.open(SheetDialog, { data: c.id, width: '64rem', ...size });
    else if (n) this.dialog.open(NpcDialog, { data: n, width: '44rem', ...size });
  }

  protected cancelAttack(): void {
    this.pendingAttack.set(null);
    this.tool.set('move');
  }

  protected tokenLabel(id: string): string {
    return this.state().tokens[id]?.label ?? '';
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
