import * as React from "react"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-black mb-1"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={`
            flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm
            file:border-0 file:bg-transparent file:text-sm file:font-medium
            placeholder:text-black focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-black focus-visible:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-50
            ${error ? 'border-red-500 focus-visible:ring-red-500' : 'border-black'}
            ${className || ''}
          `}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-xs text-red-500">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1 text-xs text-black">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }