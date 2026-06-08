"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Edit2, Check, RefreshCw } from "lucide-react";

interface IcpEditorProps {
  initial: string;
  onSave: (content: string) => Promise<void>;
  onRegenerate: () => Promise<void>;
}

export function IcpEditor({ initial, onSave, onRegenerate }: IcpEditorProps) {
  const [content, setContent] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(content);
    setSaving(false);
    setEditing(false);
  };

  const handleRegenerate = async () => {
    if (!confirm("Isso vai sobrescrever o ICP atual. Continuar?")) return;
    setRegenerating(true);
    await onRegenerate();
    setRegenerating(false);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-base font-semibold text-[#111] flex-1">ICP — Perfil do Cliente Ideal</h2>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[#e5e5e5] rounded-lg text-[#555] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={regenerating ? "animate-spin" : ""} />
          {regenerating ? "Gerando…" : "Regenerar"}
        </button>
        {editing ? (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#8b5cf6] text-white rounded-lg disabled:opacity-50"
          >
            <Check size={12} />
            {saving ? "Salvando…" : "Salvar"}
          </button>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[#e5e5e5] rounded-lg text-[#555] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-colors"
          >
            <Edit2 size={12} />
            Editar
          </button>
        )}
      </div>

      {editing ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-[calc(100vh-200px)] font-mono text-sm border border-[#e5e5e5] rounded-xl p-4 resize-none focus:outline-none focus:border-[#8b5cf6]"
        />
      ) : (
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-6 prose prose-sm max-w-none">
          {content ? (
            <ReactMarkdown>{content}</ReactMarkdown>
          ) : (
            <p className="text-[#888]">ICP não gerado ainda.</p>
          )}
        </div>
      )}
    </div>
  );
}
