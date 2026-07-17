import React, { useState, useRef, useEffect } from "react";
import { 
  Upload, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  X, 
  FileCheck, 
  AlertCircle,
  Cpu,
  Sparkles,
  RefreshCw,
  Sliders,
  Check,
  Edit2,
  Calendar,
  Layers,
  FileSignature,
  FileBadge
} from "lucide-react";
import { OCRResult, ModeloOCR } from "../types";

interface OCRUploadModalProps {
  onOCRComplete: (ocrResult: OCRResult, fileName: string) => void;
  customModels: ModeloOCR[];
  
  // Modal overlay capabilities (M2)
  isOpen?: boolean;
  onClose?: () => void;
  registroId?: string | null;
  onOCRCompleteWithTarget?: (registroId: string, tipoDocumental: string, ocrResult: OCRResult, fileName: string) => void;
}

const DOCUMENT_TYPES = [
  { value: "AUTO_DETECT", label: "Auto-Detectar Tipo (Recomendado)", desc: "A IA do Gemini identificará o tipo automaticamente" },
  { value: "AGENDAMENTO", label: "Agendamento", desc: "Agendamentos de Retirada/Entrega" },
  { value: "DUIMP", label: "DUIMP", desc: "Declaração Única de Importação" },
  { value: "NOTA_FISCAL", label: "Nota Fiscal (DANFE)", desc: "Nota Fiscal Eletrônica (DANFE)" },
  { value: "BILL_OF_LADING", label: "Bill of Lading (B/L)", desc: "Conhecimento de Embarque Marítimo" },
  { value: "INVOICE", label: "Commercial Invoice", desc: "Fatura Comercial Internacional" }
];

