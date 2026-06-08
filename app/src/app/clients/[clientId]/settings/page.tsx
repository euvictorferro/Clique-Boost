"use client";

import { useEffect, useState } from "react";
import { TokenBadge } from "@/components/shared/TokenBadge";
import { Save } from "lucide-react";

interface ClientData {
  id: string;
  name: string;
  brandName?: string;
  niche: string;
  instagramHandle?: string;
  status: string;
  toneOfVoice?: string;
  contentGoal?: string;
  metaAccessToken?: string;
  metaTokenExpiresAt?: string;
}

export default function ClientSettingsPage({ params }: { params: { clientId: string } }) {
  const [client, setClient] = useState<ClientData | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/clients`)
      .then((r) => r.json())
      .then((clients: ClientData[]) => {
        const found = clients.find((c) => c.id === params.clientId);
        if (found) setClient(found);
      });
  }, [params.clientId]);

  if (!client) return <div className="p-6 text-sm text-[#888]">Carregando…</div>;

  const Field = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div>
      <label className="block text-xs font-medium text-[#555] mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm border border-[#e5e5e5] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#8b5cf6]"
      />
    </div>
  );

  return (
    <div className="p-6 max-w-xl">
      <h2 className="text-base font-semibold text-[#111] mb-5">Configurações do Cliente</h2>

      <div className="bg-white rounded-xl border border-[#e5e5e5] p-5 flex flex-col gap-4 mb-4">
        <Field label="Nome" value={client.name} onChange={(v) => setClient({ ...client, name: v })} />
        <Field label="Marca" value={client.brandName ?? ""} onChange={(v) => setClient({ ...client, brandName: v })} />
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Nicho</label>
          <select
            value={client.niche}
            onChange={(e) => setClient({ ...client, niche: e.target.value })}
            className="w-full text-sm border border-[#e5e5e5] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#8b5cf6]"
          >
            <option value="life-insurance">Life Insurance</option>
            <option value="real-estate">Imóveis</option>
            <option value="general">Geral</option>
          </select>
        </div>
        <Field label="Instagram Handle" value={client.instagramHandle ?? ""} onChange={(v) => setClient({ ...client, instagramHandle: v })} />
        <Field label="Tom de Voz" value={client.toneOfVoice ?? ""} onChange={(v) => setClient({ ...client, toneOfVoice: v })} />
        <Field label="Objetivo de Conteúdo" value={client.contentGoal ?? ""} onChange={(v) => setClient({ ...client, contentGoal: v })} />
      </div>

      <div className="bg-white rounded-xl border border-[#e5e5e5] p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#111]">Meta Access Token</h3>
          <TokenBadge expiresAt={client.metaTokenExpiresAt} />
        </div>
        <input
          type="password"
          value={client.metaAccessToken ?? ""}
          onChange={(e) => setClient({ ...client, metaAccessToken: e.target.value })}
          placeholder="EAAxxxxxxxxx…"
          className="w-full text-sm border border-[#e5e5e5] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#8b5cf6] font-mono"
        />
      </div>

      <button
        onClick={async () => {
          setSaving(true);
          await fetch(`/api/clients`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(client),
          });
          setSaving(false);
        }}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-[#8b5cf6] text-white text-sm rounded-lg hover:bg-[#7c3aed] transition-colors disabled:opacity-50"
      >
        <Save size={14} />
        {saving ? "Salvando…" : "Salvar"}
      </button>
    </div>
  );
}
