import React from "react";
import { useDroppable } from "@dnd-kit/core";
import KanbanCard, { KanbanCardData } from "./KanbanCard";

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  cards: KanbanCardData[];
  onViewCard: (card: KanbanCardData) => void;
}

export default function KanbanColumn({ id, title, color, cards, onViewCard }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-2xl bg-zinc-950 p-4 border transition-colors min-h-[480px] w-full ${
        isOver 
          ? "border-red-600/50 bg-zinc-900/40" 
          : "border-zinc-900"
      }`}
    >
      {/* Column Title */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${color}`} />
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-100">{title}</h3>
        </div>
        <span className="text-[10px] font-bold text-zinc-500 font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-850">
          {cards.length}
        </span>
      </div>

      {/* Cards list */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {cards.map((card) => (
          <KanbanCard key={card.id} card={card} onViewDetails={onViewCard} />
        ))}

        {cards.length === 0 && (
          <div className="h-40 flex flex-col items-center justify-center text-center border border-dashed border-zinc-900 rounded-xl p-4">
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
              Arraste itens aqui
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
