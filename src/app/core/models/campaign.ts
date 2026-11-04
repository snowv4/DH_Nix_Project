export interface Campaign {
  name: string;
  fear: number;
  /** Highest level the GM has released for the table (spec 4.4). */
  levelUnlocked?: number;
  /** GM PIN hash for tables created in the app (Mesa Nix uses the original PIN). */
  gmPinHash?: string;
  createdAt?: number;
}
