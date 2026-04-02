import { PALETTES } from "./constants.js";

const COLOR_LABELS_STORAGE_KEY = "trip-weekend-planner-color-labels-v1";

export function normalizeColorLabels(input) {
  return Array.from({ length: PALETTES.length }, (_, index) => {
    const value = Array.isArray(input) ? input[index] : "";
    return typeof value === "string" ? value : "";
  });
}

export function loadStoredColorLabels() {
  try {
    const raw = localStorage.getItem(COLOR_LABELS_STORAGE_KEY);
    if (!raw) return normalizeColorLabels();
    return normalizeColorLabels(JSON.parse(raw));
  } catch {
    return normalizeColorLabels();
  }
}

export function saveColorLabels(colorLabels) {
  try {
    localStorage.setItem(COLOR_LABELS_STORAGE_KEY, JSON.stringify(normalizeColorLabels(colorLabels)));
  } catch {
    // ignore storage errors
  }
}
