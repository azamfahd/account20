import React from 'react';
import * as math from 'mathjs';

/**
 * Shared appearance class maps for both Editor (AddNoteModal) and Reader (NoteDetailsModal)
 */
export const NOTE_PAPER_CLASSES: Record<string, string> = {
  plain: 'bg-white text-slate-900',
  warm: 'bg-amber-50/55 text-slate-900',
  lined:
    'bg-white text-slate-900 bg-[repeating-linear-gradient(to_bottom,transparent,transparent_30px,rgba(245,158,11,0.24)_31px)]',
  grid:
    'bg-white text-slate-900 bg-[linear-gradient(to_right,rgba(148,163,184,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.14)_1px,transparent_1px)] bg-[size:22px_22px]',
  dots:
    'bg-white text-slate-900 bg-[radial-gradient(rgba(148,163,184,0.38)_1.2px,transparent_1.2px)] bg-[size:18px_18px]',
  dark: 'bg-slate-900 text-slate-100',
};

export const NOTE_FONT_SIZE_CLASSES: Record<string, string> = {
  sm: 'text-xs sm:text-sm',
  base: 'text-sm sm:text-base',
  lg: 'text-base sm:text-lg',
  xl: 'text-lg sm:text-xl',
};

export const NOTE_FONT_FAMILY_CLASSES: Record<string, string> = {
  sans: 'font-sans',
  mono: 'font-mono tracking-tight',
  serif: 'font-serif',
};

export const NOTE_LINE_HEIGHT_CLASSES: Record<string, string> = {
  compact: 'leading-6',
  normal: 'leading-8',
  relaxed: 'leading-10',
};

export const NOTE_BORDER_CLASSES: Record<string, Record<string, string>> = {
  gold: {
    default: 'border-2 border-amber-400/90 shadow-md shadow-amber-500/10',
  },
  double: {
    default: 'border-4 border-double border-amber-500/80 shadow-md',
  },
  subtle: {
    default: 'border border-slate-200/90 shadow-xs',
  },
  themed: {
    emerald: 'border-2 border-emerald-400/90 shadow-md shadow-emerald-500/10',
    sky: 'border-2 border-sky-400/90 shadow-md shadow-sky-500/10',
    indigo: 'border-2 border-indigo-400/90 shadow-md shadow-indigo-500/10',
    teal: 'border-2 border-teal-400/90 shadow-md shadow-teal-500/10',
    purple: 'border-2 border-purple-400/90 shadow-md shadow-purple-500/10',
    amber: 'border-2 border-amber-400/90 shadow-md shadow-amber-500/10',
    rose: 'border-2 border-rose-400/90 shadow-md shadow-rose-500/10',
    slate: 'border-2 border-slate-400/90 shadow-md shadow-slate-500/10',
  },
};

export function getNoteBorderClass(borderStyle?: string, colorTag?: string): string {
  const bs = borderStyle || 'gold';
  if (bs === 'themed') {
    return NOTE_BORDER_CLASSES.themed[colorTag || 'emerald'] || NOTE_BORDER_CLASSES.themed.emerald;
  }
  return NOTE_BORDER_CLASSES[bs]?.default || NOTE_BORDER_CLASSES.gold.default;
}

/**
 * Curated WYSIWYG Palette Mappings (maps hex/rgb/token -> pure Tailwind classes)
 */
const COLOR_HEX_TO_CLASS: Record<string, string> = {
  '#0f172a': 'text-slate-900',
  'rgb(15, 23, 42)': 'text-slate-900',
  '#475569': 'text-slate-600',
  'rgb(71, 85, 105)': 'text-slate-600',
  '#dc2626': 'text-red-600',
  'rgb(220, 38, 38)': 'text-red-600',
  '#059669': 'text-emerald-600',
  'rgb(5, 150, 105)': 'text-emerald-600',
  '#2563eb': 'text-blue-600',
  'rgb(37, 99, 235)': 'text-blue-600',
  '#d97706': 'text-amber-600',
  'rgb(217, 119, 6)': 'text-amber-600',
  '#9333ea': 'text-purple-600',
  'rgb(147, 51, 234)': 'text-purple-600',
  '#e11d48': 'text-rose-600',
  'rgb(225, 29, 72)': 'text-rose-600',
  '#0d9488': 'text-teal-600',
  'rgb(13, 148, 136)': 'text-teal-600',
  '#ea580c': 'text-orange-600',
  'rgb(234, 88, 12)': 'text-orange-600',
  '#ffffff': 'text-white',
  'rgb(255, 255, 255)': 'text-white',
  '#fde047': 'text-yellow-300',
  'rgb(253, 224, 71)': 'text-yellow-300',
};

