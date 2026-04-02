import React from "react";
import { X } from "lucide-react";
import { ICONS, PALETTES } from "../utils/constants.js";

export const EVENT_TEMPLATES = [
  { id: "breakfast", title: "Desayuno", icon: "restaurant", colorIndex: 4 },
  { id: "hotel-check-in", title: "Hotel check-in", icon: "hotel", colorIndex: 9 },
  { id: "hotel-checkout", title: "Hotel checkout", icon: "hotel", colorIndex: 10 },
  { id: "train", title: "Tren", icon: "train", colorIndex: 2 },
  { id: "bus", title: "Bus", icon: "bus", colorIndex: 5 },
  { id: "flight", title: "Vuelo", icon: "plane", colorIndex: 0 },
  { id: "meal", title: "Comida", icon: "restaurant", colorIndex: 8 },
  { id: "airport-transfer", title: "Traslado al aeropuerto", icon: "car", colorIndex: 11 },
  { id: "free-visit", title: "Visita libre", icon: "walk", colorIndex: 7 },
];

export function EventTemplateModal({ onClose, onSelect }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-white/70 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Plantillas</h3>
            <p className="text-sm text-slate-500">Selecciona una plantilla para rellenar título, icono y color.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {EVENT_TEMPLATES.map((template) => {
            const Icon = ICONS.find((item) => item.key === template.icon)?.icon;
            const palette = PALETTES[template.colorIndex % PALETTES.length];
            return (
              <button
                key={template.id}
                onClick={() => onSelect(template)}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
              >
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl text-white ${palette.card}`}>
                  {Icon ? <Icon className="h-5 w-5" /> : null}
                </span>
                <span className="text-sm font-medium text-slate-800">{template.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
