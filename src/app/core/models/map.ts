import { ConditionTag } from './character';
export interface MapGrid {
  /** Cell size in image pixels. */
  size: number;
  offsetX: number;
  offsetY: number;
  show: boolean;
  /** Draw the grid on the TV too (default true). The GM always sees it while `show` is on. */
  showOnTv?: boolean;
  /** Line opacity 0–1 (default 0.22). */
  opacity?: number;
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
  /** TOKEN_ICONS id drawn instead of the initial (portraits still win). */
  icon?: string;
  /** Conditions of tokens without a sheet (quick monsters). */
  conditions?: ConditionTag[];
}

/** Effects the GM broadcasts to the TV (ruler line, attack animations). */
export interface MapEvent {
  id: string;
  type: 'ruler' | 'attack';
  from: { x: number; y: number };
  to: { x: number; y: number };
  /** Attack effect id (see ATTACK_EFFECTS) — empty for the ruler. */
  effect: string;
  at: number;
}

/** `campaigns/nix/maps/{id}` — one saved battle map / scene (spec 4.7). */
export interface MapState {
  name: string;
  imageId: string;
  width: number;
  height: number;
  grid: MapGrid;
  /** When enabled, everything is fogged on the TV except `revealed` cells ("col,row"). */
  fog: { enabled: boolean; revealed: string[] };
  tokens: Record<string, MapToken>;
  lastEvent?: MapEvent;
  updatedAt: number;
}

export interface MapInfo {
  id: string;
  name: string;
  imageId: string;
  tokenCount: number;
  updatedAt: number;
}

export function emptyMapState(): MapState {
  return {
    name: 'Mapa',
    imageId: '',
    width: 1600,
    height: 1000,
    grid: { size: 70, offsetX: 0, offsetY: 0, show: true },
    fog: { enabled: false, revealed: [] },
    tokens: {},
    updatedAt: 0,
  };
}
