import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "../../utils/cn";

interface NavigationButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function NavigationButton({
  active = false,
  children,
  className,
  type = "button",
  ...props
}: PropsWithChildren<NavigationButtonProps>) {
  return (
    <button
      type={type}
      className={cn("navigation-button", active && "is-active", className)}
      aria-current={active ? "page" : undefined}
      {...props}
    >
      <span className="navigation-button-marker" aria-hidden="true" />
      <span className="navigation-button-content">{children}</span>
    </button>
  );
}
