import type { CadenceMetrics, TypingEvent } from "../typing/types";

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.max(minimum, Math.min(maximum, value));
}

function isEntryEvent(event: TypingEvent) {
  return event.type === "character" || event.type === "space";
}

function entryEvents(events: TypingEvent[]) {
  return events.filter(isEntryEvent);
}

function recentEntryEvents(events: TypingEvent[], maximum = 12) {
  const recent: TypingEvent[] = [];

  for (let index = events.length - 1; index >= 0 && recent.length < maximum; index -= 1) {
    const event = events[index];

    if (isEntryEvent(event)) {
      recent.push(event);
    }
  }

  recent.reverse();
  return recent;
}

export function calculateCadence(events: TypingEvent[]): CadenceMetrics {
  const recent = recentEntryEvents(events);

  if (recent.length < 2) {
    return {
      energy: 0,
      speed: 0,
      consistency: 1,
      averageIntervalMs: 0,
    };
  }

  const intervals = recent
    .slice(1)
    .map((event, index) => Math.max(16, event.timestamp - recent[index].timestamp));
  const averageIntervalMs =
    intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  const variance =
    intervals.reduce((sum, interval) => sum + (interval - averageIntervalMs) ** 2, 0) /
    intervals.length;
  const deviation = Math.sqrt(variance);
  const coefficient = averageIntervalMs === 0 ? 0 : deviation / averageIntervalMs;
  const consistency = clamp(1 - coefficient * 1.65);
  const speed = clamp((520 - averageIntervalMs) / 420);
  const energy = clamp(speed * 0.68 + consistency * 0.32);

  return {
    energy,
    speed,
    consistency,
    averageIntervalMs,
  };
}

export function calculateConsistency(events: TypingEvent[]) {
  const typedEvents = entryEvents(events);

  if (typedEvents.length < 4) {
    return 100;
  }

  const intervals = typedEvents
    .slice(1)
    .map((event, index) =>
      Math.max(20, Math.min(1800, event.timestamp - typedEvents[index].timestamp)),
    );
  const mean = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
  const variance =
    intervals.reduce((sum, value) => sum + (value - mean) ** 2, 0) / intervals.length;
  const deviation = Math.sqrt(variance);
  const coefficient = mean === 0 ? 0 : deviation / mean;

  return Math.round(clamp(1 - coefficient * 1.2) * 100);
}
