import { type RefObject, useCallback, useEffect, useRef, useState } from "react";
import type { AppSettings } from "../../app/app.types";
import { audioEngine } from "../../audio/audioEngine";
import type { CadenceMetrics, TypingFeedback, WordJudgement } from "../../core/typing/types";
import { shouldReduceMotion } from "../../utils/motion";

interface UseTypingFeedbackEffectsOptions {
  cadence: CadenceMetrics;
  caretElement: RefObject<HTMLSpanElement | null>;
  feedback: TypingFeedback;
  settings: AppSettings;
}

export function useTypingFeedbackEffects({
  cadence,
  caretElement,
  feedback,
  settings,
}: UseTypingFeedbackEffectsOptions) {
  const judgementTimeout = useRef<number | null>(null);
  const [visibleJudgement, setVisibleJudgement] = useState<WordJudgement | null>(null);

  useEffect(() => {
    const judgement = feedback.wordJudgement;

    if (!judgement) {
      return;
    }

    if (judgementTimeout.current !== null) {
      window.clearTimeout(judgementTimeout.current);
    }

    setVisibleJudgement(judgement);
    judgementTimeout.current = window.setTimeout(() => {
      setVisibleJudgement(null);
      judgementTimeout.current = null;
    }, 620);
  }, [feedback.wordJudgement]);

  useEffect(
    () => () => {
      if (judgementTimeout.current !== null) {
        window.clearTimeout(judgementTimeout.current);
      }
    },
    [],
  );

  useEffect(() => {
    const element = caretElement.current;

    if (!element || settings.reducedMotion || shouldReduceMotion() || feedback.sequence === 0) {
      return;
    }

    const incorrect = feedback.impact === "incorrect";
    const scaleX = incorrect ? 1.55 : 0.62 + cadence.speed * 0.12;
    const scaleY = incorrect ? 0.82 : 1.12 + cadence.energy * 0.08;

    for (const animation of element.getAnimations()) {
      animation.cancel();
    }
    element.animate(
      [
        {
          scale: `${scaleX} ${scaleY}`,
          backgroundColor: incorrect ? "var(--danger)" : "var(--accent-strong)",
        },
        { scale: "1 1", backgroundColor: "var(--accent-strong)" },
      ],
      {
        duration: incorrect ? 260 : 190,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    );
  }, [
    cadence.energy,
    cadence.speed,
    caretElement,
    feedback.impact,
    feedback.sequence,
    settings.reducedMotion,
  ]);

  const playFeedback = useCallback(
    (nextFeedback: TypingFeedback) => {
      if (nextFeedback.sequence === 0) {
        return;
      }

      const pitch = 0.96 + cadence.speed * 0.08;

      if (nextFeedback.started) {
        audioEngine.play("test-start");
      }

      if (nextFeedback.impact === "incorrect") {
        audioEngine.play("typing-error");
      } else if (nextFeedback.impact === "backspace") {
        audioEngine.play("typing-backspace");
      } else if (nextFeedback.impact === "correct") {
        audioEngine.play("typing-correct", { pitch });
      }

      if (nextFeedback.comboMilestone || nextFeedback.comboRecord) {
        const combo = nextFeedback.comboMilestone ?? nextFeedback.comboRecord ?? 0;
        audioEngine.play("combo-milestone", {
          pitch: Math.min(1.08, 1 + combo / 2500),
        });
        return;
      }

      if (nextFeedback.wordJudgement && nextFeedback.wordJudgement.type !== "miss") {
        audioEngine.play("word-complete", { pitch });
      }
    },
    [cadence.speed],
  );

  return { visibleJudgement, playFeedback };
}
