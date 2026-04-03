export type Gender = 'male' | 'female';

export interface Member {
  id: string;
  name: string;
  gender: Gender;
  isAbsent: boolean;
  department?: string;
  joinYear?: number;
}

export interface Table {
  id: string;
  tableNumber: number;
  zone: 'front' | 'back';
  members: Member[];
}

export interface Session {
  id: string;
  date: string;
  tables: Table[];
  tableCount: number;
}

// pair key: sorted memberIds joined by '-'
export type PairKey = string;

export interface History {
  sessions: Session[];
  // co-occurrence count for each pair
  pairCounts: Record<PairKey, number>;
  // last zone per member id
  lastZone: Record<string, 'front' | 'back'>;
}
