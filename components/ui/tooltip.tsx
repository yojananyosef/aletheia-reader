'use client'

import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

/**
 * Single app-level provider (mounted once in app/page.tsx).
 * Do NOT wrap individual tooltips: one provider per tooltip costs hundreds
 * of contexts per chapter. Without an ancestor provider Radix falls back
 * to safe defaults, so standalone reader renders keep working.
 */function TooltipProvider({
  delayDuration = 250,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      skipDelayDuration={300}
      {...props}
    />
  )
}

function Tooltip({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  sideOffset = 8,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    // Default body portal: the reader container is overflow:hidden and would clip tooltips
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        collisionPadding={12}
        className={cn(
          'z-[60] w-fit max-w-[min(20rem,calc(100vw-1.5rem))] origin-[var(--radix-tooltip-content-transform-origin)] rounded-xl border px-3 py-2 text-sm leading-snug select-none',
          'animate-[tooltip-in_160ms_cubic-bezier(0.16,1,0.3,1)]',
          'border-[var(--reader-border)] bg-[var(--reader-bg)] text-[var(--reader-text)]',
          'shadow-[0_4px_16px_rgba(0,0,0,0.18)]',
          className
        )}
        {...props}
      >
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
