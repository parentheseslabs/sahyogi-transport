import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-black text-white hover:bg-gray-800",
        secondary: "bg-gray-100 text-black hover:bg-gray-200",
        success: "bg-green-100 text-green-800 hover:bg-green-200",
        destructive: "bg-red-100 text-red-800 hover:bg-red-200",
        warning: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
        info: "bg-blue-100 text-blue-800 hover:bg-blue-200",
        outline: "text-black border border-gray-200 hover:bg-gray-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`${badgeVariants({ variant })} ${className || ""}`}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge, badgeVariants }