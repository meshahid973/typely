import { type ButtonHTMLAttributes, forwardRef, type PropsWithChildren } from "react";
import { cn } from "../../utils/cn";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  tone?: "default" | "window";
}

export const IconButton = forwardRef<HTMLButtonElement, PropsWithChildren<IconButtonProps>>(
  function IconButton(
    { children, className, label, tone = "default", type = "button", ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn("icon-button", `icon-button-${tone}`, className)}
        aria-label={label}
        title={label}
        {...props}
      >
        <span className="icon-button-content">{children}</span>
      </button>
    );
  },
);
