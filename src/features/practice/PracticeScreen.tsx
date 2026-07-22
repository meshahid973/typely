import { useCallback, useMemo, useState } from "react";
import { useApp } from "../../app/AppProvider";
import type { TestConfiguration } from "../../core/typing/types";
import { TypingGameStage } from "./TypingGameStage";

const initialConfiguration: TestConfiguration = {
  mode: "time",
  value: 30,
  punctuation: false,
  numbers: false,
  capitals: false,
  noBackspace: false,
  hidden: false,
};

export function PracticeScreen() {
  const { settings, settingsOpen, addResult, results, setView } = useApp();
  const [configuration, setConfiguration] = useState(initialConfiguration);
  const previousBestWpm = useMemo(
    () => results.reduce((best, result) => Math.max(best, result.wpm), 0),
    [results],
  );
  const previousBestCombo = useMemo(
    () => results.reduce((best, result) => Math.max(best, result.maxCombo), 0),
    [results],
  );
  const handleComplete = useCallback(
    (result: Parameters<typeof addResult>[0]) => addResult(result),
    [addResult],
  );
  const openHistory = useCallback(() => setView("history"), [setView]);

  return (
    <TypingGameStage
      configuration={configuration}
      settings={settings}
      settingsOpen={settingsOpen}
      previousBestWpm={previousBestWpm}
      previousBestCombo={previousBestCombo}
      onConfigurationChange={setConfiguration}
      onComplete={handleComplete}
      onHistory={openHistory}
    />
  );
}
