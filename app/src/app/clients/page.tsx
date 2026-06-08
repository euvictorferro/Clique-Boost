import Link from "next/link";
import { readClients } from "@/lib/clients";

export default function ClientsPage() {
  const clients = readClients();

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-[#111] mb-5">Clientes</h1>
      <div className="grid grid-cols-2 gap-4">
        {clients.map((c) => (
          <Link
            key={c.id}
            href={`/clients/${c.id}/metrics`}
            className="bg-white rounded-xl border border-[#e5e5e5] p-4 hover:border-[#8b5cf6] transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-full bg-[#8b5cf6] flex items-center justify-center text-white font-bold text-sm">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#111]">{c.name}</p>
                <p className="text-xs text-[#888]">{c.niche}</p>
              </div>
            </div>
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                c.status === "active"
                  ? "bg-[#d1fae5] text-[#059669]"
                  : "bg-[#f5f5f5] text-[#888]"
              }`}
            >
              {c.status}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
