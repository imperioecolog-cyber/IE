import React from "react";
import { motion } from "motion/react";
import { Layers, Kanban, Grid } from "lucide-react";

export type ViewTheme = "unified" | "kanban" | "grid";

interface ThemeSelectorProps {
  currentTheme: ViewTheme;
  onChange: (theme: ViewTheme) => void;
}

export default function ThemeSelector({ currentTheme, onChange }: ThemeSelectorProps) {
  const options = [
    { id: "unified", label: "Unificado", icon: Layers, desc: "Seções em Acordeão" },
    { id: "kanban", label: "Kanban", icon: Kanban, desc: "Gestão Operacional (Trello)" },
    { id: "grid", label: "Planilha Grid", icon: Grid, desc: "Visão Analítica Densa" },
  ] as const;

  return (
    <div className="flex items-center gap-1.5 bg-[#12161A] border border-[#334E68] p-1 rounded-xl shadow-inner shrink-0">
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = currentTheme === opt.id;
        return (
          <button
            key={opt.id}
            id={`theme-btn-${opt.id}`}
            onClick={() => onChange(opt.id)}
            title={opt.desc}
            className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              isActive 
                ? "text-[#0B0C10] font-black z-10" 
                : "text-[#BAC7D5] hover:text-[#F4F6F9] hover:bg-white/5"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeThemeBg"
                className="absolute inset-0 bg-[#F4F6F9] rounded-lg -z-10"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline text-[10px]">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
