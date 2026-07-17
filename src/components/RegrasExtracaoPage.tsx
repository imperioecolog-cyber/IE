import React, { useState, useEffect } from "react";
import { 
  Settings, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  Play, 
  FileText, 
  Cpu, 
  Info, 
  Code, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Layers, 
  RefreshCw,
  Clock,
  Sparkles,
  GitMerge
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ModeloOCR, CustomFieldOCR, Processo, DocumentoPendente } from "../types";

interface RegrasExtracaoPageProps {
  modelos: ModeloOCR[];
  onSaveModel: (model: ModeloOCR) => Promise<void>;
  onDeleteModel: (modelId: string) => Promise<void>;
  processos: Processo[];
  onAddProcess: (p: Processo) => Promise<void>;
  onUpdateProcess: (registro: string, fields: Partial<Processo>) => Promise<void>;
  documentosPendentes: DocumentoPendente[];
  setDocumentosPendentes: React.Dispatch<React.SetStateAction<DocumentoPendente[]>>;
}

const PROCESS_FIELDS = [
  { value: "cliente", label: "Cliente" },
  { value: "processo", label: "Nº Processo" },
  { value: "container", label: "Contêiner ID" },
  { value: "tipoContainer", label: "Tipo do Contêiner" },
  { value: "armador", label: "Armador" },
  { value: "motorista", label: "Motorista" },
  { value: "veiculo", label: "Veículo / Placa" },
  { value: "transportadora", label: "Transportadora" },
  { value: "valorFrete", label: "Valor do Frete" },
  { value: "dataRetirada", label: "Data de Retirada" },
  { value: "horaRetirada", label: "Hora de Retirada" },
  { value: "dataEntrega", label: "Data de Entrega" },
  { value: "horaEntrega", label: "Hora de Entrega" },
  { value: "dataDevolucao", label: "Data de Devolução" },
  { value: "horaDevolucao", label: "Hora de Devolução" },
  { value: "entregaVazio", label: "Entrega do Contêiner Vazio" },
  { value: "terminal", label: "Terminal" },
  { value: "observacoes", label: "Observações" }
];

// Sample OCR raw texts for the test playground
const TEXT_SAMPLES = [
  {
    id: "duimp",
    name: "Declaração de Importação (DUIMP)",
    tipoDocumental: "Declaração Única de Importação (DUIMP)",
    text: `REPÚBLICA FEDERATIVA DO BRASIL
MINISTÉRIO DA FAZENDA - RECEITA FEDERAL DO BRASIL
DECLARAÇÃO ÚNICA DE IMPORTAÇÃO (DUIMP)

NÚMERO DA DUIMP: 26/558912-4
DATA DE REGISTRO: 14/07/2026

IMPORTADOR: LOGÍSTICA BRASIL S.A.
CNPJ: 12.345.678/0001-90

CONTEINER ID: KKFU1234567
TIPO DE CONTEINER: 40HQ
TRANSPORTADORA: COSCO SHIPPING LINES
ARMADOR DESIGNADO: COSCO
B/L MASTER: COSU1234567890
NAVIO: CAP SAN ARTEMISIO
PESO BRUTO: 24.500,00 KG
TERMINAL DE DESCARGA: SANTOS BRASIL (TECON)
LOCALIDADE: GUARUJÁ - SP`
  },
  {
    id: "agendamento",
    name: "Comprovante de Agendamento",
    tipoDocumental: "Agendamento de Retirada",
    text: `SANTOS BRASIL S/A - TECON SANTOS
COMPROVANTE DE AGENDAMENTO DE RETIRADA DE IMPORTAÇÃO

SLOT / JANELA DE ATENDIMENTO: 14/07/2026 - 14:30
Nº DO AGENDAMENTO: AGE-2026-9912

DADOS DO CAVALO / CARRETA:
PLACA DO VEÍCULO: KNG4E63
TIPO: CAVALO MECÂNICO TRATOR

DADOS DO MOTORISTA:
NOME: RAMON RAMALHO
CPF: 111.222.333-44
CNH: 12345678901
FONE CELULAR: (11) 98888-7777

CONTEINER PARA RETIRADA: KKFU1234567`
  },
  {
    id: "danfe",
    name: "DANFE / Nota Fiscal",
    tipoDocumental: "Nota Fiscal Eletrônica (DANFE)",
    text: `DANFE - DOCUMENTO AUXILIAR DA NOTA FISCAL ELETRÔNICA
Nº NOTA FISCAL: 000.145.892
SÉRIE: 1

CHAVE DE ACESSO: 3526 0712 3456 7800 0190 5500 1000 1458 9210 1234 5678
EMITENTE: TRADING CARGO EXPRESS LTDA
CNPJ EMITENTE: 45.678.912/0001-30

VALOR TOTAL DA NOTA: R$ 14.500,00
TRANSPORTADORA CONTRATADA: RODOSUL
OBSERVAÇÕES: CARGA IMPORTADA DESTINADA À DEVOLUÇÃO NO EMISSOR.`
  }
];

