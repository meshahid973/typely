import { RefreshCw } from "lucide-react";
import { memo } from "react";
import { IconButton } from "../../components/ui/IconButton";
import type { TestConfiguration } from "../../core/typing/types";
import { ModifiersPopover } from "../modifiers/ModifiersPopover";
import { ModePicker } from "./ModePicker";

interface PracticeToolbarProps {
  configuration: TestConfiguration;
  disabled: boolean;
  refreshing: boolean;
  stagePhase: "idle" | "leaving" | "entering";
  onConfigurationChange: (configuration: TestConfiguration) => void;
  onRefresh: () => void;
}

export const PracticeToolbar = memo(function PracticeToolbar({
  configuration,
  disabled,
  refreshing,
  stagePhase,
  onConfigurationChange,
  onRefresh,
}: PracticeToolbarProps) {
  return (
    <fieldset className="practice-toolbar" data-stage-phase={stagePhase}>
      <legend className="visually-hidden">Test configuration</legend>
      <ModePicker
        configuration={configuration}
        disabled={disabled}
        onChange={onConfigurationChange}
      />
      <span className="toolbar-divider" aria-hidden="true" />
      <ModifiersPopover
        configuration={configuration}
        disabled={disabled}
        onChange={onConfigurationChange}
      />
      <IconButton
        label="Generate new words"
        className="refresh-button"
        disabled={disabled}
        onClick={onRefresh}
      >
        <RefreshCw className={refreshing ? "is-spinning" : undefined} size={15} />
      </IconButton>
    </fieldset>
  );
});
