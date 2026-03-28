import { CalendarDays } from "lucide-react";
import {
  HOUR_START,
  HOUR_END,
  HOUR_HEIGHT,
  SNAP_MINUTES,
  CANVAS_TOP_PADDING,
  ICONS,
} from "./constants.js";

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function snapMinutes(minutes) {
  return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
}

export function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function yToMinutes(y) {
  const adjustedY = Math.max(0, y);
  const raw = HOUR_START * 60 + (adjustedY / HOUR_HEIGHT) * 60;
  return clamp(snapMinutes(raw), HOUR_START * 60, HOUR_END * 60);
}

export function minutesToY(minutes) {
  return CANVAS_TOP_PADDING + ((minutes - HOUR_START * 60) / 60) * HOUR_HEIGHT;
}

export function getIconComponent(iconKey) {
  return ICONS.find((item) => item.key === iconKey)?.icon || CalendarDays;
}

export function tryDownloadBlob(blob, filename) {
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}

export function tryOpenFilePicker(inputRef) {
  try {
    inputRef.current?.click();
    return true;
  } catch {
    return false;
  }
}
