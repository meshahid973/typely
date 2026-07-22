import { type ReactNode, useLayoutEffect, useRef } from "react";
import { cn } from "../../utils/cn";
import { shouldReduceMotion } from "../../utils/motion";

interface AnimatedValueProps {
  value: ReactNode;
  as?: "span" | "strong";
  className?: string;
  duration?: number;
}

interface ParsedValue {
  number: number;
  decimals: number;
  prefix: string;
  suffix: string;
}

function parseValue(value: number | string): ParsedValue | null {
  if (typeof value === "number") {
    return {
      number: value,
      decimals: Number.isInteger(value) ? 0 : 1,
      prefix: "",
      suffix: "",
    };
  }

  const match = value.match(/^([^\d-]*)(-?\d+(?:\.\d+)?)(.*)$/);

  if (!match) {
    return null;
  }

  const number = Number(match[2]);

  if (!Number.isFinite(number)) {
    return null;
  }

  return {
    number,
    decimals: match[2].includes(".") ? match[2].split(".")[1].length : 0,
    prefix: match[1],
    suffix: match[3],
  };
}

function formatValue(value: number, parsed: ParsedValue) {
  return `${parsed.prefix}${value.toFixed(parsed.decimals)}${parsed.suffix}`;
}

function easeOutQuint(value: number) {
  return 1 - (1 - value) ** 5;
}

export function AnimatedValue({
  value,
  as: Component = "span",
  className,
  duration = 260,
}: AnimatedValueProps) {
  const elementRef = useRef<HTMLElement>(null);
  const animationFrame = useRef<number | null>(null);
  const parsedInitial =
    typeof value === "number" || typeof value === "string" ? parseValue(value) : null;
  const currentNumber = useRef(parsedInitial?.number ?? 0);
  const animatable = typeof value === "number" || typeof value === "string";

  useLayoutEffect(() => {
    const element = elementRef.current;

    if (!element || !animatable) {
      return;
    }

    if (animationFrame.current !== null) {
      window.cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }

    const parsed = parseValue(value);

    if (!parsed) {
      currentNumber.current = 0;
      element.textContent = String(value);
      return;
    }

    const target = parsed.number;

    if (shouldReduceMotion() || Math.abs(target - currentNumber.current) < 0.001) {
      currentNumber.current = target;
      element.textContent = formatValue(target, parsed);
      return;
    }

    const start = currentNumber.current;
    const difference = target - start;
    const startedAt = performance.now();

    const update = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const next = start + difference * easeOutQuint(progress);
      currentNumber.current = next;
      element.textContent = formatValue(next, parsed);

      if (progress < 1) {
        animationFrame.current = window.requestAnimationFrame(update);
      } else {
        currentNumber.current = target;
        animationFrame.current = null;
      }
    };

    animationFrame.current = window.requestAnimationFrame(update);

    return () => {
      if (animationFrame.current !== null) {
        window.cancelAnimationFrame(animationFrame.current);
        animationFrame.current = null;
      }
    };
  }, [animatable, duration, value]);

  return (
    <Component className={cn("animated-value", className)}>
      <span ref={elementRef} className="animated-value-content">
        {value}
      </span>
    </Component>
  );
}
