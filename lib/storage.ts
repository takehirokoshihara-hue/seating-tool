import { History, Session, Table } from '@/types';

const HISTORY_KEY = 'seating-tool-history';

export function loadHistory(): History {
  if (typeof window === 'undefined') {
    return { sessions: [], pairCounts: {}, lastZone: {} };
  }
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return { sessions: [], pairCounts: {}, lastZone: {} };
    return JSON.parse(raw) as History;
  } catch {
    return { sessions: [], pairCounts: {}, lastZone: {} };
  }
}

export function saveSession(tables: Table[], tableCount: number): History {
  const history = loadHistory();

  const session: Session = {
    id: `s-${Date.now()}`,
    date: new Date().toISOString(),
    tables,
    tableCount,
  };

  // Update pair counts
  for (const table of tables) {
    const ids = table.members.map((m) => m.id);
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const key = [ids[i], ids[j]].sort().join('-');
        history.pairCounts[key] = (history.pairCounts[key] ?? 0) + 1;
      }
    }
    // Update last zone
    for (const m of table.members) {
      history.lastZone[m.id] = table.zone;
    }
  }

  history.sessions = [session, ...history.sessions].slice(0, 20); // keep 20 sessions

  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  return history;
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}
