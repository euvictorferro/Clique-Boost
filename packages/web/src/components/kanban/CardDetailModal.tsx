"use client";

import { useState } from "react";
import { KanbanCard, CardStatus } from "@clique-boost/shared";
import { X, Copy, Check } from "lucide-react";

const STATUS_LABELS: Record<CardStatus, string> = {
  draft:     "Rascunho",
  pending:   "Pendente",
  approved:  "Aprovado",
  published: "Publicado",
};

interface Props {
  card: KanbanCard;
  onClose: () => void;
  onUpdate: (cardId: string, fields: Partial<KanbanCard>) => Promise<void>;
  onDelete: (cardId: string) => Promise<void>;
  readOnly?: boolean;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="text-[#bbb] hover:text-[#8b5cf6] transition-colors">
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

function Field({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  if (!value && !children) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1">{label}</p>
      {children ?? <p className="text-xs text-[#333] leading-relaxed">{value}</p>}
    </div>
  );
}

export function CardDetailModal({ card, onClose, onUpdate, onDelete, readOnly }: Props) {
  const [status, setStatus] = useState<CardStatus>(card.status);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleStatusChange = async (newStatus: CardStatus) => {
    if (readOnly) return;
    setStatus(newStatus);
    setSaving(true);
    await onUpdate(card.id, { status: newStatus });
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm("Remover este card?")) return;
    setDeleting(true);
    await onDelete(card.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[#f0f0f0]">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {card.format && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                  {card.format}
                </span>
              )}
              {card.day && (
                <span className="text-xs text-[#aaa]">Dia {card.day}</span>
              )}
              {card.week && (
                <span className="text-xs text-[#aaa]">Semana {card.week}</span>
              )}
            </div>
            <h2 className="text-sm font-semibold text-[#111] leading-snug">{card.theme ?? card.title}</h2>
          </div>
          <button onClick={onClose} className="text-[#bbb] hover:text-[#555] flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Status selector */}
          <div>
            <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-2">Status</p>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(STATUS_LABELS) as CardStatus[]).map((s) => (
                <button
                  key={s}
                  disabled={readOnly || saving}
                  onClick={() => handleStatusChange(s)}
                  className={`text-xs px-3 py-1 rounded-full transition-colors ${
                    status === s
                      ? "bg-[#8b5cf6] text-white"
                      : "bg-[#f5f5f5] text-[#555] hover:bg-[#ede9fe] hover:text-[#7c3aed]"
                  } disabled:opacity-50`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Plataformas */}
          {card.platforms?.length > 0 && (
            <Field label="Plataformas" value={card.platforms.join(", ")} />
          )}

          {/* Hook */}
          {card.hook && (
            <Field label="Gancho (Hook)">
              <div className="flex items-start gap-2">
                <p className="text-xs text-[#333] leading-relaxed flex-1 italic">&ldquo;{card.hook}&rdquo;</p>
                <CopyButton text={card.hook} />
              </div>
            </Field>
          )}

          {/* Legenda */}
          {card.caption && (
            <Field label="Legenda">
              <div className="flex items-start gap-2">
                <p className="text-xs text-[#333] leading-relaxed flex-1 whitespace-pre-wrap">{card.caption}</p>
                <CopyButton text={card.caption} />
              </div>
            </Field>
          )}

          {/* Hashtags */}
          {card.hashtags && (
            <Field label="Hashtags">
              <div className="flex items-start gap-2">
                <p className="text-[11px] text-[#8b5cf6] leading-relaxed flex-1">{card.hashtags}</p>
                <CopyButton text={card.hashtags} />
              </div>
            </Field>
          )}

          <Field label="Objetivo" value={card.objective} />
          <Field label="Racional Estratégico" value={card.rationale} />
          <Field label="Ideia de Stories" value={card.storiesIdea} />
          <Field label="Notas" value={card.notes} />
        </div>

        {/* Footer */}
        {!readOnly && (
          <div className="flex justify-end gap-2 px-5 pb-5">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs px-3 py-1.5 text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
            >
              {deleting ? "Removendo…" : "Remover card"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
