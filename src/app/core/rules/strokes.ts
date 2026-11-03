import { Stroke } from '../models/session-note';

/**
 * Compact text encoding for handwriting: strokes separated by ";", each "color,width|x,y,p x,y,p …"
 * with integer coordinates. Much smaller than JSON, which matters for Firestore's 1 MB documents.
 */
export function encodeStrokes(strokes: Stroke[]): string {
  return strokes
    .map((s) => {
      const pts: string[] = [];
      for (let i = 0; i + 2 < s.points.length; i += 3) {
        pts.push(
          `${Math.round(s.points[i])},${Math.round(s.points[i + 1])},${Math.round(s.points[i + 2])}`,
        );
      }
      return `${s.color},${Math.round(s.width * 10) / 10}|${pts.join(' ')}`;
    })
    .join(';');
}

export function decodeStrokes(text: string): Stroke[] {
  if (!text) return [];
  return text.split(';').flatMap((chunk) => {
    const [head, body = ''] = chunk.split('|');
    const [color, width] = head.split(',').map(Number);
    const points = body
      .split(' ')
      .filter(Boolean)
      .flatMap((p) => p.split(',').map(Number));
    if (
      !Number.isFinite(color) ||
      !Number.isFinite(width) ||
      points.length < 3 ||
      points.some((n) => !Number.isFinite(n))
    ) {
      return [];
    }
    return [{ color, width, points }];
  });
}

/** Drops points closer than `minDist` to the previous kept one (keeps the doc small). */
export function simplify(points: number[], minDist = 1.5): number[] {
  if (points.length <= 6) return points;
  const out = points.slice(0, 3);
  for (let i = 3; i < points.length; i += 3) {
    const dx = points[i] - out[out.length - 3];
    const dy = points[i + 1] - out[out.length - 2];
    if (dx * dx + dy * dy >= minDist * minDist || i === points.length - 3)
      out.push(points[i], points[i + 1], points[i + 2]);
  }
  return out;
}

/** True when the eraser circle (x, y, r) touches any point of the stroke. */
export function strokeHit(s: Stroke, x: number, y: number, r: number): boolean {
  const rr = (r + s.width / 2) ** 2;
  for (let i = 0; i < s.points.length; i += 3) {
    const dx = s.points[i] - x;
    const dy = s.points[i + 1] - y;
    if (dx * dx + dy * dy <= rr) return true;
  }
  return false;
}
