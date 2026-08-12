'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReaderFooterProps {
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  bookName: string;
  chapterNumber: number;
  totalWords?: number;
  showControls?: boolean;
}

export const ReaderFooter: React.FC<ReaderFooterProps> = ({
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  bookName,
  chapterNumber,
  totalWords = 500,
  showControls = true,
}) => {
  const percentage = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;
  const estimatedMinutes = Math.max(1, Math.ceil(totalWords / 200));

  return (
    <footer
      role="contentinfo"
      aria-label="Paginación y estado de lectura"
      className={`sticky bottom-0 z-20 flex w-full flex-col transition-all duration-200 select-none ${
        showControls
          ? 'border-t px-4 py-2 backdrop-blur-md shadow-xs'
          : 'border-t-0 px-4 py-1.5 bg-transparent'
      }`}
      style={{
        backgroundColor: showControls ? 'var(--reader-bg)' : 'transparent',
        borderColor: 'var(--reader-border)',
        color: 'var(--reader-text)',
      }}
    >
      {/* Slim Ambient Chapter Progress Bar (Always visible in both normal & immersive modes) */}
      <div className="w-full bg-neutral-500/15 h-1 rounded-full overflow-hidden transition-all">
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

      {/* Extended Controls (Hidden in Zero-Distraction Immersive Mode) */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            className="flex items-center justify-between overflow-hidden"
          >
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

              <span className="hidden sm:inline text-xs opacity-70 font-medium font-sans">
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
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  );
};
