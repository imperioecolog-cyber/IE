import { 
  Processo, 
  Cliente, 
  PrestadorServico, 
  Transportadora, 
  Armador, 
  Terminal, 
  ModeloOCR, 
  LogEntry,
  DBState
} from "../types";
import { parseRelatorioData } from "../data/relatorioCarregamentos";

const SPREADSHEET_NAME = "Sistema_Gestao_Logistica_DB";

// Headers
const HEADERS = {
  Processos: [
    "Nº Registro", "Cliente", "Processo", "Container", "Tipo do Container", 
    "Armador", "Motorista", "Veículo", "Transportadora", "Valor do Frete", 
    "Data Retirada", "Hora Retirada", "Data Entrega", "Hora Entrega", 
    "Data Devolução", "Hora Devolução", "Entrega Vazio", "Terminal", 
    "Status", "Observações", "Valor do Carregamento", "Motorista Pago", "Valor Pago Motorista", "Data Criado"
  ],
  Clientes: ["Nome", "CNPJ", "Email", "Contato"],
  Prestadores: ["Nome", "CPF", "CNH", "Celular", "Cavalo (Placa)", "Carreta (Placa)"],
  Transportadoras: ["Nome", "CNPJ", "Contato", "Email"],
  Armadores: ["Nome", "Portal", "Tipo de Acesso", "Observações", "Link Devolução"],
  Terminais: ["Nome", "Cidade", "Contato"],
  ModelosOCR: ["ID", "Nome", "Ativo", "Keywords", "Fields"],
  Logs: ["ID", "UserEmail", "Timestamp", "Action", "Changes"]
};

// Default Pre-populated Data
const cleanFreightValue = (freightStr: string): string => {
  if (!freightStr || freightStr === "-") return "0.00";
  const cleaned = freightStr.replace(/[^\d,]/g, "").replace(",", ".");
  return cleaned || "0.00";
};

