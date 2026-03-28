
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Plane,
  UtensilsCrossed,
  Hotel,
  House,
  Landmark,
  Trees,
  Train,
  Bus,
  Car,
  Sparkles,
  Plus,
  X,
  Pencil,
  Link as LinkIcon,
  StickyNote,
  Clock3,
  Trash2,
  Martini,
  Footprints,
  User,
  Copy,
  Download,
  Upload,
  Printer,
  Check,
  FileJson,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "./App.css";

const DEFAULT_DAYS = [
  { key: "2026-09-11", label: "Viernes", dateLabel: "11 Sep 2026" },
  { key: "2026-09-12", label: "Sabado", dateLabel: "12 Sep 2026" },
  { key: "2026-09-13", label: "Domingo", dateLabel: "13 Sep 2026" },
];

const HOUR_START = 0;
const HOUR_END = 24;
const HOUR_HEIGHT = 64;
const SNAP_MINUTES = 15;
const MIN_EVENT_MINUTES = 30;
const STORAGE_KEY = "trip-weekend-planner-events-v1";
const STORAGE_VERSION = 2;
const GUTTER_WIDTH = 56;
const COMPACT_DAY_LIMIT = 4;
const DAY_MIN_WIDTH = 320;
const CANVAS_TOP_PADDING = 18;

const ICONS = [
  { key: "plane", label: "Avion", icon: Plane },
  { key: "restaurant", label: "Restaurante", icon: UtensilsCrossed },
  { key: "hotel", label: "Hotel", icon: Hotel },
  { key: "home", label: "Casa", icon: House },
  { key: "museum", label: "Museo", icon: Landmark },
  { key: "park", label: "Parque", icon: Trees },
  { key: "train", label: "Tren", icon: Train },
  { key: "bus", label: "Bus", icon: Bus },
  { key: "car", label: "Coche", icon: Car },
  { key: "spa", label: "Spa", icon: Sparkles },
  { key: "cocktail", label: "Cocteleria", icon: Martini },
  { key: "walk", label: "Andando", icon: Footprints },
];

const PALETTES = [
  { card: "bg-sky-500/90", accent: "border-sky-300" },
  { card: "bg-violet-500/90", accent: "border-violet-300" },
  { card: "bg-emerald-500/90", accent: "border-emerald-300" },
  { card: "bg-rose-500/90", accent: "border-rose-300" },
  { card: "bg-amber-500/90", accent: "border-amber-300" },
  { card: "bg-cyan-500/90", accent: "border-cyan-300" },
  { card: "bg-fuchsia-500/90", accent: "border-fuchsia-300" },
  { card: "bg-lime-500/90", accent: "border-lime-300" },
  { card: "bg-orange-500/90", accent: "border-orange-300" },
  { card: "bg-indigo-500/90", accent: "border-indigo-300" },
  { card: "bg-teal-500/90", accent: "border-teal-300" },
  { card: "bg-pink-500/90", accent: "border-pink-300" },
];

