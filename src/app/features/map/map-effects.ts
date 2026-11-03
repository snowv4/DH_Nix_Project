// Math.random() here only jitters visuals; game randomness still uses crypto (CLAUDE.md).
import Konva from 'konva';
import { MapEvent } from '../../core/models/map';

export interface AttackEffect {
  id: string;
  label: string;
  icon: string;
  kind: 'melee' | 'ranged';
}

export const ATTACK_EFFECTS: AttackEffect[] = [
  { id: 'slash', label: 'Corte', icon: '🗡️', kind: 'melee' },
  { id: 'impact', label: 'Impacto', icon: '🔨', kind: 'melee' },
  { id: 'pierce', label: 'Perfuração', icon: '🔱', kind: 'melee' },
  { id: 'arrow', label: 'Flecha', icon: '🏹', kind: 'ranged' },
  { id: 'fire', label: 'Fogo', icon: '🔥', kind: 'ranged' },
  { id: 'ice', label: 'Gelo', icon: '❄️', kind: 'ranged' },
  { id: 'lightning', label: 'Raio', icon: '⚡', kind: 'ranged' },
  { id: 'arcane', label: 'Arcano', icon: '✨', kind: 'ranged' },
  { id: 'shadow', label: 'Sombra', icon: '🌑', kind: 'ranged' },
  { id: 'poison', label: 'Veneno', icon: '🧪', kind: 'ranged' },
  { id: 'light', label: 'Luz / Cura', icon: '🌟', kind: 'ranged' },
];

interface Point {
  x: number;
  y: number;
}

const PALETTE: Record<string, { core: string; glow: string; spark: string }> = {
  arrow: { core: '#e8d6b0', glow: '#ffffff', spark: '#c9a66b' },
  fire: { core: '#ffb347', glow: '#ff5a1f', spark: '#ffe066' },
  ice: { core: '#c8f3ff', glow: '#4fc3f7', spark: '#ffffff' },
  lightning: { core: '#ffffff', glow: '#7dd3fc', spark: '#e0f2fe' },
  arcane: { core: '#e9d5ff', glow: '#a855f7', spark: '#f0abfc' },
  shadow: { core: '#4c1d95', glow: '#1e0b3a', spark: '#a78bfa' },
  poison: { core: '#a3e635', glow: '#4d7c0f', spark: '#d9f99d' },
  light: { core: '#fff7cc', glow: '#f5b83d', spark: '#ffffff' },
};

