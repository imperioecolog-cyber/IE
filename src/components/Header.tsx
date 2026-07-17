import React, { useState, useEffect, useRef } from "react";
import { 
  BarChart3, 
  Layers, 
  Kanban, 
  Grid, 
  Users, 
  UserCheck, 
  FileText, 
  ShieldCheck, 
  Settings, 
  Search, 
  Plus, 
  Bell, 
  Sun, 
  Moon, 
  LogOut, 
  Menu, 
  X, 
  CloudCheck, 
  RefreshCw, 
  AlertCircle,
  Terminal,
  User as UserIcon,
  ChevronDown,
  ExternalLink
} from "lucide-react";
import { AppTheme, LogEntry } from "../types";

interface HeaderProps {
  activeTab: "operacoes" | "configuracoes";
  setActiveTab: (tab: "operacoes" | "configuracoes") => void;
  activeSubTab: "dashboard" | "lista" | "kanban" | "grid" | "clientes" | "motoristas" | "relatorios" | "auditoria";
  setActiveSubTab: (subTab: "dashboard" | "lista" | "kanban" | "grid" | "clientes" | "motoristas" | "relatorios" | "auditoria") => void;
  globalSearchTerm: string;
  onSearchChange: (value: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  user: any;
  onLogout: () => void;
  onOpenCreateModal: () => void;
  onOpenLogModal: () => void;
  onOpenAuditLogsModal: () => void;
  syncStatus: "synced" | "syncing" | "error";
  spreadsheetId?: string | null;
  logs?: LogEntry[];
}

export default function Header({
  activeTab,
  setActiveTab,
  activeSubTab,
  setActiveSubTab,
  globalSearchTerm,
  onSearchChange,
  darkMode,
  onToggleDarkMode,
  user,
  onLogout,
  onOpenCreateModal,
  onOpenLogModal,
  onOpenAuditLogsModal,
  syncStatus,
  spreadsheetId,
  logs = []
}: HeaderProps) {
  const [clickCount, setClickCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Monitor page scroll to apply soft shadow on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdowns on outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTitleClick = () => {
    const nextCount = clickCount + 1;
    if (nextCount >= 3) {
      setClickCount(0);
      onOpenLogModal();
    } else {
      setClickCount(nextCount);
    }
  };

  const MENU_ITEMS = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3, tab: "operacoes" as const, subTab: "dashboard" as const },
    { id: "lista", label: "Operações", icon: Layers, tab: "operacoes" as const, subTab: "lista" as const },
    { id: "kanban", label: "Kanban", icon: Kanban, tab: "operacoes" as const, subTab: "kanban" as const },
    { id: "grid", label: "Grid", icon: Grid, tab: "operacoes" as const, subTab: "grid" as const },
    { id: "clientes", label: "Clientes", icon: Users, tab: "operacoes" as const, subTab: "clientes" as const },
    { id: "motoristas", label: "Motoristas", icon: UserCheck, tab: "operacoes" as const, subTab: "motoristas" as const },
    { id: "relatorios", label: "Relatórios", icon: FileText, tab: "operacoes" as const, subTab: "relatorios" as const },
    { id: "auditoria", label: "Auditoria", icon: ShieldCheck, tab: "operacoes" as const, subTab: "auditoria" as const },
    { id: "configuracoes", label: "Configurações", icon: Settings, tab: "configuracoes" as const, subTab: null }
  ];

  const handleItemClick = (item: typeof MENU_ITEMS[0]) => {
    if (item.tab === "configuracoes") {
      setActiveTab("configuracoes");
    } else {
      setActiveTab("operacoes");
      if (item.subTab) {
        setActiveSubTab(item.subTab);
      }
    }
    setShowMobileMenu(false);
  };

  const isItemActive = (item: typeof MENU_ITEMS[0]) => {
    if (item.tab === "configuracoes") {
      return activeTab === "configuracoes";
    }
    return activeTab === "operacoes" && activeSubTab === item.subTab;
  };

