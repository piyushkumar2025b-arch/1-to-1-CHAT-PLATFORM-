import React, { useState } from 'react';
import {
  X,
  Table as TableIcon,
  Plus,
  Trash2,
  Send,
  Upload,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  FileSpreadsheet,
  Copy,
  Check,
} from 'lucide-react';
import { TableData } from './MarkdownTableCard';

interface TableGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertTable: (serializedTable: string) => void;
  accentColor?: string;
}

const PRESETS: { name: string; title: string; headers: string[]; rows: string[][] }[] = [
  {
    name: 'Security Audit',
    title: 'Zero-Knowledge Security Audit',
    headers: ['Subsystem', 'Algorithm', 'Key Size', 'Status'],
    rows: [
      ['In-Flight Tunnel', 'AES-256-GCM', '256-bit', 'Verified Encrypted'],
      ['Key Exchange', 'ECDH P-256', '256-bit', 'Ephemeral Verified'],
      ['Storage Enclave', 'Argon2id + PBKDF2', '512-bit', 'Hardened Enclave'],
      ['Anti-Replay', 'CSPRNG Nonce', '96-bit', 'Passed Audit'],
    ],
  },
  {
    name: 'Server Status',
    title: 'Cluster Node Health',
    headers: ['Node ID', 'Region', 'Latency', 'RAM Load', 'Uptime'],
    rows: [
      ['sgp-alpha-01', 'ap-southeast-1', '12ms', '42%', '99.99%'],
      ['sgp-beta-02', 'ap-southeast-1', '14ms', '38%', '99.98%'],
      ['fra-edge-01', 'eu-central-1', '78ms', '56%', '99.95%'],
      ['iad-node-03', 'us-east-1', '112ms', '61%', '99.91%'],
    ],
  },
  {
    name: 'Task Matrix',
    title: 'Sprint Deliverables',
    headers: ['Task Item', 'Assignee', 'Priority', 'ETA'],
    rows: [
      ['Audit WebRTC Stun Turn', 'SecOps', 'High', 'Today'],
      ['Implement Shamir GF(256)', 'Crypto Team', 'Critical', 'Completed'],
      ['Benchmark Audio Filters', 'DSP Eng', 'Medium', 'Tomorrow'],
    ],
  },
];