const buildDynamicDefaults = () => {
  const rawRows = parseRelatorioData();
  const processes: Processo[] = [];
  const clientsMap = new Map<string, Cliente>();
  const prestadoresMap = new Map<string, PrestadorServico>();

  // Base hardcoded defaults
  const initialClientes: Cliente[] = [
    { nome: "Logística Brasil S.A.", cnpj: "12.345.678/0001-90", email: "operacoes@logbrasil.com.br", contato: "Carlos Silva" },
    { nome: "Importadora Global Ltda", cnpj: "98.765.432/0001-10", email: "contato@impglobal.com", contato: "Mariana Costa" },
    { nome: "Trading Cargo Express", cnpj: "45.678.912/0001-30", email: "suporte@cargoexpress.com", contato: "Roberto Mendes" }
  ];
  initialClientes.forEach(c => clientsMap.set(c.nome.toLowerCase().trim(), c));

  const initialPrestadores: PrestadorServico[] = [
    { nome: "Ramon Ramalho", cpf: "111.222.333-44", cnh: "12345678901", celular: "(11) 98888-7777", cavaloPlaca: "KNG4E63", carretaPlaca: "XYZ9W87" },
    { nome: "João de Oliveira", cpf: "222.333.444-55", cnh: "98765432100", celular: "(13) 99777-6666", cavaloPlaca: "ABC1D23", carretaPlaca: "DEF4G56" },
    { nome: "Marcos Paulo Santos", cpf: "333.444.555-66", cnh: "55544433322", celular: "(21) 99666-5555", cavaloPlaca: "HIJ7K89", carretaPlaca: "LMN0O12" }
  ];
  initialPrestadores.forEach(p => prestadoresMap.set(p.nome.toLowerCase().trim(), p));

  let regIndex = 1;

  rawRows.forEach((row) => {
    const clientName = row.cliente.trim();
    if (clientName && clientName !== "-" && !clientsMap.has(clientName.toLowerCase())) {
      clientsMap.set(clientName.toLowerCase(), {
        nome: clientName,
        cnpj: "Gerado Automaticamente",
        email: "contato@cliente.com.br",
        contato: "Administração"
      });
    }

    const driverName = row.motorista.trim();
    const plate = row.veiculo.trim();
    if (driverName && driverName !== "-" && !prestadoresMap.has(driverName.toLowerCase())) {
      prestadoresMap.set(driverName.toLowerCase(), {
        nome: driverName,
        cpf: "Gerado Automaticamente",
        cnh: "Gerado Automaticamente",
        celular: "(00) 90000-0000",
        cavaloPlaca: plate !== "-" ? plate.toUpperCase() : "S/ PLACA",
        carretaPlaca: "S/ CARRETA"
      });
    }

    const statusMap: Processo["status"] = row.cheioVazio === "Vazio" 
      ? "Container Devolvido" 
      : "Em Trânsito";

    const regId = `REG-${String(regIndex++).padStart(3, "0")}`;

    processes.push({
      registro: regId,
      cliente: clientName !== "-" ? clientName : "CLIENTE NÃO INFORMADO",
      processo: row.diBooking !== "-" ? row.diBooking : `DI-${row.referencia}`,
      container: row.container !== "-" ? row.container : "S/ CONTÊINER",
      tipoContainer: row.tipoContainer !== "-" ? row.tipoContainer : "40HQ",
      armador: row.armador !== "-" ? row.armador : "NÃO ESPECIFICADO",
      motorista: driverName !== "-" ? driverName : "AGUARDANDO MOTORISTA",
      veiculo: plate !== "-" ? plate.toUpperCase() : "S/ PLACA",
      transportadora: "Império Ecolog Logística",
      valorFrete: cleanFreightValue(row.valorFrete),
      dataRetirada: row.data,
      horaRetirada: "08:00",
      dataEntrega: row.data,
      horaEntrega: "17:00",
      dataDevolucao: row.cheioVazio === "Vazio" ? row.data : "",
      horaDevolucao: row.cheioVazio === "Vazio" ? "17:00" : "",
      entregaVazio: row.cheioVazio === "Vazio" ? "Devolvido" : "Pendente",
      terminal: "Terminal Santos Portuário",
      status: statusMap,
      observacoes: `Importação em lote do Relatório de Carregamentos. Referência: ${row.referencia}. Estado do Container: ${row.cheioVazio}.`,
      valorCarregamento: "0.00",
      motoristaPago: "Não",
      valorPagoMotorista: "0.00",
      dataCriado: new Date().toLocaleDateString("pt-BR")
    });
  });

  return {
    processos: processes,
    clientes: Array.from(clientsMap.values()),
    prestadores: Array.from(prestadoresMap.values())
  };
};

const dynamicDefaults = buildDynamicDefaults();

const DEFAULT_CLIENTES: Cliente[] = dynamicDefaults.clientes;
const DEFAULT_PRESTADORES: PrestadorServico[] = dynamicDefaults.prestadores;

const DEFAULT_TRANSPORTADORAS: Transportadora[] = [
  { nome: "TransRapido Ltda", cnpj: "22.333.444/0001-55", contato: "Adilson", email: "coleta@transrapido.com.br" },
  { nome: "Rodoviário Sul-Sudeste", cnpj: "33.444.555/0001-66", contato: "Felipe", email: "felipe@rodsul.com.br" }
];

const DEFAULT_ARMADORES: Armador[] = [
  { nome: "CMA CGM", portal: "https://www.cma-cgm.com", tipoAcesso: "Portal", observacoes: "Devoluções de vazios via portal oficial", linkDevolucao: "https://www.cma-cgm.com/ebusiness/empty-return" },
  { nome: "COSCO", portal: "https://lines.coscoshipping.com", tipoAcesso: "Portal", observacoes: "Verificar demurrage antes de solicitar", linkDevolucao: "https://lines.coscoshipping.com/home/" },
  { nome: "Evergreen", portal: "https://www.evergreen-line.com", tipoAcesso: "Portal", observacoes: "Acesso via usuário cadastrado", linkDevolucao: "https://www.evergreen-line.com/" },
  { nome: "Hapag-Lloyd", portal: "https://www.hapag-lloyd.com", tipoAcesso: "Portal", observacoes: "Seletor de depósito ativo", linkDevolucao: "https://www.hapag-lloyd.com/en/online-business/empty-container-return.html" },
  { nome: "Maersk", portal: "https://www.maersk.com", tipoAcesso: "Portal", observacoes: "Acesso via Maersk ID", linkDevolucao: "https://www.maersk.com/hub/" },
  { nome: "MSC", portal: "https://www.msc.com", tipoAcesso: "Portal", observacoes: "Verificar porto de destino", linkDevolucao: "https://www.msc.com/en/help-feedback" },
  { nome: "ONE", portal: "https://ecomm.one-line.com", tipoAcesso: "Portal", observacoes: "Portal ONE e-commerce", linkDevolucao: "https://ecomm.one-line.com/one-ecom/manage-shipment/empty-release" },
  { nome: "PIL", portal: "https://www.pilship.com", tipoAcesso: "Portal", observacoes: "Verificar prazos de devolução", linkDevolucao: "https://www.pilship.com/" },
  { nome: "Yang Ming", portal: "https://www.yangming.com", tipoAcesso: "Portal", observacoes: "Consultar depot designado", linkDevolucao: "https://www.yangming.com/" },
  { nome: "ZIM", portal: "https://www.zim.com", tipoAcesso: "Portal", observacoes: "Acesso direto via link de devolução", linkDevolucao: "https://www.zim.com/" }
];