export default function RegrasExtracaoPage({
  modelos,
  onSaveModel,
  onDeleteModel,
  processos,
  onAddProcess,
  onUpdateProcess,
  documentosPendentes,
  setDocumentosPendentes
}: RegrasExtracaoPageProps) {
  const [activeTab, setActiveTab] = useState<"admin" | "test">("admin");
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingModel, setEditingModel] = useState<ModeloOCR | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [keywordsInput, setKeywordsInput] = useState("");
  const [fields, setFields] = useState<CustomFieldOCR[]>([]);
  const [versao, setVersao] = useState(1);

  // Form temporary field state
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldMapping, setNewFieldMapping] = useState("observacoes");
  const [newFieldRegex, setNewFieldRegex] = useState("");
  const [newFieldObrigatorio, setNewFieldObrigatorio] = useState(false);

  // Playground test states
  const [selectedRuleId, setSelectedRuleId] = useState<string>("");
  const [testRawText, setTestRawText] = useState("");
  const [testResults, setTestResults] = useState<any | null>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);

  // Manual OCR testing execution logs
  const [historicoExecucoes, setHistoricoExecucoes] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("historico_execucoes_ocr");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedHistId, setSelectedHistId] = useState<string | null>(null);

  // Custom visual feedback notifications
  const [toasts, setToasts] = useState<{ id: number; message: string; type: "success" | "error" | "info" }[]>([]);

  const addToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    if (modelos.length > 0 && !selectedRuleId) {
      setSelectedRuleId(modelos[0].id);
    }
  }, [modelos, selectedRuleId]);

  const toggleExpandRule = (id: string) => {
    setExpandedRuleId(expandedRuleId === id ? null : id);
  };

  const handleStartCreate = () => {
    setName("");
    setKeywordsInput("");
    setFields([]);
    setVersao(1);
    setEditingModel(null);
    setIsEditing(true);
  };

  const handleStartEdit = (model: ModeloOCR) => {
    setEditingModel(model);
    setName(model.name);
    setKeywordsInput(model.keywords.join(", "));
    setFields([...model.fields]);
    setVersao(model.versao || 1);
    setIsEditing(true);
  };

  const handleAddField = () => {
    if (!newFieldKey || !newFieldLabel) {
      addToast("Chave e rótulo do campo são obrigatórios", "error");
      return;
    }
    
    // Check duplication
    const cleanKey = newFieldKey.toLowerCase().replace(/\s+/g, "_");
    if (fields.some(f => f.key === cleanKey)) {
      addToast("Esta chave de campo já está cadastrada", "error");
      return;
    }

    const newField: CustomFieldOCR = {
      key: cleanKey,
      label: newFieldLabel,
      mapping: newFieldMapping,
      regex: newFieldRegex || undefined,
      obrigatorio: newFieldObrigatorio
    };

    setFields([...fields, newField]);
    setNewFieldKey("");
    setNewFieldLabel("");
    setNewFieldRegex("");
    setNewFieldObrigatorio(false);
    addToast("Campo adicionado temporariamente", "success");
  };

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
    addToast("Campo removido", "info");
  };

  const handleSave = async () => {
    if (!name) {
      addToast("Nome da regra / tipo documental é obrigatório", "error");
      return;
    }

    const keywords = keywordsInput
      .split(",")
      .map(k => k.trim().toUpperCase())
      .filter(k => k !== "");

    const modelId = editingModel ? editingModel.id : `MODEL_${Date.now()}`;
    const updatedVersao = editingModel ? (editingModel.versao || 1) + 1 : 1;

    const newModel: ModeloOCR = {
      id: modelId,
      name,
      active: editingModel ? editingModel.active : true,
      keywords,
      fields,
      versao: updatedVersao
    };

    try {
      await onSaveModel(newModel);
      setIsEditing(false);
      setEditingModel(null);
      addToast(`Regra de Extração salva com sucesso (Versão v${updatedVersao})!`, "success");
    } catch (error) {
      addToast("Erro ao sincronizar com Google Sheets", "error");
    }
  };

  const handleToggleActive = async (model: ModeloOCR, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = { ...model, active: !model.active };
      await onSaveModel(updated);
      addToast(`Regra ${model.name} ${updated.active ? "ativada" : "desativada"} com sucesso!`, "success");
    } catch (error) {
      addToast("Erro ao alterar status da regra", "error");
    }
  };

  const handleDeleteRule = async (modelId: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm(`Deseja realmente remover permanentemente a regra "${name}"?`);
    if (!confirmed) return;

    try {
      await onDeleteModel(modelId);
      addToast(`Regra de Extração removida.`, "info");
    } catch (error) {
      addToast("Erro ao deletar regra no banco", "error");
    }
  };

  // Test Regex extraction simulator
  const handleSelectSample = (sampleId: string) => {
    const sample = TEXT_SAMPLES.find(s => s.id === sampleId);
    if (sample) {
      setTestRawText(sample.text);
      // Try to find matching rule ID based on name or keywords
      const matchedRule = modelos.find(m => 
        m.name.toLowerCase().includes(sample.name.split("/")[0].trim().toLowerCase()) ||
        m.keywords.some(k => sample.text.toUpperCase().includes(k))
      );
      if (matchedRule) {
        setSelectedRuleId(matchedRule.id);
      }
    }
  };

  const handleRunRegexTest = () => {
    if (!testRawText.trim()) {
      addToast("Forneça o texto cru do documento para testar", "error");
      return;
    }

    const rule = modelos.find(m => m.id === selectedRuleId);
    if (!rule) {
      addToast("Nenhuma regra de extração selecionada", "error");
      return;
    }

    setIsRunningTest(true);

    setTimeout(() => {
      const extractedCampos: any[] = [];
      let globalConfidenceSum = 0;
      let matchedFieldsCount = 0;

      rule.fields.forEach(field => {
        let value: string | null = null;
        let matchFound = false;
        let fieldConfidence = 0.5; // default fallback if matched

        if (field.regex) {
          try {
            // Support raw clean text regex matching
            const regexFlags = "i";
            const regex = new RegExp(field.regex, regexFlags);
            const match = testRawText.match(regex);
            if (match) {
              value = match[1] ? match[1].trim() : match[0].trim();
              matchFound = true;
              fieldConfidence = 0.98; // high confidence if direct regex match
            }
          } catch (e) {
            console.error("Regex inválida no campo:", field.key, e);
          }
        } else {
          // Rule heuristic if no regex is supplied: find label and grab the rest of the line
          const lines = testRawText.split("\n");
          for (const line of lines) {
            if (line.toUpperCase().includes(field.label.toUpperCase())) {
              const parts = line.split(/[:=]/);
              if (parts.length > 1) {
                value = parts.slice(1).join(":").trim();
                matchFound = true;
                fieldConfidence = 0.85;
                break;
              }
            }
          }
        }

        if (matchFound) {
          matchedFieldsCount++;
          globalConfidenceSum += fieldConfidence;
        } else if (field.obrigatorio) {
          // Penalty if mandatory field is missing
          globalConfidenceSum += 0.05;
        } else {
          globalConfidenceSum += 0.2; // slight confidence default for missing optional
        }

        extractedCampos.push({
          key: field.key,
          label: field.label,
          mapping: field.mapping,
          value,
          regex: field.regex || "Algoritmo Heurístico de Chave-Valor",
          encontrado: matchFound,
          obrigatorio: field.obrigatorio,
          confianca: matchFound ? fieldConfidence : 0
        });
      });

      const totalFields = rule.fields.length || 1;
      const finalConfidence = Math.min(1, Math.max(0.1, globalConfidenceSum / totalFields));

      const hasFalhaCritica = extractedCampos.some(c => c.obrigatorio && !c.encontrado);
      
      const newHistoryItem = {
        id: `HIST_${Date.now()}`,
        data: new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        tipoDocumento: rule.name,
        amostraNome: TEXT_SAMPLES.find(s => s.text === testRawText)?.name || "Texto Customizado",
        confiancaGlobal: finalConfidence,
        camposTotais: rule.fields.length,
        camposEncontrados: matchedFieldsCount,
        falhaCritica: hasFalhaCritica,
        campos: extractedCampos,
        rawText: testRawText
      };

      setTestResults({
        tipoDocumental: rule.name,
        versao: rule.versao || 1,
        confiancaGlobal: finalConfidence,
        campos: extractedCampos
      });

      setHistoricoExecucoes(prev => {
        const updated = [newHistoryItem, ...prev];
        localStorage.setItem("historico_execucoes_ocr", JSON.stringify(updated));
        return updated;
      });

      setIsRunningTest(false);
      addToast("Simulação de regras de OCR executada!", "success");
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert stack overlay */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`p-4 rounded-xl shadow-lg border text-xs font-semibold flex items-center justify-between gap-3 ${
                toast.type === "success" 
                  ? "bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800" 
                  : toast.type === "error"
                  ? "bg-red-50 border-red-200 text-red-900 dark:bg-slate-900 dark:border-red-950 dark:text-red-400"
                  : "bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-900 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center gap-2">
                {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                {toast.type === "error" && <AlertTriangle className="w-4 h-4 text-red-500" />}
                {toast.type === "info" && <Info className="w-4 h-4 text-indigo-500" />}
                <span>{toast.message}</span>
              </div>
              <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* HEADER CONTROLLER (ZOHO BLACK & WHITE STYLE) */}
      <div className="bg-black text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] opacity-5 [background-size:16px_16px] pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
              <Cpu className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2 uppercase">
                Central de Regras de Extração & OCR
                <span className="text-[10px] bg-zinc-800 text-slate-400 px-2 py-0.5 rounded font-bold uppercase tracking-widest border border-zinc-700">FASE 3</span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Gerencie expressões regulares determinísticas, mapeie parâmetros fiscais e operacionais para IA.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab("admin")}
              className={`px-4 py-2 text-xs font-black rounded-lg uppercase tracking-wider transition-all ${
                activeTab === "admin"
                  ? "bg-white text-black"
                  : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              Regras Operacionais
            </button>
            <button
              onClick={() => setActiveTab("test")}
              className={`px-4 py-2 text-xs font-black rounded-lg uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                activeTab === "test"
                  ? "bg-white text-black"
                  : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <Play className="w-3 h-3" /> Testar Motor OCR
            </button>
          </div>
        </div>
      </div>

      {/* TAB CONTENT 1: ADMIN CRUD RULES */}
      {activeTab === "admin" && (
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {!isEditing ? (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Regras Disponíveis ({modelos.length})</h3>
                    <p className="text-xs text-slate-500">Clique na regra para expandir a estrutura de expressões de captura.</p>
                  </div>
                  <button
                    onClick={handleStartCreate}
                    className="flex items-center gap-1.5 py-2 px-4 bg-black hover:bg-zinc-900 text-white font-bold text-xs rounded-xl transition-all shadow-md uppercase tracking-wider border border-zinc-800"
                  >
                    <Plus className="w-4 h-4" /> Nova Regra
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {modelos.map(model => {
                    const isExpanded = expandedRuleId === model.id;
                    return (
                      <div 
                        key={model.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden"
                      >
                        <div 
                          onClick={() => toggleExpandRule(model.id)}
                          className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-950/20 select-none"
                        >
                          <div className="flex items-start sm:items-center gap-3">
                            <div className={`p-2 rounded-xl shrink-0 ${model.active ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100" : "bg-slate-50 dark:bg-slate-950 text-slate-350"}`}>
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-tight">{model.name}</h4>
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-extrabold rounded">v{model.versao || 1}</span>
                                {model.active ? (
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 text-[9px] font-extrabold rounded-full uppercase">Ativo</span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-[9px] font-extrabold rounded-full uppercase">Inativo</span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                Palavras-chave: {model.keywords.map(k => `"${k}"`).join(", ")}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button
                              onClick={(e) => handleToggleActive(model, e)}
                              className={`p-2 rounded-lg border transition-all ${
                                model.active 
                                  ? "border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/30 dark:bg-emerald-950/10 dark:text-emerald-400" 
                                  : "border-slate-200 bg-slate-50 text-slate-450 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950"
                              }`}
                              title={model.active ? "Desativar regra" : "Ativar regra"}
                            >
                              {model.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(model);
                              }}
                              className="p-2 border border-slate-200 hover:border-slate-350 dark:border-slate-800 hover:dark:border-slate-700 dark:bg-slate-900 rounded-lg text-slate-600 dark:text-slate-300 transition-all"
                              title="Editar regras e mapeamento"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteRule(model.id, model.name, e)}
                              className="p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 hover:bg-red-50 hover:text-red-600 hover:border-red-100 dark:hover:bg-red-950/20 rounded-lg text-slate-450 transition-all"
                              title="Remover regra permanentemente"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="text-slate-400 pl-1">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                          </div>
                        </div>

                        {/* EXPANDED CONTENT VIEW */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/10"
                            >
                              <div className="p-5 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 border border-slate-200/60 dark:border-slate-800 rounded-xl">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Estrutura Governamental de Extração:</span>
                                    <span className="px-1.5 py-0.2 bg-zinc-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 font-mono text-[9px] font-extrabold rounded">REG-v{model.versao || 1}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-450 font-medium">Sincronizado automaticamente com Google Sheets DB</div>
                                </div>

                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-[10px] font-medium border-collapse">
                                    <thead>
                                      <tr className="border-b border-slate-200/60 dark:border-slate-800 text-slate-400 text-[9px] uppercase font-black tracking-wider">
                                        <th className="py-1.5 px-2 font-bold">Parâmetro extraído</th>
                                        <th className="py-1.5 px-2 font-bold">Rótulo amigável</th>
                                        <th className="py-1.5 px-2 font-bold">Destino operacional</th>
                                        <th className="py-1.5 px-2 font-bold font-mono">Expressão Regular (Regex)</th>
                                        <th className="py-1.5 px-2 font-bold text-center">Mandatório</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[10px]">
                                      {model.fields.map((field, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors">
                                          <td className="py-1 px-2 font-semibold text-slate-800 dark:text-slate-200">
                                            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-600 dark:text-slate-350">{field.key}</span>
                                          </td>
                                          <td className="py-1 px-2 text-slate-650 dark:text-slate-300">{field.label}</td>
                                          <td className="py-1 px-2 font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight text-[10px]">
                                            {PROCESS_FIELDS.find(p => p.value === field.mapping)?.label || field.mapping}
                                          </td>
                                          <td className="py-1 px-2">
                                            <span className="font-mono text-[10px] text-slate-500 bg-slate-50 dark:bg-slate-950 px-1.5 py-0.5 border border-slate-200/50 dark:border-slate-850 rounded block max-w-sm truncate" title={field.regex}>
                                              {field.regex || "(captura de linha heurística)"}
                                            </span>
                                          </td>
                                          <td className="py-1 px-2 text-center">
                                            {field.obrigatorio ? (
                                              <span className="inline-block w-2.5 h-2.5 bg-red-600 rounded-full" title="Obrigatório"></span>
                                            ) : (
                                              <span className="inline-block w-2.5 h-2.5 bg-slate-200 rounded-full" title="Opcional"></span>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              /* CRU FORM FOR EDITING / CREATING */
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6"
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      {editingModel ? `Editar Estrutura de Extração: ${editingModel.name}` : "Desenhar Nova Regra de OCR Determinística"}
                    </h3>
                    <p className="text-xs text-slate-500">Mapeie palavras-chave e configure expressões regulares para validação fiscal.</p>
                  </div>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">Nome do Documento / Tipo Documental</label>
                    <input
                      type="text"
                      placeholder="Ex: Nota Fiscal de Serviços (NFS-e)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">Palavras-chave de Identificação (separadas por vírgula)</label>
                    <input
                      type="text"
                      placeholder="Ex: NFS-E, FISCAL, PREFEITURA, SERVIÇO"
                      value={keywordsInput}
                      onChange={(e) => setKeywordsInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                    />
                  </div>
                </div>

                {/* FIELDS ADMINISTRATION SUBSECTION */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Mapeamento Dinâmico de Capturas ({fields.length} campos)</h4>
                  
                  {/* Dynamic field constructor */}
                  <div className="p-5 bg-slate-50/60 dark:bg-slate-950/20 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 mb-1">Chave Unificadora (Ex: taie_nfe)</label>
                        <input
                          type="text"
                          placeholder="Ex: taie_nfe"
                          value={newFieldKey}
                          onChange={(e) => setNewFieldKey(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-750 rounded-lg text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 mb-1">Rótulo Visual (Ex: TAIE / Nota)</label>
                        <input
                          type="text"
                          placeholder="Ex: TAIE / Nota"
                          value={newFieldLabel}
                          onChange={(e) => setNewFieldLabel(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-750 rounded-lg text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 mb-1">Banco de Dados (Destino ERP)</label>
                        <select
                          value={newFieldMapping}
                          onChange={(e) => setNewFieldMapping(e.target.value)}
                          className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-750 rounded-lg text-slate-800 dark:text-slate-100"
                        >
                          {PROCESS_FIELDS.map(f => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 mb-1">Expressão de Captura (Regex)</label>
                        <input
                          type="text"
                          placeholder="Ex: NOTA FISCAL:\\s*(\\d+)"
                          value={newFieldRegex}
                          onChange={(e) => setNewFieldRegex(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-750 rounded-lg text-slate-800 dark:text-slate-100 font-mono"
                        />
                      </div>
                      <div className="flex items-center gap-3 py-2">
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs select-none">
                          <input
                            type="checkbox"
                            checked={newFieldObrigatorio}
                            onChange={(e) => setNewFieldObrigatorio(e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-350"
                          />
                          <span className="font-bold text-slate-650">Mandatório</span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t border-slate-150 dark:border-slate-800/80">
                      <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        Escreva Regex como NOTA FISCAL:\s*(\d+) para capturar o valor no primeiro grupo.
                      </div>
                      <button
                        onClick={handleAddField}
                        className="py-1.5 px-4 bg-slate-900 hover:bg-black text-white font-bold text-[11px] rounded-lg transition-all"
                      >
                        + Adicionar Campo
                      </button>
                    </div>
                  </div>

                  {/* Built/Added Fields List */}
                  <div className="border border-slate-150 dark:border-slate-800 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Campos Cadastrados neste Modelo</div>
                    
                    {fields.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-xs">Nenhum campo adicionado a esta regra ainda. Mapeie pelo menos 1 campo.</div>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto">
                        {fields.map((f, i) => (
                          <div key={i} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/40 text-xs">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-600 dark:text-slate-300">{f.key}</span>
                              <span className="text-slate-400">&rarr;</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{f.label}</span>
                              <span className="px-1.5 py-0.2 bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold uppercase rounded text-zinc-650">
                                DB: {PROCESS_FIELDS.find(p => p.value === f.mapping)?.label || f.mapping}
                              </span>
                              {f.regex && (
                                <span className="font-mono text-[10px] text-slate-500 max-w-xs truncate bg-slate-50 dark:bg-slate-900 px-1.5 py-0.2 rounded border border-slate-200/50 dark:border-slate-800" title={f.regex}>
                                  Regex: {f.regex}
                                </span>
                              )}
                              {f.obrigatorio && (
                                <span className="px-1.5 py-0.2 bg-red-100 text-red-700 text-[8px] font-black rounded uppercase">Obrigatório</span>
                              )}
                            </div>
                            <button
                              onClick={() => handleRemoveField(i)}
                              className="text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Versão Atual: v{editingModel ? (editingModel.versao || 1) + 1 : 1}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="py-2 px-4 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      className="py-2 px-5 bg-black hover:bg-zinc-900 text-white font-bold text-xs rounded-xl transition-all shadow-md uppercase tracking-wider"
                    >
                      Gravar Regras de Extração
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* TAB CONTENT 2: OCR REGEX test PLAYGROUND */}
      {activeTab === "test" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* SAMPLES & INPUT AREA */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase tracking-tight">
                  <Code className="w-5 h-5 text-slate-800 dark:text-slate-200" />
                  Mecanismo de Análise e Teste em Tempo Real
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Selecione uma regra de OCR, escolha um documento de amostra ou insira as palavras lidas para avaliar o comportamento do extrator determinístico.
                </p>
              </div>

              {/* Sample Document Fast Selectors */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Amostras de Documentos de Auditoria:</span>
                <div className="flex flex-wrap gap-2">
                  {TEXT_SAMPLES.map(sample => (
                    <button
                      key={sample.id}
                      onClick={() => handleSelectSample(sample.id)}
                      className="py-1.5 px-3 bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-[11px] font-bold transition-all border border-slate-250 dark:border-slate-750 uppercase tracking-tight"
                    >
                      {sample.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">Regra para Teste</label>
                  <select
                    value={selectedRuleId}
                    onChange={(e) => setSelectedRuleId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl font-bold"
                  >
                    {modelos.map(m => (
                      <option key={m.id} value={m.id}>{m.name} (v{m.versao || 1})</option>
                    ))}
                    {modelos.length === 0 && <option value="">Nenhuma regra configurada</option>}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleRunRegexTest}
                    disabled={isRunningTest || !testRawText.trim() || !selectedRuleId}
                    className="w-full py-2 bg-black hover:bg-zinc-900 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl transition-all shadow-md uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    {isRunningTest ? (
                      <>
                        <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                        Avaliando Expressões...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        Executar Regex de Extração
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Texto Bruto do Documento (OCR cru)</label>
                <textarea
                  value={testRawText}
                  onChange={(e) => setTestRawText(e.target.value)}
                  placeholder="Selecione uma amostra acima ou cole aqui as palavras extraídas via Tesseract/OCR para simular a validação..."
                  rows={9}
                  className="w-full p-4 font-mono text-[11px] bg-slate-950 text-slate-100 border border-slate-850 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* SIMULATION RESULTS SCREEN */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm min-h-[400px] flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Rastro de Execução do Motor</h4>
                  <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold">CLIENT_ENGINE_1.0</span>
                </div>

                {!testResults ? (
                  <div className="text-center py-16 text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-full flex items-center justify-center">
                      <Cpu className="w-6 h-6 text-slate-350" />
                    </div>
                    <div>
                      <p className="font-bold uppercase tracking-tight text-slate-500 text-[11px]">Playground Pronto para Validação</p>
                      <p className="text-slate-400 mt-1 max-w-xs mx-auto">Preencha o conteúdo, selecione o modelo e mande rodar para ver o resultado da indexação em tempo real.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Confidence Indicator Card */}
                    <div className="p-4 rounded-2xl border flex items-start gap-3 bg-slate-50/50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800">
                      <div className="mt-0.5 shrink-0">
                        {testResults.confiancaGlobal >= 0.8 ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-amber-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-tight">Taxa de Confiança Global</span>
                          <span className={`font-mono font-bold text-xs ${testResults.confiancaGlobal >= 0.8 ? "text-emerald-600" : "text-amber-600"}`}>
                            {Math.round(testResults.confiancaGlobal * 100)}%
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-550 mt-1">
                          {testResults.confiancaGlobal >= 0.8 
                            ? "Os termos e as expressões regulares retornaram correspondência em quase 100% dos parâmetros cruciais. Pronto para indexação!"
                            : "Alerta: Confiança baixa. Alguns parâmetros mandatórios não foram localizados pelo motor regex. Verifique o padrão de escrita do documento."}
                        </p>
                      </div>
                    </div>

                    {/* Matched parameters */}
                    <div className="space-y-2">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Parâmetros Mapeados ({testResults.campos.length}):</span>
                      
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {testResults.campos.map((c: any, i: number) => (
                          <div 
                            key={i}
                            className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 rounded-xl space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-tight">{c.label}</span>
                              <span className={`px-2 py-0.2 rounded font-extrabold text-[8px] uppercase tracking-wider ${
                                c.encontrado 
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400" 
                                  : c.obrigatorio 
                                  ? "bg-red-150 text-red-700" 
                                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                              }`}>
                                {c.encontrado ? "Sucesso" : c.obrigatorio ? "Falha Crítica" : "Nulo"}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-500 border-t border-slate-150 dark:border-slate-800/80 pt-1.5">
                              <div>
                                <span className="text-slate-400">Extraído:</span>
                                <span className="font-bold text-slate-700 dark:text-slate-300 ml-1 truncate block">{c.value || "(não localizado)"}</span>
                              </div>
                              <div>
                                <span className="text-slate-400">Destino ERP:</span>
                                <span className="font-bold text-slate-750 dark:text-slate-300 ml-1 uppercase block truncate">{c.mapping}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span>Rastreabilidade de Auditoria</span>
                <span>v1.0.0</span>
              </div>
            </div>
          </div>
        </div>

        {/* HISTÓRICO DE EXECUÇÕES OCR MANUAIS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                    Histórico de Execuções Manuais (Simulações OCR)
                  </h4>
                  <p className="text-[11px] text-slate-550 mt-0.5">
                    Histórico das últimas análises de expressões regulares executadas neste terminal.
                  </p>
                </div>
              </div>
              {historicoExecucoes.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm("Deseja realmente limpar todo o histórico de execuções de OCR?")) {
                      setHistoricoExecucoes([]);
                      localStorage.removeItem("historico_execucoes_ocr");
                      addToast("Histórico limpo com sucesso", "info");
                    }
                  }}
                  className="flex items-center gap-1 py-1.5 px-3 bg-red-50 hover:bg-red-105 dark:bg-red-950/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/40 text-[10px] font-black rounded-lg transition-all uppercase tracking-wider"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpar Histórico
                </button>
              )}
            </div>

            {historicoExecucoes.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <Clock className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                <p className="font-bold text-slate-500 text-[11px] uppercase tracking-tight">Nenhuma execução registrada</p>
                <p className="text-slate-400 text-[10px] max-w-xs">
                  Execute o motor OCR acima para salvar registros de sucesso e falha das suas simulações.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[10px] border-collapse font-sans">
                    <thead>
                      <tr className="border-b border-slate-150 dark:border-slate-850 text-slate-400 bg-slate-50/20 text-[9px] uppercase font-black tracking-wider">
                        <th className="py-1.5 px-3 font-extrabold">Data/Hora</th>
                        <th className="py-1.5 px-3 font-extrabold">Tipo de Documento</th>
                        <th className="py-1.5 px-3 font-extrabold">Amostra Utilizada</th>
                        <th className="py-1.5 px-3 font-extrabold text-center">Campos Extraídos</th>
                        <th className="py-1.5 px-3 font-extrabold text-center">Confiança Global</th>
                        <th className="py-1.5 px-3 font-extrabold text-center">Resultado</th>
                        <th className="py-1.5 px-3 font-extrabold text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[10px]">
                      {historicoExecucoes.map((log) => {
                        const isExpanded = selectedHistId === log.id;
                        return (
                          <React.Fragment key={log.id}>
                            <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all text-[10px]">
                              <td className="py-1 px-3 font-mono text-slate-500 dark:text-slate-400">
                                {log.data}
                              </td>
                              <td className="py-1 px-3 font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight">
                                {log.tipoDocumento}
                              </td>
                              <td className="py-1 px-3 text-slate-500 dark:text-slate-400 text-[10px] font-mono">
                                {log.amostraNome}
                              </td>
                              <td className="py-1 px-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono">
                                  {log.camposEncontrados} / {log.camposTotais}
                                </span>
                              </td>
                              <td className="py-1 px-3 text-center">
                                <span className={`font-mono font-bold ${log.confiancaGlobal >= 0.8 ? "text-emerald-600" : "text-amber-600"}`}>
                                  {Math.round(log.confiancaGlobal * 100)}%
                                </span>
                              </td>
                              <td className="py-1 px-3 text-center">
                                {log.falhaCritica ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 text-[8px] font-black rounded-full uppercase">
                                    <AlertTriangle className="w-2.5 h-2.5 shrink-0 text-rose-500" />
                                    Falha Crítica
                                  </span>
                                ) : log.camposEncontrados === log.camposTotais ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-750 dark:bg-emerald-950/40 dark:text-emerald-400 text-[8px] font-black rounded-full uppercase">
                                    <CheckCircle2 className="w-2.5 h-2.5 shrink-0 text-emerald-500" />
                                    Sucesso Total
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-750 dark:bg-amber-950/40 dark:text-amber-400 text-[8px] font-black rounded-full uppercase">
                                    <Info className="w-2.5 h-2.5 shrink-0 text-amber-500" />
                                    Sucesso Parcial
                                  </span>
                                )}
                              </td>
                              <td className="py-1 px-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => setSelectedHistId(isExpanded ? null : log.id)}
                                    className="py-0.5 px-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-750 dark:text-slate-300 font-bold text-[9px] rounded uppercase tracking-wider flex items-center gap-1 transition-all border border-slate-200 dark:border-slate-700"
                                  >
                                    <Code className="w-2.5 h-2.5 text-indigo-500" />
                                    {isExpanded ? "Fechar" : "Detalhar"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setTestRawText(log.rawText);
                                      // find the matching rule
                                      const matchingRule = modelos.find(m => m.name === log.tipoDocumento);
                                      if (matchingRule) {
                                        setSelectedRuleId(matchingRule.id);
                                      }
                                      addToast("Dados carregados no playground!", "info");
                                    }}
                                    className="p-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-indigo-650 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 rounded transition-colors"
                                    title="Carregar de volta no playground"
                                  >
                                    <RefreshCw className="w-2.5 h-2.5 text-indigo-500" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setHistoricoExecucoes(prev => {
                                        const updated = prev.filter(p => p.id !== log.id);
                                        localStorage.setItem("historico_execucoes_ocr", JSON.stringify(updated));
                                        return updated;
                                      });
                                      addToast("Registro deletado", "info");
                                    }}
                                    className="p-1 hover:bg-red-100 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-600 rounded border border-slate-200 dark:border-slate-700 transition-colors"
                                    title="Excluir log"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Collapsible details for a run */}
                            {isExpanded && (
                              <tr>
                                <td colSpan={7} className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-150 dark:border-slate-800 animate-fadeIn">
                                  <div className="space-y-3 text-left">
                                    <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-slate-200/60 dark:border-slate-800">
                                      <span className="font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-tight">Rastreamento de Campos Extraídos</span>
                                      <span className="text-[10px] text-slate-400 font-mono">ID: {log.id}</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                      {log.campos.map((c: any, index: number) => (
                                        <div key={index} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 space-y-1.5 shadow-xs">
                                          <div className="flex items-center justify-between text-[11px]">
                                            <span className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-tight">{c.label}</span>
                                            <span className={`px-2 py-0.2 rounded font-extrabold text-[8px] uppercase tracking-wider ${
                                              c.encontrado 
                                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400" 
                                                : c.obrigatorio 
                                                ? "bg-red-150 text-red-700" 
                                                : "bg-slate-100 text-slate-500 dark:bg-slate-850 dark:text-slate-400"
                                            }`}>
                                              {c.encontrado ? "Sucesso" : c.obrigatorio ? "Falha Crítica" : "Faltante"}
                                            </span>
                                          </div>

                                          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-1.5">
                                            <div>
                                              <span className="text-slate-400 block">Extraído:</span>
                                              <span className="font-bold text-slate-750 dark:text-slate-300 truncate block" title={c.value || ""}>
                                                {c.value || "(não localizado)"}
                                              </span>
                                            </div>
                                            <div>
                                              <span className="text-slate-400 block">Destino ERP:</span>
                                              <span className="font-bold text-slate-750 dark:text-slate-300 uppercase truncate block">
                                                {c.mapping}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
