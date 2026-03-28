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
  Martini,
  Footprints,
} from "lucide-react";

export const DEFAULT_DAYS = [
  { key: "2026-09-11", label: "Viernes", dateLabel: "11 Sep 2026" },
  { key: "2026-09-12", label: "Sabado", dateLabel: "12 Sep 2026" },
  { key: "2026-09-13", label: "Domingo", dateLabel: "13 Sep 2026" },
];

export const HOUR_START = 0;
export const HOUR_END = 24;
export const HOUR_HEIGHT = 64;
export const SNAP_MINUTES = 15;
export const MIN_EVENT_MINUTES = 30;
export const STORAGE_KEY = "trip-weekend-planner-events-v1";
export const STORAGE_VERSION = 2;
export const GUTTER_WIDTH = 56;
export const COMPACT_DAY_LIMIT = 4;
export const DAY_MIN_WIDTH = 320;
export const CANVAS_TOP_PADDING = 18;

export const ICONS = [
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

export const PALETTES = [
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

export const sampleEvents = [
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
