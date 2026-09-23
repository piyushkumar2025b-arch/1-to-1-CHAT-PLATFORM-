import React, { useState } from 'react';
import { Dices, Check, Sparkles, RefreshCw } from 'lucide-react';

interface ChoicePickerCardProps {
  options: string[];
  title?: string;
  accentColor?: string;
}

export const ChoicePickerCard: React.FC<ChoicePickerCardProps> = ({
  options,
  title = 'Decision Picker',
  accentColor = '#f59e0b',
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState<number>(0);

  const handleSpin = () => {
    if (isSpinning || options.length === 0) return;
    setIsSpinning(true);
    setSelectedIdx(null);

    let current = 0;
    let speed = 60;
    let cycles = 0;
    const maxCycles = 15 + Math.floor(Math.random() * 10);

    const step = () => {
      current = (current + 1) % options.length;
      setHighlightIdx(current);
      cycles++;

      if (cycles < maxCycles) {
        speed += 12;
        setTimeout(step, speed);
      } else {
        // CSPRNG final winner pick
        const randArray = new Uint32Array(1);
        crypto.getRandomValues(randArray);
        const winner = randArray[0] % options.length;
        setHighlightIdx(winner);
        setSelectedIdx(winner);
        setIsSpinning(false);
      }
    };

    setTimeout(step, speed);
  };

  return (
    <div className="w-full max-w-sm rounded-xl overflow-hidden border border-amber-500/30 bg-neutral-950/80 shadow-md my-1 text-left select-none">
      {/* Header */}
      <div className="px-3 py-2 bg-amber-500/15 border-b border-amber-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dices className="w-4 h-4 text-amber-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-amber-300">
            {title}
          </span>
        </div>
        <span className="text-[9px] font-mono text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded">
          {options.length} Options
        </span>
      </div>

      {/* Options List */}
      <div className="p-3 space-y-1.5">
        {options.map((opt, idx) => {
          const isWinner = selectedIdx === idx;
          const isHighlighted = isSpinning && highlightIdx === idx;

          return (
            <div
              key={idx}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                isWinner
                  ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-md font-bold'
                  : isHighlighted
                  ? 'bg-neutral-800 text-amber-300 border-amber-500/60'
                  : 'bg-neutral-900/60 text-neutral-200 border-neutral-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] opacity-60">#{idx + 1}</span>
                <span>{opt}</span>
              </div>
              {isWinner && (
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-950 text-amber-300 flex items-center gap-1 font-bold">
                  <Sparkles className="w-3 h-3" />
                  <span>WINNER</span>
                </span>
              )}
            </div>
          );
        })}

        {/* Spin Button */}
        <button
          type="button"
          disabled={isSpinning}
          onClick={handleSpin}
          className="w-full mt-2 py-2 rounded-xl text-xs font-bold text-neutral-950 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
        >
          {isSpinning ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Selecting...</span>
            </>
          ) : (
            <>
              <Dices className="w-3.5 h-3.5" />
              <span>{selectedIdx !== null ? 'Spin Again' : 'Randomize Selection'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
