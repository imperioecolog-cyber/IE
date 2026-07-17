export interface DocumentoAnexo {
  id: string;
  tipoDocumental: "AGENDAMENTO" | "DUIMP" | "NOTA_FISCAL" | "BILL_OF_LADING" | "INVOICE" | "OUTROS";
  nomeArquivo: string;
  status: "pendente" | "processando" | "sucesso" | "erro";
  dataUpload: string;
  dadosExtraidos?: Record<string, string>;
}

export interface Processo {
  registro: string; // Nº Registro (e.g. REG-001)
  cliente: string;
  processo: string; // Nº Processo (e.g. PR-2026/89)
  container: string;
  tipoContainer: string; // 20GP, 40GP, 40HQ, etc.
  armador: string;
  motorista: string;
  veiculo: string;
  transportadora: string;
  valorFrete: string;
  dataRetirada: string;
  horaRetirada: string;
  dataEntrega: string;
  horaEntrega: string;
  dataDevolucao: string;
  horaDevolucao: string;
  entregaVazio: string;
  terminal: string;
  status: "Aguardando Processamento" | "Agendado" | "Carregando" | "Em Trânsito" | "Entregue" | "Container Devolvido" | "Processo Finalizado" | "Faturado" | "Pago" | "Cancelado" | "Pendência Documental" | "Aguardando Cliente" | "Aguardando Motorista" | "Aguardando Liberação" | "Divergência" | "Coletado" | "Devolvido" | "Pendente";
  observacoes: string;
  valorCarregamento: string;
  motoristaPago: string;
  valorPagoMotorista: string;
  dataCriado: string;
  documentos?: DocumentoAnexo[]; // Attached document statuses (M2)
}

export interface Cliente {
  nome: string;
  cnpj: string;
  email: string;
  contato: string;
}

export interface PrestadorServico {
  nome: string;
  cpf: string;
  cnh: string;
  celular: string;
  cavaloPlaca: string;
  carretaPlaca: string;
}

export interface Transportadora {
  nome: string;
  cnpj: string;
  contato: string;
  email: string;
}

export interface Armador {
  nome: string;
  portal: string;
  tipoAcesso: string; // "Portal", "E-mail"
  observacoes: string;
  linkDevolucao: string;
}

export interface Terminal {
  nome: string;
  cidade: string;
  contato: string;
}

export interface CustomFieldOCR {
  key: string;
  label: string;
  description?: string;
  mapping: string; // Field inside Processo to map to, e.g. "motorista", "veiculo", etc.
  regex?: string;
  obrigatorio?: boolean;
}

export interface ModeloOCR {
  id: string;
  name: string;
  active: boolean;
  keywords: string[];
  fields: CustomFieldOCR[];
  versao?: number;
}

export interface LogEntry {
  id: string;
  userEmail: string;
  timestamp: string;
  action: string;
  changes: string; // JSON string or text details of changes
}

export interface DocumentoPendente {
  id: string;
  fileName: string;
  documentType: string;
  confidence: number;
  extractedFields: Record<string, string>;
  timestamp: string;
}

export interface OCRResult {
  documentType: string;
  confidence: number;
  fields: Record<string, string>;
}

export interface DBState {
  processos: Processo[];
  clientes: Cliente[];
  prestadores: PrestadorServico[];
  transportadoras: Transportadora[];
  armadores: Armador[];
  terminais: Terminal[];
  modelosOCR: ModeloOCR[];
  logs: LogEntry[];
}

export interface WebhookConfig {
  id: string;
  nome: string;
  url: string;
  secret: string;
  events: string[]; // ["any"] ou statuses específicos como ["Coletado", "Em Trânsito", ...]
  active: boolean;
  createdAt: string;
}

export interface WebhookDeliveryLog {
  id: string;
  webhookId: string;
  webhookName: string;
  webhookUrl: string;
  timestamp: string;
  event: string;
  payload: string;
  responseStatus: number | string;
  responseBody: string;
  success: boolean;
}

export type AppTheme = "unified" | "kanban" | "grid";
export type ProcessStatus = "pending" | "processing" | "success" | "failed";

export interface ProcessItem {
  id: string;
  numeroRegistro: string;
  cliente: string;
  container: string;
  status: ProcessStatus;
  tipoContainer: string;
  armador: string;
  motorista: string;
  veiculo: string;
  transportadora: string;
  valorFrete: string;
  dataRetirada: string;
  horaRetirada: string;
  dataEntrega: string;
  horaEntrega: string;
  dataDevolucao: string;
  horaDevolucao: string;
  entregaVazio: string;
  terminal: string;
  observacoes: string;
  valorCarregamento: string;
  motoristaPago: string;
  valorPagoMotorista: string;
  dataCriado: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  items: ProcessItem[];
}


