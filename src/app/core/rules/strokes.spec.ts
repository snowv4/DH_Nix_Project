import { decodeStrokes, encodeStrokes, simplify, strokeHit } from './strokes';

describe('strokes', () => {
  it('round-trips through the compact encoding (rounded to integers)', () => {
    const strokes = [
      { color: 1, width: 3.25, points: [10.4, 20.6, 50, 11, 21, 60] },
      { color: 0, width: 2, points: [0, 0, 100] },
    ];
    expect(decodeStrokes(encodeStrokes(strokes))).toEqual([
      { color: 1, width: 3.3, points: [10, 21, 50, 11, 21, 60] },
      { color: 0, width: 2, points: [0, 0, 100] },
    ]);
  });

  it('ignores garbage', () => {
    expect(decodeStrokes('')).toEqual([]);
    expect(decodeStrokes('x|1,2')).toEqual([]);
  });

  it('drops points that are too close, keeping the ends', () => {
    const pts = [0, 0, 50, 0.5, 0, 50, 1, 0, 50, 5, 0, 50];
    expect(simplify(pts, 2)).toEqual([0, 0, 50, 5, 0, 50]);
  });

  it('detects the eraser touching a stroke', () => {
    const s = { color: 0, width: 4, points: [100, 100, 50] };
    expect(strokeHit(s, 108, 100, 6)).toBe(true);
    expect(strokeHit(s, 120, 100, 6)).toBe(false);
  });
});
