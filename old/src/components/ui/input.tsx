import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-sm border {/*border-input*/} border-accent/40 ring-offset-background focus:border-accent file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none {/*focus-visible:ring-2*/} focus-visible:ring-offset-2 focus-visible:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50 bg-accent/5 px-4 py-5 text-base placeholder:text-secondary-foreground outline-none",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
