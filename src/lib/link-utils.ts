// Utility functions for safe URL detection, formatting, and handling

const URL_REGEX = /(https?:\/\/[^\s<>"'{}|\\^`]+)/gi;

export interface ExtractedLink {
  url: string;
  domain: string;
  displayUrl: string;
}

/**
 * Validate whether a string is a safe HTTP or HTTPS URL
 */
export function isSafeHttpUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }
    // Reject URLs with embedded credentials (userinfo: http://user:pass@host) to mitigate phishing & credential leakage
    if (url.username || url.password) {
      return false;
    }
    // Reject cloud metadata service endpoints
    const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
    if (
      hostname === '169.254.169.254' ||
      hostname === 'metadata.google.internal' ||
      hostname === 'instance-data'
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract hostname / domain from URL safely
 */
export function getDomainFromUrl(urlString: string): string {
  try {
    const url = new URL(urlString);
    return url.hostname.replace(/^www\./i, '');
  } catch {
    return 'link';
  }
}

/**
 * Format URL for clean UI display (truncating long paths)
 */
export function formatUrlForDisplay(urlString: string, maxLen = 45): string {
  try {
    const url = new URL(urlString);
    const domain = url.hostname.replace(/^www\./i, '');
    const path = url.pathname + url.search;
    if (path.length > 1) {
      const full = domain + path;
      if (full.length > maxLen) {
        return full.substring(0, maxLen - 3) + '...';
      }
      return full;
    }
    return domain;
  } catch {
    return urlString.length > maxLen ? urlString.substring(0, maxLen - 3) + '...' : urlString;
  }
}

/**
 * Extract all valid URLs from a text string
 */
export function extractUrlsFromText(text: string): ExtractedLink[] {
  if (!text) return [];
  const matches = text.match(URL_REGEX);
  if (!matches) return [];

  const results: ExtractedLink[] = [];
  const seen = new Set<string>();

  for (const raw of matches) {
    // Remove trailing punctuation like commas, periods, parentheses often attached in chat
    const cleaned = raw.replace(/[.,!?;:)>\]]+$/, '');
    if (isSafeHttpUrl(cleaned) && !seen.has(cleaned)) {
      seen.add(cleaned);
      results.push({
        url: cleaned,
        domain: getDomainFromUrl(cleaned),
        displayUrl: formatUrlForDisplay(cleaned),
      });
    }
  }

  return results;
}

/**
 * Split text into tokens of text and URLs for inline rich rendering
 */
export interface TextToken {
  type: 'text' | 'url';
  content: string;
}

export function parseTextWithUrls(text: string): TextToken[] {
  if (!text) return [];
  const tokens: TextToken[] = [];
  let lastIndex = 0;
  const regex = new RegExp(URL_REGEX.source, 'gi');
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const matchStart = match.index;
    const rawUrl = match[0];
    // Clean trailing punctuation
    const trailingMatch = rawUrl.match(/[.,!?;:)>\]]+$/);
    const trailingPunct = trailingMatch ? trailingMatch[0] : '';
    const cleanUrl = rawUrl.substring(0, rawUrl.length - trailingPunct.length);

    if (matchStart > lastIndex) {
      tokens.push({
        type: 'text',
        content: text.substring(lastIndex, matchStart),
      });
    }

    if (isSafeHttpUrl(cleanUrl)) {
      tokens.push({
        type: 'url',
        content: cleanUrl,
      });
    } else {
      tokens.push({
        type: 'text',
        content: cleanUrl,
      });
    }

    if (trailingPunct) {
      tokens.push({
        type: 'text',
        content: trailingPunct,
      });
    }

    lastIndex = matchStart + rawUrl.length;
  }

  if (lastIndex < text.length) {
    tokens.push({
      type: 'text',
      content: text.substring(lastIndex),
    });
  }

  return tokens;
}
