import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  CheckCircle, 
  Calendar, 
  Clock, 
  DollarSign, 
  AlertTriangle, 
  Layers,
  Sparkles,
  Sliders,
  Settings,
  HelpCircle
} from "lucide-react";
import { Processo } from "../types";
import DashboardCustomizer, { 
  DEFAULT_KPI_CARDS, 
  DashboardCustomization, 
  KPICardConfig 
} from "./DashboardCustomizer";
import { motion, AnimatePresence } from "framer-motion";

// Map icon names to components dynamically
const KPI_ICON_MAP: Record<string, React.ComponentType<any>> = {
  TrendingUp,
  CheckCircle,
  Calendar,
  Sparkles,
  AlertTriangle,
  Layers,
  DollarSign,
  Clock
};

interface KPIIndicatorsProps {
  processos: Processo[];
}

export default function KPIIndicators({ processos }: KPIIndicatorsProps) {
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [customization, setCustomization] = useState<DashboardCustomization>(() => {
    const saved = localStorage.getItem("dashboard_kpi_custom_layout_v1");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return {
      role: "gestao",
      cards: DEFAULT_KPI_CARDS
    };
  });

  // Save to local storage when customization changes
  const handleSaveCustomization = (newConfig: DashboardCustomization) => {
    setCustomization(newConfig);
    localStorage.setItem("dashboard_kpi_custom_layout_v1", JSON.stringify(newConfig));
  };

  // Format current date helper (DD/MM/YYYY)
  const getTodayStr = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const todayStr = getTodayStr();

  // Core M1 Stats calculation
  const totalProcessos = processos.length;
  
  const emAndamento = processos.filter(p => 
    p.status === "Em Trânsito" || p.status === "Coletado"
  ).length;

  const concluidos = processos.filter(p => p.status === "Entregue" || p.status === "Devolvido").length;
  
  const agendadosHoje = processos.filter(p => p.dataRetirada === todayStr).length;
  const entregasHoje = processos.filter(p => p.dataEntrega === todayStr && p.status === "Entregue").length;

  const devolucoesPendentes = processos.filter(p => 
    p.status !== "Devolvido" && p.entregaVazio?.toLowerCase().includes("pendente")
  ).length;

  // Financial Stats
  const totalFrete = processos.reduce((sum, p) => sum + (parseFloat(p.valorFrete) || 0), 0);
  const totalFretePago = processos
    .filter(p => p.motoristaPago === "Sim")
    .reduce((sum, p) => sum + (parseFloat(p.valorPagoMotorista) || 0), 0);
  const totalFretePendente = totalFrete - totalFretePago;

  // Render resolver for each KPI details
  const getCardDetails = (id: string) => {
    switch (id) {
      case "em_andamento":
        return {
          value: emAndamento,
          color: "border-blue-500 text-blue-500",
          bg: "bg-blue-50 dark:bg-blue-950/20",
        };
      case "concluidos":
        return {
          value: concluidos,
          color: "border-emerald-500 text-emerald-500",
          bg: "bg-emerald-50 dark:bg-emerald-950/20",
        };
      case "agendados_hoje":
        return {
          value: agendadosHoje,
          color: "border-amber-500 text-amber-500",
          bg: "bg-amber-50 dark:bg-amber-950/20",
        };
      case "entregas_hoje":
        return {
          value: entregasHoje,
          color: "border-purple-500 text-purple-500",
          bg: "bg-purple-50 dark:bg-purple-950/20",
        };
      case "devolucoes_pendentes":
        return {
          value: devolucoesPendentes,
          color: "border-rose-500 text-rose-500",
          bg: "bg-rose-50 dark:bg-rose-950/20",
        };
      case "total_processos":
        return {
          value: totalProcessos,
          color: "border-slate-800 dark:border-slate-200 text-slate-700 dark:text-slate-300",
          bg: "bg-slate-100 dark:bg-slate-800/50",
        };
      case "frete_total":
        return {
          value: `R$ ${totalFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          color: "border-emerald-500 text-emerald-500",
          bg: "bg-emerald-50 dark:bg-emerald-950/20",
        };
      case "pago_motorista":
        return {
          value: `R$ ${totalFretePago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          color: "border-teal-500 text-teal-500",
          bg: "bg-teal-50 dark:bg-teal-950/20",
        };
      case "faturamento_pendente":
        return {
          value: `R$ ${totalFretePendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          color: "border-violet-500 text-violet-500",
          bg: "bg-violet-50 dark:bg-violet-950/20",
        };
      default:
        return {
          value: 0,
          color: "border-slate-400 text-slate-400",
          bg: "bg-slate-50 dark:bg-slate-900",
        };
    }
  };

  const visibleCards = customization.cards.filter(c => c.visible);

  return (
    <div className="space-y-3 mb-4" id="kpi-indicators-section">
      {/* Settings Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Painel Operacional ({customization.role === "gestao" ? "Gestão" : customization.role === "operacional" ? "Operações" : customization.role === "financeiro" ? "Financeiro" : "Personalizado"})
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsCustomizerOpen(true)}
          className="flex items-center gap-1.5 py-1 px-2.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/35 border border-indigo-100 dark:border-indigo-900/40 rounded-lg transition-all cursor-pointer"
          id="open-customizer-trigger-btn"
        >
          <Sliders className="w-3.5 h-3.5" />
          Personalizar KPIs
        </button>
      </div>

      {/* Dynamic Grid Layout */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <AnimatePresence mode="popLayout">
          {visibleCards.map((card) => {
            const details = getCardDetails(card.id);
            const Icon = KPI_ICON_MAP[card.iconName] || HelpCircle;
            
            return (
              <motion.div
                key={card.id}
                layoutId={`kpi-card-anim-${card.id}`}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`bg-white dark:bg-slate-900 border-l-4 ${details.color.split(" ")[0]} border border-slate-150 dark:border-slate-800/80 rounded-r-xl p-4 shadow-xs flex items-center justify-between transition-shadow hover:shadow-md min-h-[85px]`}
                id={`dynamic-kpi-card-${card.id}`}
              >
                <div className="min-w-0 flex-1 pr-1">
                  <div className="text-sm font-bold tracking-tight text-slate-850 dark:text-slate-100 truncate md:text-base lg:text-lg">
                    {details.value}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider line-clamp-2 leading-tight">
                    {card.label}
                  </div>
                </div>
                <div className={`p-2 rounded-lg ${details.bg} ${details.color.split(" ").slice(1).join(" ")} shrink-0 ml-1.5`}>
                  <Icon className="w-4 h-4" />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {visibleCards.length === 0 && (
        <div className="p-8 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 italic text-xs">
          Nenhum indicador visível. Clique em "Personalizar KPIs" no canto superior direito para reordenar ou ativar métricas.
        </div>
      )}

      {/* The customization Settings Modal popup */}
      <DashboardCustomizer
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        config={customization}
        onSave={handleSaveCustomization}
      />
    </div>
  );
}
