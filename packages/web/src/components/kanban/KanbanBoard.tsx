"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Board, BoardColumn, KanbanCard as KanbanCardType } from "@clique-boost/shared";
import { KanbanCard } from "./KanbanCard";
import { CardDetailModal } from "./CardDetailModal";
import { Plus } from "lucide-react";

interface ColumnProps {
  column: BoardColumn;
  onUpdate: (cardId: string, fields: Partial<KanbanCardType>) => Promise<void>;
  onOpenDetail: (card: KanbanCardType) => void;
  onAddCard: (columnId: string) => void;
  readOnly?: boolean;
}

function KanbanColumn({ column, onUpdate, onOpenDetail, onAddCard, readOnly }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return (
    <div className="flex flex-col w-64 flex-shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-semibold text-[#555]">{column.name}</span>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-[#bbb] bg-[#f5f5f5] px-1.5 py-0.5 rounded-full">
            {column.cards.length}
          </span>
          {!readOnly && (
            <button
              onClick={() => onAddCard(column.id)}
              className="text-[#bbb] hover:text-[#8b5cf6] transition-colors"
            >
              <Plus size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Cards drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[120px] space-y-2 rounded-xl p-2 transition-colors ${
          isOver ? "bg-[#f5f0ff]" : "bg-[#fafafa]"
        }`}
      >
        <SortableContext items={column.cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {column.cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              onUpdate={onUpdate}
              onOpenDetail={onOpenDetail}
              readOnly={readOnly}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

interface Props {
  initialBoard: Board;
  clientId: string;
  readOnly?: boolean;
}

export function KanbanBoard({ initialBoard, clientId, readOnly }: Props) {
  const [board, setBoard] = useState<Board>(initialBoard);
  const [activeCard, setActiveCard] = useState<KanbanCardType | null>(null);
  const [detailCard, setDetailCard] = useState<KanbanCardType | null>(null);
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Encontra card em qualquer coluna
  const findCard = useCallback(
    (cardId: string): { card: KanbanCardType; colIdx: number; cardIdx: number } | null => {
      for (let ci = 0; ci < board.columns.length; ci++) {
        const idx = board.columns[ci].cards.findIndex((c) => c.id === cardId);
        if (idx !== -1) return { card: board.columns[ci].cards[idx], colIdx: ci, cardIdx: idx };
      }
      return null;
    },
    [board]
  );

  const handleDragStart = (e: DragStartEvent) => {
    const found = findCard(e.active.id as string);
    if (found) setActiveCard(found.card);
  };

  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const activeFound = findCard(active.id as string);
    if (!activeFound) return;

    // over pode ser coluna ou card
    const overColIdx = board.columns.findIndex(
      (c) => c.id === over.id || c.cards.some((card) => card.id === over.id)
    );
    if (overColIdx === -1) return;

    if (activeFound.colIdx === overColIdx) return; // mesma coluna, deixa pra DragEnd

    setBoard((prev) => {
      const cols = prev.columns.map((c) => ({ ...c, cards: [...c.cards] }));
      const [moved] = cols[activeFound.colIdx].cards.splice(activeFound.cardIdx, 1);
      moved.columnId = cols[overColIdx].id;
      cols[overColIdx].cards.push(moved);
      return { ...prev, columns: cols };
    });
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveCard(null);
    if (!over || active.id === over.id) return;

    const activeFound = findCard(active.id as string);
    const overFound = findCard(over.id as string);
    if (!activeFound) return;

    if (overFound && activeFound.colIdx === overFound.colIdx) {
      // Reordenar dentro da mesma coluna
      setBoard((prev) => {
        const cols = prev.columns.map((c) => ({ ...c, cards: [...c.cards] }));
        cols[activeFound.colIdx].cards = arrayMove(
          cols[activeFound.colIdx].cards,
          activeFound.cardIdx,
          overFound.cardIdx
        );
        return { ...prev, columns: cols };
      });
    }

    // Persiste no servidor
    const found = findCard(active.id as string);
    if (!found) return;
    await fetch(`/api/cards/${active.id}/move`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columnId: found.card.columnId, position: found.cardIdx }),
    });
  };

  const handleUpdate = async (cardId: string, fields: Partial<KanbanCardType>) => {
    const res = await fetch(`/api/cards/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (!res.ok) return;
    const updated: KanbanCardType = await res.json();

    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((col) => ({
        ...col,
        cards: col.cards.map((c) => (c.id === cardId ? { ...c, ...updated } : c)),
      })),
    }));

    if (detailCard?.id === cardId) setDetailCard((d) => d ? { ...d, ...updated } : d);
  };

  const handleDelete = async (cardId: string) => {
    await fetch(`/api/cards/${cardId}`, { method: "DELETE" });
    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((col) => ({
        ...col,
        cards: col.cards.filter((c) => c.id !== cardId),
      })),
    }));
  };

  const handleAddCard = async (columnId: string) => {
    if (!newCardTitle.trim()) return;
    const res = await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columnId, boardId: board.id, title: newCardTitle.trim() }),
    });
    if (!res.ok) return;
    const card: KanbanCardType = await res.json();

    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((col) =>
        col.id === columnId ? { ...col, cards: [...col.cards, card] } : col
      ),
    }));
    setNewCardTitle("");
    setAddingToColumn(null);
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* Scrollable horizontal board */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {board.columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                onUpdate={handleUpdate}
                onOpenDetail={setDetailCard}
                onAddCard={(colId) => { setAddingToColumn(colId); setNewCardTitle(""); }}
                readOnly={readOnly}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeCard && (
            <div className="rotate-2 scale-105">
              <KanbanCard
                card={activeCard}
                onUpdate={async () => {}}
                onOpenDetail={() => {}}
                readOnly
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Add card inline input */}
      {addingToColumn && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/20 p-4" onClick={() => setAddingToColumn(null)}>
          <div className="bg-white rounded-xl shadow-lg p-4 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <p className="text-xs font-semibold text-[#555] mb-2">Novo card</p>
            <input
              autoFocus
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddCard(addingToColumn); if (e.key === "Escape") setAddingToColumn(null); }}
              placeholder="Título do card…"
              className="w-full text-sm border border-[#e5e5e5] rounded-lg px-3 py-2 mb-3 focus:outline-none focus:border-[#8b5cf6]"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAddingToColumn(null)} className="text-xs text-[#888] px-3 py-1.5">Cancelar</button>
              <button
                onClick={() => handleAddCard(addingToColumn)}
                className="text-xs px-3 py-1.5 bg-[#8b5cf6] text-white rounded-lg hover:bg-[#7c3aed]"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detailCard && (
        <CardDetailModal
          card={detailCard}
          onClose={() => setDetailCard(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          readOnly={readOnly}
        />
      )}
    </>
  );
}
