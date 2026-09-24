import React, { useState } from 'react';
import { Copy, Check, ArrowUpRight, Code2, Terminal, EyeOff } from 'lucide-react';
import { parseTextWithUrls, extractUrlsFromText } from '../lib/link-utils';
import { LinkPreviewCard } from './LinkPreviewCard';
import { highlightCode, TOKEN_COLOR_CLASSES } from '../lib/syntax-highlighter';
import { EncryptedMessageCapsule } from './EncryptedMessageCapsule';
import { CountdownTimerCard } from './CountdownTimerCard';
import { BurnOnReadCapsule } from './BurnOnReadCapsule';
import { ChecklistCard } from './ChecklistCard';
import { ChoicePickerCard } from './ChoicePickerCard';
import { ShreddedFileReceiptCard } from './ShreddedFileReceiptCard';
import { TimeLockCapsule } from './TimeLockCapsule';
import { ConfidentialVeilCard } from './ConfidentialVeilCard';
import { hasSteganography } from '../lib/steganography';
import { ShamirShareCard } from './ShamirShareCard';
import { MarkdownTableCard, parseTableFromText } from './MarkdownTableCard';
import { ScratchRevealImageCard, parseScratchImage } from './ScratchRevealImageCard';
import { DeadMansSwitchCard } from './DeadMansSwitchCard';
import { OneTimePadCard } from './OneTimePadCard';
import { AudioSteganographyCard } from './AudioSteganographyCard';

interface MessageContentRendererProps {
  text: string;
  isMe: boolean;
  myUserId?: string;
  accentColor?: string;
  onOpenCodeInSandbox?: (code: string, language?: string) => void;
  onInspectSteganography?: (text: string) => void;
  onOpenReconstructor?: (shareToken: string) => void;
  onOpenLightbox?: (src: string) => void;
}

// Regex to test if string contains solely 1 to 4 emoji characters and whitespace
const ONLY_EMOJI_REGEX = /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\s)+$/u;

interface CodeBlockPart {
  type: 'code_block';
  language: string;
  code: string;
}

interface TextPart {
  type: 'text';
  content: string;
}

type ParsedPart = CodeBlockPart | TextPart;

function splitByCodeBlocks(raw: string): ParsedPart[] {
  const parts: ParsedPart[] = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(raw)) !== null) {
    const matchStart = match.index;
    const lang = match[1]?.trim() || '';
    const code = match[2] || '';

    if (matchStart > lastIndex) {
      parts.push({
        type: 'text',
        content: raw.substring(lastIndex, matchStart),
      });
    }

    parts.push({
      type: 'code_block',
      language: lang || 'code',
      code: code.replace(/\n$/, ''),
    });

    lastIndex = matchStart + match[0].length;
  }

  if (lastIndex < raw.length) {
    parts.push({
      type: 'text',
      content: raw.substring(lastIndex),
    });
  }

  return parts;
}

