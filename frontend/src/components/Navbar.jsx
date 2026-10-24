import React from 'react';
import { 
  Cpu, 
  Upload, 
  RefreshCw, 
  Sun, 
  Moon, 
  Sliders, 
  FileSpreadsheet, 
  ShieldCheck, 
  AlertTriangle 
} from 'lucide-react';

export default function Navbar({ 
  darkMode, 
  setDarkMode, 
  onOpenUpload, 
  onGenerateSynthetic, 
  onOpenSettings,
  isGenerating,
  activeRun,
  serverStatus
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      {/* Brand & Subtitle */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-700 to-indigo-600 text-white shadow-md">
          <Cpu className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
              AeroSemi <span className="text-blue-600 dark:text-blue-400">Burn-In AI</span>
            </h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              JEDEC / MIL-STD-883
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            AI-Driven Anomaly Detection & 168-Hour Degradation Screening
          </p>
        </div>
      </div>

      {/* Center Status / Lot Information */}
      <div className="hidden md:flex items-center space-x-3">
        {activeRun && (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-slate-500 dark:text-slate-400">Active Lot:</span>
            <span className="font-medium text-slate-800 dark:text-slate-200 max-w-[180px] truncate">
              {activeRun.summary?.dataset_name || 'Standard Batch'}
            </span>
            {activeRun.summary?.is_synthetic && (
              <span className="px-1.5 py-0.2 text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 rounded font-medium border border-amber-300 dark:border-amber-800">
                SYNTHETIC SAMPLE
              </span>
            )}
          </div>
        )}

        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>{serverStatus === 'online' ? 'API Online' : 'Connecting...'}</span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center space-x-2.5">
        <button
          onClick={onGenerateSynthetic}
          disabled={isGenerating}
          title="Generate clean synthetic test dataset"
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-500 ${isGenerating ? 'animate-spin' : ''}`} />
          <span className="hidden lg:inline">Generate Synthetic Lot</span>
        </button>

        <button
          onClick={onOpenUpload}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Dataset</span>
        </button>

        <button
          onClick={onOpenSettings}
          title="Configure safety thresholds & ML parameters"
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
        >
          <Sliders className="w-4 h-4" />
        </button>

        <button
          onClick={() => setDarkMode(!darkMode)}
          title="Toggle Dark / Light Mode"
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>
    </header>
  );
}
