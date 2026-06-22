import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * @description Theme-aware button class variants by visual intent and size.
 */
export const buttonVariants = cva(
  "relative inline-flex transform-gpu cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold outline-none transition-[background-color,border-color,color,box-shadow,transform] duration-200 focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--bg) disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45",
  {
    variants: {
      variant: {
        primary:
          "bg-(--accent) px-4 text-(--accent-contrast) shadow-(--shadow-sm) hover:bg-(--accent-strong)",
        secondary:
          "border border-(--border) bg-(--accent-soft) px-4 text-(--text) hover:border-(--accent) hover:text-(--accent)",
        ghost: "bg-transparent px-3 text-current hover:bg-(--accent-soft)",
        outline:
          "border border-(--border) bg-(--panel) px-4 text-(--text) hover:border-(--accent) hover:bg-(--accent-soft) hover:text-(--accent)",
        link: "px-0 text-(--accent) underline-offset-4 hover:underline",
      },
      size: {
        small: "h-8 text-xs",
        medium: "h-10 text-sm",
        large: "h-12 text-base",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "medium",
    },
  },
);

/**
 * @property asChild - Renders the button styles on the child element.
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  readonly asChild?: boolean;
}

/**
 * @param props - Button attributes, visual variant, size, and optional child slot behavior.
 * @returns A theme-aware button or slotted interactive element.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild = false, className, size, variant, ...props }, ref) => {
    const Component = asChild ? Slot : "button";

    return (
      <Component
        className={cn(buttonVariants({ className, size, variant }))}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
