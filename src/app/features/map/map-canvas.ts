import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import Konva from 'konva';
import { TOKEN_ICON_BOX, TOKEN_ICON_BY_ID } from '../../core/data/token-icons';
import { MapEvent, MapState, MapToken } from '../../core/models/map';
import {
  cellAt,
  cellKey,
  gridDimensions,
  HealthStatus,
  healthStatus,
  RANGE_SQUARES,
  rangeForSquares,
  snapToGrid,
  squaresBetween,
  Viewer,
  visibleTokens,
} from '../../core/rules/map';
import { playAttack } from './map-effects';

export type MapTool = 'move' | 'reveal' | 'hide' | 'ruler' | 'attack';

const MIN_SCALE = 0.15;
const MAX_SCALE = 5;
/** How long a ruler line stays on screen. */
const RULER_MS = 5000;
/** Events older than this are not replayed when a screen opens. */
const EVENT_FRESH_MS = 8000;
const STATUS_ICON: Record<Exclude<HealthStatus, 'ok'>, string> = {
  wounded: '🩸',
  critical: '💀',
  down: '✖',
};

/**
 * Konva stage for the battle map, shared by the GM editor and the TV view.
 * The GM sees hidden tokens (faded), exact HP pips and a translucent fog; the TV gets opaque fog,
 * no hidden tokens and only coarse health symbols.
 */
