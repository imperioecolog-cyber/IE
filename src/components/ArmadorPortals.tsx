import React, { useState } from "react";
import { Ship, ExternalLink, Mail, Search, Info, MapPin } from "lucide-react";
import { Armador } from "../types";

interface ArmadorPortalsProps {
  armadores: Armador[];
}

export default function ArmadorPortals({ armadores }: ArmadorPortalsProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredArmadores = armadores.filter(a => 
    a.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.portal.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.observacoes && a.observacoes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenPortal = (url: string) => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleSendEmail = (armadorNome: string) => {
    const subject = encodeURIComponent(`Solicitação de Devolução de Contêiner - ${armadorNome}`);
    const body = encodeURIComponent(`Prezados,\n\nGostaríamos de solicitar a liberação para devolução de contêiner vazio.\n\nAtenciosamente,\nOperacional Logística`);
    window.location.href = `mailto:devolucao@${armadorNome.toLowerCase().replace(/\s+/g, "")}.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Ship className="w-5 h-5 text-indigo-500" />
            Portais de Armadores & Devolução de Contêineres
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Acesso rápido aos sistemas de devolução de vazios e contato direto com os armadores.
          </p>
        </div>
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar armador..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredArmadores.map((armador, idx) => (
          <div 
            key={idx} 
            className="flex flex-col lg:flex-row lg:items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl gap-4 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all"
            id={`armador-row-${idx}`}
          >
            {/* Nome e Tipo do Armador */}
            <div className="flex items-center gap-3 min-w-[200px] lg:max-w-[260px] truncate">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm shrink-0">
                {armador.nome.substring(0, 2).toUpperCase()}
              </div>
              <div className="truncate">
                <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
                  {armador.nome}
                </h3>
                <span className="inline-block text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-medium">
                  {armador.tipoAcesso}
                </span>
              </div>
            </div>

            {/* Local de Devolução (observacoes) */}
            <div className="flex-1 min-w-[200px]">
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Local de Devolução</div>
              <div className="text-xs text-slate-700 dark:text-slate-300 mt-1 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                <span className="font-medium">{armador.observacoes || "Nenhum cadastrado"}</span>
              </div>
            </div>

            {/* Link do Portal */}
            <div className="flex-1 min-w-[220px]">
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Link do Portal</div>
              <div className="text-xs mt-1 flex items-center gap-1.5 truncate max-w-[240px]">
                <ExternalLink className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                {armador.portal || armador.linkDevolucao ? (
                  <a 
                    href={armador.portal || armador.linkDevolucao}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium truncate"
                  >
                    {armador.portal || armador.linkDevolucao}
                  </a>
                ) : (
                  <span className="text-slate-400 dark:text-slate-600 italic">Não disponível</span>
                )}
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleOpenPortal(armador.linkDevolucao || armador.portal)}
                disabled={!(armador.linkDevolucao || armador.portal)}
                className="flex items-center justify-center gap-1.5 py-1.5 px-3.5 text-xs font-semibold text-indigo-600 hover:text-white dark:text-indigo-400 hover:bg-indigo-600 border border-indigo-250 dark:border-indigo-800/60 rounded-lg transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Abrir Portal
              </button>
              <button
                onClick={() => handleSendEmail(armador.nome)}
                className="flex items-center justify-center gap-1.5 py-1.5 px-3.5 text-xs font-semibold text-slate-600 hover:text-white dark:text-slate-400 hover:bg-slate-700 border border-slate-200 dark:border-slate-800 rounded-lg transition-all cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                Enviar E-mail
              </button>
            </div>
          </div>
        ))}

        {filteredArmadores.length === 0 && (
          <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            Nenhum armador encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
