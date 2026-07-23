import { BookOpen, Check } from "lucide-react";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { GameButton } from "../../components/ui/GameButton";
import { Popover } from "../../components/ui/Popover";
import {
  challengeWordCount,
  getTypingChallenge,
  typingChallenges,
} from "../../core/challenges/challenges";
import type { TestConfiguration } from "../../core/typing/types";

interface ChallengePickerProps {
  configuration: TestConfiguration;
  disabled: boolean;
  onChange: (configuration: TestConfiguration) => void;
}

export function ChallengePicker({ configuration, disabled, onChange }: ChallengePickerProps) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const selected = getTypingChallenge(configuration.challengeId);
  const headingId = "challenge-picker-heading";

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  return (
    <div className="challenge-picker-anchor" ref={anchorRef}>
      <GameButton
        variant="ghost"
        size="small"
        className="challenge-picker-trigger"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <BookOpen size={14} />
        <span>{selected?.title ?? "challenges"}</span>
      </GameButton>
      <Popover
        open={open && !disabled}
        labelledBy={headingId}
        anchorRef={anchorRef}
        className="challenge-picker-popover"
        onClose={() => setOpen(false)}
      >
        <header className="popover-heading">
          <div>
            <h2 id={headingId}>Typing challenges</h2>
            <p>Curated passages with stable text and separate records.</p>
          </div>
        </header>
        <div className="challenge-picker-list">
          <button
            type="button"
            className="challenge-picker-row"
            data-selected={configuration.challengeId === null}
            onClick={() => {
              onChange({
                ...configuration,
                mode: configuration.challengeId ? "words" : configuration.mode,
                value: configuration.challengeId ? 25 : configuration.value,
                challengeId: null,
              });
              setOpen(false);
            }}
          >
            <span>
              <strong>Generated test</strong>
              <small>Use the selected time or word mode.</small>
            </span>
            {configuration.challengeId === null && <Check size={15} aria-hidden="true" />}
          </button>
          {typingChallenges.map((challenge, index) => {
            const active = challenge.id === configuration.challengeId;
            const style = { "--challenge-delay": `${index * 28}ms` } as CSSProperties;

            return (
              <button
                type="button"
                className="challenge-picker-row"
                data-selected={active}
                key={challenge.id}
                style={style}
                onClick={() => {
                  onChange({
                    ...configuration,
                    mode: "words",
                    value: challengeWordCount(challenge),
                    challengeId: challenge.id,
                  });
                  setOpen(false);
                }}
              >
                <span>
                  <strong>{challenge.title}</strong>
                  <small>{challenge.description}</small>
                  <em>{challenge.tags.join(" · ")}</em>
                </span>
                {active && <Check size={15} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </Popover>
    </div>
  );
}
