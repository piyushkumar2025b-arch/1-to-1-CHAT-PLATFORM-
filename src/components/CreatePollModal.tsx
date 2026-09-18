import React, { useState } from 'react';
import {
  BarChart2,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  ListFilter,
  Sparkles,
} from 'lucide-react';

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePoll: (poll: {
    question: string;
    options: string[];
    allowMultiple: boolean;
  }) => void;
  accentColor?: string;
}

export const CreatePollModal: React.FC<CreatePollModalProps> = ({
  isOpen,
  onClose,
  onCreatePoll,
  accentColor = '#f59e0b',
}) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (options.length >= 8) return;
    setOptions((prev) => [...prev, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleOptionChange = (index: number, val: string) => {
    setOptions((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuestion = question.trim();
    if (!cleanQuestion) {
      setError('Please provide a poll question or topic.');
      return;
    }

    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (cleanOptions.length < 2) {
      setError('Please provide at least two valid options.');
      return;
    }

    // Check for duplicates
    const uniqueOptions = new Set(cleanOptions.map((o) => o.toLowerCase()));
    if (uniqueOptions.size !== cleanOptions.length) {
      setError('Options must be unique.');
      return;
    }

    onCreatePoll({
      question: cleanQuestion,
      options: cleanOptions,
      allowMultiple,
    });

    // Reset and close
    setQuestion('');
    setOptions(['', '']);
    setAllowMultiple(false);
    setError('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div
              style={{ backgroundColor: `${accentColor}25`, borderColor: `${accentColor}50`, color: accentColor }}
              className="w-8 h-8 rounded-lg border flex items-center justify-center"
            >
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Create Encrypted Poll</h3>
              <p className="text-[11px] text-neutral-400">
                End-to-end encrypted voting for decisions & feedback
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Question Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
              <span>Poll Question</span>
              <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Which server region should we deploy to?"
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                if (error) setError('');
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-amber-500 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Options Inputs */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-300 flex items-center justify-between">
              <span>Poll Options (2 to 8)</span>
              <span className="text-[11px] text-neutral-500">{options.length} options</span>
            </label>

            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-5 text-center text-xs font-mono text-neutral-500">
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    required
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => {
                      handleOptionChange(idx, e.target.value);
                      if (error) setError('');
                    }}
                    className="flex-1 px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-amber-500 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none transition-colors"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      title="Remove option"
                      className="p-2 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 8 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="w-full py-2 px-3 rounded-xl border border-dashed border-neutral-750 hover:border-neutral-600 bg-neutral-950/40 hover:bg-neutral-800/40 text-xs text-neutral-400 hover:text-neutral-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Option</span>
              </button>
            )}
          </div>

          {/* Poll Settings */}
          <div className="pt-2 border-t border-neutral-800 space-y-2">
            <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 cursor-pointer select-none">
              <div className="flex items-center gap-2.5">
                <ListFilter className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="text-xs font-medium text-neutral-200 block">
                    Allow Multiple Selections
                  </span>
                  <span className="text-[11px] text-neutral-400 block">
                    Peers can vote for more than one choice
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={allowMultiple}
                onChange={(e) => setAllowMultiple(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </label>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ backgroundColor: accentColor }}
              className="px-4 py-2 text-xs rounded-xl text-neutral-950 font-bold hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Broadcast Poll</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default CreatePollModal;
