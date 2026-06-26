"use client";

interface Token {
  key: string;
  label: string;
  value: string;
  status: "valid" | "missing";
}

const STATUS_BADGE = {
  valid: "bg-[#d1fae5] text-[#059669]",
  missing: "bg-[#fee2e2] text-[#e11d48]",
};

const STATUS_LABEL = {
  valid: "🟢 Configurado",
  missing: "🔴 Não configurado",
};

export function TokensPanel({ tokens }: { tokens: Token[] }) {
  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#f5f5f5]">
            <th className="text-left text-xs font-medium text-[#888] px-4 py-3">Variável</th>
            <th className="text-left text-xs font-medium text-[#888] px-4 py-3">Status</th>
            <th className="text-left text-xs font-medium text-[#888] px-4 py-3">Valor (parcial)</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((t) => (
            <tr key={t.key} className="border-b border-[#f5f5f5] last:border-0">
              <td className="px-4 py-3 text-sm font-mono text-[#333]">{t.key}</td>
              <td className="px-4 py-3">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[t.status]}`}>
                  {STATUS_LABEL[t.status]}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-[#888] font-mono">
                {t.value
                  ? t.value.slice(0, 6) + "••••••" + t.value.slice(-4)
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
