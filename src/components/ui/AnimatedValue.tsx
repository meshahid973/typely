import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface AnimatedValueProps {
  value: ReactNode;
  as?: "span" | "strong";
  className?: string;
}

export function AnimatedValue({ value, as: Component = "span", className }: AnimatedValueProps) {
  return (
    <Component className={cn("animated-value", className)}>
      <span className="animated-value-content" key={String(value)}>
        {value}
      </span>
    </Component>
  );
}
