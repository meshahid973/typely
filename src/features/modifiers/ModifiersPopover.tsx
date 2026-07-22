import { AtSign, CaseUpper, Delete, EyeOff, Hash, SlidersHorizontal } from "lucide-react";
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

const modifierCount = (configuration: TestConfiguration) =>
  Number(configuration.punctuation) +
  Number(configuration.numbers) +
  Number(configuration.capitals) +
  Number(configuration.noBackspace) +
  Number(configuration.hidden);

export function ModifiersPopover({ configuration, disabled, onChange }: ModifiersPopoverProps) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const selectedCount = modifierCount(configuration);
  const multiplier = calculateModifierMultiplier(configuration);
  const headingId = "modifiers-heading";

  useEffect(() => {
    if (disabled) {
      setOpen(false);
    }
  }, [disabled]);

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
          <div className="modifier-row">
            <span className="modifier-icon" aria-hidden="true">
              <AtSign size={15} />
            </span>
            <Toggle
              id="modifier-punctuation"
              label="Punctuation"
              description="Adds punctuation marks."
              checked={configuration.punctuation}
              onChange={(punctuation) => onChange({ ...configuration, punctuation })}
            />
            <span className="modifier-multiplier">1.08×</span>
          </div>
          <div className="modifier-row">
            <span className="modifier-icon" aria-hidden="true">
              <Hash size={15} />
            </span>
            <Toggle
              id="modifier-numbers"
              label="Numbers"
              description="Mixes number groups into the text."
              checked={configuration.numbers}
              onChange={(numbers) => onChange({ ...configuration, numbers })}
            />
            <span className="modifier-multiplier">1.05×</span>
          </div>
          <div className="modifier-row">
            <span className="modifier-icon" aria-hidden="true">
              <CaseUpper size={15} />
            </span>
            <Toggle
              id="modifier-capitals"
              label="Capitals"
              description="Adds regular uppercase words."
              checked={configuration.capitals}
              onChange={(capitals) => onChange({ ...configuration, capitals })}
            />
            <span className="modifier-multiplier">1.04×</span>
          </div>
          <div className="modifier-row">
            <span className="modifier-icon" aria-hidden="true">
              <Delete size={15} />
            </span>
            <Toggle
              id="modifier-no-backspace"
              label="No backspace"
              description="Disables correction during the run."
              checked={configuration.noBackspace}
              onChange={(noBackspace) => onChange({ ...configuration, noBackspace })}
            />
            <span className="modifier-multiplier">1.15×</span>
          </div>
          <div className="modifier-row">
            <span className="modifier-icon" aria-hidden="true">
              <EyeOff size={15} />
            </span>
            <Toggle
              id="modifier-hidden"
              label="Hidden"
              description="Completed characters fade after a short delay."
              checked={configuration.hidden}
              onChange={(hidden) => onChange({ ...configuration, hidden })}
            />
            <span className="modifier-multiplier">1.20×</span>
          </div>
        </div>
      </Popover>
    </div>
  );
}
