export interface Campaign {
  name: string;
  fear: number;
}

export interface RollLogEntry {
  id: string;
  characterId: string;
  characterName: string;
  label: string;
  hope: number;
  fear: number;
  total: number;
  outcome: 'hope' | 'fear' | 'critical';
  createdAt: number;
}
