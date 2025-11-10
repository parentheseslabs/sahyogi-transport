import * as React from "react"
import { ChevronDown } from "lucide-react"

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string
  error?: string
  helperText?: string
  options: SelectOption[]
  placeholder?: string
  onChange?: (value: string) => void
  onSelectChange?: React.ChangeEventHandler<HTMLSelectElement>
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, placeholder, onChange, onSelectChange, id, ...props }, ref) => {
    const { onChange: propsOnChange, ...restProps } = props
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')
    
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      // Safety check for event target and value
      if (!e || !e.target || e.target.value === undefined) {
        console.error('Invalid event object in Select handleChange', e);
        return;
      }

      const value = e.target.value;

      // Call the custom onChange with just the value
      if (onChange) {
        onChange(value);
      }
      // Call the original onChange if it exists (for react-hook-form compatibility)
      if (onSelectChange) {
        onSelectChange(e);
      }
      // Handle react-hook-form onChange
      if (propsOnChange) {
        propsOnChange(e);
      }
    }
    
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-medium text-black mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            className={`
              flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm text-black
              appearance-none cursor-pointer
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-black focus-visible:ring-offset-2
              disabled:cursor-not-allowed disabled:opacity-50
              ${error ? 'border-red-500 focus-visible:ring-red-500' : 'border-black'}
              ${className || ''}
            `}
            ref={ref}
            onChange={handleChange}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined
            }
            {...restProps}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-black" />
        </div>
        {error && (
          <p id={`${selectId}-error`} className="mt-1 text-xs text-red-500">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${selectId}-helper`} className="mt-1 text-xs text-black">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }