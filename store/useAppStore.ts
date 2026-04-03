import { create } from 'zustand';
import { Member, Table, History } from '@/types';
import { DEFAULT_MEMBERS } from '@/lib/defaultMembers';
import { generateTables } from '@/lib/algorithm';
import { loadHistory, saveSession, clearHistory } from '@/lib/storage';

interface AppState {
  members: Member[];
  tables: Table[];
  tableCount: number;
  columnsCount: number;
  history: History;
  isGenerated: boolean;

  // Member actions
  setMembers: (members: Member[]) => void;
  addMember: (member: Omit<Member, 'id' | 'isAbsent'>) => void;
  addMembers: (members: Omit<Member, 'id' | 'isAbsent'>[]) => void;
  removeMember: (id: string) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  toggleAbsent: (id: string) => void;

  // Table config
  setTableCount: (count: number) => void;
  setColumnsCount: (count: number) => void;

  // Generation
  generate: () => void;
  confirmSession: () => void;

  // Manual adjustment
  moveMember: (memberId: string, fromTableId: string, toTableId: string) => void;
  setTables: (tables: Table[]) => void;

  // History
  loadHistoryFromStorage: () => void;
  resetHistory: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  members: DEFAULT_MEMBERS,
  tables: [],
  tableCount: 6,
  columnsCount: 3,
  history: { sessions: [], pairCounts: {}, lastZone: {} },
  isGenerated: false,

  setMembers: (members) => set({ members }),

  addMember: (member) => {
    const id = `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((s) => ({
      members: [...s.members, { id, isAbsent: false, ...member }],
    }));
  },

  addMembers: (newMembers) => {
    const withIds: Member[] = newMembers.map((m, i) => ({
      id: `m-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      isAbsent: false,
      ...m,
    }));
    set((s) => ({ members: [...s.members, ...withIds] }));
  },

  removeMember: (id) => {
    set((s) => ({ members: s.members.filter((m) => m.id !== id) }));
  },

  updateMember: (id, updates) => {
    set((s) => ({
      members: s.members.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }));
  },

  toggleAbsent: (id) => {
    set((s) => ({
      members: s.members.map((m) =>
        m.id === id ? { ...m, isAbsent: !m.isAbsent } : m
      ),
    }));
  },

  setTableCount: (count) => set({ tableCount: count }),
  setColumnsCount: (count) => set({ columnsCount: count }),

  generate: () => {
    const { members, tableCount, history } = get();
    const tables = generateTables(members, tableCount, history);
    set({ tables, isGenerated: true });
  },

  confirmSession: () => {
    const { tables, tableCount } = get();
    const newHistory = saveSession(tables, tableCount);
    set({ history: newHistory });
  },

  moveMember: (memberId, fromTableId, toTableId) => {
    set((s) => {
      const tables = s.tables.map((t) => ({ ...t, members: [...t.members] }));
      const fromTable = tables.find((t) => t.id === fromTableId);
      const toTable = tables.find((t) => t.id === toTableId);
      if (!fromTable || !toTable) return s;

      const memberIdx = fromTable.members.findIndex((m) => m.id === memberId);
      if (memberIdx === -1) return s;

      const [member] = fromTable.members.splice(memberIdx, 1);
      toTable.members.push(member);
      return { tables };
    });
  },

  setTables: (tables) => set({ tables }),

  loadHistoryFromStorage: () => {
    const history = loadHistory();
    set({ history });
  },

  resetHistory: () => {
    clearHistory();
    set({ history: { sessions: [], pairCounts: {}, lastZone: {} } });
  },
}));
