'use client';

import { forwardRef } from 'react';
import { Table, Member } from '@/types';

interface Props {
  tables: Table[];
  columnsCount?: number;
}

const PrintLayout = forwardRef<HTMLDivElement, Props>(({ tables, columnsCount = 3 }, ref) => {
  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div ref={ref} className="p-8 bg-white font-sans">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 12mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        .print-wrap { font-family: 'Hiragino Sans', 'Meiryo', sans-serif; }
      `}</style>

      <div className="print-wrap">
        {/* Title */}
        <div className="text-center mb-5">
          <h1 className="text-xl font-bold text-gray-800">座席表</h1>
          <p className="text-xs text-gray-400 mt-1">{today}</p>
        </div>

        {/* Flat grid — respects columnsCount */}
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${columnsCount}, 1fr)` }}
        >
          {tables.map((table) => (
            <PrintTableCard key={table.id} table={table} />
          ))}
        </div>

        <div className="mt-6 pt-3 border-t border-gray-100 text-center text-xs text-gray-300">
          座席・グループ編成ツール
        </div>
      </div>
    </div>
  );
});

PrintLayout.displayName = 'PrintLayout';

function splitAround<T>(items: T[]): { top: T[]; bottom: T[] } {
  const half = Math.ceil(items.length / 2);
  return { top: items.slice(0, half), bottom: items.slice(half) };
}

function PrintTableCard({ table }: { table: Table }) {
  const { top, bottom } = splitAround(table.members);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="p-2 flex flex-col gap-1.5">
        {/* Top seats */}
        <div className="flex flex-wrap justify-center gap-1">
          {top.map((member) => (
            <PrintMemberChip key={member.id} member={member} />
          ))}
        </div>

        {/* Table surface */}
        <div
          className="rounded-lg border border-dashed px-2 py-1.5 text-center"
          style={{ borderColor: '#d1d5db', backgroundColor: '#f9fafb' }}
        >
          <span className="font-bold text-gray-600 text-xs">テーブル {table.tableNumber}</span>
          <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '2px' }}>{table.members.length}名</div>
        </div>

        {/* Bottom seats */}
        <div className="flex flex-wrap justify-center gap-1">
          {bottom.map((member) => (
            <PrintMemberChip key={member.id} member={member} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PrintMemberChip({ member }: { member: Member }) {
  return (
    <div
      className="flex items-center px-1.5 py-0.5 rounded text-xs border"
      style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb', color: '#374151', fontSize: '10px' }}
    >
      <span>{member.name}</span>
    </div>
  );
}

export default PrintLayout;
