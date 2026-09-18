import React from 'react';
import {
  ArrowDown,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface MetaComparisonSectionProps {
  onScrollToGroupForm?: () => void;
  mode?: 'light' | 'dark';
}

export function MetaComparisonSection({
  onScrollToGroupForm,
  mode = 'light',
}: MetaComparisonSectionProps) {
  const isLight = mode === 'light';

  const comparisonData = [
    {
      topic: 'Account & Identity',
      meta: 'Requires a verified phone number, email address, legal name, and requests access to your contacts.',
      privateChat: 'No account, phone number, or email required. You simply join with a shared room code and password.',
    },
    {
      topic: 'Message Retention & History',
      meta: 'Messages, media, and deleted chats remain stored on corporate servers and backup archives.',
      privateChat: 'One-click room burning permanently purges active messages. Nothing is archived or retained.',
    },
    {
      topic: 'Advertising & Data Collection',
      meta: 'Monitors keywords, topics, and behavioral signals to construct targeted advertising profiles.',
      privateChat: '100% ad-free with zero analytics, tracking cookies, or commercial profiling.',
    },
    {
      topic: 'Social Graph & Contacts',
      meta: 'Tracks who you speak with, how frequently you interact, and who is in your social circles.',
      privateChat: 'No social graph. The platform has no record of who is communicating or how people are connected.',
    },
    {
      topic: 'Audio, Video & File Sharing',
      meta: 'Calls are routed and logged through company relays; files and photos are compressed and scanned.',
      privateChat: 'Direct peer-to-peer WebRTC video and audio calls, with document and file sharing up to 50MB.',
    },
    {
      topic: 'Interface & Distractions',
      meta: 'Filled with algorithmic feeds, suggested content, sponsored stories, and engagement notifications.',
      privateChat: 'A quiet, focused communication space for two people. Zero feeds, zero notifications spam.',
    },
  ];

  return (
    <section
      id="comparison-section"
      className={`w-full py-16 lg:py-20 px-4 sm:px-6 lg:px-8 border-t relative z-10 transition-colors ${
        isLight
          ? 'border-slate-200 bg-white/80'
          : 'border-neutral-850 bg-neutral-950/80'
      }`}
    >
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="max-w-3xl space-y-3 text-left">
          <h2
            className={`text-2xl sm:text-3xl font-bold tracking-tight ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            Why we built this differently from Instagram & Facebook
          </h2>
          <p
            className={`text-sm sm:text-base leading-relaxed ${
              isLight ? 'text-slate-700' : 'text-neutral-300'
            }`}
          >
            Mainstream social networks are built around advertising, data mining, and continuous user tracking.
            Private Chat is designed for a completely different purpose: letting two people speak in private without a corporation watching or saving the record.
          </p>
        </div>

        {/* Professional Editorial Comparison Table */}
        <div
          className={`border rounded-2xl overflow-hidden shadow-xs transition-colors ${
            isLight
              ? 'border-slate-200 bg-white'
              : 'border-neutral-800 bg-neutral-900/60'
          }`}
        >
          {/* Table Header */}
          <div
            className={`hidden md:grid grid-cols-12 px-6 py-4 border-b text-xs font-bold tracking-wider ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-600'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400'
            }`}
          >
            <div className="col-span-3">CRITERIA</div>
            <div
              className={`col-span-4 flex items-center gap-1.5 font-bold ${
                isLight ? 'text-rose-700' : 'text-rose-400/90'
              }`}
            >
              <XCircle className={`w-4 h-4 ${isLight ? 'text-rose-600' : 'text-rose-400'}`} />
              <span>INSTAGRAM & FACEBOOK (META)</span>
            </div>
            <div
              className={`col-span-5 flex items-center gap-1.5 font-bold ${
                isLight ? 'text-emerald-700' : 'text-emerald-400'
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
              <span>PRIVATE CHAT</span>
            </div>
          </div>

          {/* Table Rows */}
          <div className={`divide-y ${isLight ? 'divide-slate-200/80' : 'divide-neutral-800/70'}`}>
            {comparisonData.map((row, idx) => (
              <div
                key={idx}
                className={`p-5 sm:px-6 sm:py-5 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-6 items-start transition-colors ${
                  isLight ? 'hover:bg-slate-50/80' : 'hover:bg-neutral-850/30'
                }`}
              >
                {/* Criteria */}
                <div className="md:col-span-3">
                  <span className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-neutral-200'}`}>
                    {row.topic}
                  </span>
                </div>

                {/* Instagram / Facebook */}
                <div className="md:col-span-4 space-y-1">
                  <div
                    className={`md:hidden flex items-center gap-1.5 text-xs font-semibold mb-0.5 ${
                      isLight ? 'text-rose-700' : 'text-rose-400'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Instagram / Facebook</span>
                  </div>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-neutral-400'}`}>
                    {row.meta}
                  </p>
                </div>

                {/* Private Chat */}
                <div className="md:col-span-5 space-y-1">
                  <div
                    className={`md:hidden flex items-center gap-1.5 text-xs font-semibold mb-0.5 ${
                      isLight ? 'text-emerald-700' : 'text-emerald-400'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Private Chat</span>
                  </div>
                  <p className={`text-xs sm:text-sm leading-relaxed font-medium ${isLight ? 'text-slate-900' : 'text-neutral-200'}`}>
                    {row.privateChat}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transition prompt to Group Room Request */}
        {onScrollToGroupForm && (
          <div
            className={`border rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 transition-colors ${
              isLight
                ? 'border-slate-200 bg-slate-50 shadow-xs'
                : 'border-neutral-800 bg-neutral-900/40'
            }`}
          >
            <div className="space-y-1">
              <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Looking for rooms for more than 2 people?
              </h3>
              <p className={`text-xs sm:text-sm max-w-2xl leading-relaxed ${isLight ? 'text-slate-600' : 'text-neutral-400'}`}>
                Rooms are limited to two participants right now to keep conversations confidential. However, group rooms will be created if requested. Tell us what your group needs.
              </p>
            </div>
            <button
              type="button"
              onClick={onScrollToGroupForm}
              className={`shrink-0 font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-2 ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border border-slate-300 hover:border-emerald-600 text-slate-800 shadow-xs'
                  : 'bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 hover:border-emerald-500/50 text-neutral-200 hover:text-white'
              }`}
            >
              <span>Request group rooms</span>
              <ArrowDown className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
