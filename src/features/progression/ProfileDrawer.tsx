import { Award, Clock3, Keyboard, Sparkles, Trophy } from "lucide-react";
import { type ChangeEvent, type KeyboardEvent, useEffect, useMemo, useState } from "react";
import { useApp } from "../../app/AppProvider";
import { Drawer } from "../../components/ui/Drawer";
import { ProgressLine } from "../../components/ui/ProgressLine";
import { formatLongDuration, formatNumber } from "../../utils/format";
import { AccountPanel } from "../auth/AccountPanel";
import { calculatePlayerLevel, getAchievements } from "./progression";
import type { AvatarStyle } from "./types";

const avatarStyles: Array<{ value: AvatarStyle; label: string }> = [
  { value: "blush", label: "Blush" },
  { value: "lime", label: "Lime" },
  { value: "lavender", label: "Lavender" },
  { value: "sky", label: "Sky" },
];

export function ProfileDrawer() {
  const { profile, profileOpen, closeProfile, updateProfile, results } = useApp();
  const [draftName, setDraftName] = useState(profile.name);
  const level = useMemo(() => calculatePlayerLevel(profile.totalXp), [profile.totalXp]);
  const achievements = useMemo(() => getAchievements(results), [results]);
  const unlocked = achievements.filter((achievement) => achievement.unlocked).length;
  const bestWpm = results.reduce((best, result) => Math.max(best, result.wpm), 0);
  const bestAccuracy = results.reduce((best, result) => Math.max(best, result.accuracy), 0);

  useEffect(() => {
    if (profileOpen) {
      setDraftName(profile.name);
    }
  }, [profile.name, profileOpen]);

  const saveName = () => {
    const name = draftName.trim().slice(0, 24) || "Player";
    setDraftName(name);
    updateProfile({ name });
  };

  return (
    <Drawer
      open={profileOpen}
      title="Profile"
      description="Keep playing offline or sign in to sync between devices."
      closeLabel="Close profile"
      onClose={closeProfile}
    >
      <section className="profile-hero" data-avatar={profile.avatarStyle}>
        <div className="profile-avatar" aria-hidden="true">
          {profile.name.trim().charAt(0).toUpperCase() || "P"}
        </div>
        <div className="profile-identity">
          <span>level {level.level}</span>
          <strong>{profile.name}</strong>
          <small>{formatNumber(profile.totalXp)} lifetime xp</small>
        </div>
      </section>

      <AccountPanel />

      <section className="profile-level" aria-label="Level progress">
        <div>
          <span>level progress</span>
          <strong>
            {level.currentXp} / {level.requiredXp} xp
          </strong>
        </div>
        <ProgressLine value={level.progress} label="Level progress" />
      </section>

      <section className="profile-stats" aria-label="Player statistics">
        <article>
          <Trophy size={16} aria-hidden="true" />
          <strong>{bestWpm}</strong>
          <span>best wpm</span>
        </article>
        <article>
          <Sparkles size={16} aria-hidden="true" />
          <strong>{bestAccuracy.toFixed(bestAccuracy % 1 === 0 ? 0 : 1)}%</strong>
          <span>best accuracy</span>
        </article>
        <article>
          <Keyboard size={16} aria-hidden="true" />
          <strong>{profile.testsCompleted}</strong>
          <span>tests</span>
        </article>
        <article>
          <Clock3 size={16} aria-hidden="true" />
          <strong>{formatLongDuration(profile.practiceTimeMs)}</strong>
          <span>practice</span>
        </article>
      </section>

      <section className="settings-section" aria-labelledby="profile-name-heading">
        <div className="settings-section-heading">
          <h3 id="profile-name-heading">Identity</h3>
          <p>Choose a short local name and profile colour.</p>
        </div>
        <label className="profile-name-field" htmlFor="profile-name">
          <span>Display name</span>
          <input
            id="profile-name"
            value={draftName}
            maxLength={24}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setDraftName(event.target.value)}
            onBlur={saveName}
            onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
              }
            }}
          />
        </label>
        <fieldset className="profile-avatar-options">
          <legend>Profile colour</legend>
          {avatarStyles.map((style) => (
            <button
              type="button"
              key={style.value}
              className="profile-avatar-option"
              data-avatar={style.value}
              aria-pressed={profile.avatarStyle === style.value}
              onClick={() => updateProfile({ avatarStyle: style.value })}
            >
              <span aria-hidden="true" />
              {style.label}
            </button>
          ))}
        </fieldset>
      </section>

      <section className="settings-section" aria-labelledby="achievements-heading">
        <div className="settings-section-heading profile-achievement-heading">
          <div>
            <h3 id="achievements-heading">Achievements</h3>
            <p>Small milestones earned from real completed tests.</p>
          </div>
          <span>
            {unlocked}/{achievements.length}
          </span>
        </div>
        <div className="achievement-list">
          {achievements.map((achievement) => (
            <article
              key={achievement.id}
              className="achievement-row"
              data-unlocked={achievement.unlocked}
            >
              <Award size={17} aria-hidden="true" />
              <div>
                <strong>{achievement.name}</strong>
                <span>{achievement.description}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </Drawer>
  );
}
