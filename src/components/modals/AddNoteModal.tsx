import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as math from 'mathjs';
import {
  X, Maximize2, Minimize2, Calculator, Sparkles, Plus, Trash2,
  CheckSquare, Square, Bold, Italic, Underline, Strikethrough,
  Highlighter, List, ListOrdered, Divide, Calendar, Check,
  Pin, Clock, Copy, Save, Eye, Edit3, AlignRight, AlignCenter, AlignLeft,
  FileSpreadsheet, Heading1, Equal, Type, SlidersHorizontal, Rows3,
  Quote, Eraser, Palette
} from 'lucide-react';
import type { NoteChecklistItem } from '../../db';
import {
  calculateNoteContentTotal,
  evaluateInlineExpressions,
  syncSummaryLineInContent,
  renderFormattedNoteText,
  sanitizeNoteHtml,
  htmlToPlainText,
  noteContentToEditorHtml,
  NOTE_PAPER_CLASSES,
  NOTE_FONT_SIZE_CLASSES,
  NOTE_FONT_FAMILY_CLASSES,
  NOTE_LINE_HEIGHT_CLASSES,
  getNoteBorderClass
} from '../../utils/noteFormatting';

export interface AddNoteModalProps {
  showAddNote: boolean;
  setShowAddNote: (val: boolean) => void;
  editingNoteId: number | null;
  setEditingNoteId: (val: number | null) => void;
  notes: any[];
  handleAddNote: (note: any, resetForm: () => void) => void;
}

const TEXT_COLOR_SWATCHES = [
  { label: 'أسود', hex: '#0f172a', dot: 'bg-slate-900' },
  { label: 'رمادي', hex: '#475569', dot: 'bg-slate-500' },
  { label: 'أحمر', hex: '#dc2626', dot: 'bg-red-600' },
  { label: 'أخضر', hex: '#059669', dot: 'bg-emerald-600' },
  { label: 'أزرق', hex: '#2563eb', dot: 'bg-blue-600' },
  { label: 'عنبري', hex: '#d97706', dot: 'bg-amber-600' },
  { label: 'بنفسجي', hex: '#9333ea', dot: 'bg-purple-600' },
  { label: 'وردي', hex: '#e11d48', dot: 'bg-rose-600' },
  { label: 'تركوازي', hex: '#0d9488', dot: 'bg-teal-600' },
  { label: 'برتقالي', hex: '#ea580c', dot: 'bg-orange-600' },
  { label: 'أبيض', hex: '#ffffff', dot: 'bg-white border border-slate-400' },
];

const HIGHLIGHT_SWATCHES = [
  { label: 'بدون', hex: 'transparent', cls: 'bg-slate-700 text-slate-300' },
  { label: 'أصفر', hex: '#fef08a', cls: 'bg-yellow-200 text-slate-950' },
  { label: 'أخضر', hex: '#bbf7d0', cls: 'bg-emerald-200 text-slate-950' },
  { label: 'سماوي', hex: '#bae6fd', cls: 'bg-sky-200 text-slate-950' },
  { label: 'وردي', hex: '#fecdd3', cls: 'bg-rose-200 text-slate-950' },
  { label: 'بنفسجي', hex: '#e9d5ff', cls: 'bg-purple-200 text-slate-950' },
  { label: 'عنبري', hex: '#fde68a', cls: 'bg-amber-200 text-slate-950' },
];

const INLINE_FONT_SIZES = [
  { label: 'صغير', cmdVal: '2', px: '14px' },
  { label: 'عادي', cmdVal: '3', px: '16px' },
  { label: 'متوسط', cmdVal: '4', px: '18px' },
  { label: 'كبير', cmdVal: '5', px: '22px' },
  { label: 'ضخم', cmdVal: '6', px: '26px' },
];

