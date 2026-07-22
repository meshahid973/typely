import {
  AtSign,
  CaseUpper,
  Delete,
  EyeOff,
  Hash,
  type LucideIcon,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GameButton } from "../../components/ui/GameButton";
import { Popover } from "../../components/ui/Popover";
import { Toggle } from "../../components/ui/Toggle";
import { calculateModifierMultiplier } from "../../core/scoring/calculateScore";
import type { TestConfiguration } from "../../core/typing/types";

interface ModifiersPopoverProps {
  configuration: TestConfiguration;
  disabled: boolean;
  onChange: (configuration: TestConfiguration) => void;
}

type ModifierKey = "punctuation" | "numbers" | "capitals" | "noBackspace" | "hidden";

interface ModifierOption {
  key: ModifierKey;
  label: string;
  description: string;
  multiplier: string;
  icon: LucideIcon;
}

const modifierOptions: ModifierOption[] = [
  {
    key: "punctuation",
    label: "Punctuation",
    description: "Adds punctuation marks.",
    multiplier: "1.08×",
    icon: AtSign,
  },
  {
    key: "numbers",
    label: "Numbers",
    description: "Mixes number groups into the text.",
    multiplier: "1.05×",
    icon: Hash,
  },
  {
    key: "capitals",
    label: "Capitals",
    description: "Adds regular uppercase words.",
    multiplier: "1.04×",
    icon: CaseUpper,
  },
  {
    key: "noBackspace",
    label: "No backspace",
    description: "Disables correction during the run.",
    multiplier: "1.15×",
    icon: Delete,
  },
  {
    key: "hidden",
    label: "Hidden",
    description: "Completed characters fade after a short delay.",
    multiplier: "1.20×",
    icon: EyeOff,
  },
];

function countSelectedModifiers(configuration: TestConfiguration) {
  return modifierOptions.reduce((total, option) => total + Number(configuration[option.key]), 0);
}

export function ModifiersPopover({ configuration, disabled, onChange }: ModifiersPopoverProps) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const selectedCount = countSelectedModifiers(configuration);
  const multiplier = calculateModifierMultiplier(configuration);
  const headingId = "modifiers-heading";

  useEffect(() => {
    if (disabled) {
      setOpen(false);
    }
  }, [disabled]);

  const changeModifier = (key: ModifierKey, enabled: boolean) => {
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
            <h2 id={headingId}>Modifiers</h2>
            <p>Add difficulty without crowding the stage.</p>
          </div>
          <strong>{multiplier.toFixed(2)}×</strong>
        </header>
        <div className="modifier-list">
          {modifierOptions.map((option) => {
            const Icon = option.icon;

            return (
              <div className="modifier-row" key={option.key}>
                <span className="modifier-icon" aria-hidden="true">
                  <Icon size={15} />
                </span>
                <Toggle
                  id={`modifier-${option.key}`}
                  label={option.label}
                  description={option.description}
                  checked={configuration[option.key]}
                  onChange={(enabled) => changeModifier(option.key, enabled)}
                />
                <span className="modifier-multiplier">{option.multiplier}</span>
              </div>
            );
          })}
        </div>
      </Popover>
    </div>
  );
}