const DEFAULT_TERMINAIS: Terminal[] = [
  { nome: "Santos Brasil (Tecon)", cidade: "Guarujá/SP", contato: "Tecon Santos" },
  { nome: "BTP (Brasil Terminal Portuário)", cidade: "Santos/SP", contato: "BTP Atendimento" },
  { nome: "DP World Santos", cidade: "Santos/SP", contato: "DPW Sac" }
];

const DEFAULT_MODELOS_OCR: ModeloOCR[] = [
  {
    id: "MODEL_AGENDAMENTO",
    name: "Agendamento de Retirada",
    active: true,
    keywords: ["AGENDAMENTO", "RETIRADA", "HORARIO", "SLOT"],
    fields: [
      { key: "motorista", label: "Motorista", mapping: "motorista" },
      { key: "veiculo", label: "Veículo/Placa", mapping: "veiculo" },
      { key: "dataAgendamento", label: "Data da Retirada", mapping: "dataRetirada" },
      { key: "horarioRetirada", label: "Horário da Retirada", mapping: "horaRetirada" }
    ]
  },
  {
    id: "MODEL_DUIMP",
    name: "Declaração Única de Importação (DUIMP)",
    active: true,
    keywords: ["DUIMP", "DECLARAÇÃO", "TAIE", "IMPORTAÇÃO"],
    fields: [
      { key: "taie", label: "TAIE Nº", mapping: "processo" },
      { key: "bl", label: "B/L Nº", mapping: "observacoes" },
      { key: "container", label: "Contêiner", mapping: "container" },
      { key: "terminal", label: "Terminal", mapping: "terminal" }
    ]
  },
  {
    id: "MODEL_PEDIDO_COLETA",
    name: "Pedido de Coleta",
    active: true,
    keywords: ["PEDIDO", "COLETA", "TRANSPORTADORA", "ORDEM DE SERVIÇO"],
    fields: [
      { key: "cliente", label: "Cliente", mapping: "cliente" },
      { key: "processo", label: "Processo", mapping: "processo" },
      { key: "container", label: "Contêiner", mapping: "container" },
      { key: "transportadora", label: "Transportadora", mapping: "transportadora" },
      { key: "terminal", label: "Terminal", mapping: "terminal" },
      { key: "motorista", label: "Motorista", mapping: "motorista" },
      { key: "veiculo", label: "Veículo", mapping: "veiculo" },
      { key: "dataColeta", label: "Data da Retirada", mapping: "dataRetirada" },
      { key: "horarioColeta", label: "Hora da Retirada", mapping: "horaRetirada" }
    ]
  },
  {
    id: "MODEL_NOTA_FISCAL",
    name: "Nota Fiscal Eletrônica (DANFE)",
    active: true,
    keywords: ["DANFE", "NOTA FISCAL", "EMITENTE", "CHAVE DE ACESSO"],
    fields: [
      { key: "numeroNota", label: "Número da Nota", mapping: "processo" },
      { key: "emitente", label: "Emitente/Cliente", mapping: "cliente" },
      { key: "valorTotal", label: "Valor Total", mapping: "valorFrete" },
      { key: "chaveAcesso", label: "Chave de Acesso", mapping: "observacoes" }
    ]
  }
];