const BG_HEX_TO_CLASS: Record<string, string> = {
  '#fef08a': 'bg-yellow-200/90 text-slate-950 px-1 rounded',
  'rgb(254, 240, 138)': 'bg-yellow-200/90 text-slate-950 px-1 rounded',
  '#bbf7d0': 'bg-emerald-200/90 text-slate-950 px-1 rounded',
  'rgb(187, 247, 208)': 'bg-emerald-200/90 text-slate-950 px-1 rounded',
  '#bae6fd': 'bg-sky-200/90 text-slate-950 px-1 rounded',
  'rgb(186, 230, 253)': 'bg-sky-200/90 text-slate-950 px-1 rounded',
  '#fecdd3': 'bg-rose-200/90 text-slate-950 px-1 rounded',
  'rgb(254, 205, 211)': 'bg-rose-200/90 text-slate-950 px-1 rounded',
  '#e9d5ff': 'bg-purple-200/90 text-slate-950 px-1 rounded',
  'rgb(233, 213, 255)': 'bg-purple-200/90 text-slate-950 px-1 rounded',
  '#fde68a': 'bg-amber-200/90 text-slate-950 px-1 rounded',
  'rgb(253, 230, 138)': 'bg-amber-200/90 text-slate-950 px-1 rounded',
};

const FONT_SIZE_VALUE_TO_CLASS: Record<string, string> = {
  '1': 'text-xs',
  '2': 'text-sm',
  '3': 'text-base',
  '4': 'text-lg font-bold',
  '5': 'text-xl font-extrabold',
  '6': 'text-2xl font-black',
  'x-small': 'text-xs',
  'small': 'text-sm',
  'medium': 'text-base',
  'large': 'text-lg font-bold',
  'x-large': 'text-xl font-extrabold',
  'xx-large': 'text-2xl font-black',
  '12px': 'text-xs',
  '14px': 'text-sm',
  '16px': 'text-base',
  '18px': 'text-lg font-bold',
  '22px': 'text-xl font-extrabold',
  '26px': 'text-2xl font-black',
};

export function isHtmlContent(raw: string): boolean {
  if (!raw) return false;
  return /<(?:p|div|span|b|strong|u|i|em|s|strike|del|mark|h[1-3]|ul|ol|li|hr|br|blockquote|font)\b[^>]*>/i.test(raw);
}

/**
 * Normalizes Arabic-Indic digits and Arabic arithmetic symbols into standard ASCII equivalents.
 */
export function normalizeArabicNumbersAndOps(input: string): string {
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return input
    .replace(/[٠-٩]/g, (d) => String(arabicDigits.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(persianDigits.indexOf(d)))
    .replace(/٬/g, ',')
    .replace(/٫/g, '.')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/–|—/g, '-');
}

