"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";

const NICHES = [
  { value: "life-insurance", label: "Life Insurance" },
  { value: "real-estate", label: "Imóveis / Corretor" },
  { value: "general", label: "Geral" },
];

type FormState = {
  name: string;
  brandName: string;
  niche: string;
  instagramHandle: string;
  toneOfVoice: string;
  contentGoal: string;
};

export default function NewClientPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormState>({
    name: "",
    brandName: "",
    niche: "general",
    instagramHandle: "",
    toneOfVoice: "",
    contentGoal: "",
  });

  const set =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/clients/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao criar cliente");
        return;
      }

      router.push(`/clients/${data.client.id}/settings`);
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full text-sm border border-[#e5e5e5] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#8b5cf6]";

  return (
    <div className="p-6 max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-[rgba(139,92,246,0.07)] border border-[rgba(139,92,246,0.2)] flex items-center justify-center">
          <UserPlus size={16} className="text-[#8b5cf6]" />
        </div>
        <h1 className="text-lg font-semibold text-[#111]">Novo Cliente</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">
              Nome completo <span className="text-[#e11d48]">*</span>
            </label>
            <input
              value={form.name}
              onChange={set("name")}
              placeholder="Laís Daltrozo"
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">
              Nome da marca / empresa
            </label>
            <input
              value={form.brandName}
              onChange={set("brandName")}
              placeholder="Laís Daltrozo Seguros"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">
              Nicho <span className="text-[#e11d48]">*</span>
            </label>
            <select
              value={form.niche}
              onChange={set("niche")}
              required
              className={inputClass}
            >
              {NICHES.map((n) => (
                <option key={n.value} value={n.value}>{n.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">
              Handle do Instagram
            </label>
            <input
              value={form.instagramHandle}
              onChange={set("instagramHandle")}
              placeholder="@lais.daltrozo"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Tom de Voz</label>
            <textarea
              value={form.toneOfVoice}
              onChange={set("toneOfVoice")}
              placeholder="Ex: Profissional mas próximo, educativo, sem jargões técnicos"
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">
              Objetivo de Conteúdo
            </label>
            <textarea
              value={form.contentGoal}
              onChange={set("contentGoal")}
              placeholder="Ex: Gerar leads qualificados, educar sobre seguros de vida"
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-[#e11d48] bg-[#fee2e2] px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 text-sm px-4 py-2 border border-[#e5e5e5] rounded-lg text-[#555] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 text-sm px-4 py-2 bg-[#8b5cf6] text-white rounded-lg hover:bg-[#7c3aed] transition-colors disabled:opacity-50"
          >
            {saving ? "Criando…" : "Criar Cliente"}
          </button>
        </div>
      </form>
    </div>
  );
}
