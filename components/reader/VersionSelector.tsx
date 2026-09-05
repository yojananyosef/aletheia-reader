'use client';

import React, { useState, useRef, useEffect } from 'react';
import { TranslationId, AVAILABLE_TRANSLATIONS } from '@/types/bible';
import { ChevronDown, Check, BookMarked, Library } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface VersionSelectorProps {
  selectedVersionId: TranslationId;
  onSelectVersion: (id: TranslationId) => void;
  variant?: 'pill' | 'cards';
  compactOnMobile?: boolean;
}

const ORDER: TranslationId[] = [
  'ONBV',
  'RV1909',
  'SpaRVG',
  'BES',
  'VBL',
  'PDDPT',
  'BLL',
  'BLM',
  'SpaPlatense',
];

export const VersionSelector: React.FC<VersionSelectorProps> = ({
  selectedVersionId,
  onSelectVersion,
  variant = 'pill',
  compactOnMobile = true,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, []);

  const closeAndRefocus = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  // Listbox keyboard nav: arrows move, Home/End jump, Enter/Space select (native), Escape closes.
  const onListKeyDown = (e: React.KeyboardEvent) => {
    const idx = optionRefs.current.findIndex((el) => el === document.activeElement);
    if (e.key === 'Escape') {
      e.preventDefault();
      closeAndRefocus();
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      const last = ORDER.length - 1;
      let next: number;
      if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = last;
      else if (idx === -1) next = e.key === 'ArrowDown' ? 0 : last;
      else next = e.key === 'ArrowDown' ? (idx + 1) % ORDER.length : (idx - 1 + ORDER.length) % ORDER.length;
      optionRefs.current[next]?.focus();
    }
  };

  const selected = AVAILABLE_TRANSLATIONS[selectedVersionId];

  if (variant === 'cards') {
    // En Ajustes: dropdown compacto (ocupa 1 fila en vez de 9 cards) — respeta espacio
    return (
      <div className="space-y-2" ref={ref}>
        <div className="flex items-center gap-2">
          <Library className="h-4 w-4 text-reader-accent" />
          <label className="text-xs font-bold uppercase tracking-wider opacity-80">
            Traducción Bíblica
          </label>
          <Badge variant="subtle" className="text-[10px] px-1.5 py-0">
            9 versiones
          </Badge>
        </div>
        <p className="text-xs opacity-60">
          Cambia sin perder tu posición. Marcadores por versión.
        </p>

        <div className="relative">
          <button
            type="button"
            ref={triggerRef}
            onClick={() => setOpen((v) => !v)}
            onKeyDown={(e) => {
              if ((e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') && !open) {
                e.preventDefault();
                setOpen(true);
                // Focus selected option once open
                requestAnimationFrame(() => {
                  const idx = ORDER.indexOf(selectedVersionId);
                  optionRefs.current[idx]?.focus();
                });
              }
            }}
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-label={`Traducción actual: ${selected.shortName}. Cambiar versión`}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border bg-[var(--reader-bg)] border-[var(--reader-border)] hover:bg-[var(--reader-hover)] transition-colors min-h-[44px] text-left"
          >
            <div className="flex flex-col">
              <span className="text-sm font-bold flex items-center gap-1.5">
                {selected.shortName}
                {selected.hasDeuterocanonical && (
                  <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-full bg-reader-accent-subtle text-reader-accent">
                    73
                  </span>
                )}
              </span>
              <span className="text-xs opacity-70 leading-tight">{selected.name}</span>
            </div>
            <ChevronDown className={`h-4 w-4 opacity-60 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div
              role="listbox"
              onKeyDown={onListKeyDown}
              className="absolute left-0 right-0 top-full mt-2 max-h-[45vh] overflow-y-auto custom-scrollbar rounded-2xl border shadow-2xl z-[60] p-1.5 space-y-1"
              style={{
                backgroundColor: 'var(--reader-bg)',
                borderColor: 'var(--reader-border)',
                color: 'var(--reader-text)',
              }}
            >
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest opacity-50">
                9 traducciones · Español
              </div>
              {ORDER.map((id, i) => {
                const meta = AVAILABLE_TRANSLATIONS[id];
                const active = id === selectedVersionId;
                return (
                  <button
                    key={id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    ref={(el) => {
                      optionRefs.current[i] = el;
                    }}
                    onClick={() => {
                      onSelectVersion(id);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl border flex items-center justify-between gap-2 transition-colors min-h-[44px] ${
                      active
                        ? 'bg-reader-accent text-white border-reader-accent shadow-sm'
                        : 'border-transparent hover:bg-[var(--reader-hover)]'
                    }`}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className={`text-sm font-bold flex items-center gap-1.5 ${active ? 'text-white' : ''}`}>
                        {meta.shortName}
                        {meta.hasDeuterocanonical && (
                          <span
                            className={`text-[10px] font-normal px-1.5 py-0.5 rounded-full shrink-0 ${
                              active ? 'bg-white/20 text-white' : 'bg-reader-accent-subtle text-reader-accent'
                            }`}
                          >
                            73
                          </span>
                        )}
                      </span>
                      <span className={`text-xs truncate ${active ? 'text-white/80' : 'opacity-70'}`}>{meta.name}</span>
                    </div>
                    {active && <Check className="h-4 w-4 text-white shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // pill variant — toolbar
  return (
    <div ref={ref} className="relative">
      <Button
        variant="outline"
        size="sm"
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if ((e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') && !open) {
            e.preventDefault();
            setOpen(true);
            requestAnimationFrame(() => {
              const idx = ORDER.indexOf(selectedVersionId);
              optionRefs.current[idx]?.focus();
            });
          }
        }}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Traducción actual: ${selected.shortName}. Cambiar versión`}
        className="font-bold text-xs sm:text-sm gap-1.5 min-h-[36px]"
      >
        <BookMarked className="h-3.5 w-3.5 text-reader-accent hidden sm:inline" />
        <span className={compactOnMobile ? 'inline' : 'inline'}>{selected.shortName}</span>
        <ChevronDown className={`h-3.5 w-3.5 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>

      {open && (
        <div
          role="listbox"
          onKeyDown={onListKeyDown}
          className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-72 sm:w-80 max-h-[70vh] overflow-y-auto custom-scrollbar rounded-2xl border shadow-2xl z-[60] p-2 space-y-1"
          style={{
            backgroundColor: 'var(--reader-bg)',
            borderColor: 'var(--reader-border)',
            color: 'var(--reader-text)',
          }}
        >
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest opacity-50">
            9 traducciones · Español
          </div>
          {ORDER.map((id, i) => {
            const meta = AVAILABLE_TRANSLATIONS[id];
            const active = id === selectedVersionId;
            return (
              <button
                key={id}
                type="button"
                role="option"
                aria-selected={active}
                ref={(el) => {
                  optionRefs.current[i] = el;
                }}
                onClick={() => {
                  onSelectVersion(id);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl border flex items-start justify-between gap-2 transition-colors min-h-[44px] ${
                  active
                    ? 'bg-reader-accent text-white border-reader-accent shadow-sm'
                    : 'border-transparent hover:bg-[var(--reader-hover)]'
                }`}
              >
                <div className="flex flex-col">
                  <span className={`text-sm font-bold ${active ? 'text-white' : ''}`}>
                    {meta.shortName}
                    {meta.hasDeuterocanonical && (
                      <span className={`ml-1.5 text-[10px] font-normal px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-reader-accent-subtle text-reader-accent'}`}>
                        73
                      </span>
                    )}
                  </span>
                  <span className={`text-xs ${active ? 'text-white/80' : 'opacity-70'}`}>{meta.name}</span>
                  <span className={`text-[10px] ${active ? 'text-white/60' : 'opacity-50'}`}>{meta.copyright}</span>
                </div>
                {active && <Check className="h-4 w-4 text-white mt-1 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
