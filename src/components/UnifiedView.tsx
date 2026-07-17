import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Layers, Users, Settings, Ship, Radio, History } from "lucide-react";
import { DBState, WebhookConfig, WebhookDeliveryLog, ModeloOCR, Processo } from "../types";

// Import existing modular widgets
import ProcessTable from "./ProcessTable";
import OCRUploadModal from "./OCRUploadModal";
import ArmadorPortals from "./ArmadorPortals";
import CadastrosPanel from "./CadastrosPanel";
import RegrasExtracaoPage from "./RegrasExtracaoPage";
import WebhooksPanel from "./WebhooksPanel";

interface UnifiedViewProps {
  dbState: DBState;
  webhooks: WebhookConfig[];
  webhookLogs: WebhookDeliveryLog[];
  documentosPendentes: any[];
  globalSearchTerm: string;
  ocrAutoFillAlert: any;
  setOcrAutoFillAlert: (val: any) => void;
  setDocumentosPendentes: (val: any[]) => void;
  onUpdateProcess: (registro: string, fields: Partial<Processo>) => void;
  onAddProcess: (newProcess: Processo) => void;
  onDeleteProcess: (registro: string) => void;
  onAddItem: (category: keyof DBState, item: any) => void;
  onRemoveItem: (category: keyof DBState, idField: string, idValue: string) => void;
  onUpdateItem: (category: keyof DBState, idField: string, idValue: string, item: any) => void;
  onSaveModel: (model: ModeloOCR) => void;
  onDeleteModel: (modelId: string) => void;
  onSaveWebhook: (wh: WebhookConfig) => void;
  onDeleteWebhook: (whId: string) => void;
  onTriggerTestWebhook: (wh: WebhookConfig) => void;
  onRedeliverWebhook: (log: WebhookDeliveryLog) => void;
  onClearLogs: () => void;
  onOCRComplete: (ocrResult: any, fileName: string) => void;
  onOpenRowUploadModal: (processoId: string) => void;
}