function normalizeCssColorKey(val: string): string {
  return val.trim().toLowerCase().replace(/\s*,\s*/g, ', ');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Sanitizes WYSIWYG HTML keeping ONLY safe formatting tags and validated color/highlight/size/align attributes.
 */
export function sanitizeNoteHtml(rawHtml: string): string {
  if (!rawHtml) return '';
  if (typeof DOMParser === 'undefined') {
    return rawHtml.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${rawHtml}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  if (!root) return '';

  const ALLOWED_TAGS = new Set([
    'B', 'STRONG', 'U', 'I', 'EM', 'S', 'STRIKE', 'DEL', 'MARK',
    'SPAN', 'FONT', 'H1', 'H2', 'H3', 'P', 'DIV', 'BR', 'HR',
    'UL', 'OL', 'LI', 'BLOCKQUOTE'
  ]);

  const cleanNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return escapeHtml(node.textContent || '');
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const el = node as HTMLElement;
    const tag = el.tagName.toUpperCase();

    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'IFRAME' || tag === 'OBJECT') {
      return '';
    }

    const inner = Array.from(el.childNodes).map(cleanNode).join('');

    if (!ALLOWED_TAGS.has(tag)) {
      return inner;
    }

    if (tag === 'BR') return '<br>';
    if (tag === 'HR') return '<hr>';

    // Convert legacy <font color size> emitted by execCommand into clean <span style="...">
    if (tag === 'FONT') {
      const styleParts: string[] = [];
      const col = el.getAttribute('color');
      const sz = el.getAttribute('size');
      if (col && /^(#[0-9a-f]{3,8}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\))$/i.test(col.trim())) {
        styleParts.push(`color:${col.trim()}`);
      }
      if (sz && /^[1-7]$/.test(sz.trim())) {
        const sizeMap: Record<string, string> = {
          '1': '12px',
          '2': '14px',
          '3': '16px',
          '4': '18px',
          '5': '22px',
          '6': '26px',
          '7': '26px',
        };
        styleParts.push(`font-size:${sizeMap[sz.trim()] || '16px'}`);
      }
      const dataHighlight = el.getAttribute('data-highlight');
      const attrParts: string[] = [];
      if (styleParts.length > 0) attrParts.push(`style="${styleParts.join(';')}"`);
      if (dataHighlight) attrParts.push(`data-highlight="${escapeHtml(dataHighlight)}"`);
      return attrParts.length > 0 ? `<span ${attrParts.join(' ')}>${inner}</span>` : inner;
    }

    const styleAttrs: string[] = [];
    if (el.style) {
      if (el.style.color && /^(#[0-9a-f]{3,8}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\))$/i.test(el.style.color.trim())) {
        styleAttrs.push(`color:${el.style.color.trim()}`);
      }
      if (
        el.style.backgroundColor &&
        el.style.backgroundColor !== 'transparent' &&
        /^(#[0-9a-f]{3,8}|rgba?\([^)]+\))$/i.test(el.style.backgroundColor.trim())
      ) {
        styleAttrs.push(`background-color:${el.style.backgroundColor.trim()}`);
      }
      if (el.style.fontSize && /^(\d+(?:\.\d+)?px|x-small|small|medium|large|x-large|xx-large)$/i.test(el.style.fontSize.trim())) {
        styleAttrs.push(`font-size:${el.style.fontSize.trim()}`);
      }
      if (el.style.textAlign && /^(right|left|center|start|end)$/i.test(el.style.textAlign.trim())) {
        styleAttrs.push(`text-align:${el.style.textAlign.trim()}`);
      }
    }

    const extraAttrs: string[] = [];
    if (styleAttrs.length > 0) extraAttrs.push(`style="${styleAttrs.join(';')}"`);
    const dataBadge = el.getAttribute('data-note-badge');
    if (dataBadge === 'pin') extraAttrs.push('data-note-badge="pin"');

    const lowerTag = tag.toLowerCase();
    const attrStr = extraAttrs.length > 0 ? ` ${extraAttrs.join(' ')}` : '';
    return `<${lowerTag}${attrStr}>${inner}</${lowerTag}>`;
  };

  return Array.from(root.childNodes).map(cleanNode).join('');
}

/**
 * Extracts clean line-preserved plain text from either rich HTML or legacy markdown notes.
 */
export function htmlToPlainText(rawContent: string): string {
  if (!rawContent) return '';
  if (!isHtmlContent(rawContent)) {
    return rawContent;
  }

  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${rawContent}</div>`, 'text/html');
    const root = doc.body.firstElementChild;
    if (!root) return '';

    const BLOCK_TAGS = new Set(['DIV', 'P', 'H1', 'H2', 'H3', 'LI', 'BLOCKQUOTE']);
    const lines: string[] = [];
    let currentLine = '';

    const flushLine = () => {
      lines.push(currentLine);
      currentLine = '';
    };

    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        currentLine += node.textContent || '';
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const el = node as HTMLElement;
      const tag = el.tagName.toUpperCase();

      if (tag === 'BR') {
        flushLine();
        return;
      }
      if (tag === 'HR') {
        if (currentLine.trim()) flushLine();
        lines.push('---');
        return;
      }

      const isBlock = BLOCK_TAGS.has(tag);
      if (isBlock && currentLine.length > 0) {
        flushLine();
      }
      Array.from(el.childNodes).forEach(walk);
      if (isBlock) {
        flushLine();
      }
    };

    Array.from(root.childNodes).forEach(walk);
    if (currentLine.length > 0) flushLine();
    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  // Fallback for non-DOM environments
  return rawContent
    .replace(/<hr\s*\/?>/gi, '\n---\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:div|p|h[1-3]|li|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Converts legacy markdown/plain text OR stored HTML into clean WYSIWYG HTML for contentEditable.
 */
export function noteContentToEditorHtml(rawContent: string): string {
  if (!rawContent) return '';
  if (isHtmlContent(rawContent)) {
    return sanitizeNoteHtml(rawContent);
  }

  const lines = rawContent.split(/\r?\n/);
  const htmlLines = lines.map((line) => {
    const trimmed = line.trim();
    if (/^-{3,}$/.test(trimmed)) return '<hr>';

    let escaped = escapeHtml(line);
    escaped = escaped
      .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
      .replace(/__([^_]+)__/g, '<u>$1</u>')
      .replace(/~~([^~]+)~~/g, '<s>$1</s>')
      .replace(/==([^=]+)==/g, '<mark style="background-color:#fef08a">$1</mark>')
      .replace(/(^|\s)_([^_]+)_(\s|$)/g, '$1<i>$2</i>$3')
      .replace(/\{red:([^}]+)\}/g, '<span style="color:#dc2626">$1</span>')
      .replace(/\{green:([^}]+)\}/g, '<span style="color:#059669">$1</span>')
      .replace(/\{blue:([^}]+)\}/g, '<span style="color:#2563eb">$1</span>')
      .replace(/\{amber:([^}]+)\}/g, '<span style="color:#d97706">$1</span>')
      .replace(/\{purple:([^}]+)\}/g, '<span style="color:#9333ea">$1</span>')
      .replace(/📌\s*\[([^\]]+)\]/g, '<span data-note-badge="pin" style="background-color:#fde68a;color:#92400e">📌 $1</span>');

    if (/^#\s+/.test(trimmed)) {
      return `<h2>${escaped.replace(/^#\s+/, '')}</h2>`;
    }
    if (/^##\s+/.test(trimmed)) {
      return `<h3>${escaped.replace(/^##\s+/, '')}</h3>`;
    }
    return `<div>${escaped || '<br>'}</div>`;
  });

  return htmlLines.join('');
}

/**
 * Evaluates a single mathematical expression safely via mathjs.
 */
function safeEvalMathExpr(expr: string): number | null {
  try {
    const cleaned = expr.replace(/,/g, '').trim();
    if (!cleaned) return null;
    const openCount = (cleaned.match(/\(/g) || []).length;
    const closeCount = (cleaned.match(/\)/g) || []).length;
    const balanced = openCount > closeCount ? cleaned + ')'.repeat(openCount - closeCount) : cleaned;
    const result = math.evaluate(balanced);
    if (typeof result === 'number' && Number.isFinite(result)) {
      return result;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Smartly computes the total amount from free-form note text or WYSIWYG HTML:
 * - Strips HTML / formatting safely first
 * - Supports arithmetic expressions (e.g. 500 + 300, 150 * 4, 1000 - 250, (200+50)*2)
 * - Supports "expr = result" lines without double-counting the right-hand side
 * - Supports Arabic-Indic numerals & comma thousand-separators
 * - Ignores dates, times, numbered list prefixes, dividers, and the "الإجمالي المحسوب:" footer line
 */
export function calculateNoteContentTotal(rawContent: string): number {
  const plain = htmlToPlainText(rawContent);
  if (!plain || !plain.trim()) return 0;

  const lines = plain.split(/\r?\n/);
  let grandTotal = 0;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('الإجمالي المحسوب:') || /^[-_=]{3,}$/.test(trimmed)) {
      continue;
    }

    let line = normalizeArabicNumbersAndOps(trimmed);

    // Strip any legacy formatting wrapper tokens while preserving inner text
    line = line
      .replace(/\{(?:red|green|blue|amber|purple):([^}]*)\}/g, '$1')
      .replace(/📌\s*\[([^\]]*)\]/g, '$1')
      .replace(/\*\*|__|~~|==/g, '');

    // Remove date patterns and time patterns
    line = line
      .replace(/\b\d{1,4}[/-]\d{1,2}[/-]\d{1,4}\b/g, ' ')
      .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, ' ');

    // Strip leading numbered list marker like "1. "
    line = line.replace(/^\s*\d+[.)]\s+/, '');

    // Remove thousand commas inside numbers
    line = line.replace(/(\d),(?=\d{3}(?:\D|$))/g, '$1');

    // Handle "left = right" expressions
    if (line.includes('=')) {
      const eqParts = line.split('=');
      const lhs = eqParts[0];
      if (/\d/.test(lhs) && /[+\-*/()]/.test(lhs)) {
        line = lhs;
      }
    }

    const mathExprRegex = /(?:\(*\s*-?\d+(?:\.\d+)?\s*\)*(?:\s*[+\-*/]\s*\(*\s*-?\d+(?:\.\d+)?\s*\)*)+)/g;
    const lineWithoutExprs = line.replace(mathExprRegex, (match) => {
      const evaluated = safeEvalMathExpr(match);
      if (evaluated !== null) {
        grandTotal += evaluated;
        return ' ';
      }
      return match;
    });

    const remainingNumbers = lineWithoutExprs.match(/-?\d+(?:\.\d+)?/g);
    if (remainingNumbers) {
      for (const numStr of remainingNumbers) {
        const val = parseFloat(numStr);
        if (Number.isFinite(val)) {
          grandTotal += val;
        }
      }
    }
  }

  return Math.round(grandTotal * 100) / 100;
}

