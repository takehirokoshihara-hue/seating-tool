'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import MemberPanel from '@/components/MemberPanel/MemberPanel';
import SeatingChart from '@/components/SeatingChart/SeatingChart';
import HistoryPanel from '@/components/HistoryPanel/HistoryPanel';

export default function Home() {
  const { loadHistoryFromStorage } = useAppStore();

  useEffect(() => {
    loadHistoryFromStorage();
  }, [loadHistoryFromStorage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-sm">
            🪑
          </div>
          <div>
            <h1 className="font-bold text-gray-800 text-base leading-tight">座席・グループ編成ツール</h1>
            <p className="text-xs text-gray-400">人事イベント・新卒研修向け</p>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <main className="max-w-screen-xl mx-auto px-4 py-4">
        <div className="flex gap-4">
          {/* Left sidebar */}
          <div className="w-64 flex-shrink-0 space-y-4">
            <MemberPanel />
            <HistoryPanel />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <SeatingChart />
          </div>
        </div>
      </main>
    </div>
  );
}