const sampleEvents = [
  {
    id: crypto.randomUUID(),
    day: "2026-09-11",
    title: "Vuelo a Milan",
    notes: "Salida desde Barcelona. Facturar equipaje y revisar puerta.",
    link: "",
    price: "89",
    pricePerPerson: false,
    icon: "plane",
    colorIndex: 0,
    start: 8 * 60 + 30,
    end: 10 * 60 + 10,
  },
  {
    id: crypto.randomUUID(),
    day: "2026-09-11",
    title: "Tren a Modena",
    notes: "Comprar billete con antelacion.",
    link: "",
    price: "24",
    pricePerPerson: false,
    icon: "train",
    colorIndex: 2,
    start: 17 * 60,
    end: 18 * 60 + 40,
  },
  {
    id: crypto.randomUUID(),
    day: "2026-09-12",
    title: "Museo Ferrari",
    notes: "Llevar entrada y revisar el bus.",
    link: "",
    price: "31",
    pricePerPerson: false,
    icon: "museum",
    colorIndex: 1,
    start: 10 * 60,
    end: 12 * 60 + 30,
  },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function snapMinutes(minutes) {
  return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
}

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function yToMinutes(y) {
  const adjustedY = Math.max(0, y);
  const raw = HOUR_START * 60 + (adjustedY / HOUR_HEIGHT) * 60;
  return clamp(snapMinutes(raw), HOUR_START * 60, HOUR_END * 60);
}

function minutesToY(minutes) {
  return CANVAS_TOP_PADDING + ((minutes - HOUR_START * 60) / 60) * HOUR_HEIGHT;
}

function getIconComponent(iconKey) {
  return ICONS.find((item) => item.key === iconKey)?.icon || CalendarDays;
}

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function parseIsoDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function formatDayMeta(dateInput) {
  const date = typeof dateInput === "string" ? parseIsoDate(dateInput) : startOfDay(dateInput);
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

function normalizeImportedDays(input) {
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

function buildEvent(day, start, end) {
  return {
    id: crypto.randomUUID(),
    day,
    title: "Nuevo plan",
    notes: "",
    link: "",
    price: "",
    pricePerPerson: false,
    icon: "calendar",
    colorIndex: Math.floor(Math.random() * PALETTES.length),
    start,
    end,
  };
}

function normalizeImportedEvents(input, days = DEFAULT_DAYS) {
  if (!Array.isArray(input)) throw new Error("Formato invalido");
  return input
    .map((item, index) => ({
      id: typeof item.id === "string" && item.id ? item.id : `imported-${index}-${crypto.randomUUID()}`,
      day: days.some((d) => d.key === item.day) ? item.day : days[0].key,
      title: typeof item.title === "string" ? item.title : "Nuevo plan",
      notes: typeof item.notes === "string" ? item.notes : "",
      link: typeof item.link === "string" ? item.link : "",
      price: item.price == null ? "" : String(item.price),
      pricePerPerson: Boolean(item.pricePerPerson),
      icon: ICONS.some((i) => i.key === item.icon) ? item.icon : "train",
      colorIndex: Number.isFinite(item.colorIndex) ? clamp(Number(item.colorIndex), 0, PALETTES.length - 1) : 0,
      start: clamp(Number(item.start) || 0, HOUR_START * 60, HOUR_END * 60),
      end: clamp(Number(item.end) || MIN_EVENT_MINUTES, HOUR_START * 60, HOUR_END * 60),
    }))
    .map((item) => ({
      ...item,
      end: Math.max(item.start + MIN_EVENT_MINUTES, item.end),
    }));
}

function runSelfChecks() {
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
}

runSelfChecks();

function tryDownloadBlob(blob, filename) {
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

function tryOpenFilePicker(inputRef) {
  try {
    inputRef.current?.click();
    return true;
  } catch {
    return false;
  }
}
function FallbackPanel({ fallbackData, onClose, onImportText }) {
  const [importText, setImportText] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!fallbackData?.content) return;
    try {
      await navigator.clipboard.writeText(fallbackData.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  if (!fallbackData) return null;

  const isExport = fallbackData.type === "export-json";
  const isPrint = fallbackData.type === "print-help";
  const isImport = fallbackData.type === "import-json";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-3xl border border-white/70 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2 text-slate-900">
            {isExport ? <FileJson className="h-5 w-5" /> : null}
            {isPrint ? <ImageIcon className="h-5 w-5" /> : null}
            {isImport ? <Upload className="h-5 w-5" /> : null}
            <h2 className="text-lg font-semibold">{fallbackData.title}</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 px-4 py-4">
          <p className="text-sm text-slate-600">{fallbackData.description}</p>

          {isImport ? (
            <>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="h-[360px] w-full rounded-2xl border border-slate-200 px-3 py-3 font-mono text-xs outline-none transition focus:border-slate-400"
                placeholder="Pega aqui el JSON exportado..."
              />
              <div className="flex justify-end gap-2">
                <button onClick={onClose} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Cancelar</button>
                <button onClick={() => onImportText(importText)} className="rounded-2xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800">Importar JSON pegado</button>
              </div>
            </>
          ) : null}

          {isExport && fallbackData.content ? (
            <>
              <div className="flex justify-end">
                <button onClick={handleCopy} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copiado" : "Copiar"}
                </button>
              </div>
              <textarea readOnly value={fallbackData.content} className="h-[360px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 font-mono text-xs outline-none" />
            </>
          ) : null}

          {isPrint ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p>La impresion directa puede estar bloqueada en este entorno embebido.</p>
              <p className="mt-2">Prueba una de estas opciones:</p>
              <ul className="mt-2 list-disc pl-5">
                <li>Usa el atajo de imprimir del navegador.</li>
                <li>Abre esta app fuera del canvas embebido.</li>
                <li>Exporta el JSON y vuelve a importarlo en un entorno normal.</li>
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function EventModal({ event, onClose, onSave, onDelete }) {
  const [draft, setDraft] = useState(event);

  useEffect(() => {
    setDraft(event);
  }, [event]);

  const copyLinkToClipboard = async () => {
    if (!draft.link) return;
    try {
      await navigator.clipboard.writeText(draft.link);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm">
      <div className="w-full max-w-5xl rounded-3xl border border-white/70 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-slate-900">Editar bloque</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid gap-4 px-4 py-4 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700"><Pencil className="h-4 w-4" /> Titulo</span>
              <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-slate-400" placeholder="Ej. Tren a Modena" />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700"><Clock3 className="h-4 w-4" /> Inicio</span>
                <input type="time" step={900} value={minutesToTime(draft.start)} onChange={(e) => {
                  const [h, m] = e.target.value.split(":").map(Number);
                  const nextStart = h * 60 + m;
                  setDraft({ ...draft, start: nextStart, end: Math.max(nextStart + MIN_EVENT_MINUTES, draft.end) });
                }} className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-slate-400" />
              </label>
              <label className="block">
                <span className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700"><Clock3 className="h-4 w-4" /> Fin</span>
                <input type="time" step={900} value={minutesToTime(draft.end)} onChange={(e) => {
                  const [h, m] = e.target.value.split(":").map(Number);
                  const nextEnd = h * 60 + m;
                  setDraft({ ...draft, end: Math.max(draft.start + MIN_EVENT_MINUTES, nextEnd) });
                }} className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-slate-400" />
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700"><StickyNote className="h-4 w-4" /> Notas</span>
              <textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} rows={7} className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-slate-400" placeholder="Reserva, ideas, direccion, recordatorios..." />
            </label>

            <div>
              <span className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700"><LinkIcon className="h-4 w-4" /> Enlace</span>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <input value={draft.link} onChange={(e) => setDraft({ ...draft, link: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-slate-400" placeholder="https://..." />
                <button type="button" onClick={copyLinkToClipboard} className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-3 py-2.5 text-slate-700 transition hover:bg-slate-50 disabled:opacity-40" disabled={!draft.link} title="Copiar enlace"><Copy className="h-4 w-4" /></button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Icono</p>
              <div className="grid grid-cols-6 gap-2">
                {ICONS.map((item) => {
                  const Icon = item.icon;
                  const selected = draft.icon === item.key;
                  return <button key={item.key} title={item.label} onClick={() => setDraft({ ...draft, icon: item.key })} className={`flex h-10 items-center justify-center rounded-xl border transition ${selected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"}`}><Icon className="h-4 w-4 shrink-0" /></button>;
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Color</p>
              <div className="grid grid-cols-3 gap-2">
                {PALETTES.map((palette, index) => <button key={index} onClick={() => setDraft({ ...draft, colorIndex: index })} className={`h-12 rounded-2xl border-2 transition ${palette.card} ${draft.colorIndex === index ? "scale-95 border-slate-950" : "border-white"}`} />)}
              </div>
            </div>

            <div className="grid grid-cols-[1fr_auto] items-end gap-2">
              <label className="block">
                <span className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">EUR Precio</span>
                <input type="number" min="0" step="0.01" value={draft.price ?? ""} onChange={(e) => setDraft({ ...draft, price: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-slate-400" placeholder="Ej. 18.50" />
              </label>
              <label className="flex h-[42px] items-center gap-2 rounded-2xl border border-slate-200 px-3 text-sm text-slate-700 whitespace-nowrap">
                <input type="checkbox" checked={Boolean(draft.pricePerPerson)} onChange={(e) => setDraft({ ...draft, pricePerPerson: e.target.checked })} className="h-4 w-4 rounded" />
                <span>Precio por persona</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
          <button onClick={() => onDelete(draft.id)} className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"><Trash2 className="h-4 w-4" /> Eliminar</button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Cancelar</button>
            <button onClick={() => onSave({ ...draft, end: Math.max(draft.start + MIN_EVENT_MINUTES, draft.end) })} className="rounded-2xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800">Guardar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddDaysModal({ existingDayKeys, initialMonthKey, onClose, onAccept }) {
  const [visibleMonth, setVisibleMonth] = useState(() => startOfDay(initialMonthKey ? parseIsoDate(initialMonthKey) : new Date()));
  const [selectedKeys, setSelectedKeys] = useState([]);

  const monthLabel = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(visibleMonth);
  const weekdayFormatter = new Intl.DateTimeFormat("es-ES", { weekday: "short" });
  const weekdayHeaders = Array.from({ length: 7 }).map((_, index) => {
    const base = new Date(2026, 2, 2 + index);
    return weekdayFormatter.format(base).replace(".", "").slice(0, 2).toUpperCase();
  });

  const cells = useMemo(() => {
    const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
    const firstWeekday = (first.getDay() + 6) % 7;
    const items = [];
    for (let index = 0; index < firstWeekday; index += 1) items.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) items.push(startOfDay(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day)));
    while (items.length < 42) items.push(null);
    return items;
  }, [visibleMonth]);

  const toggleDay = (date) => {
    const key = formatDayMeta(date).key;
    if (existingDayKeys.includes(key)) return;
    setSelectedKeys((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key].sort()));
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm">
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col rounded-3xl border border-white/70 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Anadir dias</h2>
            <p className="text-sm text-slate-500">Selecciona uno o varios dias para insertarlos en el canvas.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-4 py-4">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <button onClick={() => setVisibleMonth((prev) => addMonths(prev, -1))} className="rounded-full p-2 text-slate-600 transition hover:bg-white hover:text-slate-900"><ChevronLeft className="h-4 w-4" /></button>
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">{monthLabel}</div>
            <button onClick={() => setVisibleMonth((prev) => addMonths(prev, 1))} className="rounded-full p-2 text-slate-600 transition hover:bg-white hover:text-slate-900"><ChevronRight className="h-4 w-4" /></button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {weekdayHeaders.map((label) => <div key={label}>{label}</div>)}
          </div>

          <div className="grid h-[24rem] flex-none grid-cols-7 grid-rows-6 gap-1.5">
            {cells.map((date, index) => {
              if (!date) return <div key={`empty-${index}`} className="h-full rounded-xl bg-slate-50/70" />;
              const meta = formatDayMeta(date);
              const isExisting = existingDayKeys.includes(meta.key);
              const isSelected = selectedKeys.includes(meta.key);
              return (
                <button key={meta.key} onClick={() => toggleDay(date)} disabled={isExisting} className={`h-full rounded-xl border text-left transition ${isExisting ? "cursor-not-allowed border-green-200 bg-green-100 text-slate-400" : isSelected ? "border-sky-600 bg-sky-600 text-white shadow-lg shadow-sky-200" : "border-slate-200 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50"}`}>
                  <div className="flex h-full flex-col justify-between p-2">
                    <span className="text-sm font-semibold">{date.getDate()}</span>
                    <span className="text-[10px] uppercase tracking-[0.18em] opacity-80">{isExisting ? "Añadido" : "Añadir"}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">{selectedKeys.length === 0 ? "No hay dias seleccionados." : `${selectedKeys.length} dia(s) listos para anadir.`}</div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
          <button onClick={onClose} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Cancelar</button>
          <button onClick={() => onAccept(selectedKeys)} disabled={selectedKeys.length === 0} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-40"><Plus className="h-4 w-4" /> Aceptar</button>
        </div>
      </div>
    </div>
  );
}
function DayHeader({ day, onCreateEvent, onDeleteDay, canDeleteDay }) {
  return (
    <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 px-4 py-2.5 backdrop-blur print:bg-white">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-slate-900">{day.label}</div>
          <div className="truncate text-sm text-slate-500">{day.dateLabel}</div>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <button onClick={() => onCreateEvent(buildEvent(day.key, 9 * 60, 10 * 60), true)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"><Plus className="h-4 w-4" /> Anadir</button>
          <button onClick={() => onDeleteDay(day)} disabled={!canDeleteDay} title={canDeleteDay ? "Eliminar dia" : "Debe quedar al menos un dia"} className="inline-flex items-center justify-center rounded-2xl border border-rose-200 p-2 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}

function DayColumn({ day, events, onCreateEvent, onOpenEvent, onUpdateEvent, isPanning, onMiddleMouseDown, onDeleteDay, canDeleteDay, compactMode }) {
  const contentRef = useRef(null);
  const dragState = useRef(null);
  const selectionState = useRef(null);
  const [selectionPreview, setSelectionPreview] = useState(null);

  const getPointerContentY = (clientY) => {
    if (!contentRef.current) return 0;
    const rect = contentRef.current.getBoundingClientRect();
    return clamp(clientY - rect.top - CANVAS_TOP_PADDING, 0, rect.height - CANVAS_TOP_PADDING);
  };

  const onSelectionMove = (event) => {
    if (!selectionState.current || !contentRef.current) return;
    const currentY = getPointerContentY(event.clientY);
    const currentMinutes = yToMinutes(currentY);
    const state = selectionState.current;
    state.moved = true;
    const start = Math.min(state.anchorMinutes, currentMinutes);
    const rawEnd = Math.max(state.anchorMinutes, currentMinutes);
    const end = Math.max(start + MIN_EVENT_MINUTES, rawEnd);
    state.startMinutes = start;
    state.endMinutes = Math.min(end, HOUR_END * 60);
    setSelectionPreview({ top: minutesToY(state.startMinutes), height: ((state.endMinutes - state.startMinutes) / 60) * HOUR_HEIGHT, startMinutes: state.startMinutes, endMinutes: state.endMinutes });
  };

  const onSelectionEnd = () => {
    window.removeEventListener("pointermove", onSelectionMove);
    const state = selectionState.current;
    if (state && state.moved) onCreateEvent(buildEvent(day.key, state.startMinutes, state.endMinutes), true);
    selectionState.current = null;
    setSelectionPreview(null);
  };

  const beginSelection = (event) => {
    if (event.button !== 2) return;
    event.preventDefault();
    if (!contentRef.current || event.target.closest("[data-event-card='true']")) return;
    window.addEventListener("contextmenu", (contextEvent) => contextEvent.preventDefault(), { once: true, capture: true });
    const startY = getPointerContentY(event.clientY);
    const startMinutes = yToMinutes(startY);
    selectionState.current = { anchorMinutes: startMinutes, startMinutes, endMinutes: Math.min(startMinutes + MIN_EVENT_MINUTES, HOUR_END * 60), moved: false };
    setSelectionPreview({ top: minutesToY(startMinutes), height: (MIN_EVENT_MINUTES / 60) * HOUR_HEIGHT, startMinutes, endMinutes: Math.min(startMinutes + MIN_EVENT_MINUTES, HOUR_END * 60) });
    window.addEventListener("pointermove", onSelectionMove);
    window.addEventListener("pointerup", onSelectionEnd, { once: true });
  };

  const onPointerMove = (e) => {
    if (!dragState.current) return;
    const pointerY = getPointerContentY(e.clientY);
    const minutes = yToMinutes(pointerY);
    const state = dragState.current;
    if (state.type === "move") {
      const newStart = clamp(snapMinutes(yToMinutes(pointerY - state.offset)), HOUR_START * 60, HOUR_END * 60 - state.duration);
      onUpdateEvent(state.id, { start: newStart, end: newStart + state.duration });
      return;
    }
    if (state.type === "resize-start") {
      const start = clamp(minutes, HOUR_START * 60, state.originalEnd - MIN_EVENT_MINUTES);
      onUpdateEvent(state.id, { start });
      return;
    }
    if (state.type === "resize-end") {
      const end = clamp(minutes, state.originalStart + MIN_EVENT_MINUTES, HOUR_END * 60);
      onUpdateEvent(state.id, { end });
    }
  };

  const onPointerUp = () => {
    dragState.current = null;
    window.removeEventListener("pointermove", onPointerMove);
  };

  const startDragMove = (e, item) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    dragState.current = { type: "move", id: item.id, offset: getPointerContentY(e.clientY) - minutesToY(item.start), duration: item.end - item.start };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp, { once: true });
  };

  const startResize = (e, item, edge) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    dragState.current = { type: edge, id: item.id, originalStart: item.start, originalEnd: item.end };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp, { once: true });
  };

  return (
    <div className="relative flex-1 border-r border-slate-200/70 bg-white/28 last:border-r-0 print:bg-white/100" style={{ minWidth: compactMode ? 0 : DAY_MIN_WIDTH }}>
      <DayHeader day={day} onCreateEvent={onCreateEvent} onDeleteDay={onDeleteDay} canDeleteDay={canDeleteDay} />
      <div ref={contentRef} className={`relative ${isPanning ? "cursor-grabbing" : "cursor-default"} print:cursor-default`} onPointerDown={beginSelection} onMouseDown={onMiddleMouseDown} onContextMenu={(event) => event.preventDefault()} style={{ height: CANVAS_TOP_PADDING + (HOUR_END - HOUR_START) * HOUR_HEIGHT }}>
        <div className="absolute inset-y-0 left-0 select-none border-r border-slate-200/60" style={{ width: GUTTER_WIDTH }}>
          {Array.from({ length: HOUR_END - HOUR_START + 1 }).map((_, index) => {
            const hour = HOUR_START + index;
            return <div key={hour} className="relative select-none text-right text-xs text-slate-400" style={{ height: HOUR_HEIGHT, marginTop: index === 0 ? CANVAS_TOP_PADDING : 0 }}><span className="absolute right-2 -top-2.5 select-none px-1">{String(hour).padStart(2, "0")}:00</span></div>;
          })}
        </div>

        <div className="absolute inset-y-0 right-0 overflow-hidden" style={{ left: GUTTER_WIDTH }}>
          {Array.from({ length: HOUR_END - HOUR_START }).map((_, index) => <div key={index} className="absolute inset-x-0 border-t border-slate-200/90" style={{ top: CANVAS_TOP_PADDING + index * HOUR_HEIGHT }} />)}

          {selectionPreview ? <><div className="pointer-events-none absolute left-3 right-3 rounded-lg border-2 border-dashed border-sky-500 bg-sky-300/35 shadow-[0_0_0_1px_rgba(255,255,255,0.35)] print:hidden" style={{ top: selectionPreview.top, height: selectionPreview.height }} /><div className="pointer-events-none absolute left-5 rounded-full bg-sky-600 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white shadow-lg print:hidden" style={{ top: Math.max(6, selectionPreview.top + 6) }}>{minutesToTime(selectionPreview.startMinutes)} - {minutesToTime(selectionPreview.endMinutes)}</div></> : null}

          {events.map((item) => {
            const top = minutesToY(item.start);
            const height = ((item.end - item.start) / 60) * HOUR_HEIGHT;
            const palette = PALETTES[item.colorIndex % PALETTES.length];
            const Icon = getIconComponent(item.icon);
            return (
              <div key={item.id} data-event-card="true" className={`group absolute left-3 right-3 cursor-pointer select-none rounded-lg border ${palette.accent} ${palette.card} text-white shadow-lg ring-1 ring-white/20 transition hover:scale-[1.01] print:hover:scale-100 ${item.end - item.start < 31 ? "px-3 py-1.5" : "px-3 py-2.5"}`} style={{ top, height }} onDoubleClick={() => onOpenEvent(item)} onPointerDown={(e) => startDragMove(e, item)} onMouseDown={onMiddleMouseDown}>
                <button className="absolute inset-0 rounded-lg select-none" onClick={(e) => { e.stopPropagation(); onOpenEvent(item); }} aria-label={`Abrir ${item.title}`} />
                <div className="absolute left-4 right-4 top-0.5 h-1.5 cursor-ns-resize rounded-full bg-white/30 opacity-0 transition group-hover:opacity-100 print:hidden" onPointerDown={(e) => startResize(e, item, "resize-start")} onMouseDown={onMiddleMouseDown} />
                <div className="absolute bottom-0.5 left-4 right-4 h-1.5 cursor-ns-resize rounded-full bg-white/30 opacity-0 transition group-hover:opacity-100 print:hidden" onPointerDown={(e) => startResize(e, item, "resize-end")} onMouseDown={onMiddleMouseDown} />
                <div className="relative z-10 flex h-full flex-col gap-1 overflow-hidden pr-4 select-none">
                  <div className="flex items-center gap-2 text-sm font-semibold leading-tight md:text-[15px]"><Icon className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{item.title}</span>{item.price ? <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90">{item.price} EUR{item.pricePerPerson ? <User className="h-3 w-3" /> : null}</span> : null}</div>
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85"><span>{minutesToTime(item.start)} - {minutesToTime(item.end)}</span></div>
                  {height > 80 && item.notes ? <div className="line-clamp-3 select-none text-xs leading-relaxed text-white/85">{item.notes}</div> : null}
                  {height > 110 && item.link ? <div className="truncate select-none text-xs text-white/80">{item.link}</div> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SideMenu({ onExport, onImportClick, onPrint, onAddDays, isBusy }) {
  return (
    <div className="flex w-[68px] shrink-0 flex-col items-center gap-4 bg-black px-3 py-4 print:hidden">
      <button onClick={onAddDays} title="Anadir dias" className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-500 text-white transition hover:scale-105 disabled:opacity-50" disabled={isBusy}><Plus className="h-5 w-5" /></button>
      <button onClick={onImportClick} title="Importar" className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black transition hover:scale-105 disabled:opacity-50" disabled={isBusy}><Upload className="h-5 w-5" /></button>
      <button onClick={onExport} title="Exportar" className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black transition hover:scale-105 disabled:opacity-50" disabled={isBusy}><Download className="h-5 w-5" /></button>
      <button onClick={onPrint} title="Imprimir" className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black transition hover:scale-105 disabled:opacity-50" disabled={isBusy}><Printer className="h-5 w-5" /></button>
    </div>
  );
}
function loadStoredPlanner() {
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

function App() {
  const initialState = useMemo(() => loadStoredPlanner(), []);
  const [days, setDays] = useState(initialState.days);
  const [events, setEvents] = useState(initialState.events);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isBusy] = useState(false);
  const [fallbackData, setFallbackData] = useState(null);
  const [isAddDaysOpen, setIsAddDaysOpen] = useState(false);
  const scrollRef = useRef(null);
  const panState = useRef(null);
  const importInputRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, days, events }));
    } catch {
      // ignore storage errors
    }
  }, [days, events]);

  const handlePanMove = useCallback((event) => {
    if (!panState.current || !scrollRef.current) return;
    const dx = event.clientX - panState.current.startX;
    const dy = event.clientY - panState.current.startY;
    scrollRef.current.scrollLeft = panState.current.scrollLeft - dx;
    scrollRef.current.scrollTop = panState.current.scrollTop - dy;
  }, []);

  const stopPan = useCallback(() => {
    panState.current = null;
    setIsPanning(false);
  }, []);

  useEffect(() => () => {
    window.removeEventListener("mousemove", handlePanMove);
    window.removeEventListener("mouseup", stopPan);
  }, [handlePanMove, stopPan]);

  const createEvent = (event, openAfterCreate = false) => {
    setEvents((prev) => [...prev, event]);
    if (openAfterCreate) setEditingEvent(event);
  };

  const updateEvent = (id, updates) => {
    setEvents((prev) => prev.map((event) => (event.id === id ? { ...event, ...updates } : event)));
    setEditingEvent((prev) => (prev && prev.id === id ? { ...prev, ...updates } : prev));
  };

  const saveEvent = (updatedEvent) => {
    setEvents((prev) => prev.map((event) => (event.id === updatedEvent.id ? updatedEvent : event)));
    setEditingEvent(null);
  };

  const deleteEvent = (id) => {
    setEvents((prev) => prev.filter((event) => event.id !== id));
    setEditingEvent((prev) => (prev?.id === id ? null : prev));
  };

  const addDays = (dayKeys) => {
    if (!Array.isArray(dayKeys) || dayKeys.length === 0) {
      setIsAddDaysOpen(false);
      return;
    }
    setDays((prev) => normalizeImportedDays([...prev, ...dayKeys]));
    setIsAddDaysOpen(false);
  };

  const deleteDay = (day) => {
    if (days.length <= 1) return;
    const relatedEvents = events.filter((event) => event.day === day.key).length;
    const confirmed = window.confirm(`Eliminar ${day.label} ${day.dateLabel} y sus ${relatedEvents} evento(s)?`);
    if (!confirmed) return;
    setDays((prev) => prev.filter((item) => item.key !== day.key));
    setEvents((prev) => prev.filter((event) => event.day !== day.key));
    setEditingEvent((prev) => (prev?.day === day.key ? null : prev));
  };

  const groupedEvents = useMemo(() => days.reduce((acc, day) => {
    acc[day.key] = events.filter((event) => event.day === day.key).sort((a, b) => a.start - b.start);
    return acc;
  }, {}), [days, events]);

  const compactMode = days.length <= COMPACT_DAY_LIMIT;
  const gridMinWidth = compactMode ? 0 : days.length * DAY_MIN_WIDTH;

  const handleMiddleMouseDown = (event) => {
    if (event.button !== 1 || !scrollRef.current) return;
    event.preventDefault();
    panState.current = { startX: event.clientX, startY: event.clientY, scrollLeft: scrollRef.current.scrollLeft, scrollTop: scrollRef.current.scrollTop };
    setIsPanning(true);
    window.addEventListener("mousemove", handlePanMove);
    window.addEventListener("mouseup", stopPan);
  };

  const handleExport = () => {
    const payload = { version: STORAGE_VERSION, exportedAt: new Date().toISOString(), days, events };
    const content = JSON.stringify(payload, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const ok = tryDownloadBlob(blob, "trip-planner-events.json");
    if (!ok) setFallbackData({ type: "export-json", title: "Exportar JSON", description: "Este entorno ha bloqueado la descarga directa. Copia este contenido y guardalo como un archivo .json en tu ordenador.", content });
  };

  const handleImportClick = () => {
    const opened = tryOpenFilePicker(importInputRef);
    if (!opened) setFallbackData({ type: "import-json", title: "Importar JSON", description: "Este entorno ha bloqueado el selector de archivos. Pega aqui el JSON exportado para reemplazar todos los dias y eventos actuales.", content: "" });
  };

  const applyImportedJson = (text) => {
    try {
      const parsed = JSON.parse(text);
      const nextDays = normalizeImportedDays(Array.isArray(parsed) ? DEFAULT_DAYS : parsed?.days ?? DEFAULT_DAYS);
      const nextEvents = normalizeImportedEvents(Array.isArray(parsed) ? parsed : parsed?.events, nextDays);
      setDays(nextDays);
      setEvents(nextEvents);
      setEditingEvent(null);
      setFallbackData(null);
      setIsAddDaysOpen(false);
    } catch {
      alert("No se ha podido importar el JSON.");
    }
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      applyImportedJson(text);
    } catch {
      alert("No se ha podido importar el JSON.");
    } finally {
      event.target.value = "";
    }
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch {
      setFallbackData({ type: "print-help", title: "Imprimir planning", description: "La impresion nativa no esta disponible aqui. Usa el navegador fuera del entorno embebido o el atajo de imprimir del sistema.", content: "" });
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_28%),linear-gradient(180deg,_#f9fbff_0%,_#eff4fb_100%)] text-slate-900 print:bg-white">
      <div className="flex h-full print:block">
        <SideMenu onExport={handleExport} onImportClick={handleImportClick} onPrint={handlePrint} onAddDays={() => setIsAddDaysOpen(true)} isBusy={isBusy} />
        <input ref={importInputRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImportFile} />
        <div ref={scrollRef} className={`${isPanning ? "cursor-grabbing" : "cursor-default"} h-full flex-1 overflow-auto print:overflow-visible`}>
          <div className="grid print:min-w-0" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`, minWidth: gridMinWidth || undefined }}>
            {days.map((day) => <DayColumn key={day.key} day={day} events={groupedEvents[day.key] || []} onCreateEvent={createEvent} onOpenEvent={setEditingEvent} onUpdateEvent={updateEvent} isPanning={isPanning} onMiddleMouseDown={handleMiddleMouseDown} onDeleteDay={deleteDay} canDeleteDay={days.length > 1} compactMode={compactMode} />)}
          </div>
        </div>
      </div>

      {editingEvent ? <EventModal event={editingEvent} onClose={() => setEditingEvent(null)} onSave={saveEvent} onDelete={deleteEvent} /> : null}
      {isAddDaysOpen ? <AddDaysModal existingDayKeys={days.map((day) => day.key)} initialMonthKey={days[0]?.key} onClose={() => setIsAddDaysOpen(false)} onAccept={addDays} /> : null}
      <FallbackPanel key={fallbackData?.type ?? "fallback-none"} fallbackData={fallbackData} onClose={() => setFallbackData(null)} onImportText={applyImportedJson} />
    </div>
  );
}

export default App;
