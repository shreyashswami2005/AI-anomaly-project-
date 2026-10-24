import React, { useState } from 'react';
import { X, Sliders, Save, RotateCcw, AlertTriangle } from 'lucide-react';

export default function SettingsModal({ 
  onClose, 
  onSave, 
  currentSlope = 0.0015, 
  currentVoltage = 0.08, 
  currentContamination = 0.04 
}) {
  const [slope, setSlope] = useState(currentSlope);
  const [voltage, setVoltage] = useState(currentVoltage);
  const [contamination, setContamination] = useState(currentContamination);

  const handleReset = () => {
    setSlope(0.0015);
    setVoltage(0.08);
    setContamination(0.04);
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSave({
      slope: parseFloat(slope),
      voltage: parseFloat(voltage),
      contamination: parseFloat(contamination)
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl transition-colors">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Screening Rules & Safety Thresholds
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Adjust engineering tolerances applied to burn-in components
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Early Slope Safety Limit (V / hour)
            </label>
            <input
              type="number"
              step="0.0001"
              value={slope}
              onChange={(e) => setSlope(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Rule: <code className="font-mono text-blue-500">|Slope| &gt; Limit</code> flags component for bench review. (Default: 0.0015 V/h)
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Maximum Total Voltage Drift |V168 - V0| (V)
            </label>
            <input
              type="number"
              step="0.005"
              value={voltage}
              onChange={(e) => setVoltage(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              End-of-life shift exceeding this tolerance triggers FLAG status. (Default: 0.08 V)
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Isolation Forest Contamination Rate ({(contamination * 100).toFixed(0)}%)
            </label>
            <input
              type="range"
              min="0.01"
              max="0.15"
              step="0.01"
              value={contamination}
              onChange={(e) => setContamination(parseFloat(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>1% (Strict)</span>
              <span>4% (Nominal)</span>
              <span>15% (Sensitive)</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Apply & Re-Screen</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
