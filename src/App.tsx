import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User } from "firebase/auth";
import { initAuth, googleSignIn, logout, getAccessToken } from "./lib/auth";
import {
  findOrCreateSpreadsheet,
  fetchSpreadsheetData,
  syncDBState,
  appendLog,
} from "./lib/sheetsDB";
import {
  Processo,
  Cliente,
  PrestadorServico,
  Transportadora,
  Armador,
  Terminal,
  ModeloOCR,
  LogEntry,
  DBState,
  OCRResult,
  DocumentoPendente,
  WebhookConfig,
  WebhookDeliveryLog,
} from "./types";

// Component imports
import KPIIndicators from "./components/KPIIndicators";
import ProcessTable from "./components/ProcessTable";
import ArmadorPortals from "./components/ArmadorPortals";
import CadastrosPanel from "./components/CadastrosPanel";
import ModelosOCRPanel from "./components/ModelosOCRPanel";
import RegrasExtracaoPage from "./components/RegrasExtracaoPage";
import OCRUploadModal from "./components/OCRUploadModal";
import WebhooksPanel from "./components/WebhooksPanel";
import RelatorioCarregamentosPanel from "./components/RelatorioCarregamentosPanel";

// Advanced workspace multi-view themes
import ThemeSelector, { ViewTheme } from "./components/ThemeSelector";
import AuditLogsModal from "./components/AuditLogsModal";
import UnifiedView from "./components/UnifiedView";
import KanbanView from "./components/KanbanView";
import DataGridView from "./components/DataGridView";
import Header from "./components/Header";
import LogModal from "./components/LogModal";
import UnifiedWorkspace from "./components/UnifiedWorkspace";
import GridView from "./components/GridView";
import { AppTheme } from "./types";
import ContextPanel, { ContextItem } from "./components/ContextPanel";

// Icons
import {
  Ship,
  Layers,
  Users,
  Settings,
  History,
  LogOut,
  CloudCheck,
  Cloud,
  RefreshCw,
  Sun,
  Moon,
  FileText,
  UserCheck,
  AlertCircle,
  Clock,
  ArrowRight,
  Radio,
  ChevronLeft,
  ChevronRight,
  Menu,
  Search,
  Kanban,
  Grid,
  ShieldCheck,
  TrendingUp,
  Plus,
  Sliders,
} from "lucide-react";

