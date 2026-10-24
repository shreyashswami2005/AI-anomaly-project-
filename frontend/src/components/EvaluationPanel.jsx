import React from 'react';
import { 
  Binary, 
  Target, 
  BarChart, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Info, 
  Layers 
} from 'lucide-react';

export default function EvaluationPanel({ evaluation, summary }) {
  const regression = evaluation?.regression;
  const classification = evaluation?.classification;

  return (
    <div className="space-y-6">
      {/* Overview Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm transition-colors">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <Binary className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              AI Model Evaluation & Physical Accuracy Benchmarks
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified against actual 168-hour end-of-test electrical telemetry & ground truth labels
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-start space-x-2">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p>
            <b>Scientific Integrity Notice:</b> Antigravity ML metrics are strictly calculated from real measurements when valid target labels (<code className="text-blue-500 font-mono">v_168h_actual</code> or <code className="text-blue-500 font-mono">true_status</code>) exist in the dataset. Metrics are never fabricated.
          </p>
        </div>
      </div>

      {/* Regression Metrics (XGBoost 168h Lifetime Degradation) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm transition-colors">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              XGBoost 168-Hour Voltage Prediction Metrics
            </h3>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono">
            Continuous Regression
          </span>
        </div>

        {regression ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                R² Score (Variance Explained)
              </span>
              <div className="mt-2 text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                {regression.r2 !== null ? regression.r2.toFixed(4) : 'N/A'}
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Target: &gt; 0.90 for high accuracy burn-in forecasting
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                MAE (Mean Absolute Error)
              </span>
              <div className="mt-2 text-2xl font-bold font-mono text-slate-800 dark:text-slate-200">
                {regression.mae !== null ? `${regression.mae.toFixed(5)} V` : 'N/A'}
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Average deviation from true 168h measured voltage
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                RMSE (Root Mean Square Error)
              </span>
              <div className="mt-2 text-2xl font-bold font-mono text-slate-800 dark:text-slate-200">
                {regression.rmse !== null ? `${regression.rmse.toFixed(5)} V` : 'N/A'}
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Evaluated over {regression.evaluated_samples} labeled units
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-850 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            No 168-hour ground truth labels (<code className="font-mono">v_168h_actual</code>) were present in the active dataset to compute test regression metrics.
          </div>
        )}
      </div>

      {/* Classification Metrics (PASS vs FLAG) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm transition-colors">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Screening Classification Performance (PASS vs FLAG)
            </h3>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">
            Defect Detection
          </span>
        </div>

        {classification ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-semibold uppercase text-slate-500">Accuracy</span>
                <div className="mt-1 text-xl font-bold font-mono text-slate-900 dark:text-white">
                  {(classification.accuracy * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-semibold uppercase text-slate-500">Precision (FLAG)</span>
                <div className="mt-1 text-xl font-bold font-mono text-slate-900 dark:text-white">
                  {(classification.precision * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-semibold uppercase text-slate-500">Recall (FLAG)</span>
                <div className="mt-1 text-xl font-bold font-mono text-slate-900 dark:text-white">
                  {(classification.recall * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-semibold uppercase text-slate-500">F1-Score</span>
                <div className="mt-1 text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                  {classification.f1.toFixed(3)}
                </div>
              </div>
            </div>

            {/* Confusion Matrix */}
            {classification.confusion_matrix && (
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                  Confusion Matrix
                </h4>
                <div className="max-w-md mx-auto bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="font-semibold text-slate-400"></div>
                    <div className="font-bold text-slate-700 dark:text-slate-300">Pred PASS</div>
                    <div className="font-bold text-slate-700 dark:text-slate-300">Pred FLAG</div>

                    <div className="font-bold text-slate-700 dark:text-slate-300 self-center">True PASS</div>
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-mono font-bold rounded-lg border border-emerald-300 dark:border-emerald-800">
                      {classification.confusion_matrix.matrix[0]?.[0] || 0}
                      <div className="text-[9px] font-normal">True Negative</div>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-mono font-bold rounded-lg border border-amber-200 dark:border-amber-800">
                      {classification.confusion_matrix.matrix[0]?.[1] || 0}
                      <div className="text-[9px] font-normal">False Alarm</div>
                    </div>

                    <div className="font-bold text-slate-700 dark:text-slate-300 self-center">True FLAG</div>
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 font-mono font-bold rounded-lg border border-rose-200 dark:border-rose-800">
                      {classification.confusion_matrix.matrix[1]?.[0] || 0}
                      <div className="text-[9px] font-normal">Escape (Missed)</div>
                    </div>
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-mono font-bold rounded-lg border border-emerald-300 dark:border-emerald-800">
                      {classification.confusion_matrix.matrix[1]?.[1] || 0}
                      <div className="text-[9px] font-normal">True Positive</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-850 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            Ground-truth status labels were not present in the dataset to calculate confusion matrix.
          </div>
        )}
      </div>
    </div>
  );
}
