"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ClientSignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError("Email ou senha incorretos.");
      setLoading(false);
      return;
    }

    router.push("/client/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-8 w-full max-w-sm space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-[#8b5cf6] flex items-center justify-center">
            <span className="text-white text-xs font-bold">CB</span>
          </div>
          <h1 className="text-xl font-bold text-[#1A3A66]">Clique Boost</h1>
        </div>
        <p className="text-sm text-gray-500">Portal do Cliente</p>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Senha</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]" />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full bg-[#8b5cf6] text-white rounded-lg py-2 text-sm font-semibold hover:bg-[#7c3aed] transition-colors disabled:opacity-50">
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <p className="text-center text-xs text-gray-400">
          Acesse com o email e senha enviados pela sua agência.
        </p>
      </form>
    </div>
  );
}
