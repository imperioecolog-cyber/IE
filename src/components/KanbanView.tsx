import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  DndContext, 
  useDraggable, 
  useDroppable, 
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { 
  AlertCircle, 
  CheckCircle, 
  Play, 
  Clipboard, 
  Eye, 
  Layers, 
  Radio, 
  Settings, 
  Users, 
  X,
  FileText,
  Clock,
  ShieldCheck
} from "lucide-react";
import { DBState, Processo, WebhookConfig, WebhookDeliveryLog } from "../types";

export interface KanbanCard {
  id: string;
  type: "processo" | "cadastro" | "regra" | "webhook" | "log-falha";
  title: string;
  subtitle: string;
  details: string;
  column: "todo" | "doing" | "done" | "fail";
  rawObject: any;
}

interface KanbanViewProps {
  dbState: DBState;
  webhooks: WebhookConfig[];
  webhookLogs: WebhookDeliveryLog[];
  onUpdateProcess: (registro: string, fields: Partial<Processo>) => void;
  onUpdateWebhook: (whId: string, updated: Partial<WebhookConfig>) => void;
  onWriteLog: (action: string, changes: any) => void;
}

// 1. Draggable Card Component
interface DraggableCardProps {
  card: KanbanCard;
  onViewDetails: (card: KanbanCard) => void;
}

