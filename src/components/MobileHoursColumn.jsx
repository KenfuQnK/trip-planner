import React, { useEffect, useRef, useState } from "react";
import {
  Download,
  ImageIcon as ImageIconLucide,
  Menu,
  Plus,
  Printer,
  Upload,
} from "lucide-react";
import {
  CANVAS_TOP_PADDING,
  GUTTER_WIDTH,
  HOUR_END,
  HOUR_HEIGHT,
  HOUR_START,
} from "../utils/constants.js";

export function MobileHoursColumn({ onExportImage, onExport, onImportClick, onPrint, onAddDays, isBusy }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isMenuOpen]);

  const handleAction = (action) => {
    action();
    setIsMenuOpen(false);
  };

  return (
    <div className="export-include relative z-40 w-14 shrink-0 border-r border-slate-200/70 bg-white/65 backdrop-blur print:hidden">
      <div ref={menuRef} className="relative z-40 flex h-16 items-center justify-center border-b border-slate-200/70">
        <button onClick={() => setIsMenuOpen((prev) => !prev)} aria-label="Abrir menú" className="cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
          <Menu className="h-4 w-4" />
        </button>
        {isMenuOpen ? (
          <div className="absolute left-full top-2 z-50 ml-2 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
            <button onClick={() => handleAction(onAddDays)} title="Añadir días" className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-white transition hover:scale-105 disabled:opacity-50" disabled={isBusy}><Plus className="h-5 w-5" /></button>
            <button onClick={() => handleAction(onImportClick)} title="Importar" className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition hover:scale-105 disabled:opacity-50" disabled={isBusy}><Download className="h-5 w-5" /></button>
            <button onClick={() => handleAction(onExport)} title="Exportar" className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition hover:scale-105 disabled:opacity-50" disabled={isBusy}><Upload className="h-5 w-5" /></button>
            <button onClick={() => handleAction(onPrint)} title="Imprimir" className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition hover:scale-105 disabled:opacity-50" disabled={isBusy}><Printer className="h-5 w-5" /></button>
            <button onClick={() => handleAction(onExportImage)} title="Guardar PNG" className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition hover:scale-105 disabled:opacity-50" disabled={isBusy}><ImageIconLucide className="h-5 w-5" /></button>
          </div>
        ) : null}
      </div>

      <div className="relative" style={{ height: CANVAS_TOP_PADDING + (HOUR_END - HOUR_START) * HOUR_HEIGHT }}>
        {Array.from({ length: HOUR_END - HOUR_START + 1 }).map((_, index) => {
          const hour = HOUR_START + index;
          return (
            <div key={hour} className="relative select-none text-right text-xs text-slate-400" style={{ height: HOUR_HEIGHT, marginTop: index === 0 ? CANVAS_TOP_PADDING : 0, width: GUTTER_WIDTH }}>
              <span className="absolute right-2 -top-2.5 select-none px-1">{String(hour).padStart(2, "0")}:00</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
