import {
  AtSign,
  CaseUpper,
  Delete,
  EyeOff,
  Hash,
  type LucideIcon,
  SlidersHorizontal,
} from "lucide-react";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { AnimatedValue } from "../../components/ui/AnimatedValue";
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
    key: "numbers",
    label: "Numbers",
    description: "Mixes number groups into the text.",
    multiplier: "1.05×",
    icon: Hash,
  },
  {
    key: "punctuation",
    label: "Punctuation",
    description: "Adds punctuation marks.",
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
            <h2 id={headingId}>Mods</h2>
            <p>Build a harder run without crowding the stage.</p>
          </div>
          <AnimatedValue as="strong" value={`${multiplier.toFixed(2)}×`} duration={210} />
        </header>
        <div className="modifier-list">
          {modifierOptions.map((option, index) => {
            const Icon = option.icon;
            const enabled = configuration[option.key];
            const style = { "--modifier-delay": `${index * 38}ms` } as CSSProperties;

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
        </div>
      </Popover>
    </div>
  );
}
