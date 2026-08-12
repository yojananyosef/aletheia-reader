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
