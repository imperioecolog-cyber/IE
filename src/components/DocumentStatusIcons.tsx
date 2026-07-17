import React from "react";
import { 
  FileText, 
  FileCheck, 
  AlertCircle, 
  Loader2,
  Calendar,
  Layers,
  FileSignature,
  FileBadge,
  PlusCircle
} from "lucide-react";
import { DocumentoAnexo } from "../types";

interface DocumentStatusIconsProps {
  documentos?: DocumentoAnexo[];
  onUploadClick?: () => void;
}

const DOC_TYPES = [
  { tipo: "AGENDAMENTO", label: "Agendamento", icon: Calendar },
  { tipo: "DUIMP", label: "DUIMP", icon: FileBadge },
  { tipo: "NOTA_FISCAL", label: "Nota Fiscal (DANFE)", icon: FileText },
  { tipo: "BILL_OF_LADING", label: "B/L (Bill of Lading)", icon: FileSignature },
  { tipo: "INVOICE", label: "Commercial Invoice", icon: Layers }
] as const;

export default function DocumentStatusIcons({ documentos = [], onUploadClick }: DocumentStatusIconsProps) {
  return (
    <div className="flex items-center gap-1.5 py-0.5 px-1 bg-slate-50/50 dark:bg-slate-800/30 rounded-lg border border-slate-100 dark:border-slate-800/40 w-fit shrink-0">
      {DOC_TYPES.map(({ tipo, label, icon: Icon }) => {
        const doc = documentos.find(d => d.tipoDocumental === tipo);
        const status = doc ? doc.status : "pendente";

        let colorClass = "text-slate-300 dark:text-slate-700 hover:text-slate-400";
        let titleText = `${label}: Não Anexado`;
        let statusIcon = <Icon className="w-3.5 h-3.5" />;

        if (status === "processando") {
          colorClass = "text-amber-500 dark:text-amber-400 animate-pulse";
          titleText = `${label}: Processando OCR...`;
          statusIcon = <Loader2 className="w-3.5 h-3.5 animate-spin" />;
        } else if (status === "sucesso") {
          colorClass = "text-indigo-600 dark:text-indigo-400";
          titleText = `${label}: Processado com Sucesso (${doc?.nomeArquivo})`;
          statusIcon = <Icon className="w-3.5 h-3.5 stroke-[2.5]" />;
        } else if (status === "erro") {
          colorClass = "text-rose-500 dark:text-rose-400";
          titleText = `${label}: Erro no Processamento`;
          statusIcon = <AlertCircle className="w-3.5 h-3.5 text-rose-500" />;
        }

        return (
          <div 
            key={tipo} 
            className={`p-1 rounded hover:bg-white dark:hover:bg-slate-800 transition-all cursor-help relative ${colorClass}`}
            title={titleText}
          >
            {statusIcon}
          </div>
        );
      })}

      {onUploadClick && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUploadClick();
          }}
          className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all cursor-pointer"
          title="Fazer Upload de Documento para OCR"
        >
          <PlusCircle className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
