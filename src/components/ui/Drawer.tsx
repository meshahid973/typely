import { X } from "lucide-react";
import type { PropsWithChildren } from "react";
import { useEffect, useRef } from "react";
import { IconButton } from "./IconButton";

interface DrawerProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
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
  children,
}: PropsWithChildren<DrawerProps>) {
  const drawerRef = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const titleId = "settings-drawer-title";
  const descriptionId = "settings-drawer-description";

  useEffect(() => {
    if (!open) {
      return;
    }

    const previouslyFocused = document.activeElement;
    const frame = window.requestAnimationFrame(() => closeButton.current?.focus());
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
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, [onClose, open]);

  return (
    <div className="drawer-layer" data-open={open} aria-hidden={!open} inert={!open}>
      <button
        type="button"
        className="drawer-scrim"
        data-sound="none"
        aria-label="Close settings"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />
      <aside
        ref={drawerRef}
        className="drawer"
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
          <IconButton ref={closeButton} label="Close settings" onClick={onClose}>
            <X size={17} />
          </IconButton>
        </header>
        <div className="drawer-content">{children}</div>
      </aside>
    </div>
  );
}
