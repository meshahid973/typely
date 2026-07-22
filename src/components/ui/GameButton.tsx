import { type ButtonHTMLAttributes, forwardRef, type PropsWithChildren } from "react";
import { cn } from "../../utils/cn";

interface GameButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "small" | "medium";
}

export const GameButton = forwardRef<HTMLButtonElement, PropsWithChildren<GameButtonProps>>(
  function GameButton(
    { children, className, variant = "primary", size = "medium", type = "button", ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn("game-button", `game-button-${variant}`, `game-button-${size}`, className)}
        {...props}
      >
        <span className="game-button-accent" aria-hidden="true" />
        <span className="game-button-content">{children}</span>
      </button>
    );
  },
);
