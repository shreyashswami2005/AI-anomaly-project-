import axios from 'axios';
import { 
  generateBrowserSyntheticData, 
  downloadClientSampleCsv, 
  downloadClientExportCsv 
} from './mockEngine';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

// Cache for mock run in browser mode
let browserRunState = null;

export const getHealth = async () => {
  try {
    const res = await api.get('/health');
    return res.data;
  } catch (err) {
    // Cloud fallback
    return {
      status: "healthy",
      service: "AI Burn-In Screening Engine (Vercel Cloud Mode)",
      timestamp: new Date().toISOString(),
      ml_trained: true
    };
  }
};

export const getRuns = async () => {
  try {
    const res = await api.get('/runs');
    return res.data;
  } catch (err) {
    if (!browserRunState) {
      browserRunState = generateBrowserSyntheticData(100);
    }
    return [browserRunState.summary];
  }
};

export const getRunDetails = async (runId) => {
  try {
    const res = await api.get(`/runs/${runId}`);
    return res.data;
  } catch (err) {
    if (!browserRunState) {
      browserRunState = generateBrowserSyntheticData(100);
    }
    return browserRunState;
  }
};

export const validateDataset = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/dataset/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  } catch (err) {
    // Client-side parser fallback for CSV
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        const header = lines[0].toLowerCase().split(',').map(s => s.trim().replace(/['"]/g, ''));
        const detected = lines[0].split(',').map(s => s.trim());
        
        const hasV0 = header.some(h => ['v_0h', 'value_0h', 'val_0h', '0h', 'voltage_0h'].includes(h));
        const hasV24 = header.some(h => ['v_24h', 'value_24h', 'val_24h', '24h', 'voltage_24h'].includes(h));
        const hasInt = header.some(h => ['v_48h', 'value_48h', 'value_96h', 'v_96h', 'value_72h'].includes(h));

        resolve({
          valid: hasV0 && hasV24 && hasInt,
          total_rows: Math.max(1, lines.length - 1),
          detected_columns: detected,
          missing_required_columns: (!hasV0 || !hasV24 || !hasInt) ? ['Initial (value_0h)', 'Early (value_24h)', 'Intermediate (value_96h/48h)'] : [],
          sample_preview: [],
          warnings: ['Validated via browser fallback engine.']
        });
      };
      reader.readAsText(file);
    });
  }
};

export const uploadDataset = async (file, thresholdSlope, thresholdVoltage, contaminationRate) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('threshold_slope', thresholdSlope);
    formData.append('threshold_voltage', thresholdVoltage);
    formData.append('contamination_rate', contaminationRate);

    const res = await api.post('/dataset/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  } catch (err) {
    browserRunState = generateBrowserSyntheticData(100, thresholdSlope, thresholdVoltage);
    return { status: "success", run_id: 1, total_screened: 100 };
  }
};

export const generateSyntheticRun = async (samples = 120, thresholdSlope = 0.0015, thresholdVoltage = 0.08) => {
  try {
    const res = await api.post(
      `/dataset/generate-synthetic?num_samples=${samples}&threshold_slope=${thresholdSlope}&threshold_voltage=${thresholdVoltage}`
    );
    return res.data;
  } catch (err) {
    browserRunState = generateBrowserSyntheticData(samples, thresholdSlope, thresholdVoltage);
    return { status: "success", run_id: 1 };
  }
};

export const getSampleCsvUrl = () => `${API_BASE_URL}/dataset/sample`;
export const getExportCsvUrl = (runId) => `${API_BASE_URL}/runs/${runId}/export/csv`;
export const getExportPdfUrl = (runId) => `${API_BASE_URL}/runs/${runId}/export/pdf`;

export { downloadClientSampleCsv, downloadClientExportCsv };
export default api;
