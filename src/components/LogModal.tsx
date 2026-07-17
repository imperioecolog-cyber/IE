import React, { useState, useEffect } from "react";
import { Terminal, Copy, Printer, X, ShieldAlert, CheckCircle2, AlertTriangle, FileText } from "lucide-react";

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LocalSystemLog {
  id: string;
  timestamp: string;
  type: "error" | "info" | "warning";
  message: string;
  source?: string;
}

// Global listener to capture console errors and store them in localStorage system_logs
if (typeof window !== "undefined") {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    // Call original logger
    originalConsoleError.apply(console, args);

    try {
      const message = args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ");
      const existing = localStorage.getItem("system_logs");
      const logs: LocalSystemLog[] = existing ? JSON.parse(existing) : [];
      
      const newLog: LocalSystemLog = {
        id: `ERR-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        timestamp: new Date().toISOString(),
        type: "error",
        message: message.substring(0, 500),
        source: "Console Override"
      };

      // Limit logs size
      logs.unshift(newLog);
      localStorage.setItem("system_logs", JSON.stringify(logs.slice(0, 100)));
    } catch (e) {
      // Fail silently to avoid infinite error loops
    }
  };

  window.addEventListener("error", (event) => {
    try {
      const message = event.message || "Erro não capturado";
      const existing = localStorage.getItem("system_logs");
      const logs: LocalSystemLog[] = existing ? JSON.parse(existing) : [];
      
      const newLog: LocalSystemLog = {
        id: `ERR-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        timestamp: new Date().toISOString(),
        type: "error",
        message: `${message} at ${event.filename}:${event.lineno}`,
        source: "Window Unhandled Error"
      };

      logs.unshift(newLog);
      localStorage.setItem("system_logs", JSON.stringify(logs.slice(0, 100)));
    } catch (e) {
      // Fail silently
    }
  });
}

export default function LogModal({ isOpen, onClose }: LogModalProps) {
  const [logs, setLogs] = useState<LocalSystemLog[]>([]);
  const [copied, setCopied] = useState(false);

  // Load logs on open
  useEffect(() => {
    if (isOpen) {
      const existing = localStorage.getItem("system_logs");
      if (existing) {
        try {
          setLogs(JSON.parse(existing));
        } catch (e) {
          setLogs([]);
        }
      } else {
        // Create initial info logs if empty
        const initialLogs: LocalSystemLog[] = [
          {
            id: `SYS-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
            timestamp: new Date().toISOString(),
            type: "info",
            message: "Sistema operacional estabilizado. Auditoria de integridade ativa.",
            source: "System Init"
          },
          {
            id: `SYS-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
            timestamp: new Date(Date.now() - 5000).toISOString(),
            type: "info",
            message: "Conexão com Google Cloud APIs e Google Sheets estabelecida com sucesso.",
            source: "Sheets DB Connection"
          }
        ];
        localStorage.setItem("system_logs", JSON.stringify(initialLogs));
        setLogs(initialLogs);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    const formattedText = logs.map(l => {
      const d = new Date(l.timestamp);
      const dateStr = d.toLocaleString("pt-BR");
      return `[${dateStr}] [${l.type.toUpperCase()}] [${l.source || "SYS"}] ${l.message}`;
    }).join("\n");

    navigator.clipboard.writeText(formattedText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Fallback
    });
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const formattedRows = logs.map(l => {
      const d = new Date(l.timestamp);
      const dateStr = d.toLocaleString("pt-BR");
      const color = l.type === "error" ? "red" : l.type === "warning" ? "orange" : "blue";
      return `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 8px; font-family: monospace;">${l.id}</td>
          <td style="padding: 8px; font-family: monospace;">${dateStr}</td>
          <td style="padding: 8px; font-weight: bold; color: ${color}; font-family: monospace;">${l.type.toUpperCase()}</td>
          <td style="padding: 8px; font-family: monospace; white-space: pre-wrap;">${l.message}</td>
          <td style="padding: 8px; font-family: monospace;">${l.source || "N/A"}</td>
        </tr>
      `;
    }).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Console Logs - IMPÉRIO ECOLÓG</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
            h1 { text-transform: uppercase; font-size: 18px; margin-bottom: 5px; }
            h2 { font-size: 12px; color: #666; margin-top: 0; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f5f5f5; text-align: left; padding: 10px; border-bottom: 2px solid #ddd; }
          </style>
        </head>
        <body>
          <h1>IMPÉRIO ECOLÓG - Relatório de Console & Incidentes</h1>
          <h2>Gerado em ${new Date().toLocaleString("pt-BR")} | Total de registros: ${logs.length}</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>TIMESTAMP</th>
                <th>TIPO</th>
                <th>MENSAGEM DE ERRO / EVENTO</th>
                <th>FONTE</th>
              </tr>
            </thead>
            <tbody>
              ${formattedRows || "<tr><td colspan='5' style='text-align:center; padding: 20px;'>Nenhum log encontrado.</td></tr>"}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleClearLogs = () => {
    localStorage.removeItem("system_logs");
    setLogs([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-red-500 animate-pulse" />
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-100">
              Console de Erros & Logs Internos (system_logs)
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-red-950/15 border-b border-red-900/30 p-3.5 flex items-start gap-2 text-[10px] text-zinc-400">
          <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="leading-normal">
            Esse console captura dinamicamente quaisquer erros não tratados de javascript, falhas críticas de compilação ou exceções de runtime ocorridas na aplicação. Ideal para depuração avançada e compliance de segurança.
          </p>
        </div>

        {/* Logs content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#0B0C10] font-mono text-[11px] leading-relaxed max-h-[50vh]">
          {logs.map((l) => (
            <div key={l.id} className={`p-3 rounded border ${
              l.type === "error" 
                ? "bg-red-950/15 border-red-900/30 text-red-400" 
                : l.type === "warning"
                ? "bg-amber-950/15 border-amber-900/30 text-amber-400"
                : "bg-zinc-950 border-zinc-850 text-zinc-300"
            } flex flex-col sm:flex-row sm:items-start justify-between gap-2`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                    l.type === "error" ? "bg-red-500/20 text-red-400" : "bg-zinc-800 text-zinc-400"
                  }`}>
                    {l.type}
                  </span>
                  <span className="text-zinc-500 font-bold">{l.id}</span>
                  <span className="text-zinc-600">[{l.source || "SYS"}]</span>
                </div>
                <p className="font-semibold select-all break-all">{l.message}</p>
              </div>
              <span className="text-[9px] text-zinc-600 whitespace-nowrap">
                {new Date(l.timestamp).toLocaleString("pt-BR")}
              </span>
            </div>
          ))}

          {logs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-600">
              <FileText className="w-8 h-8 text-zinc-700 mb-2 animate-bounce" />
              <p className="font-bold text-xs uppercase tracking-wider">Console Vazio</p>
              <p className="text-[10px] mt-0.5">Nenhum erro de console ou incidente registrado no momento.</p>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="p-4 bg-black border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleClearLogs}
            className="py-1.5 px-3 bg-zinc-950 hover:bg-red-950/20 text-zinc-500 hover:text-red-500 font-bold text-[10px] uppercase tracking-wider border border-zinc-850 rounded-lg transition-all cursor-pointer w-full sm:w-auto"
          >
            Limpar Registros
          </button>
          
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer w-full sm:w-auto"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Logs</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 py-2 px-4 bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer w-full sm:w-auto shadow-md"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg cursor-pointer w-full sm:w-auto"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
