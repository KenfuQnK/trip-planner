import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import "./App.css";

import { AddDaysModal } from "./components/AddDaysModal.jsx";
import { DayColumn } from "./components/DayColumn.jsx";
import { EventModal } from "./components/EventModal.jsx";
import { FallbackPanel } from "./components/FallbackPanel.jsx";
import { MobileHoursColumn } from "./components/MobileHoursColumn.jsx";
import { SideMenu } from "./components/SideMenu.jsx";
import {
  COMPACT_DAY_LIMIT,
  DAY_MIN_WIDTH,
  DEFAULT_DAYS,
  STORAGE_VERSION,
} from "./utils/constants.js";
import { normalizeImportedDays } from "./utils/date-utils.js";
import { normalizeImportedEvents, runSelfChecks } from "./utils/event-utils.js";
import {
  tryDownloadBlob,
  tryOpenFilePicker,
} from "./utils/index.js";
import { loadStoredPlanner, saveToStorage } from "./utils/storage.js";

runSelfChecks();

// Ajusta este valor para decidir antes o despues cuando la app entra en layout movil.
const MOBILE_BREAKPOINT_PX = 1020;
const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT_PX}px)`;
const MOBILE_DAY_MIN_WIDTH = 150;
const MOBILE_DAY_MAX_WIDTH = 240;

function App() {
  const initialState = useMemo(() => loadStoredPlanner(), []);
  const [days, setDays] = useState(initialState.days);
  const [events, setEvents] = useState(initialState.events);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isCaptureMode, setIsCaptureMode] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [fallbackData, setFallbackData] = useState(null);
  const [isAddDaysOpen, setIsAddDaysOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.matchMedia(MOBILE_MEDIA_QUERY).matches : false));
  const scrollRef = useRef(null);
  const panState = useRef(null);
  const importInputRef = useRef(null);

  useEffect(() => {
    saveToStorage(days, events);
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

  useEffect(() => {
    const enableCaptureMode = () => setIsCaptureMode(true);
    const disableCaptureMode = () => setIsCaptureMode(false);

    window.addEventListener("beforeprint", enableCaptureMode);
    window.addEventListener("afterprint", disableCaptureMode);

    return () => {
      window.removeEventListener("beforeprint", enableCaptureMode);
      window.removeEventListener("afterprint", disableCaptureMode);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
    const handleChange = (event) => setIsMobile(event.matches);
    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

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
  const mobileGridMinWidth = days.length * MOBILE_DAY_MIN_WIDTH;

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
    if (!opened) setFallbackData({ type: "import-json", title: "Importar JSON", description: "Este entorno ha bloqueado el selector de archivos. Pega aqui el JSON exportado para reemplazar todos los días y eventos actuales.", content: "" });
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

  const handleExportImage = useCallback(async () => {
    if (!scrollRef.current || isExportingImage) return;

    const exportNode = scrollRef.current;
    setIsExportingImage(true);
    setIsCaptureMode(true);

    try {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const targetWidth = Math.max(exportNode.scrollWidth, exportNode.clientWidth);
      const targetHeight = Math.max(exportNode.scrollHeight, exportNode.clientHeight);

      const dataUrl = await toPng(exportNode, {
        cacheBust: true,
        backgroundColor: "#eff4fb",
        pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width: targetWidth,
        height: targetHeight,
        canvasWidth: targetWidth,
        canvasHeight: targetHeight,
        style: {
          width: `${targetWidth}px`,
          height: `${targetHeight}px`,
          overflow: "visible",
        },
        filter: (node) => {
          if (node.classList?.contains("export-include")) return true;
          return !node.classList?.contains("print:hidden");
        },
      });

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const filename = `trip-planner-${new Date().toISOString().slice(0, 10)}.png`;
      const ok = tryDownloadBlob(blob, filename);

      if (!ok) {
        alert("No se ha podido descargar el PNG en este entorno.");
      }
    } catch {
      alert("No se ha podido generar la imagen del planning.");
    } finally {
      setIsCaptureMode(false);
      setIsExportingImage(false);
    }
  }, [isExportingImage]);

  return (
    <div className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_28%),linear-gradient(180deg,_#f9fbff_0%,_#eff4fb_100%)] text-slate-900 print:bg-white">
      <input ref={importInputRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImportFile} />

      {isMobile ? (
        <div className="flex h-full print:block">
          <div ref={scrollRef} className={`${isPanning ? "cursor-grabbing" : "cursor-default"} flex-1 overflow-auto print:overflow-visible`}>
            <div className="flex min-h-full min-w-max items-start print:min-w-0">
              <MobileHoursColumn onExportImage={handleExportImage} onExport={handleExport} onImportClick={handleImportClick} onPrint={handlePrint} onAddDays={() => setIsAddDaysOpen(true)} isBusy={isExportingImage} />
              <div className="grid" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(${MOBILE_DAY_MIN_WIDTH}px, ${MOBILE_DAY_MAX_WIDTH}px))`, minWidth: mobileGridMinWidth }}>
                {days.map((day) => <DayColumn key={day.key} day={day} events={groupedEvents[day.key] || []} onCreateEvent={createEvent} onOpenEvent={setEditingEvent} onUpdateEvent={updateEvent} isPanning={isPanning} onMiddleMouseDown={handleMiddleMouseDown} onDeleteDay={deleteDay} canDeleteDay={days.length > 1} compactMode={true} isCaptureMode={isCaptureMode} showHeader={true} showHourGutter={false} enableEventDrag={false} />)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-full print:block">
          <SideMenu onExportImage={handleExportImage} onExport={handleExport} onImportClick={handleImportClick} onPrint={handlePrint} onAddDays={() => setIsAddDaysOpen(true)} isBusy={isExportingImage} />
          <div ref={scrollRef} className={`${isPanning ? "cursor-grabbing" : "cursor-default"} min-h-0 flex-1 overflow-auto print:overflow-visible`}>
            <div className="grid print:min-w-0" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`, minWidth: gridMinWidth || undefined }}>
              {days.map((day) => <DayColumn key={day.key} day={day} events={groupedEvents[day.key] || []} onCreateEvent={createEvent} onOpenEvent={setEditingEvent} onUpdateEvent={updateEvent} isPanning={isPanning} onMiddleMouseDown={handleMiddleMouseDown} onDeleteDay={deleteDay} canDeleteDay={days.length > 1} compactMode={compactMode} isCaptureMode={isCaptureMode} enableEventDrag={true} />)}
            </div>
          </div>
        </div>
      )}

      {editingEvent ? <EventModal event={editingEvent} onClose={() => setEditingEvent(null)} onSave={saveEvent} onDelete={deleteEvent} /> : null}
      {isAddDaysOpen ? <AddDaysModal existingDayKeys={days.map((day) => day.key)} initialMonthKey={days[0]?.key} onClose={() => setIsAddDaysOpen(false)} onAccept={addDays} /> : null}
      <FallbackPanel key={fallbackData?.type ?? "fallback-none"} fallbackData={fallbackData} onClose={() => setFallbackData(null)} onImportText={applyImportedJson} />
    </div>
  );
}

export default App;
