import React from "react";
import { 
  X, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  RotateCcw, 
  Check, 
  User, 
  Layout, 
  GripVertical,
  Sliders
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface KPICardConfig {
  id: string;
  label: string;
  visible: boolean;
  type: "operational" | "financial";
  iconName: string;
}

export interface DashboardCustomization {
  role: "gestao" | "operacional" | "financeiro" | "custom";
  cards: KPICardConfig[];
}

interface DashboardCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  config: DashboardCustomization;
  onSave: (newConfig: DashboardCustomization) => void;
}

export const DEFAULT_KPI_CARDS: KPICardConfig[] = [
  { id: "em_andamento", label: "Em Andamento", visible: true, type: "operational", iconName: "TrendingUp" },
  { id: "concluidos", label: "Concluídos", visible: true, type: "operational", iconName: "CheckCircle" },
  { id: "agendados_hoje", label: "Agendados Hoje", visible: true, type: "operational", iconName: "Calendar" },
  { id: "entregas_hoje", label: "Entregas Hoje", visible: true, type: "operational", iconName: "Sparkles" },
  { id: "devolucoes_pendentes", label: "Devoluções Pendentes", visible: true, type: "operational", iconName: "AlertTriangle" },
  { id: "total_processos", label: "Total de Processos", visible: true, type: "operational", iconName: "Layers" },
  { id: "frete_total", label: "Frete Total Projetado", visible: true, type: "financial", iconName: "DollarSign" },
  { id: "pago_motorista", label: "Pago ao Motorista", visible: true, type: "financial", iconName: "CheckCircle" },
  { id: "faturamento_pendente", label: "Faturamento Pendente", visible: true, type: "financial", iconName: "Clock" }
];

export const ROLE_PRESETS: Record<"gestao" | "operacional" | "financeiro", KPICardConfig[]> = {
  gestao: DEFAULT_KPI_CARDS.map(c => ({ ...c, visible: true })),
  operacional: DEFAULT_KPI_CARDS.map(c => {
    if (c.type === "financial") {
      return { ...c, visible: false };
    }
    return { ...c, visible: true };
  }),
  financeiro: DEFAULT_KPI_CARDS.map(c => {
    if (c.id === "total_processos" || c.type === "financial") {
      return { ...c, visible: true };
    }
    return { ...c, visible: false };
  })
};

