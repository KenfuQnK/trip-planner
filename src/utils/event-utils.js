import { PALETTES, ICONS, MIN_EVENT_MINUTES, HOUR_START, HOUR_END, DEFAULT_DAYS, CANVAS_TOP_PADDING } from "./constants.js";
import { clamp, snapMinutes, minutesToTime, minutesToY, yToMinutes } from "./index.js";
import { normalizeImportedDays } from "./date-utils.js";

export function normalizeEventTiming(event) {
  const start = clamp(Number(event?.start) || 0, HOUR_START * 60, HOUR_END * 60);
  const end = clamp(Number(event?.end) || MIN_EVENT_MINUTES, HOUR_START * 60, HOUR_END * 60);
  const normalizedEnd = Math.max(start + MIN_EVENT_MINUTES, end);
  const rawBufferStart = event?.bufferStart;
  const rawBufferEnd = event?.bufferEnd;
  const hasBufferStart = Number.isFinite(Number(rawBufferStart));
  const hasBufferEnd = Number.isFinite(Number(rawBufferEnd));
  const hasSafetyMargin = Boolean(event?.hasSafetyMargin);

  return {
    start,
    end: normalizedEnd,
    hasSafetyMargin,
    bufferStart: hasBufferStart ? clamp(Number(rawBufferStart), HOUR_START * 60, start) : start,
    bufferEnd: hasBufferEnd ? clamp(Number(rawBufferEnd), normalizedEnd, HOUR_END * 60) : normalizedEnd,
  };
}

export function buildEvent(day, start, end) {
  const timing = normalizeEventTiming({ start, end, hasSafetyMargin: false });
  return {
    id: crypto.randomUUID(),
    day,
    title: "Nuevo plan",
    isTrip: false,
    origin: "",
    destination: "",
    notes: "",
    link: "",
    price: "",
    pricePerPerson: false,
    isCritical: false,
    icon: "calendar",
    colorIndex: Math.floor(Math.random() * PALETTES.length),
    ...timing,
  };
}

export function normalizeImportedEvents(input, days = DEFAULT_DAYS) {
  if (!Array.isArray(input)) throw new Error("Formato invalido");
  const dayList = Array.isArray(days) && days.length > 0 ? days : DEFAULT_DAYS;
  const fallbackDayKey = dayList[0]?.key ?? DEFAULT_DAYS[0].key;

  return input
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;

      const nextDay = typeof item.day === "string" && dayList.some((d) => d?.key === item.day) ? item.day : fallbackDayKey;

      const timing = normalizeEventTiming(item);

      return {
        id: typeof item.id === "string" && item.id ? item.id : `imported-${index}-${crypto.randomUUID()}`,
        day: nextDay,
        title: typeof item.title === "string" ? item.title : "Nuevo plan",
        isTrip: Boolean(item.isTrip),
        origin: typeof item.origin === "string" ? item.origin : "",
        destination: typeof item.destination === "string" ? item.destination : "",
        notes: typeof item.notes === "string" ? item.notes : "",
        link: typeof item.link === "string" ? item.link : "",
        price: item.price == null ? "" : String(item.price),
        pricePerPerson: Boolean(item.pricePerPerson),
        isCritical: Boolean(item.isCritical),
        icon: ICONS.some((i) => i.key === item.icon) ? item.icon : "train",
        colorIndex: Number.isFinite(item.colorIndex) ? clamp(Number(item.colorIndex), 0, PALETTES.length - 1) : 0,
        ...timing,
      };
    })
    .filter(Boolean)
    .map((item) => ({
      ...item,
      origin: item.isTrip ? item.origin : "",
      destination: item.isTrip ? item.destination : "",
    }));
}

export function runSelfChecks() {
  console.assert(clamp(5, 0, 10) === 5, "clamp basic failed");
  console.assert(clamp(-1, 0, 10) === 0, "clamp min failed");
  console.assert(clamp(20, 0, 10) === 10, "clamp max failed");
  console.assert(snapMinutes(7) === 0, "snap down failed");
  console.assert(snapMinutes(8) === 15, "snap up failed");
  console.assert(minutesToTime(0) === "00:00", "minutesToTime midnight failed");
  console.assert(minutesToTime(75) === "01:15", "minutesToTime 75 failed");
  console.assert(minutesToY(60) === CANVAS_TOP_PADDING + 64, "minutesToY failed");
  console.assert(yToMinutes(64) === 60, "yToMinutes failed");
  console.assert(normalizeImportedDays(["2026-09-14", "2026-09-11", "2026-09-14"]).length === 2, "normalizeImportedDays failed");
  const normalizedDays = normalizeImportedDays(DEFAULT_DAYS);
  const normalized = normalizeImportedEvents([{ day: normalizedDays[1].key, start: 60, end: 70, icon: "plane" }], normalizedDays);
  console.assert(Array.isArray(normalized) && normalized.length === 1, "normalizeImportedEvents basic failed");
  console.assert(normalized[0].end >= normalized[0].start + MIN_EVENT_MINUTES, "normalizeImportedEvents min duration failed");
  console.assert(normalized[0].icon === "plane", "normalizeImportedEvents icon failed");
  const normalizedTiming = normalizeEventTiming({ start: 600, end: 660, hasSafetyMargin: true, bufferStart: 570, bufferEnd: 700 });
  console.assert(normalizedTiming.bufferStart === 570, "normalizeEventTiming bufferStart failed");
  console.assert(normalizedTiming.bufferEnd === 700, "normalizeEventTiming bufferEnd failed");
  const clampedTiming = normalizeEventTiming({ start: 600, end: 660, hasSafetyMargin: true, bufferStart: 620, bufferEnd: 650 });
  console.assert(clampedTiming.bufferStart === 600, "normalizeEventTiming clamps upper start buffer failed");
  console.assert(clampedTiming.bufferEnd === 660, "normalizeEventTiming clamps lower end buffer failed");
  const disabledTiming = normalizeEventTiming({ start: 600, end: 660, hasSafetyMargin: false, bufferStart: 570, bufferEnd: 700 });
  console.assert(disabledTiming.hasSafetyMargin === false, "normalizeEventTiming disabled margin flag failed");
}
