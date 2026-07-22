import type { ReactNode } from "react";
import { useAnimatedNumber } from "../../hooks/useAnimatedNumber";
import { cn } from "../../utils/cn";

interface AnimatedValueProps {
  value: ReactNode;
  as?: "span" | "strong";
  className?: string;
}

export function AnimatedValue({ value, as: Component = "span", className }: AnimatedValueProps) {
  const animatable = typeof value === "number" || typeof value === "string";
  const displayedValue = useAnimatedNumber(animatable ? value : "");

  return (
    <Component className={cn("animated-value", className)}>
      <span className="animated-value-content">{animatable ? displayedValue : value}</span>
    </Component>
  );
}
