import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Settings, FileText, Webhook, ChevronDown } from "lucide-react";
import { DBState, WebhookConfig, WebhookDeliveryLog, ModeloOCR, Processo } from "../types";

import CadastrosPanel from "./CadastrosPanel";
import RegrasExtracaoPage from "./RegrasExtracaoPage";
import WebhooksPanel from "./WebhooksPanel";

interface UnifiedWorkspaceProps {
  dbState: DBState;
  webhooks: WebhookConfig[];
  webhookLogs: WebhookDeliveryLog[];
  documentosPendentes: any[];
  setDocumentosPendentes: (val: any[]) => void;
  onAddItem: (category: keyof DBState, item: any) => void;
  onRemoveItem: (category: keyof DBState, idField: string, idValue: string) => void;
  onUpdateItem: (category: keyof DBState, idField: string, idValue: string, item: any) => void;
  onSaveModel: (model: ModeloOCR) => Promise<void>;
  onDeleteModel: (modelId: string) => Promise<void>;
  onAddProcess: (p: Processo) => Promise<void>;
  onUpdateProcess: (registro: string, fields: Partial<Processo>) => Promise<void>;
  onSaveWebhook: (wh: WebhookConfig) => void;
  onDeleteWebhook: (whId: string) => void;
  onTriggerTestWebhook: (wh: WebhookConfig) => Promise<void>;
  onRedeliverWebhook: (log: WebhookDeliveryLog) => Promise<void>;
  onClearLogs: () => void;
}

export default function UnifiedWorkspace({
  dbState,
  webhooks,
  webhookLogs,
  documentosPendentes,
  setDocumentosPendentes,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onSaveModel,
  onDeleteModel,
  onAddProcess,
  onUpdateProcess,
  onSaveWebhook,
  onDeleteWebhook,
  onTriggerTestWebhook,
  onRedeliverWebhook,
  onClearLogs
}: UnifiedWorkspaceProps) {
  const [expandedSection, setExpandedSection] = useState<"cadastros" | "ocr" | "webhooks" | null>("cadastros");

  const toggleSection = (section: "cadastros" | "ocr" | "webhooks") => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto w-full">
      {/* SECTION 1: Configuração de Cadastros */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden transition-all">
        <button
          onClick={() => toggleSection("cadastros")}
          className="w-full flex items-center justify-between p-4.5 bg-black hover:bg-zinc-900/60 transition-colors text-left text-zinc-100 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${expandedSection === "cadastros" ? "bg-red-600 text-white" : "bg-zinc-900 text-zinc-400"}`}>
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider">Configuração de Cadastros</h3>
              <p className="text-[10px] text-zinc-500 font-semibold mt-0.5 uppercase">Clientes, Motoristas, Veículos e Credenciamento</p>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${expandedSection === "cadastros" ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence initial={false}>
          {expandedSection === "cadastros" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-5 border-t border-zinc-900">
                <CadastrosPanel
                  dbState={dbState}
                  onAddItem={onAddItem}
                  onRemoveItem={onRemoveItem}
                  onUpdateItem={onUpdateItem}
                  defaultActiveTab="clientes"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SECTION 2: Regras de Extração (OCR) */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden transition-all">
        <button
          onClick={() => toggleSection("ocr")}
          className="w-full flex items-center justify-between p-4.5 bg-black hover:bg-zinc-900/60 transition-colors text-left text-zinc-100 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${expandedSection === "ocr" ? "bg-red-600 text-white" : "bg-zinc-900 text-zinc-400"}`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider">Regras de Extração (OCR)</h3>
              <p className="text-[10px] text-zinc-500 font-semibold mt-0.5 uppercase">Modelos de IA e Inteligência de Documentos</p>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${expandedSection === "ocr" ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence initial={false}>
          {expandedSection === "ocr" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-5 border-t border-zinc-900">
                <RegrasExtracaoPage
                  modelos={dbState.modelosOCR}
                  onSaveModel={onSaveModel}
                  onDeleteModel={onDeleteModel}
                  processos={dbState.processos}
                  onAddProcess={onAddProcess}
                  onUpdateProcess={onUpdateProcess}
                  documentosPendentes={documentosPendentes}
                  setDocumentosPendentes={setDocumentosPendentes}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SECTION 3: Webhooks e Integrações */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden transition-all">
        <button
          onClick={() => toggleSection("webhooks")}
          className="w-full flex items-center justify-between p-4.5 bg-black hover:bg-zinc-900/60 transition-colors text-left text-zinc-100 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${expandedSection === "webhooks" ? "bg-red-600 text-white" : "bg-zinc-900 text-zinc-400"}`}>
              <Webhook className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider">Webhooks e Integrações</h3>
              <p className="text-[10px] text-zinc-500 font-semibold mt-0.5 uppercase">Sincronizadores e callbacks assíncronos</p>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${expandedSection === "webhooks" ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence initial={false}>
          {expandedSection === "webhooks" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-5 border-t border-zinc-900">
                <WebhooksPanel
                  webhooks={webhooks}
                  webhookLogs={webhookLogs}
                  processos={dbState.processos}
                  onSaveWebhook={onSaveWebhook}
                  onDeleteWebhook={onDeleteWebhook}
                  onTriggerTest={onTriggerTestWebhook}
                  onRedeliver={onRedeliverWebhook}
                  onClearLogs={onClearLogs}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
