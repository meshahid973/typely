import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "../../lib/cn";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  tone?: "light" | "dark";
}

export function IconButton({
  children,
  className,
  label,
  tone = "light",
  type = "button",
  ...props
}: PropsWithChildren<IconButtonProps>) {
  return (
    <button
      type={type}
      className={cn("icon-button", `icon-button-${tone}`, className)}
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  );
}
