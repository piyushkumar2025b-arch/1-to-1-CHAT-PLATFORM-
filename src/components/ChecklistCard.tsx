import React, { useState } from 'react';
import { CheckSquare, Square, CheckCircle2, ListTodo, Plus, Trash2 } from 'lucide-react';

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

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
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

  return (
    <div className="w-full max-w-sm rounded-xl overflow-hidden border border-emerald-500/30 bg-neutral-950/80 shadow-md my-1 text-left select-none">
      {/* Header */}
      <div className="px-3 py-2 bg-emerald-500/15 border-b border-emerald-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTodo className="w-4 h-4 text-emerald-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-emerald-300">
            {title || 'Interactive Checklist'}
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
          {completedCount}/{totalCount} ({percent}%)
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-neutral-800 overflow-hidden">
        <div
          className="h-full bg-emerald-400 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* List items */}
      <div className="p-3 space-y-1.5">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
              item.done
                ? 'bg-neutral-900/40 text-neutral-500 line-through'
                : 'hover:bg-neutral-900 text-neutral-200'
            }`}
          >
            {item.done ? (
              <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Square className="w-4 h-4 text-neutral-400 shrink-0 hover:text-white" />
            )}
            <span className="text-xs break-words">{item.text}</span>
          </div>
        ))}

        {showAdd ? (
          <form onSubmit={handleAddItem} className="flex items-center gap-1.5 pt-1">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="Add checklist item..."
              autoFocus
              className="flex-1 px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-750 text-neutral-100 text-xs focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!newItemText.trim()}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs cursor-pointer disabled:opacity-40"
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
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 text-[11px] text-neutral-400 hover:text-emerald-400 pt-1 font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        )}
      </div>
    </div>
  );
};
