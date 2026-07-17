import React, { useState } from "react";
import { 
  FileText, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  Settings, 
  Eye, 
  EyeOff,
  HelpCircle
} from "lucide-react";
import { ModeloOCR, CustomFieldOCR, Processo, DocumentoPendente } from "../types";
import OCREnginePlayground from "./OCREnginePlayground";

interface ModelosOCRPanelProps {
  modelos: ModeloOCR[];
  onSaveModel: (model: ModeloOCR) => void;
  onDeleteModel: (modelId: string) => void;
  processos: Processo[];
  onAddProcess: (p: Processo) => void;
  onUpdateProcess: (registro: string, fields: Partial<Processo>) => void;
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

export default function ModelosOCRPanel({ 
  modelos, 
  onSaveModel, 
  onDeleteModel,
  processos,
  onAddProcess,
  onUpdateProcess,
  documentosPendentes,
  setDocumentosPendentes
}: ModelosOCRPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<"modelos" | "playground">("modelos");
  const [isEditing, setIsEditing] = useState(false);
  const [editingModel, setEditingModel] = useState<ModeloOCR | null>(null);

  const [name, setName] = useState("");
  const [keywordsInput, setKeywordsInput] = useState("");
  const [fields, setFields] = useState<CustomFieldOCR[]>([]);

  // Temp field state for addition
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldMapping, setNewFieldMapping] = useState("observacoes");

  const handleStartCreate = () => {
    setName("");
    setKeywordsInput("");
    setFields([]);
    setEditingModel(null);
    setIsEditing(true);
  };

  const handleStartEdit = (model: ModeloOCR) => {
    setEditingModel(model);
    setName(model.name);
    setKeywordsInput(model.keywords.join(", "));
    setFields([...model.fields]);
    setIsEditing(true);
  };

