import React from "react";
import { X } from "lucide-react";
import { PALETTES } from "../utils/constants.js";

export function ConfigModal({ colorLabels, onClose, onChangeColorLabel }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm">
      <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Configuracion</h3>
            <p className="text-sm text-slate-500">Asigna una etiqueta opcional a cada color para identificarlo mejor.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 space-y-2 overflow-y-auto px-4 py-3">
          {PALETTES.map((palette, index) => (
            <label key={index} className="grid items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-2.5 py-2.5 sm:grid-cols-[64px_1fr]">
              <span className={`flex h-10 items-center justify-center rounded-xl px-1 text-[11px] font-semibold tracking-wide text-white ${palette.card}`}>
                Color {index + 1}
              </span>
              <input
                type="text"
                value={colorLabels[index] ?? ""}
                onChange={(event) => onChangeColorLabel(index, event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400"
                placeholder="Etiqueta opcional"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
