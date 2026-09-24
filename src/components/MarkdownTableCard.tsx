import React, { useState, useMemo } from 'react';
import {
  Table as TableIcon,
  Copy,
  Check,
  Download,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Columns3,
} from 'lucide-react';

export interface TableData {
  title: string;
  headers: string[];
  rows: string[][];
  alignments?: ('left' | 'center' | 'right')[];
}

interface MarkdownTableCardProps {
  data: TableData;
  accentColor?: string;
  isMe?: boolean;
}

export const MarkdownTableCard: React.FC<MarkdownTableCardProps> = ({
  data,
  accentColor = '#f59e0b',
  isMe,
}) => {
  const [copied, setCopied] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [sortColIndex, setSortColIndex] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { title, headers, rows, alignments } = data;

  // Filter rows based on search query
  const filteredRows = useMemo(() => {
    if (!filterQuery.trim()) return rows;
    const query = filterQuery.toLowerCase().trim();
    return rows.filter((row) =>
      row.some((cell) => cell.toLowerCase().includes(query))
    );
  }, [rows, filterQuery]);

  // Sort rows based on active sort column
  const sortedRows = useMemo(() => {
    if (sortColIndex === null) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const valA = (a[sortColIndex] || '').trim();
      const valB = (b[sortColIndex] || '').trim();

      // Check if numeric comparison
      const numA = Number(valA.replace(/[^0-9.-]+/g, ''));
      const numB = Number(valB.replace(/[^0-9.-]+/g, ''));
      if (!isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '') {
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }

      return sortDirection === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });
  }, [filteredRows, sortColIndex, sortDirection]);

  const handleHeaderClick = (colIdx: number) => {
    if (sortColIndex === colIdx) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        // Reset sort
        setSortColIndex(null);
      }
    } else {
      setSortColIndex(colIdx);
      setSortDirection('asc');
    }
  };

  const handleCopyMarkdown = () => {
    let md = `### ${title}\n\n`;
    md += `| ${headers.join(' | ')} |\n`;
    md += `| ${headers.map((_, i) => {
      const align = alignments?.[i] || 'left';
      if (align === 'center') return ':---:';
      if (align === 'right') return '---:';
      return '---';
    }).join(' | ')} |\n`;

    rows.forEach((r) => {
      md += `| ${r.join(' | ')} |\n`;
    });

    navigator.clipboard.writeText(md).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadCsv = () => {
    const csvContent = [
      headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `${(title || 'table').toLowerCase().replace(/\s+/g, '_')}_export.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="my-2.5 rounded-2xl border border-neutral-700/60 bg-neutral-950/90 shadow-xl overflow-hidden backdrop-blur-md max-w-2xl w-full select-text transition-all">
      {/* Table Header Bar */}
      <div className="px-4 py-3 bg-neutral-900/90 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <TableIcon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
              <span>{title || 'Data Matrix'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-800 text-neutral-400 font-mono">
                {rows.length} {rows.length === 1 ? 'row' : 'rows'}
              </span>
            </h4>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* In-table Search */}
          <div className="relative">
            <Search className="w-3 h-3 text-neutral-500 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter table..."
              className="pl-6 pr-2 py-1 rounded-lg bg-black/50 border border-neutral-700 text-[11px] text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-400 w-28 sm:w-36 transition-all"
            />
          </div>

          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Copy as Markdown Table"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadCsv}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Table Scrollable Body */}
      <div className="overflow-x-auto custom-scrollbar max-h-80">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-neutral-900/50 border-b border-neutral-800 font-mono text-[11px] text-neutral-400">
              <th className="py-2.5 px-3 w-8 text-neutral-600 select-none text-center">#</th>
              {headers.map((head, idx) => {
                const align = alignments?.[idx] || 'left';
                const isSorted = sortColIndex === idx;
                return (
                  <th
                    key={idx}
                    onClick={() => handleHeaderClick(idx)}
                    className={`py-2.5 px-3 font-semibold uppercase tracking-wider select-none cursor-pointer hover:text-amber-300 hover:bg-white/5 transition-colors ${
                      align === 'center'
                        ? 'text-center'
                        : align === 'right'
                        ? 'text-right'
                        : 'text-left'
                    }`}
                  >
                    <div
                      className={`inline-flex items-center gap-1 ${
                        align === 'center'
                          ? 'justify-center'
                          : align === 'right'
                          ? 'justify-end'
                          : 'justify-start'
                      }`}
                    >
                      <span>{head}</span>
                      {isSorted ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-amber-400" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-amber-400" />
                        )
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-neutral-600 opacity-40 hover:opacity-100" />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60 font-mono text-[12px]">
            {sortedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={headers.length + 1}
                  className="py-6 text-center text-neutral-500 font-sans text-xs"
                >
                  No rows matching "{filterQuery}"
                </td>
              </tr>
            ) : (
              sortedRows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className="hover:bg-amber-500/5 transition-colors group"
                >
                  <td className="py-2 px-3 text-[10px] text-neutral-600 text-center font-mono select-none">
                    {rIdx + 1}
                  </td>
                  {headers.map((_, cIdx) => {
                    const cell = row[cIdx] || '';
                    const align = alignments?.[cIdx] || 'left';
                    return (
                      <td
                        key={cIdx}
                        className={`py-2 px-3 text-neutral-200 break-words ${
                          align === 'center'
                            ? 'text-center'
                            : align === 'right'
                            ? 'text-right'
                            : 'text-left'
                        }`}
                      >
                        {cell}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-1.5 bg-neutral-900/40 border-t border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-500 font-mono">
        <span>Click column headers to sort</span>
        <span>
          Showing {sortedRows.length} of {rows.length} rows
        </span>
      </div>
    </div>
  );
};

// Helper function to parse Table representation from string
export function parseTableFromText(text: string): TableData | null {
  const trimmed = text.trim();

  // Pattern 1: [TABLE:Title:Headers:Rows]
  // Format: [TABLE:Title:Col1,Col2,Col3:R1C1,R1C2,R1C3|R2C1,R2C2,R2C3]
  const bracketMatch = trimmed.match(/^📊?\s*\[TABLE:([^:]+):([^:]+):([\s\S]+)\]$/i);
  if (bracketMatch) {
    const title = bracketMatch[1].trim();
    const headers = bracketMatch[2].split(',').map((h) => h.trim());
    const rowChunks = bracketMatch[3].split('|').map((r) => r.trim()).filter(Boolean);
    const rows = rowChunks.map((chunk) => chunk.split(',').map((c) => c.trim()));
    return { title, headers, rows };
  }

  // Pattern 2: TABLE_DATA::Title::base64Json
  if (trimmed.startsWith('TABLE_DATA::')) {
    try {
      const parts = trimmed.split('::');
      const title = decodeURIComponent(parts[1] || 'Table');
      const jsonStr = decodeURIComponent(escape(atob(parts[2])));
      const parsed = JSON.parse(jsonStr);
      return {
        title: title || parsed.title,
        headers: parsed.headers || [],
        rows: parsed.rows || [],
        alignments: parsed.alignments,
      };
    } catch {
      return null;
    }
  }

  // Pattern 3: Standard Markdown Table (starts with '|' and has '| --- |' separator line)
  const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length >= 3 && lines[0].startsWith('|') && lines[1].includes('---')) {
    const headers = lines[0]
      .split('|')
      .slice(1, -1)
      .map((h) => h.trim());

    // Check alignments in lines[1]
    const alignSegments = lines[1].split('|').slice(1, -1).map((s) => s.trim());
    const alignments: ('left' | 'center' | 'right')[] = alignSegments.map((seg) => {
      if (seg.startsWith(':') && seg.endsWith(':')) return 'center';
      if (seg.endsWith(':')) return 'right';
      return 'left';
    });

    const rows: string[][] = [];
    for (let i = 2; i < lines.length; i++) {
      if (!lines[i].startsWith('|')) break;
      const rowCells = lines[i]
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());
      if (rowCells.length > 0) {
        rows.push(rowCells);
      }
    }

    if (headers.length > 0 && rows.length > 0) {
      return {
        title: 'Markdown Table',
        headers,
        rows,
        alignments,
      };
    }
  }

  return null;
}
