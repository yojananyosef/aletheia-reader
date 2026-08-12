'use client';

import React, { useEffect, useRef } from 'react';
import { Verse, Footnote } from '@/types/bible';
import { Bookmark, Copy, Check, X, BookOpen, Volume2 } from 'lucide-react';

interface VerseModalProps {
  isOpen: boolean;
  onClose: () => void;
  verse: Verse | null;
  bookName: string;
  chapterNumber: number;
  footnotes: Footnote[];
  isBookmarked: boolean;
  onToggleBookmark: (verseNumber: string | number) => void;
  onPlayFromVerse?: (verseNumber: string | number) => void;
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
  onPlayFromVerse,
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl max-h-[88dvh] sm:max-h-[85vh] flex flex-col rounded-t-2xl sm:rounded-2xl border p-4 sm:p-6 pb-safe shadow-2xl transition-all duration-200 overflow-hidden"
        style={{
          backgroundColor: 'var(--reader-bg)',
          borderColor: 'var(--reader-border)',
          color: 'var(--reader-text)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 mb-3 shrink-0" style={{ borderColor: 'var(--reader-border)' }}>
          <div className="flex items-center gap-2">
            <span className="flex h-8 px-2.5 items-center justify-center rounded-full bg-reader-accent-subtle font-bold text-xs">
              v.{verse.number}
            </span>
            <h2 id="verse-modal-title" className="text-base sm:text-lg font-bold truncate">
              {citation}
            </h2>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de versículo"
            className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-neutral-500/15 focus-visible:ring-2 active:scale-95 shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 py-1 pr-1">
          {/* Verse Body Text */}
          <blockquote className="border-l-4 pl-3.5 italic text-sm sm:text-lg leading-relaxed" style={{ borderColor: 'var(--reader-accent)' }}>
            «{verse.text}»
          </blockquote>

          {/* Footnotes & Study Notes if present */}
          {relevantFootnotes.length > 0 && (
            <div className="rounded-xl p-3 sm:p-3.5 border text-xs sm:text-sm" style={{ backgroundColor: 'var(--reader-hover)', borderColor: 'var(--reader-border)' }}>
              <div className="flex items-center gap-1.5 font-semibold text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--reader-accent)' }}>
                <BookOpen className="h-4 w-4" />
                <span>Nota al Pie Explicativa</span>
              </div>
              <ul className="space-y-2">
                {relevantFootnotes.map((fn) => (
                  <li key={fn.id} className="leading-relaxed opacity-95">
                    <span className="font-bold mr-1.5 inline-flex items-center px-1.5 py-0.5 rounded bg-reader-accent-subtle text-xs">
                      [{fn.marker || '*'}] v.{fn.verseNumber}
                    </span>
                    {fn.note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t shrink-0" style={{ borderColor: 'var(--reader-border)' }}>
          {onPlayFromVerse && (
            <button
              type="button"
              onClick={() => {
                onPlayFromVerse(verse.number);
                onClose();
              }}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium border transition-colors hover:bg-neutral-500/10 active:scale-95"
              style={{ borderColor: 'var(--reader-border)' }}
            >
              <Volume2 className="h-4 w-4 text-reader-accent" />
              <span>Escuchar desde aquí</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium border transition-colors hover:bg-neutral-500/10 active:scale-95"
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
            className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium transition-all active:scale-95 ${
              isBookmarked
                ? 'bg-reader-accent border-reader-accent shadow-xs'
                : 'border hover:bg-neutral-500/10'
            }`}
            style={!isBookmarked ? { borderColor: 'var(--reader-border)' } : undefined}
          >
            <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
            <span>{isBookmarked ? 'Marcado en favoritos' : 'Guardar versículo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
