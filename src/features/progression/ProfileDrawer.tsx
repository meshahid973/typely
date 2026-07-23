import { Award, Clock3, Gauge, Keyboard, Sparkles, Trophy } from "lucide-react";
import { type ChangeEvent, type KeyboardEvent, useEffect, useMemo, useState } from "react";
import { useApp } from "../../app/AppProvider";
import { Drawer } from "../../components/ui/Drawer";
import { ProgressLine } from "../../components/ui/ProgressLine";
import { formatDate, formatLongDuration, formatNumber } from "../../utils/format";
import { AccountPanel } from "../auth/AccountPanel";
import { calculatePlayerLevel, calculatePlayerPerformance, getAchievements } from "./progression";
import type { AvatarStyle } from "./types";

const avatarStyles: Array<{ value: AvatarStyle; label: string }> = [
  { value: "blush", label: "Blush" },
  { value: "lime", label: "Lime" },
  { value: "lavender", label: "Lavender" },
  { value: "sky", label: "Sky" },
];

function radarPoint(index: number, value: number, radius = 54) {
  const angle = (-90 + index * 60) * (Math.PI / 180);
  const distance = radius * (value / 100);
  return `${70 + Math.cos(angle) * distance},${70 + Math.sin(angle) * distance}`;
}

export function ProfileDrawer() {
  const { profile, profileOpen, closeProfile, updateProfile, results } = useApp();
  const [draftName, setDraftName] = useState(profile.name);
  const level = useMemo(() => calculatePlayerLevel(profile.totalXp), [profile.totalXp]);
  const performance = useMemo(() => calculatePlayerPerformance(results), [results]);
  const achievements = useMemo(() => getAchievements(results), [results]);
  const unlocked = achievements.filter((achievement) => achievement.unlocked).length;
  const radarPolygon = performance.skills
    .map((skill, index) => radarPoint(index, skill.value))
    .join(" ");
  const recentResults = results.slice(0, 4);

  useEffect(() => {
    if (profileOpen) setDraftName(profile.name);
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
      description="A performance identity built from completed local tests."
      closeLabel="Close profile"
      size="wide"
      onClose={closeProfile}
    >
      <section
        className="profile-hero profile-performance-hero"
        data-avatar={profile.avatarStyle}
        data-strongest-skill={performance.strongestSkill.id}
      >
        <div className="profile-avatar" aria-hidden="true">
          {profile.name.trim().charAt(0).toUpperCase() || "P"}
        </div>
        <div className="profile-identity">
          <span>
            level {level.level} ·{" "}
            {performance.currentRating > 0
              ? `strongest in ${performance.strongestSkill.label.toLowerCase()}`
              : "unrated"}
          </span>
          <strong>{profile.name}</strong>
          <small>{formatNumber(profile.totalXp)} lifetime xp</small>
        </div>
        <div className="profile-rating">
          <strong>{performance.currentRating}</strong>
          <span>current TP</span>
          <small>{performance.peakRating} peak</small>
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

      <section className="profile-performance-grid" aria-label="Typing performance profile">
        <article className="profile-skill-radar">
          <header>
            <div>
              <span>skill profile</span>
              <strong>Measured from recent runs</strong>
            </div>
          </header>
          <svg viewBox="0 0 140 140" role="img" aria-label="Typing skill radar">
            <polygon
              className="profile-radar-grid"
              points="70,16 116.8,43 116.8,97 70,124 23.2,97 23.2,43"
            />
            <polygon className="profile-radar-value" points={radarPolygon} />
            {performance.skills.map((skill, index) => {
              const [x, y] = radarPoint(index, 100, 63).split(",");
              return (
                <text key={skill.id} x={x} y={y} textAnchor="middle" dominantBaseline="middle">
                  {skill.label}
                </text>
              );
            })}
          </svg>
          <div className="profile-skill-list">
            {performance.skills.map((skill) => (
              <span key={skill.id}>
                <small>{skill.label}</small>
                <strong>{skill.value}</strong>
              </span>
            ))}
          </div>
        </article>

        <article className="profile-summary-panel">
          <div className="profile-summary-stat">
            <Trophy size={16} aria-hidden="true" />
            <strong>{performance.bestWpm}</strong>
            <span>best wpm</span>
          </div>
          <div className="profile-summary-stat">
            <Sparkles size={16} aria-hidden="true" />
            <strong>{performance.bestCleanWpm}</strong>
            <span>best clean wpm</span>
          </div>
          <div className="profile-summary-stat">
            <Gauge size={16} aria-hidden="true" />
            <strong>{performance.averageAccuracy}%</strong>
            <span>average accuracy</span>
          </div>
          <div className="profile-summary-stat">
            <Keyboard size={16} aria-hidden="true" />
            <strong>{performance.preferredMode ?? "—"}</strong>
            <span>preferred mode</span>
          </div>
          <div className="profile-summary-stat">
            <Clock3 size={16} aria-hidden="true" />
            <strong>{formatLongDuration(profile.practiceTimeMs)}</strong>
            <span>practice time</span>
          </div>
          <div className="profile-summary-stat">
            <Award size={16} aria-hidden="true" />
            <strong>{profile.testsCompleted}</strong>
            <span>completed tests</span>
          </div>
        </article>
      </section>

      {recentResults.length > 0 && (
        <section className="settings-section" aria-labelledby="profile-recent-heading">
          <div className="settings-section-heading">
            <h3 id="profile-recent-heading">Recent performance</h3>
            <p>Your latest local results, including difficulty and TP.</p>
          </div>
          <div className="profile-recent-results">
            {recentResults.map((result) => (
              <article key={result.id} data-grade={result.grade}>
                <strong>{result.grade}</strong>
                <span>{result.wpm} wpm</span>
                <span>{result.performanceRating} TP</span>
                <small>{formatDate(result.completedAt)}</small>
              </article>
            ))}
          </div>
        </section>
      )}

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
              if (event.key === "Enter") event.currentTarget.blur();
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
            <p>Milestones earned from real completed tests.</p>
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
