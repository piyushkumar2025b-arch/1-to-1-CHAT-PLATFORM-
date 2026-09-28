import React, { useState } from 'react';
import { CheckSquare, Square, CheckCircle2, ListTodo, Plus, Trash2, Copy, Check } from 'lucide-react';

interface ChecklistCardProps {
  title: string;
  initialItems: string[];
  accentColor?: string;
}

export const ChecklistCard: React.FC<ChecklistCardProps> = ({
  title,
  initialItems,
  accentColor = '#f59e0b',
}) => {
  const [items, setItems] = useState<{ id: string; text: string; done: boolean }[]>(() =>
    initialItems.map((text, idx) => ({
      id: `item-${idx}-${text}`,
      text: text.trim(),
      done: false,
    }))
  );

  const [newItemText, setNewItemText] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const deleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = [
      `📋 ${title || 'Checklist'}:`,
      ...items.map((i) => `[${i.done ? 'x' : ' '}] ${i.text}`),
    ].join('\n');
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        text: newItemText.trim(),
        done: false,
      },
    ]);
    setNewItemText('');
    setShowAdd(false);
  };

  const completedCount = items.filter((i) => i.done).length;
  const totalCount = items.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleToggleAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const allDone = items.every((i) => i.done);
    setItems((prev) => prev.map((item) => ({ ...item, done: !allDone })));
  };

  return (
    <div
      style={{ borderColor: `${accentColor}30` }}
      className="w-full max-w-sm rounded-xl overflow-hidden border bg-neutral-950/80 shadow-md my-1 text-left select-none"
    >
      {/* Header */}
      <div
        style={{ backgroundColor: `${accentColor}15`, borderColor: `${accentColor}20` }}
        className="px-3 py-2 border-b flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <ListTodo style={{ color: accentColor }} className="w-4 h-4" />
          <span
            style={{ color: accentColor }}
            className="text-[11px] font-bold uppercase tracking-wider font-mono"
          >
            {title || 'Interactive Checklist'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Copy checklist state to clipboard"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
          <span
            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
            className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
          >
            {completedCount}/{totalCount} ({percent}%)
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-neutral-800 overflow-hidden">
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${percent}%`, backgroundColor: accentColor }}
        />
      </div>

      {/* List items */}
      <div className="p-3 space-y-1.5">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className={`group flex items-center justify-between gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
              item.done
                ? 'bg-neutral-900/40 text-neutral-500 line-through'
                : 'hover:bg-neutral-900 text-neutral-200'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {item.done ? (
                <CheckSquare style={{ color: accentColor }} className="w-4 h-4 shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-neutral-400 shrink-0 hover:text-white" />
              )}
              <span className="text-xs break-words">{item.text}</span>
            </div>
            <button
              type="button"
              onClick={(e) => deleteItem(item.id, e)}
              className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-rose-400 rounded transition-all cursor-pointer"
              title="Delete item"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}

        {showAdd ? (
          <form onSubmit={handleAddItem} className="flex items-center gap-1.5 pt-1">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setShowAdd(false);
              }}
              placeholder="Add checklist item... (Esc to cancel)"
              autoFocus
              className="flex-1 px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-750 text-neutral-100 text-xs focus:outline-none focus:border-white/40"
            />
            <button
              type="submit"
              disabled={!newItemText.trim()}
              style={{ backgroundColor: accentColor }}
              className="px-2.5 py-1.5 rounded-lg text-neutral-950 font-bold text-xs cursor-pointer disabled:opacity-40"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-2 py-1.5 rounded-lg text-neutral-400 hover:text-white text-xs cursor-pointer"
            >
              Cancel
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              style={{ color: accentColor }}
              className="flex items-center gap-1.5 text-[11px] font-medium transition-colors cursor-pointer hover:opacity-85"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>

            {items.length > 0 && (
              <button
                type="button"
                onClick={handleToggleAll}
                className="text-[10px] text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer font-mono"
              >
                {items.every((i) => i.done) ? 'Uncheck All' : 'Check All'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
