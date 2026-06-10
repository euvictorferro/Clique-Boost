"use client";

import { useEffect, useState, use, Suspense } from "react";
import { TokenBadge } from "@/components/shared/TokenBadge";
import { Save, Instagram, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { useSearchParams } from "next/navigation";

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

function SettingsContent({ clientId }: { clientId: string }) {
  const [client, setClient] = useState<ClientData | null>(null);
  const [saving, setSaving] = useState(false);
  const searchParams = useSearchParams();

  const metaConnected = searchParams.get("meta_connected") === "1";
  const metaError = searchParams.get("meta_error");

  useEffect(() => {
    fetch(`/api/clients`)
      .then((r) => r.json())
      .then((clients: ClientData[]) => {
        const found = clients.find((c) => c.id === clientId);
        if (found) setClient(found);
      });
  }, [clientId, metaConnected]); // re-fetch after OAuth callback

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

  const hasToken = !!client.metaAccessToken;

  return (
    <div className="p-6 max-w-xl">
      <h2 className="text-base font-semibold text-[#111] mb-5">Configurações do Cliente</h2>

      {/* OAuth feedback banners */}
      {metaConnected && (
        <div className="flex items-center gap-2 bg-[#f0fdf4] border border-[#86efac] text-[#166534] text-sm px-4 py-3 rounded-lg mb-4">
          <CheckCircle size={15} />
          Instagram conectado com sucesso! Token salvo por 60 dias.
        </div>
      )}
      {metaError && (
        <div className="flex items-center gap-2 bg-[#fef2f2] border border-[#fca5a5] text-[#991b1b] text-sm px-4 py-3 rounded-lg mb-4">
          <AlertCircle size={15} />
          Erro ao conectar: {decodeURIComponent(metaError)}
        </div>
      )}

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

      {/* Instagram / Meta connection */}
      <div className="bg-white rounded-xl border border-[#e5e5e5] p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Instagram size={15} className="text-[#e1306c]" />
            <h3 className="text-sm font-semibold text-[#111]">Conta do Instagram</h3>
          </div>
          <TokenBadge expiresAt={client.metaTokenExpiresAt} />
        </div>

        {hasToken ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-[#166534]">
              <CheckCircle size={14} className="text-[#16a34a]" />
              Conta conectada
            </div>
            <a
              href={`/api/auth/meta?clientId=${clientId}`}
              className="flex items-center gap-1.5 text-xs text-[#888] hover:text-[#333] transition-colors"
            >
              <RefreshCw size={12} />
              Reconectar
            </a>
          </div>
        ) : (
          <div>
            <p className="text-xs text-[#888] mb-3">
              Conecte o Instagram do cliente para buscar métricas automaticamente.
              O cliente precisa autorizar o acesso via Facebook.
            </p>
            <a
              href={`/api/auth/meta?clientId=${clientId}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#e1306c] text-white text-sm rounded-lg hover:bg-[#c13584] transition-colors"
            >
              <Instagram size={14} />
              Conectar Instagram
            </a>
          </div>
        )}

        {/* Manual token fallback */}
        <details className="mt-3">
          <summary className="text-xs text-[#aaa] cursor-pointer hover:text-[#666] transition-colors">
            Inserir token manualmente
          </summary>
          <input
            type="password"
            value={client.metaAccessToken ?? ""}
            onChange={(e) => setClient({ ...client, metaAccessToken: e.target.value })}
            placeholder="EAAxxxxxxxxx…"
            className="mt-2 w-full text-sm border border-[#e5e5e5] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#8b5cf6] font-mono"
          />
        </details>
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

export default function ClientSettingsPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params);
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[#888]">Carregando…</div>}>
      <SettingsContent clientId={clientId} />
    </Suspense>
  );
}
