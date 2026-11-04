import { emptyMapState, MapState, MapToken } from '../models/map';
import {
  createWalk,
  walkFrame,
  cellAt,
  cellKey,
  freeSpawnPoint,
  gridDimensions,
  healthStatus,
  paintFog,
  rangeForSquares,
  snapToGrid,
  squaresBetween,
  visibleTokens,
} from './map';

function token(patch: Partial<MapToken>): MapToken {
  return {
    id: 't',
    kind: 'monster',
    refId: '',
    label: 'Goblin',
    color: '#f00',
    x: 35,
    y: 35,
    size: 1,
    hidden: false,
    ...patch,
  };
}

function state(patch: Partial<MapState> = {}): MapState {
  return { ...emptyMapState(), ...patch };
}

describe('grid', () => {
  it('finds the cell for a point, honoring the offset', () => {
    const grid = { size: 50, offsetX: 10, offsetY: 0, show: true };
    expect(cellAt(grid, 9, 0)).toEqual({ col: -1, row: 0 });
    expect(cellAt(grid, 60, 99)).toEqual({ col: 1, row: 1 });
  });

  it('snaps to the cell center', () => {
    expect(snapToGrid({ size: 50, offsetX: 0, offsetY: 0, show: true }, 70, 20)).toEqual({
      x: 75,
      y: 25,
    });
  });

  it('covers the whole image', () => {
    const d = gridDimensions({
      width: 100,
      height: 60,
      grid: { size: 50, offsetX: 20, offsetY: 0, show: true },
    });
    expect(d).toEqual({ cols: 3, rows: 2, startCol: -1, startRow: 0 });
  });
});

describe('fog', () => {
  it('reveals and hides cells without duplicates', () => {
    expect(paintFog(['0,0'], ['0,0', '1,0'], true)).toEqual(['0,0', '1,0']);
    expect(paintFog(['0,0', '1,0'], ['0,0'], false)).toEqual(['1,0']);
  });
});

describe('visibleTokens', () => {
  const tokens = {
    a: token({ id: 'a' }),
    b: token({ id: 'b', hidden: true }),
    c: token({ id: 'c', x: 105 }), // cell 1,0
  };

  it('shows everything to the GM', () => {
    expect(visibleTokens(state({ tokens }), 'gm').length).toBe(3);
  });

  it('hides hidden tokens from the TV', () => {
    expect(visibleTokens(state({ tokens }), 'tv').map((t) => t.id)).toEqual(['a', 'c']);
  });

  it('hides tokens standing in fog from the TV', () => {
    const s = state({ tokens, fog: { enabled: true, revealed: [cellKey(0, 0)] } });
    expect(visibleTokens(s, 'tv').map((t) => t.id)).toEqual(['a']);
  });
});

describe('freeSpawnPoint', () => {
  it('uses the center cell, then the next free one', () => {
    const base = state({
      width: 500,
      height: 500,
      grid: { size: 100, offsetX: 0, offsetY: 0, show: true },
    });
    const first = freeSpawnPoint(base);
    expect(first).toEqual({ x: 250, y: 250 });
    const second = freeSpawnPoint({ ...base, tokens: { a: token({ id: 'a', ...first }) } });
    expect(second).not.toEqual(first);
  });
});

describe('ranges', () => {
  const grid = { size: 10, offsetX: 0, offsetY: 0, show: true };

  it('counts squares with diagonals as one', () => {
    expect(squaresBetween(grid, { x: 5, y: 5 }, { x: 35, y: 25 })).toBe(3);
  });

  it('maps squares to the SRD defined ranges', () => {
    expect([1, 2, 3, 6, 7, 12, 13].map((n) => rangeForSquares(n).label)).toEqual([
      'Corpo a corpo',
      'Muito Perto',
      'Muito Perto',
      'Perto',
      'Longe',
      'Longe',
      'Muito Longe',
    ]);
  });
});

describe('healthStatus', () => {
  it('turns HP into coarse markers', () => {
    expect(healthStatus({ marked: 0, max: 6 })).toBe('ok');
    expect(healthStatus({ marked: 3, max: 6 })).toBe('wounded');
    expect(healthStatus({ marked: 5, max: 6 })).toBe('critical');
    expect(healthStatus({ marked: 6, max: 6 })).toBe('down');
    expect(healthStatus({ marked: 0, max: 0 })).toBe('ok');
  });
});

describe('walking tokens', () => {
  const w = createWalk({ x: 0, y: 0 }, { x: 300, y: 0 }, 100, 1000);

  it('scales duration and steps with the distance', () => {
    expect(w.duration).toBeCloseTo(660);
    expect(w.steps).toBe(6);
    expect(createWalk({ x: 0, y: 0 }, { x: 10, y: 0 }, 100, 0)).toMatchObject({
      duration: 300,
      steps: 2,
    });
  });

  it('starts at the origin and ends exactly on the target, flat', () => {
    expect(walkFrame(w, 1000, 100)).toMatchObject({ x: 0, y: 0, done: false });
    expect(walkFrame(w, 5000, 100)).toEqual({ x: 300, y: 0, lift: 0, tilt: 0, done: true });
  });

  it('hops mid-step and only slides with reduced motion', () => {
    const mid = walkFrame(w, 1000 + w.duration / 12, 100);
    expect(mid.lift).toBeGreaterThan(5);
    expect(Math.abs(mid.tilt)).toBeGreaterThan(1);
    expect(walkFrame(w, 1000 + w.duration / 12, 100, true)).toMatchObject({ lift: 0, tilt: 0 });
  });
});
