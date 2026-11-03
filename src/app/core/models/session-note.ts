/** One notebook page per game session: `campaigns/nix/characters/{id}/sessionNotes/{pageId}`. Private to the player. */
export interface SessionNote {
  id: string;
  number: number;
  /** ISO date (yyyy-mm-dd) of the session. */
  date: string;
  title: string;
  text: string;
  /** Handwriting, encoded with `encodeStrokes` (compact string keeps the doc small). */
  strokes: string;
  /** Page height in page units (width is always PAGE_WIDTH); grows with "mais papel". */
  height: number;
  updatedAt: number;
}

export interface Stroke {
  /** Index into INK_COLORS. */
  color: number;
  /** Base width in page units. */
  width: number;
  /** Flat [x, y, pressure(0–100), x, y, pressure, …] in page units. */
  points: number[];
}

export const PAGE_WIDTH = 1000;
export const PAGE_HEIGHT = 1400;
export const INK_COLORS = ['#3b2a1a', '#a3261b', '#1f4e8c', '#2f6b35'] as const;