const CodeBlockView: React.FC<{
  language: string;
  code: string;
  onOpenInSandbox?: (code: string, language: string) => void;
}> = ({ language, code, onOpenInSandbox }) => {
  const [copied, setCopied] = useState(false);
  const highlightedLines = highlightCode(code, language);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="my-2 rounded-xl border border-white/15 bg-neutral-950/90 overflow-hidden shadow-md text-xs font-mono">
      <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900/90 border-b border-white/10 text-[11px] text-neutral-400">
        <div className="flex items-center gap-1.5">
          <Code2 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold uppercase tracking-wider text-[10px] text-neutral-300">
            {language}
          </span>
          <span className="text-[10px] text-neutral-500 font-mono">
            ({highlightedLines.length} {highlightedLines.length === 1 ? 'line' : 'lines'})
          </span>
        </div>

        <div className="flex items-center gap-1">
          {onOpenInSandbox && (
            <button
              type="button"
              onClick={() => onOpenInSandbox(code, language)}
              className="flex items-center gap-1 text-[11px] hover:text-cyan-300 transition-colors cursor-pointer py-0.5 px-2 rounded hover:bg-white/10 text-neutral-400"
              title="Open and test in Code Snippet Sandbox"
            >
              <Terminal className="w-3 h-3 text-cyan-400" />
              <span>Sandbox</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] hover:text-white transition-colors cursor-pointer py-0.5 px-2 rounded hover:bg-white/10 text-neutral-400"
            title="Copy code snippet"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-3 overflow-x-auto max-h-80 scrollbar-thin text-neutral-200 leading-relaxed font-mono select-text bg-black/40">
        <div className="space-y-0.5 text-xs">
          {highlightedLines.map((line) => (
            <div key={line.lineNumber} className="flex gap-3">
              <span className="w-6 text-neutral-600 select-none text-right shrink-0">
                {line.lineNumber}
              </span>
              <span className="flex-1 whitespace-pre">
                {line.tokens.length === 0 ? (
                  '\u00A0'
                ) : (
                  line.tokens.map((token, tIdx) => (
                    <span key={tIdx} className={TOKEN_COLOR_CLASSES[token.type]}>
                      {token.value}
                    </span>
                  ))
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SpoilerText: React.FC<{ content: string }> = ({ content }) => {
  const [revealed, setRevealed] = useState(false);

  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        setRevealed((prev) => !prev);
      }}
      title={revealed ? 'Click to obscure spoiler' : 'Spoiler: click to reveal'}
      className={`inline-block px-1.5 py-0.2 rounded cursor-pointer transition-all duration-200 select-none ${
        revealed
          ? 'bg-neutral-800/80 text-inherit border border-neutral-700/50'
          : 'bg-neutral-800 text-neutral-800 blur-[4px] hover:blur-[2px] hover:bg-neutral-700 select-none border border-neutral-700/40'
      }`}
    >
      {content}
    </span>
  );
};

function renderFormattedInlineText(content: string): React.ReactNode[] {
  // Regex to match ||spoiler||, `code`, **bold**, *italic*, ~strikethrough~
  const inlineRegex = /(\|\|[\s\S]+?\|\||`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|~[^~]+~)/g;
  const parts = content.split(inlineRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith('||') && part.endsWith('||') && part.length >= 4) {
      const inner = part.slice(2, -2);
      return <SpoilerText key={index} content={inner} />;
    }

    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-black/40 text-amber-300 font-mono text-[11px] border border-white/10"
        >
          {inner}
        </code>
      );
    }

    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const inner = part.slice(2, -2);
      return (
        <strong key={index} className="font-semibold text-inherit">
          {inner}
        </strong>
      );
    }

    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <em key={index} className="italic text-inherit">
          {inner}
        </em>
      );
    }

    if (part.startsWith('~') && part.endsWith('~') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <del key={index} className="line-through opacity-75 text-inherit">
          {inner}
        </del>
      );
    }

    return <span key={index}>{part}</span>;
  });
}

export function MessageContentRenderer({
  text,
  isMe,
  myUserId,
  accentColor,
  onOpenCodeInSandbox,
  onInspectSteganography,
  onOpenReconstructor,
  onOpenLightbox,
}: MessageContentRendererProps) {
  // Check if message is solely emojis (1 to 4 emoji characters)
  const trimmed = text.trim();

  // Check for Dead Man's Switch: DEADMAN::...
  if (trimmed.startsWith('DEADMAN::')) {
    return (
      <DeadMansSwitchCard
        payload={trimmed}
        isMe={isMe}
        myUserId={myUserId}
        accentColor={accentColor}
      />
    );
  }

  // Check for One-Time Pad cipher: OTP_CIPHER::...
  if (trimmed.startsWith('OTP_CIPHER::')) {
    return (
      <OneTimePadCard
        payload={trimmed}
        isMe={isMe}
        accentColor={accentColor}
      />
    );
  }

  // Check for Acoustic Sonar / Ultrasonic chirp: SONAR_CHIRP::...
  if (trimmed.startsWith('SONAR_CHIRP::')) {
    return (
      <AudioSteganographyCard
        payload={trimmed}
        isMe={isMe}
        accentColor={accentColor}
      />
    );
  }

  // Check for Shamir Secret Share token: SHAMIR_SHARE::...
  if (trimmed.startsWith('SHAMIR_SHARE::')) {
    return (
      <ShamirShareCard
        payload={trimmed}
        isMe={isMe}
        accentColor={accentColor}
        onOpenReconstructor={onOpenReconstructor}
      />
    );
  }

  // Check for Scratch-to-Reveal image: SCRATCH_IMAGE::...
  const scratchData = parseScratchImage(trimmed);
  if (scratchData) {
    return (
      <ScratchRevealImageCard
        imageSrc={scratchData.imageSrc}
        caption={scratchData.caption}
        isMe={isMe}
        accentColor={accentColor}
        onOpenLightbox={onOpenLightbox}
      />
    );
  }

  // Check for Interactive / Markdown Data Table: TABLE_DATA:: or [TABLE:...] or Markdown
  const tableData = parseTableFromText(trimmed);
  if (tableData) {
    return (
      <MarkdownTableCard
        data={tableData}
        accentColor={accentColor}
        isMe={isMe}
      />
    );
  }

  // Check for Burn-On-Read confidential secret payload
  if (trimmed.startsWith('BURN_SECRET::')) {
    return (
      <BurnOnReadCapsule
        payload={trimmed}
        isMe={isMe}
        accentColor={accentColor}
      />
    );
  }

  // Check for Time-Locked message capsule
  if (trimmed.startsWith('TIMELOCK::')) {
    return (
      <TimeLockCapsule
        payload={trimmed}
        isMe={isMe}
        accentColor={accentColor}
      />
    );
  }

  // Check for Confidential Veil syntax: [VEIL:Label:Secret] or [VEIL:Secret] or VEIL::label::secret
  const veilBracketMatch = trimmed.match(/^🛡️?\s*\[VEIL:(?:([^:]+):)?([^\]]+)\]$/i);
  if (veilBracketMatch) {
    const label = veilBracketMatch[1]?.trim() || 'Confidential Data';
    const content = veilBracketMatch[2]?.trim() || '';
    return (
      <ConfidentialVeilCard
        label={label}
        hiddenContent={content}
        accentColor={accentColor}
      />
    );
  }

  if (trimmed.startsWith('VEIL::')) {
    const parts = trimmed.split('::');
    const label = parts[1] || 'Confidential Veil';
    let content = parts[2] || '';
    try {
      content = decodeURIComponent(escape(atob(content)));
    } catch {
      // raw
    }
    return (
      <ConfidentialVeilCard
        label={label}
        hiddenContent={content}
        accentColor={accentColor}
      />
    );
  }

  // Check for Interactive Checklist syntax: [CHECKLIST:Title:Item1,Item2,Item3]
  const checklistMatch = trimmed.match(/^📋?\s*\[CHECKLIST:([^:]+):([^\]]+)\]$/i);
  if (checklistMatch) {
    const title = checklistMatch[1].trim();
    const items = checklistMatch[2]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return (
      <ChecklistCard
        title={title}
        initialItems={items}
        accentColor={accentColor}
      />
    );
  }

  // Check for Certified File Shred Receipt: 🛡️ [SHREDDED:fileName:fileSize:hash:standard]
  const shredMatch = trimmed.match(/^🛡️?\s*\[SHREDDED:([^:]+):([^:]+):([^:]+):([^\]]+)\]$/i);
  if (shredMatch) {
    return (
      <ShreddedFileReceiptCard
        fileName={shredMatch[1].trim()}
        fileSize={shredMatch[2].trim()}
        originalHash={shredMatch[3].trim()}
        wipeStandard={shredMatch[4].trim()}
        accentColor={accentColor}
      />
    );
  }

  // Check for Choice Decision Picker: [CHOICE:Option1, Option2, Option3] or [CHOICE:Title:Option1, Option2]
  const choiceMatch = trimmed.match(/^(?:🎲\s*)?\[CHOICE:(?:([^:]+):)?([^\]]+)\]$/i);
  if (choiceMatch) {
    const title = choiceMatch[1]?.trim() || 'Decision Picker';
    const options = choiceMatch[2]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (options.length > 0) {
      return (
        <ChoicePickerCard
          title={title}
          options={options}
          accentColor={accentColor}
        />
      );
    }
  }

  // Check for AES-256 encrypted payload
  if (trimmed.startsWith('CIPHER_AES::')) {
    return (
      <EncryptedMessageCapsule
        payload={trimmed}
        isMe={isMe}
        accentColor={accentColor}
      />
    );
  }

  // Check for Countdown Timer syntax: ⏱️ [TIMER:seconds:label] or [TIMER:seconds:label]
  const timerMatch = trimmed.match(/^⏱️?\s*\[TIMER:(\d+)(?::([^\]]*))?\]$/i);
  if (timerMatch) {
    const seconds = parseInt(timerMatch[1], 10);
    const label = timerMatch[2]?.trim() || 'Countdown Timer';
    return (
      <CountdownTimerCard
        totalSeconds={seconds}
        label={label}
        accentColor={accentColor}
      />
    );
  }

  const isOnlyEmojis = trimmed.length <= 16 && ONLY_EMOJI_REGEX.test(trimmed);

  if (isOnlyEmojis) {
    return (
      <div className="text-3xl sm:text-4xl py-1 select-none leading-tight filter drop-shadow-sm transition-transform hover:scale-105 inline-block">
        {trimmed}
      </div>
    );
  }

  const parts = splitByCodeBlocks(text);
  const containsStego = hasSteganography(text);

  return (
    <div className="space-y-2">
      {parts.map((part, pIdx) => {
        if (part.type === 'code_block') {
          return (
            <CodeBlockView
              key={pIdx}
              language={part.language}
              code={part.code}
              onOpenInSandbox={onOpenCodeInSandbox}
            />
          );
        }

        // Split text with inline links and formatting
        const tokens = parseTextWithUrls(part.content);

        return (
          <p key={pIdx} className="leading-relaxed whitespace-pre-wrap select-text">
            {tokens.map((token, tIdx) => {
              if (token.type === 'url') {
                return (
                  <a
                    key={tIdx}
                    href={token.content}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-amber-300 hover:text-amber-200 underline underline-offset-2 break-all inline-flex items-center gap-0.5 font-medium transition-colors"
                  >
                    <span>{token.content}</span>
                    <ArrowUpRight className="w-3 h-3 inline-block shrink-0" />
                  </a>
                );
              }
              return <React.Fragment key={tIdx}>{renderFormattedInlineText(token.content)}</React.Fragment>;
            })}
          </p>
        );
      })}

      {/* Steganography Invisible Secret Detected Badge */}
      {containsStego && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => onInspectSteganography?.(text)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50 hover:border-cyan-400 text-[11px] font-mono transition-all cursor-pointer shadow-xs active:scale-95"
            title="A hidden message encoded with zero-width Unicode steganography was detected in this message"
          >
            <EyeOff className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="font-semibold">🕵️ Steganography Payload Detected</span>
            <span className="underline ml-0.5 text-cyan-200 font-sans">Extract Secret</span>
          </button>
        </div>
      )}

      {/* Extracted Interactive Link Cards */}
      {(() => {
        const links = extractUrlsFromText(text);
        if (links.length === 0) return null;
        return (
          <div className="pt-1 space-y-1.5">
            {links.slice(0, 2).map((link, lIdx) => (
              <LinkPreviewCard
                key={lIdx}
                link={link}
                isMe={isMe}
                accentColor={accentColor}
              />
            ))}
          </div>
        );
      })()}
    </div>
  );
}
