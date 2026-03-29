import React, { useEffect, useState } from "react";
import {
  Clock3,
  Copy,
  Link as LinkIcon,
  Pencil,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import { ICONS, PALETTES, MIN_EVENT_MINUTES } from "../utils/constants.js";
import { minutesToTime } from "../utils/index.js";

export function EventModal({ event, onClose, onSave, onDelete }) {
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
      <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-slate-900">Editar bloque</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"><X className="h-5 w-5" /></button>
        </div>

        <div className="min-h-0 overflow-y-auto px-4 py-4">
          <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
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
                    return <button key={item.key} title={item.label} onClick={() => setDraft({ ...draft, icon: item.key })} className={`cursor-pointer flex h-10 items-center justify-center rounded-xl border transition ${selected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"}`}><Icon className="h-4 w-4 shrink-0" /></button>;
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Color</p>
                <div className="grid grid-cols-3 gap-2">
                  {PALETTES.map((palette, index) => <button key={index} onClick={() => setDraft({ ...draft, colorIndex: index })} className={`cursor-pointer h-12 rounded-2xl border-2 transition ${palette.card} ${draft.colorIndex === index ? "scale-95 border-slate-950" : "border-white"}`} />)}
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-end gap-2">
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">€ Precio</span>
                  <input type="number" min="0" step="0.01" value={draft.price ?? ""} onChange={(e) => setDraft({ ...draft, price: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-slate-400" placeholder="Ej. 18.50" />
                </label>
                <label className="flex h-[42px] items-center gap-2 rounded-2xl border border-slate-200 px-3 text-sm text-slate-700 whitespace-nowrap">
                  <input type="checkbox" checked={Boolean(draft.pricePerPerson)} onChange={(e) => setDraft({ ...draft, pricePerPerson: e.target.checked })} className="cursor-pointer h-4 w-4 rounded" />
                  <span>Precio por persona</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
          <button onClick={() => onDelete(draft.id)} className="cursor-pointer inline-flex items-center gap-2 rounded-2xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"><Trash2 className="h-4 w-4" /> Eliminar</button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="cursor-pointer rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Cancelar</button>
            <button onClick={() => onSave({ ...draft, end: Math.max(draft.start + MIN_EVENT_MINUTES, draft.end) })} className="cursor-pointer rounded-2xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800">Guardar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
