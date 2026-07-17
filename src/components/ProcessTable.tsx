import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  ArrowUpDown, 
  Search, 
  Plus, 
  Download, 
  Printer, 
  Trash2, 
  Edit3, 
  ChevronDown, 
  ChevronUp,
  Check, 
  Info,
  Calendar,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  X,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Sliders,
  Link2,
  MapPin,
  Sparkles,
  Palette,
  Clock,
  Maximize2,
  Minimize2,
  Upload
} from "lucide-react";
import * as XLSX from "xlsx";
import { z } from "zod";
import { Processo, Cliente, PrestadorServico, Transportadora, Armador, Terminal, LogEntry } from "../types";
import { STATUS_COLORS } from "../App";
import DocumentStatusIcons from "./DocumentStatusIcons";

export interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  isCustom?: boolean;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: "registro", label: "Reg.", visible: true },
  { key: "documentos", label: "Documentos", visible: true },
  { key: "cliente", label: "Cliente", visible: true },
  { key: "processo", label: "Processo", visible: true },
  { key: "container", label: "Contêiner", visible: true },
  { key: "tipoContainer", label: "Tipo", visible: true },
  { key: "armador", label: "Armador", visible: true },
  { key: "localDevolucao", label: "Local Devolução", visible: true },
  { key: "siteArmador", label: "Site Armador", visible: true },
  { key: "motorista", label: "Motorista", visible: true },
  { key: "veiculo", label: "Veículo", visible: true },
  { key: "transportadora", label: "Transportadora", visible: true },
  { key: "valorFrete", label: "Frete", visible: true },
  { key: "valorCarregamento", label: "Vlr. Carga", visible: true },
  { key: "motoristaPago", label: "Motorista Pago?", visible: true },
  { key: "valorPagoMotorista", label: "Vlr. Motorista", visible: true },
  { key: "dataRetirada", label: "Retirada", visible: true },
  { key: "dataEntrega", label: "Entrega", visible: true },
  { key: "dataDevolucao", label: "Devolução", visible: true },
  { key: "entregaVazio", label: "Entrega Vazio", visible: true },
  { key: "terminal", label: "Terminal", visible: true },
  { key: "status", label: "Status", visible: true },
  { key: "observacoes", label: "Observações", visible: true }
];

export const parseCustomFields = (observacoes: string) => {
  const sep = "---METADATA---";
  if (!observacoes) return { text: "", customData: {} as Record<string, string> };
  if (observacoes.includes(sep)) {
    const parts = observacoes.split(sep);
    const text = parts[0].trim();
    try {
      const customData = JSON.parse(parts[1]) as Record<string, string>;
      return { text, customData };
    } catch {
      return { text, customData: {} as Record<string, string> };
    }
  }
  return { text: observacoes, customData: {} as Record<string, string> };
};

export const serializeCustomFields = (text: string, customData: Record<string, string>) => {
  if (Object.keys(customData).length === 0) return text;
  return `${text.trim()}\n---METADATA---${JSON.stringify(customData)}`;
};

// Esquema de validação dos dados de entrada do Processo usando Zod
// Garante integridade e previne ataques de "mass assignment"
export const processInputSchema = z.object({
  cliente: z.string().min(1, "O cliente é obrigatório."),
  processo: z.string().min(1, "O número do processo / referência é obrigatório."),
  container: z.string().min(1, "O número do contêiner é obrigatório.")
    .regex(/^[A-Z]{4}[0-9]{7}$|^[A-Z0-9-]{4,15}$/, "Contêiner inválido. Padrão: 4 letras seguidas de 7 dígitos (ex: MSCU1234567) ou código alfanumérico entre 4 e 15 caracteres."),
  tipoContainer: z.string().default("40HQ"),
  armador: z.string().min(1, "O armador é obrigatório."),
  motorista: z.string().optional().default(""),
  veiculo: z.string().optional().default(""),
  transportadora: z.string().optional().default(""),
  valorFrete: z.string().optional().default("0.00")
    .refine(val => !val || !isNaN(Number(val.replace(",", "."))), "O valor do frete deve ser numérico."),
  dataRetirada: z.string().optional().default("")
    .refine(val => !val || /^\d{2}\/\d{2}\/\d{4}$/.test(val), "Data de retirada inválida (Formato esperado: DD/MM/AAAA)."),
  horaRetirada: z.string().optional().default("")
    .refine(val => !val || /^\d{2}:\d{2}$/.test(val), "Hora de retirada inválida (Formato esperado: HH:MM)."),
  dataEntrega: z.string().optional().default(""),
  horaEntrega: z.string().optional().default(""),
  dataDevolucao: z.string().optional().default(""),
  horaDevolucao: z.string().optional().default(""),
  entregaVazio: z.string().optional().default("Pendente"),
  terminal: z.string().optional().default(""),
  status: z.string().optional().default("Agendado"),
  observacoes: z.string().optional().default(""),
  valorCarregamento: z.string().optional().default("0.00")
    .refine(val => !val || !isNaN(Number(val.replace(",", "."))), "O valor do carregamento deve ser numérico."),
  motoristaPago: z.string().optional().default("Não"),
  valorPagoMotorista: z.string().optional().default("0.00")
    .refine(val => !val || !isNaN(Number(val.replace(",", "."))), "O valor pago ao motorista deve ser numérico."),
}).strict();

interface ProcessTableProps {
  processos: Processo[];
  onUpdateProcess: (registro: string, updatedFields: Partial<Processo>) => void;
  onAddProcess: (newProcess: Processo) => void;
  onDeleteProcess: (registro: string) => void;
  // Registries for autocomplete/dropdowns
  clientes: Cliente[];
  prestadores: PrestadorServico[];
  transportadoras: Transportadora[];
  armadores: Armador[];
  terminais: Terminal[];
  externalSearchQuery?: string;
  onOpenUploadModal?: (registroId: string) => void;
  onSelectProcess?: (p: Processo) => void;
  selectedProcessoId?: string | null;
  darkMode?: boolean;
  logs?: LogEntry[];
  isTableFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export default function ProcessTable({
  processos,
  onUpdateProcess,
  onAddProcess,
  onDeleteProcess,
  clientes,
  prestadores,
  transportadoras,
  armadores,
  terminais,
  externalSearchQuery = "",
  onOpenUploadModal,
  onSelectProcess,
  selectedProcessoId,
  darkMode = false,
  logs = [],
  isTableFullscreen = false,
  onToggleFullscreen
}: ProcessTableProps) {
  const [actionAfterSave, setActionAfterSave] = useState<string>("none");
  const [searchQuery, setSearchQuery] = useState("");
  const [rowColorMode, setRowColorMode] = useState<"full" | "border" | "status-cell" | "clean">(() => {
    const saved = localStorage.getItem("process_table_row_color_mode");
    return (saved as any) || "full";
  });

  useEffect(() => {
    localStorage.setItem("process_table_row_color_mode", rowColorMode);
  }, [rowColorMode]);

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<string>("registro");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Dynamic Column Configurations State
  const [columnsConfig, setColumnsConfig] = useState<ColumnConfig[]>(() => {
    const saved = localStorage.getItem("process_table_columns_v4");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return DEFAULT_COLUMNS;
  });

  useEffect(() => {
    localStorage.setItem("process_table_columns_v4", JSON.stringify(columnsConfig));
  }, [columnsConfig]);

  // Dynamic Column Manager State
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [newColumnLabel, setNewColumnLabel] = useState("");

  // Full Row Editing State
  const [editingProcess, setEditingProcess] = useState<Processo | null>(null);

  // Status History Modal State
  const [historyProcesso, setHistoryProcesso] = useState<Processo | null>(null);

  interface StatusHistoryEntry {
    status: string;
    timestamp: string;
    userEmail: string;
    isInitial?: boolean;
  }

  const getStatusHistory = (p: Processo): StatusHistoryEntry[] => {
    const history: StatusHistoryEntry[] = [];
    
    // Sort logs chronologically (oldest first)
    const processLogs = [...logs]
      .filter(log => log.action && log.action.includes(p.registro))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    processLogs.forEach(log => {
      try {
        const changes = JSON.parse(log.changes || "{}");
        
        if (log.action.includes("Adicionou novo processo operacional")) {
          const status = changes.status || p.status;
          history.push({
            status,
            timestamp: log.timestamp,
            userEmail: log.userEmail || "operador@gestaologistica.com",
            isInitial: true
          });
        } else if (log.action.includes("Atualizou processo")) {
          if (changes.status) {
            const oldStatus = changes.status.old;
            const newStatus = changes.status.new;
            
            if (history.length === 0 && oldStatus) {
              history.push({
                status: oldStatus,
                timestamp: new Date(new Date(log.timestamp).getTime() - 60000).toISOString(),
                userEmail: "sistema@gestaologistica.com",
                isInitial: true
              });
            }
            
            if (newStatus) {
              history.push({
                status: newStatus,
                timestamp: log.timestamp,
                userEmail: log.userEmail || "operador@gestaologistica.com"
              });
            }
          }
        }
      } catch (e) {
        console.error("Erro ao processar log:", e);
      }
    });

    if (history.length === 0) {
      history.push({
        status: p.status,
        timestamp: p.dataCriado || new Date().toISOString(),
        userEmail: "sistema@gestaologistica.com",
        isInitial: true
      });
    }

    return history;
  };

  // Date range filters
  const [dateFilterType, setDateFilterType] = useState<"dataRetirada" | "dataCriado" | "none">("none");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Helper to parse Brazilian date DD/MM/YYYY into JS Date for comparison
  const parseBrazilianDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    if (dateStr.includes("-")) {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
    }
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return null;
  };

  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ registro: string; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState("");
  
