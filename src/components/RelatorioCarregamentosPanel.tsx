import React, { useState, useMemo } from "react";
import { 
  parseRelatorioData, 
  ParseableRelatorioRow 
} from "../data/relatorioCarregamentos";
import { 
  DBState, 
  Processo, 
  Cliente, 
  PrestadorServico 
} from "../types";
import { 
  FileSpreadsheet, 
  Search, 
  ArrowDownToLine, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  DollarSign,
  Container,
  UserCheck,
  Building,
  Info
} from "lucide-react";

interface RelatorioCarregamentosPanelProps {
  dbState: DBState;
  onBulkImport: (
    newProcesses: Processo[],
    newClientes: Cliente[],
    newPrestadores: PrestadorServico[]
  ) => Promise<void>;
}

export default function RelatorioCarregamentosPanel({
  dbState,
  onBulkImport
}: RelatorioCarregamentosPanelProps) {
  // Parse raw report data from file
  const rawRows = useMemo(() => parseRelatorioData(), []);

  // Search and Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "Cheio" | "Vazio">("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Record<number, boolean>>({});
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    success: boolean;
    processesCount: number;
    clientsCount: number;
    driversCount: number;
    vehiclesCount: number;
  } | null>(null);

  const itemsPerPage = 15;

  // Helper to parse numeric freight from "R$ 1.200,00" or similar to numeric string "1200.00"
  const cleanFreightValue = (freightStr: string): string => {
    if (!freightStr || freightStr === "-") return "0.00";
    const cleaned = freightStr.replace(/[^\d,]/g, "").replace(",", ".");
    return cleaned || "0.00";
  };

  // Check if a report row is already in active database processes
  const checkIsImported = (row: ParseableRelatorioRow): string | null => {
    const match = dbState.processos.find(p => 
      p.container.trim().toUpperCase() === row.container.trim().toUpperCase() &&
      p.dataRetirada === row.data &&
      p.processo.trim() === row.diBooking.trim()
    );
    return match ? match.registro : null;
  };

  // Metrics analysis of the 360 shipments in the report
  const metrics = useMemo(() => {
    let totalFreight = 0;
    let cheioCount = 0;
    let vazioCount = 0;
    const uniqueClients = new Set<string>();
    const uniqueDrivers = new Set<string>();
    const uniqueContainers = new Set<string>();

    rawRows.forEach(row => {
      // Freight
      const val = parseFloat(cleanFreightValue(row.valorFrete));
      if (!isNaN(val)) totalFreight += val;

      // Status
      if (row.cheioVazio === "Cheio") cheioCount++;
      if (row.cheioVazio === "Vazio") vazioCount++;

      // Sets
      if (row.cliente && row.cliente !== "-") uniqueClients.add(row.cliente.trim());
      if (row.motorista && row.motorista !== "-") uniqueDrivers.add(row.motorista.trim());
      if (row.container && row.container !== "-") uniqueContainers.add(row.container.trim());
    });

    return {
      totalCount: rawRows.length,
      totalFreight,
      cheioCount,
      vazioCount,
      uniqueClients: uniqueClients.size,
      uniqueDrivers: uniqueDrivers.size,
      uniqueContainers: uniqueContainers.size
    };
  }, [rawRows]);

  // Filtering Rows
  const filteredRows = useMemo(() => {
    return rawRows.map((row, index) => ({ ...row, originalIndex: index })).filter(row => {
      // Filter status
      if (statusFilter !== "todos" && row.cheioVazio !== statusFilter) return false;

      // Search term filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const clientMatch = row.cliente.toLowerCase().includes(term);
        const containerMatch = row.container.toLowerCase().includes(term);
        const driverMatch = row.motorista.toLowerCase().includes(term);
        const bookingMatch = row.diBooking.toLowerCase().includes(term);
        const refMatch = row.referencia.toLowerCase().includes(term);
        
        return clientMatch || containerMatch || driverMatch || bookingMatch || refMatch;
      }

      return true;
    });
  }, [rawRows, searchTerm, statusFilter]);

  // Paginated Rows
  const paginatedRows = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredRows.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredRows, currentPage]);

  const totalPages = Math.ceil(filteredRows.length / itemsPerPage) || 1;

  // Toggle selection
  const handleToggleSelect = (originalIndex: number) => {
    setSelectedIds(prev => ({
      ...prev,
      [originalIndex]: !prev[originalIndex]
    }));
  };

  // Toggle select all on current page
  const handleSelectAllCurrentPage = () => {
    const currentPageIndices = paginatedRows
      .filter(row => !checkIsImported(row)) // only select ones that are not already imported
      .map(row => row.originalIndex);
    
    const allSelectedOnPage = currentPageIndices.every(idx => selectedIds[idx]);

    setSelectedIds(prev => {
      const copy = { ...prev };
      currentPageIndices.forEach(idx => {
        copy[idx] = !allSelectedOnPage;
      });
      return copy;
    });
  };

  const selectedCount = useMemo(() => {
    return Object.values(selectedIds).filter(Boolean).length;
  }, [selectedIds]);

  // Select all filtered items that are not yet imported
  const handleSelectAllFiltered = () => {
    setSelectedIds(prev => {
      const copy = { ...prev };
      filteredRows.forEach(row => {
        if (!checkIsImported(row)) {
          copy[row.originalIndex] = true;
        }
      });
      return copy;
    });
  };

  // Clear selections
  const handleClearSelection = () => {
    setSelectedIds({});
  };

  // Execute bulk import function
  const handleExecuteImport = async (importOnlySelected: boolean) => {
    const confirmed = window.confirm(
      importOnlySelected 
        ? `Confirmar a importação de ${selectedCount} agendamento(s) selecionado(s) para a planilha ativa?`
        : `Confirmar a importação de todos os 360 agendamentos do relatório para a planilha do Google Sheets? Isso criará registros operacionais correspondentes.`
    );
    if (!confirmed) return;

    setIsImporting(true);

    try {
      // Determine which rows to import
      const rowsToImport = importOnlySelected
        ? rawRows.filter((_, idx) => selectedIds[idx] && !checkIsImported(rawRows[idx]))
        : rawRows.filter(row => !checkIsImported(row)); // don't import duplicates

      if (rowsToImport.length === 0) {
        alert("Nenhum registro selecionado ou pendente para importação.");
        setIsImporting(false);
        return;
      }

      const newProcesses: Processo[] = [];
      const newClientes: Cliente[] = [];
      const newPrestadores: PrestadorServico[] = [];

      // Map unique sets to check existence in dbState vs newly created during loop
      const existingClientNames = new Set(dbState.clientes.map(c => c.nome.toLowerCase()));
      const existingDriverNames = new Set(dbState.prestadores.map(m => m.nome.toLowerCase()));

      const createdClientNamesInBatch = new Set<string>();
      const createdDriverNamesInBatch = new Set<string>();

      // Safe registration counter starting from current procesos count
      let regIndex = dbState.processos.length + 1;

      rowsToImport.forEach(row => {
        // Find safe REG ID
        let nextRegId = `REG-${String(regIndex).padStart(3, "0")}`;
        while (
          dbState.processos.some(p => p.registro === nextRegId) || 
          newProcesses.some(p => p.registro === nextRegId)
        ) {
          regIndex++;
          nextRegId = `REG-${String(regIndex).padStart(3, "0")}`;
        }
        regIndex++;

        // 1. Client Smart Registration
        const clientName = row.cliente.trim();
        if (
          clientName && 
          clientName !== "-" && 
          !existingClientNames.has(clientName.toLowerCase()) &&
          !createdClientNamesInBatch.has(clientName.toLowerCase())
        ) {
          createdClientNamesInBatch.add(clientName.toLowerCase());
          newClientes.push({
            nome: clientName,
            cnpj: "Gerado Automaticamente",
            email: "contato@cliente.com.br",
            contato: "Administração"
          });
        }

        // 2. Driver Smart Registration (as PrestadorServico)
        const driverName = row.motorista.trim();
        const plate = row.veiculo.trim();
        if (
          driverName && 
          driverName !== "-" && 
          !existingDriverNames.has(driverName.toLowerCase()) &&
          !createdDriverNamesInBatch.has(driverName.toLowerCase())
        ) {
          createdDriverNamesInBatch.add(driverName.toLowerCase());
          newPrestadores.push({
            nome: driverName,
            cpf: "Gerado Automaticamente",
            cnh: "Gerado Automaticamente",
            celular: "(00) 90000-0000",
            cavaloPlaca: plate !== "-" ? plate.toUpperCase() : "S/ PLACA",
            carretaPlaca: "S/ CARRETA"
          });
        }

        // 4. Map Row to Processo
        const statusMap: Processo["status"] = row.cheioVazio === "Vazio" 
          ? "Container Devolvido" 
          : "Em Trânsito";

        const mappedProcess: Processo = {
          registro: nextRegId,
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
        };

        newProcesses.push(mappedProcess);
      });

      // Invoke App bulk importer
      await onBulkImport(newProcesses, newClientes, newPrestadores);

      // Display import summary report modal
      setImportSummary({
        success: true,
        processesCount: newProcesses.length,
        clientsCount: newClientes.length,
        driversCount: newPrestadores.length,
        vehiclesCount: 0
      });

      // Clear selections
      setSelectedIds({});
    } catch (err) {
      console.error("Bulk import failed:", err);
      alert("Houve um erro durante a importação. Verifique o console ou tente novamente.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6" id="panel-relatorio-carregamentos">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-red-600/10 text-red-500 rounded-xl">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 block font-bold uppercase tracking-wider">Agendamentos no Relatório</span>
            <span className="text-xl font-black text-white font-mono">{metrics.totalCount}</span>
          </div>
        </div>

        <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-600/10 text-emerald-500 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 block font-bold uppercase tracking-wider">Soma Total dos Fretes</span>
            <span className="text-xl font-black text-white font-mono">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(metrics.totalFreight)}
            </span>
          </div>
        </div>

        <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-indigo-600/10 text-indigo-400 rounded-xl">
            <Container className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 block font-bold uppercase tracking-wider">Contêineres Unificados</span>
            <span className="text-xl font-black text-white font-mono">
              {metrics.uniqueContainers} <span className="text-xs text-zinc-500 font-normal">({metrics.cheioCount}C / {metrics.vazioCount}V)</span>
            </span>
          </div>
        </div>

        <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-amber-600/10 text-amber-500 rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 block font-bold uppercase tracking-wider">Clientes & Motoristas</span>
            <span className="text-xl font-black text-white font-mono">
              {metrics.uniqueClients} <span className="text-xs text-zinc-500 font-normal">Clis</span> / {metrics.uniqueDrivers} <span className="text-xs text-zinc-500 font-normal">Mots</span>
            </span>
          </div>
        </div>
      </div>

      {/* Success Summary Banner */}
      {importSummary && (
        <div className="p-5 bg-zinc-950 border border-emerald-500/20 rounded-2xl flex items-start gap-4 animate-fadeIn">
          <div className="p-2 bg-emerald-500 text-black rounded-full shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 flex-1">
            <h4 className="font-black text-sm text-white uppercase tracking-wider">Importação Concluída com Sucesso!</h4>
            <p className="text-xs text-zinc-400">
              Todos os registros foram analisados estruturalmente e mesclados ao banco de dados no Google Sheets corporativo.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] font-bold text-zinc-300">
                🚀 Mapeados: <strong>{importSummary.processesCount} Processos</strong>
              </span>
              <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] font-bold text-zinc-300">
                🏢 Clientes Criados: <strong>{importSummary.clientsCount}</strong>
              </span>
              <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] font-bold text-zinc-300">
                👤 Motoristas Cadastrados: <strong>{importSummary.driversCount}</strong>
              </span>
              <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] font-bold text-zinc-300">
                🚛 Placas de Veículos: <strong>{importSummary.vehiclesCount}</strong>
              </span>
            </div>
          </div>
          <button 
            onClick={() => setImportSummary(null)}
            className="text-[10px] uppercase font-black text-zinc-500 hover:text-white transition-colors"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Controls & Table Container */}
      <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col space-y-4">
        {/* Filter bar */}
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64 min-w-[200px]">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Filtrar por container, motorista, cliente, booking..."
                className="w-full bg-zinc-900 border border-zinc-850 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-white focus:outline-none focus:border-red-500 placeholder-zinc-500 transition-all"
              />
            </div>

            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e: any) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-zinc-900 border border-zinc-850 rounded-xl px-4 py-2 text-xs font-medium text-white focus:outline-none focus:border-red-500 transition-all cursor-pointer"
            >
              <option value="todos">Todos os Estados</option>
              <option value="Cheio">Cheio</option>
              <option value="Vazio">Vazio</option>
            </select>
          </div>

          <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
            {selectedCount > 0 ? (
              <>
                <button
                  onClick={handleClearSelection}
                  className="px-3 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white font-bold text-[11px] rounded-xl border border-zinc-800 transition-all cursor-pointer"
                >
                  Limpar Seleção ({selectedCount})
                </button>
                <button
                  onClick={() => handleExecuteImport(true)}
                  disabled={isImporting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-750 disabled:bg-slate-700 text-white font-bold text-[11px] rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  <span>Importar Selecionados ({selectedCount})</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSelectAllFiltered}
                  className="px-3 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 font-bold text-[11px] rounded-xl border border-zinc-800 transition-all cursor-pointer"
                >
                  Selecionar Todos os {filteredRows.length} Filtrados
                </button>
                <button
                  onClick={() => handleExecuteImport(false)}
                  disabled={isImporting || filteredRows.length === 0}
                  className="px-4 py-2 bg-red-600 hover:bg-red-750 disabled:bg-slate-700 text-white font-bold text-[11px] rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  <span>Importar Todos os {filteredRows.length}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Info label */}
        <div className="flex items-center gap-2 p-3 bg-zinc-900/40 border border-zinc-900 rounded-xl text-[10px] text-zinc-400 font-medium leading-relaxed">
          <Info className="w-4 h-4 text-red-500 shrink-0" />
          <span>
            Duplicados são omitidos automaticamente! O sistema verifica se um contêiner com a mesma data e número de booking já existe na planilha corporativa e marca como <strong>Importado</strong>.
          </span>
        </div>

        {/* Beautiful responsive custom table */}
        <div className="overflow-x-auto border border-zinc-900 rounded-xl max-h-[500px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="bg-zinc-900/80 sticky top-0 border-b border-zinc-850 text-zinc-400 font-black tracking-wider uppercase text-[9px]">
                <th className="py-1.5 px-2 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={paginatedRows.length > 0 && paginatedRows.every(row => checkIsImported(row) || selectedIds[row.originalIndex])}
                    onChange={handleSelectAllCurrentPage}
                    className="rounded text-red-600 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-1.5 px-2">Data</th>
                <th className="py-1.5 px-2">DI / Booking</th>
                <th className="py-1.5 px-2">Referência</th>
                <th className="py-1.5 px-2">Contêiner</th>
                <th className="py-1.5 px-2">Tipo</th>
                <th className="py-1.5 px-2">Cheio/Vazio</th>
                <th className="py-1.5 px-2">Cliente</th>
                <th className="py-1.5 px-2">Armador</th>
                <th className="py-1.5 px-2">Motorista</th>
                <th className="py-1.5 px-2">Cavalo</th>
                <th className="py-1.5 px-2 text-right">Frete</th>
                <th className="py-1.5 px-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 font-medium text-[10px]">
              {paginatedRows.map((row) => {
                const isImported = checkIsImported(row);
                const isSelected = !!selectedIds[row.originalIndex];
                return (
                  <tr 
                    key={row.originalIndex}
                    className={`hover:bg-zinc-900/50 transition-colors ${
                      isImported ? "opacity-60 bg-zinc-900/10" : ""
                    } ${isSelected ? "bg-red-500/5 hover:bg-red-500/10" : ""}`}
                  >
                    <td className="py-1 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={!!isImported}
                        onChange={() => handleToggleSelect(row.originalIndex)}
                        className="rounded text-red-600 focus:ring-0 disabled:opacity-30 cursor-pointer"
                      />
                    </td>
                    <td className="py-1 px-2 font-mono text-zinc-300">{row.data}</td>
                    <td className="py-1 px-2 font-mono font-bold text-white">{row.diBooking}</td>
                    <td className="py-1 px-2 text-zinc-400 font-mono">{row.referencia}</td>
                    <td className="py-1 px-2 font-bold font-mono text-red-500">{row.container}</td>
                    <td className="py-1 px-2 font-mono text-zinc-300">{row.tipoContainer}</td>
                    <td className="py-1 px-2">
                      <span className={`px-1 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                        row.cheioVazio === "Cheio" 
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                          : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                      }`}>
                        {row.cheioVazio}
                      </span>
                    </td>
                    <td className="py-1 px-2 truncate max-w-[150px] text-zinc-300" title={row.cliente}>{row.cliente}</td>
                    <td className="py-1 px-2 text-zinc-400 font-bold">{row.armador}</td>
                    <td className="py-1 px-2 text-zinc-300 font-semibold">{row.motorista}</td>
                    <td className="py-1 px-2 font-mono text-zinc-400">{row.veiculo}</td>
                    <td className="py-1 px-2 text-right font-bold font-mono text-white">{row.valorFrete}</td>
                    <td className="py-1 px-2 text-center">
                      {isImported ? (
                        <span className="px-1.5 py-0.5 bg-emerald-600/10 text-emerald-500 border border-emerald-500/25 text-[8px] font-black rounded-full uppercase tracking-widest flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>{isImported}</span>
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-zinc-900 text-zinc-500 border border-zinc-800 text-[8px] font-black rounded-full uppercase tracking-widest">
                          Pendente
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={13} className="p-8 text-center text-zinc-500 font-bold uppercase tracking-wider">
                    Nenhum agendamento encontrado para o filtro aplicado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 text-xs select-none">
            <span className="text-zinc-500 font-bold">
              Exibindo registros <strong>{Math.min(filteredRows.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredRows.length, currentPage * itemsPerPage)}</strong> de <strong>{filteredRows.length}</strong>
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-2 bg-zinc-900 hover:bg-zinc-850 disabled:opacity-30 disabled:hover:bg-zinc-900 border border-zinc-850 rounded-xl transition-all cursor-pointer"
                title="Página Anterior"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <div className="flex items-center gap-1 font-mono font-bold">
                {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                  let pageNum = currentPage;
                  if (currentPage <= 3) {
                    pageNum = idx + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + idx;
                  } else {
                    pageNum = currentPage - 2 + idx;
                  }
                  
                  if (pageNum < 1 || pageNum > totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-black transition-all ${
                        currentPage === pageNum 
                          ? "bg-red-600 border-red-600 text-white" 
                          : "bg-zinc-900 hover:bg-zinc-850 border-zinc-850 text-zinc-400"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-2 bg-zinc-900 hover:bg-zinc-850 disabled:opacity-30 disabled:hover:bg-zinc-900 border border-zinc-850 rounded-xl transition-all cursor-pointer"
                title="Próxima Página"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
