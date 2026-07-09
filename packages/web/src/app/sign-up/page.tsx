"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("As senhas não coincidem."); return; }
    if (password.length < 6) { setError("A senha deve ter pelo menos 6 caracteres."); return; }
    setLoading(true);
    setError("");

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? "Erro ao criar conta.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/set-agency-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: data.user.id }),
    });

    if (!res.ok) {
      setError("Conta criada, mas erro ao configurar permissões. Tente fazer login.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-8 w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold text-[#1A3A66]">Clique Boost</h1>
        <p className="text-sm text-gray-500">Criar conta da agência</p>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Nome completo</label>
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A66]" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A66]" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Senha</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A66]" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Confirmar senha</label>
          <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A66]" />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full bg-[#1A3A66] text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-50">
          {loading ? "Criando conta..." : "Criar conta"}
        </button>

        <p className="text-center text-xs text-gray-500">
          Já tem conta?{" "}
          <Link href="/sign-in" className="text-[#1A3A66] font-medium hover:underline">Entrar</Link>
        </p>
      </form>
    </div>
  );
}
