import { useEffect, useRef } from "react";
import { audioEngine } from "../../audio/audioEngine";

const releaseDuration = 520;
const selectionSelector = '[data-selection-target="true"]';

function getButton(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return null;
  }

  const button = target.closest("button");
  return button instanceof HTMLButtonElement && !button.disabled ? button : null;
}

function getSelectionTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return null;
  }

  const element = target.closest<HTMLElement>(selectionSelector);

  if (!element || element.matches(":disabled") || element.dataset.selectionDisabled === "true") {
    return null;
  }

  return element;
}

function enteredButton(event: PointerEvent, button: HTMLButtonElement) {
  const previous = event.relatedTarget;
  return !(previous instanceof Node) || !button.contains(previous);
}

export function PressFeedback() {
  useEffect(() => {
    const timers = new Map<HTMLButtonElement, number>();
    let activeButton: HTMLButtonElement | null = null;

    const clearRelease = (button: HTMLButtonElement) => {
      const timer = timers.get(button);

      if (timer !== undefined) {
        window.clearTimeout(timer);
        timers.delete(button);
      }

      button.classList.remove("is-releasing");
    };

    const press = (button: HTMLButtonElement) => {
      audioEngine.prepare();

      if (activeButton && activeButton !== button) {
        activeButton.classList.remove("is-pressing");
      }

      clearRelease(button);
      button.classList.add("is-pressing");
      activeButton = button;
    };

    const release = () => {
      const button = activeButton;

      if (!button) {
        return;
      }

      activeButton = null;
      button.classList.remove("is-pressing");
      button.classList.remove("is-releasing");
      void button.offsetWidth;
      button.classList.add("is-releasing");

      const timer = window.setTimeout(() => {
        button.classList.remove("is-releasing");
        timers.delete(button);
      }, releaseDuration);

      timers.set(button, timer);
    };

    const handlePointerOver = (event: PointerEvent) => {
      const button = getButton(event.target);

      if (button && enteredButton(event, button) && button.dataset.sound !== "none") {
        audioEngine.play("menu-hover");
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) {
        return;
      }

      audioEngine.prepare();
      const button = getButton(event.target);

      if (button) {
        press(button);
      }
    };

    const handleClick = (event: MouseEvent) => {
      const button = getButton(event.target);

      if (button && button.dataset.sound !== "none") {
        audioEngine.play("menu-select");
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      audioEngine.prepare();

      if (event.repeat || (event.key !== "Enter" && event.key !== " ")) {
        return;
      }

      const button = document.activeElement;

      if (button instanceof HTMLButtonElement && !button.disabled) {
        press(button);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        release();
      }
    };

    document.addEventListener("pointerover", handlePointerOver, { passive: true });
    document.addEventListener("pointerdown", handlePointerDown, { passive: true });
    document.addEventListener("pointerup", release, { passive: true });
    document.addEventListener("pointercancel", release, { passive: true });
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", release);

    return () => {
      document.removeEventListener("pointerover", handlePointerOver);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerup", release);
      document.removeEventListener("pointercancel", release);
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", release);

      for (const timer of timers.values()) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  return null;
}

export function SelectionBracket() {
  const bracketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bracket = bracketRef.current;

    if (!bracket) {
      return;
    }

    let activeTarget: HTMLElement | null = null;
    let squeezeTimer: number | null = null;
    let trackingFrame: number | null = null;
    let settleFrame: number | null = null;
    let lastRect: DOMRect | null = null;

    const removeActiveMarker = () => {
      activeTarget?.removeAttribute("data-selection-active");
    };

    const hide = () => {
      removeActiveMarker();
      activeTarget = null;
      lastRect = null;
      bracket.dataset.visible = "false";
      bracket.dataset.pressed = "false";
    };

    const isUsableTarget = (target: HTMLElement) => {
      if (!target.isConnected || target.matches(":disabled")) {
        return false;
      }

      if (
        target.dataset.selectionDisabled === "true" ||
        target.closest('[aria-hidden="true"]') ||
        target.closest("[inert]")
      ) {
        return false;
      }

      const drawerLayer = target.closest<HTMLElement>(".drawer-layer");

      if (drawerLayer && drawerLayer.dataset.open !== "true") {
        return false;
      }

      const style = getComputedStyle(target);
      return style.display !== "none" && style.visibility !== "hidden";
    };

    const position = (target: HTMLElement, overshoot = false) => {
      if (!isUsableTarget(target)) {
        hide();
        return;
      }

      const rect = target.getBoundingClientRect();

      if (rect.width <= 0 || rect.height <= 0) {
        hide();
        return;
      }

      const changed =
        !lastRect ||
        Math.abs(lastRect.left - rect.left) > 0.2 ||
        Math.abs(lastRect.top - rect.top) > 0.2 ||
        Math.abs(lastRect.width - rect.width) > 0.2 ||
        Math.abs(lastRect.height - rect.height) > 0.2;

      if (changed) {
        bracket.style.setProperty("--selection-left", `${rect.left - 5}px`);
        bracket.style.setProperty("--selection-top", `${rect.top - 5}px`);
        bracket.style.setProperty("--selection-width", `${rect.width + 10}px`);
        bracket.style.setProperty("--selection-height", `${rect.height + 10}px`);
        lastRect = rect;
      }

      bracket.dataset.visible = "true";

      if (overshoot && document.documentElement.dataset.motion !== "reduced") {
        bracket.getAnimations().forEach((animation) => {
          animation.cancel();
        });
        bracket.animate([{ scale: "0.98" }, { scale: "1.028", offset: 0.62 }, { scale: "1" }], {
          duration: 220,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        });
      }
    };

    const trackTarget = () => {
      trackingFrame = null;

      if (!activeTarget) {
        return;
      }

      position(activeTarget);
      trackingFrame = window.requestAnimationFrame(trackTarget);
    };

    const ensureTracking = () => {
      if (trackingFrame === null) {
        trackingFrame = window.requestAnimationFrame(trackTarget);
      }
    };

    const activate = (target: HTMLElement | null) => {
      if (!target || !isUsableTarget(target)) {
        return;
      }

      const changed = activeTarget !== target;

      if (changed) {
        removeActiveMarker();
        activeTarget = target;
        activeTarget.dataset.selectionActive = "true";
        lastRect = null;
      }

      position(target, changed);
      ensureTracking();
    };

    const settleAfterPointerMove = () => {
      if (settleFrame !== null) {
        window.cancelAnimationFrame(settleFrame);
      }

      settleFrame = window.requestAnimationFrame(() => {
        settleFrame = null;
        const focusedTarget = getSelectionTarget(document.activeElement);
        const hoveredTarget = document.querySelector<HTMLElement>(`${selectionSelector}:hover`);

        if (focusedTarget) {
          activate(focusedTarget);
        } else if (hoveredTarget) {
          activate(hoveredTarget);
        } else {
          hide();
        }
      });
    };

    const squeeze = () => {
      if (!activeTarget) {
        return;
      }

      bracket.dataset.pressed = "true";

      if (squeezeTimer !== null) {
        window.clearTimeout(squeezeTimer);
      }

      squeezeTimer = window.setTimeout(() => {
        bracket.dataset.pressed = "false";
        squeezeTimer = null;
      }, 145);
    };

    const handlePointerOver = (event: PointerEvent) => activate(getSelectionTarget(event.target));
    const handleFocusIn = (event: FocusEvent) => activate(getSelectionTarget(event.target));
    const handlePointerOut = () => settleAfterPointerMove();
    const handleFocusOut = () => settleAfterPointerMove();
    const handlePointerDown = (event: PointerEvent) => {
      const target = getSelectionTarget(event.target);

      if (target) {
        activate(target);
        squeeze();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        const target = getSelectionTarget(document.activeElement);

        if (target) {
          activate(target);
          squeeze();
        }
      }
    };
    const handleVisibilityChange = () => {
      if (document.hidden) {
        hide();
      }
    };

    document.addEventListener("pointerover", handlePointerOver, { passive: true });
    document.addEventListener("pointerout", handlePointerOut, { passive: true });
    document.addEventListener("pointerdown", handlePointerDown, { passive: true });
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("pointerover", handlePointerOver);
      document.removeEventListener("pointerout", handlePointerOut);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      removeActiveMarker();

      if (trackingFrame !== null) {
        window.cancelAnimationFrame(trackingFrame);
      }

      if (settleFrame !== null) {
        window.cancelAnimationFrame(settleFrame);
      }

      if (squeezeTimer !== null) {
        window.clearTimeout(squeezeTimer);
      }
    };
  }, []);

  return (
    <div
      ref={bracketRef}
      className="selection-bracket"
      data-visible="false"
      data-pressed="false"
      aria-hidden="true"
    >
      <span data-corner="top-left" />
      <span data-corner="top-right" />
      <span data-corner="bottom-left" />
      <span data-corner="bottom-right" />
    </div>
  );
}
