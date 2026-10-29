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
import { MapState, MapToken } from '../../core/models/map';
import {
  cellAt,
  cellKey,
  gridDimensions,
  snapToGrid,
  Viewer,
  visibleTokens,
} from '../../core/rules/map';

export type MapTool = 'move' | 'reveal' | 'hide';

const MIN_SCALE = 0.15;
const MAX_SCALE = 5;

/**
 * Konva stage for the battle map, shared by the GM editor and the TV view.
 * The GM sees hidden tokens (faded) and a translucent fog; the TV gets opaque fog and no hidden tokens.
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
  /** characterId → portrait data URL. */
  readonly portraits = input<Record<string, string>>({});
  readonly selectedId = input('');

  readonly tokenMoved = output<{ id: string; x: number; y: number }>();
  readonly tokenSelected = output<string>();
  readonly fogPainted = output<{ cells: string[]; reveal: boolean }>();

  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('host');
  private stage?: Konva.Stage;
  private readonly base = new Konva.Layer({ listening: false });
  private readonly fog = new Konva.Layer({ listening: false });
  private readonly tokens = new Konva.Layer();
  private readonly preview = new Konva.Layer({ listening: false });
  private img?: HTMLImageElement;
  private imgSrc = '';
  private fittedFor = '';
  private dragging = false;
  private stroke = new Set<string>();
  private painting = false;
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
      if (this.viewer() === 'gm') this.stage.add(this.fog, this.tokens);
      else this.stage.add(this.tokens, this.fog);
      this.stage.add(this.preview);
      this.bindInput();
      const ro = new ResizeObserver(() => this.resize());
      ro.observe(el);
      destroyRef.onDestroy(() => {
        ro.disconnect();
        this.stage?.destroy();
      });
      this.redraw();
    });

    // Re-render whenever the live state, the picture, the tool or the selection changes.
    effect(() => {
      this.state();
      this.portraits();
      this.selectedId();
      this.loadImage(this.image());
      this.syncTool(this.tool());
      this.redraw();
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
    const group = new Konva.Group({
      x: t.x,
      y: t.y,
      draggable: gm && this.tool() === 'move',
      opacity: t.hidden ? 0.5 : 1,
      name: 'token',
    });
    const portrait = t.kind === 'pc' ? this.portraits()[t.refId] : '';
    const pic = portrait ? this.portraitImage(portrait) : undefined;
    if (pic) {
      const clip = new Konva.Group({ clipFunc: (ctx) => ctx.arc(0, 0, r, 0, Math.PI * 2, false) });
      clip.add(new Konva.Image({ image: pic, x: -r, y: -r, width: r * 2, height: r * 2 }));
      group.add(clip);
    } else {
      group.add(new Konva.Circle({ radius: r, fill: t.color }));
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
    group.add(
      new Konva.Label({ y: r + 2 }).add(
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
      ),
    );
    // Center the label under the token.
    const label = group.findOne<Konva.Label>('Label');
    if (label) label.x(-label.width() / 2);

    if (gm) {
      group.on('pointerdown', () => this.tokenSelected.emit(t.id));
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
    this.stage?.draggable(this.viewer() === 'gm' && tool === 'move');
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

    // Fog brush.
    stage.on('pointerdown', (e) => {
      if (this.tool() === 'move') {
        if (e.target === stage || e.target.getLayer() === this.base) this.tokenSelected.emit('');
        return;
      }
      if ((e.evt as PointerEvent).isPrimary === false) return;
      this.painting = true;
      this.stroke.clear();
      this.paintAtPointer();
    });
    stage.on('pointermove', () => {
      if (this.painting) this.paintAtPointer();
    });
    const finish = () => {
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
