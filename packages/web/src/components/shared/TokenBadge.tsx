function daysDiff(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

interface TokenBadgeProps {
  expiresAt?: string;
}

export function TokenBadge({ expiresAt }: TokenBadgeProps) {
  if (!expiresAt) {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fee2e2] text-[#e11d48] font-medium">
        🔴 Não configurado
      </span>
    );
  }

  const days = daysDiff(expiresAt);

  if (days <= 0) {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fee2e2] text-[#e11d48] font-medium">
        🔴 Expirado
      </span>
    );
  }

  if (days <= 14) {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#d97706] font-medium">
        🟡 Expira em {days}d
      </span>
    );
  }

  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d1fae5] text-[#059669] font-medium">
      🟢 Válido
    </span>
  );
}
