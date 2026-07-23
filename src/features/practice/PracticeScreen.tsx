import { useCallback, useMemo, useState } from "react";
import { useApp } from "../../app/AppProvider";
import type { TestResult } from "../../app/app.types";
import type { TestConfiguration } from "../../core/typing/types";
import { TypingGameStage } from "./TypingGameStage";

const initialConfiguration: TestConfiguration = {
  mode: "time",
  value: 30,
  punctuation: false,
  numbers: false,
  capitals: false,
  symbols: false,
  noBackspace: false,
  hidden: false,
  focusMode: false,
  noLiveWpm: false,
  suddenDeath: false,
  accuracyTarget: null,
  minimumPace: null,
  challengeId: null,
  ghostRace: false,
};

function matchesConfiguration(result: TestResult, configuration: TestConfiguration) {
  const stored = result.configuration;
  return (
    !result.failedReason &&
    result.mode === configuration.mode &&
    result.modeValue === configuration.value &&
    (stored.challengeId ?? null) === configuration.challengeId &&
    stored.punctuation === configuration.punctuation &&
    stored.numbers === configuration.numbers &&
    stored.capitals === configuration.capitals &&
    stored.symbols === configuration.symbols &&
    stored.noBackspace === configuration.noBackspace &&
    stored.hidden === configuration.hidden &&
    stored.focusMode === configuration.focusMode &&
    stored.suddenDeath === configuration.suddenDeath &&
    stored.accuracyTarget === configuration.accuracyTarget &&
    stored.minimumPace === configuration.minimumPace
  );
}

export function PracticeScreen() {
  const { settings, settingsOpen, profileOpen, addResult, results, setView } = useApp();
  const [configuration, setConfiguration] = useState(initialConfiguration);
  const matchingResults = useMemo(
    () => results.filter((result) => matchesConfiguration(result, configuration)),
    [configuration, results],
  );
  const previousBestResult = useMemo(
    () =>
      matchingResults.reduce<(typeof matchingResults)[number] | null>(
        (best, result) => (!best || result.wpm > best.wpm ? result : best),
        null,
      ),
    [matchingResults],
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
      overlayOpen={settingsOpen || profileOpen}
      previousBestResult={previousBestResult}
      previousBestCombo={previousBestCombo}
      onConfigurationChange={setConfiguration}
      onComplete={handleComplete}
      onHistory={openHistory}
    />
  );
}
