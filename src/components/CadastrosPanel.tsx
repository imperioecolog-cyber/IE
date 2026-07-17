import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Users, 
  Truck, 
  MapPin, 
  Plus, 
  Trash2, 
  Info,
  Layers,
  Container,
  Ship,
  Edit3,
  ExternalLink
} from "lucide-react";
import { 
  Cliente, 
  PrestadorServico, 
  Transportadora, 
  Terminal,
  Armador,
  DBState
} from "../types";

interface CadastrosPanelProps {
  dbState: DBState;
  onAddItem: (category: keyof DBState, item: any) => void;
  onRemoveItem: (category: keyof DBState, idField: string, idValue: string) => void;
  onUpdateItem?: (category: keyof DBState, idField: string, idValue: string, updatedItem: any) => void;
  defaultActiveTab?: "clientes" | "prestadores" | "transportadoras" | "terminais" | "armadores";
  onSelectCliente?: (c: Cliente) => void;
  onSelectPrestadorServico?: (m: PrestadorServico) => void;
}

export default function CadastrosPanel({ dbState, onAddItem, onRemoveItem, onUpdateItem, defaultActiveTab, onSelectCliente, onSelectPrestadorServico }: CadastrosPanelProps) {
  const [activeTab, setActiveTab] = useState<"clientes" | "prestadores" | "transportadoras" | "terminais" | "armadores">(defaultActiveTab || "clientes");

  useEffect(() => {
    if (defaultActiveTab) {
      setActiveTab(defaultActiveTab);
    }
  }, [defaultActiveTab]);

  // Form states
  const [clienteForm, setClienteForm] = useState({ nome: "", cnpj: "", email: "", contato: "" });
  const [prestadorForm, setPrestadorServicoForm] = useState({ nome: "", cpf: "", cnh: "", celular: "", cavaloPlaca: "", carretaPlaca: "" });
  const [transportadoraForm, setTransportadoraForm] = useState({ nome: "", cnpj: "", contato: "", email: "" });
  const [terminalForm, setTerminalForm] = useState({ nome: "", cidade: "", contato: "" });
  const [armadorForm, setArmadorForm] = useState({ nome: "", portal: "", tipoAcesso: "Portal", observacoes: "", linkDevolucao: "" });

  // Editing state
  const [editingItem, setEditingItem] = useState<{ category: keyof DBState; originalId: string } | null>(null);

  const handleStartEdit = (category: keyof DBState, item: any) => {
    const originalId = item.nome;
    setEditingItem({ category, originalId });

    if (category === "clientes") {
      setClienteForm({ nome: item.nome, cnpj: item.cnpj || "", email: item.email || "", contato: item.contato || "" });
    } else if (category === "prestadores") {
      setPrestadorServicoForm({ nome: item.nome, cpf: item.cpf || "", cnh: item.cnh || "", celular: item.celular || "", cavaloPlaca: item.cavaloPlaca || "", carretaPlaca: item.carretaPlaca || "" });
    } else if (category === "transportadoras") {
      setTransportadoraForm({ nome: item.nome, cnpj: item.cnpj || "", contato: item.contato || "", email: item.email || "" });
    } else if (category === "terminais") {
      setTerminalForm({ nome: item.nome, cidade: item.cidade || "", contato: item.contato || "" });
    } else if (category === "armadores") {
      setArmadorForm({ 
        nome: item.nome, 
        portal: item.portal || "", 
        tipoAcesso: item.tipoAcesso || "Portal", 
        observacoes: item.observacoes || "", 
        linkDevolucao: item.linkDevolucao || "" 
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setClienteForm({ nome: "", cnpj: "", email: "", contato: "" });
    setPrestadorServicoForm({ nome: "", cpf: "", cnh: "", celular: "", cavaloPlaca: "", carretaPlaca: "" });
    setTransportadoraForm({ nome: "", cnpj: "", contato: "", email: "" });
    setTerminalForm({ nome: "", cidade: "", contato: "" });
    setArmadorForm({ nome: "", portal: "", tipoAcesso: "Portal", observacoes: "", linkDevolucao: "" });
  };

  const executeUpdate = (category: keyof DBState, idField: string, idValue: string, updatedItem: any) => {
    if (onUpdateItem) {
      onUpdateItem(category, idField, idValue, updatedItem);
    } else {
      onRemoveItem(category, idField, idValue);
      onAddItem(category, updatedItem);
    }
  };

  const handleAddCliente = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteForm.nome) return;
    
    if (editingItem && editingItem.category === "clientes") {
      executeUpdate("clientes", "nome", editingItem.originalId, clienteForm);
      setEditingItem(null);
    } else {
      onAddItem("clientes", clienteForm);
    }
    setClienteForm({ nome: "", cnpj: "", email: "", contato: "" });
  };

  const handleAddPrestadorServico = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prestadorForm.nome) return;

    if (editingItem && editingItem.category === "prestadores") {
      executeUpdate("prestadores", "nome", editingItem.originalId, prestadorForm);
      setEditingItem(null);
    } else {
      onAddItem("prestadores", prestadorForm);
    }
    setPrestadorServicoForm({ nome: "", cpf: "", cnh: "", celular: "", cavaloPlaca: "", carretaPlaca: "" });
  };

  const handleAddTransportadora = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transportadoraForm.nome) return;

    if (editingItem && editingItem.category === "transportadoras") {
      executeUpdate("transportadoras", "nome", editingItem.originalId, transportadoraForm);
      setEditingItem(null);
    } else {
      onAddItem("transportadoras", transportadoraForm);
    }
    setTransportadoraForm({ nome: "", cnpj: "", contato: "", email: "" });
  };

  const handleAddTerminal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalForm.nome) return;

    if (editingItem && editingItem.category === "terminais") {
      executeUpdate("terminais", "nome", editingItem.originalId, terminalForm);
      setEditingItem(null);
    } else {
      onAddItem("terminais", terminalForm);
    }
    setTerminalForm({ nome: "", cidade: "", contato: "" });
  };

  const handleAddArmador = (e: React.FormEvent) => {
    e.preventDefault();
    if (!armadorForm.nome) return;

    if (editingItem && editingItem.category === "armadores") {
      executeUpdate("armadores", "nome", editingItem.originalId, armadorForm);
      setEditingItem(null);
    } else {
      onAddItem("armadores", armadorForm);
    }
    setArmadorForm({ nome: "", portal: "", tipoAcesso: "Portal", observacoes: "", linkDevolucao: "" });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-500" />
          Cadastros de Apoio Operacional
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Gerencie os registros de clientes, prestadores de serviços, transportadoras, terminais de cargas e armadores de contêineres.
        </p>
      </div>

      {/* Tabs navigation */}
      <div className="flex flex-wrap border-b border-slate-150 dark:border-slate-800 mb-6 gap-1">
        <button
          onClick={() => { setActiveTab("clientes"); handleCancelEdit(); }}
          className={`flex items-center gap-1.5 py-2.5 px-4 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
            activeTab === "clientes"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/20"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Clientes ({dbState.clientes.length})
        </button>
        <button
          onClick={() => { setActiveTab("prestadores"); handleCancelEdit(); }}
          className={`flex items-center gap-1.5 py-2.5 px-4 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
            activeTab === "prestadores"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/20"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850"
          }`}
        >
          <Users className="w-4 h-4" />
          Prestadores ({dbState.prestadores.length})
        </button>

        <button
          onClick={() => { setActiveTab("transportadoras"); handleCancelEdit(); }}
          className={`flex items-center gap-1.5 py-2.5 px-4 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
            activeTab === "transportadoras"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/20"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850"
          }`}
        >
          <Container className="w-4 h-4" />
          Transportadoras ({dbState.transportadoras.length})
        </button>
        <button
          onClick={() => { setActiveTab("terminais"); handleCancelEdit(); }}
          className={`flex items-center gap-1.5 py-2.5 px-4 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
            activeTab === "terminais"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/20"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850"
          }`}
        >
          <MapPin className="w-4 h-4" />
          Terminais ({dbState.terminais.length})
        </button>
        <button
          onClick={() => { setActiveTab("armadores"); handleCancelEdit(); }}
          className={`flex items-center gap-1.5 py-2.5 px-4 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
            activeTab === "armadores"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/20"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850"
          }`}
        >
          <Ship className="w-4 h-4" />
          Armadores ({dbState.armadores.length})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form panel */}
        <div className="border border-slate-150 dark:border-slate-800 rounded-xl p-5 bg-slate-50/40 dark:bg-slate-950/10">
          <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-indigo-500" />
            {editingItem ? "Editar Registro" : "Adicionar Registro"}
          </h3>

          {activeTab === "clientes" && (
            <form onSubmit={handleAddCliente} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Razão Social / Nome</label>
                <input
                  type="text"
                  required
                  value={clienteForm.nome}
                  onChange={(e) => setClienteForm({ ...clienteForm, nome: e.target.value })}
                  placeholder="Ex: Importadora S.A."
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">CNPJ</label>
                <input
                  type="text"
                  value={clienteForm.cnpj}
                  onChange={(e) => setClienteForm({ ...clienteForm, cnpj: e.target.value })}
                  placeholder="Ex: 00.000.000/0001-00"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">E-mail</label>
                <input
                  type="email"
                  value={clienteForm.email}
                  onChange={(e) => setClienteForm({ ...clienteForm, email: e.target.value })}
                  placeholder="Ex: contato@empresa.com"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Contato Responsável</label>
                <input
                  type="text"
                  value={clienteForm.contato}
                  onChange={(e) => setClienteForm({ ...clienteForm, contato: e.target.value })}
                  placeholder="Ex: Carlos Oliveira"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all">
                  {editingItem ? "Atualizar Cliente" : "Salvar Cliente"}
                </button>
                {editingItem && (
                  <button type="button" onClick={handleCancelEdit} className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all">
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          )}

          {activeTab === "prestadores" && (
            <form onSubmit={handleAddPrestadorServico} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={prestadorForm.nome}
                  onChange={(e) => setPrestadorServicoForm({ ...prestadorForm, nome: e.target.value })}
                  placeholder="Ex: João da Silva"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">CPF</label>
                <input
                  type="text"
                  value={prestadorForm.cpf}
                  onChange={(e) => setPrestadorServicoForm({ ...prestadorForm, cpf: e.target.value })}
                  placeholder="Ex: 000.000.000-00"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">CNH (Registro)</label>
                <input
                  type="text"
                  value={prestadorForm.cnh}
                  onChange={(e) => setPrestadorServicoForm({ ...prestadorForm, cnh: e.target.value })}
                  placeholder="Ex: 12345678901"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Celular / WhatsApp</label>
                <input
                  type="text"
                  value={prestadorForm.celular}
                  onChange={(e) => setPrestadorServicoForm({ ...prestadorForm, celular: e.target.value })}
                  placeholder="Ex: (13) 99999-8888"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Cavalo (Placa)</label>
                  <input
                    type="text"
                    value={prestadorForm.cavaloPlaca}
                    onChange={(e) => setPrestadorServicoForm({ ...prestadorForm, cavaloPlaca: e.target.value.toUpperCase() })}
                    placeholder="Ex: ABC1D23"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Carreta (Placa)</label>
                  <input
                    type="text"
                    value={prestadorForm.carretaPlaca}
                    onChange={(e) => setPrestadorServicoForm({ ...prestadorForm, carretaPlaca: e.target.value.toUpperCase() })}
                    placeholder="Ex: XYZ9W87"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 uppercase"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all">
                  {editingItem ? "Atualizar Prestador" : "Salvar Prestador"}
                </button>
                {editingItem && (
                  <button type="button" onClick={handleCancelEdit} className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all">
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          )}



          {activeTab === "transportadoras" && (
            <form onSubmit={handleAddTransportadora} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Nome Fantasia / Razão Social</label>
                <input
                  type="text"
                  required
                  value={transportadoraForm.nome}
                  onChange={(e) => setTransportadoraForm({ ...transportadoraForm, nome: e.target.value })}
                  placeholder="Ex: TransExpress Ltda"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">CNPJ</label>
                <input
                  type="text"
                  value={transportadoraForm.cnpj}
                  onChange={(e) => setTransportadoraForm({ ...transportadoraForm, cnpj: e.target.value })}
                  placeholder="Ex: 00.000.000/0001-00"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Contato Operacional</label>
                <input
                  type="text"
                  value={transportadoraForm.contato}
                  onChange={(e) => setTransportadoraForm({ ...transportadoraForm, contato: e.target.value })}
                  placeholder="Ex: Setor de Operações"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">E-mail Operacional</label>
                <input
                  type="email"
                  value={transportadoraForm.email}
                  onChange={(e) => setTransportadoraForm({ ...transportadoraForm, email: e.target.value })}
                  placeholder="Ex: operacional@trans.com"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all">
                  {editingItem ? "Atualizar Transportadora" : "Salvar Transportadora"}
                </button>
                {editingItem && (
                  <button type="button" onClick={handleCancelEdit} className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all">
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          )}

          {activeTab === "terminais" && (
            <form onSubmit={handleAddTerminal} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Nome do Terminal</label>
                <input
                  type="text"
                  required
                  value={terminalForm.nome}
                  onChange={(e) => setTerminalForm({ ...terminalForm, nome: e.target.value })}
                  placeholder="Ex: Santos Brasil (Tecon)"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Cidade / Estado</label>
                <input
                  type="text"
                  value={terminalForm.cidade}
                  onChange={(e) => setTerminalForm({ ...terminalForm, cidade: e.target.value })}
                  placeholder="Ex: Santos/SP"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Informações de Contato</label>
                <input
                  type="text"
                  value={terminalForm.contato}
                  onChange={(e) => setTerminalForm({ ...terminalForm, contato: e.target.value })}
                  placeholder="Ex: Tel: (13) 3200-0000"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all">
                  {editingItem ? "Atualizar Terminal" : "Salvar Terminal"}
                </button>
                {editingItem && (
                  <button type="button" onClick={handleCancelEdit} className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all">
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          )}

          {activeTab === "armadores" && (
            <form onSubmit={handleAddArmador} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Nome do Armador</label>
                <input
                  type="text"
                  required
                  value={armadorForm.nome}
                  onChange={(e) => setArmadorForm({ ...armadorForm, nome: e.target.value })}
                  placeholder="Ex: MSC, Maersk, CMA CGM"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Tipo de Acesso</label>
                <select
                  value={armadorForm.tipoAcesso}
                  onChange={(e) => setArmadorForm({ ...armadorForm, tipoAcesso: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                >
                  <option value="Portal">Portal</option>
                  <option value="E-mail">E-mail</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">URL / Portal de Tracking</label>
                <input
                  type="text"
                  value={armadorForm.portal}
                  onChange={(e) => setArmadorForm({ ...armadorForm, portal: e.target.value })}
                  placeholder="Ex: https://www.msc.com/track-a-shipment"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Local de Devolução (Vazio)</label>
                <input
                  type="text"
                  value={armadorForm.observacoes}
                  onChange={(e) => setArmadorForm({ ...armadorForm, observacoes: e.target.value })}
                  placeholder="Ex: Terminal Santos Brasil ou Ecoporto"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Link de Devolução Direto</label>
                <input
                  type="text"
                  value={armadorForm.linkDevolucao}
                  onChange={(e) => setArmadorForm({ ...armadorForm, linkDevolucao: e.target.value })}
                  placeholder="Ex: https://devolucao.msc.com"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all">
                  {editingItem ? "Atualizar Armador" : "Salvar Armador"}
                </button>
                {editingItem && (
                  <button type="button" onClick={handleCancelEdit} className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all">
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        {/* List panel */}
        <div className="lg:col-span-2 border border-slate-150 dark:border-slate-800 rounded-xl p-5 overflow-hidden flex flex-col h-[400px]">
          <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-4 uppercase tracking-wider flex items-center justify-between">
            <span>Registros Ativos</span>
            <span className="text-xs text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full font-bold">
              {activeTab === "clientes" && dbState.clientes.length}
              {activeTab === "prestadores" && dbState.prestadores.length}
              {activeTab === "transportadoras" && dbState.transportadoras.length}
              {activeTab === "terminais" && dbState.terminais.length}
              {activeTab === "armadores" && dbState.armadores.length}
            </span>
          </h3>

          <div className="flex-1 overflow-y-auto pr-1">
            {activeTab === "clientes" && (
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="border-b border-slate-150 dark:border-slate-850 text-slate-400 text-[9px] uppercase font-black tracking-wider">
                    <th className="py-1.5 px-2">Cliente</th>
                    <th className="py-1.5 px-2">CNPJ</th>
                    <th className="py-1.5 px-2">Contato</th>
                    <th className="py-1.5 px-2 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                  {dbState.clientes.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40">
                      <td className="py-1 px-2 font-medium text-slate-800 dark:text-slate-200">{c.nome}</td>
                      <td className="py-1 px-2 text-slate-550 dark:text-slate-400 font-mono">{c.cnpj}</td>
                      <td className="py-1 px-2 text-slate-500 dark:text-slate-400">{c.contato || c.email}</td>
                      <td className="py-1 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {onSelectCliente && (
                            <button 
                              onClick={() => onSelectCliente(c)}
                              className="text-emerald-500 hover:text-emerald-700 p-1 cursor-pointer"
                              title="Visualizar Ficha"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleStartEdit("clientes", c)}
                            className="text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-450 p-1 cursor-pointer"
                            title="Editar"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => onRemoveItem("clientes", "nome", c.nome)}
                            className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                            title="Remover"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "prestadores" && (
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="border-b border-slate-150 dark:border-slate-850 text-slate-400 text-[9px] uppercase font-black tracking-wider">
                    <th className="py-1.5 px-2">PrestadorServico</th>
                    <th className="py-1.5 px-2">CPF / CNH</th>
                    <th className="py-1.5 px-2">Cavalo/Carreta</th>
                    <th className="py-1.5 px-2">Contato</th>
                    <th className="py-1.5 px-2 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                  {dbState.prestadores.map((m, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40">
                      <td className="py-1 px-2 font-medium text-slate-800 dark:text-slate-200">{m.nome}</td>
                      <td className="py-1 px-2 text-slate-550 dark:text-slate-400 font-mono text-[9px]">{m.cpf} {m.cnh && `/ ${m.cnh}`}</td>
                      <td className="py-1 px-2 text-slate-550 dark:text-slate-400 font-mono text-[9px]">
                        <span className="font-bold bg-slate-100 dark:bg-slate-800 px-1 rounded">{m.cavaloPlaca || '-'}</span> / <span className="font-bold bg-slate-100 dark:bg-slate-800 px-1 rounded">{m.carretaPlaca || '-'}</span>
                      </td>
                      <td className="py-1 px-2 text-slate-500 dark:text-slate-400 font-mono">{m.celular}</td>
                      <td className="py-1 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {onSelectPrestadorServico && (
                            <button 
                              onClick={() => onSelectPrestadorServico(m)}
                              className="text-emerald-500 hover:text-emerald-700 p-1 cursor-pointer"
                              title="Visualizar Ficha"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleStartEdit("prestadores", m)}
                            className="text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-450 p-1 cursor-pointer"
                            title="Editar"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => onRemoveItem("prestadores", "nome", m.nome)}
                            className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                            title="Remover"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "transportadoras" && (
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="border-b border-slate-150 dark:border-slate-850 text-slate-400 text-[9px] uppercase font-black tracking-wider">
                    <th className="py-1.5 px-2">Transportadora</th>
                    <th className="py-1.5 px-2">CNPJ</th>
                    <th className="py-1.5 px-2">Contato</th>
                    <th className="py-1.5 px-2 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                  {dbState.transportadoras.map((t, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40">
                      <td className="py-1 px-2 font-medium text-slate-800 dark:text-slate-200">{t.nome}</td>
                      <td className="py-1 px-2 text-slate-550 dark:text-slate-400 font-mono">{t.cnpj}</td>
                      <td className="py-1 px-2 text-slate-500 dark:text-slate-400">{t.contato || t.email}</td>
                      <td className="py-1 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => handleStartEdit("transportadoras", t)}
                            className="text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-450 p-1 cursor-pointer"
                            title="Editar"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => onRemoveItem("transportadoras", "nome", t.nome)}
                            className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                            title="Remover"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "terminais" && (
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="border-b border-slate-150 dark:border-slate-850 text-slate-400 text-[9px] uppercase font-black tracking-wider">
                    <th className="py-1.5 px-2">Terminal</th>
                    <th className="py-1.5 px-2">Cidade/UF</th>
                    <th className="py-1.5 px-2">Contato</th>
                    <th className="py-1.5 px-2 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                  {dbState.terminais.map((t, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40">
                      <td className="py-1 px-2 font-medium text-slate-800 dark:text-slate-200">{t.nome}</td>
                      <td className="py-1 px-2 text-slate-500 dark:text-slate-400">{t.cidade}</td>
                      <td className="py-1 px-2 text-slate-400 dark:text-slate-500">{t.contato}</td>
                      <td className="py-1 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => handleStartEdit("terminais", t)}
                            className="text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-450 p-1 cursor-pointer"
                            title="Editar"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => onRemoveItem("terminais", "nome", t.nome)}
                            className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                            title="Remover"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "armadores" && (
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="border-b border-slate-150 dark:border-slate-850 text-slate-400 text-[9px] uppercase font-black tracking-wider">
                    <th className="py-1.5 px-2">Armador</th>
                    <th className="py-1.5 px-2">Tipo</th>
                    <th className="py-1.5 px-2">Devolução (Vazio)</th>
                    <th className="py-1.5 px-2 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                  {dbState.armadores.map((a, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40">
                      <td className="py-1 px-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{a.nome}</span>
                        {a.portal && (
                          <span className="block text-[9px] text-indigo-500 truncate max-w-[150px] font-mono" title={a.portal}>
                            {a.portal}
                          </span>
                        )}
                      </td>
                      <td className="py-1 px-2">
                        <span className="inline-block text-[9px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full font-bold">
                          {a.tipoAcesso}
                        </span>
                      </td>
                      <td className="py-1 px-2 text-slate-500 dark:text-slate-400 font-medium">{a.observacoes || "Nenhum cadastrado"}</td>
                      <td className="py-1 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => handleStartEdit("armadores", a)}
                            className="text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-450 p-1 cursor-pointer"
                            title="Editar"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => onRemoveItem("armadores", "nome", a.nome)}
                            className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                            title="Remover"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
