import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { buildEvent } from "../utils/event-utils.js";

export function DayHeader({ day, onCreateEvent, onDeleteDay, canDeleteDay, isCaptureMode }) {
  return (
    <div className={`planner-day-header border-b border-slate-200 px-4 py-2.5 print:bg-white ${isCaptureMode ? "relative bg-white" : "sticky top-0 z-20 bg-white/80 backdrop-blur"}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-slate-900">{day.label}</div>
          <div className="truncate text-sm text-slate-500">{day.dateLabel}</div>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <button onClick={() => onCreateEvent(buildEvent(day.key, 9 * 60, 10 * 60), true)} className="cursor-pointer inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"><Plus className="h-4 w-4" /> Añadir</button>
          <button onClick={() => onDeleteDay(day)} disabled={!canDeleteDay} title={canDeleteDay ? "Eliminar día" : "Debe quedar al menos un día"} className="cursor-pointer line-flex items-center justify-center rounded-2xl border border-rose-200 p-2 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}
