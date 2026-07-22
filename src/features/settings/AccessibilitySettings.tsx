import type { AppSettings } from "../../app/app.types";
import { Toggle } from "../../components/ui/Toggle";

interface AccessibilitySettingsProps {
  settings: AppSettings;
  onChange: (settings: Partial<AppSettings>) => void;
}

export function AccessibilitySettings({ settings, onChange }: AccessibilitySettingsProps) {
  return (
    <section className="settings-section" aria-labelledby="accessibility-heading">
      <div className="settings-section-heading">
        <h3 id="accessibility-heading">Accessibility</h3>
        <p>Typely uses its own settings instead of Windows animation preferences.</p>
      </div>
      <Toggle
        id="reduced-motion"
        label="Reduced motion"
        description="Removes non-essential movement only when enabled here."
        checked={settings.reducedMotion}
        onChange={(reducedMotion) => onChange({ reducedMotion })}
      />
      <Toggle
        id="high-contrast"
        label="High contrast"
        description="Strengthens borders and text separation."
        checked={settings.highContrast}
        onChange={(highContrast) => onChange({ highContrast })}
      />
    </section>
  );
}
