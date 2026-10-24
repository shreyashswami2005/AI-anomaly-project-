import React from 'react';
import { 
  FileCheck2, 
  HelpCircle, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Layers, 
  BookOpen 
} from 'lucide-react';

export default function StandardsView() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm transition-colors">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Semiconductor Burn-In Screening Standards & Mathematical Foundations
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Reference specifications for JEDEC JESD22-A108, MIL-STD-883 Method 1015, and AEC-Q100
            </p>
          </div>
        </div>
      </div>

      {/* Mathematical Principles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>1. Early Parameter Drift & Slope Formulation</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            During intermediate inspection checkpoints (t₁ = 24 hours, t₂ = 48 hours), component parameters undergo early-hour stabilization. The instantaneous rate of degradation is calculated as:
          </p>

          <div className="my-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-center font-mono text-sm text-blue-600 dark:text-blue-400 font-bold">
            Slope = (V₂ - V₁) / (t₂ - t₁)
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Where V₁ is the electrical reading at 24 hours and V₂ is the electrical reading at 48 hours. If |Slope| &gt; Threshold, the component is screened for risk of premature dielectric breakdown.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span>2. Machine Learning Architecture & Leakage Prevention</span>
          </h3>
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
            <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="font-bold text-slate-800 dark:text-slate-200">Isolation Forest (Outlier Detection):</span>
              <p className="mt-1 text-[11px]">
                Detects multi-parameter anomalies across temperature, leakage current, and early drift vectors before visible wear-out emerges.
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="font-bold text-slate-800 dark:text-slate-200">XGBoost Regression (168h Forecast):</span>
              <p className="mt-1 text-[11px]">
                Trained exclusively on early inputs (0h, 24h, 48h) to forecast the standard 168-hour end-of-test voltage. <b>Strict anti-leakage guarantee:</b> no 72h or 168h target features are present during prediction.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* The 4 Screening Outcomes */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
          Four Standard Screening Classifications
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30">
            <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>PASS</span>
            </div>
            <p className="text-[11px] text-emerald-900 dark:text-emerald-300 leading-relaxed">
              Drift slope is within tolerance margins, isolation forest score is normal, and predicted 168h value exhibits stable physical settling. Ready for packaging.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30">
            <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-400 font-bold text-xs mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span>FLAG (Review Needed)</span>
            </div>
            <p className="text-[11px] text-amber-900 dark:text-amber-300 leading-relaxed">
              <b>Important:</b> FLAG indicates further bench curve-tracer inspection is required, not a confirmed failure. Triggered by elevated slope, leakage, or anomaly score.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30">
            <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-400 font-bold text-xs mb-1">
              <AlertOctagon className="w-4 h-4" />
              <span>INVALID DATA</span>
            </div>
            <p className="text-[11px] text-rose-900 dark:text-rose-300 leading-relaxed">
              Telemetry contains non-physical parameters (e.g. negative voltage, negative leakage, sensor dropout, or missing intermediate timestamps).
            </p>
          </div>

          <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/30">
            <div className="flex items-center space-x-2 text-purple-700 dark:text-purple-400 font-bold text-xs mb-1">
              <HelpCircle className="w-4 h-4" />
              <span>THRESHOLD REQUIRED</span>
            </div>
            <p className="text-[11px] text-purple-900 dark:text-purple-300 leading-relaxed">
              The required engineering safety threshold was omitted or configured as null. Requires an engineer to input a valid safety margin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
