import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { Eye, GripVertical } from "lucide-react";

export interface KanbanCardData {
  id: string;
  title: string;
  subtitle: string;
  details: string;
  type: string;
  rawObject: any;
}

interface KanbanCardProps {
  key?: string;
  card: KanbanCardData;
  onViewDetails: (card: KanbanCardData) => void;
}

export default function KanbanCard({ card, onViewDetails }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-zinc-950 border ${
        isDragging 
          ? "border-red-600 shadow-2xl scale-[1.02]" 
          : "border-zinc-900 hover:border-zinc-800"
      } rounded-xl p-3.5 space-y-2.5 transition-all relative group select-none`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <div 
            {...listeners} 
            {...attributes} 
            className="cursor-grab active:cursor-grabbing p-1 text-zinc-600 hover:text-zinc-400 rounded transition-colors"
            title="Arraste para mover"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          <span className="text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-850">
            {card.type}
          </span>
        </div>
        <button
          onClick={() => onViewDetails(card)}
          className="p-1 hover:bg-zinc-900 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
          title="Ver detalhes"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-0.5">
        <h4 className="text-xs font-bold text-white line-clamp-1">{card.title}</h4>
        <p className="text-[10px] text-zinc-400 font-semibold truncate">{card.subtitle}</p>
      </div>

      <div className="pt-2 border-t border-zinc-900/60 flex items-center justify-between text-[9px] text-zinc-500 font-mono">
        <span>ID: {card.id.substring(0, 12)}</span>
      </div>
    </div>
  );
}
