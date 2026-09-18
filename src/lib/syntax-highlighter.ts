import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-markup'; // HTML, XML, SVG
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';

export type CodeLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'html'
  | 'css'
  | 'json'
  | 'sql'
  | 'bash'
  | 'rust'
  | 'go'
  | 'cpp';

export interface CodeToken {
  type: 'keyword' | 'string' | 'number' | 'comment' | 'function' | 'operator' | 'tag' | 'punctuation' | 'text';
  value: string;
}

export interface HighlightedLine {
  lineNumber: number;
  tokens: CodeToken[];
}

// Normalized language aliases
export function normalizeLanguage(lang?: string): CodeLanguage {
  if (!lang) return 'javascript';
  const clean = lang.toLowerCase().trim();
  if (['js', 'jsx', 'mjs', 'cjs'].includes(clean)) return 'javascript';
  if (['ts', 'tsx'].includes(clean)) return 'typescript';
  if (['py', 'python', 'python3'].includes(clean)) return 'python';
  if (['html', 'htm', 'xml', 'svg'].includes(clean)) return 'html';
  if (['css', 'scss', 'sass', 'less'].includes(clean)) return 'css';
  if (['json', 'jsonc'].includes(clean)) return 'json';
  if (['sql', 'pgsql', 'mysql', 'sqlite'].includes(clean)) return 'sql';
  if (['sh', 'bash', 'zsh', 'shell'].includes(clean)) return 'bash';
  if (['rs', 'rust'].includes(clean)) return 'rust';
  if (['go', 'golang'].includes(clean)) return 'go';
  if (['cpp', 'c', 'c++', 'h', 'hpp'].includes(clean)) return 'cpp';
  return 'javascript';
}

/**
 * Returns the corresponding Prism Grammar object for a language
 */
export function getPrismGrammar(lang: CodeLanguage): Prism.Grammar {
  const map: Record<CodeLanguage, string> = {
    javascript: 'javascript',
    typescript: 'typescript',
    python: 'python',
    html: 'markup',
    css: 'css',
    json: 'json',
    sql: 'sql',
    bash: 'bash',
    rust: 'rust',
    go: 'go',
    cpp: 'cpp',
  };
  const key = map[lang] || 'javascript';
  return Prism.languages[key] || Prism.languages.javascript;
}

/**
 * Maps Prism token types to our standardized CodeToken['type']
 */
function mapPrismType(type: string): CodeToken['type'] {
  if (['keyword', 'boolean', 'builtin', 'important', 'constant', 'selector'].includes(type)) return 'keyword';
  if (['string', 'char', 'attr-value', 'regex', 'url'].includes(type)) return 'string';
  if (['number', 'hexcode'].includes(type)) return 'number';
  if (['comment', 'prolog', 'doctype', 'cdata'].includes(type)) return 'comment';
  if (['function', 'class-name', 'attr-name'].includes(type)) return 'function';
  if (['operator', 'entity'].includes(type)) return 'operator';
  if (['tag', 'property', 'atrule'].includes(type)) return 'tag';
  if (['punctuation'].includes(type)) return 'punctuation';
  return 'text';
}

/**
 * Highlights a code string directly using Prism and returns HTML markup
 * Suitable for react-simple-code-editor and styled code blocks
 */
export function highlightWithPrism(code: string, rawLang?: string): string {
  const lang = normalizeLanguage(rawLang);
  const grammar = getPrismGrammar(lang);
  try {
    return Prism.highlight(code, grammar, lang);
  } catch {
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

/**
 * Recursively flattens Prism tokens into an array of simple { type, value }
 */
function flattenPrismTokens(
  tokenOrString: string | Prism.Token | (string | Prism.Token)[],
  parentType: string = 'text'
): { type: string; value: string }[] {
  if (typeof tokenOrString === 'string') {
    return [{ type: parentType, value: tokenOrString }];
  }

  if (Array.isArray(tokenOrString)) {
    return tokenOrString.flatMap((item) => flattenPrismTokens(item, parentType));
  }

  const currentType = typeof tokenOrString.type === 'string' ? tokenOrString.type : parentType;

  if (typeof tokenOrString.content === 'string') {
    return [{ type: currentType, value: tokenOrString.content }];
  }

  if (Array.isArray(tokenOrString.content)) {
    return tokenOrString.content.flatMap((item) => flattenPrismTokens(item, currentType));
  }

  return [{ type: currentType, value: String(tokenOrString.content) }];
}

/**
 * Tokenizes entire multi-line code string using Prism into lines with typed tokens
 */
export function highlightCode(code: string, rawLang?: string): HighlightedLine[] {
  const lang = normalizeLanguage(rawLang);
  const grammar = getPrismGrammar(lang);

  let prismTokens: (string | Prism.Token)[];
  try {
    prismTokens = Prism.tokenize(code, grammar);
  } catch {
    prismTokens = [code];
  }

  const flattened = flattenPrismTokens(prismTokens);

  // Split tokens across lines while preserving their token types
  const lines: HighlightedLine[] = [];
  let currentLineTokens: CodeToken[] = [];
  let lineNumber = 1;

  for (const item of flattened) {
    const segments = item.value.split('\n');
    for (let s = 0; s < segments.length; s++) {
      const seg = segments[s];
      if (seg.length > 0) {
        currentLineTokens.push({
          type: mapPrismType(item.type),
          value: seg,
        });
      }

      if (s < segments.length - 1) {
        // End of current line
        lines.push({
          lineNumber,
          tokens: currentLineTokens,
        });
        lineNumber++;
        currentLineTokens = [];
      }
    }
  }

  // Push final line
  lines.push({
    lineNumber,
    tokens: currentLineTokens,
  });

  return lines;
}

/**
 * Tokenizes a single line of source code into syntax tokens
 */
export function tokenizeLine(line: string, lang: CodeLanguage): CodeToken[] {
  const grammar = getPrismGrammar(lang);
  let prismTokens: (string | Prism.Token)[];
  try {
    prismTokens = Prism.tokenize(line, grammar);
  } catch {
    prismTokens = [line];
  }
  const flattened = flattenPrismTokens(prismTokens);
  return flattened.map((item) => ({
    type: mapPrismType(item.type),
    value: item.value,
  }));
}

/**
 * Token CSS color mappings for high-contrast dark theme
 */
export const TOKEN_COLOR_CLASSES: Record<CodeToken['type'], string> = {
  keyword: 'text-purple-400 font-semibold',
  string: 'text-emerald-400',
  number: 'text-amber-300',
  comment: 'text-neutral-500 italic',
  function: 'text-sky-400 font-medium',
  operator: 'text-rose-400',
  tag: 'text-teal-400 font-semibold',
  punctuation: 'text-neutral-400',
  text: 'text-neutral-100',
};