export const TableGeneratorModal: React.FC<TableGeneratorModalProps> = ({
  isOpen,
  onClose,
  onInsertTable,
  accentColor = '#f59e0b',
}) => {
  const [title, setTitle] = useState('Data Matrix');
  const [headers, setHeaders] = useState<string[]>(['Item', 'Attribute', 'Status']);
  const [rows, setRows] = useState<string[][]>([
    ['Alpha 1', 'Config Verified', 'Active'],
    ['Beta 2', 'Enclave Bound', 'Standby'],
    ['Gamma 3', 'Audited', 'Ready'],
  ]);
  const [alignments, setAlignments] = useState<('left' | 'center' | 'right')[]>([
    'left',
    'left',
    'center',
  ]);
  const [csvImportText, setCsvImportText] = useState('');
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Add Column
  const handleAddColumn = () => {
    setHeaders((prev) => [...prev, `Column ${prev.length + 1}`]);
    setRows((prev) => prev.map((row) => [...row, '']));
    setAlignments((prev) => [...prev, 'left']);
  };

  // Remove Column
  const handleRemoveColumn = (colIdx: number) => {
    if (headers.length <= 1) return;
    setHeaders((prev) => prev.filter((_, i) => i !== colIdx));
    setRows((prev) => prev.map((row) => row.filter((_, i) => i !== colIdx)));
    setAlignments((prev) => prev.filter((_, i) => i !== colIdx));
  };

  // Add Row
  const handleAddRow = () => {
    setRows((prev) => [...prev, new Array(headers.length).fill('')]);
  };

  // Remove Row
  const handleRemoveRow = (rowIdx: number) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== rowIdx));
  };

  // Update Header
  const handleUpdateHeader = (colIdx: number, val: string) => {
    setHeaders((prev) => prev.map((h, i) => (i === colIdx ? val : h)));
  };

  // Update Cell
  const handleUpdateCell = (rowIdx: number, colIdx: number, val: string) => {
    setRows((prev) =>
      prev.map((row, r) =>
        r === rowIdx ? row.map((cell, c) => (c === colIdx ? val : cell)) : row
      )
    );
  };

  // Toggle Alignment
  const handleToggleAlign = (colIdx: number) => {
    setAlignments((prev) =>
      prev.map((align, i) => {
        if (i !== colIdx) return align;
        if (align === 'left') return 'center';
        if (align === 'center') return 'right';
        return 'left';
      })
    );
  };

  // Apply Preset
  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setTitle(preset.title);
    setHeaders([...preset.headers]);
    setRows(preset.rows.map((r) => [...r]));
    setAlignments(new Array(preset.headers.length).fill('left'));
  };

  // Import CSV / TSV
  const handleImportCsv = () => {
    if (!csvImportText.trim()) return;
    const lines = csvImportText.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    // Detect delimiter: tab or comma
    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : ',';

    const parsedHeaders = lines[0].split(delimiter).map((c) => c.replace(/^"|"$/g, '').trim());
    const parsedRows = lines.slice(1).map((l) =>
      l.split(delimiter).map((c) => c.replace(/^"|"$/g, '').trim())
    );

    if (parsedHeaders.length > 0) {
      setHeaders(parsedHeaders);
      setRows(parsedRows.length > 0 ? parsedRows : [new Array(parsedHeaders.length).fill('')]);
      setAlignments(new Array(parsedHeaders.length).fill('left'));
      setShowCsvImport(false);
      setCsvImportText('');
    }
  };

  const serializeForChat = (): string => {
    const data: TableData = {
      title: title.trim() || 'Data Matrix',
      headers: headers.map((h) => h.trim()),
      rows: rows.map((r) => r.map((c) => c.trim())),
      alignments,
    };
    const jsonStr = JSON.stringify(data);
    const b64 = btoa(unescape(encodeURIComponent(jsonStr)));
    return `TABLE_DATA::${encodeURIComponent(data.title)}::${b64}`;
  };

  const handleSendToChat = () => {
    const serialized = serializeForChat();
    onInsertTable(serialized);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl rounded-3xl bg-neutral-950 border border-neutral-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner">
              <TableIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Interactive Table Builder
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                  Markdown / Matrix
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Design sortable, searchable encrypted data tables for the chat stream
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* Title & Presets */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                Table Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Table Title..."
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs font-semibold focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1.5 pt-4 sm:pt-0">
              <span className="text-[11px] text-neutral-500 font-mono">Presets:</span>
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-[11px] text-neutral-300 hover:text-white transition-colors cursor-pointer"
                >
                  {p.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowCsvImport(!showCsvImport)}
                className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* CSV Import Drawdown */}
          {showCsvImport && (
            <div className="p-4 rounded-2xl bg-neutral-900/90 border border-amber-500/30 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  Paste Raw CSV or TSV
                </span>
                <button
                  type="button"
                  onClick={() => setShowCsvImport(false)}
                  className="text-neutral-500 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>
              <textarea
                value={csvImportText}
                onChange={(e) => setCsvImportText(e.target.value)}
                placeholder="Paste CSV here, e.g.:&#10;Metric,Value,Target&#10;Latency,12ms,<50ms&#10;Throughput,1200rps,>1000rps"
                rows={3}
                className="w-full p-2.5 rounded-xl bg-black/60 border border-neutral-700 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={handleImportCsv}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs cursor-pointer transition-all"
              >
                Parse and Load Table
              </button>
            </div>
          )}

          {/* Visual Grid Editor */}
          <div className="border border-neutral-800 rounded-2xl overflow-hidden bg-neutral-900/40">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                {/* Headers */}
                <thead>
                  <tr className="bg-neutral-900 border-b border-neutral-800">
                    <th className="py-2.5 px-3 w-10 text-neutral-600 font-mono text-center">#</th>
                    {headers.map((head, cIdx) => (
                      <th key={cIdx} className="p-2 min-w-[140px]">
                        <div className="flex items-center gap-1.5 bg-neutral-950 p-1.5 rounded-xl border border-neutral-700/80">
                          <input
                            type="text"
                            value={head}
                            onChange={(e) => handleUpdateHeader(cIdx, e.target.value)}
                            className="w-full bg-transparent text-xs font-bold text-amber-300 focus:outline-none"
                            placeholder={`Header ${cIdx + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => handleToggleAlign(cIdx)}
                            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                            title={`Align: ${alignments[cIdx]}`}
                          >
                            {alignments[cIdx] === 'center' ? (
                              <AlignCenter className="w-3 h-3" />
                            ) : alignments[cIdx] === 'right' ? (
                              <AlignRight className="w-3 h-3" />
                            ) : (
                              <AlignLeft className="w-3 h-3" />
                            )}
                          </button>
                          {headers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveColumn(cIdx)}
                              className="p-1 rounded hover:bg-neutral-800 text-neutral-500 hover:text-rose-400 transition-colors"
                              title="Delete column"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="p-2 w-12 text-center">
                      <button
                        type="button"
                        onClick={handleAddColumn}
                        className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                        title="Add Column"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </th>
                  </tr>
                </thead>

                {/* Rows */}
                <tbody className="divide-y divide-neutral-800/60">
                  {rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-white/[0.02]">
                      <td className="py-2 px-3 text-center text-neutral-600 font-mono text-[10px]">
                        {rIdx + 1}
                      </td>
                      {headers.map((_, cIdx) => (
                        <td key={cIdx} className="p-1.5">
                          <input
                            type="text"
                            value={row[cIdx] || ''}
                            onChange={(e) => handleUpdateCell(rIdx, cIdx, e.target.value)}
                            placeholder="Value..."
                            className={`w-full px-2.5 py-1.5 rounded-lg bg-neutral-900/80 border border-neutral-800 focus:border-amber-400/80 text-white text-xs font-mono focus:outline-none ${
                              alignments[cIdx] === 'center'
                                ? 'text-center'
                                : alignments[cIdx] === 'right'
                                ? 'text-right'
                                : 'text-left'
                            }`}
                          />
                        </td>
                      ))}
                      <td className="p-1.5 text-center">
                        {rows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(rIdx)}
                            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-600 hover:text-rose-400 transition-colors"
                            title="Delete row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Row Bar */}
            <div className="p-2.5 bg-neutral-900/60 border-t border-neutral-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handleAddRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Add Row</span>
              </button>
              <span className="text-[11px] text-neutral-500 font-mono">
                {headers.length} Columns × {rows.length} Rows
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-900/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSendToChat}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all active:scale-[0.98] cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Insert Table into Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
};
