import React, { useState } from "react";
import { Search, Eye, Filter, ArrowUpDown } from "lucide-react";
import { Processo } from "../types";

interface GridViewProps {
  processos: Processo[];
  onViewProcess?: (p: Processo) => void;
}

export default function GridView({ processos, onViewProcess }: GridViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = processos.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      p.registro.toLowerCase().includes(term) ||
      p.cliente.toLowerCase().includes(term) ||
      p.container.toLowerCase().includes(term) ||
      p.processo.toLowerCase().includes(term);

    const matchesStatus = statusFilter === "all" || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const base = "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ";
    switch (status) {
      case "Agendado":
        return `${base} bg-sky-500/10 text-sky-400 border-sky-500/25`;
      case "Coletado":
        return `${base} bg-amber-500/10 text-amber-400 border-amber-500/25`;
      case "Em Trânsito":
        return `${base} bg-indigo-500/10 text-indigo-400 border-indigo-500/25`;
      case "Entregue":
        return `${base} bg-emerald-500/10 text-emerald-400 border-emerald-500/25`;
      case "Devolvido":
        return `${base} bg-zinc-500/10 text-zinc-400 border-zinc-500/25`;
      default:
        return `${base} bg-red-500/10 text-red-400 border-red-500/25`;
    }
  };

  return (
    <div className="space-y-4 w-full max-w-7xl mx-auto">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-zinc-950 border border-zinc-900 p-4 rounded-xl shadow-md">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar planilha de processos por ID, cliente, container..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-zinc-900 bg-zinc-950 text-zinc-100 rounded-lg focus:outline-none focus:border-red-600 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Filter className="w-4 h-4 text-zinc-500 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto bg-zinc-950 border border-zinc-900 text-xs text-zinc-300 py-2 px-3 rounded-lg focus:outline-none focus:border-red-600 font-bold uppercase tracking-wider"
          >
            <option value="all">TODOS OS STATUS</option>
            <option value="Agendado">AGENDADO</option>
            <option value="Coletado">COLETADO</option>
            <option value="Em Trânsito">EM TRÂNSITO</option>
            <option value="Entregue">ENTREGUE</option>
            <option value="Devolvido">DEVOLVIDO</option>
            <option value="Pendente">PENDENTE</option>
          </select>
        </div>
      </div>

      {/* Grid view table */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[10px] font-mono">
            <thead>
              <tr className="border-b border-zinc-900 bg-black text-zinc-400 text-[9px] uppercase font-black tracking-wider">
                <th className="py-1.5 px-3 font-black">ID (Nº REGISTRO)</th>
                <th className="py-1.5 px-3 font-black">CLIENTE</th>
                <th className="py-1.5 px-3 font-black">Nº PROCESSO</th>
                <th className="py-1.5 px-3 font-black">Nº CONTAINER</th>
                <th className="py-1.5 px-3 font-black">STATUS OPERACIONAL</th>
                <th className="py-1.5 px-3 font-black">ÚLTIMA MODIFICAÇÃO</th>
                {onViewProcess && <th className="py-1.5 px-3 text-center font-black">AÇÕES</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/60 text-[10px]">
              {filtered.map((p, idx) => (
                <tr 
                  key={p.registro} 
                  className={`transition-colors duration-150 hover:bg-zinc-800 ${
                    idx % 2 === 0 ? "bg-zinc-950" : "bg-black/40"
                  }`}
                >
                  <td className="py-1 px-3 font-bold text-white uppercase tracking-wider font-mono">{p.registro}</td>
                  <td className="py-1 px-3 text-zinc-300 truncate max-w-[150px]">{p.cliente}</td>
                  <td className="py-1 px-3 text-zinc-400 font-mono">{p.processo}</td>
                  <td className="py-1 px-3 font-bold text-zinc-200 font-mono">{p.container} <span className="text-[8px] text-zinc-600 font-normal">({p.tipoContainer})</span></td>
                  <td className="py-1 px-3">{getStatusBadge(p.status)}</td>
                  <td className="py-1 px-3 text-zinc-500 font-mono">{p.dataCriado || "Não informada"}</td>
                  {onViewProcess && (
                    <td className="py-1 px-3 text-center">
                      <button
                        onClick={() => onViewProcess(p)}
                        className="py-0.5 px-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3 text-zinc-500" />
                        <span>Visualizar</span>
                      </button>
                    </td>
                  )}
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={onViewProcess ? 7 : 6} className="text-center py-12 text-zinc-600">
                    Nenhum registro correspondente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