export const AddNoteModal: React.FC<AddNoteModalProps> = ({
  showAddNote,
  setShowAddNote,
  editingNoteId,
  setEditingNoteId,
  notes,
  handleAddNote,
}) => {
  const [isFullScreen, setIsFullScreen] = useState(true);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcMode, setCalcMode] = useState<'accounting' | 'scientific'>('accounting');
  const [showChecklistSection, setShowChecklistSection] = useState(false);
  const [showCustomizationDetails, setShowCustomizationDetails] = useState(false);
  const [showTemplatesMenu, setShowTemplatesMenu] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [calcCopied, setCalcCopied] = useState(false);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
  });

  // Note State
  const [noteState, setNoteState] = useState<{
    title: string;
    content: string;
    reminder_date: string;
    priority: 'normal' | 'high' | 'info' | 'warning';
    category: 'cashier' | 'external_account' | 'living_expenses' | 'personal_diary' | 'todo';
    color_tag: string;
    calculated_total: number;
    checklist: NoteChecklistItem[];
    is_pinned: boolean;
    paper_style: 'plain' | 'lined' | 'grid' | 'dots' | 'warm' | 'dark';
    font_size: 'sm' | 'base' | 'lg' | 'xl';
    text_align: 'right' | 'center' | 'left';
    font_family: 'sans' | 'mono' | 'serif';
    line_height: 'compact' | 'normal' | 'relaxed';
    border_style: 'gold' | 'themed' | 'double' | 'subtle';
    auto_sum: boolean;
  }>({
    title: '',
    content: '',
    reminder_date: '',
    priority: 'normal',
    category: 'cashier',
    color_tag: 'emerald',
    calculated_total: 0,
    checklist: [],
    is_pinned: false,
    paper_style: 'plain',
    font_size: 'base',
    text_align: 'right',
    font_family: 'sans',
    line_height: 'normal',
    border_style: 'gold',
    auto_sum: true,
  });

  const [newChecklistText, setNewChecklistText] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  // Calculator State
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcEquation, setCalcEquation] = useState('');
  const [calcMemory, setCalcMemory] = useState(0);
  const [isNewNumber, setIsNewNumber] = useState(false);

  const syncEditorDom = useCallback((rawContent: string) => {
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = noteContentToEditorHtml(rawContent);
      }
    }, 0);
  }, []);

  useEffect(() => {
    if (!showAddNote) return;
    setIsPreviewMode(false);
    setShowTemplatesMenu(false);

    if (editingNoteId && notes) {
      const note = notes.find((n: any) => n.id === editingNoteId);
      if (note) {
        const contentStr = note.content || '';
        const computedFromContent = calculateNoteContentTotal(contentStr);
        const inferredAutoSum =
          note.auto_sum !== undefined
            ? Boolean(note.auto_sum)
            : !(Number(note.calculated_total || 0) > 0 && computedFromContent === 0);

        const initialHtml = noteContentToEditorHtml(contentStr);
        setNoteState({
          title: note.title || '',
          content: initialHtml,
          reminder_date: note.reminder_date || '',
          priority: note.priority || 'normal',
          category: note.category || 'cashier',
          color_tag: note.color_tag || 'emerald',
          calculated_total: inferredAutoSum ? computedFromContent : (note.calculated_total || 0),
          checklist: Array.isArray(note.checklist) ? note.checklist : [],
          is_pinned: Boolean(note.is_pinned),
          paper_style: note.paper_style || 'plain',
          font_size: note.font_size || 'base',
          text_align: note.text_align || 'right',
          font_family: note.font_family || 'sans',
          line_height: note.line_height || 'normal',
          border_style: note.border_style || 'gold',
          auto_sum: inferredAutoSum,
        });
        setShowChecklistSection(Array.isArray(note.checklist) && note.checklist.length > 0);
        syncEditorDom(initialHtml);
      }
    } else {
      setNoteState({
        title: '',
        content: '',
        reminder_date: '',
        priority: 'normal',
        category: 'cashier',
        color_tag: 'emerald',
        calculated_total: 0,
        checklist: [],
        is_pinned: false,
        paper_style: 'plain',
        font_size: 'base',
        text_align: 'right',
        font_family: 'sans',
        line_height: 'normal',
        border_style: 'gold',
        auto_sum: true,
      });
      setIsFullScreen(true);
      setShowCalculator(false);
      setShowChecklistSection(false);
      syncEditorDom('');
    }
  }, [editingNoteId, notes, showAddNote, syncEditorDom]);

  const refreshActiveFormats = () => {
    try {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikeThrough: document.queryCommandState('strikeThrough'),
      });
    } catch {
      // Ignore if queryCommandState isn't ready
    }
  };

  // Reads current contentEditable DOM, sanitizes, and updates total in real time without resetting cursor
  const handleEditorInput = (forceRecalc = false) => {
    if (!editorRef.current) return;
    const rawHtml = editorRef.current.innerHTML;
    const sanitized = sanitizeNoteHtml(rawHtml);

    setNoteState((prev) => {
      if (prev.auto_sum || forceRecalc) {
        const freshTotal = calculateNoteContentTotal(sanitized);
        return {
          ...prev,
          content: sanitized,
          calculated_total: freshTotal,
        };
      }
      return {
        ...prev,
        content: sanitized,
      };
    });
    refreshActiveFormats();
  };

  // Updates content programmatically AND refreshes the DOM (used by templates, calc insert, evaluate)
  const updateContentAndDom = (nextContent: string, forceRecalc = false) => {
    const editorHtml = noteContentToEditorHtml(nextContent);
    setNoteState((prev) => {
      if (prev.auto_sum || forceRecalc) {
        const freshTotal = calculateNoteContentTotal(editorHtml);
        const synced = syncSummaryLineInContent(editorHtml, freshTotal);
        syncEditorDom(synced);
        return {
          ...prev,
          content: synced,
          calculated_total: freshTotal,
        };
      }
      syncEditorDom(editorHtml);
      return {
        ...prev,
        content: editorHtml,
      };
    });
  };

  // Applies true WYSIWYG formatting directly inside the editor without any markdown symbols
  const execWysiwygCommand = (command: string, value?: string) => {
    if (isPreviewMode) {
      setIsPreviewMode(false);
      setTimeout(() => {
        editorRef.current?.focus();
        try {
          document.execCommand(command, false, value);
          handleEditorInput();
        } catch {
          // ignore
        }
      }, 20);
      return;
    }

    if (editorRef.current && document.activeElement !== editorRef.current) {
      editorRef.current.focus();
    }

    try {
      document.execCommand('styleWithCSS', false, 'true');
    } catch {
      // some browsers ignore styleWithCSS
    }
    try {
      document.execCommand(command, false, value);
    } catch {
      // fallback noop
    }
    handleEditorInput();
  };

  const handleApplyTextColor = (hex: string) => {
    execWysiwygCommand('foreColor', hex);
  };

  const handleApplyHighlightColor = (hex: string) => {
    if (hex === 'transparent') {
      execWysiwygCommand('hiliteColor', 'transparent');
      return;
    }
    execWysiwygCommand('hiliteColor', hex);
  };

  const handleApplyInlineFontSize = (cmdVal: string) => {
    execWysiwygCommand('fontSize', cmdVal);
  };

  const handleInsertDivider = () => {
    execWysiwygCommand('insertHTML', '<hr><div><br></div>');
  };

  const handleInsertPinBadge = () => {
    const sel = window.getSelection();
    const selectedText = sel && sel.toString().trim() ? sel.toString().trim() : 'ملاحظة مهمة';
    const safeText = selectedText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    execWysiwygCommand(
      'insertHTML',
      `<span data-note-badge="pin" style="background-color:#fde68a;color:#92400e">📌 ${safeText}</span>&nbsp;`
    );
  };

  const handleInsertDateTime = () => {
    const now = new Date();
    const stamp = `${now.toLocaleDateString('ar-SA')} ${now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}`;
    execWysiwygCommand('insertText', `📅 ${stamp} `);
  };

  const handleToggleHeading = () => {
    const sel = window.getSelection();
    const parentBlock = sel?.anchorNode
      ? (sel.anchorNode.nodeType === Node.ELEMENT_NODE
          ? (sel.anchorNode as HTMLElement)
          : sel.anchorNode.parentElement)?.closest('h1,h2,h3')
      : null;
    if (parentBlock) {
      execWysiwygCommand('formatBlock', 'DIV');
    } else {
      execWysiwygCommand('formatBlock', 'H2');
    }
  };

  const handleToggleQuote = () => {
    const sel = window.getSelection();
    const parentQuote = sel?.anchorNode
      ? (sel.anchorNode.nodeType === Node.ELEMENT_NODE
          ? (sel.anchorNode as HTMLElement)
          : sel.anchorNode.parentElement)?.closest('blockquote')
      : null;
    if (parentQuote) {
      execWysiwygCommand('formatBlock', 'DIV');
    } else {
      execWysiwygCommand('formatBlock', 'BLOCKQUOTE');
    }
  };

  const handleClearSelectionFormat = () => {
    execWysiwygCommand('removeFormat');
  };

  // --- Advanced Calculator Logic Powered by Mathjs ---
  const handleCalcNumber = (num: string) => {
    if (isNewNumber) {
      if (calcEquation.endsWith('=')) setCalcEquation('');
      setCalcDisplay(num);
      setIsNewNumber(false);
    } else {
      setCalcDisplay((prev) => (prev === '0' || prev === 'Error' ? num : prev + num));
    }
  };

  const handleCalcDecimal = () => {
    if (isNewNumber) {
      if (calcEquation.endsWith('=')) setCalcEquation('');
      setCalcDisplay('0.');
      setIsNewNumber(false);
    } else if (!calcDisplay.includes('.')) {
      setCalcDisplay((prev) => prev + '.');
    }
  };

  const handleCalcOp = (op: string) => {
    if (calcEquation.endsWith('=')) {
      setCalcEquation(calcDisplay + ' ' + op + ' ');
    } else {
      setCalcEquation((prev) => prev + calcDisplay + ' ' + op + ' ');
    }
    setIsNewNumber(true);
  };

  const handleCalcEquals = () => {
    try {
      let rawExpr = calcEquation.endsWith('=')
        ? calcDisplay
        : (calcEquation + (isNewNumber ? '' : calcDisplay)).trim();
      if (!rawExpr) rawExpr = calcDisplay;

      const openCount = (rawExpr.match(/\(/g) || []).length;
      const closeCount = (rawExpr.match(/\)/g) || []).length;
      if (openCount > closeCount) rawExpr += ')'.repeat(openCount - closeCount);

      const fullExpr = rawExpr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, 'pi')
        .replace(/–/g, '-');

      const result = math.evaluate(fullExpr);
      if (typeof result === 'number') {
        const rounded = Math.round(result * 100000) / 100000;
        setCalcDisplay(String(rounded));
        setCalcEquation(`${rawExpr} =`);
      } else if (result !== undefined && result !== null) {
        setCalcDisplay(result.toString());
        setCalcEquation(`${rawExpr} =`);
      } else {
        setCalcDisplay('0');
        setCalcEquation('');
      }
      setIsNewNumber(true);
    } catch {
      setCalcDisplay('Error');
    }
  };

  const handleCalcOpenParen = () => {
    if (calcEquation.endsWith('=')) {
      setCalcEquation('(');
      setCalcDisplay('0');
    } else if (!isNewNumber && calcDisplay !== '0' && calcDisplay !== 'Error') {
      setCalcEquation((prev) => prev + calcDisplay + ' × (');
      setCalcDisplay('0');
    } else {
      setCalcEquation((prev) => prev + '(');
    }
    setIsNewNumber(true);
  };

  const handleCalcCloseParen = () => {
    if (calcEquation.endsWith('=')) return;
    const currentVal = !isNewNumber && calcDisplay !== '0' && calcDisplay !== 'Error' ? calcDisplay : '';
    setCalcEquation((prev) => prev + currentVal + ') ');
    setIsNewNumber(true);
  };

  const handleCalcToFraction = () => {
    try {
      const num = Number(calcDisplay);
      if (!isNaN(num) && num !== 0) {
        const frac: any = math.fraction(num);
        if (Number(frac.d) !== 1) {
          const sign = frac.s < 0 ? '-' : '';
          const fracStr = `${sign}${frac.n}/${frac.d}`;
          setCalcDisplay(fracStr);
          setCalcEquation(`${num} = ${fracStr}`);
        } else {
          handleCalcOp('÷');
        }
        setIsNewNumber(true);
      } else {
        handleCalcOp('÷');
      }
    } catch {
      handleCalcOp('÷');
    }
  };

  const getLiveEquationDisplay = () => {
    if (calcEquation.endsWith('=')) return calcEquation;
    if (calcEquation) {
      if (!isNewNumber && calcDisplay !== '0' && calcDisplay !== 'Error') return `${calcEquation}${calcDisplay}`;
      return calcEquation;
    }
    if (calcDisplay !== '0' && calcDisplay !== 'Error') return calcDisplay;
    return 'جاهزة';
  };

  const handleCalcClearEntry = () => setCalcDisplay('0');
  const handleCalcAllClear = () => {
    setCalcDisplay('0');
    setCalcEquation('');
  };
  const handleCalcBackspace = () => setCalcDisplay((prev) => (prev.length > 1 && prev !== 'Error' ? prev.slice(0, -1) : '0'));
  const handleCalcToggleSign = () => {
    const num = Number(calcDisplay);
    if (!isNaN(num)) setCalcDisplay(String(-num));
  };
  const handleCalcPercentage = () => {
    const num = Number(calcDisplay);
    if (!isNaN(num)) setCalcDisplay(String(num / 100));
  };
  const handleCalcAddTax15 = () => {
    const num = Number(calcDisplay);
    if (!isNaN(num)) {
      setCalcEquation(`${num} + 15% ض.ق.م = `);
      setCalcDisplay(String(Math.round(num * 1.15 * 100) / 100));
      setIsNewNumber(true);
    }
  };
  const handleCalcRemoveTax15 = () => {
    const num = Number(calcDisplay);
    if (!isNaN(num)) {
      setCalcEquation(`${num} - 15% ض.ق.م = `);
      setCalcDisplay(String(Math.round((num / 1.15) * 100) / 100));
      setIsNewNumber(true);
    }
  };
  const handleCalcTaxOnly15 = () => {
    const num = Number(calcDisplay);
    if (!isNaN(num)) {
      setCalcEquation(`ضريبة 15% من ${num} = `);
      setCalcDisplay(String(Math.round(num * 0.15 * 100) / 100));
      setIsNewNumber(true);
    }
  };
  const handleCalcSqrt = () => {
    try {
      const num = Number(calcDisplay);
      if (!isNaN(num) && num >= 0) {
        const res = math.sqrt(num);
        setCalcEquation(`√(${num}) = `);
        setCalcDisplay(String(typeof res === 'number' ? Math.round(res * 100000) / 100000 : res.toString()));
        setIsNewNumber(true);
      } else setCalcDisplay('Error');
    } catch {
      setCalcDisplay('Error');
    }
  };
  const handleCalcCbrt = () => {
    try {
      const num = Number(calcDisplay);
      if (!isNaN(num)) {
        setCalcEquation(`∛(${num}) = `);
        setCalcDisplay(String(Math.round(Number(math.cbrt(num)) * 100000) / 100000));
        setIsNewNumber(true);
      }
    } catch {
      setCalcDisplay('Error');
    }
  };
  const handleCalcPowerY = () => {
    setCalcEquation((prev) => prev + calcDisplay + ' ^ ');
    setIsNewNumber(true);
  };
  const handleCalcSquare = () => {
    try {
      const num = Number(calcDisplay);
      if (!isNaN(num)) {
        setCalcEquation(`sqr(${num}) = `);
        setCalcDisplay(String(Math.round(Number(math.pow(num, 2)) * 100000) / 100000));
        setIsNewNumber(true);
      }
    } catch {
      setCalcDisplay('Error');
    }
  };
  const handleCalcLn = () => {
    try {
      const num = Number(calcDisplay);
      if (!isNaN(num) && num > 0) {
        setCalcEquation(`ln(${num}) = `);
        setCalcDisplay(String(Math.round(Number(math.log(num)) * 100000) / 100000));
        setIsNewNumber(true);
      } else setCalcDisplay('Error');
    } catch {
      setCalcDisplay('Error');
    }
  };
  const handleCalcLog10 = () => {
    try {
      const num = Number(calcDisplay);
      if (!isNaN(num) && num > 0) {
        setCalcEquation(`log10(${num}) = `);
        setCalcDisplay(String(Math.round(Number(math.log10(num)) * 100000) / 100000));
        setIsNewNumber(true);
      } else setCalcDisplay('Error');
    } catch {
      setCalcDisplay('Error');
    }
  };
  const handleCalcExp10 = () => {
    try {
      const num = Number(calcDisplay);
      if (!isNaN(num)) {
        setCalcEquation(`10^(${num}) = `);
        setCalcDisplay(String(math.pow(10, num)));
        setIsNewNumber(true);
      }
    } catch {
      setCalcDisplay('Error');
    }
  };
  const handleCalcExpE = () => {
    try {
      const num = Number(calcDisplay);
      if (!isNaN(num)) {
        setCalcEquation(`e^(${num}) = `);
        setCalcDisplay(String(Math.round(Number(math.exp(num)) * 100000) / 100000));
        setIsNewNumber(true);
      }
    } catch {
      setCalcDisplay('Error');
    }
  };
  const handleCalcSin = () => {
    try {
      const num = Number(calcDisplay);
      if (!isNaN(num)) {
        setCalcEquation(`sin(${num}) = `);
        setCalcDisplay(String(Math.round(Number(math.sin(num)) * 100000) / 100000));
        setIsNewNumber(true);
      }
    } catch {
      setCalcDisplay('Error');
    }
  };
  const handleCalcCos = () => {
    try {
      const num = Number(calcDisplay);
      if (!isNaN(num)) {
        setCalcEquation(`cos(${num}) = `);
        setCalcDisplay(String(Math.round(Number(math.cos(num)) * 100000) / 100000));
        setIsNewNumber(true);
      }
    } catch {
      setCalcDisplay('Error');
    }
  };
  const handleCalcTan = () => {
    try {
      const num = Number(calcDisplay);
      if (!isNaN(num)) {
        setCalcEquation(`tan(${num}) = `);
        setCalcDisplay(String(Math.round(Number(math.tan(num)) * 100000) / 100000));
        setIsNewNumber(true);
      }
    } catch {
      setCalcDisplay('Error');
    }
  };
  const handleCalcFactorial = () => {
    try {
      const num = Number(calcDisplay);
      if (!isNaN(num) && num >= 0 && Number.isInteger(num) && num <= 100) {
        setCalcEquation(`fact(${num}) = `);
        setCalcDisplay(String(math.factorial(num)));
        setIsNewNumber(true);
      } else setCalcDisplay('Error');
    } catch {
      setCalcDisplay('Error');
    }
  };
  const handleCalcAbs = () => {
    try {
      const num = Number(calcDisplay);
      if (!isNaN(num)) {
        setCalcEquation(`abs(${num}) = `);
        setCalcDisplay(String(math.abs(num)));
        setIsNewNumber(true);
      }
    } catch {
      setCalcDisplay('Error');
    }
  };
  const handleCalcReciprocal = () => {
    const num = Number(calcDisplay);
    if (!isNaN(num) && num !== 0) {
      setCalcEquation(`1/(${num}) = `);
      setCalcDisplay(String(Math.round((1 / num) * 100000) / 100000));
      setIsNewNumber(true);
    }
  };

  const handleCalcMemoryClear = () => setCalcMemory(0);
  const handleCalcMemoryRecall = () => {
    setCalcDisplay(String(calcMemory));
    setIsNewNumber(true);
  };
  const handleCalcMemoryAdd = () => {
    const num = Number(calcDisplay);
    if (!isNaN(num)) setCalcMemory((prev) => prev + num);
  };
  const handleCalcMemorySub = () => {
    const num = Number(calcDisplay);
    if (!isNaN(num)) setCalcMemory((prev) => prev - num);
  };

  const handleInsertCalcResult = () => {
    const formatted = `${calcDisplay} ريال `;
    if (!isPreviewMode && editorRef.current) {
      editorRef.current.focus();
      execWysiwygCommand('insertHTML', `<span style="color:#059669"><b>${formatted}</b></span>`);
    } else {
      const next = `${noteState.content}<div><span style="color:#059669"><b>${formatted}</b></span></div>`;
      updateContentAndDom(next, true);
    }
  };

  const handleCopyCalcResult = () => {
    navigator.clipboard.writeText(calcDisplay);
    setCalcCopied(true);
    setTimeout(() => setCalcCopied(false), 2000);
  };

  // Evaluate inline expressions & update live calculated total cleanly
  const handleAutoSumContentNumbers = () => {
    const currentHtml = editorRef.current ? sanitizeNoteHtml(editorRef.current.innerHTML) : noteState.content;
    const { updatedContent } = evaluateInlineExpressions(currentHtml);
    const total = calculateNoteContentTotal(updatedContent);
    const summaryBannerHtml = `<div><span style="background-color:#bbf7d0;color:#059669"><b>الإجمالي المحسوب: ${total.toLocaleString('ar-SA')} ريال</b></span></div>`;
    const nextContent = updatedContent.includes('الإجمالي المحسوب:')
      ? syncSummaryLineInContent(updatedContent, total)
      : htmlToPlainText(updatedContent).trim()
        ? `${updatedContent}${summaryBannerHtml}`
        : '';

    setNoteState((prev) => ({
      ...prev,
      auto_sum: true,
      calculated_total: total,
      content: nextContent,
    }));
    syncEditorDom(nextContent);
  };

  // High-Quality Professional Template Loader (WYSIWYG visual HTML directly)
  const handleApplyTemplate = (type: string) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('ar-SA');
    const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    let tTitle = '';
    let tContent = '';
    let tCategory: typeof noteState.category = 'cashier';
    let tChecklist: NoteChecklistItem[] = [];

    switch (type) {
      case 'cashier_shift':
        tTitle = `تسليم وردية الصندوق - ${dateStr}`;
        tContent = `# 🏦 تقرير تسليم وردية الصندوق اليومي\n----------------------------------------\n📅 التاريخ والوقت: ${dateStr} - ${timeStr}\n• العهدة الافتتاحية بالدرج: 0\n• إجمالي المبيعات النقدية: 0\n• مبيعات الشبكة / التحويلات: 0\n• المصروفات النثرية والمسحوبات: 0\n\n## 📌 ملخص الصندوق والنقدية\n• النقدية الفعلية المسلمة: 0\n• فارق الوردية (عجز / زيادة): 0\n\n📝 ملاحظات موظف الصندوق:\n`;
        tCategory = 'cashier';
        tChecklist = [
          { id: '1', text: 'مطابقة تقرير الشبكة (POS) مع البنك', done: false },
          { id: '2', text: 'عد النقدية وتجنيب عهدة الوردية القادمة', done: false },
          { id: '3', text: 'تجهيز المبلغ للإيداع وتوقيع المستلم', done: false },
        ];
        break;
      case 'external_deal':
        tTitle = `حساب ومعاملة خارجية - ${dateStr}`;
        tContent = `# 💼 بيان معاملة وحساب خارجي\n----------------------------------------\n👤 اسم العميل / الجهة: \n📞 رقم الجوال / المرجع: \n📅 موعد الاستحقاق والسداد: \n\n## 📊 التفاصيل المالية\n• إجمالي المبلغ المتفق عليه: 0\n• الدفعة الأولى المقبوضة: 0\n• المتبقي المترتب بالحساب: 0\n\n📄 بنود وشروط الاتفاقية:\n• \n`;
        tCategory = 'external_account';
        tChecklist = [
          { id: '1', text: 'توقيع وتوثيق عقد المعاملة', done: false },
          { id: '2', text: 'تحصيل الدفعة المقدمة وإصدار سند', done: false },
          { id: '3', text: 'جدولة باقي المستحقات والمتابعة', done: false },
        ];
        break;
      case 'living_expenses':
        tTitle = `جدول المصاريف والنفقات المعيشية - ${dateStr}`;
        tContent = `# 🏠 ميزانية ونفقات المعيشة\n----------------------------------------\n• إيجار / فواتير الخدمة (كهرباء/ماء): 0\n• مشتريات السوبرماركت والمنزل: 0\n• الوقود، الصيانة والنقل: 0\n• مصاريف شخصية ومتفرقة: 0\n\n💡 ملاحظات ترشيد الميزانية:\n`;
        tCategory = 'living_expenses';
        tChecklist = [
          { id: '1', text: 'سداد الفواتير الحكومية والشهرية', done: false },
          { id: '2', text: 'تأمين احتياجات المطبخ والمنزل', done: false },
          { id: '3', text: 'رصد المتبقي في الادخار', done: false },
        ];
        break;
      case 'diary_idea':
        tTitle = `مذكرات وخواطر يومية - ${dateStr}`;
        tContent = `# 📖 تدوين خواطر وأفكار يومية\n----------------------------------------\n⏰ الوقت: ${timeStr}\n🌟 فكرة / إنجاز اليوم:\n\n💬 الخاطرة أو التدوين الحر:\n\n🎯 دروس وتوصيات للغد:\n`;
        tCategory = 'personal_diary';
        break;
      case 'todo_list':
        tTitle = `قائمة المهام والمتابعات اليومية - ${dateStr}`;
        tContent = `# 📋 قائمة متابعة الأعمال والمهام\n----------------------------------------\n🎯 أهداف اليوم الأساسية:\n• \n\n📌 المتابعات الهامة:\n• \n`;
        tCategory = 'todo';
        tChecklist = [
          { id: '1', text: 'مراجعة الحسابات والتسويات اليومية', done: false },
          { id: '2', text: 'التواصل مع الموردين ومتابعة الطلبات', done: false },
          { id: '3', text: 'أخذ نسخة احتياطية وآمنة للبيانات', done: false },
        ];
        break;
      default:
        return;
    }

    const htmlTemplate = noteContentToEditorHtml(tContent);
    const total = calculateNoteContentTotal(htmlTemplate);
    setNoteState((prev) => ({
      ...prev,
      title: prev.title.trim() ? prev.title : tTitle,
      content: htmlTemplate,
      category: tCategory,
      calculated_total: prev.auto_sum ? total : prev.calculated_total,
      checklist: tChecklist.length > 0 ? tChecklist : prev.checklist,
    }));
    if (tChecklist.length > 0) setShowChecklistSection(true);
    setShowTemplatesMenu(false);
    setIsPreviewMode(false);
    syncEditorDom(htmlTemplate);
  };

  // Checklist Actions
  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    const newItem: NoteChecklistItem = {
      id: Date.now().toString(),
      text: newChecklistText.trim(),
      done: false,
    };
    setNoteState((prev) => ({ ...prev, checklist: [...prev.checklist, newItem] }));
    setNewChecklistText('');
  };

  const handleToggleCheckItem = (id: string) => {
    setNoteState((prev) => ({
      ...prev,
      checklist: prev.checklist.map((item) => (item.id === id ? { ...item, done: !item.done } : item)),
    }));
  };

  const handleRemoveCheckItem = (id: string) => {
    setNoteState((prev) => ({
      ...prev,
      checklist: prev.checklist.filter((item) => item.id !== id),
    }));
  };

  const handleSave = () => {
    const latestHtml = editorRef.current ? sanitizeNoteHtml(editorRef.current.innerHTML) : noteState.content;
    const plainContent = htmlToPlainText(latestHtml);
    if (!noteState.title.trim() && !plainContent.trim()) return;

    const finalTotal = noteState.auto_sum
      ? calculateNoteContentTotal(latestHtml)
      : noteState.calculated_total;
    const syncedContent = noteState.auto_sum
      ? syncSummaryLineInContent(latestHtml, finalTotal)
      : latestHtml;

    const noteData = {
      title: noteState.title.trim() || 'ملاحظة بدون عنوان',
      content: syncedContent.trim(),
      reminder_date: noteState.reminder_date || null,
      priority: noteState.priority,
      category: noteState.category,
      color_tag: noteState.color_tag,
      calculated_total: finalTotal,
      checklist: noteState.checklist,
      is_pinned: noteState.is_pinned,
      paper_style: noteState.paper_style,
      font_size: noteState.font_size,
      text_align: noteState.text_align,
      font_family: noteState.font_family,
      line_height: noteState.line_height,
      border_style: noteState.border_style,
      auto_sum: noteState.auto_sum,
      is_completed: false,
    };

    handleAddNote(noteData, () => {
      setShowAddNote(false);
      setEditingNoteId(null);
      setNoteState({
        title: '',
        content: '',
        reminder_date: '',
        priority: 'normal',
        category: 'cashier',
        color_tag: 'emerald',
        calculated_total: 0,
        checklist: [],
        is_pinned: false,
        paper_style: 'plain',
        font_size: 'base',
        text_align: 'right',
        font_family: 'sans',
        line_height: 'normal',
        border_style: 'gold',
        auto_sum: true,
      });
      setShowCalculator(false);
      setShowChecklistSection(false);
      setShowCustomizationDetails(false);
    });
  };

  if (!showAddNote) return null;

  const categoriesList = [
    { key: 'cashier', label: '🏦 وردية الصندوق', color: 'emerald' },
    { key: 'external_account', label: '💼 حسابات خارجية', color: 'sky' },
    { key: 'living_expenses', label: '🏠 مصاريف معيشة', color: 'purple' },
    { key: 'personal_diary', label: '📖 مذكرات وخواطر', color: 'amber' },
    { key: 'todo', label: '📋 قائمة مهام', color: 'rose' },
  ];

  const colorPalette = [
    { id: 'emerald', bg: 'bg-emerald-500', name: 'زمردي' },
    { id: 'sky', bg: 'bg-sky-500', name: 'سماوي' },
    { id: 'indigo', bg: 'bg-indigo-500', name: 'نيلي' },
    { id: 'teal', bg: 'bg-teal-500', name: 'تركوازي' },
    { id: 'purple', bg: 'bg-purple-500', name: 'بنفسجي' },
    { id: 'amber', bg: 'bg-amber-500', name: 'عنبري' },
    { id: 'rose', bg: 'bg-rose-500', name: 'وردي' },
    { id: 'slate', bg: 'bg-slate-700', name: 'كلاسيكي' },
  ];

  const activePaperClass = NOTE_PAPER_CLASSES[noteState.paper_style] || NOTE_PAPER_CLASSES.plain;
  const activeFontClass = NOTE_FONT_SIZE_CLASSES[noteState.font_size] || NOTE_FONT_SIZE_CLASSES.base;
  const activeFamilyClass = NOTE_FONT_FAMILY_CLASSES[noteState.font_family] || NOTE_FONT_FAMILY_CLASSES.sans;
  const activeLineHeightClass = NOTE_LINE_HEIGHT_CLASSES[noteState.line_height] || NOTE_LINE_HEIGHT_CLASSES.normal;
  const activeAlignClass =
    noteState.text_align === 'center'
      ? 'text-center'
      : noteState.text_align === 'left'
      ? 'text-left'
      : 'text-right';
  const activeCanvasBorder = getNoteBorderClass(noteState.border_style, noteState.color_tag);
  const plainTextLength = htmlToPlainText(noteState.content).length;

  return (
    <div
      className={`fixed inset-0 bg-slate-950/85 backdrop-blur-xs z-50 flex items-center justify-center ${
        isFullScreen ? 'p-0' : 'p-2 sm:p-4'
      }`}
    >
      <div
        className={`bg-white text-right shadow-2xl flex flex-col overflow-hidden border-2 border-amber-400/90 ring-1 ring-amber-300/40 relative ${
          isFullScreen
            ? 'w-full h-full rounded-none'
            : 'w-full max-w-5xl h-[94vh] max-h-[950px] rounded-3xl'
        }`}
      >
        {/* TOP COMPACT HEADER & UNIFIED TOOLBAR */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white border-b border-amber-500/40 shrink-0 select-none">
          <div className="px-3 py-2 sm:px-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title={isFullScreen ? 'تصغير' : 'ملء الشاشة'}
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddNote(false);
                  setEditingNoteId(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-rose-500/30 transition-colors cursor-pointer"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 shadow-sm shrink-0 ml-1"
                title="حفظ الملاحظة فوراً"
              >
                <Save className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{editingNoteId ? 'حفظ التعديل' : 'حفظ'}</span>
              </button>
            </div>

            <div className="bg-slate-900/95 border border-amber-400/40 px-2 py-0.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto no-scrollbar shadow-inner shadow-slate-950/80 backdrop-blur-xs">
              <select
                value={noteState.category}
                onChange={(e) => {
                  const cat = categoriesList.find((c) => c.key === e.target.value);
                  setNoteState((prev) => ({
                    ...prev,
                    category: e.target.value as any,
                    color_tag: cat ? cat.color : prev.color_tag,
                  }));
                }}
                className="h-7 bg-slate-800 text-amber-300 hover:bg-slate-700 border border-amber-500/40 rounded-xl px-2.5 py-0.5 text-[11px] font-black outline-none cursor-pointer shrink-0 transition-colors"
              >
                {categoriesList.map((c) => (
                  <option key={c.key} value={c.key} className="bg-slate-900 text-white">
                    {c.label}
                  </option>
                ))}
              </select>

              {/* Dedicated Customization Details Button */}
              <button
                type="button"
                onClick={() => setShowCustomizationDetails(!showCustomizationDetails)}
                className={`h-7 px-2.5 rounded-xl text-[11px] font-black flex items-center gap-1 transition-colors cursor-pointer border shrink-0 ${
                  showCustomizationDetails
                    ? 'bg-purple-500 text-white border-purple-400 shadow-xs'
                    : 'bg-slate-800 text-purple-300 hover:bg-slate-700 border-purple-500/40'
                }`}
                title="عرض تفاصيل التخصيص الشاملة (الألوان، الخطوط، التظليل، الورقة، الإطار)"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>تفاصيل التخصيص</span>
              </button>

              <button
                type="button"
                onClick={() => setShowTemplatesMenu(!showTemplatesMenu)}
                className={`h-7 px-2.5 rounded-xl text-[11px] font-black flex items-center gap-1 transition-colors cursor-pointer border shrink-0 ${
                  showTemplatesMenu
                    ? 'bg-sky-500 text-slate-950 border-sky-400'
                    : 'bg-slate-800 text-sky-300 hover:bg-slate-700 border-slate-700'
                }`}
                title="إدراج قالب جاهز"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>قوالب</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCalculator(!showCalculator)}
                className={`h-7 px-2.5 rounded-xl text-[11px] font-black flex items-center gap-1 transition-colors cursor-pointer border shrink-0 ${
                  showCalculator
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-xs'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-700'
                }`}
                title="فتح / إغلاق الآلة الحاسبة"
              >
                <Calculator className="w-3.5 h-3.5 text-amber-300" />
                <span>آلة حاسبة</span>
              </button>

              <button
                type="button"
                onClick={() => setNoteState((prev) => ({ ...prev, is_pinned: !prev.is_pinned }))}
                className={`h-7 px-2.5 rounded-xl text-[11px] font-black flex items-center gap-1 transition-colors cursor-pointer border shrink-0 ${
                  noteState.is_pinned
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-slate-800 text-slate-300 hover:text-slate-100 border-slate-700'
                }`}
                title={noteState.is_pinned ? 'مثبتة في الأعلى' : 'تثبيت الملاحظة'}
              >
                <Pin className={`w-3.5 h-3.5 ${noteState.is_pinned ? 'fill-amber-400 rotate-45 text-amber-300' : ''}`} />
                <span>{noteState.is_pinned ? 'مثبتة' : 'تثبيت'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowChecklistSection(!showChecklistSection)}
                className={`h-7 px-2.5 rounded-xl text-[11px] font-black flex items-center gap-1 transition-colors cursor-pointer border shrink-0 ${
                  showChecklistSection || noteState.checklist.length > 0
                    ? 'bg-indigo-900/60 text-indigo-300 border-indigo-700'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                }`}
                title="قائمة مهام Checklist"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>مهام</span>
                {noteState.checklist.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-indigo-500 text-white rounded-full text-[9px] font-black">
                    {noteState.checklist.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  const nextAuto = !noteState.auto_sum;
                  const currentContent = editorRef.current ? sanitizeNoteHtml(editorRef.current.innerHTML) : noteState.content;
                  setNoteState((prev) => ({
                    ...prev,
                    auto_sum: nextAuto,
                    calculated_total: nextAuto ? calculateNoteContentTotal(currentContent) : prev.calculated_total,
                  }));
                }}
                className={`h-7 px-2.5 rounded-xl text-[11px] font-black flex items-center gap-1 shrink-0 border transition-colors cursor-pointer ${
                  noteState.auto_sum
                    ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
                title={noteState.auto_sum ? 'التجميع التلقائي مفعّل (اضغط لتعطيله)' : 'التجميع التلقائي معطّل (اضغط لتفعيله)'}
              >
                <Sparkles className={`w-3 h-3 ${noteState.auto_sum ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span className="font-mono">
                  {noteState.calculated_total !== 0
                    ? `${noteState.calculated_total.toLocaleString('ar-SA')} ريال`
                    : noteState.auto_sum
                    ? 'تجميع تلقائي'
                    : 'يدوي'}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const nextPreview = !isPreviewMode;
                  setIsPreviewMode(nextPreview);
                  if (!nextPreview) {
                    syncEditorDom(noteState.content);
                  }
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1 transition-colors cursor-pointer border ${
                  isPreviewMode
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-700'
                }`}
                title={isPreviewMode ? 'العودة إلى الكتابة والتعديل' : 'عرض القراءة النهائية'}
              >
                {isPreviewMode ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-amber-300" />}
                <span className="hidden md:inline">{isPreviewMode ? 'تحرير' : 'عرض نهائي'}</span>
              </button>
            </div>
          </div>

          {/* Templates Strip */}
          {showTemplatesMenu && (
            <div className="px-3 py-2 bg-slate-900 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
              <span className="text-sky-300 font-black shrink-0 ml-1">قوالب سريعة:</span>
              <button type="button" onClick={() => handleApplyTemplate('cashier_shift')} className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-600/30 border border-slate-700 text-emerald-300 font-bold shrink-0 cursor-pointer">🏦 تسليم وردية</button>
              <button type="button" onClick={() => handleApplyTemplate('external_deal')} className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-sky-600/30 border border-slate-700 text-sky-300 font-bold shrink-0 cursor-pointer">💼 معاملة خارجية</button>
              <button type="button" onClick={() => handleApplyTemplate('living_expenses')} className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-purple-600/30 border border-slate-700 text-purple-300 font-bold shrink-0 cursor-pointer">🏠 مصاريف معيشة</button>
              <button type="button" onClick={() => handleApplyTemplate('todo_list')} className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-600/30 border border-slate-700 text-rose-300 font-bold shrink-0 cursor-pointer">📋 قائمة مهام</button>
              <button type="button" onClick={() => handleApplyTemplate('diary_idea')} className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-600/30 border border-slate-700 text-amber-300 font-bold shrink-0 cursor-pointer">📖 يوميات وخواطر</button>
            </div>
          )}

          {/* EXPANDED CUSTOMIZATION DETAILS PANEL ("تفاصيل التخصيص") */}
          {showCustomizationDetails && (
            <div className="px-3 py-2.5 bg-slate-900/98 border-t border-purple-500/40 space-y-2 text-[11px] max-h-56 overflow-y-auto no-scrollbar">
              {/* Row 1: Direct WYSIWYG Selection Formatting (Text Color, Highlight, Inline Font Size) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                {/* Text Color Swatches */}
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-purple-300 flex items-center gap-1">
                      <Palette className="w-3 h-3" /> لون النص المحدد (مباشر):
                    </span>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleClearSelectionFormat}
                      className="text-[9.5px] text-slate-300 hover:text-white bg-slate-700 px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer"
                      title="إزالة تنسيق النص المحدد"
                    >
                      <Eraser className="w-2.5 h-2.5" /> مسح التنسيق
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {TEXT_COLOR_SWATCHES.map((sw) => (
                      <button
                        key={sw.hex}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleApplyTextColor(sw.hex)}
                        className={`w-5 h-5 rounded-full ${sw.dot} hover:scale-125 transition-transform cursor-pointer ring-1 ring-white/20`}
                        title={`تلوين النص باللون ${sw.label}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Highlight Swatches */}
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-2 space-y-1">
                  <span className="text-[10px] font-black text-yellow-300 flex items-center gap-1">
                    <Highlighter className="w-3 h-3" /> تظليل خلفية النص:
                  </span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {HIGHLIGHT_SWATCHES.map((hl) => (
                      <button
                        key={hl.hex}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleApplyHighlightColor(hl.hex)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-black cursor-pointer border border-white/10 hover:scale-105 transition-transform ${hl.cls}`}
                        title={`تظليل: ${hl.label}`}
                      >
                        {hl.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Inline Font Size for Selected Text */}
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-2 space-y-1">
                  <span className="text-[10px] font-black text-sky-300 flex items-center gap-1">
                    <Type className="w-3 h-3" /> حجم الجزء المحدد من النص:
                  </span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {INLINE_FONT_SIZES.map((sz) => (
                      <button
                        key={sz.cmdVal}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleApplyInlineFontSize(sz.cmdVal)}
                        className="px-2 py-0.5 rounded-lg bg-slate-700 hover:bg-sky-500 hover:text-slate-950 text-slate-200 font-black text-[10px] cursor-pointer transition-colors"
                      >
                        {sz.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 2: Paper Background, Global Typography, Spacing & Border Styles */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                {/* Paper Background (6 Styles) */}
                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 flex-wrap">
                  <span className="text-[10px] text-amber-300 font-black px-1 flex items-center gap-1">
                    <Rows3 className="w-3 h-3" /> الورقة:
                  </span>
                  {[
                    { id: 'plain', label: 'عادي' },
                    { id: 'lined', label: 'مسطّر' },
                    { id: 'grid', label: 'مربعات' },
                    { id: 'dots', label: 'منقّط' },
                    { id: 'warm', label: 'كريمي' },
                    { id: 'dark', label: 'ليلي' },
                  ].map((ps) => (
                    <button
                      key={ps.id}
                      type="button"
                      onClick={() => setNoteState((prev) => ({ ...prev, paper_style: ps.id as any }))}
                      className={`px-2 py-0.5 rounded-lg font-black transition-colors cursor-pointer text-[10px] ${
                        noteState.paper_style === ps.id ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {ps.label}
                    </button>
                  ))}
                </div>

                {/* Font Family */}
                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-emerald-300 font-black px-1">نوع الخط:</span>
                  {[
                    { id: 'sans', label: 'عصري' },
                    { id: 'mono', label: 'رقمي/حسابي' },
                    { id: 'serif', label: 'كلاسيكي' },
                  ].map((ff) => (
                    <button
                      key={ff.id}
                      type="button"
                      onClick={() => setNoteState((prev) => ({ ...prev, font_family: ff.id as any }))}
                      className={`px-2 py-0.5 rounded-lg font-black transition-colors cursor-pointer text-[10px] ${
                        noteState.font_family === ff.id ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {ff.label}
                    </button>
                  ))}
                </div>

                {/* Global Font Size */}
                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-sky-300 font-black px-1">الحجم العام:</span>
                  {[
                    { id: 'sm', label: 'صغير' },
                    { id: 'base', label: 'وسط' },
                    { id: 'lg', label: 'كبير' },
                    { id: 'xl', label: 'ضخم' },
                  ].map((fs) => (
                    <button
                      key={fs.id}
                      type="button"
                      onClick={() => setNoteState((prev) => ({ ...prev, font_size: fs.id as any }))}
                      className={`px-2 py-0.5 rounded-lg font-black transition-colors cursor-pointer text-[10px] ${
                        noteState.font_size === fs.id ? 'bg-sky-500 text-slate-950' : 'text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {fs.label}
                    </button>
                  ))}
                </div>

                {/* Line Spacing */}
                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-indigo-300 font-black px-1">تباعد الأسطر:</span>
                  {[
                    { id: 'compact', label: 'مضغوط' },
                    { id: 'normal', label: 'مريح' },
                    { id: 'relaxed', label: 'واسع' },
                  ].map((lh) => (
                    <button
                      key={lh.id}
                      type="button"
                      onClick={() => setNoteState((prev) => ({ ...prev, line_height: lh.id as any }))}
                      className={`px-2 py-0.5 rounded-lg font-black transition-colors cursor-pointer text-[10px] ${
                        noteState.line_height === lh.id ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {lh.label}
                    </button>
                  ))}
                </div>

                {/* Alignment */}
                <div className="flex items-center gap-0.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setNoteState((prev) => ({ ...prev, text_align: 'right' }))}
                    className={`p-1 rounded-lg cursor-pointer ${noteState.text_align === 'right' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}
                    title="محاذاة لليمين"
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoteState((prev) => ({ ...prev, text_align: 'center' }))}
                    className={`p-1 rounded-lg cursor-pointer ${noteState.text_align === 'center' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}
                    title="توسيط"
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoteState((prev) => ({ ...prev, text_align: 'left' }))}
                    className={`p-1 rounded-lg cursor-pointer ${noteState.text_align === 'left' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}
                    title="محاذاة لليسار"
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Border Style */}
                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-rose-300 font-black px-1">الإطار:</span>
                  {[
                    { id: 'gold', label: 'ذهبي' },
                    { id: 'double', label: 'مزدوج' },
                    { id: 'themed', label: 'ملوّن' },
                    { id: 'subtle', label: 'هادئ' },
                  ].map((bs) => (
                    <button
                      key={bs.id}
                      type="button"
                      onClick={() => setNoteState((prev) => ({ ...prev, border_style: bs.id as any }))}
                      className={`px-2 py-0.5 rounded-lg font-black transition-colors cursor-pointer text-[10px] ${
                        noteState.border_style === bs.id ? 'bg-rose-500 text-white' : 'text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {bs.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick Sub-Toolbar (Instant WYSIWYG Formatting During Typing) */}
          <div className="px-3 py-1.5 bg-slate-950 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1.5 text-xs">
            <div className="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execWysiwygCommand('bold')}
                className={`px-2 py-1 rounded-lg border text-xs font-black cursor-pointer flex items-center gap-1 transition-colors ${
                  activeFormats.bold
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                }`}
                title="خط عريض (تطبيق فوري أثناء الكتابة)"
              >
                <Bold className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">عريض</span>
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execWysiwygCommand('underline')}
                className={`px-2 py-1 rounded-lg border text-xs font-black cursor-pointer flex items-center gap-1 transition-colors ${
                  activeFormats.underline
                    ? 'bg-sky-500 text-slate-950 border-sky-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-sky-300 border-slate-700'
                }`}
                title="تسطير تحت النص (تطبيق فوري أثناء الكتابة)"
              >
                <Underline className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">تسطير</span>
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execWysiwygCommand('italic')}
                className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
                  activeFormats.italic
                    ? 'bg-slate-200 text-slate-950 border-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                title="خط مائل"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execWysiwygCommand('strikeThrough')}
                className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
                  activeFormats.strikeThrough
                    ? 'bg-rose-500 text-white border-rose-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-rose-300 border-slate-700'
                }`}
                title="شطب النص"
              >
                <Strikethrough className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleApplyHighlightColor('#fef08a')}
                className="px-2 py-1 rounded-lg bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-200 border border-yellow-400/40 text-[11px] font-black cursor-pointer flex items-center gap-1"
                title="تظليل فسفوري مباشر"
              >
                <Highlighter className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">تظليل</span>
              </button>

              {/* Quick Inline Color Dots right on the bar */}
              <div className="flex items-center gap-1 bg-slate-800/90 px-1.5 py-1 rounded-lg border border-slate-700">
                {[
                  { hex: '#dc2626', cls: 'bg-red-500', label: 'أحمر' },
                  { hex: '#059669', cls: 'bg-emerald-500', label: 'أخضر' },
                  { hex: '#2563eb', cls: 'bg-blue-500', label: 'أزرق' },
                  { hex: '#d97706', cls: 'bg-amber-500', label: 'ذهبي' },
                  { hex: '#0f172a', cls: 'bg-slate-900 ring-1 ring-slate-500', label: 'أسود' },
                ].map((dot) => (
                  <button
                    key={dot.hex}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleApplyTextColor(dot.hex)}
                    className={`w-3.5 h-3.5 rounded-full ${dot.cls} hover:scale-125 transition-transform cursor-pointer`}
                    title={`لون خط ${dot.label}`}
                  />
                ))}
              </div>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleToggleHeading}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 cursor-pointer"
                title="عنوان فرعي بارز"
              >
                <Heading1 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execWysiwygCommand('insertUnorderedList')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                title="قائمة نقطية"
              >
                <List className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execWysiwygCommand('insertOrderedList')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                title="قائمة مرقمة"
              >
                <ListOrdered className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleToggleQuote}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 cursor-pointer"
                title="صندوق اقتباس / ملاحظة مميزة"
              >
                <Quote className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleInsertDivider}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                title="إدراج خط فاصل"
              >
                <Divide className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleInsertPinBadge}
                className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-black border border-amber-500/30 cursor-pointer"
                title="إدراج شارة تنبيه"
              >
                📌 شارة
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleInsertDateTime}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 cursor-pointer"
                title="إدراج التاريخ والوقت"
              >
                <Calendar className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleAutoSumContentNumbers}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black border border-emerald-400/50 cursor-pointer flex items-center gap-1 shadow-xs"
                title="حساب العمليات الحسابية داخل السطور وإدراج/تحديث الإجمالي الكلي"
              >
                <Equal className="w-3.5 h-3.5" />
                <span>احسب واجمع</span>
              </button>

              <div
                className="px-2 py-1 rounded-lg bg-slate-800 text-amber-300 text-[11px] font-black border border-slate-700 flex items-center gap-1 select-none"
                title="عدد الأحرف المكتوبة"
              >
                <span>{plainTextLength}</span>
                <span>حرف</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={noteState.priority}
                onChange={(e) => setNoteState((prev) => ({ ...prev, priority: e.target.value as any }))}
                className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-0.5 text-[11px] font-bold outline-none cursor-pointer"
              >
                <option value="normal">🟢 عادية</option>
                <option value="high">🔴 عاجلة</option>
                <option value="info">🔵 حسابات</option>
                <option value="warning">🟡 تنبيه</option>
              </select>

              <div className="flex items-center gap-1 bg-slate-800 px-1.5 py-1 rounded-lg border border-slate-700">
                {colorPalette.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setNoteState((prev) => ({ ...prev, color_tag: color.id }))}
                    className={`w-3.5 h-3.5 rounded-full ${color.bg} transition-transform cursor-pointer ${
                      noteState.color_tag === color.id ? 'ring-2 ring-amber-400 scale-125' : 'opacity-60 hover:opacity-100'
                    }`}
                    title={color.name}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
                <Clock className="w-3 h-3 text-slate-400" />
                <input
                  type="date"
                  value={noteState.reminder_date}
                  onChange={(e) => setNoteState((prev) => ({ ...prev, reminder_date: e.target.value }))}
                  className="bg-transparent text-slate-200 text-[10px] font-bold outline-none cursor-pointer"
                  title="تاريخ التذكير"
                />
              </div>
            </div>
          </div>
        </div>

        {/* VERTICAL SPLIT-VIEW: CALCULATOR + WYSIWYG WRITING CANVAS */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-100/80 p-3 sm:p-5 overflow-y-auto no-scrollbar relative space-y-3.5">
          {showCalculator && (
            <div className="bg-slate-900 border-2 border-amber-400/80 rounded-2xl shrink-0 select-none overflow-hidden shadow-md my-1 p-1.5 sm:p-2.5 space-y-1">
              <div className="space-y-1">
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1.5 bg-slate-950 p-1 px-2.5 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1 flex-wrap">
                    <div className="flex items-center gap-0.5 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setCalcMode('accounting')}
                        className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-black transition-colors cursor-pointer flex items-center gap-1 ${
                          calcMode === 'accounting' ? 'bg-amber-500 text-slate-950 font-extrabold shadow-xs' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        💼 <span>محاسبية</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalcMode('scientific')}
                        className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-black transition-colors cursor-pointer flex items-center gap-1 ${
                          calcMode === 'scientific' ? 'bg-indigo-600 text-white font-extrabold shadow-xs' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🔬 <span>علمية</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyCalcResult}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] sm:text-[11px] font-bold rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                      title="نسخ الناتج إلى الحافظة"
                    >
                      {calcCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{calcCopied ? 'تم' : 'نسخ'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleInsertCalcResult}
                      className="px-2.5 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] sm:text-[11px] rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-xs shrink-0"
                      title="إدراج الناتج في الملاحظة مباشرة"
                    >
                      <Plus className="w-3 h-3" />
                      <span>إدراج ✍️</span>
                    </button>
                  </div>

                  <div className="w-full sm:w-64 text-right px-3 py-1 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-xl border-2 border-emerald-500/40 shadow-inner shadow-emerald-950/50 select-none">
                    <div className="flex items-center justify-between text-[10px] text-amber-300/90 font-mono leading-none pb-0.5 mb-0.5 border-b border-slate-800/80">
                      <span className="text-[9px] text-amber-400 font-bold">{calcMemory !== 0 ? `[M = ${calcMemory.toLocaleString('ar-SA')}]` : ''}</span>
                      <span className="truncate max-w-[180px] dir-ltr text-left font-mono font-bold tracking-wider text-amber-300 drop-shadow-xs">
                        {getLiveEquationDisplay()}
                      </span>
                    </div>
                    <div className="font-mono text-base sm:text-lg font-black text-emerald-400 dir-ltr text-right tracking-tight truncate leading-tight">
                      {calcDisplay}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-1 items-center">
                  <div className="md:col-span-7 space-y-0.5">
                    <div className="grid grid-cols-8 gap-0.5 text-center text-[9px] sm:text-[10px] font-bold">
                      <button type="button" onClick={handleCalcMemoryClear} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 cursor-pointer">MC</button>
                      <button type="button" onClick={handleCalcMemoryRecall} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 cursor-pointer">MR</button>
                      <button type="button" onClick={handleCalcMemoryAdd} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 cursor-pointer">M+</button>
                      <button type="button" onClick={handleCalcMemorySub} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 cursor-pointer">M-</button>
                      <button type="button" onClick={handleCalcAllClear} className="py-0.5 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 font-black cursor-pointer">AC</button>
                      <button type="button" onClick={handleCalcClearEntry} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 font-black cursor-pointer">C</button>
                      <button type="button" onClick={handleCalcBackspace} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer font-bold">⌫</button>
                      <button type="button" onClick={handleCalcToggleSign} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer font-bold">±</button>
                    </div>

                    {calcMode === 'accounting' ? (
                      <div className="grid grid-cols-8 gap-0.5 text-center text-[9px] sm:text-[10px] font-black">
                        <button type="button" onClick={handleCalcAddTax15} className="py-0.5 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 cursor-pointer">+15%</button>
                        <button type="button" onClick={handleCalcRemoveTax15} className="py-0.5 rounded bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-700/60 cursor-pointer">-15%</button>
                        <button type="button" onClick={handleCalcTaxOnly15} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 cursor-pointer">الضريبة</button>
                        <button type="button" onClick={handleCalcPercentage} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 cursor-pointer font-bold">%</button>
                        <button type="button" onClick={handleCalcOpenParen} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 cursor-pointer font-black text-xs">(</button>
                        <button type="button" onClick={handleCalcCloseParen} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 cursor-pointer font-black text-xs">)</button>
                        <button type="button" onClick={handleCalcToFraction} className="py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-amber-300 border border-indigo-700/60 cursor-pointer font-black text-[10px]">a/b</button>
                        <button type="button" onClick={() => handleCalcNumber('00')} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 cursor-pointer font-bold">00</button>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <div className="grid grid-cols-6 gap-0.5 text-center text-[9px] sm:text-[10px] font-black">
                          <button type="button" onClick={handleCalcSqrt} className="py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 cursor-pointer font-bold">√x</button>
                          <button type="button" onClick={handleCalcPowerY} className="py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-amber-300 border border-indigo-700/60 cursor-pointer font-bold">xʸ</button>
                          <button type="button" onClick={handleCalcSquare} className="py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 cursor-pointer font-bold">x²</button>
                          <button type="button" onClick={handleCalcLn} className="py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 cursor-pointer font-bold">ln</button>
                          <button type="button" onClick={handleCalcLog10} className="py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 cursor-pointer font-bold">log₁₀</button>
                          <button type="button" onClick={handleCalcToFraction} className="py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-amber-300 border border-indigo-700/60 cursor-pointer font-bold">a/b</button>
                        </div>
                        <div className="grid grid-cols-6 gap-0.5 text-center text-[9px] sm:text-[10px] font-black">
                          <button type="button" onClick={handleCalcCbrt} className="py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 cursor-pointer font-bold">∛x</button>
                          <button type="button" onClick={handleCalcExp10} className="py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 cursor-pointer font-bold">10ˣ</button>
                          <button type="button" onClick={handleCalcExpE} className="py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 cursor-pointer font-bold">eˣ</button>
                          <button type="button" onClick={handleCalcSin} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 cursor-pointer font-bold">sin</button>
                          <button type="button" onClick={handleCalcCos} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 cursor-pointer font-bold">cos</button>
                          <button type="button" onClick={handleCalcTan} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 cursor-pointer font-bold">tan</button>
                        </div>
                        <div className="grid grid-cols-6 gap-0.5 text-center text-[9px] sm:text-[10px] font-black">
                          <button type="button" onClick={handleCalcFactorial} className="py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-emerald-300 border border-indigo-700/60 cursor-pointer font-bold">n!</button>
                          <button type="button" onClick={handleCalcAbs} className="py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 cursor-pointer font-bold">|x|</button>
                          <button type="button" onClick={handleCalcReciprocal} className="py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 cursor-pointer font-bold">1/x</button>
                          <button type="button" onClick={() => handleCalcNumber(`${Math.E}`)} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 cursor-pointer font-bold">e</button>
                          <button type="button" onClick={handleCalcOpenParen} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 cursor-pointer font-black text-xs">(</button>
                          <button type="button" onClick={handleCalcCloseParen} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 cursor-pointer font-black text-xs">)</button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-5 grid grid-cols-4 gap-0.5 text-center font-bold text-xs" dir="ltr">
                    <button type="button" onClick={() => handleCalcNumber('7')} className="py-1 sm:py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 cursor-pointer font-black text-sm">7</button>
                    <button type="button" onClick={() => handleCalcNumber('8')} className="py-1 sm:py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 cursor-pointer font-black text-sm">8</button>
                    <button type="button" onClick={() => handleCalcNumber('9')} className="py-1 sm:py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 cursor-pointer font-black text-sm">9</button>
                    <button type="button" onClick={() => handleCalcOp('÷')} className="py-1 sm:py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-amber-400 border border-slate-600 cursor-pointer font-black text-base">÷</button>

                    <button type="button" onClick={() => handleCalcNumber('4')} className="py-1 sm:py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 cursor-pointer font-black text-sm">4</button>
                    <button type="button" onClick={() => handleCalcNumber('5')} className="py-1 sm:py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 cursor-pointer font-black text-sm">5</button>
                    <button type="button" onClick={() => handleCalcNumber('6')} className="py-1 sm:py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 cursor-pointer font-black text-sm">6</button>
                    <button type="button" onClick={() => handleCalcOp('×')} className="py-1 sm:py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-amber-400 border border-slate-600 cursor-pointer font-black text-base">×</button>

                    <button type="button" onClick={() => handleCalcNumber('1')} className="py-1 sm:py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 cursor-pointer font-black text-sm">1</button>
                    <button type="button" onClick={() => handleCalcNumber('2')} className="py-1 sm:py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 cursor-pointer font-black text-sm">2</button>
                    <button type="button" onClick={() => handleCalcNumber('3')} className="py-1 sm:py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 cursor-pointer font-black text-sm">3</button>
                    <button type="button" onClick={() => handleCalcOp('-')} className="py-1 sm:py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-amber-400 border border-slate-600 cursor-pointer font-black text-base">-</button>

                    <button type="button" onClick={() => handleCalcNumber('0')} className="py-1 sm:py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 cursor-pointer font-black text-sm">0</button>
                    <button type="button" onClick={handleCalcDecimal} className="py-1 sm:py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 cursor-pointer font-black text-sm">.</button>
                    <button type="button" onClick={handleCalcEquals} className="py-1 sm:py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 cursor-pointer font-black text-base shadow-xs">=</button>
                    <button type="button" onClick={() => handleCalcOp('+')} className="py-1 sm:py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-amber-400 border border-slate-600 cursor-pointer font-black text-base">+</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BOTTOM SECTION: MAIN WYSIWYG NOTE WRITING CANVAS */}
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            {/* Note Title Input */}
            <div className={`bg-white rounded-2xl ${activeCanvasBorder} p-2.5 sm:px-4 focus-within:ring-2 focus-within:ring-amber-400/30 shrink-0 transition-all`}>
              <input
                type="text"
                value={noteState.title}
                onChange={(e) => setNoteState((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="عنوان الملاحظة أو اسم الحساب / اليومية..."
                className="w-full text-sm sm:text-base font-black text-slate-800 outline-none placeholder:text-slate-400 bg-transparent text-right"
              />
            </div>

            {/* True WYSIWYG Rich Content Canvas (No raw symbols while typing!) */}
            <div
              className={`relative flex-1 min-h-[280px] sm:min-h-[340px] ${activePaperClass} rounded-3xl ${activeCanvasBorder} focus-within:ring-2 focus-within:ring-amber-400/30 overflow-hidden flex flex-col transition-all`}
            >
              {isPreviewMode ? (
                <div
                  className={`w-full h-full p-4 sm:p-6 ${activeFontClass} ${activeFamilyClass} ${activeLineHeightClass} ${activeAlignClass} break-words font-medium overflow-y-auto`}
                >
                  {renderFormattedNoteText(noteState.content)}
                </div>
              ) : (
                <>
                  {plainTextLength === 0 && (
                    <div className="absolute inset-x-5 top-4 text-slate-400 pointer-events-none select-none text-sm font-medium">
                      اكتب التفاصيل، المبالغ أو العمليات الحسابية (مثل: 500 + 300 أو 4 * 150) وسيظهر التلوين والتسطير والتنسيق مباشرة بدون رموز...
                    </div>
                  )}
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={() => handleEditorInput()}
                    onKeyUp={refreshActiveFormats}
                    onMouseUp={refreshActiveFormats}
                    dir="rtl"
                    className={`w-full h-full p-4 sm:p-5 ${activeFontClass} ${activeFamilyClass} ${activeLineHeightClass} ${activeAlignClass} outline-none overflow-y-auto break-words font-semibold [&_h1]:text-xl [&_h1]:font-black [&_h2]:text-base [&_h2]:sm:text-lg [&_h2]:font-black [&_h2]:border-b [&_h2]:border-amber-300/70 [&_h2]:pb-0.5 [&_h2]:mb-1 [&_h3]:text-sm [&_h3]:sm:text-base [&_h3]:font-black [&_ul]:list-disc [&_ul]:pr-6 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pr-6 [&_ol]:my-1 [&_blockquote]:border-r-4 [&_blockquote]:border-amber-500 [&_blockquote]:bg-amber-500/10 [&_blockquote]:px-3 [&_blockquote]:py-1 [&_blockquote]:my-1.5 [&_blockquote]:rounded-l-xl [&_hr]:my-2.5 [&_hr]:border-amber-300/80 [&_u]:underline [&_u]:decoration-2 [&_u]:decoration-amber-500 [&_u]:underline-offset-4 [&_s]:line-through [&_del]:line-through [&_b]:font-black [&_strong]:font-black`}
                  />
                </>
              )}
            </div>

            {/* Collapsible Checklist Section */}
            {showChecklistSection && (
              <div className="bg-white rounded-2xl border-2 border-amber-300/80 p-2.5 shadow-sm space-y-1.5 max-h-36 overflow-y-auto no-scrollbar shrink-0">
                <div className="flex items-center justify-between border-b border-amber-100 pb-1">
                  <button
                    type="button"
                    onClick={() => setShowChecklistSection(false)}
                    className="text-[10px] text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                  >
                    إخفاء
                  </button>
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                    <span>
                      قائمة مهام ({noteState.checklist.filter((c) => c.done).length}/{noteState.checklist.length}):
                    </span>
                  </span>
                </div>

                <div className="space-y-1">
                  {noteState.checklist.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-1 px-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveCheckItem(item.id)}
                        className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>

                      <div
                        onClick={() => handleToggleCheckItem(item.id)}
                        className="flex items-center gap-2 cursor-pointer select-none flex-1 justify-end"
                      >
                        <span className={`text-xs font-bold ${item.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                          {item.text}
                        </span>
                        {item.done ? (
                          <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={handleAddChecklistItem}
                    className="p-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3 h-3" />
                    <span>إضافة</span>
                  </button>
                  <input
                    type="text"
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddChecklistItem();
                      }
                    }}
                    placeholder="أضف مهمة للشطب (اضغط Enter)..."
                    className="w-full p-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
