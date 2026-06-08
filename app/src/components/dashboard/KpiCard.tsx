import { TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
}

export function KpiCard({ label, value, delta, deltaLabel }: KpiCardProps) {
  const isPositive = delta !== undefined && delta >= 0;

  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-4">
      <p className="text-xs text-[#888] mb-1">{label}</p>
      <p className="text-2xl font-bold text-[#111]">{value}</p>
      {delta !== undefined && (
        <div
          className={`flex items-center gap-1 mt-1 text-xs font-medium ${
            isPositive ? "text-[#059669]" : "text-[#e11d48]"
          }`}
        >
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>
            {isPositive ? "+" : ""}
            {delta.toLocaleString("pt-BR")} {deltaLabel ?? ""}
          </span>
        </div>
      )}
    </div>
  );
}
