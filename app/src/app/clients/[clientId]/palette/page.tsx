"use client";

import { useEffect, useState, use } from "react";
import { PaletteGrid } from "@/components/client/PaletteGrid";
import { RefreshCw } from "lucide-react";
import { ExportButton } from "@/components/shared/ExportButton";

export default function PalettePage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params);
  const [markdown, setMarkdown] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/clients/${clientId}/palette`)
      .then((r) => r.json())
      .then((d) => setMarkdown(d.content ?? ""))
      .finally(() => setLoading(false));
  }, [clientId]);

  const handleSelect = (index: number) => {
    setSelected(index);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-[#111]">Paletas de Cores</h2>
        <div className="flex gap-2">
          <ExportButton
            href={`/api/export/palette/${clientId}`}
            label="Baixar PDF"
            filename={`paletas-${clientId}.pdf`}
          />
          <button
            onClick={() => {
              fetch(`/api/pipeline/run`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ clientId: clientId, job: "palette" }),
              });
            }}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[#e5e5e5] rounded-lg text-[#555] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-colors"
          >
            <RefreshCw size={12} />
            Regenerar Paletas
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-[#888]">Carregando paletas…</p>
      ) : (
        <PaletteGrid markdown={markdown} selectedIndex={selected} onSelect={handleSelect} />
      )}
    </div>
  );
}
