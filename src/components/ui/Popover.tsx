import type { CSSProperties, PropsWithChildren, RefObject } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "../../utils/cn";

interface PopoverProps {
  open: boolean;
  labelledBy: string;
  anchorRef: RefObject<HTMLElement | null>;
  className?: string;
  onClose: () => void;
}

export function Popover({
  open,
  labelledBy,
  anchorRef,
  className,
  onClose,
  children,
}: PropsWithChildren<PopoverProps>) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimeout = useRef<number | null>(null);
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<CSSProperties>({});

  useEffect(() => {
    if (closeTimeout.current !== null) {
      window.clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }

    if (open) {
      setMounted(true);
      const frame = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }

    setVisible(false);
    closeTimeout.current = window.setTimeout(() => {
      setMounted(false);
      closeTimeout.current = null;
    }, 150);
  }, [open]);

  useLayoutEffect(() => {
    if (!mounted) {
      return;
    }

    const updatePosition = () => {
      const anchor = anchorRef.current;
      const panel = panelRef.current;

      if (!anchor || !panel) {
        return;
      }

      const anchorRect = anchor.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const padding = 14;
      const preferredLeft = anchorRect.left + anchorRect.width / 2 - panelRect.width / 2;
      const left = Math.max(
        padding,
        Math.min(window.innerWidth - panelRect.width - padding, preferredLeft),
      );
      const below = anchorRect.bottom + 10;
      const availableBelow = window.innerHeight - below - padding;
      const placeAbove = availableBelow < Math.min(panelRect.height, 360);
      const top = placeAbove ? Math.max(padding, anchorRect.top - panelRect.height - 10) : below;

      setPosition({
        left: `${left}px`,
        top: `${top}px`,
        maxHeight: `${Math.max(220, placeAbove ? anchorRect.top - 24 : availableBelow)}px`,
        transformOrigin: placeAbove ? "bottom center" : "top center",
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [anchorRef, mounted]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (!panelRef.current?.contains(target) && !anchorRef.current?.contains(target)) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [anchorRef, onClose, open]);

  useEffect(
    () => () => {
      if (closeTimeout.current !== null) {
        window.clearTimeout(closeTimeout.current);
      }
    },
    [],
  );

  if (!mounted) {
    return null;
  }

  return (
    <div
      ref={panelRef}
      className={cn("popover", className)}
      data-open={visible}
      role="dialog"
      aria-modal="false"
      aria-labelledby={labelledBy}
      style={position}
    >
      {children}
    </div>
  );
}