const DEFAULT_PROCESSOS: Processo[] = dynamicDefaults.processos;

// Helper to make API calls to Google Sheets/Drive
async function googleFetch(url: string, token: string, options: RequestInit = {}) {
  const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
    ...options.headers
  };
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google API error (${response.status}): ${errText}`);
  }
  return response.json();
}

// Find spreadsheet ID or create it if not exists
export async function findOrCreateSpreadsheet(token: string): Promise<string> {
  if (token === "mock_token") {
    return "mock_spreadsheet";
  }

  const cachedId = localStorage.getItem("SISTEMA_LOGISTICA_SPREADSHEET_ID");
  if (cachedId) {
    try {
      // Validate that file still exists
      await googleFetch(`https://www.googleapis.com/drive/v3/files/${cachedId}`, token);
      return cachedId;
    } catch {
      localStorage.removeItem("SISTEMA_LOGISTICA_SPREADSHEET_ID");
    }
  }

  // Search Drive
  const query = encodeURIComponent(`name='${SPREADSHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`);
  const searchResult = await googleFetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, token);
  
  if (searchResult.files && searchResult.files.length > 0) {
    const id = searchResult.files[0].id;
    localStorage.setItem("SISTEMA_LOGISTICA_SPREADSHEET_ID", id);
    return id;
  }

  // Create spreadsheet
  const createPayload = {
    properties: {
      title: SPREADSHEET_NAME
    },
    sheets: Object.keys(HEADERS).map(name => ({
      properties: { title: name }
    }))
  };

  const spreadsheet = await googleFetch("https://sheets.googleapis.com/v4/spreadsheets", token, {
    method: "POST",
    body: JSON.stringify(createPayload)
  });

  const spreadsheetId = spreadsheet.spreadsheetId;
  localStorage.setItem("SISTEMA_LOGISTICA_SPREADSHEET_ID", spreadsheetId);

  // Write initial headers and pre-populate default data
  await writeInitialData(token, spreadsheetId);

  return spreadsheetId;
}

async function writeInitialData(token: string, spreadsheetId: string) {
  const dataPayloads = [
    // Headers
    { range: "Processos!A1:X1", values: [HEADERS.Processos] },
    { range: "Clientes!A1:D1", values: [HEADERS.Clientes] },
    { range: "Prestadores!A1:F1", values: [HEADERS.Prestadores] },
    { range: "Transportadoras!A1:D1", values: [HEADERS.Transportadoras] },
    { range: "Armadores!A1:E1", values: [HEADERS.Armadores] },
    { range: "Terminais!A1:C1", values: [HEADERS.Terminais] },
    { range: "ModelosOCR!A1:E1", values: [HEADERS.ModelosOCR] },
    { range: "Logs!A1:E1", values: [HEADERS.Logs] },

    // Pre-populate defaults
    {
      range: `Processos!A2:X${DEFAULT_PROCESSOS.length + 1}`,
      values: DEFAULT_PROCESSOS.map(p => [
        p.registro, p.cliente, p.processo, p.container, p.tipoContainer,
        p.armador, p.motorista, p.veiculo, p.transportadora, p.valorFrete,
        p.dataRetirada, p.horaRetirada, p.dataEntrega, p.horaEntrega,
        p.dataDevolucao, p.horaDevolucao, p.entregaVazio, p.terminal,
        p.status, p.observacoes, p.valorCarregamento, p.motoristaPago, p.valorPagoMotorista, p.dataCriado
      ])
    },
    {
      range: `Clientes!A2:D${DEFAULT_CLIENTES.length + 1}`,
      values: DEFAULT_CLIENTES.map(c => [c.nome, c.cnpj, c.email, c.contato])
    },
    {
      range: `Prestadores!A2:F${DEFAULT_PRESTADORES.length + 1}`,
      values: DEFAULT_PRESTADORES.map(p => [p.nome, p.cpf, p.cnh, p.celular, p.cavaloPlaca, p.carretaPlaca])
    },
    {
      range: `Transportadoras!A2:D${DEFAULT_TRANSPORTADORAS.length + 1}`,
      values: DEFAULT_TRANSPORTADORAS.map(t => [t.nome, t.cnpj, t.contato, t.email])
    },
    {
      range: `Armadores!A2:E${DEFAULT_ARMADORES.length + 1}`,
      values: DEFAULT_ARMADORES.map(a => [a.nome, a.portal, a.tipoAcesso, a.observacoes, a.linkDevolucao])
    },
    {
      range: `Terminais!A2:C${DEFAULT_TERMINAIS.length + 1}`,
      values: DEFAULT_TERMINAIS.map(t => [t.nome, t.cidade, t.contato])
    },
    {
      range: `ModelosOCR!A2:E${DEFAULT_MODELOS_OCR.length + 1}`,
      values: DEFAULT_MODELOS_OCR.map(m => [m.id, m.name, m.active ? "TRUE" : "FALSE", JSON.stringify(m.keywords), JSON.stringify(m.fields)])
    },
    {
      range: "Logs!A2:E2",
      values: [["LOG-001", "system@gestaologistica.com", new Date().toISOString(), "Banco de Dados Inicializado", "[]"]]
    }
  ];

  await googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, token, {
    method: "POST",
    body: JSON.stringify({
      valueInputOption: "USER_ENTERED",
      data: dataPayloads
    })
  });
}

