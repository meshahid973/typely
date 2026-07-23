export type SharedElementKey = "profile" | "settings";

const sharedDuration = 270;
const targetFrames = 10;
let activeSharedCleanup: (() => void) | null = null;
let activeThemeCleanup: (() => void) | null = null;

export function shouldReduceMotion() {
  if (typeof document === "undefined") {
    return false;
  }

  return document.documentElement.dataset.motion === "reduced";
}

function findSharedElement(kind: "source" | "target", key: SharedElementKey) {
  return document.querySelector<HTMLElement>(`[data-shared-${kind}="${key}"]`);
}

function createSharedGhost(element: HTMLElement, key: SharedElementKey) {
  const rect = element.getBoundingClientRect();
  const ghost = element.cloneNode(true) as HTMLElement;
  ghost.removeAttribute("id");
  ghost.removeAttribute("aria-label");
  ghost.removeAttribute("aria-expanded");
  ghost.removeAttribute("data-shared-source");
  ghost.removeAttribute("data-shared-target");
  ghost.setAttribute("aria-hidden", "true");
  ghost.classList.add("shared-element-ghost");
  ghost.dataset.sharedKey = key;
  ghost.style.left = `${rect.left}px`;
  ghost.style.top = `${rect.top}px`;
  ghost.style.width = `${rect.width}px`;
  ghost.style.height = `${rect.height}px`;

  const computed = getComputedStyle(element);
  ghost.style.color = computed.color;
  ghost.style.font = computed.font;
  document.body.append(ghost);

  return { ghost, rect };
}

