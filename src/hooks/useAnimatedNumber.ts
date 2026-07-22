import { useEffect, useRef, useState } from "react";
import { shouldReduceMotion } from "../utils/motion";

interface ParsedNumber {
  number: number;
  decimals: number;
  prefix: string;
  suffix: string;
}

function parseNumber(value: number | string): ParsedNumber | null {
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

  const numericText = match[2];
  const numericValue = Number(numericText);

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return {
    number: numericValue,
    decimals: numericText.includes(".") ? numericText.split(".")[1].length : 0,
    prefix: match[1],
    suffix: match[3],
  };
}

function formatNumber(value: number, parsed: ParsedNumber) {
  return `${parsed.prefix}${value.toFixed(parsed.decimals)}${parsed.suffix}`;
}

function easeOutQuint(value: number) {
  return 1 - (1 - value) ** 5;
}

export function useAnimatedNumber(value: number | string, duration = 280) {
  const initial = parseNumber(value);
  const currentValue = useRef(initial?.number ?? 0);
  const animationFrame = useRef<number | null>(null);
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const parsed = parseNumber(value);

    if (!parsed) {
      currentValue.current = 0;
      setDisplayValue(value);
      return;
    }

    if (animationFrame.current !== null) {
      window.cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }

    if (shouldReduceMotion()) {
      currentValue.current = parsed.number;
      setDisplayValue(formatNumber(parsed.number, parsed));
      return;
    }

    const startValue = currentValue.current;
    const targetValue = parsed.number;
    const difference = targetValue - startValue;

    if (Math.abs(difference) < 0.001) {
      setDisplayValue(formatNumber(targetValue, parsed));
      return;
    }

    const startedAt = performance.now();

    const update = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const nextValue = startValue + difference * easeOutQuint(progress);
      currentValue.current = nextValue;
      setDisplayValue(formatNumber(nextValue, parsed));

      if (progress < 1) {
        animationFrame.current = window.requestAnimationFrame(update);
      } else {
        currentValue.current = targetValue;
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
  }, [duration, value]);

  return displayValue;
}
