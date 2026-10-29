import { MapGrid, MapState, MapToken } from '../models/map';

export type Viewer = 'gm' | 'tv';

export function cellKey(col: number, row: number): string {
  return `${col},${row}`;
}

/** Grid cell containing an image-space point. */
export function cellAt(grid: MapGrid, x: number, y: number): { col: number; row: number } {
  return {
    col: Math.floor((x - grid.offsetX) / grid.size),
    row: Math.floor((y - grid.offsetY) / grid.size),
  };
}

/** Number of columns/rows needed to cover the image (including the partial cells at the edges). */
export function gridDimensions(state: Pick<MapState, 'grid' | 'width' | 'height'>): {
  cols: number;
  rows: number;
  startCol: number;
  startRow: number;
} {
  const g = state.grid;
  // `+ 0` turns -0 into 0.
  const startCol = Math.floor(-g.offsetX / g.size) + 0;
  const startRow = Math.floor(-g.offsetY / g.size) + 0;
  const cols = Math.ceil((state.width - g.offsetX) / g.size) - startCol;
  const rows = Math.ceil((state.height - g.offsetY) / g.size) - startRow;
  return { cols, rows, startCol, startRow };
}

export function isRevealed(state: Pick<MapState, 'fog'>, col: number, row: number): boolean {
  return !state.fog.enabled || state.fog.revealed.includes(cellKey(col, row));
}

/** Applies a reveal/hide brush stroke to the revealed list (deduplicated, stable order). */
export function paintFog(revealed: string[], cells: string[], reveal: boolean): string[] {
  const set = new Set(revealed);
  for (const c of cells) {
    if (reveal) set.add(c);
    else set.delete(c);
  }
  return [...set];
}

/** Cells covered by a token, so a token is only shown on the TV when its cell is revealed. */
export function tokenCell(grid: MapGrid, t: Pick<MapToken, 'x' | 'y'>): string {
  const { col, row } = cellAt(grid, t.x, t.y);
  return cellKey(col, row);
}

/**
 * Tokens a viewer may see: the GM sees everything; the TV never sees hidden tokens nor tokens
 * standing in fogged cells.
 */
export function visibleTokens(state: MapState, viewer: Viewer): MapToken[] {
  const all = Object.values(state.tokens);
  if (viewer === 'gm') return all;
  return all.filter(
    (t) =>
      !t.hidden && (!state.fog.enabled || state.fog.revealed.includes(tokenCell(state.grid, t))),
  );
}

/** Snaps a point to the center of its grid cell. */
export function snapToGrid(grid: MapGrid, x: number, y: number): { x: number; y: number } {
  const { col, row } = cellAt(grid, x, y);
  return { x: grid.offsetX + (col + 0.5) * grid.size, y: grid.offsetY + (row + 0.5) * grid.size };
}

/**
 * Center of the free cell closest to the map center (spiral search), so new tokens don't land
 * on top of each other.
 */
export function freeSpawnPoint(state: MapState): { x: number; y: number } {
  const g = state.grid;
  const center = cellAt(g, state.width / 2, state.height / 2);
  const taken = new Set(Object.values(state.tokens).map((t) => tokenCell(g, t)));
  const { cols, rows } = gridDimensions(state);
  const maxRing = Math.max(cols, rows);
  for (let ring = 0; ring <= maxRing; ring++) {
    for (let dc = -ring; dc <= ring; dc++) {
      for (let dr = -ring; dr <= ring; dr++) {
        if (Math.max(Math.abs(dc), Math.abs(dr)) !== ring) continue;
        const col = center.col + dc;
        const row = center.row + dr;
        if (!taken.has(cellKey(col, row))) {
          return { x: g.offsetX + (col + 0.5) * g.size, y: g.offsetY + (row + 0.5) * g.size };
        }
      }
    }
  }
  return snapToGrid(g, state.width / 2, state.height / 2);
}