// Fetch all database tables in one single request
export async function fetchSpreadsheetData(token: string, spreadsheetId: string): Promise<DBState> {
  if (token === "mock_token") {
    const saved = localStorage.getItem("SISTEMA_LOGISTICA_LOCAL_DB");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse local DB state:", e);
      }
    }
    return {
      processos: [...DEFAULT_PROCESSOS],
      clientes: [...DEFAULT_CLIENTES],
      prestadores: [...DEFAULT_PRESTADORES],
      transportadoras: [...DEFAULT_TRANSPORTADORAS],
      armadores: [...DEFAULT_ARMADORES],
      terminais: [...DEFAULT_TERMINAIS],
      modelosOCR: [...DEFAULT_MODELOS_OCR],
      logs: [
        {
          id: "LOG-001",
          userEmail: "system@gestaologistica.com",
          timestamp: new Date().toISOString(),
          action: "Banco de Dados Inicializado Localmente",
          changes: "[]"
        }
      ]
    };
  }

  const ranges = Object.keys(HEADERS).map(name => `${name}!A:Z`);
  const rangeParams = ranges.map(r => `ranges=${encodeURIComponent(r)}`).join("&");
  
  const result = await googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${rangeParams}`, token);
  
  const sheetValues: Record<string, string[][]> = {};
  result.valueRanges.forEach((vr: any) => {
    const sheetName = vr.range.split("!")[0].replace(/'/g, ""); // strip quotes if any
    sheetValues[sheetName] = vr.values || [];
  });

  return {
    processos: parseProcessos(sheetValues.Processos),
    clientes: parseClientes(sheetValues.Clientes),
    prestadores: parsePrestadores(sheetValues.Prestadores),
    transportadoras: parseTransportadoras(sheetValues.Transportadoras),
    armadores: parseArmadores(sheetValues.Armadores),
    terminais: parseTerminais(sheetValues.Terminais),
    modelosOCR: parseModelosOCR(sheetValues.ModelosOCR),
    logs: parseLogs(sheetValues.Logs)
  };
}

// Sub-parsers
function parseProcessos(rows: string[][]): Processo[] {
  if (!rows || rows.length <= 1) return [];
  const dataRows = rows.slice(1);
  return dataRows.map(row => ({
    registro: row[0] || "",
    cliente: row[1] || "",
    processo: row[2] || "",
    container: row[3] || "",
    tipoContainer: row[4] || "",
    armador: row[5] || "",
    motorista: row[6] || "",
    veiculo: row[7] || "",
    transportadora: row[8] || "",
    valorFrete: row[9] || "",
    dataRetirada: row[10] || "",
    horaRetirada: row[11] || "",
    dataEntrega: row[12] || "",
    horaEntrega: row[13] || "",
    dataDevolucao: row[14] || "",
    horaDevolucao: row[15] || "",
    entregaVazio: row[16] || "",
    terminal: row[17] || "",
    status: (row[18] || "Pendente") as any,
    observacoes: row[19] || "",
    valorCarregamento: row[20] || "0.00",
    motoristaPago: row[21] || "Não",
    valorPagoMotorista: row[22] || "0.00",
    dataCriado: row[23] || ""
  })).filter(p => p.registro !== "");
}

function parseClientes(rows: string[][]): Cliente[] {
  if (!rows || rows.length <= 1) return [];
  return rows.slice(1).map(row => ({
    nome: row[0] || "",
    cnpj: row[1] || "",
    email: row[2] || "",
    contato: row[3] || ""
  })).filter(c => c.nome !== "");
}

function parsePrestadores(rows: string[][]): PrestadorServico[] {
  if (!rows || rows.length <= 1) return [];
  return rows.slice(1).map(row => ({
    nome: row[0] || "",
    cpf: row[1] || "",
    cnh: row[2] || "",
    celular: row[3] || "",
    cavaloPlaca: row[4] || "",
    carretaPlaca: row[5] || ""
  })).filter(p => p.nome !== "");
}

function parseTransportadoras(rows: string[][]): Transportadora[] {
  if (!rows || rows.length <= 1) return [];
  return rows.slice(1).map(row => ({
    nome: row[0] || "",
    cnpj: row[1] || "",
    contato: row[2] || "",
    email: row[3] || ""
  })).filter(t => t.nome !== "");
}

function parseArmadores(rows: string[][]): Armador[] {
  if (!rows || rows.length <= 1) return [];
  return rows.slice(1).map(row => ({
    nome: row[0] || "",
    portal: row[1] || "",
    tipoAcesso: row[2] || "Portal",
    observacoes: row[3] || "",
    linkDevolucao: row[4] || ""
  })).filter(a => a.nome !== "");
}

function parseTerminais(rows: string[][]): Terminal[] {
  if (!rows || rows.length <= 1) return [];
  return rows.slice(1).map(row => ({
    nome: row[0] || "",
    cidade: row[1] || "",
    contato: row[2] || ""
  })).filter(t => t.nome !== "");
}

function parseModelosOCR(rows: string[][]): ModeloOCR[] {
  if (!rows || rows.length <= 1) return [];
  return rows.slice(1).map(row => {
    let keywords: string[] = [];
    let fields: any[] = [];
    try {
      keywords = row[3] ? JSON.parse(row[3]) : [];
    } catch {
      keywords = row[3] ? row[3].split(",") : [];
    }
    try {
      fields = row[4] ? JSON.parse(row[4]) : [];
    } catch {
      fields = [];
    }
    return {
      id: row[0] || "",
      name: row[1] || "",
      active: row[2] === "TRUE",
      keywords,
      fields
    };
  }).filter(m => m.id !== "");
}

function parseLogs(rows: string[][]): LogEntry[] {
  if (!rows || rows.length <= 1) return [];
  return rows.slice(1).map(row => ({
    id: row[0] || "",
    userEmail: row[1] || "",
    timestamp: row[2] || "",
    action: row[3] || "",
    changes: row[4] || ""
  })).filter(l => l.id !== "");
}

// Bulk overwrite sheets for simplicity & robust indexes sync
export async function overwriteSheet<T>(
  token: string,
  spreadsheetId: string,
  sheetName: string,
  data: T[],
  mapper: (item: T) => any[]
) {
  // Clear sheet first
  await googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A2:Z9999:clear`, token, {
    method: "POST"
  });

  if (data.length === 0) return;

  const values = data.map(mapper);
  await googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A2?valueInputOption=USER_ENTERED`, token, {
    method: "PUT",
    body: JSON.stringify({ values })
  });
}

// Append a single log row
export async function appendLog(
  token: string,
  spreadsheetId: string,
  log: LogEntry
) {
  if (token === "mock_token") {
    const saved = localStorage.getItem("SISTEMA_LOGISTICA_LOCAL_DB");
    let db: DBState = {
      processos: [...DEFAULT_PROCESSOS],
      clientes: [...DEFAULT_CLIENTES],
      prestadores: [...DEFAULT_PRESTADORES],
      transportadoras: [...DEFAULT_TRANSPORTADORAS],
      armadores: [...DEFAULT_ARMADORES],
      terminais: [...DEFAULT_TERMINAIS],
      modelosOCR: [...DEFAULT_MODELOS_OCR],
      logs: []
    };
    if (saved) {
      try {
        db = JSON.parse(saved);
      } catch (e) {}
    }
    db.logs = [log, ...db.logs];
    localStorage.setItem("SISTEMA_LOGISTICA_LOCAL_DB", JSON.stringify(db));
    return;
  }

  const values = [[log.id, log.userEmail, log.timestamp, log.action, log.changes]];
  await googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Logs!A1:append?valueInputOption=USER_ENTERED`, token, {
    method: "POST",
    body: JSON.stringify({ values })
  });
}