@Component({
  selector: 'app-map-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div
    #host
    class="size-full touch-none select-none"
    [class.cursor-crosshair]="tool() !== 'move'"
  ></div>`,
  host: { class: 'block size-full' },
})
export class MapCanvas {
  readonly state = input.required<MapState>();
  readonly image = input('');
  readonly viewer = input<Viewer>('gm');
  readonly tool = input<MapTool>('move');
  /** characterId / npcId → portrait data URL. */
  readonly portraits = input<Record<string, string>>({});
  /** characterId / npcId → HP. */
  readonly health = input<Record<string, { marked: number; max: number }>>({});
  readonly selectedId = input('');
  /** Draw the Daggerheart range bands around the selected token (GM). */
  readonly showRanges = input(false);

  readonly tokenMoved = output<{ id: string; x: number; y: number }>();
  readonly tokenSelected = output<string>();
  readonly fogPainted = output<{ cells: string[]; reveal: boolean }>();
  readonly rulerDone = output<{ from: { x: number; y: number }; to: { x: number; y: number } }>();
  /** In the attack tool, the token tapped as the target. */
  readonly attackTarget = output<string>();

  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('host');
  private stage?: Konva.Stage;
  private readonly base = new Konva.Layer({ listening: false });
  private readonly fog = new Konva.Layer({ listening: false });
  private readonly overlay = new Konva.Layer({ listening: false });
  private readonly tokens = new Konva.Layer();
  private readonly fx = new Konva.Layer({ listening: false });
  private readonly preview = new Konva.Layer({ listening: false });
  private img?: HTMLImageElement;
  private imgSrc = '';
  private fittedFor = '';
  private dragging = false;
  private stroke = new Set<string>();
  private painting = false;
  private rulerStart: { x: number; y: number } | null = null;
  private rulerTimer: ReturnType<typeof setTimeout> | undefined;
  private lastEventId = '';
  private lastPinch: { dist: number; center: { x: number; y: number } } | null = null;
  private readonly portraitCache = new Map<string, HTMLImageElement>();

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const el = this.host().nativeElement;
      this.stage = new Konva.Stage({
        container: el,
        width: el.clientWidth,
        height: el.clientHeight,
      });
      this.stage.add(this.base);
      // GM: fog under tokens so hidden things stay workable; TV: fog on top hides everything below it.
      if (this.viewer() === 'gm') this.stage.add(this.fog, this.overlay, this.tokens);
      else this.stage.add(this.overlay, this.tokens, this.fog);
      this.stage.add(this.fx, this.preview);
      this.bindInput();
      const ro = new ResizeObserver(() => this.resize());
      ro.observe(el);
      destroyRef.onDestroy(() => {
        ro.disconnect();
        clearTimeout(this.rulerTimer);
        this.stage?.destroy();
      });
      this.redraw();
    });

    // Re-render whenever the live state, the picture, the tool or the selection changes.
    effect(() => {
      this.state();
      this.portraits();
      this.health();
      this.selectedId();
      this.showRanges();
      this.loadImage(this.image());
      this.syncTool(this.tool());
      this.redraw();
    });

    // Play broadcast events (ruler lines, attack animations) once each.
    effect(() => {
      const ev = this.state().lastEvent;
      if (!ev || ev.id === this.lastEventId || !this.stage) return;
      const first = this.lastEventId === '';
      this.lastEventId = ev.id;
      if (first && Date.now() - ev.at > EVENT_FRESH_MS) return;
      this.play(ev);
    });
  }

  /** Fits the whole map in view (used on first load, on a new picture and by the toolbar). */
  fit(): void {
    const stage = this.stage;
    if (!stage) return;
    const { width, height } = this.state();
    const scale = Math.min(stage.width() / width, stage.height() / height) * 0.98;
    stage.scale({ x: scale, y: scale });
    stage.position({
      x: (stage.width() - width * scale) / 2,
      y: (stage.height() - height * scale) / 2,
    });
    stage.batchDraw();
  }

  zoom(factor: number): void {
    const stage = this.stage;
    if (!stage) return;
    this.zoomAt({ x: stage.width() / 2, y: stage.height() / 2 }, stage.scaleX() * factor);
  }

  /** Plays an event locally (the GM page calls this right away; the TV gets it from Firestore). */
  play(ev: MapEvent): void {
    if (ev.type === 'ruler') this.drawRuler(ev.from, ev.to, true);
    else playAttack(this.fx, ev, this.state().grid.size);
  }

  // ---------- Drawing ----------

  private redraw(): void {
    if (!this.stage) return;
    const s = this.state();
    const fitKey = `${this.imgSrc.length}:${s.width}x${s.height}`;
    if (this.fittedFor !== fitKey) {
      this.fittedFor = fitKey;
      this.fit();
    }
    this.drawBase(s);
    this.drawFog(s);
    this.drawOverlay(s);
    if (!this.dragging) this.drawTokens(s);
  }

  private drawBase(s: MapState): void {
    this.base.destroyChildren();
    if (this.img) {
      this.base.add(new Konva.Image({ image: this.img, width: s.width, height: s.height }));
    } else {
      this.base.add(new Konva.Rect({ width: s.width, height: s.height, fill: '#1a1626' }));
    }
    if (s.grid.show && s.grid.size >= 8) {
      const { cols, rows, startCol, startRow } = gridDimensions(s);
      const g = s.grid;
      const stroke = 'rgba(255,255,255,0.22)';
      for (let c = 0; c <= cols; c++) {
        const x = g.offsetX + (startCol + c) * g.size;
        this.base.add(
          new Konva.Line({
            points: [x, 0, x, s.height],
            stroke,
            strokeWidth: 1,
            strokeScaleEnabled: false,
          }),
        );
      }
      for (let r = 0; r <= rows; r++) {
        const y = g.offsetY + (startRow + r) * g.size;
        this.base.add(
          new Konva.Line({
            points: [0, y, s.width, y],
            stroke,
            strokeWidth: 1,
            strokeScaleEnabled: false,
          }),
        );
      }
    }
    this.base.batchDraw();
  }

  /** Full cover, then revealed cells are cut out with destination-out. */
  private drawFog(s: MapState): void {
    this.fog.destroyChildren();
    if (s.fog.enabled) {
      const tv = this.viewer() === 'tv';
      this.fog.opacity(tv ? 1 : 0.55);
      this.fog.add(
        new Konva.Rect({ width: s.width, height: s.height, fill: tv ? '#07050c' : '#2a1d4a' }),
      );
      const g = s.grid;
      for (const key of s.fog.revealed) {
        const [col, row] = key.split(',').map(Number);
        this.fog.add(
          new Konva.Rect({
            x: g.offsetX + col * g.size,
            y: g.offsetY + row * g.size,
            width: g.size,
            height: g.size,
            fill: '#000',
            globalCompositeOperation: 'destination-out',
          }),
        );
      }
    }
    this.fog.batchDraw();
  }

  /** Range bands around the selected token: squares, since a diagonal step counts as one. */
  private drawOverlay(s: MapState): void {
    this.overlay.destroyChildren();
    const t = s.tokens[this.selectedId()];
    if (this.viewer() === 'gm' && this.showRanges() && t) {
      const g = s.grid;
      const { col, row } = cellAt(g, t.x, t.y);
      for (const band of [...RANGE_SQUARES].reverse()) {
        const n = band.squares;
        const x = g.offsetX + (col - n) * g.size;
        const y = g.offsetY + (row - n) * g.size;
        const side = (2 * n + 1) * g.size;
        this.overlay.add(
          new Konva.Rect({
            x,
            y,
            width: side,
            height: side,
            stroke: band.color,
            strokeWidth: 2,
            dash: [10, 6],
            fill: band.color,
            opacity: 0.12,
            strokeScaleEnabled: false,
          }),
          new Konva.Rect({
            x,
            y,
            width: side,
            height: side,
            stroke: band.color,
            strokeWidth: 2,
            dash: [10, 6],
            strokeScaleEnabled: false,
            opacity: 0.9,
          }),
          new Konva.Text({
            x: x + 4,
            y: y + 4,
            text: band.label,
            fontSize: Math.max(12, g.size / 4),
            fontStyle: 'bold',
            fill: band.color,
            shadowColor: '#000',
            shadowBlur: 4,
          }),
        );
      }
    }
    this.overlay.batchDraw();
  }

  private drawTokens(s: MapState): void {
    this.tokens.destroyChildren();
    const gm = this.viewer() === 'gm';
    for (const t of visibleTokens(s, this.viewer())) {
      this.tokens.add(this.tokenNode(t, s, gm));
    }
    this.tokens.batchDraw();
  }

  private tokenNode(t: MapToken, s: MapState, gm: boolean): Konva.Group {
    const r = (t.size * s.grid.size) / 2 - 3;
    const selected = this.selectedId() === t.id;
    const hp = t.refId ? this.health()[t.refId] : undefined;
    const status = healthStatus(hp);
    const group = new Konva.Group({
      x: t.x,
      y: t.y,
      draggable: gm && this.tool() === 'move',
      opacity: t.hidden ? 0.5 : status === 'down' ? 0.55 : 1,
      name: 'token',
      id: t.id,
    });
    const portrait = t.refId ? this.portraits()[t.refId] : '';
    const pic = portrait ? this.portraitImage(portrait) : undefined;
    if (pic) {
      const clip = new Konva.Group({ clipFunc: (ctx) => ctx.arc(0, 0, r, 0, Math.PI * 2, false) });
      clip.add(new Konva.Image({ image: pic, x: -r, y: -r, width: r * 2, height: r * 2 }));
      group.add(clip);
    } else {
      group.add(new Konva.Circle({ radius: r, fill: t.color }));
      const icon = t.icon ? TOKEN_ICON_BY_ID.get(t.icon) : undefined;
      if (icon) {
        // Icon fills ~64% of the disc; the path lives in a 512 box.
        const scale = (r * 1.28) / TOKEN_ICON_BOX;
        group.add(
          new Konva.Path({
            data: icon.path,
            fill: '#fff',
            scaleX: scale,
            scaleY: scale,
            x: -r * 0.64,
            y: -r * 0.64,
            shadowColor: '#000',
            shadowBlur: 2,
            shadowOpacity: 0.5,
          }),
        );
      } else
        group.add(
          new Konva.Text({
            text: t.label.charAt(0).toUpperCase(),
            fontSize: r,
            fontStyle: 'bold',
            fill: '#fff',
            width: r * 2,
            height: r * 2,
            x: -r,
            y: -r,
            align: 'center',
            verticalAlign: 'middle',
          }),
        );
    }
    group.add(
      new Konva.Circle({
        radius: r,
        stroke: selected ? '#f5b83d' : t.kind === 'pc' ? '#f5b83d' : t.color,
        strokeWidth: selected ? 5 : 3,
        dash: t.hidden ? [6, 4] : undefined,
        shadowColor: '#000',
        shadowBlur: 6,
        shadowOpacity: 0.7,
      }),
    );

    // GM: exact HP as pips around the top of the token.
    if (gm && hp && hp.max > 0) this.addHpPips(group, hp, r);
    // Everyone: a coarse status symbol instead of numbers.
    if (status !== 'ok') {
      if (status === 'down') {
        group.add(
          new Konva.Line({
            points: [-r * 0.7, -r * 0.7, r * 0.7, r * 0.7],
            stroke: '#e5484d',
            strokeWidth: Math.max(3, r / 5),
            lineCap: 'round',
          }),
        );
        group.add(
          new Konva.Line({
            points: [r * 0.7, -r * 0.7, -r * 0.7, r * 0.7],
            stroke: '#e5484d',
            strokeWidth: Math.max(3, r / 5),
            lineCap: 'round',
          }),
        );
      } else {
        const size = Math.max(14, r * 0.7);
        group.add(
          new Konva.Circle({
            x: r * 0.75,
            y: -r * 0.75,
            radius: size * 0.62,
            fill: 'rgba(15,12,24,0.85)',
            stroke: status === 'critical' ? '#e5484d' : '#f5b83d',
            strokeWidth: 2,
          }),
          new Konva.Text({
            x: r * 0.75 - size / 2,
            y: -r * 0.75 - size / 2,
            width: size,
            height: size,
            text: STATUS_ICON[status],
            fontSize: size * 0.75,
            align: 'center',
            verticalAlign: 'middle',
          }),
        );
      }
    }

    const label = new Konva.Label({ y: r + 2 }).add(
      new Konva.Tag({
        fill: 'rgba(15,12,24,0.8)',
        cornerRadius: 4,
        pointerDirection: 'up',
        pointerWidth: 6,
        pointerHeight: 4,
      }),
      new Konva.Text({
        text: t.label,
        fontSize: Math.max(11, s.grid.size / 5),
        fill: '#fff',
        padding: 3,
      }),
    );
    group.add(label);
    label.x(-label.width() / 2);

    if (gm) {
      group.on('pointerdown', () => {
        if (this.tool() === 'attack') this.attackTarget.emit(t.id);
        else this.tokenSelected.emit(t.id);
      });
      group.on('dragstart', () => {
        this.dragging = true;
        group.moveToTop();
      });
      group.on('dragend', () => {
        this.dragging = false;
        const snapped = snapToGrid(s.grid, group.x(), group.y());
        group.position(snapped);
        this.tokenMoved.emit({ id: t.id, ...snapped });
      });
    }
    return group;
  }

  /** Up to 12 pips on an arc over the token; bigger pools fall back to a bar. */
  private addHpPips(group: Konva.Group, hp: { marked: number; max: number }, r: number): void {
    if (hp.max > 12) {
      const w = r * 1.6;
      group.add(
        new Konva.Rect({
          x: -w / 2,
          y: -r - 10,
          width: w,
          height: 6,
          fill: 'rgba(15,12,24,0.85)',
          cornerRadius: 3,
        }),
        new Konva.Rect({
          x: -w / 2,
          y: -r - 10,
          width: w * (1 - hp.marked / hp.max),
          height: 6,
          fill: '#3fae5a',
          cornerRadius: 3,
        }),
      );
      return;
    }
    const spread = Math.min(Math.PI * 0.9, hp.max * 0.22);
    const pip = Math.max(3, Math.min(6, r / 6));
    for (let i = 0; i < hp.max; i++) {
      const a =
        -Math.PI / 2 - spread / 2 + (hp.max === 1 ? spread / 2 : (spread * i) / (hp.max - 1));
      const marked = i >= hp.max - hp.marked;
      group.add(
        new Konva.Circle({
          x: Math.cos(a) * (r + pip + 2),
          y: Math.sin(a) * (r + pip + 2),
          radius: pip,
          fill: marked ? '#2a1d2a' : '#e5484d',
          stroke: '#0f0c18',
          strokeWidth: 1.5,
        }),
      );
    }
  }

  private drawRuler(
    from: { x: number; y: number },
    to: { x: number; y: number },
    temporary: boolean,
  ): void {
    clearTimeout(this.rulerTimer);
    const s = this.state();
    const squares = squaresBetween(s.grid, from, to);
    const range = rangeForSquares(squares);
    const color = RANGE_SQUARES.find((b) => b.id === range.id)?.color ?? '#a59cba';
    const a = snapToGrid(s.grid, from.x, from.y);
    const b = snapToGrid(s.grid, to.x, to.y);
    const size = Math.max(14, s.grid.size / 3.2);
    this.preview.destroyChildren();
    this.preview.add(
      new Konva.Line({
        points: [a.x, a.y, b.x, b.y],
        stroke: '#000',
        strokeWidth: 7,
        opacity: 0.5,
        lineCap: 'round',
        strokeScaleEnabled: false,
      }),
      new Konva.Line({
        points: [a.x, a.y, b.x, b.y],
        stroke: color,
        strokeWidth: 4,
        dash: [12, 8],
        lineCap: 'round',
        strokeScaleEnabled: false,
      }),
      new Konva.Circle({ x: a.x, y: a.y, radius: 6, fill: color }),
      new Konva.Circle({ x: b.x, y: b.y, radius: 6, fill: color }),
    );
    const label = new Konva.Label({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - size }).add(
      new Konva.Tag({
        fill: 'rgba(15,12,24,0.92)',
        stroke: color,
        strokeWidth: 2,
        cornerRadius: 6,
      }),
      new Konva.Text({
        text: `${squares} ${squares === 1 ? 'quadrado' : 'quadrados'} · ${range.label}`,
        fontSize: size,
        fontStyle: 'bold',
        fill: '#fff',
        padding: 6,
      }),
    );
    label.offsetX(label.width() / 2);
    this.preview.add(label);
    this.preview.batchDraw();
    if (temporary) {
      this.rulerTimer = setTimeout(() => {
        this.preview.destroyChildren();
        this.preview.batchDraw();
      }, RULER_MS);
    }
  }

  private portraitImage(src: string): HTMLImageElement | undefined {
    const cached = this.portraitCache.get(src);
    if (cached) return cached.complete ? cached : undefined;
    const img = new window.Image();
    img.onload = () => this.redraw();
    img.src = src;
    this.portraitCache.set(src, img);
    return undefined;
  }

  private loadImage(src: string): void {
    if (src === this.imgSrc) return;
    this.imgSrc = src;
    if (!src) {
      this.img = undefined;
      return;
    }
    const img = new window.Image();
    img.onload = () => {
      this.img = img;
      this.redraw();
    };
    img.src = src;
  }

  // ---------- Input ----------

  private syncTool(tool: MapTool): void {
    this.stage?.draggable(this.viewer() === 'gm' && (tool === 'move' || tool === 'attack'));
  }

  private resize(): void {
    const el = this.host().nativeElement;
    this.stage?.size({ width: el.clientWidth, height: el.clientHeight });
    if (this.viewer() === 'tv') this.fit();
    this.stage?.batchDraw();
  }

  private zoomAt(point: { x: number; y: number }, newScale: number): void {
    const stage = this.stage;
    if (!stage) return;
    const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));
    const old = stage.scaleX();
    const world = { x: (point.x - stage.x()) / old, y: (point.y - stage.y()) / old };
    stage.scale({ x: scale, y: scale });
    stage.position({ x: point.x - world.x * scale, y: point.y - world.y * scale });
    stage.batchDraw();
  }

  private bindInput(): void {
    const stage = this.stage;
    if (!stage || this.viewer() !== 'gm') return;
    this.syncTool(this.tool());

    stage.on('wheel', (e) => {
      e.evt.preventDefault();
      const pointer = stage.getPointerPosition();
      if (pointer) this.zoomAt(pointer, stage.scaleX() * (e.evt.deltaY > 0 ? 0.9 : 1.1));
    });

    // Two-finger pinch zoom (and pan) on touch screens.
    stage.on('touchmove', (e) => {
      const touches = e.evt.touches;
      if (touches.length !== 2) return;
      e.evt.preventDefault();
      stage.draggable(false);
      const rect = stage.container().getBoundingClientRect();
      const p1 = { x: touches[0].clientX - rect.left, y: touches[0].clientY - rect.top };
      const p2 = { x: touches[1].clientX - rect.left, y: touches[1].clientY - rect.top };
      const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      if (this.lastPinch) {
        this.zoomAt(center, stage.scaleX() * (dist / this.lastPinch.dist));
        stage.position({
          x: stage.x() + center.x - this.lastPinch.center.x,
          y: stage.y() + center.y - this.lastPinch.center.y,
        });
      }
      this.lastPinch = { dist, center };
    });
    stage.on('touchend', () => {
      this.lastPinch = null;
      this.syncTool(this.tool());
    });

    stage.on('pointerdown', (e) => {
      const tool = this.tool();
      if (tool === 'move' || tool === 'attack') {
        if (e.target === stage || e.target.getLayer() === this.base) this.tokenSelected.emit('');
        return;
      }
      if ((e.evt as PointerEvent).isPrimary === false) return;
      const pos = stage.getRelativePointerPosition();
      if (tool === 'ruler') {
        if (pos) this.rulerStart = pos;
        return;
      }
      this.painting = true;
      this.stroke.clear();
      this.paintAtPointer();
    });
    stage.on('pointermove', () => {
      if (this.painting) this.paintAtPointer();
      const pos = stage.getRelativePointerPosition();
      if (this.rulerStart && pos) this.drawRuler(this.rulerStart, pos, false);
    });
    const finish = () => {
      if (this.rulerStart) {
        const pos = stage.getRelativePointerPosition();
        if (pos) {
          this.drawRuler(this.rulerStart, pos, true);
          this.rulerDone.emit({ from: this.rulerStart, to: pos });
        }
        this.rulerStart = null;
      }
      if (!this.painting) return;
      this.painting = false;
      this.preview.destroyChildren();
      this.preview.batchDraw();
      if (this.stroke.size)
        this.fogPainted.emit({ cells: [...this.stroke], reveal: this.tool() === 'reveal' });
      this.stroke.clear();
    };
    stage.on('pointerup pointerleave', finish);
  }

  private paintAtPointer(): void {
    const stage = this.stage;
    const pos = stage?.getRelativePointerPosition();
    if (!pos) return;
    const s = this.state();
    const { col, row } = cellAt(s.grid, pos.x, pos.y);
    const key = cellKey(col, row);
    if (this.stroke.has(key)) return;
    this.stroke.add(key);
    this.preview.add(
      new Konva.Rect({
        x: s.grid.offsetX + col * s.grid.size,
        y: s.grid.offsetY + row * s.grid.size,
        width: s.grid.size,
        height: s.grid.size,
        fill: this.tool() === 'reveal' ? 'rgba(245,184,61,0.35)' : 'rgba(139,92,246,0.55)',
      }),
    );
    this.preview.batchDraw();
  }
}