export default function UnifiedView({
  dbState,
  webhooks,
  webhookLogs,
  documentosPendentes,
  globalSearchTerm,
  setDocumentosPendentes,
  onUpdateProcess,
  onAddProcess,
  onDeleteProcess,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onSaveModel,
  onDeleteModel,
  onSaveWebhook,
  onDeleteWebhook,
  onTriggerTestWebhook,
  onRedeliverWebhook,
  onClearLogs,
  onOCRComplete,
  onOpenRowUploadModal
}: UnifiedViewProps) {
  const [activeSection, setActiveSection] = useState<string>("dashboard");

  const sections = [
    { id: "dashboard", label: "Painel Geral & Operações", desc: "Controle de cargas em tempo real e tracking", icon: Layers },
    { id: "cadastros", label: "Controle de Cadastros", desc: "Clientes, Motoristas, Veículos, Transportadoras", icon: Users },
    { id: "ocr", label: "Regras de Extração OCR & IA", desc: "Modelos customizados de IA e leitura de notas", icon: Settings },
    { id: "armadores", label: "Portais de Armadores", desc: "Portais de tracking oficiais", icon: Ship },
    { id: "webhooks", label: "Webhooks & APIs Integradoras", desc: "Integração de dados externos (JSON)", icon: Radio },
    { id: "logs", label: "Logs de Auditoria do Sistema", desc: "Auditoria inalterável de operadores", icon: History },
  ] as const;

  const toggleSection = (id: string) => {
    setActiveSection(activeSection === id ? "" : id);
  };

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const Icon = section.icon;
        const isOpen = activeSection === section.id;

        return (
          <div 
            key={section.id} 
            className="bg-[#12161A] border border-[#334E68] rounded-xl overflow-hidden transition-all duration-200"
          >
            {/* Header / Click Trigger */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-4 bg-[#0B0C10] hover:bg-[#12161A]/80 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isOpen ? "bg-[#F4F6F9] text-[#0B0C10]" : "bg-white/5 text-[#BAC7D5]"}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#F4F6F9]">
                    {section.label}
                  </h3>
                  <p className="text-[10px] text-[#BAC7D5] font-semibold mt-0.5">
                    {section.desc}
                  </p>
                </div>
              </div>
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-[#BAC7D5]"
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </button>

            {/* Expanded Area with smooth motion */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  <div className="p-5 border-t border-[#334E68]/40 bg-[#12161A]">
                    {section.id === "dashboard" && (
                      <div className="space-y-6">
                        <div className="print:hidden">
                          <OCRUploadModal 
                            onOCRComplete={onOCRComplete} 
                            customModels={dbState.modelosOCR} 
                          />
                        </div>
                        <ProcessTable 
                          processos={dbState.processos}
                          onUpdateProcess={onUpdateProcess}
                          onAddProcess={onAddProcess}
                          onDeleteProcess={onDeleteProcess}
                          clientes={dbState.clientes}
                          prestadores={dbState.prestadores}
                          transportadoras={dbState.transportadoras}
                          armadores={dbState.armadores}
                          terminais={dbState.terminais}
                          externalSearchQuery={globalSearchTerm}
                          onOpenUploadModal={onOpenRowUploadModal}
                        />
                      </div>
                    )}

                    {section.id === "cadastros" && (
                      <CadastrosPanel 
                        dbState={dbState} 
                        onAddItem={onAddItem} 
                        onRemoveItem={onRemoveItem} 
                        onUpdateItem={onUpdateItem}
                      />
                    )}

                    {section.id === "ocr" && (
                      <RegrasExtracaoPage 
                        modelos={dbState.modelosOCR} 
                        onSaveModel={async (model) => onSaveModel(model)} 
                        onDeleteModel={async (id) => onDeleteModel(id)} 
                        processos={dbState.processos}
                        onAddProcess={async (p) => onAddProcess(p)}
                        onUpdateProcess={async (reg, fields) => onUpdateProcess(reg, fields)}
                        documentosPendentes={documentosPendentes}
                        setDocumentosPendentes={setDocumentosPendentes}
                      />
                    )}

                    {section.id === "armadores" && (
                      <ArmadorPortals armadores={dbState.armadores} />
                    )}

                    {section.id === "webhooks" && (
                      <WebhooksPanel 
                        webhooks={webhooks}
                        webhookLogs={webhookLogs}
                        processos={dbState.processos}
                        onSaveWebhook={async (wh) => onSaveWebhook(wh)}
                        onDeleteWebhook={async (id) => onDeleteWebhook(id)}
                        onTriggerTest={async (wh) => onTriggerTestWebhook(wh)}
                        onRedeliver={async (log) => onRedeliverWebhook(log)}
                        onClearLogs={onClearLogs}
                      />
                    )}

                    {section.id === "logs" && (
                      <div className="overflow-x-auto rounded-xl border border-[#334E68] bg-[#0B0C10] p-4">
                        <table className="w-full text-left border-collapse text-[10px] font-mono">
                          <thead>
                            <tr className="border-b border-[#334E68] text-[#BAC7D5] text-[9px] uppercase font-black tracking-wider">
                              <th className="py-1.5 px-3">ID</th>
                              <th className="py-1.5 px-3">Operador</th>
                              <th className="py-1.5 px-3">Data/Hora</th>
                              <th className="py-1.5 px-3">Ação Realizada</th>
                              <th className="py-1.5 px-3">Detalhes/Alterações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#334E68]/30 text-[10px]">
                            {dbState.logs.map((log, idx) => (
                              <tr key={idx} className="hover:bg-white/5 text-[#F4F6F9] transition-colors">
                                <td className="py-1 px-3 font-mono font-bold text-red-400">{log.id}</td>
                                <td className="py-1 px-3 text-[#BAC7D5]">{log.userEmail}</td>
                                <td className="py-1 px-3 text-slate-400 font-mono">
                                  {new Date(log.timestamp).toLocaleString("pt-BR")}
                                </td>
                                <td className="py-1 px-3 font-bold text-[#EBF0F5]">{log.action}</td>
                                <td className="py-1 px-3 max-w-[250px] truncate text-slate-400 font-normal" title={log.changes}>
                                  {log.changes}
                                </td>
                              </tr>
                            ))}

                            {dbState.logs.length === 0 && (
                              <tr>
                                <td colSpan={5} className="py-8 text-center text-[#BAC7D5]">
                                  Nenhum log operacional registrado.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
