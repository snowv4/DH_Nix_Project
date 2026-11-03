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
import { INK_COLORS, PAGE_WIDTH, Stroke } from '../../core/models/session-note';
import { simplify, strokeHit } from '../../core/rules/strokes';

export type InkMode = 'off' | 'pen' | 'eraser';

/**
 * Pressure-aware drawing surface in page units (PAGE_WIDTH wide), so the same notes render the
 * same on a phone, a tablet or a laptop. Pen, finger and mouse all draw; "pen only" lets the
 * palm rest on the screen and fingers scroll.
 */
@Component({
  selector: 'app-handwriting-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas
    #canvas
    class="block size-full"
    [style.touch-action]="touchAction()"
  ></canvas>`,
  host: { class: 'block', '[style.pointer-events]': "mode() === 'off' ? 'none' : 'auto'" },
})
export class HandwritingCanvas {
  readonly strokes = input.required<Stroke[]>();
  /** Page height in page units. */
  readonly height = input.required<number>();
  readonly mode = input<InkMode>('off');
  readonly color = input(0);
  readonly width = input(3);
  readonly penOnly = input(false);
  /** Emitted after each finished stroke or erase gesture with the full new list. */
  readonly strokesChange = output<Stroke[]>();

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private ctx?: CanvasRenderingContext2D;
  private scale = 1;
  private current: Stroke | null = null;
  private erasing: Stroke[] | null = null;

  protected touchAction(): string {
    if (this.mode() === 'off') return 'auto';
    return this.penOnly() ? 'pan-y' : 'none';
  }

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const el = this.canvas().nativeElement;
      this.ctx = el.getContext('2d') ?? undefined;
      const ro = new ResizeObserver(() => this.resize());
      ro.observe(el);
      destroyRef.onDestroy(() => ro.disconnect());
      el.addEventListener('pointerdown', (e) => this.down(e));
      el.addEventListener('pointermove', (e) => this.move(e));
      el.addEventListener('pointerup', () => this.up());
      el.addEventListener('pointercancel', () => this.up());
      this.resize();
    });
    effect(() => {
      this.strokes();
      this.height();
      this.redraw();
    });
  }

  private accepts(e: PointerEvent): boolean {
    if (this.mode() === 'off') return false;
    return !(this.penOnly() && e.pointerType === 'touch');
  }

  private toPage(e: PointerEvent): [number, number, number] {
    const rect = this.canvas().nativeElement.getBoundingClientRect();
    // Mice report 0 or 0.5; give them a steady medium pressure.
    const pressure = e.pointerType === 'pen' ? e.pressure : 0.5;
    return [
      (e.clientX - rect.left) / this.scale,
      (e.clientY - rect.top) / this.scale,
      Math.round(pressure * 100),
    ];
  }

  private down(e: PointerEvent): void {
    if (!this.accepts(e) || e.button > 0) return;
    e.preventDefault();
    this.canvas().nativeElement.setPointerCapture(e.pointerId);
    if (this.mode() === 'eraser') {
      this.erasing = [...this.strokes()];
      this.eraseAt(e);
      return;
    }
    this.current = { color: this.color(), width: this.width(), points: [...this.toPage(e)] };
  }

  private move(e: PointerEvent): void {
    if (this.erasing) {
      this.eraseAt(e);
      return;
    }
    if (!this.current) return;
    // Coalesced events keep pen strokes smooth at high sample rates.
    const events = e.getCoalescedEvents?.() ?? [e];
    for (const ev of events.length ? events : [e]) {
      const pts = this.current.points;
      const prev = pts.slice(-3);
      const next = this.toPage(ev);
      pts.push(...next);
      this.drawSegment(this.current, prev, next);
    }
  }

  private up(): void {
    if (this.erasing) {
      const after = this.erasing;
      this.erasing = null;
      if (after.length !== this.strokes().length) this.strokesChange.emit(after);
      return;
    }
    if (!this.current) return;
    const stroke = { ...this.current, points: simplify(this.current.points) };
    this.current = null;
    this.strokesChange.emit([...this.strokes(), stroke]);
  }

  private eraseAt(e: PointerEvent): void {
    if (!this.erasing) return;
    const [x, y] = this.toPage(e);
    const before = this.erasing.length;
    this.erasing = this.erasing.filter((s) => !strokeHit(s, x, y, 12));
    if (this.erasing.length !== before) this.redraw(this.erasing);
  }

  // ---------- Rendering ----------

  private resize(): void {
    const el = this.canvas().nativeElement;
    const cssWidth = el.clientWidth || 1;
    this.scale = cssWidth / PAGE_WIDTH;
    const dpr = window.devicePixelRatio || 1;
    el.style.height = `${this.height() * this.scale}px`;
    el.width = Math.round(cssWidth * dpr);
    el.height = Math.round(this.height() * this.scale * dpr);
    this.ctx?.setTransform(dpr * this.scale, 0, 0, dpr * this.scale, 0, 0);
    this.redraw();
  }

  private redraw(list = this.strokes()): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const el = this.canvas().nativeElement;
    if (Math.abs(el.clientHeight - this.height() * this.scale) > 1) {
      this.resize();
      return;
    }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, el.width, el.height);
    ctx.restore();
    for (const s of list) {
      for (let i = 3; i < s.points.length; i += 3) {
        this.drawSegment(s, s.points.slice(i - 3, i), s.points.slice(i, i + 3));
      }
      if (s.points.length === 3) this.drawSegment(s, s.points, s.points);
    }
  }

  private drawSegment(s: Stroke, a: number[], b: number[]): void {
    const ctx = this.ctx;
    if (!ctx || a.length < 3) return;
    const pressure = (a[2] + b[2]) / 200;
    ctx.strokeStyle = INK_COLORS[s.color] ?? INK_COLORS[0];
    ctx.lineWidth = s.width * (0.35 + pressure * 1.3);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0] + (a === b ? 0.01 : 0), b[1]);
    ctx.stroke();
  }
}
