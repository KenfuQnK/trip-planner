import React, { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
} from "lucide-react";
import { addMonths, formatDayMeta, parseIsoDate, startOfDay } from "../utils/date-utils.js";

export function AddDaysModal({ existingDayKeys, initialMonthKey, onClose, onAccept }) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const parsed = initialMonthKey ? parseIsoDate(initialMonthKey) : null;
    return startOfDay(parsed ?? new Date());
  });
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
            <h2 className="text-lg font-semibold text-slate-900">Añadir días</h2>
            <p className="text-sm text-slate-500">Selecciona uno o varios días para insertarlos en el canvas.</p>
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
                    <span className="hidden text-[10px] uppercase tracking-[0.18em] opacity-80 sm:inline">{isExisting ? "Añadido" : "Añadir"}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">{selectedKeys.length === 0 ? "No hay días seleccionados." : `${selectedKeys.length} día(s) listos para añadir.`}</div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
          <button onClick={onClose} className="cursor-pointer rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Cancelar</button>
          <button onClick={() => onAccept(selectedKeys)} disabled={selectedKeys.length === 0} className="cursor-pointer inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-40"><Plus className="h-4 w-4" /> Aceptar</button>
        </div>
      </div>
    </div>
  );
}
