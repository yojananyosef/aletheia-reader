'use client';

import React from 'react';
import { Verse, Footnote } from '@/types/bible';
import { Bookmark, Copy, Check, BookOpen, Volume2 } from 'lucide-react';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
  const copiedTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const citation = verse ? `${bookName} ${chapterNumber}:${verse.number}` : '';
  const fullText = verse ? `«${verse.text}» (${citation})` : '';

  // Clear the "¡Copiado!" reset timer on unmount/close (no setState after unmount)
  React.useEffect(() => {
    return () => {
      if (copiedTimer.current !== null) {
        clearTimeout(copiedTimer.current);
        copiedTimer.current = null;
      }
    };
  }, []);

  const flashCopied = React.useCallback(() => {
    setCopied(true);
    if (copiedTimer.current !== null) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => {
      copiedTimer.current = null;
      setCopied(false);
    }, 2000);
  }, []);

  const handleCopy = React.useCallback(async () => {
    // Clipboard API may be unavailable (non-secure context, permissions)
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullText);
        flashCopied();
        return;
      }
      throw new Error('clipboard-api-unavailable');
    } catch {
      // Fallback: hidden textarea + execCommand
      try {
        const ta = document.createElement('textarea');
        ta.value = fullText;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        if (ok) flashCopied();
        else setCopied(false);
      } catch {
        setCopied(false);
      }
    }
  }, [fullText, flashCopied]);

  if (!isOpen || !verse) return null;

  // Filter footnotes matching this verse
  const relevantFootnotes = footnotes.filter((fn) => {
    const fnRef = String(fn.verseNumber).trim();
    const vNum = String(verse.number).trim();
    return fnRef === vNum || vNum.split('-').includes(fnRef);
  });

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      position="bottom"
      title={`Versículo ${citation}`}
      className="max-w-xl max-h-[88dvh] sm:max-h-[85vh] flex flex-col pb-safe"
    >
      {/* Header */}
      <DialogHeader onClose={onClose}>
        <div className="flex items-center gap-2">
          <Badge variant="subtle" className="font-mono text-xs">
            v.{verse.number}
          </Badge>
          <DialogTitle className="truncate text-base sm:text-lg">
            {citation}
          </DialogTitle>
        </div>
      </DialogHeader>

      {/* Scrollable Content Body */}
      <DialogContent className="space-y-4 py-2">
        {/* Verse Body Text */}
        <blockquote className="border-l-4 border-reader-accent pl-3.5 italic text-sm sm:text-lg leading-relaxed">
          «{verse.text}»
        </blockquote>

        {/* Footnotes & Study Notes if present */}
        {relevantFootnotes.length > 0 && (
          <div className="rounded-xl p-3 sm:p-3.5 border border-[var(--reader-border)] bg-[var(--reader-hover)] text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 font-semibold text-xs uppercase tracking-wider mb-2 text-reader-accent">
              <BookOpen className="h-4 w-4" />
              <span>Nota al Pie Explicativa</span>
            </div>
            <ul className="space-y-2">
              {relevantFootnotes.map((fn) => (
                <li key={fn.id} className="leading-relaxed opacity-95">
                  <Badge variant="subtle" className="mr-1.5 text-[11px] font-bold">
                    [{fn.marker || '*'}] v.{fn.verseNumber}
                  </Badge>
                  {fn.note}
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>

      {/* Actions Footer */}
      <DialogFooter>
        {onPlayFromVerse && (
          <Button
            variant="outline"
            size="default"
            onClick={() => {
              onPlayFromVerse(verse.number);
              onClose();
            }}
          >
            <Volume2 className="h-4 w-4 text-reader-accent" />
            <span>Escuchar desde aquí</span>
          </Button>
        )}

        <Button
          variant="outline"
          size="default"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-emerald-600" />
              <span>¡Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>Copiar</span>
            </>
          )}
        </Button>

        <Button
          variant={isBookmarked ? "default" : "outline"}
          size="default"
          onClick={() => onToggleBookmark(verse.number)}
        >
          <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
          <span>{isBookmarked ? 'Guardado' : 'Guardar'}</span>
        </Button>
      </DialogFooter>
    </Dialog>
  );
};
