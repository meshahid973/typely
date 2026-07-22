import { useCallback, useEffect, useRef, useState } from "react";
import packageMetadata from "../../../package.json";
import { createTestRelease, fetchLatestRelease, type TypelyRelease } from "./updateClient";
import { isNewerVersion } from "./version";

const updateCacheKey = "typely.update-check";
const dismissedReleaseKey = "typely.update-dismissed";
const cacheDuration = 6 * 60 * 60 * 1000;
const testSequence = [
  "ArrowLeft",
  "ArrowLeft",
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
] as const;

interface CachedUpdate {
  checkedAt: number;
  release: TypelyRelease | null;
}

function readCachedUpdate() {
  try {
    const cached = JSON.parse(
      window.localStorage.getItem(updateCacheKey) ?? "null",
    ) as CachedUpdate | null;

    if (!cached || Date.now() - cached.checkedAt >= cacheDuration) {
      return null;
    }

    return cached;
  } catch {
    return null;
  }
}

function writeCachedUpdate(release: TypelyRelease | null) {
  try {
    window.localStorage.setItem(
      updateCacheKey,
      JSON.stringify({ checkedAt: Date.now(), release } satisfies CachedUpdate),
    );
  } catch {
    return;
  }
}

function isDismissed(version: string) {
  try {
    return window.localStorage.getItem(dismissedReleaseKey) === version;
  } catch {
    return false;
  }
}

export function useUpdateChecker() {
  const [release, setRelease] = useState<TypelyRelease | null>(null);
  const sequenceIndex = useRef(0);
  const lastSequenceKeyAt = useRef(0);

  const showRelease = useCallback((candidate: TypelyRelease | null) => {
    if (
      candidate &&
      (candidate.test || isNewerVersion(candidate.version, packageMetadata.version)) &&
      !isDismissed(candidate.version)
    ) {
      setRelease(candidate);
      return;
    }

    setRelease(null);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const cached = readCachedUpdate();

    if (cached) {
      showRelease(cached.release);
      return () => controller.abort();
    }

    const timeout = window.setTimeout(() => {
      void fetchLatestRelease(controller.signal)
        .then((candidate) => {
          writeCachedUpdate(candidate);
          showRelease(candidate);
        })
        .catch(() => undefined);
    }, 900);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [showRelease]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }

      const now = performance.now();

      if (now - lastSequenceKeyAt.current > 1800) {
        sequenceIndex.current = 0;
      }

      lastSequenceKeyAt.current = now;
      const expectedKey = testSequence[sequenceIndex.current];

      if (event.key === expectedKey) {
        sequenceIndex.current += 1;

        if (sequenceIndex.current === testSequence.length) {
          sequenceIndex.current = 0;
          setRelease(createTestRelease());
        }

        return;
      }

      sequenceIndex.current = event.key === testSequence[0] ? 1 : 0;
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const dismiss = useCallback(() => {
    setRelease((current) => {
      if (current && !current.test) {
        try {
          window.localStorage.setItem(dismissedReleaseKey, current.version);
        } catch {
          return null;
        }
      }

      return null;
    });
  }, []);

  return {
    currentVersion: packageMetadata.version,
    release,
    dismiss,
  };
}
