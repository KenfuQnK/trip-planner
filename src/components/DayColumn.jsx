import React, { useRef, useState } from "react";
import { User } from "lucide-react";
import { DayHeader } from "./DayHeader.jsx";
import {
  CANVAS_TOP_PADDING,
  GUTTER_WIDTH,
  HOUR_END,
  HOUR_HEIGHT,
  HOUR_START,
  MIN_EVENT_MINUTES,
  PALETTES,
} from "../utils/constants.js";
import { clamp, getIconComponent, minutesToTime, minutesToY, yToMinutes } from "../utils/index.js";
import { buildEvent } from "../utils/event-utils.js";

export function DayColumn({ day, events, onCreateEvent, onOpenEvent, onUpdateEvent, isPanning, onMiddleMouseDown, onDeleteDay, canDeleteDay, compactMode, isCaptureMode }) {
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
      const newStart = clamp(Math.round(minutes / 15) * 15, HOUR_START * 60, HOUR_END * 60 - state.duration);
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
    <div className="relative flex-1 border-r border-slate-200/70 bg-white/28 last:border-r-0 print:bg-white/100" style={{ minWidth: compactMode ? 0 : 320 }}>
      <DayHeader day={day} onCreateEvent={onCreateEvent} onDeleteDay={onDeleteDay} canDeleteDay={canDeleteDay} isCaptureMode={isCaptureMode} />
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
