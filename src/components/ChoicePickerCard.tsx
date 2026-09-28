import React, { useState } from 'react';
import { Dices, Sparkles, RefreshCw, Copy, Check } from 'lucide-react';

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
  const [copied, setCopied] = useState(false);

  const handleSpin = () => {
    if (isSpinning || options.length === 0) return;
    setIsSpinning(true);
    setSelectedIdx(null);
    setCopied(false);

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

  const handleCopyWinner = () => {
    if (selectedIdx === null) return;
    const winnerText = options[selectedIdx];
    navigator.clipboard?.writeText(winnerText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <Dices style={{ color: accentColor }} className="w-4 h-4" />
          <span
            style={{ color: accentColor }}
            className="text-[11px] font-bold uppercase tracking-wider font-mono"
          >
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
              style={
                isWinner
                  ? { backgroundColor: accentColor, borderColor: accentColor }
                  : isHighlighted
                  ? { borderColor: `${accentColor}70` }
                  : undefined
              }
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                isWinner
                  ? 'text-neutral-950 shadow-md font-bold'
                  : isHighlighted
                  ? 'bg-neutral-800 text-white'
                  : 'bg-neutral-900/60 text-neutral-200 border-neutral-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] opacity-60">#{idx + 1}</span>
                <span>{opt}</span>
              </div>
              {isWinner && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopyWinner}
                    title="Copy selected winner"
                    className="p-1 rounded bg-neutral-950/20 hover:bg-neutral-950/30 text-neutral-950 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </button>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-950 text-white flex items-center gap-1 font-bold">
                    <Sparkles className="w-3 h-3" />
                    <span>WINNER</span>
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Spin Button */}
        <button
          type="button"
          disabled={isSpinning}
          onClick={handleSpin}
          style={{ backgroundColor: accentColor }}
          className="w-full mt-2 py-2 rounded-xl text-xs font-bold text-neutral-950 hover:opacity-90 transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
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
