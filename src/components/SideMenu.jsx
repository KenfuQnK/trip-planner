import React from "react";
import {
  Download,
  ImageIcon as ImageIconLucide,
  Plus,
  Printer,
  Upload,
} from "lucide-react";

export function SideMenu({ onExportImage, onExport, onImportClick, onPrint, onAddDays, isBusy, syncStatus }) {
  return (
    <div className="hidden w-[68px] shrink-0 flex-col items-center gap-4 bg-black px-3 py-4 print:hidden md:flex">
      <button onClick={onAddDays} title="Añadir días" className="cursor-pointer flex h-11 w-11 items-center justify-center rounded-full bg-sky-500 text-white transition hover:scale-105 disabled:opacity-50" disabled={isBusy}><Plus className="h-5 w-5" /></button>
      <button onClick={onImportClick} title="Importar" className="cursor-pointer flex h-11 w-11 items-center justify-center rounded-full bg-white text-black transition hover:scale-105 disabled:opacity-50" disabled={isBusy}><Download className="h-5 w-5" /></button>
      <button onClick={onExport} title="Exportar" className="cursor-pointer flex h-11 w-11 items-center justify-center rounded-full bg-white text-black transition hover:scale-105 disabled:opacity-50" disabled={isBusy}><Upload className="h-5 w-5" /></button>
      <button onClick={onPrint} title="Imprimir" className="cursor-pointer flex h-11 w-11 items-center justify-center rounded-full bg-white text-black transition hover:scale-105 disabled:opacity-50" disabled={isBusy}><Printer className="h-5 w-5" /></button>
      <button onClick={onExportImage} title="Guardar PNG" className="cursor-pointer flex h-11 w-11 items-center justify-center rounded-full bg-white text-black transition hover:scale-105 disabled:opacity-50" disabled={isBusy}><ImageIconLucide className="h-5 w-5" /></button>
      <span className="mt-auto rounded-full bg-white/15 px-2 py-1 text-center text-[10px] font-medium leading-tight text-white">{syncStatus}</span>
    </div>
  );
}