  // Alerta visual flutuante para a planilha (duplicidades)
  const [tableAlert, setTableAlert] = useState<{ type: "warning" | "info"; message: string } | null>(null);

  // Create process form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProcessForm, setNewProcessForm] = useState<Partial<Processo>>({
    cliente: "",
    processo: "",
    container: "",
    tipoContainer: "40HQ",
    armador: "",
    motorista: "",
    veiculo: "",
    transportadora: "",
    valorFrete: "",
    dataRetirada: "",
    horaRetirada: "",
    dataEntrega: "",
    horaEntrega: "",
    dataDevolucao: "",
    horaDevolucao: "",
    entregaVazio: "Pendente",
    terminal: "",
    status: "Agendado",
    observacoes: "",
    valorCarregamento: "",
    motoristaPago: "Não",
    valorPagoMotorista: ""
  });

  // Custom Fields Form state (for Create/Edit Modal)
  const [customFieldsForm, setCustomFieldsForm] = useState<Record<string, string>>({});

  // Camada de validação dos inputs com Zod (erros mapeados por campo)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Column Manager Handlers
  const handleAddColumn = () => {
    if (!newColumnLabel.trim()) return;
    const newKey = `col_custom_${Date.now()}`;
    const newCol: ColumnConfig = {
      key: newKey,
      label: newColumnLabel.trim(),
      visible: true,
      isCustom: true
    };
    setColumnsConfig([...columnsConfig, newCol]);
    setNewColumnLabel("");
  };

  const handleToggleColumn = (key: string) => {
    if (key === "registro" || key === "cliente") return;
    setColumnsConfig(columnsConfig.map(col => 
      col.key === key ? { ...col, visible: !col.visible } : col
    ));
  };

  const handleRenameColumn = (key: string, newLabel: string) => {
    setColumnsConfig(columnsConfig.map(col => 
      col.key === key ? { ...col, label: newLabel } : col
    ));
  };

  const handleRemoveColumn = (key: string) => {
    setColumnsConfig(columnsConfig.filter(col => col.key !== key));
  };

  const handleMoveColumn = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= columnsConfig.length) return;
    
    const updated = [...columnsConfig];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    
    setColumnsConfig(updated);
  };

  // Sorting helper
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter and search
  const filteredProcessos = processos
    .filter(p => {
      // 1. Status Filter
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;

      // 2. Date Range Filter
      if (dateFilterType !== "none") {
        const pDateStr = p[dateFilterType as any as keyof Processo];
        const pDate = parseBrazilianDate(pDateStr as string);
        
        if (pDate) {
          if (startDate) {
            const start = new Date(startDate + "T00:00:00");
            if (pDate < start) return false;
          }
          if (endDate) {
            const end = new Date(endDate + "T23:59:59");
            if (pDate > end) return false;
          }
        } else {
          // If a date filter is active and the process has no valid date, exclude it
          if (startDate || endDate) return false;
        }
      }
      
      // 3. Search Query Filter
      const query = (externalSearchQuery || searchQuery).toLowerCase();
      if (!query) return true;

      const { text: obsText, customData } = parseCustomFields(p.observacoes || "");
      const customMatch = Object.values(customData).some(v => v.toLowerCase().includes(query));

      // Retrieve armador for derived matching
      const matchedArmador = armadores.find(a => a.nome === p.armador);
      const localDevolucaoText = matchedArmador?.observacoes || "";
      const siteArmadorLink = matchedArmador?.portal || matchedArmador?.linkDevolucao || "";

      return (
        p.registro.toLowerCase().includes(query) ||
        p.cliente.toLowerCase().includes(query) ||
        p.processo.toLowerCase().includes(query) ||
        p.container.toLowerCase().includes(query) ||
        p.armador.toLowerCase().includes(query) ||
        p.motorista.toLowerCase().includes(query) ||
        p.veiculo.toLowerCase().includes(query) ||
        p.transportadora.toLowerCase().includes(query) ||
        p.terminal.toLowerCase().includes(query) ||
        p.status.toLowerCase().includes(query) ||
        obsText.toLowerCase().includes(query) ||
        localDevolucaoText.toLowerCase().includes(query) ||
        siteArmadorLink.toLowerCase().includes(query) ||
        customMatch
      );
    })
    .sort((a, b) => {
      let valA: any = "";
      let valB: any = "";

      if (sortField === "localDevolucao") {
        const armA = armadores.find(ar => ar.nome === a.armador);
        const armB = armadores.find(ar => ar.nome === b.armador);
        valA = armA?.observacoes || "";
        valB = armB?.observacoes || "";
      } else if (sortField === "siteArmador") {
        const armA = armadores.find(ar => ar.nome === a.armador);
        const armB = armadores.find(ar => ar.nome === b.armador);
        valA = armA?.portal || armA?.linkDevolucao || "";
        valB = armB?.portal || armB?.linkDevolucao || "";
      } else if (sortField.startsWith("col_custom_")) {
        const parsedA = parseCustomFields(a.observacoes || "");
        const parsedB = parseCustomFields(b.observacoes || "");
        valA = parsedA.customData[sortField] || "";
        valB = parsedB.customData[sortField] || "";
      } else {
        valA = a[sortField as keyof Processo] || "";
        valB = b[sortField as keyof Processo] || "";
      }

      if (sortField === "valorFrete" || sortField === "valorCarregamento" || sortField === "valorPagoMotorista") {
        const numA = parseFloat(String(valA) || "0") || 0;
        const numB = parseFloat(String(valB) || "0") || 0;
        return sortDirection === "asc" ? numA - numB : numB - numA;
      }

      return sortDirection === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

  // Color mappings for status rows (without repeating colors)
  const getStatusRowStyle = (status: string) => {
    if (darkMode) {
      const DARK_STATUS_COLORS: Record<string, string> = {
        "Aguardando Processamento": "#2a2205",
        "Agendado": "#0a192f",
        "Carregando": "#2e1908",
        "Em Trânsito": "#1b0b2e",
        "Entregue": "#062110",
        "Container Devolvido": "#061a2b",
        "Processo Finalizado": "#0f2207",
        "Faturado": "#1b0f2e",
        "Pago": "#031e13",
        "Cancelado": "#2e0505",
        "Pendência Documental": "#2a1505",
        "Aguardando Cliente": "#2a0512",
        "Aguardando Motorista": "#03191b",
        "Aguardando Liberação": "#2a2105",
        "Divergência": "#2e0f05",
        "Coletado": "#0f172a",
        "Devolvido": "#18181b",
        "Pendente": "#2d0505"
      };

      const bg = DARK_STATUS_COLORS[status];
      if (!bg) return null;

      let text = "text-slate-100 dark:text-slate-100";
      let textHex = "#f8fafc";
      switch (status) {
        case "Aguardando Processamento":
          text = "text-[#fff176]";
          textHex = "#fff176";
          break;
        case "Agendado":
          text = "text-[#64b5f6]";
          textHex = "#64b5f6";
          break;
        case "Carregando":
          text = "text-[#ffb74d]";
          textHex = "#ffb74d";
          break;
        case "Em Trânsito":
          text = "text-[#b39ddb]";
          textHex = "#b39ddb";
          break;
        case "Entregue":
          text = "text-[#81c784]";
          textHex = "#81c784";
          break;
        case "Container Devolvido":
          text = "text-[#4dd0e1]";
          textHex = "#4dd0e1";
          break;
        case "Processo Finalizado":
          text = "text-[#aed581]";
          textHex = "#aed581";
          break;
        case "Faturado":
          text = "text-[#d1c4e9]";
          textHex = "#d1c4e9";
          break;
        case "Pago":
          text = "text-[#4db6ac]";
          textHex = "#4db6ac";
          break;
        case "Cancelado":
          text = "text-[#e57373]";
          textHex = "#e57373";
          break;
        case "Pendência Documental":
          text = "text-[#ffb74d]";
          textHex = "#ffb74d";
          break;
        case "Aguardando Cliente":
          text = "text-[#f06292]";
          textHex = "#f06292";
          break;
        case "Aguardando Motorista":
          text = "text-[#4db6ac]";
          textHex = "#4db6ac";
          break;
        case "Aguardando Liberação":
          text = "text-[#fff176]";
          textHex = "#fff176";
          break;
        case "Divergência":
          text = "text-[#ff8a65]";
          textHex = "#ff8a65";
          break;
        case "Coletado":
          text = "text-slate-200";
          textHex = "#e2e8f0";
          break;
        case "Devolvido":
          text = "text-zinc-200";
          textHex = "#e4e4e7";
          break;
        case "Pendente":
          text = "text-red-300";
          textHex = "#fca5a5";
          break;
      }
      return { bg, text, textHex };
    } else {
      const bg = STATUS_COLORS[status];
      if (!bg) return null;

      let text = "text-slate-900";
      let textHex = "#0f172a";
      switch (status) {
        case "Aguardando Processamento":
          text = "text-[#4a3a05]";
          textHex = "#4a3a05";
          break;
        case "Agendado":
          text = "text-[#0d235c]";
          textHex = "#0d235c";
          break;
        case "Carregando":
          text = "text-[#592605]";
          textHex = "#592605";
          break;
        case "Em Trânsito":
          text = "text-[#32095c]";
          textHex = "#32095c";
          break;
        case "Entregue":
          text = "text-[#054018]";
          textHex = "#054018";
          break;
        case "Container Devolvido":
          text = "text-[#052f5c]";
          textHex = "#052f5c";
          break;
        case "Processo Finalizado":
          text = "text-[#174004]";
          textHex = "#174004";
          break;
        case "Faturado":
          text = "text-[#35125e]";
          textHex = "#35125e";
          break;
        case "Pago":
          text = "text-[#044026]";
          textHex = "#044026";
          break;
        case "Cancelado":
          text = "text-[#5e0606]";
          textHex = "#5e0606";
          break;
        case "Pendência Documental":
          text = "text-[#542d05]";
          textHex = "#542d05";
          break;
        case "Aguardando Cliente":
          text = "text-[#54051a]";
          textHex = "#54051a";
          break;
        case "Aguardando Motorista":
          text = "text-[#053740]";
          textHex = "#053740";
          break;
        case "Aguardando Liberação":
          text = "text-[#4f3e04]";
          textHex = "#4f3e04";
          break;
        case "Divergência":
          text = "text-[#5c1804]";
          textHex = "#5c1804";
          break;
        case "Coletado":
          text = "text-slate-800";
          textHex = "#1e293b";
          break;
        case "Devolvido":
          text = "text-zinc-850";
          textHex = "#27272a";
          break;
        case "Pendente":
          text = "text-red-950";
          textHex = "#450a0a";
          break;
      }
      return { bg, text, textHex };
    }
  };

  // Color mappings for status badges
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aguardando Processamento":
        return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-900/50";
      case "Agendado":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50";
      case "Carregando":
        return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900/50";
      case "Em Trânsito":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/50";
      case "Entregue":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50";
      case "Container Devolvido":
        return "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-900/50";
      case "Processo Finalizado":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900/50";
      case "Faturado":
        return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/50";
      case "Pago":
        return "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-900/50";
      case "Cancelado":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50";
      case "Pendência Documental":
        return "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50";
      case "Aguardando Cliente":
        return "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-400 dark:border-pink-900/50";
      case "Aguardando Motorista":
        return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900/50";
      case "Aguardando Liberação":
        return "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-900/50";
      case "Divergência":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50";
      
      // Fallbacks
      case "Coletado":
        return "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-900/50";
      case "Devolvido":
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
      case "Pendente":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400";
    }
  };

  // Trigger inline save com validação de duplicidade
  const handleSaveCell = (registro: string, field: keyof Processo) => {
    const trimmedValue = editingValue.trim();

    if (field === "container" && trimmedValue) {
      const formattedContainer = trimmedValue.toUpperCase();
      const duplicate = processos.find(
        p => p.registro !== registro && p.container.trim().toUpperCase() === formattedContainer
      );
      if (duplicate) {
        setTableAlert({
          type: "warning",
          message: `Alerta de Duplicidade: O contêiner "${formattedContainer}" salvo no registro "${registro}" já está cadastrado no processo "${duplicate.registro}" (Cliente: ${duplicate.cliente}).`
        });
      }
    } else if (field === "processo" && trimmedValue) {
      const formattedProcesso = trimmedValue.toUpperCase();
      const duplicate = processos.find(
        p => p.registro !== registro && p.processo.trim().toUpperCase() === formattedProcesso
      );
      if (duplicate) {
        setTableAlert({
          type: "warning",
          message: `Alerta de Duplicidade: O Nº do Processo "${trimmedValue}" salvo no registro "${registro}" já está cadastrado no processo "${duplicate.registro}" (Cliente: ${duplicate.cliente}).`
        });
      }
    }

    onUpdateProcess(registro, { [field]: editingValue });
    setEditingCell(null);
  };

  const handleStartCellEdit = (p: Processo, field: keyof Processo) => {
    setEditingCell({ registro: p.registro, field });
    setEditingValue(p[field] as string);
  };

  // Excel and CSV export using xlsx package
  const exportToExcel = (format: "xlsx" | "csv" = "xlsx") => {
    const dataRows = filteredProcessos.map(p => ({
      "Registro": p.registro,
      "Cliente": p.cliente,
      "Nº Processo": p.processo,
      "Container": p.container,
      "Tipo Container": p.tipoContainer,
      "Armador": p.armador,
      "Motorista": p.motorista,
      "Veículo": p.veiculo,
      "Transportadora": p.transportadora,
      "Valor Frete (R$)": p.valorFrete,
      "Valor Carregamento (R$)": p.valorCarregamento || "0.00",
      "Motorista Pago?": p.motoristaPago || "Não",
      "Valor Pago Motorista (R$)": p.valorPagoMotorista || "0.00",
      "Retirada": `${p.dataRetirada} ${p.horaRetirada}`.trim(),
      "Entrega": `${p.dataEntrega} ${p.horaEntrega}`.trim(),
      "Devolução": `${p.dataDevolucao} ${p.horaDevolucao}`.trim(),
      "Entrega Vazio": p.entregaVazio,
      "Terminal": p.terminal,
      "Status": p.status,
      "Observações": p.observacoes
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Processos");
    
    if (format === "xlsx") {
      XLSX.writeFile(workbook, `Controle_Operacional_Logistica_${new Date().toISOString().split('T')[0]}.xlsx`);
    } else {
      XLSX.writeFile(workbook, `Controle_Operacional_Logistica_${new Date().toISOString().split('T')[0]}.csv`, { bookType: "csv" });
    }
  };

  // PDF / Print trigger
  const triggerPrint = () => {
    window.print();
  };

  const handleCreateProcessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    // 1. Validação de inputs usando Zod (Segurança / Prevenção de Mass Assignment)
    const validationResult = processInputSchema.safeParse(newProcessForm);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setValidationErrors(fieldErrors);
      
      // Feedback imediato e visual para o operador
      setTableAlert({
        type: "warning",
        message: "Erro de Validação: Verifique os campos sinalizados em vermelho."
      });
      return;
    }

    // 2. Extração segura dos dados validados (Strict Whitelist)
    const validatedData = validationResult.data;

    // Determina se é edição ou criação de registro novo
    const isEdit = !!editingProcess;
    const regId = isEdit ? editingProcess.registro : (() => {
      let regIndex = processos.length + 1;
      let nextRegId = `REG-${String(regIndex).padStart(3, "0")}`;
      while (processos.some(p => p.registro === nextRegId)) {
        regIndex++;
        nextRegId = `REG-${String(regIndex).padStart(3, "0")}`;
      }
      return nextRegId;
    })();

    // Se o contêiner ou número do processo cadastrado for duplicado, exibe um alerta flutuante na tabela
    const typedContainer = validatedData.container?.trim().toUpperCase();
    const typedProcesso = validatedData.processo?.trim().toUpperCase();
    let duplicateMessage = "";

    if (typedContainer) {
      const duplicateC = processos.find(p => p.container.trim().toUpperCase() === typedContainer && p.registro !== regId);
      if (duplicateC) {
        duplicateMessage += `O contêiner "${typedContainer}" já existe no processo "${duplicateC.registro}" (Cliente: ${duplicateC.cliente}). `;
      }
    }
    if (typedProcesso) {
      const duplicateP = processos.find(p => p.processo.trim().toUpperCase() === typedProcesso && p.registro !== regId);
      if (duplicateP) {
        duplicateMessage += `O Nº do Processo "${typedProcesso}" já está associado ao registro "${duplicateP.registro}" (Cliente: ${duplicateP.cliente}). `;
      }
    }

    if (duplicateMessage) {
      setTableAlert({
        type: "warning",
        message: `Aviso de Duplicidade: Processo "${regId}" salvo! Contudo, dados duplicados foram detectados: ${duplicateMessage}`
      });
    } else {
      setTableAlert({
        type: "info",
        message: isEdit 
          ? `Sucesso: O processo "${regId}" foi atualizado com sucesso.` 
          : `Sucesso: O processo "${regId}" foi cadastrado com sucesso.`
      });
    }

    // Criação explícita do objeto garantindo conformidade com a tipagem e segurança
    const fullProcess: Processo = {
      registro: regId,
      cliente: validatedData.cliente,
      processo: validatedData.processo,
      container: validatedData.container,
      tipoContainer: validatedData.tipoContainer,
      armador: validatedData.armador,
      motorista: validatedData.motorista,
      veiculo: validatedData.veiculo,
      transportadora: validatedData.transportadora,
      valorFrete: validatedData.valorFrete,
      dataRetirada: validatedData.dataRetirada,
      horaRetirada: validatedData.horaRetirada,
      dataEntrega: validatedData.dataEntrega || "",
      horaEntrega: validatedData.horaEntrega || "",
      dataDevolucao: validatedData.dataDevolucao || "",
      horaDevolucao: validatedData.horaDevolucao || "",
      entregaVazio: validatedData.entregaVazio,
      terminal: validatedData.terminal,
      status: validatedData.status as any,
      observacoes: validatedData.observacoes,
      valorCarregamento: validatedData.valorCarregamento,
      motoristaPago: validatedData.motoristaPago,
      valorPagoMotorista: validatedData.valorPagoMotorista,
      dataCriado: isEdit ? editingProcess.dataCriado : new Date().toLocaleDateString("pt-BR")
    };

    if (isEdit) {
      onUpdateProcess(regId, fullProcess);
      setEditingProcess(null);
    } else {
      onAddProcess(fullProcess);
    }

    setShowCreateModal(false);
    setNewProcessForm({
      cliente: "",
      processo: "",
      container: "",
      tipoContainer: "40HQ",
      armador: "",
      motorista: "",
      veiculo: "",
      transportadora: "",
      valorFrete: "",
      dataRetirada: "",
      horaRetirada: "",
      dataEntrega: "",
      horaEntrega: "",
      dataDevolucao: "",
      horaDevolucao: "",
      entregaVazio: "Pendente",
      terminal: "",
      status: "Agendado",
      observacoes: "",
      valorCarregamento: "",
      motoristaPago: "Não",
      valorPagoMotorista: ""
    });
    setCustomFieldsForm({});

    if (actionAfterSave === "attach" && onOpenUploadModal) {
      setTimeout(() => {
        onOpenUploadModal(regId);
      }, 150);
    }
    setActionAfterSave("none");
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col print:border-none print:shadow-none">
      {/* Header and Controls */}
      <div className="p-5 border-b border-slate-150 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4 print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar processo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 w-60 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-lg px-2.5 py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-[11px] font-bold focus:outline-none text-slate-700 dark:text-slate-200 cursor-pointer pr-1"
              >
                <option value="ALL">Todos os Status</option>
                {[
                  "Aguardando Processamento",
                  "Agendado",
                  "Carregando",
                  "Em Trânsito",
                  "Entregue",
                  "Container Devolvido",
                  "Processo Finalizado",
                  "Faturado",
                  "Pago",
                  "Cancelado",
                  "Pendência Documental",
                  "Aguardando Cliente",
                  "Aguardando Motorista",
                  "Aguardando Liberação",
                  "Divergência",
                  "Coletado",
                  "Devolvido",
                  "Pendente"
                ].map(st => (
                  <option key={st} value={st} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">{st}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-lg px-2.5 py-1" title="Escolha como as cores dos status são exibidas na tabela">
              <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> Cores:
              </span>
              <select
                value={rowColorMode}
                onChange={(e) => setRowColorMode(e.target.value as any)}
                className="bg-transparent text-[11px] font-bold focus:outline-none text-slate-700 dark:text-slate-200 cursor-pointer pr-1"
              >
                <option value="full" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Linha Inteira</option>
                <option value="border" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Borda de Status</option>
                <option value="status-cell" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Apenas Célula</option>
                <option value="clean" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Sem Cores (Modo Limpo)</option>
              </select>
            </div>

            <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 hidden md:block"></div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Filtrar por:</span>
              <select
                value={dateFilterType}
                onChange={(e) => setDateFilterType(e.target.value as any)}
                className="py-1 px-2 text-[10px] bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-600 dark:text-slate-300 font-bold"
              >
                <option value="none">Sem Filtro de Data</option>
                <option value="dataRetirada">Data de Retirada</option>
                <option value="dataCriado">Data de Criação</option>
              </select>

              {dateFilterType !== "none" && (
                <div className="flex items-center gap-1.5 animate-fade-in">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="py-0.5 px-2 text-[10px] bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                    title="Data Inicial"
                  />
                  <span className="text-slate-400 text-[10px] font-bold">até</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="py-0.5 px-2 text-[10px] bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                    title="Data Final"
                  />
                  {(startDate || endDate) && (
                    <button
                      onClick={() => {
                        setStartDate("");
                        setEndDate("");
                      }}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                      title="Limpar Intervalo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingProcess(null);
              setNewProcessForm({
                cliente: "",
                processo: "",
                container: "",
                tipoContainer: "40HQ",
                armador: "",
                motorista: "",
                veiculo: "",
                transportadora: "",
                valorFrete: "",
                dataRetirada: "",
                horaRetirada: "",
                dataEntrega: "",
                horaEntrega: "",
                dataDevolucao: "",
                horaDevolucao: "",
                entregaVazio: "Pendente",
                terminal: "",
                status: "Agendado",
                observacoes: "",
                valorCarregamento: "",
                motoristaPago: "Não",
                valorPagoMotorista: ""
              });
              setCustomFieldsForm({});
              setValidationErrors({});
              setShowCreateModal(true);
            }}
            className="flex items-center gap-1 py-1.5 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo Registro
          </button>
          <button
            onClick={() => setShowColumnManager(true)}
            className="flex items-center gap-1.5 py-1.5 px-3 border border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
            title="Adicionar, remover, editar ou ocultar colunas"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-500" />
            Colunas
          </button>
          <div className="relative group">
            <button
              className="flex items-center gap-1 py-1.5 px-3 border border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
              title="Exportar Relatório"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Exportar</span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>
            <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg hidden group-hover:block hover:block z-50">
              <button
                type="button"
                onClick={() => exportToExcel("xlsx")}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-t-lg flex items-center gap-1.5 cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => exportToExcel("csv")}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-b-lg flex items-center gap-1.5 cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                CSV (.csv)
              </button>
            </div>
          </div>
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="flex items-center gap-1.5 py-1.5 px-3 border border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
              title={isTableFullscreen ? "Sair da Tela Cheia (Foco)" : "Modo Tela Cheia (Foco)"}
            >
              {isTableFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-red-500" />
                  <span>Sair Foco</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Foco</span>
                </>
              )}
            </button>
          )}
          <button
            onClick={triggerPrint}
            className="flex items-center gap-1 py-1.5 px-3 border border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
            title="Exportar PDF / Imprimir"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir
          </button>
        </div>
      </div>

      {/* Alerta de Duplicidade na Planilha */}
      {tableAlert && (
        <div className="mx-5 mb-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-center justify-between gap-3 text-amber-800 dark:text-amber-300 text-xs animate-fade-in print:hidden">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{tableAlert.message}</span>
          </div>
          <button 
            onClick={() => setTableAlert(null)}
            className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-250 cursor-pointer p-0.5"
            title="Fechar Alerta"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Spreadsheet grid */}
      <div className="overflow-x-auto overflow-y-auto max-h-[550px] print:max-h-none">
        <table className="w-full text-left border-collapse border-spacing-0 text-[10px] font-sans">
          <thead>
            <tr className="bg-black text-zinc-100 border-b border-zinc-900 uppercase text-[9px] tracking-wider sticky top-0 z-10 select-none">
              {columnsConfig.filter(col => col.visible).map((col) => {
                const isSorted = sortField === col.key;
                const isStickyReg = col.key === "registro";
                const isStickyCli = col.key === "cliente";
                
                let stickyClass = "";
                if (isStickyReg) {
                  stickyClass = "sticky left-0 bg-black z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)] w-[56px] min-w-[56px] max-w-[56px]";
                } else if (isStickyCli) {
                  stickyClass = "sticky left-[56px] bg-black z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]";
                }
                
                return (
                  <th 
                    key={col.key} 
                    className={`py-1.5 px-2 font-bold cursor-pointer ${stickyClass}`}
                    onClick={() => handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.label}</span>
                      <ArrowUpDown className={`w-3 h-3 shrink-0 ${isSorted ? "text-indigo-400 font-bold" : "text-zinc-500"}`} />
                    </div>
                  </th>
                );
              })}
              <th className="py-1.5 px-2 font-bold text-center print:hidden bg-black">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredProcessos.map((p) => {
              const { text: obsText, customData } = parseCustomFields(p.observacoes || "");
              const isSelected = selectedProcessoId === p.registro;
              const statusStyle = getStatusRowStyle(p.status);
              
              const trStyle: React.CSSProperties = {};
              if (statusStyle && rowColorMode === "full") {
                trStyle.backgroundColor = statusStyle.bg;
              }
              
              return (
                <motion.tr 
                  key={p.registro}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  onClick={() => onSelectProcess?.(p)}
                  style={trStyle}
                  className={`transition-colors cursor-pointer ${
                    isSelected 
                      ? "bg-red-500/10 hover:bg-red-500/15 border-l-4 border-red-600" 
                      : statusStyle && rowColorMode === "full"
                      ? "hover:brightness-95 hover:contrast-105"
                      : "hover:bg-slate-50/50 dark:hover:bg-slate-850/50"
                  }`}
                >
                  {columnsConfig.filter(col => col.visible).map((col) => {
                    const isEditing = editingCell?.registro === p.registro && editingCell?.field === col.key;
                    
                    // Render cell wrapper based on sticky requirements
                    const isStickyReg = col.key === "registro";
                    const isStickyCli = col.key === "cliente";
                    
                    let bgStyle: React.CSSProperties = {};
                    let bgClass = "";
                    
                    const isColoredRow = statusStyle && rowColorMode === "full";
                    const isColoredCell = statusStyle && rowColorMode === "status-cell" && col.key === "status";
                    
                    if (isColoredRow) {
                      if (isStickyReg || isStickyCli) {
                        bgStyle = { backgroundColor: statusStyle.bg };
                      } else {
                        bgClass = "bg-transparent";
                      }
                      bgStyle.color = statusStyle.textHex;
                    } else if (isColoredCell) {
                      bgStyle = { backgroundColor: statusStyle.bg, color: statusStyle.textHex };
                    } else if (isSelected) {
                      bgClass = "bg-red-950/20 dark:bg-red-950/45";
                    } else {
                      bgClass = "bg-white dark:bg-slate-900";
                    }
                    
                    let cellClass = `py-1 px-2 ${bgClass} ${
                      isColoredRow || isColoredCell
                        ? `${statusStyle.text} font-bold` 
                        : `text-slate-700 dark:text-slate-200 ${isSelected ? "text-slate-100 font-semibold" : ""}`
                    }`;
                    
                    if (isStickyReg) {
                      cellClass = `py-1 px-2 sticky left-0 ${bgClass} z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-[56px] min-w-[56px] max-w-[56px] text-center ${
                        isColoredRow 
                          ? `${statusStyle.text} font-black` 
                          : "font-bold font-mono text-indigo-600 dark:text-indigo-400"
                      } ${isSelected ? "border-l-4 border-red-600" : ""}`;
                      
                      if (statusStyle && rowColorMode === "border") {
                        bgStyle.borderLeft = `5px solid ${statusStyle.bg}`;
                      }
                    } else if (isStickyCli) {
                      cellClass = `py-1 px-2 sticky left-[56px] ${bgClass} z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] truncate max-w-[150px] ${
                        isColoredRow 
                          ? `${statusStyle.text} font-black` 
                          : "font-semibold text-slate-800 dark:text-slate-100"
                      }`;
                    }
                    
                    // Render cell inner content based on column key
                    let innerContent: React.ReactNode = null;
                    
                    switch (col.key) {
                      case "documentos":
                        innerContent = (
                          <DocumentStatusIcons 
                            documentos={p.documentos || []} 
                            onUploadClick={onOpenUploadModal ? () => onOpenUploadModal(p.registro) : undefined}
                          />
                        );
                        break;

                      case "registro":
                        innerContent = p.registro;
                        break;
                        
                      case "cliente":
                        innerContent = isEditing ? (
                          <select
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={() => handleSaveCell(p.registro, "cliente")}
                            autoFocus
                            className="px-1.5 py-0.5 border border-indigo-500 rounded text-xs w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                          >
                            {clientes.map(c => <option key={c.nome} value={c.nome}>{c.nome}</option>)}
                          </select>
                        ) : (
                          <span onDoubleClick={() => handleStartCellEdit(p, "cliente")} className="cursor-pointer border-b border-dotted border-slate-300">
                            {p.cliente || "---"}
                          </span>
                        );
                        break;
                        
                      case "processo":
                        innerContent = isEditing ? (
                          <input
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={() => handleSaveCell(p.registro, "processo")}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveCell(p.registro, "processo")}
                            autoFocus
                            className="px-1.5 py-0.5 border border-indigo-500 rounded text-xs font-mono bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 w-full"
                          />
                        ) : (
                          <span onDoubleClick={() => handleStartCellEdit(p, "processo")} className="cursor-pointer hover:bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                            {p.processo || "---"}
                          </span>
                        );
                        break;
                        
                      case "container":
                        innerContent = isEditing ? (
                          <input
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value.toUpperCase())}
                            onBlur={() => handleSaveCell(p.registro, "container")}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveCell(p.registro, "container")}
                            autoFocus
                            className="px-1.5 py-0.5 border border-indigo-500 rounded text-xs font-mono bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 w-full"
                          />
                        ) : (
                          <span onDoubleClick={() => handleStartCellEdit(p, "container")} className="cursor-pointer hover:bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                            {p.container || "---"}
                          </span>
                        );
                        break;
                        
                      case "tipoContainer":
                        innerContent = isEditing ? (
                          <select
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={() => handleSaveCell(p.registro, "tipoContainer")}
                            autoFocus
                            className="px-1 py-0.5 border border-indigo-500 rounded text-xs font-mono bg-white dark:bg-slate-850 dark:text-slate-200"
                          >
                            <option value="20GP">20GP</option>
                            <option value="40GP">40GP</option>
                            <option value="40HQ">40HQ</option>
                            <option value="20FR">20FR</option>
                            <option value="40OT">40OT</option>
                          </select>
                        ) : (
                          <span onDoubleClick={() => handleStartCellEdit(p, "tipoContainer")} className="cursor-pointer hover:bg-slate-100 px-1 py-0.5 rounded font-mono">
                            {p.tipoContainer || "---"}
                          </span>
                        );
                        break;
                        
                      case "armador":
                        innerContent = isEditing ? (
                          <select
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={() => handleSaveCell(p.registro, "armador")}
                            autoFocus
                            className="px-1.5 py-0.5 border border-indigo-500 rounded text-xs bg-white dark:bg-slate-850 dark:text-slate-200"
                          >
                            {armadores.map(a => <option key={a.nome} value={a.nome}>{a.nome}</option>)}
                          </select>
                        ) : (
                          <span onDoubleClick={() => handleStartCellEdit(p, "armador")} className="cursor-pointer hover:bg-slate-100 px-1.5 py-0.5 rounded border-b border-dotted border-slate-300">
                            {p.armador || "---"}
                          </span>
                        );
                        break;
                        
                      case "localDevolucao":
                        const matchedArm = armadores.find(a => a.nome === p.armador);
                        innerContent = (
                          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="truncate max-w-[200px]" title={matchedArm?.observacoes || "Nenhum cadastrado"}>
                              {matchedArm?.observacoes || "---"}
                            </span>
                          </div>
                        );
                        break;
                        
                      case "siteArmador":
                        const matchedArm2 = armadores.find(a => a.nome === p.armador);
                        const siteUrl = matchedArm2?.portal || matchedArm2?.linkDevolucao;
                        innerContent = siteUrl ? (
                          <a 
                            href={siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 py-0.5 px-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-150 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-450 rounded text-[10px] font-bold hover:bg-emerald-100/50 transition-all shrink-0"
                          >
                            <Link2 className="w-3 h-3 text-emerald-550 shrink-0" />
                            <span>Acessar</span>
                          </a>
                        ) : (
                          <span className="text-slate-400">---</span>
                        );
                        break;
                        
                      case "motorista":
                        innerContent = isEditing ? (
                          <select
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={() => handleSaveCell(p.registro, "motorista")}
                            autoFocus
                            className="px-1.5 py-0.5 border border-indigo-500 rounded text-xs bg-white dark:bg-slate-850 dark:text-slate-200"
                          >
                            <option value="">Selecione...</option>
                            {prestadores.map(m => <option key={m.nome} value={m.nome}>{m.nome}</option>)}
                          </select>
                        ) : (
                          <span onDoubleClick={() => handleStartCellEdit(p, "motorista")} className="cursor-pointer hover:bg-slate-100 px-1.5 py-0.5 rounded border-b border-dotted border-slate-300">
                            {p.motorista || "---"}
                          </span>
                        );
                        break;
                        
                      case "veiculo":
                        innerContent = isEditing ? (
                          <select
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={() => handleSaveCell(p.registro, "veiculo")}
                            autoFocus
                            className="px-1 py-0.5 border border-indigo-500 rounded text-xs bg-white dark:bg-slate-850"
                          >
                            <option value="">Selecione...</option>
                            {Array.from(new Set(prestadores.flatMap(p => [p.cavaloPlaca, p.carretaPlaca].filter(Boolean)))).map(placa => <option key={placa} value={placa}>{placa}</option>)}
                          </select>
                        ) : (
                          <span onDoubleClick={() => handleStartCellEdit(p, "veiculo")} className="cursor-pointer hover:bg-slate-100 px-1 py-0.5 rounded font-mono">
                            {p.veiculo || "---"}
                          </span>
                        );
                        break;
                        
                      case "transportadora":
                        innerContent = isEditing ? (
                          <select
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={() => handleSaveCell(p.registro, "transportadora")}
                            autoFocus
                            className="px-1 py-0.5 border border-indigo-500 rounded text-xs bg-white dark:bg-slate-850"
                          >
                            <option value="">Selecione...</option>
                            {transportadoras.map(t => <option key={t.nome} value={t.nome}>{t.nome}</option>)}
                          </select>
                        ) : (
                          <span onDoubleClick={() => handleStartCellEdit(p, "transportadora")} className="cursor-pointer hover:bg-slate-100 px-1 py-0.5 rounded">
                            {p.transportadora || "---"}
                          </span>
                        );
                        break;
                        
                      case "valorFrete":
                        innerContent = isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={() => handleSaveCell(p.registro, "valorFrete")}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveCell(p.registro, "valorFrete")}
                            autoFocus
                            className="px-1.5 py-0.5 border border-indigo-500 rounded text-xs bg-white dark:bg-slate-800 w-20"
                          />
                        ) : (
                          <span onDoubleClick={() => handleStartCellEdit(p, "valorFrete")} className="cursor-pointer hover:bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                            R$ {parseFloat(p.valorFrete).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        );
                        break;
                        
                      case "valorCarregamento":
                        innerContent = isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={() => handleSaveCell(p.registro, "valorCarregamento")}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveCell(p.registro, "valorCarregamento")}
                            autoFocus
                            className="px-1.5 py-0.5 border border-indigo-500 rounded text-xs bg-white dark:bg-slate-800 w-20"
                          />
                        ) : (
                          <span onDoubleClick={() => handleStartCellEdit(p, "valorCarregamento")} className="cursor-pointer hover:bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                            R$ {parseFloat(p.valorCarregamento || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        );
                        break;
                        
                      case "motoristaPago":
                        innerContent = isEditing ? (
                          <select
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={() => handleSaveCell(p.registro, "motoristaPago")}
                            autoFocus
                            className="px-1.5 py-0.5 border border-indigo-500 rounded text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                          >
                            <option value="Não">Não</option>
                            <option value="Sim">Sim</option>
                          </select>
                        ) : (
                          <span 
                            onDoubleClick={() => handleStartCellEdit(p, "motoristaPago")}
                            className={`cursor-pointer px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              (p.motoristaPago || "Não") === "Sim" 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400" 
                                : "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/40 dark:text-rose-400"
                            }`}
                          >
                            {p.motoristaPago || "Não"}
                          </span>
                        );
                        break;
                        
                      case "valorPagoMotorista":
                        innerContent = isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={() => handleSaveCell(p.registro, "valorPagoMotorista")}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveCell(p.registro, "valorPagoMotorista")}
                            autoFocus
                            className="px-1.5 py-0.5 border border-indigo-500 rounded text-xs bg-white dark:bg-slate-800 w-20"
                          />
                        ) : (
                          <span onDoubleClick={() => handleStartCellEdit(p, "valorPagoMotorista")} className="cursor-pointer hover:bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                            R$ {parseFloat(p.valorPagoMotorista || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        );
                        break;
                        
                      case "dataRetirada":
                        innerContent = (
                          <div className="flex flex-col gap-0.5 font-mono">
                            <span>{p.dataRetirada || "---"}</span>
                            <span className="text-[10px] text-slate-450">{p.horaRetirada || "---"}</span>
                          </div>
                        );
                        break;
                        
                      case "dataEntrega":
                        innerContent = (
                          <div className="flex flex-col gap-0.5 font-mono">
                            <span>{p.dataEntrega || "---"}</span>
                            <span className="text-[10px] text-slate-450">{p.horaEntrega || "---"}</span>
                          </div>
                        );
                        break;
                        
                      case "dataDevolucao":
                        innerContent = (
                          <div className="flex flex-col gap-0.5 font-mono">
                            <span>{p.dataDevolucao || "---"}</span>
                            <span className="text-[10px] text-slate-450">{p.horaDevolucao || "---"}</span>
                          </div>
                        );
                        break;
                        
                      case "entregaVazio":
                        innerContent = isEditing ? (
                          <select
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={() => handleSaveCell(p.registro, "entregaVazio")}
                            autoFocus
                            className="px-1 py-0.5 border border-indigo-500 rounded text-[10px] bg-white dark:bg-slate-800"
                          >
                            <option value="Pendente">Pendente</option>
                            <option value="Devolvido">Devolvido</option>
                            <option value="Atrasado">Atrasado</option>
                          </select>
                        ) : (
                          <span 
                            onDoubleClick={() => handleStartCellEdit(p, "entregaVazio")}
                            className={`cursor-pointer px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              p.entregaVazio === "Devolvido" 
                                ? "bg-slate-100 text-slate-700 border-slate-200" 
                                : p.entregaVazio === "Atrasado"
                                ? "bg-rose-50 text-rose-700 border-rose-100 animate-pulse"
                                : "bg-amber-50 text-amber-700 border-amber-100"
                            }`}
                          >
                            {p.entregaVazio || "Pendente"}
                          </span>
                        );
                        break;
                        
                      case "terminal":
                        innerContent = isEditing ? (
                          <select
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={() => handleSaveCell(p.registro, "terminal")}
                            autoFocus
                            className="px-1 py-0.5 border border-indigo-500 rounded text-xs bg-white dark:bg-slate-800"
                          >
                            <option value="">Selecione...</option>
                            {terminais.map(t => <option key={t.nome} value={t.nome}>{t.nome}</option>)}
                          </select>
                        ) : (
                          <span onDoubleClick={() => handleStartCellEdit(p, "terminal")} className="cursor-pointer hover:bg-slate-100 px-1 py-0.5 rounded border-b border-dotted border-slate-300">
                            {p.terminal || "---"}
                          </span>
                        );
                        break;
                        
                      case "status":
                        innerContent = isEditing ? (
                          <select
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={() => handleSaveCell(p.registro, "status")}
                            autoFocus
                            className="px-1.5 py-0.5 border border-indigo-500 rounded text-[10px] font-bold bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100"
                          >
                            {[
                              "Aguardando Processamento",
                              "Agendado",
                              "Carregando",
                              "Em Trânsito",
                              "Entregue",
                              "Container Devolvido",
                              "Processo Finalizado",
                              "Faturado",
                              "Pago",
                              "Cancelado",
                              "Pendência Documental",
                              "Aguardando Cliente",
                              "Aguardando Motorista",
                              "Aguardando Liberação",
                              "Divergência",
                              "Coletado",
                              "Devolvido",
                              "Pendente"
                            ].map(st => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span 
                              onDoubleClick={() => handleStartCellEdit(p, "status")}
                              className={`cursor-pointer px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(p.status)}`}
                            >
                              {p.status}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setHistoryProcesso(p);
                              }}
                              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-all text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                              title="Ver histórico de alterações de status"
                            >
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                            </button>
                          </div>
                        );
                        break;
                        
                      case "observacoes":
                        innerContent = isEditing ? (
                          <input
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={() => handleSaveCell(p.registro, "observacoes")}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveCell(p.registro, "observacoes")}
                            autoFocus
                            className="px-1.5 py-0.5 border border-indigo-500 rounded text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 w-full"
                          />
                        ) : (
                          <span onDoubleClick={() => handleStartCellEdit(p, "observacoes")} className="cursor-pointer hover:bg-slate-100 px-1.5 py-0.5 rounded">
                            {obsText || "---"}
                          </span>
                        );
                        break;
                        
                      default:
                        // This must be a custom column!
                        if (col.key.startsWith("col_custom_")) {
                          const customVal = customData[col.key] || "";
                          innerContent = isEditing ? (
                            <input
                              type="text"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onBlur={() => {
                                const updatedData = { ...customData, [col.key]: editingValue };
                                const serialized = serializeCustomFields(obsText, updatedData);
                                onUpdateProcess(p.registro, { observacoes: serialized });
                                setEditingCell(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  const updatedData = { ...customData, [col.key]: editingValue };
                                  const serialized = serializeCustomFields(obsText, updatedData);
                                  onUpdateProcess(p.registro, { observacoes: serialized });
                                  setEditingCell(null);
                                }
                              }}
                              autoFocus
                              className="px-1.5 py-0.5 border border-indigo-500 rounded text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 w-full font-medium"
                            />
                          ) : (
                            <span 
                              onDoubleClick={() => {
                                setEditingCell({ registro: p.registro, field: col.key });
                                setEditingValue(customVal);
                              }}
                              className="cursor-pointer hover:bg-slate-100 px-1 py-0.5 rounded italic text-indigo-600 dark:text-indigo-400 font-semibold"
                            >
                              {customVal || "Duplo clique..."}
                            </span>
                          );
                        }
                        break;
                    }
                    
                    return (
                      <td key={col.key} className={cellClass} style={bgStyle}>
                        {innerContent}
                      </td>
                    );
                  })}
                  
                  {/* Row actions */}
                  {(() => {
                    const isColoredRow = statusStyle && rowColorMode === "full";
                    const actionsBgClass = isSelected 
                      ? "bg-red-950/20 dark:bg-red-950/45" 
                      : isColoredRow
                      ? "bg-transparent"
                      : "bg-white dark:bg-slate-900";
                    return (
                      <td className={`py-1 px-2 text-center print:hidden ${actionsBgClass}`}>
                        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {onSelectProcess && (
                            <button
                              onClick={() => onSelectProcess(p)}
                              className={`p-0.5 rounded transition-all cursor-pointer ${
                                isSelected 
                                  ? "text-red-500 bg-red-500/10 animate-pulse" 
                                  : isColoredRow
                                  ? "text-slate-800 hover:bg-black/10 hover:text-black dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
                                  : "text-slate-400 hover:text-white hover:bg-zinc-800"
                              }`}
                              title="Inspecionar Carga"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingProcess(p);
                              const { text: cleanObs, customData: loadedCustom } = parseCustomFields(p.observacoes || "");
                              setNewProcessForm({
                                ...p,
                                observacoes: cleanObs
                              });
                              setCustomFieldsForm(loadedCustom);
                              setShowCreateModal(true);
                            }}
                            className={`p-0.5 rounded transition-all cursor-pointer ${
                              isColoredRow
                                ? "text-indigo-900 hover:bg-black/10 dark:text-indigo-300 dark:hover:bg-white/10"
                                : "text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                            }`}
                            title="Editar Linha"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onDeleteProcess(p.registro)}
                            className={`p-0.5 rounded transition-all cursor-pointer ${
                              isColoredRow
                                ? "text-red-900 hover:bg-black/10 dark:text-red-300 dark:hover:bg-white/10"
                                : "text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                            }`}
                            title="Excluir Processo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    );
                  })()}
                </motion.tr>
              );
            })}

            {filteredProcessos.length === 0 && (
              <tr>
                <td colSpan={24} className="py-12 text-center text-slate-500 dark:text-slate-450 font-medium">
                  Nenhum processo operacional encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE / EDIT PROCESS MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in print:hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
              <h3 className="font-semibold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                {editingProcess ? `Editar Processo Operacional #${editingProcess.registro}` : "Registrar Novo Processo Logístico"}
              </h3>
              <button 
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingProcess(null);
                  setValidationErrors({});
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProcessSubmit} className="space-y-4">
              {/* Cálculo e exibição de avisos de duplicidade em tempo real */}
              {(() => {
                const typedContainer = newProcessForm.container?.trim().toUpperCase();
                const duplicateInForm = typedContainer 
                  ? processos.find(p => p.container.trim().toUpperCase() === typedContainer)
                  : null;

                const typedProcesso = newProcessForm.processo?.trim().toUpperCase();
                const duplicateProcessoInForm = typedProcesso
                  ? processos.find(p => p.processo.trim().toUpperCase() === typedProcesso)
                  : null;

                if (!duplicateInForm && !duplicateProcessoInForm) return null;

                return (
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-start gap-3 text-amber-800 dark:text-amber-300 text-xs animate-fade-in">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold">Aviso de Duplicidade no Banco de Dados</p>
                      {duplicateInForm && (
                        <p>
                          O Contêiner <strong className="underline">{typedContainer}</strong> já está cadastrado no processo <strong className="font-mono bg-amber-100 dark:bg-amber-900 px-1 py-0.2 rounded text-indigo-600 dark:text-indigo-400 font-bold">{duplicateInForm.registro}</strong> para o cliente <strong className="font-semibold">{duplicateInForm.cliente}</strong>.
                        </p>
                      )}
                      {duplicateProcessoInForm && (
                        <p>
                          O Nº de Processo <strong className="underline">{typedProcesso}</strong> já está associado ao registro <strong className="font-mono bg-amber-100 dark:bg-amber-900 px-1 py-0.2 rounded text-indigo-600 dark:text-indigo-400 font-bold">{duplicateProcessoInForm.registro}</strong> para o cliente <strong className="font-semibold">{duplicateProcessoInForm.cliente}</strong>.
                        </p>
                      )}
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium pt-0.5">
                        O sistema permite salvar mesmo com duplicidade caso seja necessário, mas o aviso indica dados idênticos.
                      </p>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Cliente</label>
                  <select
                    required
                    value={newProcessForm.cliente}
                    onChange={(e) => setNewProcessForm({ ...newProcessForm, cliente: e.target.value })}
                    className={`w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg text-slate-800 dark:text-slate-100 ${
                      validationErrors.cliente
                        ? "border-red-500 ring-2 ring-red-500/15 focus:border-red-500"
                        : "border-slate-200 dark:border-slate-750"
                    }`}
                  >
                    <option value="">Selecione...</option>
                    {clientes.map(c => <option key={c.nome} value={c.nome}>{c.nome}</option>)}
                  </select>
                  {validationErrors.cliente && (
                    <p className="text-red-500 text-[10px] font-bold mt-1 animate-fade-in">{validationErrors.cliente}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Nº Processo / Referência</label>
                  <input
                    type="text"
                    required
                    value={newProcessForm.processo}
                    onChange={(e) => setNewProcessForm({ ...newProcessForm, processo: e.target.value })}
                    placeholder="Ex: PR-2026/102"
                    className={`w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg text-slate-800 dark:text-slate-100 ${
                      validationErrors.processo
                        ? "border-red-500 ring-2 ring-red-500/15 focus:border-red-500"
                        : "border-slate-200 dark:border-slate-750"
                    }`}
                  />
                  {validationErrors.processo && (
                    <p className="text-red-500 text-[10px] font-bold mt-1 animate-fade-in">{validationErrors.processo}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">ID do Contêiner</label>
                  <input
                    type="text"
                    required
                    value={newProcessForm.container}
                    onChange={(e) => setNewProcessForm({ ...newProcessForm, container: e.target.value.toUpperCase() })}
                    placeholder="Ex: MSCU1234567"
                    className={`w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg text-slate-800 dark:text-slate-100 ${
                      validationErrors.container
                        ? "border-red-500 ring-2 ring-red-500/15 focus:border-red-500"
                        : "border-slate-200 dark:border-slate-750"
                    }`}
                  />
                  {validationErrors.container && (
                    <p className="text-red-500 text-[10px] font-bold mt-1 animate-fade-in">{validationErrors.container}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Tipo de Contêiner</label>
                  <select
                    value={newProcessForm.tipoContainer}
                    onChange={(e) => setNewProcessForm({ ...newProcessForm, tipoContainer: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg text-slate-800 dark:text-slate-100"
                  >
                    <option value="20GP">20GP</option>
                    <option value="40GP">40GP</option>
                    <option value="40HQ">40HQ</option>
                    <option value="20FR">20FR</option>
                    <option value="40OT">40OT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Armador</label>
                  <select
                    required
                    value={newProcessForm.armador}
                    onChange={(e) => setNewProcessForm({ ...newProcessForm, armador: e.target.value })}
                    className={`w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg text-slate-800 dark:text-slate-100 ${
                      validationErrors.armador
                        ? "border-red-500 ring-2 ring-red-500/15 focus:border-red-500"
                        : "border-slate-200 dark:border-slate-750"
                    }`}
                  >
                    <option value="">Selecione...</option>
                    {armadores.map(a => <option key={a.nome} value={a.nome}>{a.nome}</option>)}
                  </select>
                  {validationErrors.armador && (
                    <p className="text-red-500 text-[10px] font-bold mt-1 animate-fade-in">{validationErrors.armador}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Motorista</label>
                  <select
                    value={newProcessForm.motorista}
                    onChange={(e) => setNewProcessForm({ ...newProcessForm, motorista: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg text-slate-800 dark:text-slate-100"
                  >
                    <option value="">Selecione...</option>
                    {prestadores.map(m => <option key={m.nome} value={m.nome}>{m.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Veículo (Placa)</label>
                  <select
                    value={newProcessForm.veiculo}
                    onChange={(e) => setNewProcessForm({ ...newProcessForm, veiculo: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg text-slate-800 dark:text-slate-100"
                  >
                    <option value="">Selecione...</option>
                    {Array.from(new Set(prestadores.flatMap(p => [p.cavaloPlaca, p.carretaPlaca].filter(Boolean)))).map(placa => <option key={placa} value={placa}>{placa}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Transportadora</label>
                  <select
                    value={newProcessForm.transportadora}
                    onChange={(e) => setNewProcessForm({ ...newProcessForm, transportadora: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg text-slate-800 dark:text-slate-100"
                  >
                    <option value="">Selecione...</option>
                    {transportadoras.map(t => <option key={t.nome} value={t.nome}>{t.nome}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Valor do Frete (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProcessForm.valorFrete}
                    onChange={(e) => setNewProcessForm({ ...newProcessForm, valorFrete: e.target.value })}
                    placeholder="0.00"
                    className={`w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg text-slate-800 dark:text-slate-100 ${
                      validationErrors.valorFrete
                        ? "border-red-500 ring-2 ring-red-500/15 focus:border-red-500"
                        : "border-slate-200 dark:border-slate-750"
                    }`}
                  />
                  {validationErrors.valorFrete && (
                    <p className="text-red-500 text-[10px] font-bold mt-1 animate-fade-in">{validationErrors.valorFrete}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Terminal</label>
                  <select
                    value={newProcessForm.terminal}
                    onChange={(e) => setNewProcessForm({ ...newProcessForm, terminal: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg text-slate-800 dark:text-slate-100"
                  >
                    <option value="">Selecione...</option>
                    {terminais.map(t => <option key={t.nome} value={t.nome}>{t.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Status Operacional</label>
                  <select
                    value={newProcessForm.status}
                    onChange={(e) => setNewProcessForm({ ...newProcessForm, status: e.target.value as any })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg text-slate-800 dark:text-slate-100 font-bold"
                  >
                    {[
                      "Aguardando Processamento",
                      "Agendado",
                      "Carregando",
                      "Em Trânsito",
                      "Entregue",
                      "Container Devolvido",
                      "Processo Finalizado",
                      "Faturado",
                      "Pago",
                      "Cancelado",
                      "Pendência Documental",
                      "Aguardando Cliente",
                      "Aguardando Motorista",
                      "Aguardando Liberação",
                      "Divergência",
                      "Coletado",
                      "Devolvido",
                      "Pendente"
                    ].map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Valor do Carregamento (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProcessForm.valorCarregamento}
                    onChange={(e) => setNewProcessForm({ ...newProcessForm, valorCarregamento: e.target.value })}
                    placeholder="0.00"
                    className={`w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg text-slate-800 dark:text-slate-100 ${
                      validationErrors.valorCarregamento
                        ? "border-red-500 ring-2 ring-red-500/15 focus:border-red-500"
                        : "border-slate-200 dark:border-slate-750"
                    }`}
                  />
                  {validationErrors.valorCarregamento && (
                    <p className="text-red-500 text-[10px] font-bold mt-1 animate-fade-in">{validationErrors.valorCarregamento}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Motorista Pago?</label>
                  <select
                    value={newProcessForm.motoristaPago}
                    onChange={(e) => setNewProcessForm({ ...newProcessForm, motoristaPago: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg text-slate-800 dark:text-slate-100"
                  >
                    <option value="Não">Não</option>
                    <option value="Sim">Sim</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Valor Pago ao Motorista (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProcessForm.valorPagoMotorista}
                    onChange={(e) => setNewProcessForm({ ...newProcessForm, valorPagoMotorista: e.target.value })}
                    placeholder="0.00"
                    className={`w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg text-slate-800 dark:text-slate-100 ${
                      validationErrors.valorPagoMotorista
                        ? "border-red-500 ring-2 ring-red-500/15 focus:border-red-500"
                        : "border-slate-200 dark:border-slate-750"
                    }`}
                  />
                  {validationErrors.valorPagoMotorista && (
                    <p className="text-red-500 text-[10px] font-bold mt-1 animate-fade-in">{validationErrors.valorPagoMotorista}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Data Retirada (DD/MM/AAAA)</label>
                  <input
                    type="text"
                    value={newProcessForm.dataRetirada}
                    onChange={(e) => setNewProcessForm({ ...newProcessForm, dataRetirada: e.target.value })}
                    placeholder="Ex: 02/07/2026"
                    className={`w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg text-slate-800 dark:text-slate-100 ${
                      validationErrors.dataRetirada
                        ? "border-red-500 ring-2 ring-red-500/15 focus:border-red-500"
                        : "border-slate-200 dark:border-slate-750"
                    }`}
                  />
                  {validationErrors.dataRetirada && (
                    <p className="text-red-500 text-[10px] font-bold mt-1 animate-fade-in">{validationErrors.dataRetirada}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Hora Retirada (HH:MM)</label>
                  <input
                    type="text"
                    value={newProcessForm.horaRetirada}
                    onChange={(e) => setNewProcessForm({ ...newProcessForm, horaRetirada: e.target.value })}
                    placeholder="Ex: 09:30"
                    className={`w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg text-slate-800 dark:text-slate-100 ${
                      validationErrors.horaRetirada
                        ? "border-red-500 ring-2 ring-red-500/15 focus:border-red-500"
                        : "border-slate-200 dark:border-slate-750"
                    }`}
                  />
                  {validationErrors.horaRetirada && (
                    <p className="text-red-500 text-[10px] font-bold mt-1 animate-fade-in">{validationErrors.horaRetirada}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Entrega Container Vazio</label>
                  <select
                    value={newProcessForm.entregaVazio}
                    onChange={(e) => setNewProcessForm({ ...newProcessForm, entregaVazio: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg text-slate-800 dark:text-slate-100"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Devolvido">Devolvido</option>
                    <option value="Atrasado">Atrasado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Observações</label>
                <textarea
                  value={newProcessForm.observacoes}
                  onChange={(e) => setNewProcessForm({ ...newProcessForm, observacoes: e.target.value })}
                  placeholder="Instruções operacionais adicionais..."
                  rows={2}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg text-slate-800 dark:text-slate-100"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingProcess(null);
                    setValidationErrors({});
                  }}
                  className="py-1.5 px-4 border border-slate-250 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  onClick={() => setActionAfterSave("none")}
                  className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Salvar Registro
                </button>
                <button
                  type="submit"
                  onClick={() => setActionAfterSave("attach")}
                  className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  title="Salva este registro e abre a janela para anexar os dados/documentos"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Salvar e Anexar Dados
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COLUMN MANAGER MODAL */}
      {showColumnManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in print:hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-xl w-full shadow-2xl overflow-y-auto max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
              <h3 className="font-semibold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-500" />
                Gerenciar Colunas da Planilha
              </h3>
              <button 
                onClick={() => setShowColumnManager(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add Custom Column Section */}
            <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-500" />
                Adicionar Nova Coluna Personalizada
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nome da coluna (ex: DI do Processo)"
                  value={newColumnLabel}
                  onChange={(e) => setNewColumnLabel(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
                <button
                  type="button"
                  onClick={handleAddColumn}
                  className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition-colors"
                >
                  Adicionar
                </button>
              </div>
            </div>

            {/* Columns List */}
            <div className="space-y-2 mb-6 max-h-[40vh] overflow-y-auto pr-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 border-b pb-1 dark:border-slate-800">
                <span>Ordem e Nome</span>
                <span>Ações / Visibilidade</span>
              </div>
              {columnsConfig.map((col, index) => {
                const isCustom = col.key.startsWith("col_custom_");
                return (
                  <div 
                    key={col.key} 
                    className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg border border-slate-100 dark:border-slate-850 transition-all gap-3"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {/* Reorder Arrows */}
                      <div className="flex flex-col">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveColumn(index, "up")}
                          className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-750 rounded text-slate-400 hover:text-indigo-500 disabled:opacity-30 cursor-pointer"
                          title="Mover para esquerda"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === columnsConfig.length - 1}
                          onClick={() => handleMoveColumn(index, "down")}
                          className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-750 rounded text-slate-400 hover:text-indigo-500 disabled:opacity-30 cursor-pointer"
                          title="Mover para direita"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Edit label inline */}
                      <input
                        type="text"
                        value={col.label}
                        onChange={(e) => handleRenameColumn(col.key, e.target.value)}
                        className="px-2 py-0.5 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-slate-50 dark:focus:bg-slate-800 rounded font-bold text-xs text-slate-700 dark:text-slate-200 w-full focus:outline-none transition-all"
                        title="Clique para renomear"
                      />
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Toggle Visibility */}
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={col.visible}
                          disabled={col.key === "registro" || col.key === "cliente"}
                          onChange={() => handleToggleColumn(col.key)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-indigo-600 disabled:opacity-50"></div>
                        <span className="ml-2 text-[10px] font-bold text-slate-500 w-8">
                          {col.visible ? "Visível" : "Oculto"}
                        </span>
                      </label>

                      {/* Delete Custom Column */}
                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => handleRemoveColumn(col.key)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded cursor-pointer"
                          title="Excluir coluna permanente"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-750">
              <button
                type="button"
                onClick={() => setShowColumnManager(false)}
                className="py-1.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors animate-pulse"
              >
                Concluir Configuração
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATUS HISTORY CHRONOLOGY MODAL */}
      {historyProcesso && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in print:hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
              <h3 className="font-semibold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                Cronologia de Status
              </h3>
              <button 
                onClick={() => setHistoryProcesso(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 bg-indigo-50/50 dark:bg-indigo-950/20 p-3.5 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30 text-xs">
              <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-slate-600 dark:text-slate-300">
                <div>Processo: <span className="font-bold text-slate-800 dark:text-white">{historyProcesso.processo || "---"}</span></div>
                <div>Registro ID: <span className="font-bold text-slate-800 dark:text-white">{historyProcesso.registro}</span></div>
                <div className="col-span-2">Cliente: <span className="font-bold text-slate-800 dark:text-white">{historyProcesso.cliente || "---"}</span></div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 py-2 max-h-[50vh]">
              {(() => {
                const historyEntries = getStatusHistory(historyProcesso);
                return (
                  <div className="relative border-l-2 border-indigo-100 dark:border-slate-800 ml-4 pl-6 space-y-6">
                    {historyEntries.map((entry, idx) => {
                      const statusColorClasses = getStatusColor(entry.status);
                      const dateStr = new Date(entry.timestamp).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                      });
                      const timeStr = new Date(entry.timestamp).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit"
                      });
                      
                      return (
                        <div key={idx} className="relative">
                          {/* Node Dot */}
                          <div className={`absolute -left-[33px] top-1 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-sm ${
                            entry.isInitial ? "bg-indigo-500 text-white" : "bg-emerald-500 text-white"
                          }`}>
                            {entry.isInitial ? (
                              <span className="text-[10px] font-bold">I</span>
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                          </div>
                          
                          {/* Node content */}
                          <div className="bg-slate-50 dark:bg-slate-850 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColorClasses}`}>
                                {entry.status}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                {dateStr} às {timeStr}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 dark:text-slate-350 flex items-center gap-1">
                              <span>Operador:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{entry.userEmail}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-750 mt-4">
              <button
                type="button"
                onClick={() => setHistoryProcesso(null)}
                className="py-1.5 px-5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-250 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Fechar Histórico
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
