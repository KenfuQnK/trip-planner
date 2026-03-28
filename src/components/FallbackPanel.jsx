import React, { useState, useEffect } from "react";
import {
  Check,
  Copy,
  FileJson,
  Image as ImageIcon,
  Upload,
  X,
} from "lucide-react";

export function FallbackPanel({ fallbackData, onClose, onImportText }) {
  const [importText, setImportText] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!fallbackData?.content) return;
    try {
      await navigator.clipboard.writeText(fallbackData.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  if (!fallbackData) return null;

  const isExport = fallbackData.type === "export-json";
  const isPrint = fallbackData.type === "print-help";
  const isImport = fallbackData.type === "import-json";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-3xl border border-white/70 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2 text-slate-900">
            {isExport ? <FileJson className="h-5 w-5" /> : null}
            {isPrint ? <ImageIcon className="h-5 w-5" /> : null}
            {isImport ? <Upload className="h-5 w-5" /> : null}
            <h2 className="text-lg font-semibold">{fallbackData.title}</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 px-4 py-4">
          <p className="text-sm text-slate-600">{fallbackData.description}</p>

          {isImport ? (
            <>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="h-[360px] w-full rounded-2xl border border-slate-200 px-3 py-3 font-mono text-xs outline-none transition focus:border-slate-400"
                placeholder="Pega aqui el JSON exportado..."
              />
              <div className="flex justify-end gap-2">
                <button onClick={onClose} className="cursor-pointer rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Cancelar</button>
                <button onClick={() => onImportText(importText)} className="cursor-pointer rounded-2xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800">Importar JSON pegado</button>
              </div>
            </>
          ) : null}

          {isExport && fallbackData.content ? (
            <>
              <div className="flex justify-end">
                <button onClick={handleCopy} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copiado" : "Copiar"}
                </button>
              </div>
              <textarea readOnly value={fallbackData.content} className="h-[360px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 font-mono text-xs outline-none" />
            </>
          ) : null}

          {isPrint ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p>La impresion directa puede estar bloqueada en este entorno embebido.</p>
              <p className="mt-2">Prueba una de estas opciones:</p>
              <ul className="mt-2 list-disc pl-5">
                <li>Usa el atajo de imprimir del navegador.</li>
                <li>Abre esta app fuera del canvas embebido.</li>
                <li>Exporta el JSON y vuelve a importarlo en un entorno normal.</li>
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
