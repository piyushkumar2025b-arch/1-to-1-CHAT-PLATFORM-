import React, { useState } from 'react';
import {
  Calculator,
  Lock,
  ShieldAlert,
  X,
  RotateCcw,
} from 'lucide-react';

interface DuressCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmergencyPurge: () => void;
  accentColor?: string;
}

export const DuressCalculatorModal: React.FC<DuressCalculatorModalProps> = ({
  isOpen,
  onClose,
  onEmergencyPurge,
  accentColor = '#f59e0b',
}) => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [recentKeyHistory, setRecentKeyHistory] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    setRecentKeyHistory((prev) => [...prev.slice(-10), digit]);
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const handleOperator = (op: string) => {
    setRecentKeyHistory((prev) => [...prev.slice(-10), op]);
    setEquation(`${display} ${op}`);
    setWaitingForOperand(true);
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setWaitingForOperand(false);
    setRecentKeyHistory([]);
  };

  const handleEqual = () => {
    const historyStr = recentKeyHistory.join('');

    // Check for Duress Panic Code: 9999=
    if (historyStr.endsWith('9999') || display === '9999') {
      onEmergencyPurge();
      onClose();
      return;
    }

    // Check for Secret Exit Code: 7777= or 42=
    if (historyStr.endsWith('7777') || display === '7777' || historyStr.endsWith('42') || display === '42') {
      onClose();
      return;
    }

    try {
      // Evaluate standard arithmetic safely
      const sanitized = `${equation} ${display}`.replace(/[^0-9+\-*/.]/g, '');
      // eslint-disable-next-line no-eval
      const result = Function(`'use strict'; return (${sanitized})`)();
      setDisplay(String(result));
      setEquation('');
      setWaitingForOperand(true);
    } catch {
      setDisplay('Error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950 font-sans select-none animate-in fade-in duration-100">
      <div className="w-full max-w-xs sm:max-w-sm rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl p-5 flex flex-col gap-4">
        {/* Camouflage Title Bar */}
        <div className="flex items-center justify-between text-neutral-500 text-xs px-1">
          <div className="flex items-center gap-1.5 font-medium">
            <Calculator className="w-4 h-4 text-neutral-400" />
            <span>Standard Calculator</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[10px] text-neutral-600 hover:text-neutral-400"
            title="Discrete exit"
          >
            v2.4
          </button>
        </div>

        {/* Calculator Display */}
        <div className="bg-black/60 rounded-2xl p-4 text-right border border-neutral-800 flex flex-col justify-end min-h-[90px]">
          <div className="text-xs text-neutral-500 font-mono h-4 truncate">
            {equation}
          </div>
          <div className="text-3xl font-light text-white font-mono tracking-tight truncate">
            {display}
          </div>
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={handleClear}
            className="p-3.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-sm active:scale-95 transition-all"
          >
            C
          </button>
          <button
            type="button"
            onClick={() => {
              const val = parseFloat(display);
              setDisplay(String(-val));
            }}
            className="p-3.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-sm active:scale-95 transition-all"
          >
            +/-
          </button>
          <button
            type="button"
            onClick={() => {
              const val = parseFloat(display);
              setDisplay(String(val / 100));
            }}
            className="p-3.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-sm active:scale-95 transition-all"
          >
            %
          </button>
          <button
            type="button"
            onClick={() => handleOperator('/')}
            className="p-3.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-semibold text-base active:scale-95 transition-all"
          >
            ÷
          </button>

          <button
            type="button"
            onClick={() => handleDigit('7')}
            className="p-3.5 rounded-2xl bg-neutral-850 hover:bg-neutral-750 text-white font-medium text-base active:scale-95 transition-all"
          >
            7
          </button>
          <button
            type="button"
            onClick={() => handleDigit('8')}
            className="p-3.5 rounded-2xl bg-neutral-850 hover:bg-neutral-750 text-white font-medium text-base active:scale-95 transition-all"
          >
            8
          </button>
          <button
            type="button"
            onClick={() => handleDigit('9')}
            className="p-3.5 rounded-2xl bg-neutral-850 hover:bg-neutral-750 text-white font-medium text-base active:scale-95 transition-all"
          >
            9
          </button>
          <button
            type="button"
            onClick={() => handleOperator('*')}
            className="p-3.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-semibold text-base active:scale-95 transition-all"
          >
            ×
          </button>

          <button
            type="button"
            onClick={() => handleDigit('4')}
            className="p-3.5 rounded-2xl bg-neutral-850 hover:bg-neutral-750 text-white font-medium text-base active:scale-95 transition-all"
          >
            4
          </button>
          <button
            type="button"
            onClick={() => handleDigit('5')}
            className="p-3.5 rounded-2xl bg-neutral-850 hover:bg-neutral-750 text-white font-medium text-base active:scale-95 transition-all"
          >
            5
          </button>
          <button
            type="button"
            onClick={() => handleDigit('6')}
            className="p-3.5 rounded-2xl bg-neutral-850 hover:bg-neutral-750 text-white font-medium text-base active:scale-95 transition-all"
          >
            6
          </button>
          <button
            type="button"
            onClick={() => handleOperator('-')}
            className="p-3.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-semibold text-base active:scale-95 transition-all"
          >
            -
          </button>

          <button
            type="button"
            onClick={() => handleDigit('1')}
            className="p-3.5 rounded-2xl bg-neutral-850 hover:bg-neutral-750 text-white font-medium text-base active:scale-95 transition-all"
          >
            1
          </button>
          <button
            type="button"
            onClick={() => handleDigit('2')}
            className="p-3.5 rounded-2xl bg-neutral-850 hover:bg-neutral-750 text-white font-medium text-base active:scale-95 transition-all"
          >
            2
          </button>
          <button
            type="button"
            onClick={() => handleDigit('3')}
            className="p-3.5 rounded-2xl bg-neutral-850 hover:bg-neutral-750 text-white font-medium text-base active:scale-95 transition-all"
          >
            3
          </button>
          <button
            type="button"
            onClick={() => handleOperator('+')}
            className="p-3.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-semibold text-base active:scale-95 transition-all"
          >
            +
          </button>

          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="col-span-2 p-3.5 rounded-2xl bg-neutral-850 hover:bg-neutral-750 text-white font-medium text-base active:scale-95 transition-all text-left pl-6"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => {
              if (!display.includes('.')) setDisplay(display + '.');
            }}
            className="p-3.5 rounded-2xl bg-neutral-850 hover:bg-neutral-750 text-white font-medium text-base active:scale-95 transition-all"
          >
            .
          </button>
          <button
            type="button"
            onClick={handleEqual}
            className="p-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-lg active:scale-95 transition-all"
          >
            =
          </button>
        </div>

        {/* Camouflage Hint (Discreet) */}
        <div className="text-[10px] text-neutral-600 text-center flex items-center justify-between px-1">
          <span>Type <strong>7777=</strong> or <strong>42=</strong> to return</span>
          <span className="text-rose-500/70"><strong>9999=</strong> emergency purge</span>
        </div>
      </div>
    </div>
  );
};
