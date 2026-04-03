'use client';

import { useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Table, Member } from '@/types';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import PrintLayout from '../PrintLayout/PrintLayout';
import { useReactToPrint } from 'react-to-print';

export default function SeatingChart() {
  const {
    tables,
    generate,
    confirmSession,
    tableCount,
    setTableCount,
    columnsCount,
    setColumnsCount,
    isGenerated,
    history,
  } = useAppStore();

  const [activeMember, setActiveMember] = useState<Member | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `座席表_${new Date().toLocaleDateString('ja-JP')}`,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const findTableAndMember = (memberId: string) => {
    for (const table of tables) {
      const member = table.members.find((m) => m.id === memberId);
      if (member) return { table, member };
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const found = findTableAndMember(event.active.id as string);
    if (found) setActiveMember(found.member);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveMember(null);
    if (!over) return;

    const memberId = active.id as string;
    const overId = over.id as string;

    let toTableId: string | null = null;
    const overTable = tables.find((t) => t.id === overId);
    if (overTable) {
      toTableId = overTable.id;
    } else {
      const found = findTableAndMember(overId);
      if (found) toTableId = found.table.id;
    }
    if (!toTableId) return;

    const fromFound = findTableAndMember(memberId);
    if (!fromFound || fromFound.table.id === toTableId) return;

    useAppStore.getState().moveMember(memberId, fromFound.table.id, toTableId);
  };

  const sessionCount = history.sessions.length;

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600 whitespace-nowrap">テーブル数</label>
            <Stepper value={tableCount} min={1} onChange={setTableCount} />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600 whitespace-nowrap">列数</label>
            <Stepper value={columnsCount} min={1} max={8} onChange={setColumnsCount} />
          </div>

          <button
            onClick={generate}
            className="bg-indigo-500 text-white px-5 py-2 rounded-xl font-medium hover:bg-indigo-600 transition-colors shadow-sm"
          >
            座席を生成
          </button>

          {isGenerated && (
            <>
              <button
                onClick={generate}
                className="border border-indigo-300 text-indigo-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-50 transition-colors"
              >
                再生成
              </button>
              <button
                onClick={confirmSession}
                className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm"
              >
                確定・保存
              </button>
              <button
                onClick={() => handlePrint()}
                className="border border-gray-300 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5"
              >
                🖨 印刷 / PDF
              </button>
            </>
          )}

          {sessionCount > 0 && (
            <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">
              過去 {sessionCount} 回の履歴を考慮中
            </span>
          )}
        </div>
      </div>

      {/* Seating Chart — flat grid, no zone sections */}
      {isGenerated && tables.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${columnsCount}, minmax(0, 1fr))` }}
          >
            {tables.map((table) => (
              <TableCard key={table.id} table={table} />
            ))}
          </div>

          <DragOverlay>
            {activeMember && (
              <div className="bg-white border-2 border-indigo-400 rounded-lg px-3 py-1.5 text-sm font-medium shadow-xl text-gray-700">
                {activeMember.name}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      ) : !isGenerated ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center text-gray-400">
          <div className="text-4xl mb-3">🪑</div>
          <div className="text-sm">テーブル数と列数を設定して「座席を生成」をクリックしてください</div>
        </div>
      ) : null}

      {/* Hidden print layout */}
      <div className="hidden">
        <PrintLayout ref={printRef} tables={tables} columnsCount={columnsCount} />
      </div>
    </div>
  );
}

// ---- Helpers ----

function splitAround<T>(items: T[]): { top: T[]; bottom: T[] } {
  const half = Math.ceil(items.length / 2);
  return { top: items.slice(0, half), bottom: items.slice(half) };
}

// ---- Sub-components ----

function Stepper({
  value,
  min = 1,
  max = 99,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-7 h-7 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center text-sm"
      >
        −
      </button>
      <span className="w-8 text-center font-bold text-gray-800">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-7 h-7 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center text-sm"
      >
        ＋
      </button>
    </div>
  );
}

function TableCard({ table }: { table: Table }) {
  const maleCount = table.members.filter((m) => m.gender === 'male').length;
  const femaleCount = table.members.filter((m) => m.gender === 'female').length;
  const { top, bottom } = splitAround(table.members);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      <SortableContext
        id={table.id}
        items={table.members.map((m) => m.id)}
        strategy={rectSortingStrategy}
      >
        <div className="p-3 flex flex-col gap-2 flex-1">
          {/* Top seats */}
          <div className="flex flex-wrap justify-center gap-1.5 min-h-[28px]">
            {top.map((member) => (
              <SortableMemberChip key={member.id} member={member} />
            ))}
          </div>

          {/* Table surface */}
          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-center flex-shrink-0">
            <span className="font-bold text-gray-600 text-sm">テーブル {table.tableNumber}</span>
            <div className="flex justify-center gap-2 text-xs mt-0.5">
              <span className="text-blue-400">♂{maleCount}</span>
              <span className="text-pink-400">♀{femaleCount}</span>
              <span className="text-gray-400">{table.members.length}名</span>
            </div>
          </div>

          {/* Bottom seats */}
          <div className="flex flex-wrap justify-center gap-1.5 min-h-[28px]">
            {bottom.map((member) => (
              <SortableMemberChip key={member.id} member={member} />
            ))}
          </div>

          {table.members.length === 0 && (
            <div className="text-xs text-gray-300 text-center py-2">ここにドロップ</div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableMemberChip({ member }: { member: Member }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: member.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      title={
        [member.department, member.joinYear ? `${member.joinYear}年入社` : '']
          .filter(Boolean)
          .join(' / ') || undefined
      }
      className={`flex items-center gap-1 px-2 py-1 rounded-lg cursor-grab active:cursor-grabbing select-none text-xs font-medium border transition-shadow hover:shadow-sm ${
        member.gender === 'male'
          ? 'bg-blue-50 border-blue-100 text-blue-800 hover:bg-blue-100'
          : 'bg-pink-50 border-pink-100 text-pink-800 hover:bg-pink-100'
      }`}
    >
      <span className={`${member.gender === 'male' ? 'text-blue-400' : 'text-pink-400'}`}>
        {member.gender === 'male' ? '♂' : '♀'}
      </span>
      <span>{member.name}</span>
    </div>
  );
}
