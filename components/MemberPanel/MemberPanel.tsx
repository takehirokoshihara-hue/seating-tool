'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Member } from '@/types';
import AddMemberModal from './AddMemberModal';

export default function MemberPanel() {
  const { members, removeMember, updateMember, toggleAbsent } = useAppStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const activeCount = members.filter((m) => !m.isAbsent).length;
  const maleCount = members.filter((m) => m.gender === 'male' && !m.isAbsent).length;
  const femaleCount = members.filter((m) => m.gender === 'female' && !m.isAbsent).length;

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">メンバー管理</h2>
            <div className="flex gap-2 text-xs">
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                出席 {activeCount}名
              </span>
              <span className="bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full">
                男 {maleCount}
              </span>
              <span className="bg-pink-50 text-pink-500 px-2 py-0.5 rounded-full">
                女 {femaleCount}
              </span>
            </div>
          </div>
        </div>

        {/* Member List */}
        <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
          {members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              isEditing={editingId === member.id}
              onEdit={() => setEditingId(member.id)}
              onCancelEdit={() => setEditingId(null)}
              onSaveEdit={(updates) => {
                updateMember(member.id, updates);
                setEditingId(null);
              }}
              onToggleAbsent={() => toggleAbsent(member.id)}
              onRemove={() => removeMember(member.id)}
            />
          ))}
        </div>

        {/* Add Member Button */}
        <div className="border-t border-gray-100 p-3">
          <button
            onClick={() => setShowModal(true)}
            className="w-full text-sm text-indigo-500 hover:text-indigo-700 py-1.5 flex items-center justify-center gap-1 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
          >
            <span className="text-lg leading-none">+</span> メンバーを追加
          </button>
        </div>
      </div>

      {showModal && <AddMemberModal onClose={() => setShowModal(false)} />}
    </>
  );
}

interface MemberRowProps {
  member: Member;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (updates: Partial<Member>) => void;
  onToggleAbsent: () => void;
  onRemove: () => void;
}

function MemberRow({
  member,
  isEditing,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onToggleAbsent,
  onRemove,
}: MemberRowProps) {
  const [editName, setEditName] = useState(member.name);
  const [editGender, setEditGender] = useState(member.gender);
  const [editDept, setEditDept] = useState(member.department ?? '');
  const [editYear, setEditYear] = useState(member.joinYear?.toString() ?? '');

  if (isEditing) {
    return (
      <div className="px-3 py-2 border-b border-gray-50 bg-indigo-50 space-y-1.5">
        <div className="flex gap-2">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && onCancelEdit()}
            className="flex-1 text-sm border border-indigo-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            autoFocus
          />
          <select
            value={editGender}
            onChange={(e) => setEditGender(e.target.value as 'male' | 'female')}
            className="text-sm border border-indigo-200 rounded px-1 py-1 focus:outline-none"
          >
            <option value="male">男</option>
            <option value="female">女</option>
          </select>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={editDept}
            onChange={(e) => setEditDept(e.target.value)}
            placeholder="所属部署"
            className="flex-1 text-sm border border-indigo-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
          <input
            type="number"
            value={editYear}
            onChange={(e) => setEditYear(e.target.value)}
            placeholder="入社年"
            className="w-20 text-sm border border-indigo-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() =>
              onSaveEdit({
                name: editName,
                gender: editGender,
                department: editDept || undefined,
                joinYear: editYear ? parseInt(editYear) : undefined,
              })
            }
            className="text-xs bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600"
          >
            保存
          </button>
          <button onClick={onCancelEdit} className="text-xs text-gray-400 hover:text-gray-600">
            キャンセル
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 border-b border-gray-50 group hover:bg-gray-50 transition-colors ${
        member.isAbsent ? 'opacity-40' : ''
      }`}
    >
      {/* Gender badge */}
      <span
        className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
          member.gender === 'male'
            ? 'bg-blue-100 text-blue-600'
            : 'bg-pink-100 text-pink-600'
        }`}
      >
        {member.gender === 'male' ? '男' : '女'}
      </span>

      {/* Name + attributes */}
      <div className="flex-1 min-w-0">
        <span
          className={`text-sm block truncate ${
            member.isAbsent ? 'line-through text-gray-400' : 'text-gray-700'
          }`}
        >
          {member.name}
        </span>
        {(member.department || member.joinYear) && (
          <span className="text-xs text-gray-400 truncate block">
            {[member.department, member.joinYear ? `${member.joinYear}年入社` : ''].filter(Boolean).join(' · ')}
          </span>
        )}
      </div>

      {/* Actions (visible on hover) */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="text-xs text-gray-400 hover:text-indigo-500 px-1"
          title="編集"
        >
          ✎
        </button>
        <button
          onClick={onRemove}
          className="text-xs text-gray-400 hover:text-red-500 px-1"
          title="削除"
        >
          🗑
        </button>
      </div>

      {/* Absent toggle */}
      <button
        onClick={onToggleAbsent}
        title={member.isAbsent ? '出席に戻す' : '欠席にする'}
        className={`text-xs px-2 py-0.5 rounded-full border transition-colors flex-shrink-0 ${
          member.isAbsent
            ? 'border-red-300 text-red-500 bg-red-50 hover:bg-red-100'
            : 'border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-400'
        }`}
      >
        {member.isAbsent ? '欠席' : '出席'}
      </button>
    </div>
  );
}
