"use client";

import { useEffect, useState } from "react";
import { IcpEditor } from "@/components/client/IcpEditor";

export default function IcpPage({ params }: { params: { clientId: string } }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/clients/${params.clientId}/icp`)
      .then((r) => r.json())
      .then((d) => setContent(d.content ?? ""))
      .finally(() => setLoading(false));
  }, [params.clientId]);

  const handleSave = async (newContent: string) => {
    await fetch(`/api/clients/${params.clientId}/icp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newContent }),
    });
    setContent(newContent);
  };

  const handleRegenerate = async () => {
    await fetch(`/api/pipeline/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: params.clientId, job: "icp" }),
    });
    setTimeout(() => {
      fetch(`/api/clients/${params.clientId}/icp`)
        .then((r) => r.json())
        .then((d) => setContent(d.content ?? ""));
    }, 3000);
  };

  if (loading) return <div className="p-6 text-sm text-[#888]">Carregando ICP…</div>;

  return (
    <div className="p-6">
      <IcpEditor initial={content} onSave={handleSave} onRegenerate={handleRegenerate} />
    </div>
  );
}