  const handleAddField = () => {
    if (!newFieldKey || !newFieldLabel) return;
    const newField: CustomFieldOCR = {
      key: newFieldKey.toLowerCase().replace(/\s+/g, "_"),
      label: newFieldLabel,
      mapping: newFieldMapping
    };
    setFields([...fields, newField]);
    setNewFieldKey("");
    setNewFieldLabel("");
  };

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!name) return;
    const keywords = keywordsInput
      .split(",")
      .map(k => k.trim().toUpperCase())
      .filter(k => k !== "");

    const newModel: ModeloOCR = {
      id: editingModel ? editingModel.id : `CUSTOM_${Date.now()}`,
      name,
      active: editingModel ? editingModel.active : true,
      keywords,
      fields
    };

    onSaveModel(newModel);
    setIsEditing(false);
    setEditingModel(null);
  };

  const handleToggleActive = (model: ModeloOCR) => {
    onSaveModel({
      ...model,
      active: !model.active
    });
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 print:hidden">
        <button
          onClick={() => setActiveSubTab("modelos")}
          className={`flex items-center gap-2 py-2.5 px-4 text-xs font-bold rounded-t-xl transition-all ${
            activeSubTab === "modelos"
              ? "bg-white dark:bg-slate-900 border-t border-x border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 -mb-[1px]"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
          }`}
        >
          <Settings className="w-4 h-4" />
          Estrutura de Modelos & Campos
        </button>
        <button
          onClick={() => setActiveSubTab("playground")}
          className={`flex items-center gap-2 py-2.5 px-4 text-xs font-bold rounded-t-xl transition-all ${
            activeSubTab === "playground"
              ? "bg-white dark:bg-slate-900 border-t border-x border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 -mb-[1px]"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          Central de Engenharia de OCR & Associação (Fases 0-3)
        </button>
      </div>

      {activeSubTab === "modelos" ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-500" />
                Configurações de Modelos Inteligentes de OCR
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Crie, edite ou desative modelos de documentos para reconhecimento automático de arquivos com Inteligência Artificial.
              </p>
            </div>
            {!isEditing && (
              <button
                onClick={handleStartCreate}
                className="flex items-center gap-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Novo Modelo
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 bg-slate-50/50 dark:bg-slate-950/20">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                  {editingModel ? `Editar Modelo: ${editingModel.name}` : "Criar Novo Modelo OCR"}
                </h3>
                <button 
                  onClick={() => setIsEditing(false)} 
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Nome do Modelo
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Confirmação de Grade / Ordem de Carregamento"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Palavras-chave para Recognition (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: GRADE, CARREGAMENTO, INBOUND"
                    value={keywordsInput}
                    onChange={(e) => setKeywordsInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
                  Campos para Extrair e Mapear
                </h4>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        Chave do Campo (Ex: motorista_nome)
                      </label>
                      <input
                        type="text"
                        value={newFieldKey}
                        onChange={(e) => setNewFieldKey(e.target.value)}
                        placeholder="Ex: motorista_nome"
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        Nome no Documento (Rótulo)
                      </label>
                      <input
                        type="text"
                        value={newFieldLabel}
                        onChange={(e) => setNewFieldLabel(e.target.value)}
                        placeholder="Ex: Motorista Responsável"
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-md"
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          Mapear para Campo do Processo
                        </label>
                        <select
                          value={newFieldMapping}
                          onChange={(e) => setNewFieldMapping(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-md"
                        >
                          {PROCESS_FIELDS.map(f => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddField}
                        className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium text-xs flex items-center gap-1 self-end h-[34px]"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {fields.map((field, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg text-xs"
                    >
                      <div className="grid grid-cols-3 gap-4 flex-1">
                        <div>
                          <span className="text-slate-400 mr-1">Chave:</span>
                          <strong className="text-slate-700 dark:text-slate-200">{field.key}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 mr-1">Rótulo:</span>
                          <span className="text-slate-600 dark:text-slate-300">{field.label}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 mr-1">Mapeamento:</span>
                          <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-semibold">
                            {PROCESS_FIELDS.find(f => f.value === field.mapping)?.label || field.mapping}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRemoveField(index)}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {fields.length === 0 && (
                    <div className="text-center py-4 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                      Nenhum campo configurado para este modelo.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setIsEditing(false)}
                  className="py-1.5 px-4 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold"
                >
                  Salvar Modelo
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modelos.map((modelo, idx) => (
                <div 
                  key={modelo.id}
                  className={`border rounded-xl p-4 flex flex-col justify-between transition-all ${
                    modelo.active 
                      ? "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" 
                      : "border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/10 opacity-70"
                  }`}
                  id={`ocr-model-${modelo.id}`}
                >
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className={`w-4 h-4 ${modelo.active ? "text-indigo-500" : "text-slate-400"}`} />
                        <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                          {modelo.name}
                        </h3>
                      </div>
                      <button
                        onClick={() => handleToggleActive(modelo)}
                        title={modelo.active ? "Desativar modelo" : "Ativar modelo"}
                        className={`p-1 rounded-md transition-all ${
                          modelo.active 
                            ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100" 
                            : "text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
                        }`}
                      >
                        {modelo.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {modelo.keywords.map((kw, i) => (
                        <span 
                          key={i} 
                          className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded uppercase"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                      <div className="font-semibold mb-1">Mapeamentos:</div>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {modelo.fields.map((f, i) => (
                          <div key={i} className="flex justify-between text-[11px] border-b border-slate-50 dark:border-slate-850 py-0.5">
                            <span className="text-slate-600 dark:text-slate-300">{f.label}</span>
                            <span className="text-indigo-500 font-medium">
                              {PROCESS_FIELDS.find(pf => pf.value === f.mapping)?.label || f.mapping}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
                    <button
                      onClick={() => handleStartEdit(modelo)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all text-xs flex items-center gap-1 font-medium"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    {!modelo.id.startsWith("MODEL_") && (
                      <button
                        onClick={() => onDeleteModel(modelo.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 transition-all text-xs flex items-center gap-1 font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Excluir
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <OCREnginePlayground
          modelos={modelos}
          processos={processos}
          onAddProcess={onAddProcess}
          onUpdateProcess={onUpdateProcess}
          documentosPendentes={documentosPendentes}
          setDocumentosPendentes={setDocumentosPendentes}
        />
      )}
    </div>
  );
}
