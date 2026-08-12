import * as React from "react"
import { cn } from "@/lib/utils"

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number
  min: number
  max: number
  step?: number
  onValueChange: (value: number) => void
  label?: string
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, min, max, step = 1, onValueChange, label, ...props }, ref) => {
    const percentage = ((value - min) / (max - min)) * 100

    return (
      <div className="relative flex w-full touch-none select-none items-center py-2">
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onValueChange(parseFloat(e.target.value))}
          aria-label={label}
          className={cn(
            "w-full h-2 rounded-full appearance-none cursor-pointer focus:outline-none transition-all",
            "bg-neutral-500/20 accent-reader-accent",
            className
          )}
          style={{
            background: `linear-gradient(to right, var(--reader-accent) 0%, var(--reader-accent) ${percentage}%, rgba(128,128,128,0.2) ${percentage}%, rgba(128,128,128,0.2) 100%)`,
          }}
          {...props}
        />
      </div>
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
