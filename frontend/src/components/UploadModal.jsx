import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertTriangle, 
  Download, 
  Layers, 
  Play, 
  Loader2 
} from 'lucide-react';
import { validateDataset, uploadDataset, getSampleCsvUrl } from '../api';

export default function UploadModal({ onClose, onSuccess, defaultThresholdSlope = 0.0015, defaultThresholdVoltage = 0.08 }) {
  const [file, setFile] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [thresholdSlope, setThresholdSlope] = useState(defaultThresholdSlope);
  const [thresholdVoltage, setThresholdVoltage] = useState(defaultThresholdVoltage);
  const [contaminationRate, setContaminationRate] = useState(0.04);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleFileChange = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setErrorMsg(null);
    setIsValidating(true);

    try {
      const res = await validateDataset(selected);
      setValidationResult(res);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to parse file. Please upload a valid CSV or Excel file.');
      setValidationResult(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Please select a dataset file.');
      return;
    }
    if (validationResult && !validationResult.valid) {
      setErrorMsg('Dataset is missing required columns. Please check column format.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);
    try {
      const res = await uploadDataset(file, thresholdSlope, thresholdVoltage, contaminationRate);
      onSuccess(res.run_id);
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Screening execution failed. Verify dataset format.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Upload Burn-In Screening Dataset
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload CSV or Excel files with component telemetry across burn-in checkpoints
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Download Sample Banner */}
          <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/60 flex items-center justify-between">
            <div className="text-xs text-blue-900 dark:text-blue-300">
              <span className="font-semibold">Need standard test data?</span>
              <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5">
                Download a pre-formatted synthetic JEDEC HTOL burn-in dataset.
              </p>
            </div>
            <a
              href={getSampleCsvUrl()}
              download
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Sample CSV</span>
            </a>
          </div>

          {/* Drag & Drop File Zone */}
          <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-blue-500 dark:hover:border-blue-400 transition bg-slate-50/50 dark:bg-slate-850/40">
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-500 mb-2" />
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {file ? file.name : 'Choose a CSV or Excel file or drag & drop'}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Supports .csv, .xlsx (columns: v_0h, v_24h, v_48h, lot_number, etc.)
            </p>
          </div>

          {/* Validation Feedback */}
          {isValidating && (
            <div className="flex items-center justify-center space-x-2 text-xs text-slate-500 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span>Validating schema and data columns...</span>
            </div>
          )}

          {validationResult && (
            <div className={`p-4 rounded-xl border text-xs space-y-2 ${
              validationResult.valid
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-300'
            }`}>
              <div className="flex items-center space-x-2 font-bold">
                {validationResult.valid ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                )}
                <span>
                  {validationResult.valid
                    ? `Dataset Validated: ${validationResult.total_rows} electronic components recognized`
                    : 'Schema Validation Error: Missing Required Columns'}
                </span>
              </div>

              {!validationResult.valid && (
                <div className="text-[11px] text-rose-700 dark:text-rose-400">
                  Missing required columns: <code className="font-mono font-bold">{validationResult.missing_required_columns.join(', ')}</code>
                </div>
              )}

              {validationResult.warnings && validationResult.warnings.length > 0 && (
                <div className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-800">
                  {validationResult.warnings.map((w, i) => (
                    <div key={i}>• {w}</div>
                  ))}
                </div>
              )}

              {validationResult.sample_preview && validationResult.sample_preview.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 text-[10px] text-slate-600 dark:text-slate-400">
                  <span className="font-semibold">Detected Schema:</span> {validationResult.detected_columns.join(' | ')}
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Configurable Screening Thresholds */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              <span>Configurable Screening Parameters</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Slope Safety Limit (V / hour)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={thresholdSlope}
                  onChange={(e) => setThresholdSlope(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-500">
                  Formula: Slope = (V48 - V24) / 24. Standard: 0.0015 V/h
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  168h Max Voltage Drift (V)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={thresholdVoltage}
                  onChange={(e) => setThresholdVoltage(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-500">
                  Maximum allowable total shift |V168 - V0|
                </span>
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || isValidating || !file}
              className="flex items-center space-x-1.5 px-5 py-2 text-xs font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing AI Models...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Start AI Screening</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
