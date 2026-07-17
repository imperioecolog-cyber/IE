import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Layers, 
  User, 
  Building, 
  FileText, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Plus, 
  Edit3, 
  ChevronRight, 
  History, 
  AlertCircle,
  Truck,
  UserCheck,
  ShieldAlert,
  ClipboardList
} from "lucide-react";
import { Processo, Cliente, PrestadorServico, DBState, DocumentoAnexo } from "../types";

export interface ContextItem {
  type: "processo" | "motorista" | "cliente";
  id: string; // registro, cpf, or cnpj
}

interface ContextPanelProps {
  selectedItem: ContextItem | null;
  onClose: () => void;
  dbState: DBState;
  onUpdateProcess: (registro: string, fields: Partial<Processo>) => void;
  onOpenUploadModal?: (registroId: string) => void;
}

export default function ContextPanel({
  selectedItem,
  onClose,
  dbState,
  onUpdateProcess,
  onOpenUploadModal
}: ContextPanelProps) {
  const [activeTab, setActiveTab] = useState<"geral" | "documentos" | "timeline" | "financeiro">("geral");
  const [obsText, setObsText] = useState("");

  // Sync observations on item change
  useEffect(() => {
    if (selectedItem && selectedItem.type === "processo") {
      const p = dbState.processos.find(proc => proc.registro === selectedItem.id);
      if (p) {
        // Strip metadata if present
        const sep = "---METADATA---";
        const cleanObs = p.observacoes ? p.observacoes.split(sep)[0].trim() : "";
        setObsText(cleanObs);
      }
    }
  }, [selectedItem, dbState.processos]);

  if (!selectedItem) return null;

  // Find the actual model object
  let processData: Processo | undefined;
  let driverData: PrestadorServico | undefined;
  let clientData: Cliente | undefined;

  if (selectedItem.type === "processo") {
    processData = dbState.processos.find(p => p.registro === selectedItem.id);
  } else if (selectedItem.type === "motorista") {
    driverData = dbState.prestadores.find(m => m.nome === selectedItem.id);
  } else if (selectedItem.type === "cliente") {
    clientData = dbState.clientes.find(c => c.nome === selectedItem.id);
  }

  const handleSaveObservations = () => {
    if (processData) {
      const sep = "---METADATA---";
      let metadata = "";
      if (processData.observacoes && processData.observacoes.includes(sep)) {
        metadata = sep + processData.observacoes.split(sep)[1];
      }
      onUpdateProcess(processData.registro, { 
        observacoes: `${obsText.trim()} ${metadata}` 
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Agendado": return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      case "Coletado": return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "Em Trânsito": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Entregue": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Devolvido": return "bg-slate-500/10 text-slate-400 border-slate-500/20";
      default: return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    }
  };

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="w-full lg:w-[420px] bg-[#12161A] border-l border-zinc-900 h-full flex flex-col z-40 relative shadow-2xl overflow-hidden print:hidden select-none"
    >
      {/* PANEL HEADER */}
      <div className="p-4 border-b border-zinc-900 bg-black flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-600/10 rounded-xl border border-red-500/10 text-red-500">
            {selectedItem.type === "processo" && <Layers className="w-5 h-5" />}
            {selectedItem.type === "motorista" && <User className="w-5 h-5" />}
            {selectedItem.type === "cliente" && <Building className="w-5 h-5" />}
          </div>
          <div>
            <span className="text-[9px] font-mono font-black text-red-500 tracking-widest uppercase">
              {selectedItem.type === "processo" ? "Inspecionar Carga" : selectedItem.type === "motorista" ? "Ficha do Motorista" : "Ficha do Cliente"}
            </span>
            <h3 className="font-extrabold text-sm text-white leading-none truncate max-w-[240px]">
              {selectedItem.id}
            </h3>
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* RENDER FOR PROCESSO / CONTAINER */}
      {selectedItem.type === "processo" && processData && (
        <>
          {/* TAB CHANGER */}
          <div className="flex border-b border-zinc-900 bg-black/40 px-2">
            {[
              { id: "geral", label: "Geral" },
              { id: "documentos", label: "Anexos" },
              { id: "timeline", label: "Timeline" },
              { id: "financeiro", label: "Financeiro" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === tab.id 
                    ? "border-red-600 text-white" 
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB CONTENT AREA */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {activeTab === "geral" && (
              <>
                {/* Status Dropdown Picker */}
                <div className="space-y-2 p-4 bg-zinc-950 border border-zinc-900 rounded-2xl">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Status Atual da Operação</span>
                  <div className="flex items-center justify-between gap-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(processData.status)}`}>
                      {processData.status}
                    </span>
                    <select
                      value={processData.status}
                      onChange={(e) => onUpdateProcess(processData!.registro, { status: e.target.value as any })}
                      className="text-xs bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-red-600 cursor-pointer font-bold"
                    >
                      {["Agendado", "Coletado", "Em Trânsito", "Entregue", "Devolvido", "Pendente"].map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl">
                    <span className="text-[9px] font-mono text-zinc-500 block">Nº PROCESSO</span>
                    <span className="text-xs font-bold text-zinc-200 font-mono">{processData.processo || "---"}</span>
                  </div>
                  <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl">
                    <span className="text-[9px] font-mono text-zinc-500 block">Nº CONTAINER</span>
                    <span className="text-xs font-bold text-zinc-200 font-mono">{processData.container || "---"}</span>
                  </div>
                  <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl">
                    <span className="text-[9px] font-mono text-zinc-500 block">MOTORISTA</span>
                    <span className="text-xs font-semibold text-zinc-300 truncate block">{processData.motorista || "---"}</span>
                  </div>
                  <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl">
                    <span className="text-[9px] font-mono text-zinc-500 block">PLACA VEÍCULO</span>
                    <span className="text-xs font-bold text-zinc-200 font-mono">{processData.veiculo || "---"}</span>
                  </div>
                  <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl">
                    <span className="text-[9px] font-mono text-zinc-500 block">ARMADOR</span>
                    <span className="text-xs font-semibold text-zinc-300 truncate block">{processData.armador || "---"}</span>
                  </div>
                  <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl">
                    <span className="text-[9px] font-mono text-zinc-500 block">TERMINAL</span>
                    <span className="text-xs font-semibold text-zinc-300 truncate block">{processData.terminal || "---"}</span>
                  </div>
                </div>

                {/* Status-Driven Checklist */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-red-500" />
                    Checklist Operacional
                  </h4>
                  <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 space-y-3">
                    {[
                      { label: "Agendamento de Retirada realizado", done: true },
                      { label: "Documentação DUIMP / NFe vinculada", done: (processData.documentos?.length || 0) > 0 },
                      { label: "Coleta do container no terminal", done: ["Coletado", "Em Trânsito", "Entregue", "Devolvido"].includes(processData.status) },
                      { label: "Em trânsito com lacre intacto", done: ["Em Trânsito", "Entregue", "Devolvido"].includes(processData.status) },
                      { label: "Canhoto assinado e digitalizado", done: ["Entregue", "Devolvido"].includes(processData.status) },
                      { label: "Container vazio devolvido ao armador", done: processData.status === "Devolvido" || processData.entregaVazio === "Devolvido" }
                    ].map((check, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className={`font-semibold ${check.done ? "text-zinc-400 line-through" : "text-zinc-300"}`}>{check.label}</span>
                        {check.done ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-zinc-600 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interactive Remarks observations */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-red-500" />
                    Observações Operacionais
                  </h4>
                  <textarea
                    value={obsText}
                    onChange={(e) => setObsText(e.target.value)}
                    onBlur={handleSaveObservations}
                    placeholder="Adicione observações, ocorrências ou instruções específicas para esta carga..."
                    className="w-full h-24 text-xs bg-zinc-950 border border-zinc-900 hover:border-zinc-800 focus:border-red-600 rounded-xl p-3 text-zinc-300 focus:outline-none transition-colors placeholder:text-zinc-650 resize-none font-medium"
                  />
                  <span className="text-[9px] text-zinc-500 block text-right">Salva automaticamente ao desfocar</span>
                </div>
              </>
            )}

            {activeTab === "documentos" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-red-500" />
                    Documentos Anexados
                  </h4>
                  {onOpenUploadModal && (
                    <button
                      onClick={() => onOpenUploadModal(processData!.registro)}
                      className="py-1 px-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Anexar PDF / OCR
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {processData.documentos && processData.documentos.map((doc: DocumentoAnexo) => (
                    <div key={doc.id} className="p-3.5 bg-zinc-950 border border-zinc-900 rounded-xl flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <span className="text-[8px] font-mono font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded px-1.5 py-0.5 uppercase tracking-wider">
                          {doc.tipoDocumental}
                        </span>
                        <p className="text-xs font-bold text-zinc-300 truncate mt-1.5">{doc.nomeArquivo}</p>
                        <span className="text-[9px] text-zinc-500 block font-mono mt-0.5">Sincronizado em {new Date(doc.dataUpload).toLocaleDateString("pt-BR")}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[9px] font-bold uppercase tracking-wider font-mono">
                        {doc.status}
                      </span>
                    </div>
                  ))}

                  {(!processData.documentos || processData.documentos.length === 0) && (
                    <div className="text-center py-10 border border-dashed border-zinc-900 rounded-2xl">
                      <FileText className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-zinc-500">Nenhum documento anexado ainda.</p>
                      <p className="text-[10px] text-zinc-650 mt-1">Carregue DUIMPs, NFe ou faturamento para extração inteligente.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "timeline" && (
              <div className="space-y-4">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <History className="w-4 h-4 text-red-500" />
                  Histórico de Atualizações
                </h4>

                <div className="relative border-l border-zinc-900 pl-4 space-y-6 py-2 ml-2">
                  {/* Generate some customized step milestones depending on status */}
                  {[
                    { title: "Registro Criado", desc: "A carga foi cadastrada com sucesso e vinculada à planilha", date: processData.dataCriado || "15/07/2026", status: "completed" },
                    { title: "Processo Logístico Vinculado", desc: `Nº de Processo ${processData.processo} associado`, date: "15/07/2026", status: "completed" },
                    { title: "Retirada do Lote", desc: `Retirada realizada no terminal ${processData.terminal || "Porto"}`, date: processData.dataRetirada || "---", status: ["Coletado", "Em Trânsito", "Entregue", "Devolvido"].includes(processData.status) ? "completed" : "pending" },
                    { title: "Em Trânsito Rodoviário", desc: `Motorista ${processData.motorista || "Não vinculado"} em rota ativa`, date: "---", status: ["Em Trânsito", "Entregue", "Devolvido"].includes(processData.status) ? "completed" : "pending" },
                    { title: "Entrega Finalizada", desc: "Entrega física efetuada no cliente final", date: processData.dataEntrega || "---", status: ["Entregue", "Devolvido"].includes(processData.status) ? "completed" : "pending" },
                    { title: "Devolução de Vazio", desc: "Container entregue de volta ao armador", date: processData.dataDevolucao || "---", status: processData.status === "Devolvido" ? "completed" : "pending" }
                  ].map((step, idx) => (
                    <div key={idx} className="relative">
                      {/* Milestone indicator icon circle */}
                      <span className={`absolute -left-[25px] top-1 flex h-4.5 w-4.5 rounded-full border items-center justify-center ${
                        step.status === "completed" 
                          ? "bg-red-950 border-red-500 text-red-500" 
                          : "bg-zinc-950 border-zinc-850 text-zinc-650"
                      }`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${step.status === "completed" ? "bg-red-500 animate-pulse" : "bg-zinc-800"}`} />
                      </span>
                      
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${step.status === "completed" ? "text-white" : "text-zinc-500"}`}>{step.title}</span>
                          <span className="text-[9px] font-mono text-zinc-500">{step.date}</span>
                        </div>
                        <p className={`text-[11px] leading-relaxed ${step.status === "completed" ? "text-zinc-400" : "text-zinc-600"}`}>{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "financeiro" && (
              <div className="space-y-5">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-red-500" />
                  Detalhamento Financeiro
                </h4>

                <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between text-xs pb-3 border-b border-zinc-900">
                    <span className="font-semibold text-zinc-400">VALOR DO FRETE</span>
                    <span className="font-mono font-black text-white text-sm">
                      R$ {parseFloat(processData.valorFrete || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pb-3 border-b border-zinc-900">
                    <span className="font-semibold text-zinc-400">VALOR CARREGAMENTO</span>
                    <span className="font-mono font-bold text-zinc-300">
                      R$ {parseFloat(processData.valorCarregamento || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pb-3 border-b border-zinc-900">
                    <span className="font-semibold text-zinc-400">VALOR PAGO MOTORISTA</span>
                    <span className="font-mono font-bold text-zinc-300">
                      R$ {parseFloat(processData.valorPagoMotorista || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-xs font-semibold text-zinc-400 block">Motorista Pago?</span>
                      <span className="text-[10px] text-zinc-550 block">Alterar status de acerto de contas</span>
                    </div>
                    <select
                      value={processData.motoristaPago || "Não"}
                      onChange={(e) => onUpdateProcess(processData!.registro, { motoristaPago: e.target.value })}
                      className="text-xs bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-300 font-bold focus:outline-none"
                    >
                      <option value="Não">Não</option>
                      <option value="Sim">Sim</option>
                    </select>
                  </div>
                </div>

                <div className="p-3.5 bg-red-600/5 border border-red-500/10 rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-zinc-400 font-medium leading-normal">
                    Faturamento Pendente se aplica aos processos com status Entregue ou Devolvido que ainda necessitam de validação do canhoto físico pelo setor financeiro.
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* RENDER FOR MOTORISTA */}
      {selectedItem.type === "motorista" && driverData && (
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Driver ID Card */}
          <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-red-600/10 border border-red-500/25 text-red-500 flex items-center justify-center text-2xl font-black">
              {driverData.nome.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="font-bold text-base text-white">{driverData.nome}</h4>
              <span className="text-[9px] font-mono text-zinc-500 font-bold uppercase mt-1 inline-block px-2 py-0.5 bg-zinc-900 border border-zinc-850 rounded-md">
                MOTORISTA ATIVO
              </span>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Dados Cadastrais</h4>
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-zinc-500">CPF</span>
                <span className="font-mono text-zinc-300 font-bold">{driverData.cpf || "---"}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-zinc-500">CNH</span>
                <span className="font-mono text-zinc-300 font-bold">{driverData.cnh || "---"}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-zinc-500">Celular</span>
                <span className="font-mono text-zinc-300 font-bold">{driverData.celular || "---"}</span>
              </div>
            </div>
          </div>

          {/* Trips/Processes list under this driver */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Viagens Vinculadas</h4>
            <div className="space-y-2">
              {dbState.processos.filter(p => p.motorista === driverData!.nome).map(p => (
                <div key={p.registro} className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[9px] font-mono font-bold text-red-500">{p.registro}</span>
                    <p className="text-xs font-bold text-zinc-300 truncate mt-1">Ref: {p.processo} ({p.container})</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${getStatusColor(p.status)}`}>
                    {p.status}
                  </span>
                </div>
              ))}

              {dbState.processos.filter(p => p.motorista === driverData!.nome).length === 0 && (
                <div className="text-center py-6 border border-zinc-900 rounded-xl">
                  <p className="text-xs text-zinc-600">Nenhum processo operacional atrelado.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RENDER FOR CLIENTE */}
      {selectedItem.type === "cliente" && clientData && (
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Client ID Card */}
          <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-red-600/10 border border-red-500/25 text-red-500 flex items-center justify-center text-2xl font-black">
              {clientData.nome.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="font-bold text-base text-white">{clientData.nome}</h4>
              <span className="text-[9px] font-mono text-zinc-500 font-bold uppercase mt-1 inline-block px-2 py-0.5 bg-zinc-900 border border-zinc-850 rounded-md">
                CLIENTE CORPORATIVO
              </span>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Dados Cadastrais</h4>
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-zinc-500">CNPJ</span>
                <span className="font-mono text-zinc-300 font-bold">{clientData.cnpj || "---"}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-zinc-500">Email</span>
                <span className="text-zinc-300 font-bold truncate max-w-[200px]">{clientData.email || "---"}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-zinc-500">Contato</span>
                <span className="text-zinc-300 font-bold truncate max-w-[200px]">{clientData.contato || "---"}</span>
              </div>
            </div>
          </div>

          {/* Connected Processes list under this client */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Cargas / Contratos</h4>
            <div className="space-y-2">
              {dbState.processos.filter(p => p.cliente === clientData!.nome).map(p => (
                <div key={p.registro} className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[9px] font-mono font-bold text-red-500">{p.registro}</span>
                    <p className="text-xs font-bold text-zinc-300 truncate mt-1">{p.processo} - {p.container}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${getStatusColor(p.status)}`}>
                    {p.status}
                  </span>
                </div>
              ))}

              {dbState.processos.filter(p => p.cliente === clientData!.nome).length === 0 && (
                <div className="text-center py-6 border border-zinc-900 rounded-xl">
                  <p className="text-xs text-zinc-600 font-semibold">Nenhuma carga cadastrada para este cliente.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SYSTEM FOOTER INFO ON PANEL */}
      <div className="p-3 border-t border-zinc-900 bg-black text-center">
        <span className="text-[8px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
          Sincronizado via Google Sheets API
        </span>
      </div>
    </motion.div>
  );
}
