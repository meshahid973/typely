import { useEffect } from "react";
import { audioEngine } from "../audio/audioEngine";

const releaseDuration = 460;

function getButton(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return null;
  }

  const button = target.closest("button");
  return button instanceof HTMLButtonElement && !button.disabled ? button : null;
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
      button.getBoundingClientRect();
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
        audioEngine.play("hover");
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) {
        return;
      }

      const button = getButton(event.target);

      if (button) {
        press(button);
      }
    };

    const handleClick = (event: MouseEvent) => {
      const button = getButton(event.target);

      if (button && button.dataset.sound !== "none") {
        audioEngine.play("click");
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
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
