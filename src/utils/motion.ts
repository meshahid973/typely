export function shouldReduceMotion() {
  if (typeof document === "undefined") {
    return false;
  }

  return document.documentElement.dataset.motion === "reduced";
}