function DraggableCard({ card, onViewDetails }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-zinc-950 border ${
        isDragging 
          ? "border-red-600 shadow-2xl shadow-red-950/20 scale-[1.02]" 
          : "border-zinc-900 hover:border-zinc-800"
      } rounded-xl p-3.5 space-y-2.5 transition-all relative group select-none`}
    >
      {/* Header type */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {/* Drag handle */}
          <div 
            {...listeners} 
            {...attributes} 
            className="cursor-grab active:cursor-grabbing p-1 text-zinc-600 hover:text-zinc-400 rounded transition-colors"
            title="Clique e arraste para mover"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8h16M4 16h16" />
            </svg>
          </div>
          <span className={`text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded ${
            card.type === "processo" ? "bg-red-950/40 text-red-400 border border-red-900/30" :
            card.type === "webhook" ? "bg-indigo-950/40 text-indigo-400 border border-indigo-900/30" :
            card.type === "cadastro" ? "bg-amber-950/40 text-amber-400 border border-amber-900/30" :
            "bg-rose-950/40 text-rose-400 border border-rose-900/30"
          }`}>
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

      {/* Title & subtitle */}
      <div className="space-y-0.5">
        <h4 className="text-xs font-bold text-white line-clamp-1">
          {card.title}
        </h4>
        <p className="text-[10px] text-zinc-400 font-semibold truncate">
          {card.subtitle}
        </p>
      </div>

      {/* Footer/Details summary */}
      <div className="pt-2 border-t border-zinc-900/60 flex items-center justify-between text-[9px] text-zinc-500 font-mono">
        <span>ID: {card.id.substring(0, 12)}</span>
        {card.type === "processo" && (
          <span className="text-red-500 font-bold tracking-wider">{card.rawObject.tipoContainer}</span>
        )}
      </div>
    </div>
  );
}

// 2. Droppable Column Component
interface DroppableColumnProps {
  key?: any;
  id: string;
  label: string;
  desc: string;
  color: string;
  count: number;
  children: React.ReactNode;
}

function DroppableColumn({ id, label, desc, color, count, children }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div 
      ref={setNodeRef} 
      className={`flex flex-col h-full bg-zinc-950/40 border ${
        isOver 
          ? "border-red-600/60 bg-red-950/5 scale-[1.01]" 
          : "border-zinc-900"
      } rounded-2xl p-4 overflow-hidden transition-all duration-200`}
    >
      {/* Column Title and Indicator */}
      <div className="border-b border-zinc-900 pb-3 flex items-center justify-between">
        <div className="flex flex-col">
          <h3 className="text-xs font-black uppercase tracking-wider text-white">
            {label}
          </h3>
          <span className="text-[9px] text-zinc-500 font-semibold mt-0.5">
            {desc}
          </span>
        </div>
        <span className={`text-[10px] font-mono px-2 py-0.5 bg-zinc-900 text-zinc-300 rounded-full border ${
          isOver ? "border-red-500/30 text-red-500 font-bold" : "border-zinc-850"
        }`}>
          {count}
        </span>
      </div>

      {/* Cards List container with scroll */}
      <div className="flex-1 overflow-y-auto pt-4 space-y-3 pr-1 min-h-[150px]">
        {children}
      </div>
    </div>
  );
}

// 3. Main Kanban View Component
export default function KanbanView({
  dbState,
  webhooks,
  webhookLogs,
  onUpdateProcess,
  onUpdateWebhook,
  onWriteLog
}: KanbanViewProps) {
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [newAlertDetails, setNewAlertDetails] = useState({ title: "", description: "" });

  // Map dbState values into KanbanCard list whenever dependencies update
  useEffect(() => {
    const list: KanbanCard[] = [];

    // 1. Map Processos to cards
    dbState.processos.forEach(p => {
      let col: "todo" | "doing" | "done" | "fail" = "doing";
      if (p.status === "Pendente" || p.status === "Agendado") {
        col = "todo";
      } else if (p.status === "Entregue" || p.status === "Devolvido") {
        col = "done";
      } else {
        col = "doing";
      }
      
      // Ifremarks contain explicit failure or issues, put in "fail" (Falha)
      if (p.observacoes?.toLowerCase().includes("erro") || p.observacoes?.toLowerCase().includes("falha")) {
        col = "fail";
      }

      list.push({
        id: p.registro,
        type: "processo",
        title: `${p.registro} - ${p.cliente}`,
        subtitle: `Container: ${p.container} (${p.tipoContainer})`,
        details: `Armador: ${p.armador} | Motorista: ${p.motorista} | Status: ${p.status}\nObs: ${p.observacoes || "Sem observações"}`,
        column: col,
        rawObject: p
      });
    });

    // 2. Map Webhooks to cards
    webhooks.forEach(wh => {
      const col = wh.active ? "doing" : "todo";
      list.push({
        id: wh.id,
        type: "webhook",
        title: `Webhook: ${wh.nome}`,
        subtitle: wh.url,
        details: `Eventos: ${wh.events.join(", ")} | Status: ${wh.active ? "Ativo" : "Inativo"}`,
        column: col,
        rawObject: wh
      });
    });

    // 3. Map Clients (Limit to 4 for clean presentation)
    dbState.clientes.slice(0, 4).forEach(c => {
      list.push({
        id: `CLI-${c.cnpj}`,
        type: "cadastro",
        title: `Cliente: ${c.nome}`,
        subtitle: `CNPJ: ${c.cnpj}`,
        details: `Contato: ${c.contato} | Email: ${c.email}`,
        column: "todo",
        rawObject: c
      });
    });

    // 4. Map Webhook failures (Limit to 5)
    webhookLogs.filter(l => !l.success).slice(0, 5).forEach(l => {
      list.push({
        id: l.id,
        type: "log-falha",
        title: `Falha Webhook: ${l.webhookName}`,
        subtitle: `Status: ${l.responseStatus}`,
        details: `Erro na entrega de dados para URL:\n${l.webhookUrl}\nResposta: ${l.responseBody}`,
        column: "fail",
        rawObject: l
      });
    });

    setCards(list);
  }, [dbState, webhooks, webhookLogs]);

  // Pointer sensor configuration to allow clicking elements (like "details") safely
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require dragging 8px before initiating drag to avoid intercepting clicks
      },
    })
  );

  const columns = [
    { id: "todo", label: "Pendente", desc: "Backlog & Cadastros", color: "border-amber-500/20 text-amber-400" },
    { id: "doing", label: "Em Andamento", desc: "Processos em Trânsito", color: "border-sky-500/20 text-sky-400" },
    { id: "done", label: "Concluído", desc: "Finalizados & Sincronizados", color: "border-emerald-500/20 text-emerald-400" },
    { id: "fail", label: "Falha", desc: "Triagem & Alertas Críticos", color: "border-red-500/20 text-red-400" },
  ] as const;

  // Move Card handler
  const moveCard = (cardId: string, targetCol: "todo" | "doing" | "done" | "fail") => {
    const matchedCard = cards.find(c => c.id === cardId);
    if (!matchedCard) return;

    // Optimistically update local state immediately
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, column: targetCol } : c));

    // Handle process state changes
    if (matchedCard.type === "processo") {
      let nextStatus: Processo["status"] = "Pendente";
      if (targetCol === "todo") nextStatus = "Agendado";
      else if (targetCol === "doing") nextStatus = "Em Trânsito";
      else if (targetCol === "done") nextStatus = "Entregue";

      const updatedObs = targetCol === "fail"
        ? `Alerta de Falha/Atenção registrado no Kanban em ${new Date().toLocaleDateString("pt-BR")}.`
        : matchedCard.rawObject.observacoes;

      // Persist state directly back into App through onUpdateProcess callback
      onUpdateProcess(matchedCard.id, { 
        status: nextStatus,
        observacoes: updatedObs
      });

      onWriteLog(`Kanban: Moveu processo ${matchedCard.id} para coluna ${targetCol}`, {
        registro: matchedCard.id,
        novaColuna: targetCol,
        novoStatus: nextStatus
      });
    } else if (matchedCard.type === "webhook") {
      const activeState = targetCol === "doing" || targetCol === "done";
      onUpdateWebhook(matchedCard.id, { active: activeState });
      onWriteLog(`Kanban: Alterou ativação do Webhook ${matchedCard.id} via Kanban para ${activeState}`, {
        id: matchedCard.id,
        active: activeState
      });
    }

    // "Arrastar um card para 'Falha' deve abrir automaticamente um modal de criação de alerta"
    if (targetCol === "fail") {
      setNewAlertDetails({
        title: `Alerta: Falha Crítica Detectada em ${matchedCard.title}`,
        description: `O item foi realocado para triagem de segurança. Detalhes: ${matchedCard.subtitle}`
      });
      setAlertModalOpen(true);
    }
  };

  // Drag End handler called by DndContext
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const cardId = active.id as string;
    const targetCol = over.id as "todo" | "doing" | "done" | "fail";

    // Only move if column actually changed
    const card = cards.find(c => c.id === cardId);
    if (card && card.column !== targetCol) {
      moveCard(cardId, targetCol);
    }
  };

  // Safe details sanitization renderer
  const renderSanitizedDetails = (card: KanbanCard) => {
    return card.details
      .replace(/\/home\/[a-zA-Z0-9_/.-]+/g, "[RAIZ_SISTEMA_OCULTADA]")
      .replace(/C:\\Users\\[a-zA-Z0-9_/.-]+/g, "[RAIZ_WINDOWS_OCULTADA]")
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}/g, "[EMAIL_MASCARADO]")
      .replace(/process\.env\.[A-Z0-9_]+/g, "[VAR_ENV_RESTRITA]");
  };

  const handleSaveKanbanAlert = () => {
    onWriteLog(`Kanban Alerta: Criado alerta customizado para triagem`, newAlertDetails);
    setAlertModalOpen(false);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-[75vh] w-full gap-4">
        {/* Kanban Board Headers & Column container */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 h-full overflow-hidden">
          {columns.map((col) => {
            const columnCards = cards.filter(c => c.column === col.id);

            return (
              <DroppableColumn 
                key={col.id}
                id={col.id}
                label={col.label}
                desc={col.desc}
                color={col.color}
                count={columnCards.length}
              >
                <AnimatePresence>
                  {columnCards.map((card) => (
                    <motion.div
                      key={card.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                    >
                      <DraggableCard 
                        card={card}
                        onViewDetails={(c) => setSelectedCard(c)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {columnCards.length === 0 && (
                  <div className="h-28 flex flex-col items-center justify-center border border-dashed border-zinc-900 rounded-xl text-center p-3">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Vazio</p>
                    <p className="text-[9px] text-zinc-600 mt-0.5">Nenhum item nesta etapa.</p>
                  </div>
                )}
              </DroppableColumn>
            );
          })}
        </div>

        {/* Card Details Modal (Sanitized) */}
        {selectedCard && (
          <div id="kanban-details-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/85 backdrop-blur-xs" onClick={() => setSelectedCard(null)} />
            <div className="relative bg-zinc-950 border border-zinc-900 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl z-10">
              <div className="flex items-center justify-between p-4 bg-black border-b border-zinc-900">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-red-500" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">
                    Detalhes do Item (Visualização Segura)
                  </h4>
                </div>
                <button onClick={() => setSelectedCard(null)} className="text-zinc-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-black tracking-widest uppercase bg-red-950/40 text-red-400 border border-red-900/30 px-1.5 py-0.5 rounded">
                    {selectedCard.type}
                  </span>
                  <h3 className="text-sm font-bold text-white pt-1">{selectedCard.title}</h3>
                  <p className="text-xs text-zinc-400">{selectedCard.subtitle}</p>
                </div>

                <div className="p-4 bg-black border border-zinc-900 rounded-xl space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block">
                    Metadados Sanitizados (Anti-Vazamento):
                  </span>
                  <pre className="text-[10px] font-mono text-zinc-300 whitespace-pre-wrap overflow-x-auto leading-relaxed max-h-48 overflow-y-auto">
                    {renderSanitizedDetails(selectedCard)}
                  </pre>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setSelectedCard(null)}
                    className="py-2 px-4 bg-zinc-900 hover:bg-zinc-850 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                  >
                    Fechar Painel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Automatically Triggered Alert Modal */}
        {alertModalOpen && (
          <div id="kanban-alert-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/85 backdrop-blur-xs" onClick={() => setAlertModalOpen(false)} />
            <div className="relative bg-zinc-950 border border-red-500/40 rounded-xl max-w-md w-full overflow-hidden shadow-2xl z-10">
              <div className="flex items-center gap-2 p-4 bg-red-950/45 border-b border-red-900/60 text-red-400">
                <AlertCircle className="w-5 h-5 shrink-0 animate-pulse" />
                <h4 className="text-xs font-black uppercase tracking-wider">
                  Nova Triagem de Alerta & Incidente
                </h4>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Você realocou um card do sistema operacional para a coluna de **Falha/Atenção**. De acordo com as diretrizes de conformidade, registre as observações deste alerta:
                </p>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-zinc-400">Título do Incidente</label>
                    <input
                      type="text"
                      value={newAlertDetails.title}
                      onChange={(e) => setNewAlertDetails(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-zinc-400">Descrição Operacional / Causa Raiz</label>
                    <textarea
                      value={newAlertDetails.description}
                      onChange={(e) => setNewAlertDetails(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setAlertModalOpen(false)}
                    className="py-2 px-3 border border-zinc-800 text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-wider rounded-lg cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveKanbanAlert}
                    className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-md cursor-pointer"
                  >
                    Registrar Alerta
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndContext>
  );
}