// Helper to write changes cleanly
export async function syncDBState(
  token: string,
  spreadsheetId: string,
  sheetName: keyof DBState,
  stateList: any[]
) {
  if (token === "mock_token") {
    const saved = localStorage.getItem("SISTEMA_LOGISTICA_LOCAL_DB");
    let db: DBState = {
      processos: [...DEFAULT_PROCESSOS],
      clientes: [...DEFAULT_CLIENTES],
      prestadores: [...DEFAULT_PRESTADORES],
      transportadoras: [...DEFAULT_TRANSPORTADORAS],
      armadores: [...DEFAULT_ARMADORES],
      terminais: [...DEFAULT_TERMINAIS],
      modelosOCR: [...DEFAULT_MODELOS_OCR],
      logs: []
    };
    if (saved) {
      try {
        db = JSON.parse(saved);
      } catch (e) {}
    }
    db[sheetName] = stateList;
    localStorage.setItem("SISTEMA_LOGISTICA_LOCAL_DB", JSON.stringify(db));
    return;
  }

  let mapper: (item: any) => any[];

  switch (sheetName) {
    case "processos":
      mapper = (p: Processo) => [
        p.registro, p.cliente, p.processo, p.container, p.tipoContainer,
        p.armador, p.motorista, p.veiculo, p.transportadora, p.valorFrete,
        p.dataRetirada, p.horaRetirada, p.dataEntrega, p.horaEntrega,
        p.dataDevolucao, p.horaDevolucao, p.entregaVazio, p.terminal,
        p.status, p.observacoes, p.valorCarregamento, p.motoristaPago, p.valorPagoMotorista, p.dataCriado
      ];
      await overwriteSheet(token, spreadsheetId, "Processos", stateList, mapper);
      break;

    case "clientes":
      mapper = (c: Cliente) => [c.nome, c.cnpj, c.email, c.contato];
      await overwriteSheet(token, spreadsheetId, "Clientes", stateList, mapper);
      break;

    case "prestadores":
      mapper = (p: PrestadorServico) => [p.nome, p.cpf, p.cnh, p.celular, p.cavaloPlaca, p.carretaPlaca];
      await overwriteSheet(token, spreadsheetId, "Prestadores", stateList, mapper);
      break;

    case "transportadoras":
      mapper = (t: Transportadora) => [t.nome, t.cnpj, t.contato, t.email];
      await overwriteSheet(token, spreadsheetId, "Transportadoras", stateList, mapper);
      break;

    case "armadores":
      mapper = (a: Armador) => [a.nome, a.portal, a.tipoAcesso, a.observacoes, a.linkDevolucao];
      await overwriteSheet(token, spreadsheetId, "Armadores", stateList, mapper);
      break;

    case "terminais":
      mapper = (t: Terminal) => [t.nome, t.cidade, t.contato];
      await overwriteSheet(token, spreadsheetId, "Terminais", stateList, mapper);
      break;

    case "modelosOCR":
      mapper = (m: ModeloOCR) => [m.id, m.name, m.active ? "TRUE" : "FALSE", JSON.stringify(m.keywords), JSON.stringify(m.fields)];
      await overwriteSheet(token, spreadsheetId, "ModelosOCR", stateList, mapper);
      break;

    case "logs":
      mapper = (l: LogEntry) => [l.id, l.userEmail, l.timestamp, l.action, l.changes];
      await overwriteSheet(token, spreadsheetId, "Logs", stateList, mapper);
      break;
  }
}
