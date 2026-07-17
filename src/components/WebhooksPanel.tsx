import React, { useState } from "react";
import { 
  WebhookConfig, 
  WebhookDeliveryLog, 
  Processo 
} from "../types";
import { 
  Radio, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Activity, 
  RefreshCw, 
  Play, 
  ShieldAlert, 
  Code, 
  Copy,
  Globe,
  Search,
  CheckCircle,
  XCircle,
  HelpCircle,
  FlameKindling
} from "lucide-react";

interface WebhooksPanelProps {
  webhooks: WebhookConfig[];
  webhookLogs: WebhookDeliveryLog[];
  processos: Processo[];
  onSaveWebhook: (webhook: WebhookConfig) => void;
  onDeleteWebhook: (id: string) => void;
  onTriggerTest: (webhook: WebhookConfig) => Promise<void>;
  onRedeliver: (log: WebhookDeliveryLog) => Promise<void>;
  onClearLogs: () => void;
}

export default function WebhooksPanel({
  webhooks,
  webhookLogs,
  processos,
  onSaveWebhook,
  onDeleteWebhook,
  onTriggerTest,
  onRedeliver,
  onClearLogs
}: WebhooksPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchLog, setSearchLog] = useState("");
  const [filterWebhook, setFilterWebhook] = useState("all");
  const [filterSuccess, setFilterSuccess] = useState("all");
  const [selectedLog, setSelectedLog] = useState<WebhookDeliveryLog | null>(null);

  // Form State
  const [formId, setFormId] = useState("");
  const [formNome, setFormNome] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formSecret, setFormSecret] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [formEvents, setFormEvents] = useState<string[]>(["any"]);

  const handleEdit = (wh: WebhookConfig) => {
    setFormId(wh.id);
    setFormNome(wh.nome);
    setFormUrl(wh.url);
    setFormSecret(wh.secret);
    setFormActive(wh.active);
    setFormEvents(wh.events);
    setIsEditing(true);
  };

  const handleCreateNew = () => {
    setFormId("");
    setFormNome("");
    setFormUrl("");
    setFormSecret(`whsec_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`);
    setFormActive(true);
    setFormEvents(["any"]);
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim() || !formUrl.trim()) {
      alert("Nome e URL do Webhook são obrigatórios.");
      return;
    }

    const saved: WebhookConfig = {
      id: formId || `WH-${Date.now()}`,
      nome: formNome.trim(),
      url: formUrl.trim(),
      secret: formSecret.trim(),
      events: formEvents,
      active: formActive,
      createdAt: new Date().toLocaleDateString("pt-BR")
    };

    onSaveWebhook(saved);
    setIsEditing(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleEvent = (event: string) => {
    if (event === "any") {
      setFormEvents(["any"]);
    } else {
      let updated = [...formEvents];
      // If "any" is selected, remove it first
      if (updated.includes("any")) {
        updated = updated.filter(e => e !== "any");
      }

      if (updated.includes(event)) {
        updated = updated.filter(e => e !== event);
        // If empty, default back to "any"
        if (updated.length === 0) {
          updated = ["any"];
        }
      } else {
        updated.push(event);
      }
      setFormEvents(updated);
    }
  };

  // Filter Delivery Logs
  const filteredLogs = webhookLogs.filter(log => {
    const matchesSearch = 
      log.webhookName.toLowerCase().includes(searchLog.toLowerCase()) ||
      log.webhookUrl.toLowerCase().includes(searchLog.toLowerCase()) ||
      log.payload.toLowerCase().includes(searchLog.toLowerCase()) ||
      log.event.toLowerCase().includes(searchLog.toLowerCase());

    const matchesWebhook = filterWebhook === "all" || log.webhookId === filterWebhook;
    const matchesSuccess = 
      filterSuccess === "all" || 
      (filterSuccess === "success" && log.success) || 
      (filterSuccess === "failure" && !log.success);

    return matchesSearch && matchesWebhook && matchesSuccess;
  });

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Radio className="w-5 h-5 text-indigo-500 animate-pulse" />
              Integrações Webhooks (Notificações em Tempo Real)
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Configure endpoints externos (URLs) para serem notificados via HTTP POST sempre que houver mudanças nos status dos processos logísticos.
            </p>
          </div>
          {!isEditing && (
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 py-2 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              Cadastrar Webhook
            </button>
          )}
        </div>
      </div>

      {/* EDITING FORM PANEL */}
      {isEditing && (
        <div className="bg-white dark:bg-slate-900 border-2 border-indigo-500 rounded-xl p-6 shadow-md transition-all">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-500" />
              {formId ? "Editar Webhook" : "Cadastrar Novo Webhook Externo"}
            </h3>
            <button 
              onClick={() => setIsEditing(false)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-450"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-600 dark:text-slate-400">Nome do Sistema Receptor</label>
                <input
                  type="text"
                  required
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Ex: ERP Logístico Comercial, Slack Channel, etc."
                  className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 rounded-lg focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-600 dark:text-slate-400">Chave Secreta de Assinatura (X-Webhook-Secret)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formSecret}
                    onChange={(e) => setFormSecret(e.target.value)}
                    placeholder="whsec_..."
                    className="flex-1 px-3.5 py-2 font-mono border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setFormSecret(`whsec_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg font-bold"
                  >
                    Gerar Chave
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-600 dark:text-slate-400">URL de Destino (Endpoint HTTP POST)</label>
              <input
                type="url"
                required
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://sua-api.com/webhook/receber-status"
                className="w-full px-3.5 py-2 font-mono border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 rounded-lg focus:ring-1 focus:ring-indigo-500"
              />
              <p className="text-[10px] text-slate-400">
                Garante que este endpoint aceita conexões HTTPS POST e responde com código HTTP 2xx para confirmar o recebimento.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block font-bold text-slate-600 dark:text-slate-400">Gatilhadores de Eventos (Event Triggers)</label>
              <p className="text-[10px] text-slate-450 -mt-1 mb-2">
                O webhook será disparado quando o status de qualquer processo mudar para os estados selecionados abaixo.
              </p>
              
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleToggleEvent("any")}
                  className={`py-1.5 px-3 rounded-lg font-bold border transition-all ${
                    formEvents.includes("any")
                      ? "bg-indigo-650 text-white border-indigo-650"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-750 hover:bg-slate-100"
                  }`}
                >
                  Qualquer mudança de status (Todos)
                </button>
                
                {["Pendente", "Agendado", "Coletado", "Em Trânsito", "Entregue", "Devolvido"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleToggleEvent(status)}
                    className={`py-1.5 px-3 rounded-lg font-bold border transition-all ${
                      formEvents.includes(status)
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-750 hover:bg-slate-100"
                    }`}
                  >
                    Status: {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="formActive"
                checked={formActive}
                onChange={(e) => setFormActive(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-650 border-slate-300 focus:ring-indigo-500"
              />
              <label htmlFor="formActive" className="font-bold text-slate-700 dark:text-slate-300 select-none cursor-pointer">
                Webhook Ativado (Dispara notificações automaticamente)
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="py-2 px-4 border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="py-2 px-5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all shadow-sm"
              >
                Salvar Configurações
              </button>
            </div>
          </form>
        </div>
      )}

      {/* WEBHOOKS CONFIGURED LIST */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-xs text-slate-700 dark:text-slate-300">
            Webhooks Cadastrados ({webhooks.length})
          </h3>
        </div>

        <div className="divide-y divide-slate-150 dark:divide-slate-800">
          {webhooks.map((wh) => (
            <div key={wh.id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/30 transition-all">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{wh.nome}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                    wh.active 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900" 
                      : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                  }`}>
                    {wh.active ? "Ativo" : "Inativo"}
                  </span>
                  <span className="text-[10px] text-slate-400">Criado em {wh.createdAt}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                  <Globe className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span className="truncate" title={wh.url}>{wh.url}</span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <span className="font-bold">Secret:</span>
                    <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded flex items-center gap-1">
                      {wh.secret.substring(0, 15)}...
                      <button 
                        onClick={() => copyToClipboard(wh.secret, wh.id + "-sec")}
                        className="text-slate-400 hover:text-indigo-500"
                        title="Copiar Secret"
                      >
                        {copiedId === wh.id + "-sec" ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2.5 h-2.5" />}
                      </button>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-bold">Gatilhadores:</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-350 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {wh.events.includes("any") ? "Qualquer status" : wh.events.join(", ")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-end md:self-auto shrink-0">
                <button
                  onClick={() => onTriggerTest(wh)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-750 dark:text-slate-200 border border-slate-250 dark:border-slate-700 font-bold text-[10px] rounded"
                  title="Enviar payload de teste"
                >
                  <Play className="w-3 h-3 text-emerald-500" />
                  Testar Conexão
                </button>
                <button
                  onClick={() => handleEdit(wh)}
                  className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 border border-slate-250 dark:border-slate-700 rounded"
                  title="Editar"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteWebhook(wh.id)}
                  className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40 rounded"
                  title="Excluir"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {webhooks.length === 0 && (
            <div className="p-12 text-center text-slate-450 flex flex-col items-center justify-center gap-2">
              <ShieldAlert className="w-8 h-8 text-slate-300" />
              <p className="font-semibold text-xs">Nenhum Webhook cadastrado para notificações.</p>
              <p className="text-[11px] text-slate-400 max-w-sm">Use o botão no topo para associar sistemas de terceiros (como ERPs, CRMs ou canais de chat) à sua esteira logística.</p>
            </div>
          )}
        </div>
      </div>

      {/* DELIVERY HISTORY LOGS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500 animate-pulse" />
            <h3 className="font-bold text-xs text-slate-700 dark:text-slate-300">
              Histórico de Entregas & Logs de Disparo
            </h3>
          </div>
          {webhookLogs.length > 0 && (
            <button
              onClick={onClearLogs}
              className="font-bold text-[10px] text-rose-500 hover:text-rose-600 transition-all"
            >
              Limpar Logs
            </button>
          )}
        </div>

        {/* LOG FILTERS */}
        <div className="p-4 border-b border-slate-150 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="relative col-span-1 sm:col-span-2">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar logs por URL, payload, evento..."
              value={searchLog}
              onChange={(e) => setSearchLog(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 rounded-lg"
            />
          </div>

          <div>
            <select
              value={filterWebhook}
              onChange={(e) => setFilterWebhook(e.target.value)}
              className="w-full py-1.5 px-2.5 border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"
            >
              <option value="all">Filtrar por Webhook (Todos)</option>
              {webhooks.map(w => (
                <option key={w.id} value={w.id}>{w.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterSuccess}
              onChange={(e) => setFilterSuccess(e.target.value)}
              className="w-full py-1.5 px-2.5 border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"
            >
              <option value="all">Filtrar por Resultado (Todos)</option>
              <option value="success">Sucesso (HTTP 2xx / OK)</option>
              <option value="failure">Falhas (Erros HTTP / Rede)</option>
            </select>
          </div>
        </div>

        {/* LOG TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[10px] font-mono">
            <thead>
              <tr className="border-b border-slate-150 dark:border-slate-850 text-slate-400 bg-slate-50/20 text-[9px] uppercase font-black tracking-wider">
                <th className="py-1.5 px-3 font-bold">Status</th>
                <th className="py-1.5 px-3 font-bold">Webhook / URL</th>
                <th className="py-1.5 px-3 font-bold">Evento disparado</th>
                <th className="py-1.5 px-3 font-bold">Código HTTP</th>
                <th className="py-1.5 px-3 font-bold">Data/Hora</th>
                <th className="py-1.5 px-3 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[10px]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-all">
                  <td className="py-1 px-3">
                    {log.success ? (
                      <span className="flex items-center gap-1 text-emerald-650 dark:text-emerald-400 font-bold">
                        <CheckCircle className="w-3 h-3 shrink-0" />
                        Sucesso
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-650 dark:text-rose-400 font-bold">
                        <XCircle className="w-3 h-3 shrink-0" />
                        Falha
                      </span>
                    )}
                  </td>
                  <td className="py-1 px-3 max-w-[200px]">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700 dark:text-slate-300 font-sans truncate">{log.webhookName}</span>
                      <span className="text-[9px] text-slate-400 truncate font-mono">{log.webhookUrl}</span>
                    </div>
                  </td>
                  <td className="py-1 px-3 font-semibold text-slate-800 dark:text-slate-200">
                    <span className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-bold uppercase text-[8px]">
                      {log.event}
                    </span>
                  </td>
                  <td className="py-1 px-3">
                    <span className={`px-1.5 py-0.5 rounded font-bold font-mono ${
                      log.success 
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" 
                        : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                    }`}>
                      {log.responseStatus}
                    </span>
                  </td>
                  <td className="py-1 px-3 text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleString("pt-BR")}
                  </td>
                  <td className="py-1 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                        className="py-0.5 px-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold text-[9px] rounded border border-slate-200 dark:border-slate-800"
                      >
                        <Code className="w-3 h-3 inline mr-1" />
                        {selectedLog?.id === log.id ? "Fechar" : "Inspecionar"}
                      </button>
                      <button
                        onClick={() => onRedeliver(log)}
                        className="p-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-750 text-indigo-650 dark:text-indigo-450 rounded"
                        title="Reenviar Payload"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Nenhum log de disparo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* DETAILED LOG INSPECTOR DRAWER */}
        {selectedLog && (
          <div className="p-5 border-t border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs grid grid-cols-1 md:grid-cols-2 gap-5 animate-fadeIn">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <Play className="w-3 h-3 text-emerald-500" />
                  Payload JSON Enviado (POST)
                </span>
                <button
                  onClick={() => copyToClipboard(selectedLog.payload, "selected-payload")}
                  className="text-slate-450 hover:text-indigo-500 flex items-center gap-1 font-sans text-[10px]"
                >
                  {copiedId === "selected-payload" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copiar Payload
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[10px] rounded-lg overflow-x-auto max-h-[250px] border border-slate-800">
                {JSON.stringify(JSON.parse(selectedLog.payload), null, 2)}
              </pre>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-indigo-500" />
                Resposta do Servidor Externo
              </span>
              <div className="p-3 bg-slate-900 text-slate-200 font-mono text-[10px] rounded-lg overflow-x-auto max-h-[250px] border border-slate-800 space-y-2">
                <div>
                  <span className="text-slate-500">Status Code:</span>{" "}
                  <strong className={selectedLog.success ? "text-emerald-400" : "text-rose-400"}>
                    {selectedLog.responseStatus}
                  </strong>
                </div>
                <div className="border-t border-slate-800 pt-2">
                  <span className="text-slate-500">Response Body:</span>
                  <pre className="mt-1 font-mono text-slate-300 whitespace-pre-wrap break-all">
                    {selectedLog.responseBody || "(Sem corpo de resposta do servidor)"}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