  return (
    <header 
      className={`sticky top-0 z-40 w-full transition-all duration-200 border-b print:hidden h-16 flex items-center justify-between px-4 sm:px-6 select-none ${
        isScrolled 
          ? "bg-white/95 dark:bg-[#0B0C10]/95 backdrop-blur-md shadow-md border-slate-200 dark:border-zinc-900/80" 
          : "bg-white dark:bg-[#0B0C10] border-slate-150 dark:border-zinc-950"
      }`}
    >
      {/* LEFT: LOGO */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 rounded-lg text-slate-600 dark:text-zinc-300 xl:hidden transition-colors"
          title="Abrir Menu"
        >
          {showMobileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        <div 
          onDoubleClick={onOpenAuditLogsModal}
          onClick={handleTitleClick}
          className="flex items-center gap-2 cursor-pointer group"
          title="Dê um duplo clique para abrir o painel de auditoria, ou 3 cliques para o console de segurança"
        >
          <div className="w-7 h-7 rounded-lg bg-red-600 flex flex-col items-center justify-center text-white font-black text-[7px] tracking-tighter shadow-md shrink-0 leading-none">
            <span className="text-[6px] text-slate-300 font-bold">IMP</span>
            <span className="text-[8px] font-black">ECO</span>
          </div>
          <span className="font-black text-xs sm:text-sm tracking-widest leading-none uppercase text-slate-900 dark:text-white group-hover:text-red-500 transition-colors">
            IMPÉRIO <span className="text-red-600 font-black">ECO</span><span className="text-red-500 font-black">LOG</span>
          </span>
        </div>

        {/* Sync Status Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-zinc-900/60 rounded-full border border-slate-200/60 dark:border-zinc-900 text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
          {syncStatus === "synced" ? (
            <CloudCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          ) : syncStatus === "syncing" ? (
            <RefreshCw className="w-3.5 h-3.5 text-red-500 animate-spin shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
          )}
          <span className="uppercase tracking-wider text-[9px] font-bold">
            {syncStatus === "synced" ? "Sincronizado" : syncStatus === "syncing" ? "Atualizando" : "Erro"}
          </span>
        </div>
      </div>

      {/* CENTER: MENU CENTRAL (Desktop/Tablet layout) */}
      <nav className="hidden xl:flex items-center h-full gap-1 px-4 overflow-x-auto no-scrollbar">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item);
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`flex items-center gap-1.5 h-full px-3 text-[11px] font-bold tracking-wide transition-all duration-200 relative whitespace-nowrap cursor-pointer ${
                active 
                  ? "text-red-600 dark:text-red-500" 
                  : "text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${active ? "scale-105" : ""}`} />
              <span>{item.label}</span>
              {active && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-red-600 dark:bg-red-500 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* RIGHT: ACTIONS & USER PROFILE */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        
        {/* Global Search Input (Slightly larger on Desktop) */}
        <div className="relative hidden md:block w-44 lg:w-56 xl:w-64">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            value={globalSearchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Pesquisar..."
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/50 dark:bg-zinc-950 dark:hover:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500 font-sans"
          />
          {globalSearchTerm && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-2.5 text-[10px] text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 font-bold"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Global Create Button */}
        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-1 py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          title="Criar Novo Registro"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Novo</span>
        </button>

        {/* Sync Sheets Shortcut (Google Sheets link) */}
        {spreadsheetId && (
          <button
            onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${spreadsheetId}`, "_blank")}
            className="hidden sm:flex items-center justify-center p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-slate-200 dark:border-zinc-850 rounded-xl text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white cursor-pointer transition-colors"
            title="Abrir Banco de Dados no Google Sheets"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        )}

        {/* Notifications Popover Trigger */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            className={`p-2 rounded-xl transition-all relative cursor-pointer ${
              showNotifications 
                ? "bg-slate-100 dark:bg-zinc-900 text-slate-950 dark:text-white" 
                : "text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-950"
            }`}
            title="Notificações e Atividades"
          >
            <Bell className="w-4 h-4" />
            {logs.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#0B0C10] animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown Card */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-2xl shadow-xl z-50 overflow-hidden py-1 animate-fadeIn">
              <div className="px-4 py-2.5 border-b border-slate-100 dark:border-zinc-900 flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Últimas Atividades</span>
                <span className="text-[9px] font-mono font-bold bg-slate-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded text-slate-500 dark:text-zinc-400 uppercase">Tempo Real</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-900/50">
                {logs.slice(0, 5).map((log, index) => (
                  <div key={index} className="p-3 text-[11px] leading-snug hover:bg-slate-50/60 dark:hover:bg-zinc-900/30 transition-colors">
                    <div className="flex items-center justify-between text-[9px] text-slate-400 dark:text-zinc-500 font-mono mb-1">
                      <span className="font-bold">{log.userEmail}</span>
                      <span>{log.timestamp.split("T")[1]?.slice(0, 5) || log.timestamp}</span>
                    </div>
                    <p className="text-slate-700 dark:text-zinc-300 font-medium line-clamp-2">{log.action}</p>
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-xs text-slate-400 dark:text-zinc-500">Nenhuma notificação recente.</p>
                  </div>
                )}
              </div>
              <div className="p-2 border-t border-slate-150 dark:border-zinc-900 bg-slate-50 dark:bg-zinc-950/80">
                <button 
                  onClick={() => {
                    setActiveTab("operacoes");
                    setActiveSubTab("auditoria");
                    setShowNotifications(false);
                  }}
                  className="w-full text-center py-1.5 text-[10px] text-red-600 dark:text-red-500 font-black uppercase tracking-wider hover:underline"
                >
                  Ver Painel de Compliance Completo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Contrast Theme Switcher (Mudar Tema) */}
        <button 
          onClick={onToggleDarkMode}
          className="p-2 text-slate-500 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-950 rounded-xl transition-all cursor-pointer"
          title="Alternar Contraste / Tema"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* User Profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-7 h-7 rounded-full border border-slate-200 dark:border-zinc-800" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-white font-extrabold text-[11px] shadow-sm">
                {user?.displayName?.charAt(0).toUpperCase() || <UserIcon className="w-3.5 h-3.5" />}
              </div>
            )}
            <ChevronDown className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
          </button>

          {/* User Profile Dropdown Card */}
          {showProfile && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-2xl shadow-xl z-50 overflow-hidden py-1 animate-fadeIn">
              <div className="p-4 border-b border-slate-100 dark:border-zinc-900 flex items-center gap-3">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-full border border-slate-200 dark:border-zinc-800" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                    {user?.displayName?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-slate-800 dark:text-white truncate">{user?.displayName}</p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">{user?.email}</p>
                </div>
              </div>
              <div className="p-2 space-y-1">
                <div className="px-3 py-1.5 text-[9px] font-mono text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                  Nível de Acesso: Operador ERP
                </div>
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-500 hover:bg-slate-50 dark:hover:bg-zinc-900/50 rounded-xl transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Sair do sistema</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* MOBILE DRAWER PORTAL (Automatic Hamburguer Menu Overlay) */}
      {showMobileMenu && (
        <div className="absolute top-16 left-0 right-0 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-900 shadow-xl z-50 p-4 block xl:hidden animate-slideDown overflow-y-auto max-h-[80vh]">
          {/* Mobile Search input */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              value={globalSearchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Pesquisa global..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 text-slate-800 dark:text-zinc-100 rounded-xl focus:outline-none"
            />
          </div>

          {/* Mobile Menu Options */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item);
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition-all border ${
                    active 
                      ? "bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20" 
                      : "text-slate-600 dark:text-zinc-400 border-transparent hover:bg-slate-50 dark:hover:bg-zinc-900"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile direct links / sync items */}
          <div className="border-t border-slate-100 dark:border-zinc-900 pt-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-bold tracking-wider">Cloud Ativo</span>
            </div>
            {spreadsheetId && (
              <button
                onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${spreadsheetId}`, "_blank")}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-1"
              >
                <span>Acessar Google Sheets</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
