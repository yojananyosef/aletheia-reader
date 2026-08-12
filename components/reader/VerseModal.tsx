'use client';

import React, { useEffect, useRef } from 'react';
import { Verse, Footnote } from '@/types/bible';
import { Bookmark, Copy, Check, X, BookOpen } from 'lucide-react';

interface VerseModalProps {
  isOpen: boolean;
  onClose: () => void;
  verse: Verse | null;
  bookName: string;
  chapterNumber: number;
  footnotes: Footnote[];
  isBookmarked: boolean;
  onToggleBookmark: (verseNumber: string | number) => void;
}

export const VerseModal: React.FC<VerseModalProps> = ({
  isOpen,
  onClose,
  verse,
  bookName,
  chapterNumber,
  footnotes,
  isBookmarked,
  onToggleBookmark,
}) => {
  const [copied, setCopied] = React.useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus close button on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen || !verse) return null;

  const citation = `${bookName} ${chapterNumber}:${verse.number}`;
  const fullText = `«${verse.text}» (${citation})`;

  // Filter footnotes matching this verse
  const relevantFootnotes = footnotes.filter((fn) => {
    const fnRef = String(fn.verseNumber).trim();
    const vNum = String(verse.number).trim();
    return fnRef === vNum || vNum.split('-').includes(fnRef);
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="verse-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-t-2xl sm:rounded-2xl border p-6 shadow-2xl transition-all duration-200"
        style={{
          backgroundColor: 'var(--reader-bg, #FDFBF6)',
          borderColor: 'var(--reader-border, rgba(0,0,0,0.12))',
          color: 'var(--reader-text, #222222)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 mb-4" style={{ borderColor: 'var(--reader-border)' }}>
          <div className="flex items-center gap-2">
            <span className="flex h-8 px-2.5 items-center justify-center rounded-full bg-amber-600/10 font-bold text-amber-700 dark:text-amber-400 text-xs">
              v.{verse.number}
            </span>
            <h2 id="verse-modal-title" className="text-lg font-bold">
              {citation}
            </h2>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de versículo"
            className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-neutral-500/10 focus-visible:ring-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Verse Body Text */}
        <div className="my-4">
          <blockquote className="border-l-4 pl-4 italic text-base sm:text-lg leading-relaxed" style={{ borderColor: 'var(--reader-accent)' }}>
            «{verse.text}»
          </blockquote>
        </div>

        {/* Footnotes & Study Notes if present */}
        {relevantFootnotes.length > 0 && (
          <div className="my-4 rounded-xl p-3.5 border text-sm" style={{ backgroundColor: 'var(--reader-hover)', borderColor: 'var(--reader-border)' }}>
            <div className="flex items-center gap-1.5 font-semibold text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--reader-accent)' }}>
              <BookOpen className="h-4 w-4" />
              <span>Nota al Pie Explicativa</span>
            </div>
            <ul className="space-y-2">
              {relevantFootnotes.map((fn) => (
                <li key={fn.id} className="leading-relaxed opacity-95">
                  <span className="font-bold mr-1.5 inline-flex items-center px-1.5 py-0.5 rounded bg-amber-600/10 text-amber-800 dark:text-amber-300 text-xs">
                    [{fn.marker || '*'}] v.{fn.verseNumber}
                  </span>
                  {fn.note}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions Footer */}
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: 'var(--reader-border)' }}>
          <button
            type="button"
            onClick={handleCopy}
            className="flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium border transition-colors hover:bg-neutral-500/10 active:scale-95"
            style={{ borderColor: 'var(--reader-border)' }}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                <span>¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copiar Versículo</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onToggleBookmark(verse.number)}
            className={`flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors active:scale-95 ${
              isBookmarked
                ? 'bg-amber-600 text-white'
                : 'border hover:bg-neutral-500/10'
            }`}
            style={!isBookmarked ? { borderColor: 'var(--reader-border)' } : undefined}
          >
            <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
            <span>{isBookmarked ? 'Marcado guardado' : 'Marcar versículo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
