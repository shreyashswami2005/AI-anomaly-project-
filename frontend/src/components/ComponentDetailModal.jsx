import React from 'react';
import { 
  X, 
  Cpu, 
  CheckCircle, 
  AlertTriangle, 
  AlertOctagon, 
  HelpCircle, 
  Thermometer, 
  Zap, 
  TrendingUp, 
  Activity 
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function ComponentDetailModal({ component, onClose, thresholdSlope = 0.0015 }) {
  if (!component) return null;

  const chartData = [
    { hour: '0h', voltage: component.v_0h, type: 'actual' },
    { hour: '24h', voltage: component.v_24h, type: 'actual' },
    { hour: '48h', voltage: component.v_48h, type: 'actual' },
    { hour: '72h', voltage: component.v_72h, type: 'actual' },
    { hour: '168h', voltage: component.v_168h_pred, type: 'predicted' },
  ];

  if (component.v_168h_actual !== null && component.v_168h_actual !== undefined) {
    chartData.push({ hour: '168h (True)', voltage: component.v_168h_actual, type: 'groundTruth' });
  }

  const isSlopeExceeded = component.slope_24_48 && Math.abs(component.slope_24_48) > thresholdSlope;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-mono">
                  {component.component_id}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {component.lot_number || 'LOT-STD'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  {component.component_type || 'Power MOSFET'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Component Burn-In Telemetry & AI Anomaly Diagnostics
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alert Banner */}
        <div className={`p-4 mx-5 mt-5 rounded-xl border flex items-start space-x-3 ${
          component.status === 'PASS'
            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
            : component.status === 'FLAG'
            ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
            : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
        }`}>
          {component.status === 'PASS' && <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />}
          {component.status === 'FLAG' && <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />}
          {component.status === 'INVALID DATA' && <AlertOctagon className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />}
          {component.status === 'THRESHOLD REQUIRED' && <HelpCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />}

          <div className="text-xs space-y-1">
            <div className="font-bold flex items-center space-x-2">
              <span>Decision: {component.status}</span>
              {component.status === 'FLAG' && (
                <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                  Requires Bench Inspection
                </span>
              )}
            </div>
            <p className="opacity-90">{component.reason}</p>
          </div>
        </div>

        {/* Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
              Early Slope (24-48h)
            </span>
            <div className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-white">
              {component.slope_24_48 !== null ? `${component.slope_24_48.toFixed(6)} V/h` : 'N/A'}
            </div>
            <div className="mt-1 text-[10px] text-slate-500">
              Limit: ±{thresholdSlope} V/h
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
              XGBoost Pred 168h
            </span>
            <div className="mt-1 font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
              {component.v_168h_pred !== null ? `${component.v_168h_pred.toFixed(3)} V` : 'N/A'}
            </div>
            <div className="mt-1 text-[10px] text-slate-500">
              Target parameter
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
              Isolation Forest Score
            </span>
            <div className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-white">
              {component.anomaly_score !== null ? component.anomaly_score.toFixed(4) : 'N/A'}
            </div>
            <div className="mt-1 text-[10px] text-slate-500">
              {component.is_anomaly ? 'Outlier detected (< 0)' : 'Normal cluster'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
              Leakage Current
            </span>
            <div className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-white">
              {component.leakage_current_ua !== null ? `${component.leakage_current_ua} µA` : 'N/A'}
            </div>
            <div className="mt-1 text-[10px] text-slate-500">
              Chamber: {component.temp_c || 125}°C
            </div>
          </div>
        </div>

        {/* Burn-In Trajectory Curve */}
        <div className="px-5 pb-5">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span>Electrical Parameter Trajectory Across Burn-In</span>
          </h4>
          <div className="h-56 bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '11px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="voltage"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: '#2563eb' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 flex justify-between">
            <span>Points: 0h (baseline) &rarr; 24h &rarr; 48h (drift slope) &rarr; 168h (predicted end-of-life)</span>
            <span className="font-mono">Slope Formula: (V48 - V24) / 24h</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
