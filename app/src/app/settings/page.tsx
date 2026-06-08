"use client";

import { useEffect, useState } from "react";
import { TokensPanel } from "@/components/settings/TokensPanel";
import { CronPanel } from "@/components/settings/CronPanel";
import { Save } from "lucide-react";

interface Token {
  key: string;
  label: string;
  value: string;
  status: "valid" | "missing";
}

interface Crons {
  calendarDay: string;
  calendarHour: string;
  weeklyDay: string;
  weeklyHour: string;
  metricsHour: string;
}

const DEFAULT_CRONS: Crons = {
  calendarDay: "1",
  calendarHour: "08",
  weeklyDay: "monday",
  weeklyHour: "09",
  metricsHour: "07",
};

export default function SettingsPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [crons, setCrons] = useState<Crons>(DEFAULT_CRONS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setTokens(d.tokens ?? []);
        if (d.crons) setCrons(d.crons);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ crons }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <div className="p-6 text-sm text-[#888]">Carregando…</div>;

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-lg font-semibold text-[#111] mb-6">Configurações Globais</h1>

      <h2 className="text-sm font-semibold text-[#888] uppercase tracking-wide mb-3">Tokens e APIs</h2>
      <div className="mb-8">
        <TokensPanel tokens={tokens} />
        <p className="text-xs text-[#888] mt-2">
          Edite os valores diretamente no arquivo{" "}
          <code className="bg-[#f5f5f5] px-1 rounded">.env</code> na raiz do projeto.
        </p>
      </div>

      <h2 className="text-sm font-semibold text-[#888] uppercase tracking-wide mb-3">Horários dos Crons</h2>
      <div className="mb-6">
        <CronPanel crons={crons} onChange={setCrons} />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-[#8b5cf6] text-white text-sm rounded-lg hover:bg-[#7c3aed] transition-colors disabled:opacity-50"
      >
        <Save size={14} />
        {saving ? "Salvando…" : saved ? "Salvo! ✓" : "Salvar"}
      </button>
    </div>
  );
}
