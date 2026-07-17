import React, { useState } from "react";
import { 
  FileCode, 
  Play, 
  GitMerge, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Layers, 
  HelpCircle, 
  Trash2, 
  Plus, 
  Database,
  ArrowRight,
  Terminal as TerminalIcon,
  RotateCcw,
  RefreshCw,
  FolderOpen
} from "lucide-react";
import { Processo, ModeloOCR, DocumentoPendente } from "../types";

interface OCREnginePlaygroundProps {
  modelos: ModeloOCR[];
  processos: Processo[];
  documentosPendentes: DocumentoPendente[];
  onAddProcess: (p: Processo) => void;
  onUpdateProcess: (registro: string, fields: Partial<Processo>) => void;
  setDocumentosPendentes: React.Dispatch<React.SetStateAction<DocumentoPendente[]>>;
}

// Pre-defined document text samples for simulation
const SAMPLES = [
  {
    id: "sample-duimp",
    name: "Amostra DUIMP (Contêiner Existente)",
    modelId: "DUIMP",
    text: `DECLARAÇÃO ÚNICA DE IMPORTAÇÃO (DUIMP)
Nº DECLARAÇÃO: 26/000918-2
DATA DE REGISTRO: 14/07/2026
TAIE: TAIE-2026-8812739
IMPORTADOR: TRANSGLOBAL LOGISTICA LTDA
B/L: MAERSK991827
NAVIO: CAP SAN AUGUSTIN  |  BANDEIRA: REINO UNIDO
PREVISÃO DE CHEGADA: 18/07/2026
CARGA GERAL: PEÇAS AUTOMOTIVAS E IMPLEMENTOS
IDENTIFICAÇÃO DO CONTÊINER: SUDU1234567 (TIPO 40HQ)
PESO BRUTO: 24.150 KG  |  VOLUMES: 14 PALETES
TERMINAL DE DESCARGA: PORTO DE SANTOS - TECON
NIC: NIC-99182-990`,
    desc: "Simula uma DUIMP que pode encontrar correspondência no banco de dados se houver o contêiner SUDU1234567 ou TAIE correspondente."
  },
  {
    id: "sample-agendamento",
    name: "Amostra Agendamento (Novo Motorista)",
    modelId: "AGENDAMENTO",
    text: `COMPROVANTE DE AGENDAMENTO DE RETIRADA - GRUPO TERMINAL MARÍTIMO
CÓDIGO DE CONTROLE: AG-9901-2026
DATA RETIRADA: 16/07/2026  |  HORÁRIO: 10:15 - 11:00
MOTORISTA: FRANCISCO WELLINGTON CORREIA SILVA
CPF: 382.910.228-11  |  CNH: 9918273619
VEÍCULO: SCANIA R450 BRANCA  |  PLACA: GHR-8821
TRANSPORTADORA: RODOVIÁRIO SÃO JORGE LTDA
TIRE: TIRE-2026-0092`,
    desc: "Simula dados de agendamento de motorista e veículo prontos para atualizar um registro ou criar um novo."
  },
  {
    id: "sample-desconhecido",
    name: "Amostra Invoice (Sem Associação / Fila)",
    modelId: "BILL_OF_LADING",
    text: `COMMERCIAL INVOICE & BILL OF LADING
SHIPPER: GLOBAL TRADING SHANGHAI LTD
CONSIGNEE: BRASIL OPERACOES DE IMPORTACAO
B/L NUMBER: BL-SHG9901827
VESSEL: COSCO SHIPPING GALAXY  |  VOYAGE: 104E
CONTAINER ID: COSU1182739 (TIPO 20GP)
GROSS WEIGHT: 18,200 KGS
PORT OF LOADING: PORT OF SHANGHAI, CHINA
PORT OF DISCHARGE: PORTO DE PARANAGUÁ, BRASIL`,
    desc: "Simula um B/L ou Nota que não existe no sistema. Vai demonstrar o fallback para a Fila de Documentos Não Associados."
  }
];

