import {
  Asterisk,
  AtSign,
  CaseUpper,
  Delete,
  EyeOff,
  Focus,
  Gauge,
  Ghost,
  Hash,
  type LucideIcon,
  ShieldAlert,
  SlidersHorizontal,
  Target,
} from "lucide-react";
import { type ChangeEvent, type CSSProperties, useEffect, useRef, useState } from "react";
import { AnimatedValue } from "../../components/ui/AnimatedValue";
import { GameButton } from "../../components/ui/GameButton";
import { Popover } from "../../components/ui/Popover";
import { Toggle } from "../../components/ui/Toggle";
import { calculateModifierMultiplier } from "../../core/scoring/performance";
import type { TestConfiguration } from "../../core/typing/types";

interface ModifiersPopoverProps {
  configuration: TestConfiguration;
  disabled: boolean;
  onChange: (configuration: TestConfiguration) => void;
}

type BooleanModifierKey =
  | "punctuation"
  | "numbers"
  | "capitals"
  | "symbols"
  | "noBackspace"
  | "hidden"
  | "focusMode"
  | "noLiveWpm"
  | "suddenDeath"
  | "ghostRace";

interface ModifierOption {
  key: BooleanModifierKey;
  label: string;
  description: string;
  multiplier: string;
  icon: LucideIcon;
}

const modifierOptions: ModifierOption[] = [
  {
    key: "numbers",
    label: "Numbers",
    description: "Mixes number groups into generated text.",
    multiplier: "1.05×",
    icon: Hash,
  },
  {
    key: "punctuation",
    label: "Punctuation",
    description: "Adds punctuation marks throughout the run.",
    multiplier: "1.08×",
    icon: AtSign,
  },
  {
    key: "capitals",
    label: "Capitals",
    description: "Adds regular uppercase words.",
    multiplier: "1.04×",
    icon: CaseUpper,
  },
  {
    key: "symbols",
    label: "Symbols",
    description: "Adds keyboard symbols to technical words.",
    multiplier: "1.12×",
    icon: Asterisk,
  },
  {
    key: "noBackspace",
    label: "No backspace",
    description: "Disables correction for the entire run.",
    multiplier: "1.15×",
    icon: Delete,
  },
  {
    key: "hidden",
    label: "Blind words",
    description: "Completed characters fade shortly after typing.",
    multiplier: "1.20×",
    icon: EyeOff,
  },
  {
    key: "focusMode",
    label: "Focus",
    description: "Dims every word except the active word.",
    multiplier: "1.03×",
    icon: Focus,
  },
  {
    key: "noLiveWpm",
    label: "No live stats",
    description: "Hides WPM and accuracy until the result screen.",
    multiplier: "1.00×",
    icon: Gauge,
  },
  {
    key: "suddenDeath",
    label: "Sudden death",
    description: "The first incorrect entry immediately ends the run.",
    multiplier: "1.18×",
    icon: ShieldAlert,
  },
  {
    key: "ghostRace",
    label: "Race personal best",
    description: "Shows your lead or deficit against the best matching saved run.",
    multiplier: "1.00×",
    icon: Ghost,
  },
];

function countSelectedModifiers(configuration: TestConfiguration) {
  const booleanCount = modifierOptions.reduce(
    (total, option) => total + Number(configuration[option.key]),
    0,
  );
  return (
    booleanCount +
    Number(configuration.accuracyTarget !== null) +
    Number(configuration.minimumPace !== null)
  );
}

function boundedNumber(event: ChangeEvent<HTMLInputElement>, minimum: number, maximum: number) {
  const value = Number(event.target.value);
  return Number.isFinite(value) ? Math.max(minimum, Math.min(maximum, Math.round(value))) : minimum;
}

export function ModifiersPopover({ configuration, disabled, onChange }: ModifiersPopoverProps) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const selectedCount = countSelectedModifiers(configuration);
  const multiplier = calculateModifierMultiplier(configuration);
  const headingId = "modifiers-heading";

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  const changeModifier = (key: BooleanModifierKey, enabled: boolean) => {
    onChange({ ...configuration, [key]: enabled });
  };

  return (
    <div className="modifiers-anchor" ref={anchorRef}>
      <GameButton
        variant="ghost"
        size="small"
        className="modifiers-trigger"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <SlidersHorizontal size={14} />
        <span>mods</span>
        {selectedCount > 0 && <span className="modifiers-count">{selectedCount}</span>}
      </GameButton>
      <Popover
        open={open && !disabled}
        labelledBy={headingId}
        anchorRef={anchorRef}
        className="modifiers-popover"
        onClose={() => setOpen(false)}
      >
        <header className="popover-heading modifier-heading">
          <div>
            <h2 id={headingId}>Session modifiers</h2>
            <p>Change the rules without changing the core WPM test.</p>
          </div>
          <AnimatedValue as="strong" value={`${multiplier.toFixed(2)}×`} duration={210} />
        </header>

        <div className="modifier-list">
          {modifierOptions.map((option, index) => {
            const Icon = option.icon;
            const enabled = configuration[option.key];
            const style = { "--modifier-delay": `${index * 30}ms` } as CSSProperties;

            return (
              <div className="modifier-row" data-enabled={enabled} key={option.key} style={style}>
                <span className="modifier-icon" aria-hidden="true">
                  <Icon size={15} />
                </span>
                <Toggle
                  id={`modifier-${option.key}`}
                  label={option.label}
                  description={option.description}
                  checked={enabled}
                  onChange={(checked) => changeModifier(option.key, checked)}
                />
                <span className="modifier-multiplier">{option.multiplier}</span>
              </div>
            );
          })}

          <div
            className="modifier-row modifier-row-configurable"
            data-enabled={configuration.accuracyTarget !== null}
          >
            <span className="modifier-icon" aria-hidden="true">
              <Target size={15} />
            </span>
            <Toggle
              id="modifier-accuracy-target"
              label="Accuracy challenge"
              description="Marks the run failed when final accuracy misses the target."
              checked={configuration.accuracyTarget !== null}
              onChange={(checked) =>
                onChange({ ...configuration, accuracyTarget: checked ? 98 : null })
              }
            />
            {configuration.accuracyTarget !== null && (
              <label className="modifier-number-field">
                <span className="visually-hidden">Accuracy target</span>
                <input
                  type="number"
                  min={90}
                  max={100}
                  step={1}
                  value={configuration.accuracyTarget}
                  onChange={(event) =>
                    onChange({
                      ...configuration,
                      accuracyTarget: boundedNumber(event, 90, 100),
                    })
                  }
                />
                <span>%</span>
              </label>
            )}
          </div>

          <div
            className="modifier-row modifier-row-configurable"
            data-enabled={configuration.minimumPace !== null}
          >
            <span className="modifier-icon" aria-hidden="true">
              <Gauge size={15} />
            </span>
            <Toggle
              id="modifier-minimum-pace"
              label="Minimum pace"
              description="After a ten-second grace period, three slow seconds end the run."
              checked={configuration.minimumPace !== null}
              onChange={(checked) =>
                onChange({ ...configuration, minimumPace: checked ? 60 : null })
              }
            />
            {configuration.minimumPace !== null && (
              <label className="modifier-number-field">
                <span className="visually-hidden">Minimum WPM</span>
                <input
                  type="number"
                  min={20}
                  max={200}
                  step={5}
                  value={configuration.minimumPace}
                  onChange={(event) =>
                    onChange({
                      ...configuration,
                      minimumPace: boundedNumber(event, 20, 200),
                    })
                  }
                />
                <span>wpm</span>
              </label>
            )}
          </div>
        </div>
      </Popover>
    </div>
  );
}