function reducedMotion(): boolean {
  return (
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Runs `step(t)` with t going 0→1 over `ms`, then cleans up. */
function animate(
  layer: Konva.Layer,
  ms: number,
  step: (t: number) => void,
  done?: () => void,
): void {
  const anim = new Konva.Animation((frame) => {
    const t = Math.min(1, (frame?.time ?? 0) / ms);
    step(t);
    if (t >= 1) {
      anim.stop();
      done?.();
    }
  }, layer);
  anim.start();
}

const easeOut = (t: number) => 1 - (1 - t) ** 3;

/**
 * Plays an attack from `ev.from` to `ev.to` on the effects layer. Melee hits play at the target;
 * ranged ones travel first. Reduced-motion users only get a short flash on the target.
 */
export function playAttack(layer: Konva.Layer, ev: MapEvent, cell: number): void {
  const from = ev.from;
  const to = ev.to;
  const size = Math.max(24, cell);
  if (reducedMotion()) {
    flash(layer, to, size, '#ffffff');
    return;
  }
  switch (ev.effect) {
    case 'slash':
      return slash(layer, to, size);
    case 'impact':
      return impact(layer, to, size);
    case 'pierce':
      return pierce(layer, from, to, size);
    case 'lightning':
      return lightning(layer, from, to, size);
    case 'light':
      return beam(layer, from, to, size);
    default:
      return projectile(layer, ev.effect, from, to, size);
  }
}

// ---------- Melee ----------

/** Three quick claw-like arcs across the target with a red flash. */
function slash(layer: Konva.Layer, at: Point, size: number): void {
  const group = new Konva.Group({ x: at.x, y: at.y, rotation: -35 });
  layer.add(group);
  const arcs = [-0.25, 0, 0.25].map(
    (o) =>
      new Konva.Line({
        points: [
          -size * 0.7,
          -size * 0.55 + o * size,
          0,
          -size * 0.05 + o * size,
          size * 0.7,
          -size * 0.55 + o * size,
        ],
        tension: 0.5,
        stroke: '#ffffff',
        strokeWidth: size * 0.07,
        lineCap: 'round',
        shadowColor: '#e5484d',
        shadowBlur: 14,
        opacity: 0,
      }),
  );
  arcs.forEach((a) => group.add(a));
  flash(layer, at, size, '#e5484d');
  animate(
    layer,
    520,
    (t) => {
      arcs.forEach((a, i) => {
        const local = Math.min(1, Math.max(0, (t - i * 0.12) / 0.5));
        a.opacity(local < 1 ? Math.sin(local * Math.PI) : 0);
        a.dashEnabled(true);
        a.dash([size * 2 * easeOut(local), size * 3]);
      });
    },
    () => group.destroy(),
  );
}

/** Heavy blunt hit: shockwave rings, star burst and a short screen shake. */
function impact(layer: Konva.Layer, at: Point, size: number): void {
  const rings = [0, 1].map(
    () =>
      new Konva.Circle({
        x: at.x,
        y: at.y,
        radius: size * 0.2,
        stroke: '#fde68a',
        strokeWidth: size * 0.12,
        opacity: 0.9,
      }),
  );
  rings.forEach((r) => layer.add(r));
  const burst = new Konva.Star({
    x: at.x,
    y: at.y,
    numPoints: 8,
    innerRadius: size * 0.15,
    outerRadius: size * 0.55,
    fill: '#fff7cc',
    opacity: 0.95,
    shadowColor: '#f5b83d',
    shadowBlur: 20,
  });
  layer.add(burst);
  sparks(layer, at, size, '#fde68a', 10, 0.9);
  const stage = layer.getStage();
  const origin = stage ? { x: stage.x(), y: stage.y() } : null;
  animate(
    layer,
    560,
    (t) => {
      rings.forEach((r, i) => {
        const local = Math.min(1, Math.max(0, t * 1.4 - i * 0.25));
        r.radius(size * (0.2 + local * 1.1));
        r.strokeWidth(size * 0.12 * (1 - local) + 1);
        r.opacity(1 - local);
      });
      burst.scale({ x: 1 + t * 0.6, y: 1 + t * 0.6 });
      burst.opacity(1 - t);
      if (stage && origin) {
        const k = (1 - t) * 6;
        stage.position({
          x: origin.x + (Math.random() - 0.5) * k,
          y: origin.y + (Math.random() - 0.5) * k,
        });
      }
    },
    () => {
      rings.forEach((r) => r.destroy());
      burst.destroy();
      if (stage && origin) stage.position(origin);
    },
  );
}

/** A thrust: a narrow spear-like streak driving into the target. */
function pierce(layer: Konva.Layer, from: Point, to: Point, size: number): void {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const back = { x: to.x - Math.cos(angle) * size * 1.4, y: to.y - Math.sin(angle) * size * 1.4 };
  const streak = new Konva.Arrow({
    points: [back.x, back.y, back.x, back.y],
    stroke: '#e2e8f0',
    fill: '#e2e8f0',
    strokeWidth: size * 0.06,
    pointerLength: size * 0.3,
    pointerWidth: size * 0.2,
    shadowColor: '#ffffff',
    shadowBlur: 12,
  });
  layer.add(streak);
  animate(
    layer,
    260,
    (t) => {
      const e = easeOut(t);
      streak.points([back.x, back.y, back.x + (to.x - back.x) * e, back.y + (to.y - back.y) * e]);
    },
    () => {
      streak.destroy();
      flash(layer, to, size, '#e5484d');
      sparks(layer, to, size, '#ffffff', 8, 0.7);
    },
  );
}

// ---------- Ranged ----------

/** A glowing projectile with a particle trail, then an element-colored burst. */
function projectile(
  layer: Konva.Layer,
  effect: string,
  from: Point,
  to: Point,
  size: number,
): void {
  const c = PALETTE[effect] ?? PALETTE['arcane'];
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  const ms = Math.min(900, 250 + dist * 0.6);
  const angle = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
  const head: Konva.Shape =
    effect === 'arrow'
      ? new Konva.Arrow({
          points: [-size * 0.45, 0, size * 0.25, 0],
          stroke: c.core,
          fill: c.core,
          strokeWidth: size * 0.05,
          pointerLength: size * 0.18,
          pointerWidth: size * 0.16,
          rotation: angle,
        })
      : effect === 'ice'
        ? new Konva.RegularPolygon({
            sides: 3,
            radius: size * 0.22,
            fill: c.core,
            stroke: c.glow,
            strokeWidth: 2,
            rotation: angle + 90,
            shadowColor: c.glow,
            shadowBlur: 18,
          })
        : new Konva.Circle({
            radius: size * (effect === 'shadow' ? 0.3 : 0.2),
            fill: c.core,
            shadowColor: c.glow,
            shadowBlur: 24,
            shadowOpacity: 1,
          });
  head.position(from);
  layer.add(head);
  const trail: Konva.Circle[] = [];
  animate(
    layer,
    ms,
    (t) => {
      const e = easeOut(t);
      // Poison lobs in an arc; the rest fly straight (arcane wobbles a little).
      const lift =
        effect === 'poison'
          ? Math.sin(t * Math.PI) * size * 1.2
          : effect === 'arcane'
            ? Math.sin(t * Math.PI * 4) * size * 0.15
            : 0;
      const x = from.x + (to.x - from.x) * e;
      const y = from.y + (to.y - from.y) * e - lift;
      head.position({ x, y });
      if (effect !== 'arrow' && trail.length < 40) {
        const p = new Konva.Circle({
          x,
          y,
          radius: size * 0.1 * (0.6 + Math.random() * 0.6),
          fill: Math.random() > 0.5 ? c.glow : c.spark,
          opacity: 0.8,
        });
        trail.push(p);
        layer.add(p);
      }
      trail.forEach((p) => {
        p.opacity(Math.max(0, p.opacity() - 0.05));
        p.radius(Math.max(0.1, p.radius() * 0.94));
      });
    },
    () => {
      head.destroy();
      trail.forEach((p) => p.destroy());
      explode(layer, effect, to, size);
    },
  );
}

/** Jagged bolt that flickers between the two points. */
function lightning(layer: Konva.Layer, from: Point, to: Point, size: number): void {
  const c = PALETTE['lightning'];
  const bolt = new Konva.Line({
    points: zigzag(from, to, size),
    stroke: c.core,
    strokeWidth: size * 0.06,
    shadowColor: c.glow,
    shadowBlur: 25,
    shadowOpacity: 1,
    lineJoin: 'round',
  });
  const glow = new Konva.Line({
    points: bolt.points(),
    stroke: c.glow,
    strokeWidth: size * 0.2,
    opacity: 0.4,
    lineJoin: 'round',
  });
  layer.add(glow, bolt);
  animate(
    layer,
    520,
    (t) => {
      if (Math.floor(t * 8) !== Math.floor((t - 0.02) * 8)) {
        const pts = zigzag(from, to, size);
        bolt.points(pts);
        glow.points(pts);
      }
      const visible = t < 0.85 && Math.floor(t * 10) % 3 !== 2;
      bolt.opacity(visible ? 1 : 0.15);
      glow.opacity(visible ? 0.4 : 0.05);
    },
    () => {
      bolt.destroy();
      glow.destroy();
      explode(layer, 'lightning', to, size);
    },
  );
}

/** Warm beam of light (or healing) that fades with sparkles at the target. */
function beam(layer: Konva.Layer, from: Point, to: Point, size: number): void {
  const c = PALETTE['light'];
  const outer = new Konva.Line({
    points: [from.x, from.y, from.x, from.y],
    stroke: c.glow,
    strokeWidth: size * 0.35,
    opacity: 0.35,
    lineCap: 'round',
  });
  const inner = new Konva.Line({
    points: [from.x, from.y, from.x, from.y],
    stroke: c.core,
    strokeWidth: size * 0.1,
    lineCap: 'round',
    shadowColor: c.glow,
    shadowBlur: 25,
  });
  layer.add(outer, inner);
  animate(
    layer,
    700,
    (t) => {
      const grow = easeOut(Math.min(1, t * 2.5));
      const pts = [
        from.x,
        from.y,
        from.x + (to.x - from.x) * grow,
        from.y + (to.y - from.y) * grow,
      ];
      outer.points(pts);
      inner.points(pts);
      const fade = t > 0.6 ? 1 - (t - 0.6) / 0.4 : 1;
      outer.opacity(0.35 * fade);
      inner.opacity(fade);
    },
    () => {
      outer.destroy();
      inner.destroy();
    },
  );
  setTimeout(() => sparks(layer, to, size, c.spark, 14, 1.1), 250);
}

// ---------- Shared bits ----------

function explode(layer: Konva.Layer, effect: string, at: Point, size: number): void {
  const c = PALETTE[effect] ?? PALETTE['arcane'];
  flash(layer, at, size, c.glow);
  sparks(layer, at, size, c.spark, effect === 'fire' ? 18 : 12, effect === 'shadow' ? 0.8 : 1);
  if (effect === 'ice' || effect === 'arcane') {
    const ring = new Konva.Circle({
      x: at.x,
      y: at.y,
      radius: size * 0.3,
      stroke: c.core,
      strokeWidth: 3,
      dash: effect === 'arcane' ? [6, 6] : undefined,
      opacity: 1,
    });
    layer.add(ring);
    animate(
      layer,
      600,
      (t) => {
        ring.radius(size * (0.3 + t * 0.6));
        ring.rotation(t * 120);
        ring.opacity(1 - t);
      },
      () => ring.destroy(),
    );
  }
}

function flash(layer: Konva.Layer, at: Point, size: number, color: string): void {
  const glow = new Konva.Circle({
    x: at.x,
    y: at.y,
    radius: size * 0.5,
    fill: color,
    opacity: 0.6,
    shadowColor: color,
    shadowBlur: 30,
  });
  layer.add(glow);
  animate(
    layer,
    380,
    (t) => {
      glow.radius(size * (0.5 + t * 0.4));
      glow.opacity(0.6 * (1 - t));
    },
    () => glow.destroy(),
  );
}

function sparks(
  layer: Konva.Layer,
  at: Point,
  size: number,
  color: string,
  count: number,
  reach: number,
): void {
  const parts = Array.from({ length: count }, (_, i) => {
    const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    return {
      a,
      speed: (0.6 + Math.random() * 0.6) * size * reach,
      node: new Konva.Circle({ x: at.x, y: at.y, radius: size * 0.06, fill: color }),
    };
  });
  parts.forEach((p) => layer.add(p.node));
  animate(
    layer,
    600,
    (t) => {
      const e = easeOut(t);
      parts.forEach((p) => {
        p.node.position({
          x: at.x + Math.cos(p.a) * p.speed * e,
          y: at.y + Math.sin(p.a) * p.speed * e,
        });
        p.node.opacity(1 - t);
      });
    },
    () => parts.forEach((p) => p.node.destroy()),
  );
}

function zigzag(from: Point, to: Point, size: number): number[] {
  const steps = 7;
  const nx = -(to.y - from.y);
  const ny = to.x - from.x;
  const len = Math.hypot(nx, ny) || 1;
  const pts = [from.x, from.y];
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const off = (Math.random() - 0.5) * size * 0.8;
    pts.push(
      from.x + (to.x - from.x) * t + (nx / len) * off,
      from.y + (to.y - from.y) * t + (ny / len) * off,
    );
  }
  pts.push(to.x, to.y);
  return pts;
}
