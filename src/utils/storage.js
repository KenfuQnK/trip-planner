import {
  STORAGE_KEY,
  STORAGE_VERSION,
  DEFAULT_DAYS,
  sampleEvents,
} from "./constants.js";
import { normalizeImportedDays } from "./date-utils.js";
import { normalizeImportedEvents } from "./event-utils.js";

export function loadStoredPlanner() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { days: DEFAULT_DAYS, events: sampleEvents };
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) return { days: DEFAULT_DAYS, events: normalizeImportedEvents(parsed, DEFAULT_DAYS) };
    const days = normalizeImportedDays(parsed?.days ?? DEFAULT_DAYS);
    const events = normalizeImportedEvents(parsed?.events ?? sampleEvents, days);
    return { days, events };
  } catch {
    return { days: DEFAULT_DAYS, events: sampleEvents };
  }
}

export function saveToStorage(days, events) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, days, events }));
  } catch {
    // ignore storage errors
  }
}
