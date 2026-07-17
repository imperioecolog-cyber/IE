import React, { useState } from "react";
import { Search, Filter, RefreshCw, FileSpreadsheet, Eye, X } from "lucide-react";
import { DBState, WebhookConfig } from "../types";

interface GridRow {
  id: string;
  name: string;
  type: "Processo" | "Cliente" | "Motorista" | "Armador" | "Webhook" | "Modelo OCR";
  status: string;
  lastUpdate: string;
  details: string;
}

interface DataGridViewProps {
  dbState: DBState;
  webhooks: WebhookConfig[];
}

export default function DataGridView({ dbState, webhooks }: DataGridViewProps) {
  // Aggregate all entities dynamically
  const allRows: GridRow[] = [];

  // 1. Processos
  dbState.processos.forEach(p => {
    allRows.push({
      id: p.registro,
      name: `Processo ${p.processo} - ${p.cliente}`,
      type: "Processo",
      status: p.status,
      lastUpdate: p.dataCriado || "Hoje",
      details: `Container: ${p.container} | Armador: ${p.armador} | Frete: R$ ${p.valorFrete}`
    });
  });

  // 2. Clientes
  dbState.clientes.forEach(c => {
    allRows.push({
      id: `CLI-${c.cnpj.substring(0, 8)}`,
      name: c.nome,
      type: "Cliente",
      status: "Registrado",
      lastUpdate: "Permanente",
      details: `CNPJ: ${c.cnpj} | Email: ${c.email} | Contato: ${c.contato}`
    });
  });

  // 3. Prestadores de Serviço
  dbState.prestadores.forEach(m => {
    allRows.push({
      id: `PREST-${m.cpf.substring(0, 6)}`,
      name: m.nome,
      type: "Motorista",
      status: "Verificado",
      lastUpdate: "Válido",
      details: `CPF: ${m.cpf} | CNH: ${m.cnh} | Tel: ${m.celular} | Cavalo: ${m.cavaloPlaca} | Carreta: ${m.carretaPlaca}`
    });
  });

  // 4. Armadores
  dbState.armadores.forEach(a => {
    allRows.push({
      id: `ARM-${a.nome.toUpperCase().replace(/\s/g, "-")}`,
      name: a.nome,
      type: "Armador",
      status: a.tipoAcesso,
      lastUpdate: "Ativo",
      details: `Portal: ${a.portal} | Link Devolução: ${a.linkDevolucao}`
    });
  });

  // 5. Webhooks
  webhooks.forEach(w => {
    allRows.push({
      id: w.id,
      name: w.nome,
      type: "Webhook",
      status: w.active ? "Ativo" : "Inativo",
      lastUpdate: w.createdAt ? new Date(w.createdAt).toLocaleDateString("pt-BR") : "Recente",
      details: `URL: ${w.url} | Eventos: ${w.events.join(", ")}`
    });
  });

  // 6. Modelos OCR
  dbState.modelosOCR.forEach(o => {
    allRows.push({
      id: o.id,
      name: o.name,
      type: "Modelo OCR",
      status: o.active ? "Ativo" : "Inativo",
      lastUpdate: "Homologado",
      details: `Campos: ${o.fields.map(f => f.label).join(", ")} | Palavras-chave: ${o.keywords.join(", ")}`
    });
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("All");
  const [selectedRow, setSelectedRow] = useState<GridRow | null>(null);

  // Filter application
  const filteredRows = allRows.filter(row => {
    const matchesSearch = 
      row.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.status.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "All" || row.type === filterType;

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-4">
      {/* Control / Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#12161A] border border-[#334E68] p-4 rounded-xl shadow-md">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#BAC7D5]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar em toda a planilha executiva (IDs, Status, Detalhes)..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-[#334E68] bg-[#0B0C10] text-[#F4F6F9] rounded-lg focus:outline-none focus:border-[#F4F6F9]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#BAC7D5] shrink-0" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="flex-1 sm:flex-initial bg-[#0B0C10] border border-[#334E68] text-xs text-[#F4F6F9] py-2 px-3 rounded-lg focus:outline-none focus:border-[#F4F6F9] font-bold"
          >
            <option value="All">Todas as Entidades</option>
            <option value="Processo">Processos Operacionais</option>
            <option value="Cliente">Clientes</option>
            <option value="Motorista">Motoristas</option>
            <option value="Armador">Armadores</option>
            <option value="Webhook">Webhooks</option>
            <option value="Modelo OCR">Modelos OCR & IA</option>
          </select>
        </div>
      </div>

      {/* Grid Table Container */}
      <div className="bg-[#12161A] border border-[#334E68] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[10px] font-mono">
            <thead>
              <tr className="border-b border-[#334E68] bg-[#0B0C10] text-[#BAC7D5] text-[9px] uppercase font-black tracking-wider">
                <th className="py-1.5 px-3">Identificador</th>
                <th className="py-1.5 px-3">Tipo</th>
                <th className="py-1.5 px-3">Nome da Entidade</th>
                <th className="py-1.5 px-3">Status Atual</th>
                <th className="py-1.5 px-3">Última Modificação</th>
                <th className="py-1.5 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334E68]/30">
              {filteredRows.map((row) => (
                <tr key={`${row.type}-${row.id}`} className="hover:bg-white/5 text-[#F4F6F9] transition-colors text-[10px]">
                  <td className="py-1 px-3 font-mono font-bold text-red-400">{row.id}</td>
                  <td className="py-1 px-3">
                    <span className="text-[8px] font-black uppercase tracking-widest bg-white/5 border border-[#334E68]/50 px-1 py-0.5 rounded text-[#BAC7D5]">
                      {row.type}
                    </span>
                  </td>
                  <td className="py-1 px-3 font-bold text-[#EBF0F5] max-w-[200px] truncate" title={row.name}>
                    {row.name}
                  </td>
                  <td className="py-1 px-3">
                    <span className={`inline-flex items-center gap-1 text-[9px] font-bold ${
                      row.status === "Ativo" || row.status === "Sucesso" || row.status === "Entregue" || row.status === "Verificado"
                        ? "text-emerald-400"
                        : row.status === "Inativo" || row.status === "Pendente" || row.status === "Agendado"
                        ? "text-amber-400"
                        : "text-red-400"
                    }`}>
                      <span className={`w-1 h-1 rounded-full ${
                        row.status === "Ativo" || row.status === "Sucesso" || row.status === "Entregue" || row.status === "Verificado"
                          ? "bg-emerald-400"
                          : row.status === "Inativo" || row.status === "Pendente" || row.status === "Agendado"
                          ? "bg-amber-400"
                          : "bg-red-400 animate-pulse"
                      }`} />
                      {row.status}
                    </span>
                  </td>
                  <td className="py-1 px-3 text-[#BAC7D5] font-mono">{row.lastUpdate}</td>
                  <td className="py-1 px-3 text-center">
                    <button
                      onClick={() => setSelectedRow(row)}
                      className="py-0.5 px-1.5 hover:bg-white/5 rounded text-[#BAC7D5] hover:text-[#F4F6F9] inline-flex items-center gap-1 cursor-pointer font-bold text-[9px] border border-[#334E68]/40 bg-[#0B0C10]/30"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspecionar</span>
                    </button>
                  </td>
                </tr>
              ))}

              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#BAC7D5] font-semibold">
                    Nenhum registro encontrado correspondente aos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row details popup */}
      {selectedRow && (
        <div id="grid-row-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0B0C10]/85 backdrop-blur-sm" onClick={() => setSelectedRow(null)} />
          <div className="relative bg-[#12161A] border border-[#334E68] rounded-xl max-w-md w-full overflow-hidden shadow-2xl z-10">
            <div className="flex items-center justify-between p-4 bg-[#0B0C10] border-b border-[#334E68]">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-white">
                  Metadados de Linha Consolidada
                </h4>
              </div>
              <button onClick={() => setSelectedRow(null)} className="text-[#BAC7D5] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <span className="text-[9px] font-black tracking-widest uppercase bg-white/5 border border-[#334E68]/50 px-2 py-0.5 rounded text-[#BAC7D5]">
                  {selectedRow.type}
                </span>
                <h3 className="text-sm font-bold text-[#F4F6F9] pt-1">{selectedRow.name}</h3>
                <p className="text-xs text-[#BAC7D5]">ID de Banco: {selectedRow.id}</p>
              </div>

              <div className="p-4 bg-[#0B0C10] border border-[#334E68]/50 rounded-xl">
                <p className="text-[10px] font-mono text-[#BAC7D5] whitespace-pre-wrap leading-relaxed">
                  {selectedRow.details}
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedRow(null)}
                  className="py-2 px-4 bg-[#F4F6F9] text-black hover:bg-[#EBF0F5] font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow"
                >
                  Fechar Planilha
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
