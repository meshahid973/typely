export interface TypingChallenge {
  id: string;
  title: string;
  description: string;
  text: string;
  tags: string[];
}

export const typingChallenges: TypingChallenge[] = [
  {
    id: "common-sprint",
    title: "Common sprint",
    description: "A clean speed passage built from familiar English words.",
    tags: ["speed", "standard"],
    text: "the quick road ahead feels simple when every small movement stays calm and clear we build speed through control not panic and let each word arrive in one smooth line",
  },
  {
    id: "precision-letter",
    title: "Precision letter",
    description: "Measured punctuation, capitals, and complete sentences.",
    tags: ["accuracy", "punctuation"],
    text: "Good typing is not only fast; it is deliberate. Keep your hands relaxed, read the next phrase, and finish each sentence without rushing the final word.",
  },
  {
    id: "technical-console",
    title: "Technical console",
    description: "Developer-style symbols, numbers, and compact identifiers.",
    tags: ["technical", "symbols"],
    text: "const retryCount = 3; if (response.status >= 500) { queue.push(task_id); } return cache[key] ?? fallback_value;",
  },
  {
    id: "number-control",
    title: "Number control",
    description: "Mixed numeric groups without abandoning readable prose.",
    tags: ["numbers", "control"],
    text: "Report 17 showed 248 active sessions, 96.4 percent accuracy, 12 delayed requests, and an average response time of 184 milliseconds.",
  },
  {
    id: "endurance-note",
    title: "Endurance note",
    description: "A longer passage designed to expose late-run consistency loss.",
    tags: ["endurance", "consistency"],
    text: "Progress becomes easier to measure when the test is long enough to move beyond the opening burst. Start at a pace that feels sustainable, keep the shoulders loose, and avoid forcing speed after a small mistake. A strong endurance run is not perfectly flat, but its changes remain controlled. The goal is to preserve accurate movement while attention begins to fade, then finish with the same deliberate technique used at the beginning.",
  },
  {
    id: "awkward-sequences",
    title: "Awkward sequences",
    description: "Long words and demanding letter transitions.",
    tags: ["technical", "long words"],
    text: "particularly extraordinary responsibilities require deliberate coordination, environmental awareness, and consistently thoughtful communication",
  },
];

export function getTypingChallenge(id: string | null | undefined) {
  if (!id) return null;
  return typingChallenges.find((challenge) => challenge.id === id) ?? null;
}

export function challengeWordCount(challenge: TypingChallenge) {
  return challenge.text.trim().split(/\s+/).filter(Boolean).length;
}
