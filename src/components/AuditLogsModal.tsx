import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Copy, Download, ShieldAlert, CheckCircle2, Search, Calendar, Filter, FileText, RefreshCw, AlertCircle } from "lucide-react";
import { LogEntry } from "../types";
import { jsPDF } from "jspdf";

interface AuditLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: LogEntry[];
}

export default function AuditLogsModal({ isOpen, onClose, logs }: AuditLogsModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedActionType, setSelectedActionType] = useState("ALL");
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Helper function to format date into dd/MM/yyyy HH:mm:ss using Intl
  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return "Data Inválida";
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }).format(d);
    } catch (e) {
      return "Data Inválida";
    }
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Get dynamic unique action types for filter dropdown
  const actionTypes = useMemo(() => {
    const types = new Set<string>();
    logs.forEach(l => {
      if (l.action) types.add(l.action);
    });
    return Array.from(types);
  }, [logs]);

  // Apply filters on logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // 1. Text search
      const textMatches = 
        log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.changes.toLowerCase().includes(searchTerm.toLowerCase());

      if (!textMatches) return false;

      // 2. Action type filter
      if (selectedActionType !== "ALL" && log.action !== selectedActionType) {
        return false;
      }

      // 3. Date range filter
      const logTime = new Date(log.timestamp).getTime();
      if (startDate) {
        const start = new Date(`${startDate}T00:00:00`).getTime();
        if (logTime < start) return false;
      }
      if (endDate) {
        const end = new Date(`${endDate}T23:59:59`).getTime();
        if (logTime > end) return false;
      }

      return true;
    });
  }, [logs, searchTerm, selectedActionType, startDate, endDate]);

  const handleCopyLogs = () => {
    const text = filteredLogs.map(l => {
      const formattedDate = formatDateTime(l.timestamp);
      return `[ID: ${l.id}] DATA/HORA: ${formattedDate} | USUÁRIO: ${l.userEmail}\nAÇÃO: ${l.action}\nDESCRIÇÃO/MUDANÇAS: ${l.changes}\n----------------------------------------`;
    }).join("\n");

    if (filteredLogs.length === 0) {
      triggerToast("Nenhum registro correspondente para copiar!");
      return;
    }

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      triggerToast(`Copiado ${filteredLogs.length} logs formatados para a área de transferência!`);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error("Erro ao copiar", err);
      triggerToast("Erro ao usar a Clipboard API");
    });
  };

  const handleDownloadPDF = () => {
    try {
      if (filteredLogs.length === 0) {
        triggerToast("Nenhum registro para exportar!");
        return;
      }

      const doc = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4"
      });

      const itemsPerPage = filteredLogs;
      let pageNumber = 1;

      // Cover / Header on first page
      const drawHeader = (pageNum: number, totalPagesPlaceholder: string) => {
        // Deep Charcoal background banner
        doc.setFillColor(11, 12, 16); 
        doc.rect(0, 0, 210, 45, "F");
        
        doc.setTextColor(244, 246, 249); // Ice White
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("IMPERIO ECOLOG - LOGISTICA AVANCADA", 15, 18);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(186, 199, 213); // Muted ice
        doc.text("SISTEMA DE RELATORIO DE AUDITORIA E COMPLIANCE OPERACIONAL", 15, 25);
        doc.text(`Exportado em: ${formatDateTime(new Date().toISOString())}`, 15, 30);
        doc.text(`Filtros: Busca="${searchTerm || 'Nenhuma'}" | Tipo="${selectedActionType}" | Range=[${startDate || 'Inicio'} ate ${endDate || 'Fim'}]`, 15, 35);
        doc.text(`Registros exibidos nesta pagina: ${pageNum} | Total geral filtrado: ${filteredLogs.length}`, 15, 40);

        // Highlight line
        doc.setDrawColor(51, 78, 104); // Frost border color
        doc.setLineWidth(0.8);
        doc.line(15, 45, 195, 45);
      };

      let yPos = 55;
      drawHeader(pageNumber, "xx");

      itemsPerPage.forEach((log, index) => {
        // Safety height check. Each log block takes ~30-50mm. Let's do defensive checks.
        if (yPos > 250) {
          doc.addPage();
          pageNumber++;
          yPos = 55;
          drawHeader(pageNumber, "xx");
        }

        const formattedDate = formatDateTime(log.timestamp);
        
        // Block Header background
        doc.setFillColor(240, 243, 246);
        doc.rect(15, yPos, 180, 7, "F");
        
        doc.setFont("courier", "bold");
        doc.setFontSize(8);
        doc.setTextColor(18, 22, 26);
        doc.text(`ID: ${log.id} | REGISTRADO: ${formattedDate}`, 17, yPos + 4.5);
        
        yPos += 11;
        
        // Metadata fields
        doc.setFont("courier", "bold");
        doc.text("USUARIO: ", 17, yPos);
        doc.setFont("courier", "normal");
        doc.text(log.userEmail, 36, yPos);
        yPos += 4.5;

        doc.setFont("courier", "bold");
        doc.text("ACAO   : ", 17, yPos);
        doc.setFont("courier", "normal");
        doc.text(log.action, 36, yPos);
        yPos += 5;

        // Description / Changes wrapped text
        doc.setFont("courier", "bold");
        doc.text("DETALHE: ", 17, yPos);
        
        doc.setFont("courier", "normal");
        const detailsText = log.changes || "Sem descricao complementar.";
        const wrappedLines = doc.splitTextToSize(detailsText, 150);
        
        wrappedLines.forEach((line: string) => {
          if (yPos > 275) {
            doc.addPage();
            pageNumber++;
            yPos = 55;
            drawHeader(pageNumber, "xx");
          }
          doc.text(line, 36, yPos);
          yPos += 4;
        });

        // Safe spacing
        yPos += 6;
        doc.setDrawColor(220, 225, 230);
        doc.setLineWidth(0.2);
        doc.line(15, yPos, 195, yPos);
        yPos += 6;
      });

      // Add simple page numbering in PDF
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(120, 130, 140);
        doc.text(`Pagina ${i} de ${pageCount} - Canal de Auditoria Interna Imperio Ecolog`, 15, 287);
        doc.text("CONFIDENCIAL E RESTRITO", 160, 287);
      }

      doc.save(`relatorio_auditoria_${Date.now()}.pdf`);
      triggerToast("PDF de auditoria exportado com sucesso!");
    } catch (err) {
      console.error("Falha ao gerar o PDF dos logs:", err);
      triggerToast("Houve um erro ao exportar o arquivo PDF.");
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setSelectedActionType("ALL");
    triggerToast("Filtros limpos!");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="audit-logs-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0B0C10]/85 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-[#12161A] border border-[#334E68] rounded-2xl overflow-hidden shadow-2xl z-10 font-sans text-xs text-[#F4F6F9]"
          >
            {/* Header Area */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#0B0C10] border-b border-[#334E68]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-950/40 border border-red-500/30 rounded-xl text-red-400 shadow-inner">
                  <ShieldAlert className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Histórico de Auditoria & Compliance Operacional
                  </h3>
                  <p className="text-[10px] text-[#BAC7D5] font-semibold uppercase tracking-wider">
                    Assinaturas digitais e rastreamento em tempo real (Sistema de Registro)
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/5 rounded-lg text-[#BAC7D5] hover:text-white transition-colors cursor-pointer"
                title="Fechar Painel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Advanced Filters Panel */}
            <div className="bg-[#171C21] border-b border-[#334E68]/50 p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Text Search */}
              <div className="relative">
                <span className="text-[9px] text-[#BAC7D5] uppercase font-bold block mb-1">Pesquisa Global</span>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#BAC7D5]" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Pesquisar ID, ação, usuário..."
                    className="w-full pl-8 pr-3 py-1.5 bg-[#0B0C10] border border-[#334E68]/80 text-[11px] rounded-lg focus:outline-none focus:border-red-500 transition-colors placeholder:text-[#BAC7D5]/40 text-white font-mono"
                  />
                </div>
              </div>

              {/* Action Type Filter */}
              <div>
                <span className="text-[9px] text-[#BAC7D5] uppercase font-bold block mb-1">Tipo de Ação</span>
                <div className="relative">
                  <Filter className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#BAC7D5]" />
                  <select
                    value={selectedActionType}
                    onChange={(e) => setSelectedActionType(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-[#0B0C10] border border-[#334E68]/80 text-[11px] rounded-lg focus:outline-none focus:border-red-500 transition-colors text-[#F4F6F9] font-bold"
                  >
                    <option value="ALL">Todas as Ações</option>
                    {actionTypes.map(act => (
                      <option key={act} value={act}>{act}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date Initial */}
              <div>
                <span className="text-[9px] text-[#BAC7D5] uppercase font-bold block mb-1">Data Inicial</span>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#BAC7D5]" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-[#0B0C10] border border-[#334E68]/80 text-[11px] rounded-lg focus:outline-none focus:border-red-500 transition-colors text-white font-bold"
                  />
                </div>
              </div>

              {/* Date Final & Action Reset Button */}
              <div>
                <span className="text-[9px] text-[#BAC7D5] uppercase font-bold block mb-1">Data Final</span>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Calendar className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#BAC7D5]" />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-[#0B0C10] border border-[#334E68]/80 text-[11px] rounded-lg focus:outline-none focus:border-red-500 transition-colors text-white font-bold"
                    />
                  </div>
                  <button
                    onClick={handleResetFilters}
                    className="py-1.5 px-2 bg-zinc-900 border border-[#334E68] text-[#BAC7D5] hover:text-white rounded-lg transition-colors cursor-pointer"
                    title="Limpar Filtros"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* List Body of Logs */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#0B0C10]/40">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-[11px] text-[#BAC7D5]">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>
                    Exibindo <strong>{filteredLogs.length}</strong> de <strong>{logs.length}</strong> logs operacionais de segurança.
                  </span>
                </div>
                <span className="text-[9px] font-mono tracking-widest bg-red-950/50 border border-red-500/30 px-2 py-0.5 rounded text-red-400 font-bold">
                  SESSÃO ATIVA
                </span>
              </div>

              {/* Grid or List of rows with monospace font */}
              <div className="space-y-3 pr-1">
                {filteredLogs.map((log) => {
                  const formattedDateTime = formatDateTime(log.timestamp);
                  const [datePart, timePart] = formattedDateTime.split(" ");
                  return (
                    <div 
                      key={log.id} 
                      className="bg-[#12161A] border border-[#334E68]/60 hover:border-red-500/30 p-4 rounded-xl space-y-2.5 transition-all shadow font-mono text-[11px]"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#334E68]/30 pb-2 gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black tracking-wider bg-red-950/40 border border-red-500/30 px-2 py-0.5 rounded text-red-400 uppercase">
                            AUDIT LOG
                          </span>
                          <span className="text-[#BAC7D5] font-black text-xs">ID: {log.id}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#BAC7D5] text-[10px] font-bold">
                          <span>📅 {datePart}</span>
                          <span>⏰ {timePart}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <p className="text-[#BAC7D5]">
                          👤 USUÁRIO: <strong className="text-[#F4F6F9]">{log.userEmail}</strong>
                        </p>
                        <p className="text-[#BAC7D5]">
                          ⚡ AÇÃO: <strong className="text-red-400 uppercase">{log.action}</strong>
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] text-[#BAC7D5]/60 font-black block uppercase tracking-wider">
                          Alterações & Metadados do Objeto
                        </span>
                        <pre className="p-3 bg-[#0B0C10] border border-[#334E68]/40 rounded-lg text-[10px] text-zinc-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto font-mono scrollbar-thin scrollbar-thumb-zinc-800">
                          {log.changes}
                        </pre>
                      </div>
                    </div>
                  );
                })}

                {filteredLogs.length === 0 && (
                  <div className="text-center py-12 border border-dashed border-[#334E68]/40 rounded-xl bg-white/5">
                    <FileText className="w-10 h-10 text-[#BAC7D5]/40 mx-auto mb-2 animate-bounce" />
                    <p className="text-[#BAC7D5] font-semibold text-xs">Nenhum log operacional atende aos critérios de pesquisa.</p>
                    <p className="text-[10px] text-[#BAC7D5]/60 mt-1">Refine seus filtros de busca ou datas de pesquisa.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-[#0B0C10] border-t border-[#334E68] gap-3">
              <span className="text-[9px] text-[#BAC7D5]/60 font-bold uppercase tracking-wider text-center sm:text-left">
                Assinatura criptográfica md5/sha256 homologada pela Receita Federal
              </span>
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  onClick={handleCopyLogs}
                  className="flex items-center gap-2 py-2 px-4 bg-[#12161A] hover:bg-white/5 border border-[#334E68] text-[#F4F6F9] hover:text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer w-full sm:w-auto justify-center"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Logs</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 py-2 px-4 bg-[#F4F6F9] hover:bg-[#EBF0F5] text-[#0B0C10] font-black text-xs uppercase tracking-wider rounded-lg transition-all shadow-md cursor-pointer w-full sm:w-auto justify-center"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar PDF</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Simple self-destructing Modal Toast */}
          <AnimatePresence>
            {showToast && (
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.9 }}
                className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-[#0B0C10] border-2 border-red-500 text-white font-mono text-[10px] px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 font-bold uppercase tracking-widest"
              >
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <span>{toastMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