/**
 * Evaluates arithmetic expressions inline on lines without "=", preserving rich HTML formatting.
 */
export function evaluateInlineExpressions(rawContent: string): { updatedContent: string; changed: boolean } {
  if (!rawContent) return { updatedContent: rawContent, changed: false };

  const mathExprRegex = /(?:\(*\s*-?\d+(?:\.\d+)?\s*\)*(?:\s*[+\-*/×÷]\s*\(*\s*-?\d+(?:\.\d+)?\s*\)*)+)/g;

  const evalSingleLine = (textLine: string): number | null => {
    const trimmed = textLine.trim();
    if (!trimmed || trimmed.startsWith('الإجمالي المحسوب:') || /^[-_=]{3,}$/.test(trimmed)) return null;
    if (textLine.includes('=')) return null;

    const normalized = normalizeArabicNumbersAndOps(textLine)
      .replace(/\b\d{1,4}[/-]\d{1,2}[/-]\d{1,4}\b/g, ' ')
      .replace(/(\d),(?=\d{3}(?:\D|$))/g, '$1');

    const matches = normalized.match(mathExprRegex);
    if (!matches || matches.length === 0) return null;

    const lastExpr = matches[matches.length - 1];
    const result = safeEvalMathExpr(lastExpr);
    return result !== null ? Math.round(result * 100) / 100 : null;
  };

  if (isHtmlContent(rawContent) && typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${rawContent}</div>`, 'text/html');
    const root = doc.body.firstElementChild;
    if (!root) return { updatedContent: rawContent, changed: false };

    let changed = false;
    const blockChildren = Array.from(root.children).filter((el) =>
      ['DIV', 'P', 'LI', 'H1', 'H2', 'H3', 'BLOCKQUOTE'].includes(el.tagName.toUpperCase())
    );

    if (blockChildren.length > 0) {
      blockChildren.forEach((el) => {
        const lineText = el.textContent || '';
        const res = evalSingleLine(lineText);
        if (res !== null) {
          changed = true;
          const span = doc.createElement('span');
          span.style.color = '#059669';
          const b = doc.createElement('b');
          b.textContent = ` = ${res}`;
          span.appendChild(b);
          el.appendChild(span);
        }
      });
    } else {
      const res = evalSingleLine(root.textContent || '');
      if (res !== null) {
        changed = true;
        const span = doc.createElement('span');
        span.style.color = '#059669';
        const b = doc.createElement('b');
        b.textContent = ` = ${res}`;
        span.appendChild(b);
        root.appendChild(span);
      }
    }

    return {
      updatedContent: changed ? sanitizeNoteHtml(root.innerHTML) : rawContent,
      changed,
    };
  }

  let changed = false;
  const lines = rawContent.split(/\r?\n/).map((rawLine) => {
    const res = evalSingleLine(rawLine);
    if (res !== null) {
      changed = true;
      return `${rawLine.trimEnd()} = ${res}`;
    }
    return rawLine;
  });

  return { updatedContent: lines.join('\n'), changed };
}

/**
 * Updates an existing "الإجمالي المحسوب: ..." summary line cleanly in either HTML or plain text.
 */
export function syncSummaryLineInContent(content: string, total: number): string {
  if (!content.includes('الإجمالي المحسوب:')) return content;
  const formattedTotal = `الإجمالي المحسوب: ${total.toLocaleString('ar-SA')} ريال`;
  if (isHtmlContent(content)) {
    return content.replace(/الإجمالي المحسوب:[^<]*/g, formattedTotal);
  }
  return content.replace(/الإجمالي المحسوب:.*$/gm, formattedTotal);
}

/**
 * Strips all HTML tags & markdown tokens for crisp card previews, search, and copy-to-clipboard.
 */
export function stripFormattingForPreview(text: string): string {
  if (!text) return '';
  const plain = htmlToPlainText(text);
  return plain
    .replace(/^#{1,2}\s+/gm, '')
    .replace(/\{(?:red|green|blue|amber|purple):([^}]*)\}/g, '$1')
    .replace(/📌\s*\[([^\]]*)\]/g, '📌 $1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/==([^=]+)==/g, '$1')
    .replace(/(^|\s)_([^_]+)_(\s|$)/g, '$1$2$3')
    .replace(/^-{3,}$/gm, '────────');
}

const COLOR_BADGE_CLASSES: Record<string, string> = {
  red: 'text-rose-700 bg-rose-50 border-rose-200/80',
  green: 'text-emerald-800 bg-emerald-50 border-emerald-200/80',
  blue: 'text-sky-800 bg-sky-50 border-sky-200/80',
  amber: 'text-amber-900 bg-amber-50 border-amber-300/80',
  purple: 'text-purple-800 bg-purple-50 border-purple-200/80',
};

function renderInlineFormattedParts(line: string, keyPrefix: string): React.ReactNode[] {
  const tokenRegex =
    /(\*\*[^*\n]+\*\*|__[^_\n]+__|~~[^~\n]+~~|==[^=\n]+==|_[^_\n]+_|\{(?:red|green|blue|amber|purple):[^}\n]+\}|📌\s*\[[^\]\n]+\])/g;
  const parts = line.split(tokenRegex);

  return parts.map((part, idx) => {
    const key = `${keyPrefix}-${idx}`;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={key} className="font-black">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('__') && part.endsWith('__') && part.length > 4) {
      return (
        <u key={key} className="underline decoration-2 decoration-amber-500 underline-offset-4 font-extrabold">
          {part.slice(2, -2)}
        </u>
      );
    }
    if (part.startsWith('~~') && part.endsWith('~~') && part.length > 4) {
      return (
        <del key={key} className="line-through opacity-60 decoration-rose-400/80 decoration-2">
          {part.slice(2, -2)}
        </del>
      );
    }
    if (part.startsWith('==') && part.endsWith('==') && part.length > 4) {
      return (
        <mark key={key} className="bg-yellow-200/90 text-slate-950 font-extrabold px-1.5 py-0.2 rounded-md">
          {part.slice(2, -2)}
        </mark>
      );
    }
    if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
      return (
        <em key={key} className="italic opacity-90">
          {part.slice(1, -1)}
        </em>
      );
    }
    const colorMatch = part.match(/^\{(red|green|blue|amber|purple):([^}]+)\}$/);
    if (colorMatch) {
      const [, colorKey, inner] = colorMatch;
      const cls = COLOR_BADGE_CLASSES[colorKey] || COLOR_BADGE_CLASSES.amber;
      return (
        <span key={key} className={`inline-block px-1.5 py-0.2 rounded-md border font-extrabold ${cls}`}>
          {inner}
        </span>
      );
    }
    if (part.startsWith('📌') && part.includes('[') && part.endsWith(']')) {
      const inner = part.replace(/^📌\s*\[/, '').replace(/\]$/, '');
      return (
        <span
          key={key}
          className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-950 font-extrabold px-2 py-0.5 rounded-xl border border-amber-400/60 my-0.5 shadow-2xs"
        >
          <span className="text-amber-600">📌</span>
          <span>{inner}</span>
        </span>
      );
    }
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

function getSafeClassesForElement(el: HTMLElement): string {
  const classes: string[] = [];
  if (el.getAttribute('data-note-badge') === 'pin') {
    classes.push('inline-flex items-center gap-1 bg-amber-500/20 text-amber-900 font-extrabold px-2 py-0.5 rounded-xl border border-amber-400/60 my-0.5');
  }
  if (el.style) {
    if (el.style.color) {
      const colCls = COLOR_HEX_TO_CLASS[normalizeCssColorKey(el.style.color)];
      if (colCls) classes.push(colCls);
    }
    if (el.style.backgroundColor && el.style.backgroundColor !== 'transparent') {
      const bgCls = BG_HEX_TO_CLASS[normalizeCssColorKey(el.style.backgroundColor)];
      if (bgCls) classes.push(bgCls);
      else classes.push('bg-yellow-200/80 text-slate-950 px-1 rounded');
    }
    if (el.style.fontSize) {
      const fsCls = FONT_SIZE_VALUE_TO_CLASS[el.style.fontSize.trim().toLowerCase()];
      if (fsCls) classes.push(fsCls);
    }
    if (el.style.textAlign) {
      const ta = el.style.textAlign.trim().toLowerCase();
      if (ta === 'center') classes.push('text-center');
      else if (ta === 'left') classes.push('text-left');
      else if (ta === 'right') classes.push('text-right');
    }
  }
  return classes.join(' ');
}

function domNodeToReact(node: Node, key: string): React.ReactNode {
  if (node.nodeType === Node.TEXT_NODE) {
    return <React.Fragment key={key}>{node.textContent}</React.Fragment>;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const el = node as HTMLElement;
  const tag = el.tagName.toUpperCase();
  const children = Array.from(el.childNodes).map((child, i) => domNodeToReact(child, `${key}-${i}`));
  const cls = getSafeClassesForElement(el);

  switch (tag) {
    case 'BR':
      return <br key={key} />;
    case 'HR':
      return <hr key={key} className="my-2.5 border-amber-300/80" />;
    case 'B':
    case 'STRONG':
      return <strong key={key} className={`font-black ${cls}`}>{children}</strong>;
    case 'U':
      return <u key={key} className={`underline decoration-2 decoration-amber-500 underline-offset-4 ${cls}`}>{children}</u>;
    case 'I':
    case 'EM':
      return <em key={key} className={`italic ${cls}`}>{children}</em>;
    case 'S':
    case 'STRIKE':
    case 'DEL':
      return <del key={key} className={`line-through opacity-65 decoration-rose-400/80 decoration-2 ${cls}`}>{children}</del>;
    case 'MARK':
      return <mark key={key} className={`${cls || 'bg-yellow-200/90 text-slate-950 px-1 rounded'} font-extrabold`}>{children}</mark>;
    case 'H1':
      return <h3 key={key} className={`text-lg sm:text-xl font-black border-b-2 border-amber-300/70 pb-1 pt-1.5 mb-1 ${cls}`}>{children}</h3>;
    case 'H2':
      return <h4 key={key} className={`text-base sm:text-lg font-black border-b border-amber-300/60 pb-0.5 pt-1 mb-1 ${cls}`}>{children}</h4>;
    case 'H3':
      return <h5 key={key} className={`text-sm sm:text-base font-black text-amber-700 pt-1 ${cls}`}>{children}</h5>;
    case 'UL':
      return <ul key={key} className={`list-disc pr-5 space-y-1 my-1 ${cls}`}>{children}</ul>;
    case 'OL':
      return <ol key={key} className={`list-decimal pr-5 space-y-1 my-1 ${cls}`}>{children}</ol>;
    case 'LI':
      return <li key={key} className={cls}>{children}</li>;
    case 'BLOCKQUOTE':
      return (
        <blockquote key={key} className={`border-r-4 border-amber-500 bg-amber-500/10 px-3 py-1.5 my-1.5 rounded-l-xl font-bold ${cls}`}>
          {children}
        </blockquote>
      );
    case 'P':
    case 'DIV':
      return <div key={key} className={`min-h-[1.25em] ${cls}`}>{children}</div>;
    case 'SPAN':
    case 'FONT':
      return <span key={key} className={cls}>{children}</span>;
    default:
      return <span key={key}>{children}</span>;
  }
}

/**
 * Pure React rich formatted note renderer (zero dangerouslySetInnerHTML).
 * Supports both sanitized WYSIWYG HTML and legacy markdown notes.
 */
export const renderFormattedNoteText = (text: string): React.ReactNode => {
  if (!text || !text.trim()) {
    return <span className="italic text-slate-400">لا توجد تفاصيل إضافية مكتوبة...</span>;
  }

  if (isHtmlContent(text) && typeof DOMParser !== 'undefined') {
    const sanitized = sanitizeNoteHtml(text);
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${sanitized}</div>`, 'text/html');
    const root = doc.body.firstElementChild;
    if (root) {
      return (
        <div className="space-y-1">
          {Array.from(root.childNodes).map((child, idx) => domNodeToReact(child, `rich-${idx}`))}
        </div>
      );
    }
  }

  const lines = text.split(/\r?\n/);

  return (
    <div className="space-y-1">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();

        if (/^-{3,}$/.test(trimmed)) {
          return <hr key={`hr-${lineIdx}`} className="my-2.5 border-amber-300/80" />;
        }

        if (/^#\s+/.test(trimmed)) {
          return (
            <h4
              key={`h1-${lineIdx}`}
              className="text-base sm:text-lg font-black border-b-2 border-amber-300/70 pb-1 pt-1.5 mb-1"
            >
              {renderInlineFormattedParts(trimmed.replace(/^#\s+/, ''), `h1-${lineIdx}`)}
            </h4>
          );
        }

        if (/^##\s+/.test(trimmed)) {
          return (
            <h5
              key={`h2-${lineIdx}`}
              className="text-sm sm:text-base font-black text-amber-700 pt-1"
            >
              {renderInlineFormattedParts(trimmed.replace(/^##\s+/, ''), `h2-${lineIdx}`)}
            </h5>
          );
        }

        if (trimmed === '') {
          return <div key={`empty-${lineIdx}`} className="h-2" />;
        }

        return (
          <div key={`line-${lineIdx}`}>
            {renderInlineFormattedParts(line, `line-${lineIdx}`)}
          </div>
        );
      })}
    </div>
  );
};