function animateSharedGhost(ghost: HTMLElement, from: DOMRect, to: DOMRect, onFinish: () => void) {
  const deltaX = to.left - from.left;
  const deltaY = to.top - from.top;
  const scaleX = from.width > 0 ? to.width / from.width : 1;
  const scaleY = from.height > 0 ? to.height / from.height : 1;
  const animation = ghost.animate(
    [
      { transform: "translate3d(0, 0, 0) scale(1)", opacity: 1 },
      {
        transform: `translate3d(${deltaX * 1.018}px, ${deltaY * 1.018}px, 0) scale(${scaleX * 1.012}, ${scaleY * 1.012})`,
        opacity: 1,
        offset: 0.7,
      },
      {
        transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scaleX}, ${scaleY})`,
        opacity: 1,
      },
    ],
    {
      duration: sharedDuration,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      fill: "forwards",
    },
  );

  void animation.finished.catch(() => undefined).then(onFinish);
  return animation;
}

function getSharedTargetRect(target: HTMLElement) {
  const targetRect = target.getBoundingClientRect();
  const drawer = target.closest<HTMLElement>(".drawer");
  const layer = target.closest<HTMLElement>(".drawer-layer");

  if (!drawer || !layer) {
    return targetRect;
  }

  const drawerRect = drawer.getBoundingClientRect();
  const layerRect = layer.getBoundingClientRect();
  const finalDrawerLeft = window.innerWidth - drawerRect.width;
  const relativeLeft = targetRect.left - drawerRect.left;
  const relativeTop = targetRect.top - drawerRect.top;

  return new DOMRect(
    finalDrawerLeft + relativeLeft,
    layerRect.top + relativeTop,
    targetRect.width,
    targetRect.height,
  );
}

function waitForSharedTarget(
  key: SharedElementKey,
  callback: (target: HTMLElement) => void,
  onMissing: () => void,
) {
  let remainingFrames = targetFrames;

  const findTarget = () => {
    const target = findSharedElement("target", key);

    if (target) {
      callback(target);
      return;
    }

    remainingFrames -= 1;

    if (remainingFrames > 0) {
      window.requestAnimationFrame(findTarget);
    } else {
      onMissing();
    }
  };

  window.requestAnimationFrame(findTarget);
}

function cancelSharedTransition() {
  activeSharedCleanup?.();
  activeSharedCleanup = null;
}

export function openSharedElement(key: SharedElementKey, open: () => void) {
  cancelSharedTransition();

  if (shouldReduceMotion()) {
    open();
    return;
  }

  const source = findSharedElement("source", key);

  if (!source) {
    open();
    return;
  }

  const { ghost, rect } = createSharedGhost(source, key);
  let animation: Animation | null = null;
  let target: HTMLElement | null = null;
  let finished = false;

  const cleanup = () => {
    if (finished) {
      return;
    }

    finished = true;
    animation?.cancel();
    ghost.remove();
    source.removeAttribute("data-shared-hidden");
    target?.removeAttribute("data-shared-hidden");

    if (activeSharedCleanup === cleanup) {
      activeSharedCleanup = null;
    }
  };

  activeSharedCleanup = cleanup;
  source.dataset.sharedHidden = "true";
  open();

  waitForSharedTarget(
    key,
    (nextTarget) => {
      if (finished) {
        return;
      }

      target = nextTarget;
      target.dataset.sharedHidden = "true";
      animation = animateSharedGhost(ghost, rect, getSharedTargetRect(target), cleanup);
    },
    cleanup,
  );
}

export function closeSharedElement(key: SharedElementKey, close: () => void) {
  cancelSharedTransition();

  if (shouldReduceMotion()) {
    close();
    return;
  }

  const source = findSharedElement("source", key);
  const target = findSharedElement("target", key);

  if (!source || !target) {
    close();
    return;
  }

  const sourceRect = source.getBoundingClientRect();
  const { ghost, rect } = createSharedGhost(target, key);
  let animation: Animation | null = null;
  let finished = false;

  const cleanup = () => {
    if (finished) {
      return;
    }

    finished = true;
    animation?.cancel();
    ghost.remove();
    source.removeAttribute("data-shared-hidden");
    target.removeAttribute("data-shared-hidden");

    if (activeSharedCleanup === cleanup) {
      activeSharedCleanup = null;
    }
  };

  activeSharedCleanup = cleanup;
  source.dataset.sharedHidden = "true";
  target.dataset.sharedHidden = "true";

  // Start the drawer exit and shared-element return together.
  close();
  animation = animateSharedGhost(ghost, rect, sourceRect, cleanup);
}

export function runThemeWipe(origin: HTMLElement, apply: () => void, colourOverride?: string) {
  activeThemeCleanup?.();
  activeThemeCleanup = null;

  if (shouldReduceMotion()) {
    apply();
    return;
  }

  const rect = origin.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );
  const colourSource = origin.querySelector<HTMLElement>("[data-wipe-colour]") ?? origin;
  const colour = colourOverride ?? getComputedStyle(colourSource).backgroundColor;
  const layer = document.createElement("span");
  layer.className = "theme-wipe-layer";
  layer.style.backgroundColor = colour;
  document.body.append(layer);

  let applyTimer: number | null = null;
  let animation: Animation | null = null;
  let finished = false;

  const cleanup = () => {
    if (finished) {
      return;
    }

    finished = true;

    if (applyTimer !== null) {
      window.clearTimeout(applyTimer);
    }

    animation?.cancel();
    layer.remove();

    if (activeThemeCleanup === cleanup) {
      activeThemeCleanup = null;
    }
  };

  activeThemeCleanup = cleanup;
  animation = layer.animate(
    [
      { clipPath: `circle(0px at ${x}px ${y}px)`, opacity: 1 },
      { clipPath: `circle(${radius}px at ${x}px ${y}px)`, opacity: 1, offset: 0.68 },
      { clipPath: `circle(${radius}px at ${x}px ${y}px)`, opacity: 0 },
    ],
    {
      duration: 300,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      fill: "forwards",
    },
  );

  applyTimer = window.setTimeout(() => {
    applyTimer = null;
    apply();
  }, 112);

  void animation.finished.catch(() => undefined).then(cleanup);
}
