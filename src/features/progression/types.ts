export type AvatarStyle = "blush" | "lime" | "lavender" | "sky";

export interface PlayerProfile {
  name: string;
  avatarStyle: AvatarStyle;
  totalXp: number;
  testsCompleted: number;
  totalTypedCharacters: number;
  practiceTimeMs: number;
  createdAt: string;
}

export interface PlayerLevel {
  level: number;
  currentXp: number;
  requiredXp: number;
  progress: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
}