export default function OCRUploadModal({ 
  onOCRComplete, 
  customModels, 
  isOpen = false, 
  onClose, 
  registroId = null,
  onOCRCompleteWithTarget
}: OCRUploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLog, setProgressLog] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // OCR Options State
  const [selectedType, setSelectedType] = useState<string>("AUTO_DETECT");
  const [selectedEngine, setSelectedEngine] = useState<"IA_REAL" | "MOCK_DET">("IA_REAL");
  
  // Verification Screen State
  const [showVerification, setShowVerification] = useState(false);
  const [verifiedResult, setVerifiedResult] = useState<OCRResult | null>(null);
  const [fileNameProcessed, setFileNameProcessed] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Progressive loading simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setProgress(5);
      setProgressLog("Lendo arquivo local...");
      
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          const next = prev + Math.floor(Math.random() * 12) + 5;
          
          if (next > 15 && next <= 40) {
            setProgressLog("Iniciando motor de OCR...");
          } else if (next > 40 && next <= 65) {
            setProgressLog(selectedType === "AUTO_DETECT" ? "Analisando layout para auto-detectar tipo..." : `Processando estrutura para ${selectedType}...`);
          } else if (next > 65 && next <= 85) {
            setProgressLog("Extraindo dados estruturados com Gemini...");
          } else if (next > 85) {
            setProgressLog("Limpando metadados e formatando campos...");
          }
          
          return Math.min(next, 95);
        });
      }, 250);
    } else {
      setProgress(0);
      setProgressLog("");
    }
    return () => clearInterval(interval);
  }, [loading, selectedType]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const getDeterministicMockData = (type: string): OCRResult => {
    const finalType = type === "AUTO_DETECT" ? "DUIMP" : type;
    
    switch (finalType) {
      case "AGENDAMENTO":
        return {
          documentType: "AGENDAMENTO",
          confidence: 0.98,
          fields: {
            motorista: "Ramon Ramalho",
            veiculo: "KNG4E63",
            dataAgendamento: "14/07/2026",
            horarioRetirada: "09:00 às 09:59"
          }
        };
      case "DUIMP":
        return {
          documentType: "DUIMP",
          confidence: 0.95,
          fields: {
            taie: "TAIE-2026-9912739",
            bl: "MSCU1234567",
            dataEmissao: "10/07/2026",
            navio: "MSC MARINA",
            dataChegada: "18/07/2026",
            container: "MSCU7654321",
            volumes: "1500",
            pesoBruto: "28500",
            bandeira: "LIBERIA",
            nic: "87654321",
            invoice: "INV-2026-001",
            terminal: "TCP"
          }
        };
      case "NOTA_FISCAL":
        return {
          documentType: "NOTA_FISCAL",
          confidence: 0.97,
          fields: {
            numeroNota: "123456",
            serie: "1",
            emitente: "Empresa XYZ Ltda",
            destinatario: "Importadora Ecolog",
            valorTotal: "15000.00",
            pesoBruto: "25000",
            pesoLiquido: "24000",
            dataEmissao: "12/07/2026",
            chaveAcesso: "35260712345678901234550010001234561001234567"
          }
        };
      case "BILL_OF_LADING":
        return {
          documentType: "BILL_OF_LADING",
          confidence: 0.94,
          fields: {
            bl: "MSCU1234567",
            navio: "MSC MARINA",
            container: "MSCU7654321",
            peso: "28500",
            volumes: "1500",
            portoOrigem: "SANTOS",
            portoDestino: "ROTTERDAM",
            importador: "Importadora Ecolog Ltda",
            exportador: "Exportadora XYZ SA"
          }
        };
      case "INVOICE":
        return {
          documentType: "INVOICE",
          confidence: 0.92,
          fields: {
            invoice: "INV-2026-001",
            emitente: "Exportadora XYZ SA",
            valorTotal: "15000.00",
            dataEmissao: "08/07/2026"
          }
        };
      default:
        return {
          documentType: "UNKNOWN",
          confidence: 0.50,
          fields: {}
        };
    }
  };

  const processFile = async (file: File) => {
    if (!file) return;
    
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      setError("Tipo de arquivo inválido. Por favor, envie PDF, PNG ou JPG.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    // Mock Offline deterministic processing
    if (selectedEngine === "MOCK_DET") {
      setTimeout(() => {
        const mockResult = getDeterministicMockData(selectedType);
        setProgress(100);
        setProgressLog("Finalizado!");
        setLoading(false);
        setSuccess(`Documento "${file.name}" processado via MOCK determinístico!`);
        
        setVerifiedResult(mockResult);
        setFileNameProcessed(file.name);
        setShowVerification(true);
      }, 1500);
      return;
    }

    // Real Gemini OCR call
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;

        try {
          const response = await fetch("/api/ocr", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              fileBase64: base64Data,
              mimeType: file.type,
              filename: file.name,
              customModels: customModels
            })
          });

          if (!response.ok) {
            const errJson = await response.json();
            throw new Error(errJson.error || "Erro ao processar OCR no servidor.");
          }

          const result = await response.json();
          if (result.success && result.ocrResult) {
            let ocrRes: OCRResult = result.ocrResult;
            
            // Force type override if user didn't select AUTO_DETECT
            if (selectedType !== "AUTO_DETECT") {
              ocrRes = {
                ...ocrRes,
                documentType: selectedType
              };
            }

            setProgress(100);
            setProgressLog("Extração de campos concluída!");
            setLoading(false);
            setSuccess(`Documento "${file.name}" processado com IA com sucesso!`);
            
            setVerifiedResult(ocrRes);
            setFileNameProcessed(file.name);
            setShowVerification(true);
          } else {
            throw new Error("Formato de resposta inválido do servidor.");
          }
        } catch (err: any) {
          console.error(err);
          setError(err.message || "Erro de rede ao conectar à API OCR.");
        } finally {
          setLoading(false);
        }
      };

      reader.onerror = () => {
        setError("Erro ao ler o arquivo local.");
        setLoading(false);
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error(err);
      setError("Ocorreu um erro ao carregar o arquivo.");
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Confirm values edited by user
  const handleConfirmVerification = () => {
    if (!verifiedResult) return;
    
    if (registroId && onOCRCompleteWithTarget) {
      // Direct process attachment modal flow
      onOCRCompleteWithTarget(registroId, verifiedResult.documentType, verifiedResult, fileNameProcessed);
      if (onClose) onClose();
    } else {
      // General Dashboard inline creation flow
      onOCRComplete(verifiedResult, fileNameProcessed);
    }
    
    // reset states
    setShowVerification(false);
    setVerifiedResult(null);
    setSuccess(null);
  };

  const handleFieldChange = (key: string, val: string) => {
    if (!verifiedResult) return;
    setVerifiedResult({
      ...verifiedResult,
      fields: {
        ...verifiedResult.fields,
        [key]: val
      }
    });
  };

  // Elements wrapper
  const renderUploaderBody = () => {
    return (
      <div className="space-y-4">
        {/* Type selector and Engine config */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-450 dark:text-slate-400 uppercase mb-1.5">
              Tipo de Documental Alvo
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
            >
              {DOCUMENT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1">
              {DOCUMENT_TYPES.find(t => t.value === selectedType)?.desc}
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-450 dark:text-slate-400 uppercase mb-1.5">
              Motor de Leitura (OCR)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedEngine("IA_REAL")}
                className={`py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedEngine === "IA_REAL"
                    ? "bg-indigo-650 text-white border-indigo-650 shadow-sm"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-750 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Gemini 3.5
              </button>
              <button
                type="button"
                onClick={() => setSelectedEngine("MOCK_DET")}
                className={`py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedEngine === "MOCK_DET"
                    ? "bg-indigo-650 text-white border-indigo-650 shadow-sm"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-750 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                MOCK Offline
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {selectedEngine === "IA_REAL" ? "Análise semântica avançada na nuvem" : "Simulação rápida com regras predefinidas"}
            </p>
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-6 text-center flex flex-col items-center justify-center min-h-[180px] transition-all relative ${
            dragActive 
              ? "border-indigo-500 bg-indigo-50/25 dark:bg-indigo-950/20" 
              : "border-slate-250 dark:border-slate-750 bg-slate-50/40 dark:bg-slate-950/10 hover:bg-slate-50/80 dark:hover:bg-slate-900/40"
          }`}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleChange}
            disabled={loading}
          />

          {loading ? (
            <div className="flex flex-col items-center gap-3 w-full max-w-sm">
              <Loader2 className="w-9 h-9 text-indigo-600 animate-spin" />
              <div className="w-full">
                <p className="font-bold text-xs text-slate-700 dark:text-slate-200">
                  {progressLog}
                </p>
                {/* Visual Progress Bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-3 border border-slate-200/50 dark:border-slate-700">
                  <div 
                    className="bg-indigo-600 h-full transition-all duration-300 rounded-full" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                  <span>Por favor aguarde...</span>
                  <span>{progress}%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-1">
                <Upload className="w-5 h-5" />
              </div>
              <p className="font-semibold text-xs text-slate-700 dark:text-slate-200">
                Arraste seu arquivo aqui ou{" "}
                <button 
                  type="button" 
                  onClick={onButtonClick}
                  className="text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-700 font-bold focus:outline-none cursor-pointer"
                >
                  clique para buscar
                </button>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Formatos aceitos: PDF, PNG, JPG (Max. 10MB)
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-150 dark:border-rose-900/40 rounded-lg flex items-start gap-2 text-xs text-rose-700 dark:text-rose-400 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Erro no processamento:</span> {error}
            </div>
          </div>
        )}

        {success && !showVerification && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-150 dark:border-emerald-900/40 rounded-lg flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-400 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Sucesso:</span> {success}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Verification panel to edit extracted fields
  const renderVerificationBody = () => {
    if (!verifiedResult) return null;
    const confidencePercent = Math.round(verifiedResult.confidence * 100);
    const fieldKeys = Object.keys(verifiedResult.fields);

    return (
      <div className="space-y-4 animate-fade-in">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-150 dark:border-indigo-900/40 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-500">
              Tipo Documental Detectado
            </span>
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-500" />
              {verifiedResult.documentType}
            </h4>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-500">
              Confiança da Extração
            </span>
            <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
              {confidencePercent}%
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-500">
          Revisar os campos detectados abaixo para garantir precisão antes da gravação operacional:
        </p>

        <div className="border border-slate-150 dark:border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
          {fieldKeys.map((key) => {
            const val = verifiedResult.fields[key] || "";
            return (
              <div key={key} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="sm:w-1/3 text-[11px] font-bold text-slate-450 dark:text-slate-400 uppercase truncate">
                  {key.replace(/([A-Z])/g, " $1")}
                </div>
                <div className="sm:w-2/3 flex items-center gap-2">
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => handleFieldChange(key, e.target.value)}
                    className="w-full text-xs py-1 px-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-850 dark:text-slate-100 font-medium"
                  />
                </div>
              </div>
            );
          })}
          {fieldKeys.length === 0 && (
            <div className="p-6 text-center text-slate-400 italic text-xs">
              Nenhum dado pôde ser estruturado para este documento.
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-150 dark:border-slate-850">
          <button
            type="button"
            onClick={() => {
              setShowVerification(false);
              setVerifiedResult(null);
              setSuccess(null);
            }}
            className="py-1.5 px-3 border border-slate-250 dark:border-slate-750 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
          >
            Refazer Leitura
          </button>
          <button
            type="button"
            onClick={handleConfirmVerification}
            className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm cursor-pointer"
          >
            {registroId ? "Vincular ao Processo" : "Criar Novo Registro"}
          </button>
        </div>
      </div>
    );
  };

  // Render modal popup
  if (isOpen) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in print:hidden backdrop-blur-xs">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-150 dark:border-slate-800 mb-4 shrink-0">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wide">
                <Cpu className="w-4 h-4 text-indigo-550" />
                {registroId ? `Vincular Documento ao Processo #${registroId}` : "OCR Inteligente de Documentos"}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {registroId ? "Extraia dados com inteligência artificial para o fluxo operacional do registro" : "Auto-fill instantâneo baseado em layouts logísticos"}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 cursor-pointer rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Workspace */}
          <div className="flex-1 overflow-y-auto pr-1">
            {showVerification ? renderVerificationBody() : renderUploaderBody()}
          </div>
        </div>
      </div>
    );
  }

  // Render inline card (backward compatibility for Dashboard top bar)
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-500" />
          Módulo de OCR Automático (Leitura Inteligente)
        </h2>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Arraste e solte arquivos de agendamento, DUIMP, notas fiscais, ou B/L para autocompletar e criar novos registros operacionais.
        </p>
      </div>

      {showVerification ? renderVerificationBody() : renderUploaderBody()}
    </div>
  );
}
