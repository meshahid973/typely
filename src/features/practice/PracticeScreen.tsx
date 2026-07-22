import { RefreshCw } from "lucide-react";
import { useCallback, useState } from "react";
import { useApp } from "../../app/AppContext";
import { IconButton } from "../../components/ui/IconButton";
import { LiveStats } from "./LiveStats";
import { ModePicker } from "./ModePicker";
import type { TestConfiguration } from "./practice.types";
import { ResultOverlay } from "./ResultOverlay";
import { TypingSurface } from "./TypingSurface";
import { useTypingTest } from "./useTypingTest";

const initialConfiguration: TestConfiguration = {
  mode: "time",
  value: 30,
  punctuation: false,
  numbers: false,
};

export function PracticeScreen() {
  const { settings, addResult, setView } = useApp();
  const [configuration, setConfiguration] = useState(initialConfiguration);
  const handleComplete = useCallback(
    (result: Parameters<typeof addResult>[0]) => addResult(result),
    [addResult],
  );
  const test = useTypingTest({ configuration, onComplete: handleComplete });
  const locked = test.status === "running" || test.status === "paused";

  return (
    <div className="view view-practice">
      <div className="practice-toolbar">
        <ModePicker configuration={configuration} disabled={locked} onChange={setConfiguration} />
        <IconButton label="New words" onClick={test.reset}>
          <RefreshCw size={17} />
        </IconButton>
      </div>
      <section className="typing-stage">
        <LiveStats
          configuration={configuration}
          metrics={test.metrics}
          progress={test.progress}
          elapsedMs={test.elapsedMs}
          status={test.status}
          showLiveStats={settings.liveStats}
        />
        <TypingSurface
          target={test.target}
          input={test.input}
          status={test.status}
          onInput={test.updateInput}
          onReset={test.reset}
        />
        <div className="typing-hints">
          <span>
            <kbd>tab</kbd> restart
          </span>
          <span>
            <kbd>esc</kbd> clear
          </span>
          <span>{configuration.punctuation ? "punctuation on" : "punctuation off"}</span>
          <span>{configuration.numbers ? "numbers on" : "numbers off"}</span>
        </div>
        {test.lastResult && (
          <ResultOverlay
            result={test.lastResult}
            onRestart={test.reset}
            onHistory={() => setView("history")}
          />
        )}
      </section>
    </div>
  );
}
