import React, { useState, useEffect, useCallback } from 'react';
import {
  Calculator,
  Lock,
  ShieldAlert,
  X,
  RotateCcw,
  Delete,
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

  const handleDigit = useCallback((digit: string) => {
    setRecentKeyHistory((prev) => [...prev.slice(-10), digit]);
    setDisplay((prev) => {
      if (waitingForOperand) {
        setWaitingForOperand(false);
        return digit;
      }
      return prev === '0' ? digit : prev + digit;
    });
  }, [waitingForOperand]);

  const handleOperator = useCallback((op: string) => {
    setRecentKeyHistory((prev) => [...prev.slice(-10), op]);
    setEquation(`${display} ${op}`);
    setWaitingForOperand(true);
  }, [display]);

  const handleClear = useCallback(() => {
    setDisplay('0');
    setEquation('');
    setWaitingForOperand(false);
    setRecentKeyHistory([]);
  }, []);

  const handleBackspace = useCallback(() => {
    setDisplay((prev) => {
      if (prev.length <= 1 || prev === 'Error' || prev === 'Infinity') {
        return '0';
      }
      return prev.slice(0, -1);
    });
    setRecentKeyHistory((prev) => prev.slice(0, -1));
  }, []);

  const handleEqual = useCallback(() => {
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
  }, [recentKeyHistory, display, equation, onEmergencyPurge, onClose]);

  // Physical keyboard listener for full camouflage immersion
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // If user presses Escape, check if secret code was typed or exit discreetly
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (['+', '-', '*', '/'].includes(e.key)) {
        e.preventDefault();
        handleOperator(e.key);
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEqual();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === '.' || e.key === ',') {
        e.preventDefault();
        setDisplay((prev) => (!prev.includes('.') ? prev + '.' : prev));
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleDigit, handleOperator, handleEqual, handleBackspace, handleClear, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/90 backdrop-blur-sm font-sans select-none animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs sm:max-w-sm rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl p-5 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Camouflage Title Bar */}
        <div className="flex items-center justify-between text-neutral-500 text-xs px-1">
          <div className="flex items-center gap-1.5 font-medium">
            <Calculator className="w-4 h-4 text-neutral-400" />
            <span>Standard Calculator</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors p-1 cursor-pointer"
            title="Discrete exit"
          >
            v2.4
          </button>
        </div>

        {/* Calculator Display */}
        <div className="bg-black/70 rounded-2xl p-4 text-right border border-neutral-800 flex flex-col justify-end min-h-[90px] shadow-inner">
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
            className="p-3.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-sm active:scale-95 transition-all cursor-pointer"
          >
            C
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="p-3.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-sm active:scale-95 transition-all flex items-center justify-center cursor-pointer"
            title="Backspace"
          >
            <Delete className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              const val = parseFloat(display);
              if (!isNaN(val)) setDisplay(String(val / 100));
            }}
            className="p-3.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-sm active:scale-95 transition-all cursor-pointer"
          >
            %
          </button>
          <button
            type="button"
            onClick={() => handleOperator('/')}
            className="p-3.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-semibold text-base active:scale-95 transition-all cursor-pointer"
          >
            ÷
          </button>

          <button
            type="button"
            onClick={() => handleDigit('7')}
            className="p-3.5 rounded-2xl bg-neutral-850 hover:bg-neutral-750 text-white font-medium text-base active:scale-95 transition-all cursor-pointer"
          >
            7
          </button>
          <button
            type="button"
            onClick={() => handleDigit('8')}
            className="p-3.5 rounded-2xl bg-neutral-850 hover:bg-neutral-750 text-white font-medium text-base active:scale-95 transition-all cursor-pointer"
          >
            8
          </button>
          <button
            type="button"
            onClick={() => handleDigit('9')}
            className="p-3.5 rounded-2xl bg-neutral-850 hover:bg-neutral-750 text-white font-medium text-base active:scale-95 transition-all cursor-pointer"
          >
            9
          </button>
          <button
            type="button"
            onClick={() => handleOperator('*')}
            className="p-3.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-semibold text-base active:scale-95 transition-all cursor-pointer"
          >
            ×
          </button>

          <button
            type="button"
            onClick={() => handleDigit('4')}
            className="p-3.5 rounded-2xl bg-neutral-850 hover:bg-neutral-750 text-white font-medium text-base active:scale-95 transition-all cursor-pointer"
          >
            4
          </button>
          <button
            type="button"
            onClick={() => handleDigit('5')}
            className="p-3.5 rounded-2xl bg-neutral-850 hover:bg-neutral-750 text-white font-medium text-base active:scale-95 transition-all cursor-pointer"
          >
            5
          </button>
          <button
            type="button"
            onClick={() => handleDigit('6')}
            className="p-3.5 rounded-2xl bg-neutral-850 hover:bg-neutral-750 text-white font-medium text-base active:scale-95 transition-all cursor-pointer"
          >
            6
          </button>
          <button
            type="button"
            onClick={() => handleOperator('-')}
            className="p-3.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-semibold text-base active:scale-95 transition-all cursor-pointer"
          >
            -
          </button>

          <button
            type="button"
            onClick={() => handleDigit('1')}
            className="p-3.5 rounded-2xl bg-neutral-850 hover:bg-neutral-750 text-white font-medium text-base active:scale-95 transition-all cursor-pointer"
          >
            1
          </button>
          <button
            type="button"
            onClick={() => handleDigit('2')}
            className="p-3.5 rounded-2xl bg-neutral-850 hover:bg-neutral-750 text-white font-medium text-base active:scale-95 transition-all cursor-pointer"
          >
            2
          </button>
          <button
            type="button"
            onClick={() => handleDigit('3')}
            className="p-3.5 rounded-2xl bg-neutral-850 hover:bg-neutral-750 text-white font-medium text-base active:scale-95 transition-all cursor-pointer"
          >
            3
          </button>
          <button
            type="button"
            onClick={() => handleOperator('+')}
            className="p-3.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-semibold text-base active:scale-95 transition-all cursor-pointer"
          >
            +
          </button>

          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="col-span-2 p-3.5 rounded-2xl bg-neutral-850 hover:bg-neutral-750 text-white font-medium text-base active:scale-95 transition-all text-left pl-6 cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => {
              if (!display.includes('.')) setDisplay(display + '.');
            }}
            className="p-3.5 rounded-2xl bg-neutral-850 hover:bg-neutral-750 text-white font-medium text-base active:scale-95 transition-all cursor-pointer"
          >
            .
          </button>
          <button
            type="button"
            onClick={handleEqual}
            className="p-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-lg active:scale-95 transition-all cursor-pointer shadow-md"
          >
            =
          </button>
        </div>

        {/* Camouflage Hint (Discreet) */}
        <div className="text-[10px] text-neutral-500 text-center flex items-center justify-between px-1">
          <span>Type <strong className="text-neutral-400">7777=</strong> or <strong className="text-neutral-400">42=</strong> to return</span>
          <span className="text-rose-400/80"><strong className="text-rose-400">9999=</strong> emergency purge</span>
        </div>
      </div>
    </div>
  );
};

