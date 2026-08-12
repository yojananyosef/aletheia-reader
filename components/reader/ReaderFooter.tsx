'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ReaderFooterProps {
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  bookName: string;
  chapterNumber: number;
  totalWords?: number;
}

export const ReaderFooter: React.FC<ReaderFooterProps> = ({
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  bookName,
  chapterNumber,
  totalWords = 500,
}) => {
  const percentage = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;
  const estimatedMinutes = Math.max(1, Math.ceil(totalWords / 200));

  return (
    <footer
      role="contentinfo"
      aria-label="Paginación y estado de lectura"
      className="sticky bottom-0 z-20 flex w-full flex-col border-t px-4 py-2 backdrop-blur-md transition-colors duration-200 select-none"
      style={{
        backgroundColor: 'var(--reader-bg)',
        borderColor: 'var(--reader-border)',
        color: 'var(--reader-text)',
      }}
    >
      {/* Chapter Progress Bar */}
      <div className="w-full bg-neutral-500/20 h-1 rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-reader-accent transition-all duration-200"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progreso del capítulo: ${percentage}%`}
        />
      </div>

      <div className="flex items-center justify-between">
        {/* Left: Previous Page Button & Book Chapter */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevPage}
            disabled={currentPage <= 1}
            aria-label="Ir a la página anterior"
            className="flex h-11 w-11 items-center justify-center rounded-xl border transition-colors hover:bg-neutral-500/10 disabled:opacity-30 disabled:pointer-events-none active:scale-95"
            style={{ borderColor: 'var(--reader-border)' }}
            title="Página Anterior (Flecha Izquierda)"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <span className="hidden sm:inline text-xs opacity-70 font-medium">
            {bookName} {chapterNumber} • ~{estimatedMinutes} min de lectura
          </span>
        </div>

        {/* Center: Page Info */}
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-mono font-bold tracking-wider" aria-live="polite">
            Página {currentPage} de {totalPages}
          </span>
          <span className="text-xs opacity-60 font-mono">({percentage}%)</span>
        </div>

        {/* Right: Next Page Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNextPage}
            disabled={currentPage >= totalPages}
            aria-label="Ir a la página siguiente"
            className="flex h-11 w-11 items-center justify-center rounded-xl border transition-colors hover:bg-neutral-500/10 disabled:opacity-30 disabled:pointer-events-none active:scale-95"
            style={{ borderColor: 'var(--reader-border)' }}
            title="Página Siguiente (Flecha Derecha)"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
