"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { KanbanCard as KanbanCardType, CardStatus } from "@clique-boost/shared";
import { GripVertical, Instagram, Music2, Facebook } from "lucide-react";

const FORMAT_COLORS: Record<string, string> = {
  Reel:      "bg-purple-100 text-purple-700",
  Carrossel: "bg-blue-100 text-blue-700",
  Stories:   "bg-green-100 text-green-700",
  TikTok:    "bg-pink-100 text-pink-700",
};

const STATUS_COLORS: Record<CardStatus, string> = {
  draft:     "bg-gray-100 text-gray-500",
  pending:   "bg-yellow-100 text-yellow-700",
  approved:  "bg-blue-100 text-blue-700",
  published: "bg-green-100 text-green-700",
};

const STATUS_LABELS: Record<CardStatus, string> = {
  draft:     "Rascunho",
  pending:   "Pendente",
  approved:  "Aprovado",
  published: "Publicado",
};

const STATUS_CYCLE: Record<CardStatus, CardStatus> = {
  draft:     "pending",
  pending:   "approved",
  approved:  "published",
  published: "draft",
};

function PlatformIcon({ platform }: { platform: string }) {
  const p = platform.toLowerCase();
  if (p.includes("instagram")) return <Instagram size={10} />;
  if (p.includes("tiktok")) return <Music2 size={10} />;
  if (p.includes("facebook")) return <Facebook size={10} />;
  return <span className="text-[9px]">{platform[0]}</span>;
}

interface Props {
  card: KanbanCardType;
  onUpdate: (cardId: string, fields: Partial<KanbanCardType>) => Promise<void>;
  onOpenDetail: (card: KanbanCardType) => void;
  readOnly?: boolean;
}

export function KanbanCard({ card, onUpdate, onOpenDetail, readOnly }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, disabled: readOnly });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleStatusClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (readOnly) return;
    await onUpdate(card.id, { status: STATUS_CYCLE[card.status] });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-[#e5e5e5] rounded-lg p-3 shadow-sm hover:border-[#8b5cf6] transition-colors cursor-pointer group"
      onClick={() => onOpenDetail(card)}
    >
      <div className="flex items-start gap-2">
        {!readOnly && (
          <button
            {...attributes}
            {...listeners}
            className="mt-0.5 text-[#ccc] hover:text-[#888] cursor-grab active:cursor-grabbing flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical size={14} />
          </button>
        )}
        <div className="flex-1 min-w-0">
          {/* Formato + Plataformas */}
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            {card.format && (
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${FORMAT_COLORS[card.format] ?? "bg-gray-100 text-gray-600"}`}>
                {card.format}
              </span>
            )}
            {card.platforms?.map((p) => (
              <span key={p} className="flex items-center gap-0.5 text-[10px] text-[#888] bg-[#f5f5f5] px-1.5 py-0.5 rounded">
                <PlatformIcon platform={p} />
                {p}
              </span>
            ))}
            {card.day && (
              <span className="text-[10px] text-[#aaa] ml-auto">Dia {card.day}</span>
            )}
          </div>

          {/* Título/Tema */}
          <p className="text-xs font-medium text-[#111] leading-snug mb-1.5 line-clamp-2">
            {card.theme ?? card.title}
          </p>

          {/* Hook preview */}
          {card.hook && (
            <p className="text-[10px] text-[#888] line-clamp-1 mb-2">
              &ldquo;{card.hook}&rdquo;
            </p>
          )}

          {/* Status */}
          <button
            onClick={handleStatusClick}
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[card.status]} ${!readOnly ? "hover:opacity-80 transition-opacity" : ""}`}
          >
            {STATUS_LABELS[card.status]}
          </button>
        </div>
      </div>
    </div>
  );
}