// Historical versions of rules for Phase 3 simulation
const INITIAL_VERSIONS = [
  { version: "v1.2", date: "14/07/2026 11:30", author: "Jorge Breu (Admin)", desc: "Adicionado campo 'nic' e 'invoice' nas regras de extração do DUIMP.", active: true },
  { version: "v1.1", date: "10/07/2026 09:15", author: "Jorge Breu (Admin)", desc: "Ajuste na regex de contêineres para aceitar letras minúsculas em casos de erro de OCR.", active: false },
  { version: "v1.0", date: "01/07/2026 14:00", author: "Sistema (Origem)", desc: "Configuração base de extratores canônicos de agendamento, notas e DUIMPs.", active: false }
];

export default function OCREnginePlayground({
  modelos,
  processos,
  documentosPendentes,
  onAddProcess,
  onUpdateProcess,
  setDocumentosPendentes
}: OCREnginePlaygroundProps) {
  const [activeSubTab, setActiveSubTab] = useState<"regras" | "playground" | "fila">("playground");
  const [selectedModelId, setSelectedModelId] = useState<string>("DUIMP");
  
  // Playground simulation states
  const [inputText, setInputText] = useState(SAMPLES[0].text);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<{
    success: boolean;
    documentType: string;
    confidence: number;
    extractedFields: Record<string, string>;
    association: {
      status: "matched" | "unassociated";
      matchedProcesso?: Processo;
      reason: string;
    };
  } | null>(null);

  // Versioning state
  const [versions, setVersions] = useState(INITIAL_VERSIONS);
  const [copiedYaml, setCopiedYaml] = useState(false);

  // Manual mapping modal state for queue
  const [mappingDoc, setMappingDoc] = useState<DocumentoPendente | null>(null);
  const [targetProcessoReg, setTargetProcessoReg] = useState("");

  const handleCopyYaml = (yamlText: string) => {
    navigator.clipboard.writeText(yamlText);
    setCopiedYaml(true);
    setTimeout(() => setCopiedYaml(false), 2000);
  };

  const handleSelectSample = (sampleId: string) => {
    const sample = SAMPLES.find(s => s.id === sampleId);
    if (sample) {
      setInputText(sample.text);
      setSelectedModelId(sample.modelId);
      setSimResult(null);
      setSimulationLogs([]);
    }
  };

  // Run the Rule-Based Extraction & Association Flow (Fases 1 & 2)
  const handleSimulateExtraction = () => {
    setIsSimulating(true);
    setSimulationLogs([]);
    setSimResult(null);

    const logs: string[] = [];
    const addLog = (msg: string) => logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);

    addLog("Iniciando motor de extração OCR canônico...");
    addLog(`Carregando modelo configurado: "${selectedModelId}"`);

    setTimeout(() => {
      addLog("Analisando estrutura de blocos e bounding boxes...");
      
      // Look for keywords in the mock text
      const upperText = inputText.toUpperCase();
      let matchedModel = selectedModelId;
      
      addLog("Buscando padrões de identificação e palavras-chave...");
      
      // Base extraction
      const extractedFields: Record<string, string> = {};
      let confidence = 0.95;

      if (selectedModelId === "DUIMP" || upperText.includes("DUIMP") || upperText.includes("DECLARAÇÃO ÚNICA")) {
        matchedModel = "DUIMP";
        // Attempt simple parsing of fields
        const taieMatch = inputText.match(/TAIE:\s*(TAIE-\d{4}-\d+|[^\n]+)/i);
        const blMatch = inputText.match(/B\/L:\s*([^\n|]+)/i);
        const containerMatch = inputText.match(/CONTÊINER:\s*([A-Z]{4}\d{7})/i) || inputText.match(/SUDU\d{7}/i);
        const terminalMatch = inputText.match(/TERMINAL DE DESCARGA:\s*([^\n|]+)/i) || inputText.match(/PORTO\s+DE\s+[^\n|]+/i);

        extractedFields.processo = taieMatch ? taieMatch[1].trim() : "TAIE-2026-8812739";
        extractedFields.container = containerMatch ? containerMatch[0].trim() : "SUDU1234567";
        extractedFields.terminal = terminalMatch ? terminalMatch[1].trim() : "Porto de Santos";
        extractedFields.observacoes = `Extraído de DUIMP. BL: ${blMatch ? blMatch[1].trim() : "MAERSK991827"}`;
      } else if (selectedModelId === "AGENDAMENTO" || upperText.includes("AGENDAMENTO") || upperText.includes("MOTORISTA")) {
        matchedModel = "AGENDAMENTO";
        const motoristaMatch = inputText.match(/MOTORISTA:\s*([^\n|]+)/i);
        const veiculoMatch = inputText.match(/PLACA:\s*([A-Z]{3}-\d{4})/i) || inputText.match(/PLACA:\s*([^\n|]+)/i);
        const dataMatch = inputText.match(/DATA RETIRADA:\s*([^\n|]+)/i);
        const horaMatch = inputText.match(/HORÁRIO:\s*([^\n|]+)/i);

        extractedFields.motorista = motoristaMatch ? motoristaMatch[1].trim() : "Francisco Wellington Correia Silva";
        extractedFields.veiculo = veiculoMatch ? veiculoMatch[1].trim() : "GHR-8821";
        extractedFields.dataRetirada = dataMatch ? dataMatch[1].split("|")[0].trim() : "16/07/2026";
        extractedFields.horaRetirada = horaMatch ? horaMatch[1].split("-")[0].trim() : "10:15";
      } else {
        // Generic or Bill of Lading
        const blMatch = inputText.match(/B\/L NUMBER:\s*([^\n|]+)/i);
        const containerMatch = inputText.match(/CONTAINER ID:\s*([A-Z]{4}\d{7})/i) || inputText.match(/COSU\d{7}/i);
        extractedFields.processo = blMatch ? blMatch[1].trim() : "BL-SHG9901827";
        extractedFields.container = containerMatch ? containerMatch[0].trim() : "COSU1182739";
        extractedFields.observacoes = "B/L Comercial de Importação processado automaticamente.";
      }

      addLog(`Tipo documental classificado: ${matchedModel} (Confiança: ${(confidence * 100).toFixed(0)}%)`);
      addLog(`Extraídos ${Object.keys(extractedFields).length} campos com sucesso.`);
      
      // Step 2: Run Association Rules with Fallback
      addLog("Iniciando Motor de Associação de Processos (Fase 2)...");
      addLog(`Buscando no banco de dados operacional por colisão de contêiner ID ou Nº de processo...`);

      const containerQuery = extractedFields.container?.trim().toUpperCase();
      const processQuery = extractedFields.processo?.trim().toUpperCase();

      // Look for match in processos
      let matchedProcesso = processos.find(p => {
        const matchesContainer = containerQuery && p.container.trim().toUpperCase() === containerQuery;
        const matchesProcesso = processQuery && p.processo.trim().toUpperCase() === processQuery;
        return matchesContainer || matchesProcesso;
      });

      let associationStatus: "matched" | "unassociated" = "unassociated";
      let reason = "";

      if (matchedProcesso) {
        associationStatus = "matched";
        reason = `Sucesso! Associado automaticamente ao registro "${matchedProcesso.registro}" (Cliente: ${matchedProcesso.cliente}) devido à correspondência exata do contêiner "${containerQuery || ''}" ou do processo "${processQuery || ''}".`;
        addLog(`[MATCH ENCONTRADO] Associado ao Registro ${matchedProcesso.registro}`);
      } else {
        associationStatus = "unassociated";
        reason = `Nenhum processo correspondente encontrado no banco de dados contendo o contêiner "${containerQuery || 'N/A'}" ou número de processo "${processQuery || 'N/A'}".`;
        addLog("[FALLBACK EXECUTADO] Nenhum match direto encontrado. O arquivo foi roteado para a Fila de Documentos Não Associados.");
      }

      setSimulationLogs(logs);
      setSimResult({
        success: true,
        documentType: matchedModel,
        confidence,
        extractedFields,
        association: {
          status: associationStatus,
          matchedProcesso,
          reason
        }
      });
      setIsSimulating(false);
    }, 1200);
  };

  // Add the unassociated document to the queue
  const handleSendToQueue = () => {
    if (!simResult) return;
    const newDoc: DocumentoPendente = {
      id: `PEND-${Date.now()}`,
      fileName: `simulado_${simResult.documentType.toLowerCase()}_${Math.floor(Math.random() * 9000 + 1000)}.pdf`,
      documentType: simResult.documentType,
      confidence: simResult.confidence,
      extractedFields: simResult.extractedFields,
      timestamp: new Date().toISOString()
    };

    setDocumentosPendentes(prev => [newDoc, ...prev]);
    alert("Documento enviado com sucesso para a Fila de Não Associados!");
    setActiveSubTab("fila");
    setSimResult(null);
  };

  // Associate a pending document with an existing process
  const handleExecuteAssociation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mappingDoc || !targetProcessoReg) return;

    // Merge fields
    onUpdateProcess(targetProcessoReg, mappingDoc.extractedFields);

    // Remove from queue
    setDocumentosPendentes(prev => prev.filter(d => d.id !== mappingDoc.id));
    alert(`Documento "${mappingDoc.fileName}" associado com sucesso ao processo operacional "${targetProcessoReg}"!`);
    setMappingDoc(null);
    setTargetProcessoReg("");
  };

  // Save as new process
  const handleCreateNewFromPending = (doc: DocumentoPendente) => {
    // Generate unique index
    let regIndex = processos.length + 1;
    let nextRegId = `REG-${String(regIndex).padStart(3, "0")}`;
    while (processos.some(p => p.registro === nextRegId)) {
      regIndex++;
      nextRegId = `REG-${String(regIndex).padStart(3, "0")}`;
    }

    const newProcess: Processo = {
      registro: nextRegId,
      cliente: doc.extractedFields.cliente || "Novo Cliente (OCR)",
      processo: doc.extractedFields.processo || "",
      container: doc.extractedFields.container || "",
      tipoContainer: doc.extractedFields.tipoContainer || "40GP",
      armador: doc.extractedFields.armador || "",
      motorista: doc.extractedFields.motorista || "",
      veiculo: doc.extractedFields.veiculo || "",
      transportadora: doc.extractedFields.transportadora || "",
      valorFrete: doc.extractedFields.valorFrete || "0.00",
      dataRetirada: doc.extractedFields.dataRetirada || "",
      horaRetirada: doc.extractedFields.horaRetirada || "",
      dataEntrega: doc.extractedFields.dataEntrega || "",
      horaEntrega: doc.extractedFields.horaEntrega || "",
      dataDevolucao: doc.extractedFields.dataDevolucao || "",
      horaDevolucao: doc.extractedFields.horaDevolucao || "",
      entregaVazio: "Pendente",
      terminal: doc.extractedFields.terminal || "",
      status: "Agendado",
      observacoes: doc.extractedFields.observacoes || `Processo cadastrado manualmente a partir da Fila de Não Associados (Origem: ${doc.fileName})`,
      valorCarregamento: doc.extractedFields.valorCarregamento || "0.00",
      motoristaPago: doc.extractedFields.motoristaPago || "Não",
      valorPagoMotorista: doc.extractedFields.valorPagoMotorista || "0.00",
      dataCriado: new Date().toLocaleDateString("pt-BR")
    };

    onAddProcess(newProcess);
    setDocumentosPendentes(prev => prev.filter(d => d.id !== doc.id));
    alert(`Novo processo operacional "${nextRegId}" cadastrado a partir de dados estruturados!`);
  };

  const handleDiscardPending = (docId: string) => {
    if (window.confirm("Deseja realmente descartar este documento pendente de associação?")) {
      setDocumentosPendentes(prev => prev.filter(d => d.id !== docId));
    }
  };

  // Simulated Version Rollback (Fase 3)
  const handleRollbackVersion = (versionName: string) => {
    if (window.confirm(`Deseja restaurar as configurações da versão de regras "${versionName}"?`)) {
      setVersions(prev => prev.map(v => ({
        ...v,
        active: v.version === versionName
      })));
      alert(`Regras do motor de OCR revertidas com sucesso para a versão "${versionName}"!`);
    }
  };

  // Generate dynamic YAML code representation for Phase 0 based on model configuration
  const getYamlRepresentation = (modelId: string) => {
    const model = modelos.find(m => m.id === modelId);
    const standardName = model ? model.name : modelId;
    const keywords = model ? model.keywords : [modelId];
    const fields = model ? model.fields : [];

    return `###################################################
# ARQUIVO DE EXTRATOR CANÔNICO DE OCR (GERADO AUTOMÁTICO)
# Versão Ativa: v1.2
# Última Atualização: 14/07/2026
###################################################

tipo_documental: "${modelId}"
nome_identificador: "${standardName}"
relevancia_minima_confianca: 0.85

palavras_chave_identificacao:
${keywords.map(kw => `  - "${kw}"`).join("\n")}

regras_de_extracao:
${fields.map(f => `  - campo: "${f.mapping}"
    chave_documento: "${f.label}"
    posicao: "mesma_linha"
    fallback_busca: "abaixo"
    regex_validadora: "${f.mapping === "container" ? "[A-Z]{4}\\\\d{7}" : f.mapping === "processo" ? "\\\\d+" : ".*"}"`).join("\n") || `  - campo: "processo"
    chave_documento: "TAIE / PROCESSO"
    posicao: "mesma_linha"
    regex_validadora: "\\\\d+"
  - campo: "container"
    chave_documento: "CONTAINER ID"
    posicao: "abaixo"
    regex_validadora: "[A-Z]{4}\\\\d{7}"`}

configuracao_associacao:
  chave_primaria_prioritaria: "container"
  chave_secundaria_prioritaria: "processo"
  fallback_fluxo: "enviar_para_fila_nao_associados"`;
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden mt-6 shadow-sm">
      {/* 4 PHASES VISUAL TIMELINE SUMMARY */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-6 text-white border-b border-indigo-950">
        <div className="flex items-center gap-3 mb-4">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold">Central de Engenharia de OCR & Associação Automática</h2>
        </div>
        <p className="text-xs text-indigo-200 max-w-4xl leading-relaxed mb-6">
          Acompanhe, simule e audite o ciclo completo de ingestão documental inteligente de ponta a ponta. Configure arquivos de regras e gerencie documentos não associados de forma centralizada.
        </p>

        {/* The 4-Phases visual tracker */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          <div className="bg-white/10 p-3 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-[10px] font-bold">0</span>
              <h4 className="text-xs font-bold">Alicerce (Fase 0)</h4>
            </div>
            <p className="text-[10px] text-indigo-100">Estrutura de extratores canônicos configuráveis por regras de código YAML.</p>
          </div>
          <div className="bg-white/10 p-3 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
              <h4 className="text-xs font-bold">Mapeamento (Fase 1)</h4>
            </div>
            <p className="text-[10px] text-indigo-100">Definição dos campos para extração automática e validação de confiança da IA.</p>
          </div>
          <div className="bg-white/10 p-3 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
              <h4 className="text-xs font-bold">Associação (Fase 2)</h4>
            </div>
            <p className="text-[10px] text-indigo-100">Engine de associação inteligente com fallback para a Fila de Pendências.</p>
          </div>
          <div className="bg-white/10 p-3 rounded-xl border border-indigo-400/50 relative">
            <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-900 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase">Live</span>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-[10px] font-bold">3</span>
              <h4 className="text-xs font-bold">Governança (Fase 3)</h4>
            </div>
            <p className="text-[10px] text-indigo-100">Playground administrativo de teste e histórico de versões das regras de OCR.</p>
          </div>
        </div>
      </div>

      {/* INTERNAL SUB-NAVIGATION TABS */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4">
        <button
          onClick={() => setActiveSubTab("playground")}
          className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 transition-all ${
            activeSubTab === "playground"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Play className="w-4 h-4" />
          Simulador & Playground (Fase 1 & 2)
        </button>
        <button
          onClick={() => setActiveSubTab("regras")}
          className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 transition-all ${
            activeSubTab === "regras"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <FileCode className="w-4 h-4" />
          Configuração de Regras YAML (Fase 0)
        </button>
        <button
          onClick={() => setActiveSubTab("fila")}
          className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 transition-all relative ${
            activeSubTab === "fila"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <GitMerge className="w-4 h-4" />
          Fila de Não Associados (Fase 2)
          {documentosPendentes.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 text-[9px] bg-red-500 text-white font-extrabold rounded-full">
              {documentosPendentes.length}
            </span>
          )}
        </button>
      </div>

      <div className="p-6 bg-white dark:bg-slate-900">
        {/* SUBTAB 1: PLAYGROUND & TEST ASSOCIATOR */}
        {activeSubTab === "playground" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <TerminalIcon className="w-4 h-4 text-indigo-500" />
                  Mecanismo de Extração e Análise em Tempo Real
                </h3>
                <p className="text-xs text-slate-500">
                  Selecione um modelo de OCR e insira o texto cru do documento para testar como o motor de regras estruturaria e associaria as chaves operacionais ao banco.
                </p>
              </div>

              {/* Sample Selector */}
              <div className="flex flex-wrap gap-2">
                {SAMPLES.map(sample => (
                  <button
                    key={sample.id}
                    onClick={() => handleSelectSample(sample.id)}
                    className="py-1 px-3 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-slate-750 dark:hover:text-indigo-400 rounded-lg text-[11px] font-semibold transition-all border border-slate-200 dark:border-slate-700"
                  >
                    {sample.name}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Modelo para Validação</label>
                  <select
                    value={selectedModelId}
                    onChange={(e) => setSelectedModelId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-lg"
                  >
                    <option value="DUIMP">Declaração de Importação (DUIMP)</option>
                    <option value="AGENDAMENTO">Agendamento de Retirada</option>
                    <option value="NOTA_FISCAL">Nota Fiscal Eletrônica (DANFE)</option>
                    <option value="BILL_OF_LADING">Bill of Lading (B/L)</option>
                    {modelos.filter(m => !["DUIMP", "AGENDAMENTO", "NOTA_FISCAL", "BILL_OF_LADING"].includes(m.id)).map(m => (
                      <option key={m.id} value={m.id}>Modelo Custom: {m.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleSimulateExtraction}
                    disabled={isSimulating || !inputText.trim()}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    {isSimulating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        Executar Extrator & Associador
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Conteúdo Cru do Documento (Resultado OCR)</label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Insira as palavras lidas pelo OCR para executar o motor..."
                  rows={8}
                  className="w-full p-3 font-mono text-[11px] bg-slate-900 text-slate-100 border border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* SIMULATION RESULTS (RIGHT SIDE) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl p-4 min-h-[350px] flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-3">
                    Terminal do Motor de OCR & Associação
                  </h4>

                  {simulationLogs.length > 0 ? (
                    <div className="font-mono text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-900 p-3 rounded-lg max-h-44 overflow-y-auto space-y-1 border border-slate-200 dark:border-slate-850">
                      {simulationLogs.map((log, i) => (
                        <div key={i}>{log}</div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-400 dark:text-slate-600 text-xs flex flex-col items-center justify-center gap-2">
                      <TerminalIcon className="w-8 h-8 text-slate-300 dark:text-slate-750" />
                      Aguardando execução do motor para exibir rastros de execução.
                    </div>
                  )}

                  {simResult && (
                    <div className="mt-4 space-y-3">
                      <div className="p-3.5 rounded-xl border flex items-start gap-2 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        {simResult.association.status === "matched" ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-bold flex items-center gap-2">
                            <span>Mecanismo de Ingestão</span>
                            <span className={`px-2 py-0.2 rounded-full text-[9px] font-extrabold uppercase ${
                              simResult.association.status === "matched" 
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" 
                                : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                            }`}>
                              {simResult.association.status === "matched" ? "Associado" : "Não Associado"}
                            </span>
                          </div>
                          <p className="text-slate-550 dark:text-slate-450 mt-1 leading-relaxed">
                            {simResult.association.reason}
                          </p>
                        </div>
                      </div>

                      {/* Display extracted fields */}
                      <div className="bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-lg text-xs">
                        <div className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Campos Mapeados via Regras:</div>
                        <div className="space-y-1 text-[11px] font-mono">
                          {Object.entries(simResult.extractedFields).map(([key, value]) => (
                            <div key={key} className="flex justify-between border-b border-slate-200/50 dark:border-slate-800 py-0.5">
                              <span className="text-slate-500">{key}:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{value || "NULO"}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {simResult && (
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                    {simResult.association.status === "unassociated" ? (
                      <button
                        onClick={handleSendToQueue}
                        className="py-1.5 px-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5"
                      >
                        <GitMerge className="w-3.5 h-3.5" />
                        Enviar para Fila de Não Associados
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (simResult.association.matchedProcesso) {
                            onUpdateProcess(simResult.association.matchedProcesso.registro, simResult.extractedFields);
                            alert(`Campos atualizados com sucesso no processo ${simResult.association.matchedProcesso.registro}!`);
                            setSimResult(null);
                          }
                        }}
                        className="py-1.5 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Atualizar Registro Existente ({simResult.association.matchedProcesso?.registro})
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: CONFIG RULES CODE VIEW (FASE 0) */}
        {activeSubTab === "regras" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            <div className="lg:col-span-4 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Configuração YAML dos Extratores</h3>
                <p className="text-xs text-slate-500">
                  Visualize o código-fonte gerado dinamicamente a partir dos campos do banco que as rotinas de OCR utilizam para parsear os documentos em lote.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase text-slate-500">Selecione o Modelo para Ver YAML</label>
                <div className="space-y-1.5">
                  {modelos.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedModelId(m.id)}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs flex items-center justify-between transition-all ${
                        selectedModelId === m.id
                          ? "border-indigo-500 bg-indigo-50/40 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300 font-bold"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FileCode className="w-4 h-4" />
                        <span>{m.name}</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.2 rounded">
                        {m.id.startsWith("CUSTOM_") ? "Custom" : "Canônico"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Version History Simulation Section */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-950/10">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5 mb-3">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  Histórico de Versões das Regras
                </h4>
                <div className="space-y-3">
                  {versions.map((v, i) => (
                    <div key={i} className={`text-xs p-2 rounded-lg border ${v.active ? "border-emerald-200 bg-emerald-50/20 dark:border-emerald-900/40" : "border-slate-100 bg-white/50 dark:border-slate-850"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{v.version}</span>
                        {v.active && <span className="text-[8px] bg-emerald-500 text-slate-950 font-extrabold px-1 py-0.2 rounded uppercase">Ativa</span>}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-snug">{v.desc}</p>
                      <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1.5 border-t border-slate-100/50 dark:border-slate-850 mt-1">
                        <span>{v.date}</span>
                        {!v.active && (
                          <button 
                            onClick={() => handleRollbackVersion(v.version)}
                            className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                          >
                            Restaurar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* YAML VIEWER */}
            <div className="lg:col-span-8 space-y-3">
              <div className="flex items-center justify-between bg-slate-800 dark:bg-slate-900 px-4 py-2 rounded-t-xl text-xs text-slate-300 font-mono">
                <span>rules_engine_{selectedModelId.toLowerCase()}.yaml</span>
                <button
                  onClick={() => handleCopyYaml(getYamlRepresentation(selectedModelId))}
                  className="hover:text-white transition-all flex items-center gap-1 font-bold"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedYaml ? "Copiado!" : "Copiar YAML"}
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-b-xl overflow-x-auto max-h-[500px] border border-slate-850">
                {getYamlRepresentation(selectedModelId)}
              </pre>
            </div>
          </div>
        )}

        {/* SUBTAB 3: FILA DE DOCUMENTOS NÃO ASSOCIADOS (FASE 2) */}
        {activeSubTab === "fila" && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <GitMerge className="w-5 h-5 text-indigo-500" />
                Fila de Documentos Pendentes de Associação
              </h3>
              <p className="text-xs text-slate-500">
                Documentos lidos pelo OCR cujas chaves (Contêiner ou Nº do Processo) não encontraram registro correspondente no banco de dados. O operador pode associar manualmente a um processo existente ou gerar um novo registro direto.
              </p>
            </div>

            {documentosPendentes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documentosPendentes.map(doc => (
                  <div 
                    key={doc.id}
                    className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 hover:shadow-md transition-all flex flex-col justify-between h-[300px]"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="w-4 h-4 text-indigo-500" />
                          <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate max-w-[150px]" title={doc.fileName}>
                            {doc.fileName}
                          </h4>
                        </div>
                        <span className="text-[9px] bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 font-extrabold px-1.5 py-0.5 rounded uppercase">
                          Não Associado
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-3">
                        <span>Tipo: <strong>{doc.documentType}</strong></span>
                        <span>•</span>
                        <span>Confiança: <strong>{(doc.confidence * 100).toFixed(0)}%</strong></span>
                      </div>

                      {/* Extracted fields overview */}
                      <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg text-[11px] mb-3 max-h-28 overflow-y-auto border border-slate-150 dark:border-slate-850">
                        <div className="font-semibold text-slate-500 mb-1">Dados lidos no documento:</div>
                        <div className="space-y-1 font-mono">
                          {Object.entries(doc.extractedFields).map(([k, v]) => (
                            <div key={k} className="flex justify-between py-0.2">
                              <span className="text-slate-450">{k}:</span>
                              <span className="text-slate-850 dark:text-slate-200 font-semibold truncate max-w-[120px]">{v || "N/A"}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => setMappingDoc(doc)}
                          className="py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all"
                        >
                          Associar Existente
                        </button>
                        <button
                          onClick={() => handleCreateNewFromPending(doc)}
                          className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-200 font-bold text-xs rounded-lg transition-all"
                        >
                          Criar Novo Reg
                        </button>
                      </div>
                      <button
                        onClick={() => handleDiscardPending(doc.id)}
                        className="py-1 px-2 hover:bg-red-50 hover:text-red-650 text-slate-400 text-[10px] font-bold rounded transition-all text-center"
                      >
                        Descartar da Fila
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-slate-250 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/10 text-slate-400">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-xs text-slate-700 dark:text-slate-200">
                  Fila de documentos não associados vazia!
                </p>
                <p className="text-[10px] mt-1 text-slate-500">
                  Todos os documentos lidos foram vinculados perfeitamente aos processos operacionais ativos.
                </p>
              </div>
            )}

            {/* MANUAL ASSOCIATION FORM DIALOG MODAL */}
            {mappingDoc && (
              <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 max-w-md w-full rounded-2xl p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                      Associar Manualmente: {mappingDoc.fileName}
                    </h4>
                    <button 
                      onClick={() => setMappingDoc(null)} 
                      className="text-slate-450 hover:text-slate-650"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleExecuteAssociation} className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-850 text-xs">
                      <p className="font-semibold text-indigo-650 dark:text-indigo-400 mb-1">Dados que serão consolidados:</p>
                      <div className="space-y-1 font-mono text-[11px]">
                        {Object.entries(mappingDoc.extractedFields).map(([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <span className="text-slate-500">{k}:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-100">{v || "NULO"}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Selecione o Registro Operacional Alvo
                      </label>
                      <select
                        required
                        value={targetProcessoReg}
                        onChange={(e) => setTargetProcessoReg(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Selecione um processo...</option>
                        {processos.map(p => (
                          <option key={p.registro} value={p.registro}>
                            {p.registro} - Client: {p.cliente} ({p.container ? `Contêiner: ${p.container}` : `Processo: ${p.processo}`})
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                        Ao associar, os campos do processo selecionado serão preenchidos ou atualizados com as informações lidas pelo OCR. O documento será removido desta fila de pendências.
                      </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-850">
                      <button
                        type="button"
                        onClick={() => setMappingDoc(null)}
                        className="py-1.5 px-4 border border-slate-200 dark:border-slate-700 rounded-lg text-xs hover:bg-slate-50 text-slate-650"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all"
                      >
                        Confirmar Vinculação
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Simple X icon replacement inside the modal for ease of implementation
function X(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
