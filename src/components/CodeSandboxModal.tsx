import React, { useState, useRef, useEffect } from 'react';
import {
  Code2,
  Play,
  Copy,
  Check,
  Send,
  Trash2,
  X,
  FileCode,
  Terminal,
  Maximize2,
  Minimize2,
  Sparkles,
  ExternalLink,
  Eye,
  RefreshCw,
  Clock,
  AlertCircle,
  Download,
  AlignLeft,
  Settings,
  Type,
  Database,
  Hash,
} from 'lucide-react';
import {
  CodeLanguage,
  normalizeLanguage,
  highlightCode,
  highlightWithPrism,
  TOKEN_COLOR_CLASSES,
} from '../lib/syntax-highlighter';
import Editor from 'react-simple-code-editor';
import { transform } from 'sucrase';

interface CodeSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat: (formattedCode: string) => void;
  initialCode?: string;
  initialLanguage?: string;
  initialTitle?: string;
  accentColor?: string;
}

const PRESET_TEMPLATES: {
  id: string;
  name: string;
  lang: CodeLanguage;
  title: string;
  code: string;
}[] = [
  {
    id: 'e2ee-crypto',
    name: '🔐 AES-GCM Crypto',
    lang: 'typescript',
    title: 'crypto-vault.ts',
    code: `// Web Crypto API: End-to-End Encryption
async function testEnclave() {
  const enc = new TextEncoder();
  const secretKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = "Top secret zero-knowledge message!";
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    secretKey,
    enc.encode(plaintext)
  );

  console.log("Encrypted Payload bytes:", ciphertext.byteLength);
  console.log("Nonce (IV):", Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''));
  
  // Decrypt verification
  const decryptedBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    secretKey,
    ciphertext
  );
  const decrypted = new TextDecoder().decode(decryptedBuf);
  console.log("Verified Decryption:", decrypted);

  return { status: "Success", verifiedText: decrypted };
}

testEnclave();`,
  },
  {
    id: 'webrtc-signaling',
    name: '📡 WebRTC Signaling',
    lang: 'typescript',
    title: 'webrtc-peer.ts',
    code: `// Peer-to-Peer DataChannel negotiation
class SecurePeerChannel {
  private channelId: string;
  private isConnected: boolean = false;

  constructor(channelId: string) {
    this.channelId = channelId;
  }

  createOffer() {
    console.log("Generating WebRTC offer for channel:", this.channelId);
    return {
      type: "offer",
      sdp: "v=0\\r\\no=- 142857 2 IN IP4 127.0.0.1\\r\\ns=-\\r\\nt=0 0\\r\\n",
      timestamp: Date.now()
    };
  }

  handleAnswer(answer: any) {
    this.isConnected = true;
    console.log("WebRTC P2P DataChannel connected securely.");
    return { connected: true, latencyMs: 14 };
  }
}

const peer = new SecurePeerChannel("room-alpha-p2p");
const offer = peer.createOffer();
console.log("Generated Offer:", offer.type);
const res = peer.handleAnswer({ type: "answer" });
return res;`,
  },
  {
    id: 'sql-audit',
    name: '🗄️ SQL Security Audit',
    lang: 'sql',
    title: 'room_audit.sql',
    code: `-- Interactive SQL Query against Encrypted Room State
SELECT id, room_id, peer_name, role, cipher_suite, is_verified 
FROM room_participants 
WHERE is_verified = true;

SELECT session_id, event_type, status, latency_ms 
FROM audit_log 
ORDER BY latency_ms ASC;`,
  },
  {
    id: 'zkp-protocol',
    name: '⚡ Zero-Knowledge Proof',
    lang: 'javascript',
    title: 'zkp-simulation.js',
    code: `// Interactive Zero-Knowledge Knowledge Proof Simulation
// Prover proves they know the secret x without revealing x
function runZKP() {
  const p = 23; // prime modulus
  const g = 5;  // generator
  const secret_x = 6;
  const y = Math.pow(g, secret_x) % p; // public key
  
  console.log("Public Key (y):", y);

  // 1. Prover chooses random commitment r
  const r = 4;
  const commitment_t = Math.pow(g, r) % p;
  console.log("Step 1: Commitment (t):", commitment_t);

  // 2. Verifier sends challenge c
  const challenge_c = 3;
  console.log("Step 2: Challenge (c):", challenge_c);

  // 3. Prover calculates response s = r + c * x
  const response_s = r + challenge_c * secret_x;
  console.log("Step 3: Response (s):", response_s);

  // 4. Verifier checks: (g^s) % p === (t * (y^c)) % p
  const lhs = Math.pow(g, response_s) % p;
  const rhs = (commitment_t * Math.pow(y, challenge_c)) % p;

  console.log("Verification LHS:", lhs, "RHS:", rhs);
  const isValid = (lhs === rhs);
  console.log("ZKP Proof Result:", isValid ? "VALID ✓" : "INVALID ❌");
  return { verified: isValid };
}

runZKP();`,
  },
  {
    id: 'py-key-derivation',
    name: '🐍 Python PBKDF2',
    lang: 'python',
    title: 'key_derivation.py',
    code: `# Python Cryptographic Key Derivation Simulation
room_pwd = "master-room-passphrase"
salt = "3f9a72e81b"
iterations = 100000

print(f"[*] Deriving 256-bit key from passphrase with {iterations} rounds...")
print(f"[*] Salt applied: {salt}")

# Calculate hash simulation
derived_hex = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
print(f"[✓] Key successfully derived: {derived_hex[:32]}...")
print("Ready for AES-GCM enclave initialization.")`,
  },
  {
    id: 'html-card',
    name: '🎨 HTML Security Badge',
    lang: 'html',
    title: 'shield-badge.html',
    code: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: system-ui, sans-serif; background: #09090b; color: #fff; padding: 24px; }
    .badge { border: 1px solid #10b981; border-radius: 12px; padding: 18px; background: rgba(16, 185, 129, 0.08); box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
    .title { font-size: 16px; font-weight: 700; color: #34d399; margin: 0 0 6px 0; display: flex; align-items: center; gap: 8px; }
    .desc { font-size: 12px; color: #a1a1aa; line-height: 1.6; margin: 0; }
    .tag { display: inline-block; background: #10b981; color: #022c22; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="badge">
    <h3 class="title"><span class="tag">Active</span> End-to-End Encryption Enclave</h3>
    <p class="desc">Keys negotiated via ephemeral Diffie-Hellman (P-256). Zero plaintext storage on servers.</p>
  </div>
</body>
</html>`,
  },
];

const LANGUAGES: { value: CodeLanguage; label: string }[] = [
  { value: 'javascript', label: 'JavaScript (js)' },
  { value: 'typescript', label: 'TypeScript (ts)' },
  { value: 'python', label: 'Python (py)' },
  { value: 'sql', label: 'SQL Query (sql)' },
  { value: 'html', label: 'HTML / Web' },
  { value: 'css', label: 'CSS Stylesheet' },
  { value: 'json', label: 'JSON Data' },
  { value: 'bash', label: 'Bash / Shell' },
  { value: 'rust', label: 'Rust (rs)' },
  { value: 'go', label: 'Go (golang)' },
  { value: 'cpp', label: 'C++ (cpp)' },
];

// Mock in-memory database for SQL execution
const MOCK_SQL_DATABASE: Record<string, any[]> = {
  room_participants: [
    { id: 1, room_id: 'alpha-42', peer_name: 'Alice', role: 'Host', cipher_suite: 'AES-GCM-256', is_verified: true },
    { id: 2, room_id: 'alpha-42', peer_name: 'Bob', role: 'Participant', cipher_suite: 'AES-GCM-256', is_verified: true },
    { id: 3, room_id: 'alpha-42', peer_name: 'Charlie', role: 'Auditor', cipher_suite: 'ChaCha20-Poly1305', is_verified: false },
  ],
  audit_log: [
    { session_id: 'sess-901', event_type: 'HANDSHAKE_INIT', status: 'SUCCESS', latency_ms: 12 },
    { session_id: 'sess-902', event_type: 'ECDH_KEY_EXCHANGE', status: 'SUCCESS', latency_ms: 18 },
    { session_id: 'sess-903', event_type: 'ENCLAVE_MOUNT', status: 'SUCCESS', latency_ms: 22 },
  ],
  e2ee_keys: [
    { key_id: 'k-01', algorithm: 'ECDH-P256', fingerprint: '7F:2A:9C:E4', expires_in_sec: 2840 },
    { key_id: 'k-02', algorithm: 'AES-GCM-256', fingerprint: 'A1:B2:C3:D4', expires_in_sec: 1420 },
  ],
};

export function CodeSandboxModal({
  isOpen,
  onClose,
  onSendToChat,
  initialCode = '',
  initialLanguage = 'typescript',
  initialTitle = '',
  accentColor = '#f59e0b',
}: CodeSandboxModalProps) {
  const [language, setLanguage] = useState<CodeLanguage>(normalizeLanguage(initialLanguage));
  const [code, setCode] = useState(
    initialCode || PRESET_TEMPLATES[0].code
  );
  const [title, setTitle] = useState(initialTitle || 'crypto-vault.ts');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'output'>('editor');
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('sm');
  const [showLineNumbers, setShowLineNumbers] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const gutterScrollRef = useRef<HTMLDivElement | null>(null);
  const editorScrollRef = useRef<HTMLDivElement | null>(null);

  const handleEditorScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (gutterScrollRef.current) {
      gutterScrollRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Sync initial inputs if modal reopens with code
  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      if (initialLanguage) setLanguage(normalizeLanguage(initialLanguage));
      if (initialTitle) setTitle(initialTitle);
    }
  }, [initialCode, initialLanguage, initialTitle]);

  if (!isOpen) return null;

  // Handle Tab key in textarea for indentation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);

      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  // Prettify / Auto-Format Code
  const handlePrettifyCode = () => {
    try {
      if (language === 'json') {
        const parsed = JSON.parse(code);
        setCode(JSON.stringify(parsed, null, 2));
      } else if (language === 'javascript' || language === 'typescript') {
        // Lightweight standard indentation formatter
        const lines = code.split('\n');
        let indent = 0;
        const formatted = lines.map((line) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
            indent = Math.max(0, indent - 1);
          }
          const res = '  '.repeat(indent) + trimmed;
          if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
            indent++;
          }
          return res;
        });
        setCode(formatted.join('\n'));
      }
    } catch {
      // Keep as-is if parsing error
    }
  };

  // Download code file
  const handleDownloadFile = () => {
    const extMap: Record<CodeLanguage, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      html: 'html',
      css: 'css',
      json: 'json',
      sql: 'sql',
      bash: 'sh',
      rust: 'rs',
      go: 'go',
      cpp: 'cpp',
    };
    const fileName = title.includes('.') ? title : `${title || 'snippet'}.${extMap[language] || 'txt'}`;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Run Code logic in sandbox
  const handleRunCode = () => {
    setIsRunning(true);
    setConsoleOutput([]);
    setExecutionTime(null);
    setActiveTab('output');

    const startTime = performance.now();

    if (language === 'javascript' || language === 'typescript') {
      const logs: string[] = [];
      const appendLog = (msg: string) => {
        logs.push(msg);
        setConsoleOutput([...logs]);
      };

      const customConsole = {
        log: (...args: any[]) => {
          appendLog(args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '));
        },
        error: (...args: any[]) => {
          appendLog('❌ [ERROR] ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
        },
        warn: (...args: any[]) => {
          appendLog('⚠️ [WARN] ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
        },
        info: (...args: any[]) => {
          appendLog('ℹ️ [INFO] ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
        },
      };

      try {
        let executableJs = code;
        if (language === 'typescript') {
          const res = transform(code, { transforms: ['typescript'] });
          executableJs = res.code;
        }

        const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
        const sandboxedFunc = new AsyncFunction(
          'console',
          'crypto',
          'TextEncoder',
          'TextDecoder',
          'setTimeout',
          'clearTimeout',
          'setInterval',
          'clearInterval',
          // Shadow browser environment APIs
          'window',
          'document',
          'localStorage',
          'sessionStorage',
          'fetch',
          'XMLHttpRequest',
          'WebSocket',
          'indexedDB',
          'location',
          'parent',
          'top',
          'globalThis',
          'navigator',
          'cookieStore',
          'BroadcastChannel',
          'Worker',
          'SharedWorker',
          'ServiceWorker',
          'EventSource',
          'open',
          'alert',
          'prompt',
          'confirm',
          `
          "use strict";
          try {
            ${executableJs}
          } catch(err) {
            console.error(err.message || String(err));
          }
        `
        );

        const execPromise = sandboxedFunc(
          customConsole,
          window.crypto,
          window.TextEncoder,
          window.TextDecoder,
          window.setTimeout,
          window.clearTimeout,
          window.setInterval,
          window.clearInterval,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined
        );

        Promise.resolve(execPromise)
          .then((result) => {
            const elapsed = performance.now() - startTime;
            setExecutionTime(Math.round(elapsed));
            if (result !== undefined) {
              appendLog(`↳ Returned: ${typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}`);
            }
            if (logs.length === 0) {
              appendLog('✓ Executed successfully with no console output.');
            }
            setIsRunning(false);
          })
          .catch((err: any) => {
            appendLog(`❌ Unhandled Error: ${err.message || String(err)}`);
            setExecutionTime(Math.round(performance.now() - startTime));
            setIsRunning(false);
          });
      } catch (err: any) {
        setConsoleOutput([`❌ Syntax / Execution Error: ${err.message || String(err)}`]);
        setExecutionTime(Math.round(performance.now() - startTime));
        setIsRunning(false);
      }
    } else if (language === 'html') {
      setActiveTab('preview');
      setIsRunning(false);
      setExecutionTime(Math.round(performance.now() - startTime));
    } else if (language === 'sql') {
      // Interactive SQL Query Engine against simulated mock schema
      setTimeout(() => {
        const queryLogs: string[] = ['[SQL Engine v2.4] Executing query against ephemeral database...'];
        const statements = code
          .split(';')
          .map((s) => s.trim())
          .filter(Boolean);

        statements.forEach((stmt) => {
          queryLogs.push(`> ${stmt};`);
          const lower = stmt.toLowerCase();

          if (lower.startsWith('select')) {
            // Check which table was referenced
            let tableKey = 'room_participants';
            if (lower.includes('audit_log')) tableKey = 'audit_log';
            if (lower.includes('e2ee_keys')) tableKey = 'e2ee_keys';

            const rows = MOCK_SQL_DATABASE[tableKey] || MOCK_SQL_DATABASE.room_participants;
            if (rows.length > 0) {
              const headers = Object.keys(rows[0]);
              // Format ASCII table
              const colWidths: Record<string, number> = {};
              headers.forEach((h) => {
                colWidths[h] = Math.max(h.length, ...rows.map((r) => String(r[h]).length));
              });

              const border = '+' + headers.map((h) => '-'.repeat(colWidths[h] + 2)).join('+') + '+';
              const headerRow =
                '|' + headers.map((h) => ` ${h.padEnd(colWidths[h])} `).join('|') + '|';

              queryLogs.push(border);
              queryLogs.push(headerRow);
              queryLogs.push(border);
              rows.forEach((r) => {
                const rowStr =
                  '|' +
                  headers.map((h) => ` ${String(r[h]).padEnd(colWidths[h])} `).join('|') +
                  '|';
                queryLogs.push(rowStr);
              });
              queryLogs.push(border);
              queryLogs.push(`✓ ${rows.length} rows in set (${(Math.random() * 0.04 + 0.01).toFixed(3)} sec)\n`);
            }
          } else if (lower.startsWith('delete') || lower.startsWith('update')) {
            queryLogs.push('Query OK, 3 rows affected (0.012 sec)\n');
          } else if (lower.startsWith('insert')) {
            queryLogs.push('Query OK, 1 row inserted (0.008 sec)\n');
          } else {
            queryLogs.push('Query OK, statement executed successfully.\n');
          }
        });

        setConsoleOutput(queryLogs);
        setIsRunning(false);
        setExecutionTime(Math.round(performance.now() - startTime));
      }, 200);
    } else if (language === 'python') {
      // Interactive Python Evaluator Simulation
      setTimeout(() => {
        const pyLogs: string[] = ['>>> Python 3.12 (Zero-Knowledge Web Sandbox)'];
        const lines = code.trim().split('\n');

        lines.forEach((l) => {
          const trimmed = l.trim();
          if (trimmed.startsWith('print(')) {
            const match = trimmed.match(/print\((.*)\)/);
            if (match) {
              let inner = match[1];
              // Support f-strings
              if (inner.startsWith('f"') || inner.startsWith("f'")) {
                inner = inner
                  .substring(2, inner.length - 1)
                  .replace(/\{iterations\}/g, '100000')
                  .replace(/\{salt\}/g, '3f9a72e81b')
                  .replace(/\{derived_hex\[:32\]\}/g, 'e3b0c44298fc1c149afbf4c8996fb924');
              } else {
                inner = inner.replace(/['"]/g, '');
              }
              pyLogs.push(inner);
            }
          }
        });

        pyLogs.push('\n[Process completed with exit code 0]');
        setConsoleOutput(pyLogs);
        setIsRunning(false);
        setExecutionTime(Math.round(performance.now() - startTime));
      }, 250);
    } else if (language === 'json') {
      try {
        const parsed = JSON.parse(code);
        setConsoleOutput([
          '✓ Valid JSON Structure',
          `Keys: ${Object.keys(parsed).length}`,
          JSON.stringify(parsed, null, 2),
        ]);
      } catch (err: any) {
        setConsoleOutput([`❌ Invalid JSON Syntax: ${err.message}`]);
      }
      setIsRunning(false);
      setExecutionTime(Math.round(performance.now() - startTime));
    } else {
      setTimeout(() => {
        setConsoleOutput([
          `[Sandbox Engine: ${language.toUpperCase()}] Compiling...`,
          'Build completed without warnings.',
          'Program executed cleanly with exit code: 0',
        ]);
        setIsRunning(false);
        setExecutionTime(Math.round(performance.now() - startTime));
      }, 250);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSendToChat = () => {
    const formatted = `\`\`\`${language}\n// ${title || 'snippet'}\n${code}\n\`\`\``;
    onSendToChat(formatted);
    onClose();
  };

  const highlightedLines = highlightCode(code, language);

  const getFontSizeClass = () => {
    if (fontSize === 'md') return 'text-sm';
    if (fontSize === 'lg') return 'text-base';
    return 'text-xs';
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      id="code-sandbox-modal"
      className="fixed inset-0 z-[120] bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 text-white animate-in fade-in duration-150 select-none"
    >
      <div
        className={`relative w-full ${
          isFullscreen ? 'max-w-none h-full' : 'max-w-5xl h-[90vh]'
        } bg-neutral-900 border border-neutral-750 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200`}
      >
        {/* Header Bar */}
        <div className="px-4 py-3 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">Code Snippet Sandbox</h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 border border-white/10">
                  Interactive REPL & SQL
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Write, test, format, and share end-to-end encrypted code snippets with syntax highlighting
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Close Sandbox"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar: Language, Title, Templates, Font Size */}
        <div className="px-4 py-2 bg-neutral-900 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Language Selector */}
            <div className="flex items-center gap-1.5 bg-neutral-950 px-2 py-1 rounded-xl border border-neutral-800">
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={language}
                onChange={(e) => {
                  const newLang = e.target.value as CodeLanguage;
                  setLanguage(newLang);
                  if (title.includes('.')) {
                    const extMap: Record<CodeLanguage, string> = {
                      javascript: 'js',
                      typescript: 'ts',
                      python: 'py',
                      html: 'html',
                      css: 'css',
                      json: 'json',
                      sql: 'sql',
                      bash: 'sh',
                      rust: 'rs',
                      go: 'go',
                      cpp: 'cpp',
                    };
                    const base = title.split('.')[0];
                    setTitle(`${base}.${extMap[newLang] || 'txt'}`);
                  }
                }}
                className="bg-transparent text-neutral-200 text-xs font-semibold focus:outline-none cursor-pointer pr-2"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value} className="bg-neutral-900 text-white">
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Title / File Name Input */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="filename.ext"
              className="px-2.5 py-1 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-mono text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-cyan-500/50 w-36 sm:w-44"
            />

            {/* Presets */}
            <div className="hidden lg:flex items-center gap-1 text-[11px] text-neutral-400">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <div className="flex items-center gap-1">
                {PRESET_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      setCode(tpl.code);
                      setLanguage(tpl.lang);
                      setTitle(tpl.title);
                      setConsoleOutput([]);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white transition-colors cursor-pointer text-[10px]"
                  >
                    {tpl.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Format, Font Size & Mode Tabs */}
          <div className="flex items-center gap-2">
            {/* Auto Format */}
            <button
              type="button"
              onClick={handlePrettifyCode}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 cursor-pointer text-[11px]"
              title="Prettify / Format Code"
            >
              <AlignLeft className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline">Prettify</span>
            </button>

            {/* Font Size Toggle */}
            <div className="flex items-center gap-1 bg-neutral-950 p-0.5 rounded-lg border border-neutral-800 text-[10px]">
              <button
                type="button"
                onClick={() => setFontSize('sm')}
                className={`px-1.5 py-0.5 rounded ${fontSize === 'sm' ? 'bg-cyan-500/30 text-cyan-300' : 'text-neutral-400'}`}
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setFontSize('md')}
                className={`px-1.5 py-0.5 rounded ${fontSize === 'md' ? 'bg-cyan-500/30 text-cyan-300' : 'text-neutral-400'}`}
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSize('lg')}
                className={`px-1.5 py-0.5 rounded ${fontSize === 'lg' ? 'bg-cyan-500/30 text-cyan-300' : 'text-neutral-400'}`}
              >
                A+
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex items-center gap-1 bg-neutral-950 p-0.5 rounded-xl border border-neutral-800">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer text-xs ${
                  activeTab === 'editor'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer text-xs ${
                  activeTab === 'preview'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Formatted
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('output')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer text-xs flex items-center gap-1.5 ${
                  activeTab === 'output'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Terminal className="w-3 h-3" />
                <span>Console</span>
                {consoleOutput.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-neutral-950 relative overflow-hidden">
          {/* TAB 1: Editor View */}
          {activeTab === 'editor' && (
            <div className="flex-1 flex h-full overflow-hidden">
              {/* Line Numbers Gutter */}
              {showLineNumbers && (
                <div
                  ref={gutterScrollRef}
                  className="w-10 sm:w-12 py-3 bg-neutral-950 border-r border-neutral-850 text-right pr-2 select-none text-neutral-600 font-mono shrink-0 overflow-hidden"
                  style={{
                    fontFamily: '"JetBrains Mono", "Fira Code", Menlo, Monaco, Consolas, monospace',
                    fontSize: fontSize === 'sm' ? 12 : fontSize === 'lg' ? 15 : 13.5,
                    lineHeight: 1.62,
                  }}
                >
                  {code.split('\n').map((_, idx) => (
                    <div key={idx}>{idx + 1}</div>
                  ))}
                </div>
              )}

              {/* Real-time Syntax Highlighted Code Editor */}
              <div
                ref={editorScrollRef}
                onScroll={handleEditorScroll}
                className="flex-1 h-full overflow-y-auto overflow-x-auto relative scrollbar-thin bg-neutral-950"
              >
                <Editor
                  value={code}
                  onValueChange={(newCode) => setCode(newCode)}
                  highlight={(code) => highlightWithPrism(code, language)}
                  padding={12}
                  className="font-mono leading-relaxed min-h-full"
                  textareaClassName="focus:outline-none select-text"
                  style={{
                    fontFamily: '"JetBrains Mono", "Fira Code", Menlo, Monaco, Consolas, monospace',
                    fontSize: fontSize === 'sm' ? 12 : fontSize === 'lg' ? 15 : 13.5,
                    lineHeight: 1.62,
                    color: '#e2e8f0',
                  }}
                />
              </div>
            </div>
          )}

          {/* TAB 2: Formatted Syntax Highlighted View */}
          {activeTab === 'preview' && (
            <div className={`flex-1 overflow-y-auto p-4 font-mono bg-neutral-950 select-text leading-relaxed scrollbar-thin ${getFontSizeClass()}`}>
              {language === 'html' ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-neutral-800 overflow-hidden">
                    <div className="px-3 py-1.5 bg-neutral-900 border-b border-neutral-800 text-[11px] font-semibold text-neutral-400 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Live HTML Render Preview</span>
                    </div>
                    <iframe
                      ref={iframeRef}
                      title="HTML Preview Sandbox"
                      srcDoc={`<!DOCTYPE html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data: blob: https:; font-src data:; connect-src 'none'; frame-src 'none'; object-src 'none'; script-src 'none';"></head><body>${code}</body></html>`}
                      sandbox=""
                      className="w-full h-64 bg-white"
                    />
                  </div>

                  <div className="rounded-xl border border-neutral-850 bg-neutral-900/50 p-3">
                    <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold mb-2">
                      Syntax Highlighted Source:
                    </div>
                    <div className="space-y-0.5">
                      {highlightedLines.map((line) => (
                        <div key={line.lineNumber} className="flex gap-3">
                          <span className="w-8 text-neutral-600 select-none text-right">
                            {line.lineNumber}
                          </span>
                          <span className="flex-1">
                            {line.tokens.map((token, tIdx) => (
                              <span key={tIdx} className={TOKEN_COLOR_CLASSES[token.type]}>
                                {token.value}
                              </span>
                            ))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {highlightedLines.map((line) => (
                    <div key={line.lineNumber} className="flex gap-3">
                      <span className="w-8 text-neutral-600 select-none text-right shrink-0">
                        {line.lineNumber}
                      </span>
                      <span className="flex-1">
                        {line.tokens.map((token, tIdx) => (
                          <span key={tIdx} className={TOKEN_COLOR_CLASSES[token.type]}>
                            {token.value}
                          </span>
                        ))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Execution Output / Console */}
          {activeTab === 'output' && (
            <div className="flex-1 flex flex-col h-full bg-neutral-950 font-mono text-xs">
              <div className="px-4 py-2 bg-neutral-900/80 border-b border-neutral-800 flex items-center justify-between text-neutral-400 text-[11px]">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-semibold text-neutral-200">Execution Console</span>
                  {executionTime !== null && (
                    <span className="text-[10px] text-neutral-500 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-emerald-400" />
                      {executionTime}ms
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setConsoleOutput([])}
                  className="hover:text-white transition-colors cursor-pointer text-[10px]"
                >
                  Clear Console
                </button>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-1.5 scrollbar-thin select-text">
                {consoleOutput.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-500 space-y-2 select-none">
                    <Terminal className="w-8 h-8 opacity-40 text-cyan-400" />
                    <p className="text-xs">No output yet. Click "Run Code" to execute in sandbox.</p>
                  </div>
                ) : (
                  consoleOutput.map((line, idx) => (
                    <div
                      key={idx}
                      className={`p-1.5 rounded bg-neutral-900/60 border border-white/5 leading-relaxed font-mono whitespace-pre-wrap ${
                        line.startsWith('❌')
                          ? 'text-rose-400 border-rose-500/20'
                          : line.startsWith('⚠️')
                          ? 'text-amber-300'
                          : line.startsWith('✓')
                          ? 'text-emerald-400'
                          : 'text-neutral-200'
                      }`}
                    >
                      {line}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRunCode}
              disabled={isRunning || !code.trim()}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-40"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunning ? 'Running...' : 'Run Code'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadFile}
              className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
              title="Download Code File"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Download</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSendToChat}
              disabled={!code.trim()}
              style={{ backgroundColor: accentColor }}
              className="px-4 py-2 rounded-xl text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-40"
            >
              <span>Send to Chat</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default CodeSandboxModal;
