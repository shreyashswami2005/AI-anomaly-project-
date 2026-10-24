import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export const getHealth = async () => {
  const res = await api.get('/health');
  return res.data;
};

export const getRuns = async () => {
  const res = await api.get('/runs');
  return res.data;
};

export const getRunDetails = async (runId) => {
  const res = await api.get(`/runs/${runId}`);
  return res.data;
};

export const validateDataset = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/dataset/validate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const uploadDataset = async (file, thresholdSlope, thresholdVoltage, contaminationRate) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('threshold_slope', thresholdSlope);
  formData.append('threshold_voltage', thresholdVoltage);
  formData.append('contamination_rate', contaminationRate);

  const res = await api.post('/dataset/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const generateSyntheticRun = async (samples = 120, thresholdSlope = 0.0015, thresholdVoltage = 0.08) => {
  const res = await api.post(
    `/dataset/generate-synthetic?num_samples=${samples}&threshold_slope=${thresholdSlope}&threshold_voltage=${thresholdVoltage}`
  );
  return res.data;
};

export const getSampleCsvUrl = () => `${API_BASE_URL}/dataset/sample`;
export const getExportCsvUrl = (runId) => `${API_BASE_URL}/runs/${runId}/export/csv`;
export const getExportPdfUrl = (runId) => `${API_BASE_URL}/runs/${runId}/export/pdf`;

export default api;
