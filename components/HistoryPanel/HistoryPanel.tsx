'use client';

import { useAppStore } from '@/store/useAppStore';

export default function HistoryPanel() {
  const { history, resetHistory } = useAppStore();
  const { sessions } = history;

  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h2 className="font-semibold text-gray-800 mb-2">履歴</h2>
        <p className="text-xs text-gray-400">まだ履歴がありません。座席を確定すると記録されます。</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">履歴 ({sessions.length}回)</h2>
        <button
          onClick={() => {
            if (confirm('履歴をすべてリセットしますか？')) resetHistory();
          }}
          className="text-xs text-red-400 hover:text-red-600"
        >
          リセット
        </button>
      </div>
      <div className="max-h-48 overflow-y-auto">
        {sessions.map((session) => (
          <div key={session.id} className="px-4 py-2 border-b border-gray-50 last:border-0">
            <div className="text-xs text-gray-400">
              {new Date(session.date).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
            <div className="text-xs text-gray-600 mt-0.5">
              {session.tableCount}テーブル /{' '}
              {session.tables.reduce((sum, t) => sum + t.members.length, 0)}名
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