export default function DashboardCustomizer({ isOpen, onClose, config, onSave }: DashboardCustomizerProps) {
  const [localRole, setLocalRole] = React.useState<"gestao" | "operacional" | "financeiro" | "custom">(config.role);
  const [localCards, setLocalCards] = React.useState<KPICardConfig[]>([...config.cards]);
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);

  // Synchronize local state with prop when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setLocalRole(config.role);
      setLocalCards([...config.cards]);
      setDraggedIndex(null);
      setDragOverIndex(null);
    }
  }, [isOpen, config]);

  const handleRoleChange = (role: "gestao" | "operacional" | "financeiro") => {
    setLocalRole(role);
    setLocalCards(ROLE_PRESETS[role]);
  };

  const handleToggleVisibility = (id: string) => {
    setLocalRole("custom");
    setLocalCards(prev => prev.map(card => {
      if (card.id === id) {
        return { ...card, visible: !card.visible };
      }
      return card;
    }));
  };

  const moveCard = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= localCards.length) return;

    setLocalRole("custom");
    const updated = [...localCards];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setLocalCards(updated);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Compatibility setup for some browsers
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      setLocalRole("custom");
      const updated = [...localCards];
      const [moved] = updated.splice(draggedIndex, 1);
      updated.splice(dragOverIndex, 0, moved);
      setLocalCards(updated);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleReset = () => {
    setLocalRole("gestao");
    setLocalCards(DEFAULT_KPI_CARDS.map(c => ({ ...c, visible: true })));
  };

  const handleSave = () => {
    onSave({
      role: localRole,
      cards: localCards
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-xs"
      id="dashboard-customizer-backdrop"
    >
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        id="dashboard-customizer-container"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-150 dark:border-slate-800 mb-4 shrink-0">
          <div>
            <h3 className="font-bold text-sm text-slate-850 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wide">
              <Sliders className="w-4.5 h-4.5 text-indigo-550" />
              Personalizar Indicadores (KPIs)
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Escolha seu perfil operacional ou reordene as métricas conforme seu fluxo de trabalho diário.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 cursor-pointer rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            title="Fechar"
            id="close-customizer-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Workspace */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-5">
          {/* Preset Roles Section */}
          <div>
            <label className="block text-[11px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-2">
              Selecione seu Perfil Operacional
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleRoleChange("gestao")}
                className={`py-2 px-2 text-xs font-bold rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  localRole === "gestao"
                    ? "bg-indigo-650 text-white border-indigo-650 shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-750 text-slate-550 hover:bg-slate-100 dark:hover:bg-slate-750"
                }`}
                id="role-preset-gestao"
              >
                <Layout className="w-4 h-4" />
                <span>Gestão</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleRoleChange("operacional")}
                className={`py-2 px-2 text-xs font-bold rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  localRole === "operacional"
                    ? "bg-indigo-650 text-white border-indigo-650 shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-750 text-slate-550 hover:bg-slate-100 dark:hover:bg-slate-750"
                }`}
                id="role-preset-operacional"
              >
                <GripVertical className="w-4 h-4" />
                <span>Operações</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange("financeiro")}
                className={`py-2 px-2 text-xs font-bold rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  localRole === "financeiro"
                    ? "bg-indigo-650 text-white border-indigo-650 shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-750 text-slate-550 hover:bg-slate-100 dark:hover:bg-slate-750"
                }`}
                id="role-preset-financeiro"
              >
                <User className="w-4 h-4" />
                <span>Financeiro</span>
              </button>
            </div>
            {localRole === "custom" && (
              <p className="text-[10px] text-amber-500 font-semibold mt-1.5">
                ● Configuração personalizada ativa
              </p>
            )}
          </div>

          {/* Cards Order and Visibility list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider">
                Reordenar e Ativar Indicadores
              </label>
              <button
                type="button"
                onClick={handleReset}
                className="text-[10px] text-slate-550 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold flex items-center gap-1 transition-all cursor-pointer"
                id="reset-layout-btn"
              >
                <RotateCcw className="w-3 h-3" />
                Restaurar Padrão
              </button>
            </div>

            <div className="space-y-1.5 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-150 dark:border-slate-800">
              <AnimatePresence initial={false}>
                {localCards.map((card, idx) => (
                  <motion.div
                    key={card.id}
                    layoutId={`customizer-item-${card.id}`}
                    layout
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-medium bg-white dark:bg-slate-900 transition-all cursor-grab active:cursor-grabbing ${
                      card.visible 
                        ? "border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-250" 
                        : "border-slate-150 dark:border-slate-850/50 text-slate-350 dark:text-slate-600 bg-slate-50/50 dark:bg-slate-900/30"
                    } ${
                      draggedIndex === idx 
                        ? "opacity-30 border-dashed border-indigo-400 bg-slate-50 dark:bg-slate-950 shadow-inner" 
                        : ""
                    } ${
                      dragOverIndex === idx 
                        ? "border-indigo-500 ring-2 ring-indigo-500/25 bg-indigo-50/10 dark:bg-indigo-950/10 -translate-y-0.5 scale-[1.01]" 
                        : ""
                    }`}
                    style={{ zIndex: 10 - idx }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="text-slate-300 dark:text-slate-700 hover:text-slate-450 cursor-grab">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <span className="truncate">{card.label}</span>
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        card.type === "operational" 
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400" 
                          : "bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400"
                      }`}>
                        {card.type === "operational" ? "Ope" : "Fin"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Reorder Buttons */}
                      <button
                        type="button"
                        onClick={() => moveCard(idx, "up")}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 disabled:hover:text-slate-400 cursor-pointer"
                        title="Subir"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveCard(idx, "down")}
                        disabled={idx === localCards.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 disabled:hover:text-slate-400 cursor-pointer"
                        title="Descer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Visibility Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(card.id)}
                        className={`p-1.5 rounded-md cursor-pointer transition-all ml-1 ${
                          card.visible
                            ? "text-indigo-650 bg-indigo-50 dark:bg-indigo-950/20 hover:bg-indigo-100"
                            : "text-slate-400 hover:text-slate-650"
                        }`}
                        title={card.visible ? "Ocultar indicador" : "Mostrar indicador"}
                      >
                        {card.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-150 dark:border-slate-800 mt-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-3 border border-slate-250 dark:border-slate-750 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="py-1.5 px-4 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
            id="apply-dashboard-customization-btn"
          >
            <Check className="w-3.5 h-3.5" />
            Aplicar Layout
          </button>
        </div>
      </div>
    </div>
  );
}
