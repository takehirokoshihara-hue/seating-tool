import { Member, Table, History, PairKey } from '@/types';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getPairKey(a: string, b: string): PairKey {
  return [a, b].sort().join('-');
}

function groupScore(members: Member[], pairCounts: Record<PairKey, number>): number {
  let score = 0;
  const ids = members.map((m) => m.id);
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      score += pairCounts[getPairKey(ids[i], ids[j])] ?? 0;
    }
  }
  return score;
}

export function generateTables(
  allMembers: Member[],
  tableCount: number,
  history: History,
  attempts = 30
): Table[] {
  const activeMembers = allMembers.filter((m) => !m.isAbsent);
  if (activeMembers.length === 0 || tableCount === 0) return [];

  const males = activeMembers.filter((m) => m.gender === 'male');
  const females = activeMembers.filter((m) => m.gender === 'female');

  let bestTables: Table[] | null = null;
  let bestScore = Infinity;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const shuffledMales = shuffle(males);
    const shuffledFemales = shuffle(females);

    // Round-robin distribute males and females to tables for gender balance
    const tableSlots: Member[][] = Array.from({ length: tableCount }, () => []);

    shuffledMales.forEach((m, i) => tableSlots[i % tableCount].push(m));
    shuffledFemales.forEach((m, i) => tableSlots[i % tableCount].push(m));

    // Assign zone based on last zone rotation
    // Determine front/back split: first half = front, second half = back
    const halfCount = Math.ceil(tableCount / 2);

    // For each table slot, compute a zone-fitness score based on members' last zones
    // We want members who were in 'front' to go to 'back' and vice versa
    const tableZoneScores = tableSlots.map((members) => {
      // score = number of members who were previously in 'back' (they should go front now)
      return members.filter((m) => history.lastZone[m.id] === 'back').length;
    });

    // Sort table indices by zone score descending → high score (many back-last) → assign to front
    const tableOrder = tableZoneScores
      .map((score, idx) => ({ score, idx }))
      .sort((a, b) => b.score - a.score)
      .map((x) => x.idx);

    const tables: Table[] = tableOrder.map((slotIdx, rank) => ({
      id: `t-${attempt}-${rank}`,
      tableNumber: rank + 1,
      zone: rank < halfCount ? 'front' : 'back',
      members: tableSlots[slotIdx],
    }));

    // Compute total pair-overlap score
    const score = tables.reduce(
      (acc, t) => acc + groupScore(t.members, history.pairCounts),
      0
    );

    if (score < bestScore) {
      bestScore = score;
      bestTables = tables;
    }
  }

  // Assign stable IDs
  return (bestTables ?? []).map((t, i) => ({
    ...t,
    id: `table-${i + 1}`,
    members: t.members,
  }));
}
