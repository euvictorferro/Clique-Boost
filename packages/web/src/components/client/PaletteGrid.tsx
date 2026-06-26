"use client";

import { Check } from "lucide-react";

interface Palette {
  index: number;
  name: string;
  colors: Array<{ label: string; hex: string }>;
}

function parsePalettes(markdown: string): Palette[] {
  const palettes: Palette[] = [];
  const blocks = markdown.split(/^## /m).filter(Boolean);

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const header = lines[0] ?? "";
    const nameMatch = header.match(/Opção\s+(\d+)\s*[—-]\s*(.+)/);
    if (!nameMatch) continue;

    const index = parseInt(nameMatch[1]);
    const name = nameMatch[2].trim();
    const colors: Array<{ label: string; hex: string }> = [];

    for (const line of lines.slice(1)) {
      const colorMatch = line.match(/[-*]\s*(.+?):\s*(#[0-9a-fA-F]{6})/);
      if (colorMatch) {
        colors.push({ label: colorMatch[1].trim(), hex: colorMatch[2] });
      }
    }

    if (colors.length > 0) palettes.push({ index, name, colors });
  }

  return palettes;
}

interface PaletteGridProps {
  markdown: string;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export function PaletteGrid({ markdown, selectedIndex, onSelect }: PaletteGridProps) {
  const palettes = parsePalettes(markdown);

  if (!palettes.length) {
    return <p className="text-sm text-[#888]">Paletas não geradas ainda.</p>;
  }

  return (
    <div className="grid grid-cols-5 gap-4">
      {palettes.map((palette) => {
        const selected = selectedIndex === palette.index;
        return (
          <div
            key={palette.index}
            className={`bg-white rounded-xl border-2 overflow-hidden transition-all ${
              selected ? "border-[#8b5cf6] shadow-md" : "border-[#e5e5e5] hover:border-[#c4b5fd]"
            }`}
          >
            <div className="flex h-16">
              {palette.colors.slice(0, 4).map((c) => (
                <div key={c.hex} className="flex-1" style={{ background: c.hex }} />
              ))}
            </div>
            <div className="p-3">
              <p className="text-xs font-semibold text-[#111] mb-1 truncate">{palette.name}</p>
              <div className="flex flex-col gap-0.5 mb-3">
                {palette.colors.slice(0, 2).map((c) => (
                  <div key={c.hex} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: c.hex }} />
                    <span className="text-[10px] text-[#888] truncate">{c.label}</span>
                    <span className="text-[10px] font-mono text-[#555] ml-auto">{c.hex}</span>
                  </div>
                ))}
              </div>
              {selected ? (
                <div className="flex items-center gap-1 text-[10px] font-medium text-[#8b5cf6]">
                  <Check size={11} />
                  Selecionada
                </div>
              ) : (
                <button
                  onClick={() => onSelect(palette.index)}
                  className="text-[10px] font-medium text-[#888] hover:text-[#8b5cf6] transition-colors"
                >
                  Selecionar
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
