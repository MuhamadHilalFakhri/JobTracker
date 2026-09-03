"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export function Field({
  label, children, className, htmlFor, required, hint,
}: {
  label: string; children: React.ReactNode; className?: string; htmlFor?: string; required?: boolean; hint?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function TextInput({
  label, required, error, hint, className, id, ...props
}: React.ComponentProps<typeof Input> & { label: string; error?: string; hint?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id ?? props.name}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input id={id ?? props.name} aria-invalid={!!error} {...props} />
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
