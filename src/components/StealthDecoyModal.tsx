import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  FileText,
  BookOpen,
  ArrowLeft,
  Search,
  Check,
  Share,
  Download,
  Printer,
  ChevronDown,
} from 'lucide-react';

interface StealthDecoyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DecoyType = 'docs' | 'sheet' | 'wiki';

export const StealthDecoyModal: React.FC<StealthDecoyModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeDecoy, setActiveDecoy] = useState<DecoyType>('docs');

  // Listen for Esc key to return to chat
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white text-neutral-800 font-sans select-text overflow-y-auto">
      {/* Top Decoy Navigation Bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-neutral-200 px-4 py-2 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            title="Return to secure session (Press Esc)"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer border border-neutral-300"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Workspace (Esc)</span>
          </button>

          <div className="h-4 w-px bg-neutral-300" />

          {/* Decoy Switcher */}
          <div className="flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveDecoy('docs')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeDecoy === 'docs'
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Technical Spec</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveDecoy('sheet')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeDecoy === 'sheet'
                  ? 'bg-emerald-50 text-emerald-700 font-medium'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Q3 Budget Model</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveDecoy('wiki')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeDecoy === 'wiki'
                  ? 'bg-neutral-100 text-neutral-900 font-medium'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-neutral-600" />
              <span>Reference Manual</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span className="hidden sm:inline">Press Esc or click back anytime</span>
          <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 font-mono text-[11px] border border-neutral-200">
            Esc
          </span>
        </div>
      </div>

      {/* Main Body Depending on Decoy Mode */}
      {activeDecoy === 'docs' && (
        <div className="max-w-4xl mx-auto py-10 px-6 sm:px-12">
          <div className="border-b border-neutral-200 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-neutral-900 mb-1">
              RFC 9422: High-Performance Concurrent Ingestion Architecture
            </h1>
            <p className="text-xs text-neutral-500">
              Draft v3.2 • Engineering Core Services • Last updated by Systems Team
            </p>
          </div>

          <div className="space-y-6 text-sm text-neutral-700 leading-relaxed">
            <section>
              <h2 className="text-base font-semibold text-neutral-900 mb-2">1. Abstract & Scope</h2>
              <p>
                This specification outlines the telemetry pipeline and zero-allocation serialization
                structures utilized in our microservice boundary layer. By migrating legacy buffers
                to contiguous memory slabs, we achieve deterministic p99 tail latency below 2.4ms under
                sustained 45,000 requests-per-second payloads.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-neutral-900 mb-2">2. Architectural Topology</h2>
              <p className="mb-3">
                Incoming datagrams undergo cyclic validation at the ingress gateway before multiplexing
                onto thread-affine ring buffers:
              </p>
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 font-mono text-xs text-neutral-800 space-y-1">
                <p>+---------------------+      +------------------------+      +----------------------+</p>
                <p>|  TLS Ingress Proxy   | ---&gt; |  Memory-Mapped Ring    | ---&gt; |  Worker Thread Pool  |</p>
                <p>|  (Kernel eBPF XDP)  |      |  (Lockless Disruptor)  |      |  (Core Affinity)     |</p>
                <p>+---------------------+      +------------------------+      +----------------------+</p>
              </div>
            </section>

            <section>
              <h2 className="text-base font-semibold text-neutral-900 mb-2">3. Latency Benchmarks</h2>
              <table className="w-full text-xs text-left border-collapse border border-neutral-200">
                <thead>
                  <tr className="bg-neutral-100 text-neutral-800">
                    <th className="border border-neutral-200 p-2">Percentile</th>
                    <th className="border border-neutral-200 p-2">v2.8 Baseline</th>
                    <th className="border border-neutral-200 p-2">v3.2 Slab Allocation</th>
                    <th className="border border-neutral-200 p-2">Delta</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-neutral-200 p-2 font-mono">p50</td>
                    <td className="border border-neutral-200 p-2 font-mono">1.18 ms</td>
                    <td className="border border-neutral-200 p-2 font-mono">0.34 ms</td>
                    <td className="border border-neutral-200 p-2 text-emerald-600 font-mono">-71.2%</td>
                  </tr>
                  <tr>
                    <td className="border border-neutral-200 p-2 font-mono">p95</td>
                    <td className="border border-neutral-200 p-2 font-mono">4.82 ms</td>
                    <td className="border border-neutral-200 p-2 font-mono">1.12 ms</td>
                    <td className="border border-neutral-200 p-2 text-emerald-600 font-mono">-76.7%</td>
                  </tr>
                  <tr>
                    <td className="border border-neutral-200 p-2 font-mono">p99</td>
                    <td className="border border-neutral-200 p-2 font-mono">11.40 ms</td>
                    <td className="border border-neutral-200 p-2 font-mono">2.38 ms</td>
                    <td className="border border-neutral-200 p-2 text-emerald-600 font-mono">-79.1%</td>
                  </tr>
                </tbody>
              </table>
            </section>
          </div>
        </div>
      )}

      {activeDecoy === 'sheet' && (
        <div className="p-6 max-w-6xl mx-auto">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-neutral-800">
              FY2026 Consolidated Operating Expenses & Infrastructure Forecast
            </h2>
            <p className="text-xs text-neutral-500">
              Department 440 • Currency: USD • Consolidated Ledger
            </p>
          </div>

          <div className="border border-neutral-300 rounded-lg overflow-x-auto shadow-xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-neutral-100 text-neutral-800 border-b border-neutral-300 font-semibold">
                  <th className="p-2.5 border-r border-neutral-300">Account Code</th>
                  <th className="p-2.5 border-r border-neutral-300">Category</th>
                  <th className="p-2.5 border-r border-neutral-300">Q1 Actual</th>
                  <th className="p-2.5 border-r border-neutral-300">Q2 Actual</th>
                  <th className="p-2.5 border-r border-neutral-300">Q3 Forecast</th>
                  <th className="p-2.5 border-r border-neutral-300">Q4 Projection</th>
                  <th className="p-2.5">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {[
                  { code: '6010-01', cat: 'Cloud Compute (K8s Clusters)', q1: '$42,500', q2: '$44,120', q3: '$45,000', q4: '$46,200', var: '+2.4%' },
                  { code: '6010-02', cat: 'Database Replicas & Storage', q1: '$18,300', q2: '$19,050', q3: '$19,200', q4: '$19,500', var: '+0.8%' },
                  { code: '6020-05', cat: 'CDN Edge Caching & Egress', q1: '$12,400', q2: '$11,900', q3: '$12,000', q4: '$12,200', var: '-3.2%' },
                  { code: '6030-01', cat: 'Observability & APM Tracing', q1: '$8,950', q2: '$9,200', q3: '$9,200', q4: '$9,500', var: '+1.5%' },
                  { code: '6040-03', cat: 'Third-party Security Audits', q1: '$15,000', q2: '$15,000', q3: '$15,000', q4: '$15,000', var: '0.0%' },
                  { code: '6050-02', cat: 'Software Licenses & Tooling', q1: '$24,100', q2: '$24,300', q3: '$24,500', q4: '$25,000', var: '+1.2%' },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50">
                    <td className="p-2.5 font-mono text-neutral-600 border-r border-neutral-200">{row.code}</td>
                    <td className="p-2.5 font-medium text-neutral-800 border-r border-neutral-200">{row.cat}</td>
                    <td className="p-2.5 font-mono border-r border-neutral-200">{row.q1}</td>
                    <td className="p-2.5 font-mono border-r border-neutral-200">{row.q2}</td>
                    <td className="p-2.5 font-mono border-r border-neutral-200">{row.q3}</td>
                    <td className="p-2.5 font-mono border-r border-neutral-200">{row.q4}</td>
                    <td className="p-2.5 font-mono text-emerald-600 font-semibold">{row.var}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeDecoy === 'wiki' && (
        <div className="max-w-4xl mx-auto py-10 px-6 sm:px-12 text-sm text-neutral-800 space-y-4">
          <div className="border-b border-neutral-300 pb-2">
            <h1 className="text-2xl font-serif text-neutral-900">Distributed consensus algorithms</h1>
            <p className="text-xs text-neutral-500 italic">From Open Knowledge Repository</p>
          </div>
          <p className="leading-relaxed">
            In computer science, <strong>distributed consensus</strong> is the problem of achieving
            overall system reliability in the presence of a number of faulty processes. This often
            requires coordinating processes to agree on some data value that is needed during
            computation. Core protocols include Paxos, Raft, and PBFT (Practical Byzantine Fault
            Tolerance).
          </p>
          <div className="p-4 bg-neutral-50 border-l-4 border-blue-500 rounded-r text-xs leading-relaxed space-y-2">
            <p className="font-semibold text-neutral-900">Core Formal Invariants:</p>
            <ul className="list-disc pl-4 space-y-1 text-neutral-700">
              <li><strong>Agreement:</strong> No two correct nodes decide on different values.</li>
              <li><strong>Validity:</strong> If all correct nodes propose value <em>v</em>, any correct node must decide <em>v</em>.</li>
              <li><strong>Termination:</strong> Every correct node eventually decides some value.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
export default StealthDecoyModal;
