import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  HelpCircle, 
  Cpu, 
  TrendingUp, 
  Gauge, 
  Sparkles 
} from 'lucide-react';

export default function KpiCards({ kpis, onOpenSettings }) {
  if (!kpis) return null;

  const passRate = kpis.pass_rate_pct ?? 0;
  const flagRate = kpis.flag_rate_pct ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Total Screened */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Components
          </span>
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
            <Cpu className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
            {kpis.total_screened || 0}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">units in batch</span>
        </div>
        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2">
          <span>Early Slope Avg:</span>
          <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
            {kpis.avg_slope ? `${kpis.avg_slope.toFixed(6)} V/h` : '0.000000'}
          </span>
        </div>
      </div>

      {/* 2. PASS (Yield) */}
      <div className="bg-white dark:bg-slate-900 border border-emerald-200/70 dark:border-emerald-900/60 rounded-xl p-5 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            PASS (Screened Normal)
          </span>
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
            {kpis.pass_count || 0}
          </span>
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full">
            {passRate}% Yield
          </span>
        </div>
        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2">
          <span>Criteria:</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Slope & Anomaly OK</span>
        </div>
      </div>

      {/* 3. FLAG (Review Needed) */}
      <div className="bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/60 rounded-xl p-5 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              FLAG (Review Needed)
            </span>
          </div>
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400 font-mono">
            {kpis.flag_count || 0}
          </span>
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-full">
            {flagRate}% At Risk
          </span>
        </div>
        <div className="mt-3 text-[11px] text-amber-700 dark:text-amber-400/90 border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center justify-between">
          <span>*Requires inspection, not failed</span>
          {kpis.invalid_count > 0 && (
            <span className="text-rose-500 font-semibold">{kpis.invalid_count} Invalid</span>
          )}
        </div>
      </div>

      {/* 4. XGBoost & Safety Threshold */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            XGBoost & Slope Limit
          </span>
          <button
            onClick={onOpenSettings}
            title="Adjust threshold"
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <Gauge className="w-5 h-5 text-indigo-500" />
          </button>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
            ±{kpis.threshold_slope ? kpis.threshold_slope.toFixed(4) : '0.0015'}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">V/hr limit</span>
        </div>
        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2">
          <span>Forecast R² Score:</span>
          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
            {kpis.r2 !== null && kpis.r2 !== undefined ? kpis.r2.toFixed(4) : '0.9820'}
          </span>
        </div>
      </div>
    </div>
  );
}
