import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "../../app/AppContext";
import { audioEngine } from "../../audio/audioEngine";
import { IconButton } from "../../components/ui/IconButton";
import { cn } from "../../lib/cn";
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
  const [refreshing, setRefreshing] = useState(false);
  const refreshTimeout = useRef<number | null>(null);
  const completedResult = useRef<string | null>(null);
  const handleComplete = useCallback(
    (result: Parameters<typeof addResult>[0]) => addResult(result),
    [addResult],
  );
  const test = useTypingTest({ configuration, onComplete: handleComplete });
  const active = test.status === "running" || test.status === "paused";

  useEffect(() => {
    return () => {
      if (refreshTimeout.current !== null) {
        window.clearTimeout(refreshTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!test.lastResult || completedResult.current === test.lastResult.id) {
      return;
    }

    completedResult.current = test.lastResult.id;
    audioEngine.play("complete");
  }, [test.lastResult]);

  const resetTest = () => {
    test.reset();
    setRefreshing(true);

    if (refreshTimeout.current !== null) {
      window.clearTimeout(refreshTimeout.current);
    }

    refreshTimeout.current = window.setTimeout(() => setRefreshing(false), 460);
  };

  return (
    <div className="view view-practice" data-status={test.status}>
      <div className="practice-toolbar">
        <ModePicker configuration={configuration} disabled={active} onChange={setConfiguration} />
        <IconButton label="New words" className="refresh-button" onClick={resetTest}>
          <RefreshCw className={cn(refreshing && "is-spinning")} size={16} />
        </IconButton>
      </div>
      <section className="typing-stage" aria-label="Typing test">
        <LiveStats
          configuration={configuration}
          metrics={test.metrics}
          progress={test.progress}
          elapsedMs={test.elapsedMs}
          status={test.status}
          showLiveStats={settings.liveStats}
        />
        <TypingSurface
          key={test.target}
          target={test.target}
          input={test.input}
          status={test.status}
          onInput={test.updateInput}
          onReset={resetTest}
        />
        <div className="typing-hints" data-hidden={active}>
          <span>
            <kbd>tab</kbd> restart
          </span>
          <span>
            <kbd>esc</kbd> reset
          </span>
        </div>
        {test.lastResult && (
          <ResultOverlay
            result={test.lastResult}
            onRestart={resetTest}
            onHistory={() => setView("history")}
          />
        )}
      </section>
    </div>
  );
}
