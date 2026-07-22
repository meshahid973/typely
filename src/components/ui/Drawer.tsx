import { X } from "lucide-react";
import type { PropsWithChildren } from "react";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../utils/cn";
import { IconButton } from "./IconButton";

export type DrawerSize = "compact" | "standard" | "wide";

interface DrawerProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  closeLabel?: string;
  size?: DrawerSize;
  className?: string;
}

const focusableSelector = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[href]",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function Drawer({
  open,
  title,
  description,
  onClose,
  closeLabel = `Close ${title.toLowerCase()}`,
  size = "standard",
  className,
  children,
}: PropsWithChildren<DrawerProps>) {
  const drawerRef = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const restoreFrame = useRef<number | null>(null);
  const drawerId = useId();
  const titleId = `${drawerId}-title`;
  const descriptionId = `${drawerId}-description`;

  useEffect(() => {
    if (!open) {
      return;
    }

    if (restoreFrame.current !== null) {
      window.cancelAnimationFrame(restoreFrame.current);
      restoreFrame.current = null;
    }

    previousFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusFrame = window.requestAnimationFrame(() => {
      closeButton.current?.focus({ preventScroll: true });
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !drawerRef.current) {
        return;
      }

      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      );
      const first = focusable.at(0);
      const last = focusable.at(-1);

      if (!first || !last) {
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKeyDown);

      const target = previousFocus.current;
      restoreFrame.current = window.requestAnimationFrame(() => {
        target?.focus({ preventScroll: true });
        restoreFrame.current = null;
      });
    };
  }, [onClose, open]);

  useEffect(() => {
    return () => {
      if (restoreFrame.current !== null) {
        window.cancelAnimationFrame(restoreFrame.current);
      }
    };
  }, []);

  const layer = (
    <div
      className="drawer-layer"
      data-open={open}
      data-size={size}
      aria-hidden={!open}
      inert={!open}
    >
      <button
        type="button"
        className="drawer-scrim"
        data-sound="none"
        aria-label={closeLabel}
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />
      <aside
        ref={drawerRef}
        className={cn("drawer", className)}
        data-size={size}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <header className="drawer-header">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description && <p id={descriptionId}>{description}</p>}
          </div>
          <IconButton ref={closeButton} label={closeLabel} onClick={onClose}>
            <X size={18} />
          </IconButton>
        </header>
        <div className="drawer-content">{children}</div>
      </aside>
    </div>
  );

  return createPortal(layer, document.body);
}
