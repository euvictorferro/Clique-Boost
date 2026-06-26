"use client";

import { useEffect, useState, use } from "react";
import { PaletteGrid } from "@/components/client/PaletteGrid";
import { RefreshCw, Copy, Check } from "lucide-react";
import { ExportButton } from "@/components/shared/ExportButton";
import ReactMarkdown from "react-markdown";

interface ColorSwatch {
  hex: string;
  name: string;
}

function getBrightness(hex: string): number {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

function SwatchCard({ swatch }: { swatch: ColorSwatch }) {
  const [copied, setCopied] = useState(false);
  const isDark = getBrightness(swatch.hex) < 128;

  const copy = () => {
    navigator.clipboard.writeText(swatch.hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className="rounded-xl overflow-hidden border border-[#e5e5e5] shadow-sm group cursor-pointer"
      onClick={copy}
      title="Clique para copiar"
    >
      <div
        className="h-24 flex items-end p-2.5 relative"
        style={{ backgroundColor: swatch.hex }}
      >
        <button
          className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
            isDark ? "bg-white/20 text-white" : "bg-black/10 text-black"
          }`}
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
        </button>
      </div>
      <div className="bg-white px-3 py-2">
        <p className="text-[11px] font-semibold text-[#111] truncate">{swatch.name}</p>
        <p className="text-[10px] text-[#888] font-mono uppercase">{swatch.hex}</p>
      </div>
    </div>
  );
}

export default function PalettePage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params);
  const [markdown, setMarkdown] = useState("");
  const [swatches, setSwatches] = useState<ColorSwatch[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/clients/${clientId}/palette`)
      .then((r) => r.json())
      .then((d) => {
        setMarkdown(d.content ?? "");
        setSwatches(d.swatches ?? []);
      })
      .finally(() => setLoading(false));
  }, [clientId]);

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-semibold text-[#111]">Paleta de Cores</h2>
        <div className="flex gap-2">
          <ExportButton
            href={`/api/export/palette/${clientId}`}
            label="Baixar PDF"
            filename={`paletas-${clientId}.pdf`}
          />
          <button
            onClick={() =>
              fetch(`/api/pipeline/run`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ clientId, job: "palette" }),
              })
            }
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[#e5e5e5] rounded-lg text-[#555] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-colors"
          >
            <RefreshCw size={12} />
            Regenerar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[#888]">
          <div className="w-4 h-4 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
          Carregando paleta…
        </div>
      ) : (
        <>
          {/* Brand swatches from PDF */}
          {swatches.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-[#111]">Cores Oficiais</h3>
                <span className="text-[10px] bg-[#f5f0ff] text-[#7c3aed] px-2 py-0.5 rounded-full border border-[#ddd6fe]">
                  Extraído do Brand Guideline
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {swatches.map((s, i) => (
                  <SwatchCard key={i} swatch={s} />
                ))}
              </div>
              <p className="text-[11px] text-[#aaa] mt-2">Clique em qualquer cor para copiar o hex</p>
            </section>
          )}

          {/* Markdown notes from Obsidian (paleta.md) */}
          {markdown && (
            <section>
              <h3 className="text-sm font-semibold text-[#111] mb-3">Detalhes & Notas</h3>
              <div className="bg-white border border-[#e5e5e5] rounded-xl p-5 prose prose-sm max-w-none text-xs text-[#333]
                [&_h1]:text-sm [&_h1]:font-semibold [&_h1]:text-[#111]
                [&_h2]:text-[13px] [&_h2]:font-semibold [&_h2]:text-[#111] [&_h2]:mt-4 [&_h2]:mb-2
                [&_h3]:text-xs [&_h3]:font-medium [&_h3]:text-[#333] [&_h3]:mt-3 [&_h3]:mb-1
                [&_table]:w-full [&_td]:py-1 [&_td]:px-2 [&_th]:py-1 [&_th]:px-2 [&_th]:text-left [&_th]:bg-[#f5f5f5]
                [&_code]:bg-[#f5f5f5] [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-[10px]
              ">
                <ReactMarkdown>{markdown}</ReactMarkdown>
              </div>
            </section>
          )}

          {/* Fallback: old AI-generated palette options */}
          {!swatches.length && !markdown && (
            <div>
              <PaletteGrid markdown={markdown} selectedIndex={selected} onSelect={setSelected} />
            </div>
          )}

          {!swatches.length && !markdown && (
            <div className="text-center py-16 text-[#aaa]">
              <p className="text-sm text-[#666]">Paleta não configurada ainda.</p>
              <p className="text-xs mt-1">Clique em "Regenerar" para gerar via IA, ou as cores serão preenchidas automaticamente a partir do Brand Guideline.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
