export type SoundPackId =
  | "soft-mechanical"
  | "clean-taps"
  | "digital"
  | "typewriter"
  | "muted"
  | "silent";

export type AudioEffect =
  | "typing-correct"
  | "typing-error"
  | "word-complete"
  | "combo-milestone"
  | "test-start"
  | "test-complete"
  | "personal-best"
  | "menu-hover"
  | "menu-select";

export const soundPacks: Array<{
  value: SoundPackId;
  label: string;
  description: string;
}> = [
  {
    value: "soft-mechanical",
    label: "Soft mechanical",
    description: "Rounded key taps with a quiet physical click.",
  },
  {
    value: "clean-taps",
    label: "Clean taps",
    description: "Light and precise with a rhythm-game feel.",
  },
  {
    value: "digital",
    label: "Digital",
    description: "Short electronic ticks with gentle pitch movement.",
  },
  {
    value: "typewriter",
    label: "Typewriter",
    description: "Dry key impacts with a soft paper-like texture.",
  },
  {
    value: "muted",
    label: "Muted",
    description: "Very quiet feedback for long practice sessions.",
  },
  {
    value: "silent",
    label: "Silent",
    description: "Disables every Typely sound.",
  },
];
