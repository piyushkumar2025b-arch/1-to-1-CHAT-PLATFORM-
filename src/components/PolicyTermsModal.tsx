import { useState } from 'react';
import {
  ShieldCheck,
  FileText,
  Lock,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Scale,
  X,
  Copy,
  Check,
  Download,
  ExternalLink,
} from 'lucide-react';

interface PolicyTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'privacy' | 'terms' | 'compliance';
}

export function PolicyTermsModal({
  isOpen,
  onClose,
  defaultTab = 'privacy',
}: PolicyTermsModalProps) {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'compliance'>(defaultTab);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopySummary = () => {
    const text = `Private Chat - Our Privacy Promise & Terms in Plain English:
• No Accounts or Signups: We don't ask for your phone number, email, or name.
• End-to-End Encrypted: Your messages and photos are encrypted right on your device (using AES-GCM-256). We can never read them.
• Nothing Saved Long-Term: Messages live only while your room is open.
• Instant Deletion: Leaving or clearing a room wipes your messages from our servers immediately.
• Direct Calling: Voice and video calls connect directly between you and your friend via WebRTC.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                <span>Our Privacy Promise & Terms</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-emerald-400 border border-neutral-750">
                  100% Private
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Clear, honest commitments about your privacy and how your chats are protected
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-neutral-800 bg-neutral-950/30 shrink-0 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`pb-2.5 px-2 font-medium flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'privacy'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Privacy Promise</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`pb-2.5 px-2 font-medium flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'terms'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Plain-English Terms</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('compliance')}
            className={`pb-2.5 px-2 font-medium flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'compliance'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>GDPR & Your Rights</span>
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs text-neutral-300 leading-relaxed selection:bg-emerald-500 selection:text-neutral-950">
          {activeTab === 'privacy' && (
            <div className="space-y-5">
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  1. What you say stays between you and your friend
                </h3>
                <p>
                  We built Private Chat on a simple belief: your personal conversations belong to you, not to us, and not to big tech advertisers.
                </p>
                <p>
                  Every message, voice note, photo, and link you send is scrambled right on your device (using military-grade AES-GCM-256 encryption) before it ever travels over the internet.
                </p>
                <p>
                  Because the secret key is created on your device using your Room Code and Password (with 100,000 rounds of PBKDF2/SHA-256), nobody in the middle—not our servers, not internet providers, and not even the engineers who built this app—can read what you write. Only the person who has your room password can unscramble your messages.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-400" />
                  2. When you're done, it's really gone
                </h3>
                <p>
                  Most chat apps store your entire chat history forever on their servers to train AI models or show you targeted ads. We do the exact opposite:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-neutral-400">
                  <li>Your messages only exist while your chat room is open.</li>
                  <li>Whenever you or your friend click "Leave Chat" or "Clear Room", all messages, photos, and files are permanently erased from our database.</li>
                  <li>We never make tape backups, hidden archives, or search logs of what you discussed. Once deleted, it's truly gone forever.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  3. We don't want your personal information
                </h3>
                <p>
                  The best way to protect your personal information is to never collect it in the first place:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                    <span className="font-semibold text-neutral-200 block">No Accounts or Profiles</span>
                    <span className="text-neutral-400">No phone numbers, emails, passwords to remember, or profile pictures required.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                    <span className="font-semibold text-neutral-200 block">No Tracking or Ads</span>
                    <span className="text-neutral-400">Zero advertising cookies, no data brokers, and no tracking scripts following you.</span>
                  </div>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-sky-400" />
                  4. Direct, private voice & video calls
                </h3>
                <p>
                  When you make a voice or video call, your device connects directly to your friend's device (using WebRTC). Your audio and video travel directly between you two over encrypted channels (DTLS-SRTP), never passing through central recording or relay servers.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-5">
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-400" />
                  1. Welcome & How this works
                </h3>
                <p>
                  By creating or joining a room on Private Chat, you agree to these straightforward terms. We designed them to be simple and easy to understand. If something here doesn't work for you, please don't use the app.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  2. Be respectful (The Golden Rules)
                </h3>
                <p>
                  This space is built for honest, private conversations—between friends, loved ones, colleagues, journalists, and teams. We ask that everyone treats each other with respect. You agree not to use Private Chat to:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-neutral-400">
                  <li>Break any laws or commit fraud.</li>
                  <li>Send malware, viruses, or phishing scams.</li>
                  <li>Harass, threaten, stalk, or violate someone's personal boundaries.</li>
                  <li>Share illegal, abusive, or non-consensual content (we have zero tolerance for child exploitation or abuse and will immediately ban offending sessions).</li>
                  <li>Run automated bots or scripts to spam rooms or disrupt the service.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  3. You're in charge of your Room Password
                </h3>
                <p>
                  Because this app is truly private and zero-knowledge, we don't store your passwords and we can't reset them for you. You and your friend are the only keepers of your Room Code and Password.
                </p>
                <p className="text-neutral-400">
                  We recommend picking a good passphrase and only sharing it with someone you trust. We have built-in cooldowns to stop automated guessing, but a strong password is your best protection!
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  4. Common sense & software disclaimer
                </h3>
                <p>
                  We provide Private Chat free of charge and do our very best to make it fast, secure, and reliable. However, the software is provided "as is" without formal guarantees or warranties. We cannot be held liable if someone guesses an easy password you chose, or for temporary internet connectivity issues beyond our control.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="space-y-5">
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  How we protect your rights (GDPR & CCPA)
                </h3>
                <p>
                  Global privacy laws like the European Union's GDPR and California's CCPA were created to give you full control over your personal data. Here is how Private Chat doesn't just meet those standards—it goes beyond them by design:
                </p>
                <div className="space-y-3 pt-2">
                  <div className="p-3.5 bg-neutral-950/60 border border-neutral-800 rounded-xl space-y-1">
                    <span className="font-semibold text-emerald-400 text-xs">Right to be Forgotten (GDPR Article 17)</span>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      You shouldn't have to submit a ticket or wait 30 days to have your information deleted. With Private Chat, simply clicking "Clear Room" or leaving immediately deletes your messages and attachments from the database.
                    </p>
                  </div>

                  <div className="p-3.5 bg-neutral-950/60 border border-neutral-800 rounded-xl space-y-1">
                    <span className="font-semibold text-emerald-400 text-xs">Data Minimization (GDPR Article 5)</span>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      The cleanest data is data that never gets collected. We do not store user profiles, device histories, contact lists, or behavioral telemetry.
                    </p>
                  </div>

                  <div className="p-3.5 bg-neutral-950/60 border border-neutral-800 rounded-xl space-y-1">
                    <span className="font-semibold text-emerald-400 text-xs">We Never Sell Your Data (CCPA)</span>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      We never sell, rent, monetize, or trade any personal data to advertisers, data brokers, or third parties under any circumstances.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-neutral-800 bg-neutral-950/80 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <button
            type="button"
            onClick={handleCopySummary}
            className="text-neutral-400 hover:text-neutral-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Plain Summary Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Summary</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold transition-colors cursor-pointer text-xs"
            >
              Got it, looks great!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
