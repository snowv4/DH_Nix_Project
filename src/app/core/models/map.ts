export interface MapGrid {
  /** Cell size in image pixels. */
  size: number;
  offsetX: number;
  offsetY: number;
  show: boolean;
}

export interface MapToken {
  id: string;
  kind: 'pc' | 'monster';
  /** Character id for PC tokens. */
  refId: string;
  label: string;
  color: string;
  /** Center position in image pixels. */
  x: number;
  y: number;
  /** Diameter in grid cells. */
  size: number;
  /** Hidden tokens are only drawn for the GM. */
  hidden: boolean;
}

/** `campaigns/nix/map/state` — the single live battle map (spec 4.7). */
export interface MapState {
  imageId: string;
  width: number;
  height: number;
  grid: MapGrid;
  /** When enabled, everything is fogged on the TV except `revealed` cells ("col,row"). */
  fog: { enabled: boolean; revealed: string[] };
  tokens: Record<string, MapToken>;
  updatedAt: number;
}

export function emptyMapState(): MapState {
  return {
    imageId: '',
    width: 1600,
    height: 1000,
    grid: { size: 70, offsetX: 0, offsetY: 0, show: true },
    fog: { enabled: false, revealed: [] },
    tokens: {},
    updatedAt: 0,
  };
}
