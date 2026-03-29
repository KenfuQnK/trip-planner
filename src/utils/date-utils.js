import { DEFAULT_DAYS } from "./constants.js";
import { clamp } from "./index.js";

export function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function parseIsoDate(value) {
  if (typeof value !== "string") return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;

  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return null;
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;

  return date;
}

export function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function formatDayMeta(dateInput) {
  const date = typeof dateInput === "string" ? parseIsoDate(dateInput) : startOfDay(dateInput);
  if (!date || Number.isNaN(date.getTime())) return null;

  const key = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

  return {
    key,
    label: new Intl.DateTimeFormat("es-ES", { weekday: "long" }).format(date).replace(/^./, (char) => char.toUpperCase()),
    dateLabel: new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(date).replace(".", ""),
  };
}

export function normalizeImportedDays(input) {
  if (!Array.isArray(input) || input.length === 0) return DEFAULT_DAYS;

  return input
    .map((item) => {
      if (typeof item === "string") return formatDayMeta(item);
      if (typeof item?.key === "string") return formatDayMeta(item.key);
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => a.key.localeCompare(b.key))
    .filter((item, index, list) => index === list.findIndex((candidate) => candidate.key === item.key));
}
