import { useMemo } from "react";
import { useApp } from "../../app/AppProvider";
import { calculatePlayerLevel } from "../../features/progression/progression";

export function ProfileChip() {
  const { profile, profileOpen, openProfile, closeProfile } = useApp();
  const playerLevel = useMemo(() => calculatePlayerLevel(profile.totalXp), [profile.totalXp]);
  const initial = profile.name.trim().charAt(0).toUpperCase() || "P";

  return (
    <button
      type="button"
      className="profile-chip"
      data-avatar={profile.avatarStyle}
      aria-label={`${profileOpen ? "Close" : "Open"} ${profile.name}'s profile`}
      aria-haspopup="dialog"
      aria-expanded={profileOpen}
      onClick={profileOpen ? closeProfile : openProfile}
    >
      <span className="profile-chip-avatar" aria-hidden="true">
        {initial}
      </span>
      <span className="profile-chip-copy">
        <strong>{profile.name}</strong>
        <small>level {playerLevel.level}</small>
      </span>
    </button>
  );
}
