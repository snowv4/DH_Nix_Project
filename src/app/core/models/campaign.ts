export interface Campaign {
  name: string;
  fear: number;
  /** Highest level the GM has released for the table (spec 4.4). */
  levelUnlocked?: number;
}
