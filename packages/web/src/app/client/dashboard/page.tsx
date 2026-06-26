import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase";

const API_BASE = process.env.API_URL || "http://localhost:3001";

async function getClientData(userId: string) {
  try {
    const res = await fetch(`${API_BASE}/api/clients/by-user/${userId}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function ClientDashboardPage() {
  const cookieStore = await cookies();
  const supabase = createServerSupabase(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/client/sign-in");

  const data = await getClientData(user.id);

  if (!data?.client) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f172a] text-white">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Conta não vinculada</h2>
          <p className="text-slate-400 text-sm">
            Sua conta ainda não foi associada a um cliente.<br />
            Fale com a equipe Clique Boost.
          </p>
        </div>
      </div>
    );
  }

  const { client, insights } = data;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          {client.profilePictureUrl && (
            <img src={client.profilePictureUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
          )}
          <div>
            <h1 className="text-2xl font-bold">{client.brandName}</h1>
            <p className="text-slate-400 text-sm">Olá, {user.email?.split("@")[0] ?? client.name} 👋</p>
          </div>
        </div>

        {insights ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <KpiCard label="Seguidores" value={insights.followerCount?.toLocaleString("pt-BR") ?? "—"} />
            <KpiCard label="Alcance" value={insights.reach?.toLocaleString("pt-BR") ?? "—"} />
            <KpiCard label="Impressões" value={insights.impressions?.toLocaleString("pt-BR") ?? "—"} />
            <KpiCard label="Engajamento" value={insights.engagementRate ? `${insights.engagementRate.toFixed(1)}%` : "—"} />
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl p-6 mb-8 text-slate-400 text-sm">
            Métricas ainda não disponíveis. Execute a coleta de dados no painel da agência.
          </div>
        )}

        {client.brandColors && (
          <div className="bg-slate-800 rounded-xl p-6 mb-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Identidade Visual</h2>
            <div className="flex gap-2">
              {client.brandColors.split(",").map((hex: string, i: number) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-lg border border-slate-600" style={{ backgroundColor: hex.trim() }} />
                  <span className="text-xs text-slate-500">{hex.trim()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-slate-600 text-xs text-center mt-8">Clique Boost © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-800 rounded-xl p-4">
      <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