export const STATUS_COLORS: Record<string, string> = {
  "Aguardando Processamento": "#FFF2CC",
  Agendado: "#D9EAF7",
  Carregando: "#FCE4D6",
  "Em Trânsito": "#E4DFEC",
  Entregue: "#C6EFCE",
  "Container Devolvido": "#DDEBF7",
  "Processo Finalizado": "#A9D18E",
  Faturado: "#D9D2E9",
  Pago: "#B7E1CD",
  Cancelado: "#F4CCCC",
  "Pendência Documental": "#FCE5CD",
  "Aguardando Cliente": "#F4CCCC",
  "Aguardando Motorista": "#D0E0E3",
  "Aguardando Liberação": "#FFE699",
  Divergência: "#F8CBAD",
  Coletado: "#E2E8F0",
  Devolvido: "#F1F5F9",
  Pendente: "#FEE2E2",
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<"operacoes" | "configuracoes">(
    "operacoes",
  );
  const [activeSubTab, setActiveSubTab] = useState<
    | "dashboard"
    | "lista"
    | "kanban"
    | "grid"
    | "clientes"
    | "motoristas"
    | "relatorios"
    | "auditoria"
  >("dashboard");
  const [showUpperPanel, setShowUpperPanel] = useState(true);
  const [isTableFullscreen, setIsTableFullscreen] = useState(false);
  const [selectedContextItem, setSelectedContextItem] =
    useState<ContextItem | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "error">(
    "synced",
  );
  const [lastSavedTime, setLastSavedTime] = useState<string>(
    new Date().toLocaleTimeString("pt-BR"),
  );
  const [isAuditLogsModalOpen, setIsAuditLogsModalOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<AppTheme>("unified");
  const [logOpen, setLogOpen] = useState(false);
  const [reportsSubSection, setReportsSubSection] = useState<
    "ocr" | "carregamentos"
  >("carregamentos");

  // Main operational database state
  const [dbState, setDbState] = useState<DBState>({
    processos: [],
    clientes: [],
    motoristas: [],
    veiculos: [],
    transportadoras: [],
    armadores: [],
    terminais: [],
    modelosOCR: [],
    logs: [],
  });

  // OCR Auto-fill Alert Banner state
  const [ocrAutoFillAlert, setOcrAutoFillAlert] = useState<{
    documentType: string;
    fields: Record<string, string>;
    fileName: string;
  } | null>(null);

  // Contextual Row Upload Modal (M2)
  const [isRowUploadModalOpen, setIsRowUploadModalOpen] = useState(false);
  const [selectedProcessoId, setSelectedProcessoId] = useState<string | null>(
    null,
  );

  // Fila de documentos não associados (Fase 2)
  const [documentosPendentes, setDocumentosPendentes] = useState<
    DocumentoPendente[]
  >(() => {
    const saved = localStorage.getItem("documentos_pendentes_ocr");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (item: any): item is DocumentoPendente =>
              item &&
              typeof item === "object" &&
              typeof item.id === "string" &&
              typeof item.fileName === "string" &&
              typeof item.documentType === "string",
          );
        }
      } catch (e) {
        // Fallback below
      }
    }
    return [
      {
        id: "PEND-001",
        fileName: "DUIMP_SUDU1234567_Recusada.pdf",
        documentType: "DUIMP",
        confidence: 0.94,
        extractedFields: {
          processo: "TAIE-2026-8812739",
          container: "SUDU1234567",
          terminal: "Porto de Santos - Tecon",
          observacoes:
            "Processamento automático via Gemini. Nenhuma correspondência de container no banco ativo.",
        },
        timestamp: new Date().toISOString(),
      },
      {
        id: "PEND-002",
        fileName: "AG_F_WELLINGTON_GHR8821.pdf",
        documentType: "AGENDAMENTO",
        confidence: 0.98,
        extractedFields: {
          motorista: "Francisco Wellington Correia Silva",
          veiculo: "GHR-8821",
          dataRetirada: "16/07/2026",
          horaRetirada: "10:15",
          transportadora: "Rodoviário São Jorge Ltda",
        },
        timestamp: new Date().toISOString(),
      },
    ];
  });

  // Save to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(
      "documentos_pendentes_ocr",
      JSON.stringify(documentosPendentes),
    );
  }, [documentosPendentes]);

  // Webhooks State & History
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>(() => {
    const saved = localStorage.getItem("webhooks_configs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (item: any): item is WebhookConfig =>
              item &&
              typeof item === "object" &&
              typeof item.id === "string" &&
              typeof item.nome === "string" &&
              typeof item.url === "string",
          );
        }
      } catch (e) {
        // Fallback below
      }
    }
    return [
      {
        id: "WH-DEMO-1",
        nome: "Canal Slack Operacional (Demo)",
        url: "https://exemplo.com/seu-webhook-slack-aqui",
        secret: "whsec_demo_substitua_pelo_seu_secret",
        events: ["any"],
        active: false,
        createdAt: "14/07/2026",
      },
      {
        id: "WH-DEMO-2",
        nome: "API Principal ERP Logística",
        url: "https://api.erp-logistica.com.br/v1/webhook-status",
        secret: "whsec_erp_principal_987654321000",
        events: ["Em Trânsito", "Entregue", "Devolvido"],
        active: true,
        createdAt: "14/07/2026",
      },
    ];
  });

  const [webhookLogs, setWebhookLogs] = useState<WebhookDeliveryLog[]>(() => {
    const saved = localStorage.getItem("webhooks_delivery_logs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (item: any): item is WebhookDeliveryLog =>
              item &&
              typeof item === "object" &&
              typeof item.id === "string" &&
              typeof item.webhookId === "string" &&
              typeof item.timestamp === "string",
          );
        }
      } catch (e) {
        // Fallback below
      }
    }
    return [
      {
        id: "WHL-101",
        webhookId: "WH-DEMO-2",
        webhookName: "API Principal ERP Logística",
        webhookUrl: "https://api.erp-logistica.com.br/v1/webhook-status",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        event: "status_changed",
        payload: JSON.stringify({
          event: "process.status_changed",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          operator: "jorge.breu.mb@gmail.com",
          data: {
            registro: "REG-001",
            cliente: "Importação Santista S.A.",
            processo: "PR-2026/89",
            container: "MSCU9281736",
            oldStatus: "Coletado",
            newStatus: "Em Trânsito",
            details: {
              registro: "REG-001",
              cliente: "Importação Santista S.A.",
              processo: "PR-2026/89",
              container: "MSCU9281736",
              tipoContainer: "40HQ",
              armador: "MSC",
              motorista: "Carlos Alberto Santos",
              status: "Em Trânsito",
              valorFrete: "1200.00",
              dataCriado: "14/07/2026",
            },
          },
        }),
        responseStatus: 200,
        responseBody: '{"received": true, "status": "processed"}',
        success: true,
      },
      {
        id: "WHL-102",
        webhookId: "WH-DEMO-2",
        webhookName: "API Principal ERP Logística",
        webhookUrl: "https://api.erp-logistica.com.br/v1/webhook-status",
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        event: "status_changed",
        payload: JSON.stringify({
          event: "process.status_changed",
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          operator: "jorge.breu.mb@gmail.com",
          data: {
            registro: "REG-002",
            cliente: "Santos Logística Ltda",
            processo: "PR-2026/42",
            container: "SUDU1234567",
            oldStatus: "Pendente",
            newStatus: "Coletado",
            details: {
              registro: "REG-002",
              cliente: "Santos Logística Ltda",
              processo: "PR-2026/42",
              container: "SUDU1234567",
              tipoContainer: "40HQ",
              armador: "Hamburg Süd",
              motorista: "Wellington Correia Silva",
              status: "Coletado",
              valorFrete: "1400.00",
              dataCriado: "14/07/2026",
            },
          },
        }),
        responseStatus: "ERR_CONNECTION_REFUSED",
        responseBody:
          "Failed to connect to host api.erp-logistica.com.br port 443: Connection refused",
        success: false,
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem("webhooks_configs", JSON.stringify(webhooks));
  }, [webhooks]);

  useEffect(() => {
    localStorage.setItem("webhooks_delivery_logs", JSON.stringify(webhookLogs));
  }, [webhookLogs]);

  // Initialize Auth state
  useEffect(() => {
    setLoading(true);

    const isBypassed =
      localStorage.getItem("SISTEMA_LOGISTICA_BYPASS_AUTH") === "true";
    if (isBypassed) {
      const mockUser = {
        email: "operador@gestaologistica.com",
        displayName: "Operador Império Ecolog",
        photoURL: "",
      } as any;

      setUser(mockUser);
      setToken("mock_token");
      setNeedsAuth(false);

      findOrCreateSpreadsheet("mock_token")
        .then((sheetId) => {
          setSpreadsheetId(sheetId);
          return fetchSpreadsheetData("mock_token", sheetId);
        })
        .then((data) => {
          setDbState(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load local DB on startup:", err);
          setSyncStatus("error");
          setLoading(false);
        });
      return;
    }

    initAuth(
      async (firebaseUser, accessToken) => {
        setUser(firebaseUser);
        setToken(accessToken);
        setNeedsAuth(false);
        try {
          // Initialize DB
          const sheetId = await findOrCreateSpreadsheet(accessToken);
          setSpreadsheetId(sheetId);
          const data = await fetchSpreadsheetData(accessToken, sheetId);
          setDbState(data);
        } catch (err) {
          console.error("Failed to load Google Sheet DB on startup:", err);
          setSyncStatus("error");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setNeedsAuth(true);
        setLoading(false);
      },
    ).catch((err) => {
      console.error("Auth init failed:", err);
      setLoading(false);
    });
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      localStorage.setItem("SISTEMA_LOGISTICA_BYPASS_AUTH", "true");

      const mockUser = {
        email: "operador@gestaologistica.com",
        displayName: "Operador Império Ecolog",
        photoURL: "",
      } as any;

      setUser(mockUser);
      setToken("mock_token");
      setNeedsAuth(false);
      setLoading(true);

      const sheetId = await findOrCreateSpreadsheet("mock_token");
      setSpreadsheetId(sheetId);
      const data = await fetchSpreadsheetData("mock_token", sheetId);
      setDbState(data);
    } catch (err) {
      console.error("Login failed:", err);
    } finally {
      setIsLoggingIn(false);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("SISTEMA_LOGISTICA_BYPASS_AUTH");
    await logout();
    setUser(null);
    setToken(null);
    setSpreadsheetId(null);
    setNeedsAuth(true);
  };

  const handleOpenCreateModal = () => {
    setActiveTab("operacoes");
    setActiveSubTab("lista");
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("open-create-process-modal"));
    }, 100);
  };

  // Log write utility
  const writeLogEntry = async (action: string, changes: any = {}) => {
    if (!token || !spreadsheetId) return;
    const newLog: LogEntry = {
      id: `LOG-${Date.now()}`,
      userEmail: user?.email || "operador@gestaologistica.com",
      timestamp: new Date().toISOString(),
      action,
      changes: JSON.stringify(changes),
    };

    // Update locally
    setDbState((prev) => ({
      ...prev,
      logs: [newLog, ...prev.logs],
    }));

    try {
      await appendLog(token, spreadsheetId, newLog);
    } catch (err) {
      console.error("Failed to append log entry to Google Sheet:", err);
    }
  };

  // Generic helper to sync a sheet to the database in background
  const syncCategoryToDB = async (
    category: keyof DBState,
    updatedList: any[],
  ) => {
    if (!token || !spreadsheetId) return;
    setSyncStatus("syncing");
    try {
      await syncDBState(token, spreadsheetId, category, updatedList);
      setSyncStatus("synced");
      setLastSavedTime(new Date().toLocaleTimeString("pt-BR"));
    } catch (err) {
      console.error(`Sync failure for ${category}:`, err);
      setSyncStatus("error");
    }
  };

  // Database operations
  const handleAddProcess = async (newProcess: Processo) => {
    const updatedList = [newProcess, ...dbState.processos];
    setDbState((prev) => ({ ...prev, processos: updatedList }));
    await writeLogEntry(
      `Adicionou novo processo operacional ${newProcess.registro}`,
      newProcess,
    );
    await syncCategoryToDB("processos", updatedList);
  };

  const handleUpdateProcess = async (
    registro: string,
    updatedFields: Partial<Processo>,
  ) => {
    const target = dbState.processos.find((p) => p.registro === registro);
    if (!target) return;

    // Build changes mapping
    const changes: Record<string, { old: any; new: any }> = {};
    Object.keys(updatedFields).forEach((key) => {
      const field = key as keyof Processo;
      if (target[field] !== updatedFields[field]) {
        changes[field] = { old: target[field], new: updatedFields[field] };
      }
    });

    const updatedList = dbState.processos.map((p) =>
      p.registro === registro ? { ...p, ...updatedFields } : p,
    );

    setDbState((prev) => ({ ...prev, processos: updatedList }));
    await writeLogEntry(`Atualizou processo ${registro}`, changes);
    await syncCategoryToDB("processos", updatedList);

    // Disparar Webhooks se houver mudança de status
    if (updatedFields.status && updatedFields.status !== target.status) {
      triggerWebhooksForStatusChange(
        { ...target, ...updatedFields },
        target.status,
        updatedFields.status,
      );
    }
  };

  const handleDeleteProcess = async (registro: string) => {
    const confirmed = window.confirm(
      `Deseja realmente excluir o processo ${registro}? Esta ação não pode ser desfeita.`,
    );
    if (!confirmed) return;

    const target = dbState.processos.find((p) => p.registro === registro);
    const updatedList = dbState.processos.filter(
      (p) => p.registro !== registro,
    );
    setDbState((prev) => ({ ...prev, processos: updatedList }));
    await writeLogEntry(`Excluiu o processo operacional ${registro}`, target);
    await syncCategoryToDB("processos", updatedList);
  };

  const handleBulkImport = async (
    newProcesses: Processo[],
    newClientes: Cliente[],
    newPrestadores: PrestadorServico[],
  ) => {
    const updatedProcessos = [...newProcesses, ...dbState.processos];
    const updatedClientes = [...dbState.clientes, ...newClientes];
    const updatedPrestadores = [...dbState.prestadores, ...newPrestadores];

    setDbState((prev) => ({
      ...prev,
      processos: updatedProcessos,
      clientes: updatedClientes,
      prestadores: updatedPrestadores,
    }));

    await writeLogEntry(
      `Importação em Lote: ${newProcesses.length} processos, ${newClientes.length} novos clientes, ${newPrestadores.length} novos prestadores adicionados.`,
      {
        processosCount: newProcesses.length,
        clientesCount: newClientes.length,
      },
    );

    // Sync sequentially to the DB in background to be perfectly safe
    if (newProcesses.length > 0)
      await syncCategoryToDB("processos", updatedProcessos);
    if (newClientes.length > 0)
      await syncCategoryToDB("clientes", updatedClientes);
    if (newPrestadores.length > 0)
      await syncCategoryToDB("prestadores", updatedPrestadores);
  };

  const handleAddItem = async (category: keyof DBState, item: any) => {
    const list = dbState[category] as any[];
    const updatedList = [...list, item];

    setDbState((prev) => ({
      ...prev,
      [category]: updatedList,
    }));

    await writeLogEntry(`Adicionou cadastro em ${category}`, item);
    await syncCategoryToDB(category, updatedList);
  };

  const handleRemoveItem = async (
    category: keyof DBState,
    idField: string,
    idValue: string,
  ) => {
    const confirmed = window.confirm(
      `Deseja realmente remover este registro de ${category}?`,
    );
    if (!confirmed) return;

    const list = dbState[category] as any[];
    const itemToDelete = list.find((item) => item[idField] === idValue);
    const updatedList = list.filter((item) => item[idField] !== idValue);

    setDbState((prev) => ({
      ...prev,
      [category]: updatedList,
    }));

    await writeLogEntry(`Removeu registro de ${category}`, itemToDelete);
    await syncCategoryToDB(category, updatedList);
  };

  const handleUpdateItem = async (
    category: keyof DBState,
    idField: string,
    idValue: string,
    updatedItem: any,
  ) => {
    const list = dbState[category] as any[];
    const updatedList = list.map((item) =>
      item[idField] === idValue ? updatedItem : item,
    );

    setDbState((prev) => ({
      ...prev,
      [category]: updatedList,
    }));

    await writeLogEntry(`Atualizou cadastro em ${category}`, updatedItem);
    await syncCategoryToDB(category, updatedList);
  };

  const handleSaveModel = async (model: ModeloOCR) => {
    const exists = dbState.modelosOCR.some((m) => m.id === model.id);
    let updatedList: ModeloOCR[];

    if (exists) {
      updatedList = dbState.modelosOCR.map((m) =>
        m.id === model.id ? model : m,
      );
    } else {
      updatedList = [...dbState.modelosOCR, model];
    }

    setDbState((prev) => ({ ...prev, modelosOCR: updatedList }));
    await writeLogEntry(`Salvou modelo de OCR: ${model.name}`, model);
    await syncCategoryToDB("modelosOCR", updatedList);
  };

  const handleDeleteModel = async (modelId: string) => {
    const confirmed = window.confirm(
      "Deseja realmente excluir este modelo customizado de OCR?",
    );
    if (!confirmed) return;

    const target = dbState.modelosOCR.find((m) => m.id === modelId);
    const updatedList = dbState.modelosOCR.filter((m) => m.id !== modelId);

    setDbState((prev) => ({ ...prev, modelosOCR: updatedList }));
    await writeLogEntry(
      `Excluiu modelo customizado de OCR: ${target?.name || modelId}`,
      target,
    );
    await syncCategoryToDB("modelosOCR", updatedList);
  };

  // Webhooks Trigger Logic
  const triggerWebhooksForStatusChange = async (
    processo: Processo,
    oldStatus: string,
    newStatus: string,
  ) => {
    if (oldStatus === newStatus) return;

    const matchingWebhooks = webhooks.filter(
      (wh) =>
        wh.active &&
        (wh.events.includes("any") || wh.events.includes(newStatus)),
    );

    for (const wh of matchingWebhooks) {
      const payloadObj = {
        event: "process.status_changed",
        timestamp: new Date().toISOString(),
        operator: user?.email || "operador@gestaologistica.com",
        data: {
          registro: processo.registro,
          cliente: processo.cliente,
          processo: processo.processo,
          container: processo.container,
          oldStatus,
          newStatus,
          details: processo,
        },
      };

      const payloadStr = JSON.stringify(payloadObj);
      const logId = `WHL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      try {
        const response = await fetch(wh.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Secret": wh.secret,
            "X-Webhook-Signature": `sha256=${wh.secret}`,
          },
          body: payloadStr,
        });

        const responseText = await response.text();
        const success = response.ok;

        const newLog: WebhookDeliveryLog = {
          id: logId,
          webhookId: wh.id,
          webhookName: wh.nome,
          webhookUrl: wh.url,
          timestamp: new Date().toISOString(),
          event: "status_changed",
          payload: payloadStr,
          responseStatus: response.status,
          responseBody: responseText.substring(0, 500),
          success,
        };

        setWebhookLogs((prev) => [newLog, ...prev]);
      } catch (err: any) {
        const newLog: WebhookDeliveryLog = {
          id: logId,
          webhookId: wh.id,
          webhookName: wh.nome,
          webhookUrl: wh.url,
          timestamp: new Date().toISOString(),
          event: "status_changed",
          payload: payloadStr,
          responseStatus: err.name || "NetworkError",
          responseBody: err.message || "Erro de conexão/Rede (CORS)",
          success: false,
        };

        setWebhookLogs((prev) => [newLog, ...prev]);
      }
    }
  };

  const handleSaveWebhook = (wh: WebhookConfig) => {
    const exists = webhooks.some((w) => w.id === wh.id);
    if (exists) {
      setWebhooks((prev) => prev.map((w) => (w.id === wh.id ? wh : w)));
    } else {
      setWebhooks((prev) => [...prev, wh]);
    }
    writeLogEntry(`Salvou configuração do Webhook: ${wh.nome}`, wh);
  };

  const handleDeleteWebhook = (id: string) => {
    const target = webhooks.find((w) => w.id === id);
    const confirmed = window.confirm(
      `Deseja realmente excluir o webhook ${target?.nome || id}?`,
    );
    if (!confirmed) return;
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
    writeLogEntry(`Excluiu Webhook: ${target?.nome || id}`, target);
  };

  const handleTriggerTestWebhook = async (wh: WebhookConfig) => {
    const payloadObj = {
      event: "webhook.test_ping",
      timestamp: new Date().toISOString(),
      operator: user?.email || "operador@gestaologistica.com",
      data: {
        message:
          "Este é um disparo de teste para validar a integração do webhook.",
        system: "Enterprise Logistics Management ERP",
        version: "1.0.0",
        testUuid: Math.random().toString(36).substring(2, 15),
      },
    };

    const payloadStr = JSON.stringify(payloadObj);
    const logId = `WHL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    try {
      const response = await fetch(wh.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Secret": wh.secret,
          "X-Webhook-Signature": `sha256=${wh.secret}`,
        },
        body: payloadStr,
      });

      const responseText = await response.text();
      const success = response.ok;

      const newLog: WebhookDeliveryLog = {
        id: logId,
        webhookId: wh.id,
        webhookName: wh.nome,
        webhookUrl: wh.url,
        timestamp: new Date().toISOString(),
        event: "webhook.test_ping",
        payload: payloadStr,
        responseStatus: response.status,
        responseBody: responseText.substring(0, 500),
        success,
      };

      setWebhookLogs((prev) => [newLog, ...prev]);
    } catch (err: any) {
      const newLog: WebhookDeliveryLog = {
        id: logId,
        webhookId: wh.id,
        webhookName: wh.nome,
        webhookUrl: wh.url,
        timestamp: new Date().toISOString(),
        event: "webhook.test_ping",
        payload: payloadStr,
        responseStatus: err.name || "NetworkError",
        responseBody: err.message || "Falha de rede/CORS",
        success: false,
      };

      setWebhookLogs((prev) => [newLog, ...prev]);
    }
  };

  const handleRedeliverWebhook = async (log: WebhookDeliveryLog) => {
    const logId = `WHL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const wh = webhooks.find((w) => w.id === log.webhookId);
    const secret = wh?.secret || "whsec_unknown";

    try {
      const response = await fetch(log.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Secret": secret,
          "X-Webhook-Signature": `sha256=${secret}`,
        },
        body: log.payload,
      });

      const responseText = await response.text();
      const success = response.ok;

      const newLog: WebhookDeliveryLog = {
        id: logId,
        webhookId: log.webhookId,
        webhookName: log.webhookName,
        webhookUrl: log.webhookUrl,
        timestamp: new Date().toISOString(),
        event: log.event,
        payload: log.payload,
        responseStatus: response.status,
        responseBody: responseText.substring(0, 500),
        success,
      };

      setWebhookLogs((prev) => [newLog, ...prev]);
    } catch (err: any) {
      const newLog: WebhookDeliveryLog = {
        id: logId,
        webhookId: log.webhookId,
        webhookName: log.webhookName,
        webhookUrl: log.webhookUrl,
        timestamp: new Date().toISOString(),
        event: log.event,
        payload: log.payload,
        responseStatus: err.name || "NetworkError",
        responseBody: err.message || "Falha de rede/CORS ao reenviar",
        success: false,
      };

      setWebhookLogs((prev) => [newLog, ...prev]);
    }
  };

  // OCR Complete mapping trigger
  const handleOCRComplete = (ocrResult: OCRResult, fileName: string) => {
    // Look for matching model or standard models
    let mappedFields: Record<string, string> = {};

    // Standard OCR model configurations mapping
    if (ocrResult.documentType === "AGENDAMENTO") {
      mappedFields = {
        motorista: ocrResult.fields.motorista || "",
        veiculo: ocrResult.fields.veiculo || "",
        dataRetirada: ocrResult.fields.dataAgendamento || "",
        horaRetirada: ocrResult.fields.horarioRetirada || "",
      };
    } else if (ocrResult.documentType === "DUIMP") {
      mappedFields = {
        processo: ocrResult.fields.taie || "",
        container: ocrResult.fields.container || "",
        terminal: ocrResult.fields.terminal || "",
        observacoes: `DUIMP TAIE: ${ocrResult.fields.taie || ""}. B/L: ${ocrResult.fields.bl || ""}. Navio: ${ocrResult.fields.navio || ""}. Weight: ${ocrResult.fields.pesoBruto || ""}. NIC: ${ocrResult.fields.nic || ""}.`,
      };
    } else if (ocrResult.documentType === "PEDIDO_DE_COLETA") {
      mappedFields = {
        cliente: ocrResult.fields.cliente || "",
        processo: ocrResult.fields.processo || "",
        container: ocrResult.fields.container || "",
        transportadora: ocrResult.fields.transportadora || "",
        terminal: ocrResult.fields.terminal || "",
        motorista: ocrResult.fields.motorista || "",
        veiculo: ocrResult.fields.veiculo || "",
        dataRetirada: ocrResult.fields.dataColeta || "",
        horaRetirada: ocrResult.fields.horarioColeta || "",
      };
    } else if (ocrResult.documentType === "NOTA_FISCAL") {
      mappedFields = {
        processo: ocrResult.fields.numeroNota || "",
        cliente: ocrResult.fields.emitente || "",
        valorFrete: ocrResult.fields.valorTotal || "0.00",
        observacoes: `DANFE NF-e Nº: ${ocrResult.fields.numeroNota || ""}. Chave: ${ocrResult.fields.chaveAcesso || ""}. Emitente: ${ocrResult.fields.emitente || ""}. Valor Total: R$ ${ocrResult.fields.valorTotal || ""}.`,
      };
    } else if (ocrResult.documentType === "BILL_OF_LADING") {
      mappedFields = {
        processo: ocrResult.fields.bl || "",
        container: ocrResult.fields.container || "",
        observacoes: `B/L Nº: ${ocrResult.fields.bl || ""}. Navio: ${ocrResult.fields.navio || ""}. Porto Origem: ${ocrResult.fields.portoOrigem || ""}. Destino: ${ocrResult.fields.portoDestino || ""}. Importador: ${ocrResult.fields.importador || ""}.`,
      };
    } else {
      // Dynamic mapping for Custom Models
      const matchedModel = dbState.modelosOCR.find(
        (m) => m.id === ocrResult.documentType,
      );
      if (matchedModel) {
        matchedModel.fields.forEach((field) => {
          const extractedVal = ocrResult.fields[field.key];
          if (extractedVal) {
            mappedFields[field.mapping] = extractedVal;
          }
        });
      }
    }

    setOcrAutoFillAlert({
      documentType: ocrResult.documentType,
      fields: mappedFields,
      fileName,
    });

    writeLogEntry(
      `Realizou OCR no arquivo "${fileName}". Tipo Identificado: ${ocrResult.documentType}`,
      ocrResult.fields,
    );
  };

  const handleOpenRowUploadModal = (registroId: string) => {
    setSelectedProcessoId(registroId);
    setIsRowUploadModalOpen(true);
  };

  const handleOCRCompleteWithTarget = async (
    registroId: string,
    tipoDocumental: string,
    ocrResult: OCRResult,
    fileName: string,
  ) => {
    const targetProcess = dbState.processos.find(
      (p) => p.registro === registroId,
    );
    if (!targetProcess) return;

    // Create / Update document status array
    const currentDocs = targetProcess.documentos
      ? [...targetProcess.documentos]
      : [];
    const docIndex = currentDocs.findIndex(
      (d) => d.tipoDocumental === tipoDocumental,
    );
    const docId =
      docIndex >= 0 ? currentDocs[docIndex].id : `doc-${Date.now()}`;

    const docItem = {
      id: docId,
      tipoDocumental: tipoDocumental as any,
      nomeArquivo: fileName,
      status: "sucesso" as const,
      dataUpload: new Date().toLocaleDateString("pt-BR"),
      dadosExtraidos: ocrResult.fields,
    };

    if (docIndex >= 0) {
      currentDocs[docIndex] = docItem;
    } else {
      currentDocs.push(docItem);
    }

    // Map extracted fields into the process fields directly!
    const updatedFields: Partial<Processo> = {
      documentos: currentDocs,
    };

    if (tipoDocumental === "AGENDAMENTO") {
      if (ocrResult.fields.motorista)
        updatedFields.motorista = ocrResult.fields.motorista;
      if (ocrResult.fields.veiculo)
        updatedFields.veiculo = ocrResult.fields.veiculo;
      if (ocrResult.fields.dataAgendamento)
        updatedFields.dataRetirada = ocrResult.fields.dataAgendamento;
      if (ocrResult.fields.horarioRetirada)
        updatedFields.horaRetirada = ocrResult.fields.horarioRetirada;
    } else if (tipoDocumental === "DUIMP") {
      if (ocrResult.fields.taie) updatedFields.processo = ocrResult.fields.taie;
      if (ocrResult.fields.container)
        updatedFields.container = ocrResult.fields.container;
      if (ocrResult.fields.terminal)
        updatedFields.terminal = ocrResult.fields.terminal;
    } else if (tipoDocumental === "NOTA_FISCAL") {
      if (ocrResult.fields.numeroNota)
        updatedFields.processo = ocrResult.fields.numeroNota;
      if (ocrResult.fields.emitente)
        updatedFields.cliente = ocrResult.fields.emitente;
      if (ocrResult.fields.valorTotal)
        updatedFields.valorCarregamento = ocrResult.fields.valorTotal;
    } else if (tipoDocumental === "BILL_OF_LADING") {
      if (ocrResult.fields.bl) updatedFields.processo = ocrResult.fields.bl;
      if (ocrResult.fields.container)
        updatedFields.container = ocrResult.fields.container;
    }

    // Save and Sync!
    await handleUpdateProcess(registroId, updatedFields);

    // Add pending documents list tracking
    const newPendingItem: DocumentoPendente = {
      id: `dp-${Date.now()}`,
      fileName,
      documentType: tipoDocumental,
      confidence: ocrResult.confidence,
      extractedFields: ocrResult.fields,
      timestamp: new Date().toISOString(),
    };

    setDocumentosPendentes((prev) => {
      const updated = [newPendingItem, ...prev];
      localStorage.setItem("documentos_pendentes_ocr", JSON.stringify(updated));
      return updated;
    });

    writeLogEntry(
      `Vinculou documento ${tipoDocumental} (${fileName}) ao Processo ${registroId}`,
      ocrResult.fields,
    );
  };

  // Apply OCR autofilled values as a new process
  const applyOCRFieldsToProcess = () => {
    if (!ocrAutoFillAlert) return;

    // Verificação de duplicidades nos dados lidos via OCR
    const containerNo = ocrAutoFillAlert.fields.container?.trim().toUpperCase();
    const processoNo = ocrAutoFillAlert.fields.processo?.trim().toUpperCase();
    let duplicateWarnings = "";

    if (containerNo) {
      const duplicateC = dbState.processos.find(
        (p) => p.container.trim().toUpperCase() === containerNo,
      );
      if (duplicateC) {
        duplicateWarnings += `• O Contêiner "${containerNo}" já existe no registro "${duplicateC.registro}" (Cliente: ${duplicateC.cliente}).\n`;
      }
    }
    if (processoNo) {
      const duplicateP = dbState.processos.find(
        (p) => p.processo.trim().toUpperCase() === processoNo,
      );
      if (duplicateP) {
        duplicateWarnings += `• O Nº de Processo "${processoNo}" já existe no registro "${duplicateP.registro}" (Cliente: ${duplicateP.cliente}).\n`;
      }
    }

    if (duplicateWarnings) {
      const confirmSave = window.confirm(
        `Aviso de Duplicidade Detectada via OCR:\n\n${duplicateWarnings}\nDeseja prosseguir e cadastrar este novo registro logístico mesmo assim?`,
      );
      if (!confirmSave) return;
    }

    // Garante ID de registro incremental seguro sem duplicidades de chave primária
    let regIndex = dbState.processos.length + 1;
    let nextRegId = `REG-${String(regIndex).padStart(3, "0")}`;
    while (dbState.processos.some((p) => p.registro === nextRegId)) {
      regIndex++;
      nextRegId = `REG-${String(regIndex).padStart(3, "0")}`;
    }

    const newProcess: Processo = {
      registro: nextRegId,
      cliente: ocrAutoFillAlert.fields.cliente || "",
      processo: ocrAutoFillAlert.fields.processo || "",
      container: ocrAutoFillAlert.fields.container || "",
      tipoContainer: ocrAutoFillAlert.fields.tipoContainer || "40HQ",
      armador: ocrAutoFillAlert.fields.armador || "",
      motorista: ocrAutoFillAlert.fields.motorista || "",
      veiculo: ocrAutoFillAlert.fields.veiculo || "",
      transportadora: ocrAutoFillAlert.fields.transportadora || "",
      valorFrete: ocrAutoFillAlert.fields.valorFrete || "0.00",
      dataRetirada: ocrAutoFillAlert.fields.dataRetirada || "",
      horaRetirada: ocrAutoFillAlert.fields.horaRetirada || "",
      dataEntrega: ocrAutoFillAlert.fields.dataEntrega || "",
      horaEntrega: ocrAutoFillAlert.fields.horaEntrega || "",
      dataDevolucao: ocrAutoFillAlert.fields.dataDevolucao || "",
      horaDevolucao: ocrAutoFillAlert.fields.horaDevolucao || "",
      entregaVazio: ocrAutoFillAlert.fields.entregaVazio || "Pendente",
      terminal: ocrAutoFillAlert.fields.terminal || "",
      status: "Agendado",
      observacoes:
        ocrAutoFillAlert.fields.observacoes ||
        `Processado automaticamente via OCR de ${ocrAutoFillAlert.fileName}`,
      valorCarregamento: ocrAutoFillAlert.fields.valorCarregamento || "0.00",
      motoristaPago: ocrAutoFillAlert.fields.motoristaPago || "Não",
      valorPagoMotorista: ocrAutoFillAlert.fields.valorPagoMotorista || "0.00",
      dataCriado: new Date().toLocaleDateString("pt-BR"),
    };

    handleAddProcess(newProcess);
    setOcrAutoFillAlert(null);
    setActiveTab("dashboard");
    alert(
      `Processo ${nextRegId} criado automaticamente com as informações extraídas do OCR!`,
    );
  };

  return (
    <div
      className={`${darkMode ? "dark" : ""} min-h-screen bg-[#f5f7fa] dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 flex transition-colors duration-200`}
    >
      {/* AUTH REQUIRED VIEW */}
      {needsAuth ? (
        <div className="flex-1 min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0b0c10] text-white select-none">
          {/* Full-Page Background Image of Logistics with smooth entrance zoom/fade */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80"
              alt="Logística Integrada e Tecnologia"
              className="w-full h-full object-cover select-none pointer-events-none opacity-45 scale-105 animate-[pulse_15s_ease-in-out_infinite]"
              referrerPolicy="no-referrer"
            />
            {/* Ice Blue & Deep Charcoal Overlay for contrast and professional look */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0b0c10] via-[#0b0c10]/85 to-transparent pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-[#121212]/30 via-[#0b0c10]/90 to-[#0b0c10] pointer-events-none"></div>
          </div>

          {/* Animated decorative grid overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:32px_32px] opacity-70 pointer-events-none z-0"></div>

          {/* Subtle floating ambient glow lights */}
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none z-0 animate-pulse duration-5000"></div>
          <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none z-0 animate-pulse duration-7000"></div>

          {/* Glassmorphic Login Card */}
          <div className="w-full max-w-sm mx-4 bg-black/45 backdrop-blur-xl border border-white/10 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 transition-all hover:border-white/15 animate-fadeIn space-y-6">
            {/* Top Operational Status and Theme Switcher */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 px-2.5 py-1 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-[9px] font-black tracking-widest text-slate-300 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Servidor Ativo</span>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-150"
                title="Alternar tema de contraste"
              >
                {darkMode ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-300" />
                )}
              </button>
            </div>

            {/* Brand Logo & Presentation */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-[#121212]/90 flex flex-col items-center justify-center shadow-xl border border-white/10 group hover:scale-105 hover:border-white/20 transition-transform duration-300">
                <span className="font-extrabold text-[8px] text-slate-400 tracking-[0.2em] leading-none">
                  IMPÉRIO
                </span>
                <span className="font-black text-base tracking-tighter leading-none mt-2">
                  <span className="text-white">ECO</span>
                  <span className="text-red-500">LOG</span>
                </span>
              </div>

              <div className="space-y-1.5">
                <h1 className="text-3xl font-black tracking-tight text-white uppercase leading-none">
                  Império Ecolog
                </h1>
                <p className="text-[11px] font-bold text-red-500 tracking-[0.2em] uppercase">
                  LIGANDO VOCÊ AO FUTURO
                </p>
              </div>
            </div>

            {/* Login Action Area */}
            <div className="space-y-4 pt-2">
              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-white hover:bg-[#ebf0f5] disabled:bg-slate-300 disabled:cursor-not-allowed text-slate-900 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-xl hover:shadow-white/5 active:scale-98 transition-all duration-150 border border-slate-200"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar</span>
                    <ArrowRight className="w-4 h-4 text-slate-900" />
                  </>
                )}
              </button>

              {/* Encryption & cloud details */}
              <div className="flex items-start gap-2.5 p-3 bg-white/5 border border-white/10 rounded-xl">
                <Clock className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-300 font-semibold leading-normal">
                  Sincronização em tempo real e persistência segura diretamente
                  no Google Sheets corporativo.
                </p>
              </div>
            </div>

            {/* Card Footer info */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5 text-[9px] text-slate-500 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <Cloud className="w-3 h-3 text-sky-500" />
                Google Cloud Security
              </span>
              <span>v2.8.2</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* MAIN CONTAINER (HEADER + WORKSPACE PANEL) */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* FIXED TOP SLIM HEADER */}
            <Header
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              activeSubTab={activeSubTab}
              setActiveSubTab={setActiveSubTab}
              globalSearchTerm={globalSearchTerm}
              onSearchChange={setGlobalSearchTerm}
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
              user={user}
              onLogout={handleLogout}
              onOpenCreateModal={handleOpenCreateModal}
              onOpenLogModal={() => setLogOpen(true)}
              onOpenAuditLogsModal={() => setIsAuditLogsModalOpen(true)}
              syncStatus={syncStatus}
              spreadsheetId={spreadsheetId}
              logs={dbState.logs}
            />

            {/* SCROLLABLE MAIN CONTENT AREA */}
            <main className="flex-1 w-full mx-auto flex flex-col print:p-0 overflow-y-auto relative bg-[#0B0C10]">
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                  <div className="relative w-16 h-16 mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-zinc-900 border-t-red-600 animate-spin" />
                  </div>
                  <h3 className="text-sm font-black text-white tracking-widest uppercase">
                    Estabilizando Conexão
                  </h3>
                  <p className="text-[10px] font-semibold text-zinc-500 tracking-wider uppercase mt-1">
                    Sincronizando registros do Google Sheets...
                  </p>
                </div>
              ) : (
                <div className="flex-1 p-6 flex flex-col gap-6 relative min-h-0">
                  {/* OCR AUTO-FILL ALERT BANNER */}
                  {ocrAutoFillAlert && (
                    <div className="p-4 bg-zinc-950 border border-red-500/20 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-[bounce_1s_infinite_alternate] print:hidden">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-600 rounded-lg text-white">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-white">
                            Dados Extraídos com OCR Inteligente!
                          </h4>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            Identificamos um documento do tipo{" "}
                            <strong className="uppercase text-red-500">
                              {ocrAutoFillAlert.documentType}
                            </strong>{" "}
                            no arquivo{" "}
                            <strong>{ocrAutoFillAlert.fileName}</strong>. Deseja
                            aplicar os dados e criar um novo registro
                            operacional?
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <button
                          onClick={() => setOcrAutoFillAlert(null)}
                          className="py-1 px-3 border border-zinc-800 text-zinc-400 font-bold text-[11px] rounded-lg hover:bg-zinc-900 transition-all cursor-pointer"
                        >
                          Descartar
                        </button>
                        <button
                          onClick={applyOCRFieldsToProcess}
                          className="py-1 px-3 bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] rounded-lg transition-all shadow-sm cursor-pointer"
                        >
                          Aplicar e Salvar Registro
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SMOOTH ANIMATED TAB CHANGER CONTAINER */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="flex-1 flex flex-col min-h-0"
                      >
                        {/* SINGLE WORKSPACE ERP INTEGRATION */}
                        {activeTab === "operacoes" && (
                          <div className="flex-1 flex min-h-0 relative overflow-hidden">
                            {/* Left/Main Workspace Area */}
                            <div className="flex-1 flex flex-col min-h-0 min-w-0">
                              {/* Center Sub-tab Views Content Area */}
                              <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                                <AnimatePresence mode="wait">
                                  <motion.div
                                    key={activeSubTab}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.15 }}
                                    className="h-full flex flex-col min-h-0"
                                  >
                                    {/* SUB-TAB: DASHBOARD */}
                                    {activeSubTab === "dashboard" && (
                                      <div className="space-y-6 flex-1 min-h-0 overflow-y-auto pb-8">
                                        <KPIIndicators
                                          processos={dbState.processos}
                                        />

                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                          {/* Cargas por Status Progress Card */}
                                          <div className="lg:col-span-2 p-5 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col justify-between">
                                            <div>
                                              <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                                                  <TrendingUp className="w-4 h-4 text-red-500" />
                                                  Cargas por Status Operacional
                                                </h4>
                                                <span className="text-[10px] font-mono text-zinc-500">
                                                  Última atualização:{" "}
                                                  {lastSavedTime}
                                                </span>
                                              </div>
                                              <div className="space-y-3.5">
                                                {[
                                                  {
                                                    status:
                                                      "Aguardando Desatracação",
                                                    color: "bg-amber-500",
                                                  },
                                                  {
                                                    status:
                                                      "Em Trânsito Rodoviário",
                                                    color: "bg-blue-500",
                                                  },
                                                  {
                                                    status:
                                                      "Faturamento Pendente",
                                                    color: "bg-purple-500",
                                                  },
                                                  {
                                                    status: "Finalizado",
                                                    color: "bg-emerald-500",
                                                  },
                                                ].map((item) => {
                                                  const count =
                                                    dbState.processos.filter(
                                                      (p) =>
                                                        p.status ===
                                                        item.status,
                                                    ).length;
                                                  const total =
                                                    dbState.processos.length ||
                                                    1;
                                                  const percentage = Math.round(
                                                    (count / total) * 100,
                                                  );
                                                  return (
                                                    <div
                                                      key={item.status}
                                                      className="space-y-1"
                                                    >
                                                      <div className="flex items-center justify-between text-[11px]">
                                                        <span className="font-bold text-zinc-300">
                                                          {item.status}
                                                        </span>
                                                        <span className="font-mono text-zinc-400 font-bold">
                                                          {count} ({percentage}
                                                          %)
                                                        </span>
                                                      </div>
                                                      <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                                                        <div
                                                          className={`h-full ${item.color} transition-all duration-1000`}
                                                          style={{
                                                            width: `${percentage}%`,
                                                          }}
                                                        />
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-zinc-900 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                                              <span>Banco de Dados: Ativo</span>
                                              <span>
                                                Total de Processos Rastreados:{" "}
                                                {dbState.processos.length}
                                              </span>
                                            </div>
                                          </div>

                                          {/* Recent Operational Logs Widget */}
                                          <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col justify-between">
                                            <div>
                                              <h4 className="text-xs font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                                <History className="w-4 h-4 text-red-500" />
                                                Monitor de Atividades
                                              </h4>
                                              <div className="space-y-3.5">
                                                {dbState.logs
                                                  .slice(0, 5)
                                                  .map((log, index) => (
                                                    <div
                                                      key={index}
                                                      className="text-[11px] leading-relaxed border-l-2 border-zinc-800 pl-3"
                                                    >
                                                      <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 mb-0.5">
                                                        <span>
                                                          {log.userEmail}
                                                        </span>
                                                        <span>
                                                          {log.timestamp
                                                            .split("T")[1]
                                                            ?.slice(0, 5) ||
                                                            log.timestamp}
                                                        </span>
                                                      </div>
                                                      <p className="text-zinc-300 font-medium line-clamp-2">
                                                        {log.action}
                                                      </p>
                                                    </div>
                                                  ))}
                                                {dbState.logs.length === 0 && (
                                                  <div className="text-center py-6">
                                                    <p className="text-xs text-zinc-500">
                                                      Nenhuma atividade recente
                                                      registrada.
                                                    </p>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                            <button
                                              onClick={() =>
                                                setActiveSubTab("auditoria")
                                              }
                                              className="w-full mt-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl border border-zinc-800 transition-all cursor-pointer"
                                            >
                                              Ver Log de Auditoria Completo
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* SUB-TAB: LISTA DE PROCESSOS */}
                                    {activeSubTab === "lista" && (
                                      <div className="space-y-6 flex-1 min-h-0">
                                        <ProcessTable
                                          processos={dbState.processos}
                                          onUpdateProcess={handleUpdateProcess}
                                          onAddProcess={handleAddProcess}
                                          onDeleteProcess={handleDeleteProcess}
                                          clientes={dbState.clientes}
                                          prestadores={dbState.prestadores}
                                          transportadoras={
                                            dbState.transportadoras
                                          }
                                          armadores={dbState.armadores}
                                          terminais={dbState.terminais}
                                          externalSearchQuery={globalSearchTerm}
                                          onOpenUploadModal={
                                            handleOpenRowUploadModal
                                          }
                                          onSelectProcess={(p) =>
                                            setSelectedContextItem({
                                              type: "processo",
                                              id: p.registro,
                                            })
                                          }
                                          selectedProcessoId={
                                            selectedContextItem?.type ===
                                            "processo"
                                              ? selectedContextItem.id
                                              : null
                                          }
                                          darkMode={darkMode}
                                          logs={dbState.logs}
                                          isTableFullscreen={isTableFullscreen}
                                          onToggleFullscreen={() =>
                                            setIsTableFullscreen(
                                              !isTableFullscreen,
                                            )
                                          }
                                        />

                                        <div className="pt-4 border-t border-zinc-900">
                                          <h3 className="text-xs font-black uppercase text-zinc-400 mb-4 tracking-widest">
                                            Painéis Avançados
                                          </h3>
                                          <UnifiedWorkspace
                                            dbState={dbState}
                                            webhooks={webhooks}
                                            webhookLogs={webhookLogs}
                                            documentosPendentes={
                                              documentosPendentes
                                            }
                                            setDocumentosPendentes={
                                              setDocumentosPendentes
                                            }
                                            onAddItem={handleAddItem}
                                            onRemoveItem={handleRemoveItem}
                                            onUpdateItem={handleUpdateItem}
                                            onSaveModel={handleSaveModel}
                                            onDeleteModel={handleDeleteModel}
                                            onAddProcess={handleAddProcess}
                                            onUpdateProcess={
                                              handleUpdateProcess
                                            }
                                            onSaveWebhook={handleSaveWebhook}
                                            onDeleteWebhook={
                                              handleDeleteWebhook
                                            }
                                            onTriggerTestWebhook={
                                              handleTriggerTestWebhook
                                            }
                                            onRedeliverWebhook={
                                              handleRedeliverWebhook
                                            }
                                            onClearLogs={() =>
                                              setWebhookLogs([])
                                            }
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {/* SUB-TAB: KANBAN VIEW */}
                                    {activeSubTab === "kanban" && (
                                      <KanbanView
                                        dbState={dbState}
                                        webhooks={webhooks}
                                        webhookLogs={webhookLogs}
                                        onUpdateProcess={handleUpdateProcess}
                                        onUpdateWebhook={(whId, updated) => {
                                          const wh = webhooks.find(
                                            (w) => w.id === whId,
                                          );
                                          if (wh) {
                                            handleSaveWebhook({
                                              ...wh,
                                              ...updated,
                                            });
                                          }
                                        }}
                                        onWriteLog={writeLogEntry}
                                      />
                                    )}

                                    {/* SUB-TAB: GRID VIEW */}
                                    {activeSubTab === "grid" && (
                                      <GridView
                                        processos={dbState.processos}
                                        onViewProcess={(p) => {
                                          setSelectedContextItem({
                                            type: "processo",
                                            id: p.registro,
                                          });
                                        }}
                                      />
                                    )}

                                    {/* SUB-TAB: CLIENTES */}
                                    {activeSubTab === "clientes" && (
                                      <CadastrosPanel
                                        dbState={dbState}
                                        onAddItem={handleAddItem}
                                        onRemoveItem={handleRemoveItem}
                                        onUpdateItem={handleUpdateItem}
                                        defaultActiveTab="clientes"
                                        onSelectCliente={(c) =>
                                          setSelectedContextItem({
                                            type: "cliente",
                                            id: c.nome,
                                          })
                                        }
                                      />
                                    )}

                                    {/* SUB-TAB: MOTORISTAS */}
                                    {activeSubTab === "motoristas" && (
                                      <CadastrosPanel
                                        dbState={dbState}
                                        onAddItem={handleAddItem}
                                        onRemoveItem={handleRemoveItem}
                                        onUpdateItem={handleUpdateItem}
                                        defaultActiveTab="prestadores"
                                        onSelectMotorista={(m) =>
                                          setSelectedContextItem({
                                            type: "motorista",
                                            id: m.nome,
                                          })
                                        }
                                      />
                                    )}

                                    {/* SUB-TAB: CENTRAL DE DOCUMENTOS & OCR / RELATÓRIO DE CARREGAMENTOS */}
                                    {activeSubTab === "relatorios" && (
                                      <div className="space-y-6 flex-1 min-h-0">
                                        {/* Sub-tab selection bar for Reports */}
                                        <div className="flex border-b border-zinc-900 pb-px gap-2 select-none">
                                          <button
                                            onClick={() =>
                                              setReportsSubSection(
                                                "carregamentos",
                                              )
                                            }
                                            className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                                              reportsSubSection ===
                                              "carregamentos"
                                                ? "text-red-500 border-red-500"
                                                : "text-zinc-500 border-transparent hover:text-zinc-300"
                                            }`}
                                          >
                                            Relatório de Carregamentos (360)
                                          </button>
                                          <button
                                            onClick={() =>
                                              setReportsSubSection("ocr")
                                            }
                                            className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                                              reportsSubSection === "ocr"
                                                ? "text-red-500 border-red-500"
                                                : "text-zinc-500 border-transparent hover:text-zinc-300"
                                            }`}
                                          >
                                            Central de OCR & Documentos
                                          </button>
                                        </div>

                                        {reportsSubSection ===
                                        "carregamentos" ? (
                                          <RelatorioCarregamentosPanel
                                            dbState={dbState}
                                            onBulkImport={handleBulkImport}
                                          />
                                        ) : (
                                          <>
                                            <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl">
                                              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">
                                                Central de Documentos OCR
                                                Pendentes
                                              </h3>
                                              <p className="text-[11px] text-zinc-500 mb-4">
                                                Verifique abaixo a lista de
                                                documentos extraídos via OCR
                                                inteligência com nível de
                                                certeza para importação direta
                                                no faturamento.
                                              </p>

                                              <div className="space-y-3">
                                                {documentosPendentes.map(
                                                  (doc) => (
                                                    <div
                                                      key={doc.id}
                                                      className="p-4 bg-zinc-900 border border-zinc-850 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                                                    >
                                                      <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                          <span className="px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 text-[9px] font-bold uppercase tracking-wider rounded-md">
                                                            {doc.tipo}
                                                          </span>
                                                          <span className="text-xs font-bold text-white">
                                                            {doc.fileName}
                                                          </span>
                                                        </div>
                                                        <div className="text-[10px] text-zinc-400 font-mono space-x-3">
                                                          <span>
                                                            Confiança:{" "}
                                                            <strong className="text-emerald-500">
                                                              {doc.confianca}%
                                                            </strong>
                                                          </span>
                                                          <span>
                                                            Campos:{" "}
                                                            <strong>
                                                              {
                                                                Object.keys(
                                                                  doc.camposExtraidos,
                                                                ).length
                                                              }{" "}
                                                              extraídos
                                                            </strong>
                                                          </span>
                                                          <span>
                                                            Criado em:{" "}
                                                            <strong>
                                                              {new Date(
                                                                doc.dataUpload,
                                                              ).toLocaleDateString(
                                                                "pt-BR",
                                                              )}
                                                            </strong>
                                                          </span>
                                                        </div>
                                                      </div>
                                                      <div className="flex items-center gap-2">
                                                        <button
                                                          onClick={() => {
                                                            setOcrAutoFillAlert(
                                                              {
                                                                documentType:
                                                                  doc.tipo,
                                                                fields:
                                                                  doc.camposExtraidos,
                                                                fileName:
                                                                  doc.fileName,
                                                              },
                                                            );
                                                            setDocumentosPendentes(
                                                              (prev) =>
                                                                prev.filter(
                                                                  (d) =>
                                                                    d.id !==
                                                                    doc.id,
                                                                ),
                                                            );
                                                          }}
                                                          className="py-1 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-[11px] rounded-lg transition-all cursor-pointer"
                                                        >
                                                          Validar e Carregar
                                                        </button>
                                                        <button
                                                          onClick={() =>
                                                            setDocumentosPendentes(
                                                              (prev) =>
                                                                prev.filter(
                                                                  (d) =>
                                                                    d.id !==
                                                                    doc.id,
                                                                ),
                                                            )
                                                          }
                                                          className="py-1 px-3 bg-zinc-950 hover:bg-red-950/20 text-zinc-500 hover:text-red-500 font-bold text-[11px] border border-zinc-850 rounded-lg transition-all cursor-pointer"
                                                        >
                                                          Excluir
                                                        </button>
                                                      </div>
                                                    </div>
                                                  ),
                                                )}
                                                {documentosPendentes.length ===
                                                  0 && (
                                                  <div className="text-center py-8 border border-dashed border-zinc-850 rounded-xl">
                                                    <FileText className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                                                    <p className="text-xs font-semibold text-zinc-500">
                                                      Nenhum documento
                                                      aguardando validação
                                                      manual.
                                                    </p>
                                                  </div>
                                                )}
                                              </div>
                                            </div>

                                            <ArmadorPortals
                                              armadores={dbState.armadores}
                                            />
                                          </>
                                        )}
                                      </div>
                                    )}

                                    {/* SUB-TAB: COMPLIANCE & AUDITORIA */}
                                    {activeSubTab === "auditoria" && (
                                      <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col items-center text-center justify-center py-12 max-w-3xl mx-auto w-full">
                                        <div className="w-16 h-16 rounded-full bg-red-600/10 border border-red-500/20 text-red-500 flex items-center justify-center mb-4">
                                          <ShieldCheck className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-base font-black text-white uppercase tracking-wider mb-2">
                                          Central de Auditoria, Compliance &
                                          Logs
                                        </h3>
                                        <p className="text-xs text-zinc-400 max-w-lg mb-6 leading-relaxed">
                                          Histórico criptograficamente seguro e
                                          indexado de cada ação operacional
                                          realizada. Garanta total
                                          rastreabilidade sobre cadastros,
                                          sincronizações com Google Sheets e
                                          disparos de OCR.
                                        </p>

                                        <button
                                          onClick={() =>
                                            setIsAuditLogsModalOpen(true)
                                          }
                                          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
                                        >
                                          <History className="w-4 h-4" />
                                          Abrir Console de Auditoria Secreta
                                        </button>

                                        <div className="grid grid-cols-2 gap-4 w-full max-w-md mt-10 text-left border-t border-zinc-900 pt-6">
                                          <div className="p-3 bg-zinc-900/40 rounded-lg">
                                            <span className="text-[9px] font-mono text-zinc-500 block">
                                              SISTEMA INTEGRADO
                                            </span>
                                            <span className="text-xs font-bold text-zinc-300">
                                              Google Cloud API
                                            </span>
                                          </div>
                                          <div className="p-3 bg-zinc-900/40 rounded-lg">
                                            <span className="text-[9px] font-mono text-zinc-500 block">
                                              TOTAL DE ENTRADAS
                                            </span>
                                            <span className="text-xs font-bold text-zinc-300 font-mono">
                                              {dbState.logs.length} eventos
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </motion.div>
                                </AnimatePresence>
                              </div>
                            </div>

                            {/* Right Contextual Detailed Side Panel (Monday.com style) */}
                            <AnimatePresence mode="wait">
                              {selectedContextItem && (
                                <ContextPanel
                                  selectedItem={selectedContextItem}
                                  onClose={() => setSelectedContextItem(null)}
                                  dbState={dbState}
                                  onUpdateProcess={handleUpdateProcess}
                                  onOpenUploadModal={handleOpenRowUploadModal}
                                />
                              )}
                            </AnimatePresence>
                          </div>
                        )}

                        {/* CONFIGURAÇÕES PANEL */}
                        {activeTab === "configuracoes" && (
                          <div className="space-y-6 flex-1 min-h-0 overflow-y-auto pb-8">
                            <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl">
                              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">
                                Engenharia de Conexões e Modelagem
                              </h3>
                              <p className="text-[11px] text-zinc-500 mb-6">
                                Administre as regras avançadas de extração por
                                OCR e os Webhooks assíncronos configurados para
                                disparos em tempo real.
                              </p>

                              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                {/* Left OCR configs */}
                                <div className="space-y-4">
                                  <div className="p-3 bg-zinc-900 border border-zinc-850 rounded-xl">
                                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest block mb-1">
                                      OCR Inteligente
                                    </span>
                                    <h4 className="text-xs font-black text-white uppercase">
                                      Modelagem de Documentos
                                    </h4>
                                  </div>
                                  <RegrasExtracaoPage
                                    modelos={dbState.modelosOCR}
                                    onSaveModel={async (model) =>
                                      handleSaveModel(model)
                                    }
                                    onDeleteModel={async (id) =>
                                      handleDeleteModel(id)
                                    }
                                    processos={dbState.processos}
                                    onAddProcess={async (p) =>
                                      handleAddProcess(p)
                                    }
                                    onUpdateProcess={async (reg, fields) =>
                                      handleUpdateProcess(reg, fields)
                                    }
                                    documentosPendentes={documentosPendentes}
                                    setDocumentosPendentes={
                                      setDocumentosPendentes
                                    }
                                  />
                                </div>

                                {/* Right Webhooks configs */}
                                <div className="space-y-4">
                                  <div className="p-3 bg-zinc-900 border border-zinc-850 rounded-xl">
                                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest block mb-1">
                                      Integração Remota
                                    </span>
                                    <h4 className="text-xs font-black text-white uppercase">
                                      Webhook Dispatcher
                                    </h4>
                                  </div>
                                  <WebhooksPanel
                                    webhooks={webhooks}
                                    webhookLogs={webhookLogs}
                                    processos={dbState.processos}
                                    onSaveWebhook={handleSaveWebhook}
                                    onDeleteWebhook={handleDeleteWebhook}
                                    onTriggerTest={handleTriggerTestWebhook}
                                    onRedeliver={handleRedeliverWebhook}
                                    onClearLogs={() => setWebhookLogs([])}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Contextual OCR Row Modal Popup (M2) */}
                  {isRowUploadModalOpen && (
                    <OCRUploadModal
                      isOpen={true}
                      onClose={() => {
                        setIsRowUploadModalOpen(false);
                        setSelectedProcessoId(null);
                      }}
                      registroId={selectedProcessoId}
                      onOCRComplete={handleOCRComplete}
                      onOCRCompleteWithTarget={handleOCRCompleteWithTarget}
                      customModels={dbState.modelosOCR}
                    />
                  )}

                  {/* Deep Audit Logs Modal Trigger */}
                  <AuditLogsModal
                    isOpen={isAuditLogsModalOpen}
                    onClose={() => setIsAuditLogsModalOpen(false)}
                    logs={dbState.logs}
                  />

                  {/* Operational LogModal console captures */}
                  <LogModal
                    isOpen={logOpen}
                    onClose={() => setLogOpen(false)}
                  />
                </div>
              )}
            </main>

            {/* FIXED SYSTEM FOOTER */}
            <footer className="bg-black border-t border-zinc-900 px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 z-40 select-none print:hidden shrink-0">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px]">
                {/* System Version */}
                <div className="flex items-center gap-1">
                  <span className="text-zinc-500 font-mono">VERSÃO:</span>
                  <span className="font-bold text-zinc-300 font-mono">
                    v2.9.1-SECURE
                  </span>
                </div>

                {/* Environment Badge */}
                <div className="flex items-center gap-1.5 border-l border-zinc-800 pl-4">
                  <span className="text-zinc-500">AMBIENTE:</span>
                  <span className="px-2 py-0.5 bg-red-600/15 text-red-500 border border-red-500/25 text-[9px] font-black uppercase rounded tracking-wider">
                    PRODUÇÃO
                  </span>
                </div>

                {/* Logged in User */}
                <div className="flex items-center gap-1.5 border-l border-zinc-800 pl-4 text-zinc-400">
                  <span className="text-zinc-500 font-mono">USER:</span>
                  <span className="font-semibold">{user?.email}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px]">
                {/* Last save timestamp */}
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span className="text-zinc-500">Último salvamento:</span>
                  <span className="font-bold text-zinc-300 font-mono">
                    {lastSavedTime}
                  </span>
                </div>

                {/* Online Indicator */}
                <div className="flex items-center gap-2 border-l border-zinc-800 pl-6">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-zinc-400 font-bold uppercase tracking-widest text-[9px]">
                    ONLINE
                  </span>
                </div>
              </div>
            </footer>
          </div>
        </>
      )}
    </div>
  );
}
