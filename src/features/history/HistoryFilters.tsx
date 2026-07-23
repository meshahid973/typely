import type { ChangeEvent } from "react";
import { Toggle } from "../../components/ui/Toggle";
import type { Grade } from "../../core/scoring/types";
import type { HistoryFilterState, ModeFilter } from "./historyFilterUtils";

interface HistoryFiltersProps {
  filters: HistoryFilterState;
  onChange: (filters: HistoryFilterState) => void;
}

const grades: Array<Grade | "all"> = ["all", "SS+", "SS", "S", "A", "B", "C", "D"];

export function HistoryFilters({ filters, onChange }: HistoryFiltersProps) {
  return (
    <section className="history-filters" aria-label="History filters">
      <label>
        <span>mode</span>
        <select
          value={filters.mode}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            onChange({ ...filters, mode: event.target.value as ModeFilter })
          }
        >
          <option value="all">All tests</option>
          <option value="time">Timed</option>
          <option value="words">Words</option>
        </select>
      </label>
      <label>
        <span>grade</span>
        <select
          value={filters.grade}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            onChange({ ...filters, grade: event.target.value as HistoryFilterState["grade"] })
          }
        >
          {grades.map((grade) => (
            <option key={grade} value={grade}>
              {grade === "all" ? "All grades" : grade}
            </option>
          ))}
        </select>
      </label>
      <Toggle
        id="history-modifiers"
        label="Mods only"
        checked={filters.modifiersOnly}
        compact
        onChange={(modifiersOnly) => onChange({ ...filters, modifiersOnly })}
      />
    </section>
  );
}
