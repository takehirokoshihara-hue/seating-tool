'use client';

import { useRef, useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Gender, Member } from '@/types';

interface MemberRow {
  name: string;
  gender: Gender;
  department: string;
  joinYear: string;
}

const emptyRow = (): MemberRow => ({
  name: '',
  gender: 'male',
  department: '',
  joinYear: '',
});

interface Props {
  onClose: () => void;
}

export default function AddMemberModal({ onClose }: Props) {
  const { addMembers } = useAppStore();
  const [tab, setTab] = useState<'form' | 'csv'>('form');
  const [rows, setRows] = useState<MemberRow[]>([emptyRow()]);
  const [csvText, setCsvText] = useState('');
  const [csvError, setCsvError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- Form tab ----
  const updateRow = (idx: number, field: keyof MemberRow, value: string) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const removeRow = (idx: number) =>
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));

  const handleFormSubmit = () => {
    const valid = rows.filter((r) => r.name.trim());
    if (valid.length === 0) return;
    addMembers(
      valid.map((r) => ({
        name: r.name.trim(),
        gender: r.gender,
        department: r.department.trim() || undefined,
        joinYear: r.joinYear ? parseInt(r.joinYear) : undefined,
      }))
    );
    onClose();
  };

  // ---- CSV tab ----
  const parseCSV = useCallback((text: string): Omit<Member, 'id' | 'isAbsent'>[] => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    // Detect header row: if first line contains "name" or "名前" skip it
    const firstLine = lines[0]?.toLowerCase() ?? '';
    const hasHeader = firstLine.includes('name') || firstLine.includes('名前') || firstLine.includes('氏名');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    return dataLines.map((line) => {
      // Support comma and tab separators
      const cols = line.includes('\t') ? line.split('\t') : line.split(',');
      const name = cols[0]?.trim() ?? '';
      const genderRaw = cols[1]?.trim().toLowerCase() ?? '';
      const gender: Gender =
        genderRaw === 'female' || genderRaw === '女' || genderRaw === '女性' ? 'female' : 'male';
      const department = cols[2]?.trim() || undefined;
      const joinYearRaw = cols[3]?.trim();
      const joinYear = joinYearRaw ? parseInt(joinYearRaw) : undefined;
      return { name, gender, department, joinYear };
    }).filter((m) => m.name);
  }, []);

  const handleCSVImport = () => {
    setCsvError('');
    try {
      const members = parseCSV(csvText);
      if (members.length === 0) {
        setCsvError('インポートできるメンバーが見つかりませんでした。');
        return;
      }
      addMembers(members);
      onClose();
    } catch {
      setCsvError('CSVの解析に失敗しました。フォーマットを確認してください。');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCsvText((ev.target?.result as string) ?? '');
      setCsvError('');
    };
    reader.readAsText(file, 'UTF-8');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h2 className="font-bold text-gray-800 text-lg">メンバーを追加</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 flex-shrink-0">
          {(['form', 'csv'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                tab === t
                  ? 'text-indigo-600 border-b-2 border-indigo-500'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t === 'form' ? '✏️ 手動入力' : '📄 CSVインポート'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {tab === 'form' && (
            <div className="p-4">
              {/* Column headers */}
              <div className="grid grid-cols-[1fr_80px_120px_90px_32px] gap-2 mb-1 px-1">
                <span className="text-xs text-gray-400 font-medium">名前 *</span>
                <span className="text-xs text-gray-400 font-medium">性別 *</span>
                <span className="text-xs text-gray-400 font-medium">所属部署</span>
                <span className="text-xs text-gray-400 font-medium">入社年度</span>
                <span />
              </div>

              <div className="space-y-1.5">
                {rows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_80px_120px_90px_32px] gap-2 items-center">
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => updateRow(idx, 'name', e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addRow()}
                      placeholder="例: 山田 太郎"
                      className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 w-full"
                    />
                    <select
                      value={row.gender}
                      onChange={(e) => updateRow(idx, 'gender', e.target.value)}
                      className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    >
                      <option value="male">男性</option>
                      <option value="female">女性</option>
                    </select>
                    <input
                      type="text"
                      value={row.department}
                      onChange={(e) => updateRow(idx, 'department', e.target.value)}
                      placeholder="例: 営業部"
                      className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 w-full"
                    />
                    <input
                      type="number"
                      value={row.joinYear}
                      onChange={(e) => updateRow(idx, 'joinYear', e.target.value)}
                      placeholder="2024"
                      min={2000}
                      max={2099}
                      className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 w-full"
                    />
                    <button
                      onClick={() => removeRow(idx)}
                      disabled={rows.length === 1}
                      className="text-gray-300 hover:text-red-400 disabled:opacity-0 text-lg leading-none"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={addRow}
                className="mt-3 w-full text-sm text-indigo-400 hover:text-indigo-600 py-2 border border-dashed border-indigo-200 rounded-xl hover:border-indigo-400 transition-colors"
              >
                + 行を追加（Enter でも追加）
              </button>
            </div>
          )}

          {tab === 'csv' && (
            <div className="p-4 space-y-3">
              {/* Format hint */}
              <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 space-y-1">
                <p className="font-medium text-gray-600">CSVフォーマット（ヘッダー行は自動検出）</p>
                <p>A列: 名前　B列: 性別（male/female/男/女）　C列: 所属部署　D列: 入社年度</p>
                <p className="font-mono bg-white rounded p-1.5 border border-gray-200 mt-1">
                  山田太郎,male,営業部,2024<br/>
                  鈴木花子,female,開発部,2023
                </p>
              </div>

              {/* File upload */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
                >
                  📂 CSVファイルを選択
                </button>
              </div>

              {/* Text area */}
              <textarea
                value={csvText}
                onChange={(e) => { setCsvText(e.target.value); setCsvError(''); }}
                placeholder="またはここに直接CSVテキストを貼り付け..."
                rows={8}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 font-mono resize-none"
              />

              {csvError && (
                <p className="text-xs text-red-500">{csvError}</p>
              )}

              {csvText && (
                <p className="text-xs text-gray-400">
                  プレビュー: {parseCSV(csvText).length} 名を検出
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
          <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600">
            キャンセル
          </button>
          <button
            onClick={tab === 'form' ? handleFormSubmit : handleCSVImport}
            className="bg-indigo-500 text-white px-6 py-2 rounded-xl font-medium text-sm hover:bg-indigo-600 transition-colors"
          >
            {tab === 'form'
              ? `${rows.filter((r) => r.name.trim()).length} 名を追加`
              : 'インポート'}
          </button>
        </div>
      </div>
    </div>
  );
}
