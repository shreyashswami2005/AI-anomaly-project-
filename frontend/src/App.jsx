import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import KpiCards from './components/KpiCards';
import ScreeningTable from './components/ScreeningTable';
import TrendChart from './components/TrendChart';
import ComponentDetailModal from './components/ComponentDetailModal';
import UploadModal from './components/UploadModal';
import EvaluationPanel from './components/EvaluationPanel';
import SettingsModal from './components/SettingsModal';
import StandardsView from './components/StandardsView';
import { getHealth, getRuns, getRunDetails, generateSyntheticRun } from './api';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [currentView, setCurrentView] = useState('dashboard');
  const [serverStatus, setServerStatus] = useState('connecting');
  const [allRuns, setAllRuns] = useState([]);
  const [activeRunId, setActiveRunId] = useState(null);
  const [activeRun, setActiveRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Thresholds state
  const [thresholdSlope, setThresholdSlope] = useState(0.0015);
  const [thresholdVoltage, setThresholdVoltage] = useState(0.08);
  const [contaminationRate, setContaminationRate] = useState(0.04);

  // Sync dark mode class with root html
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Initial data loading
  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      await getHealth();
      setServerStatus('online');

      const runs = await getRuns();
      setAllRuns(runs);

      if (runs.length > 0) {
        const latestRunId = runs[0].id;
        setActiveRunId(latestRunId);
        const details = await getRunDetails(latestRunId);
        setActiveRun(details);
        if (details.summary?.threshold_slope) {
          setThresholdSlope(details.summary.threshold_slope);
        }
      }
    } catch (err) {
      console.error('Error connecting to backend API:', err);
      setServerStatus('offline');
      setError('Could not connect to the Python FastAPI backend server. Ensure backend is running at http://localhost:8000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleRunChange = async (runId) => {
    setActiveRunId(runId);
    setLoading(true);
    try {
      const details = await getRunDetails(runId);
      setActiveRun(details);
      if (details.summary?.threshold_slope) {
        setThresholdSlope(details.summary.threshold_slope);
      }
    } catch (err) {
      console.error('Failed to load run details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSynthetic = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await generateSyntheticRun(120, thresholdSlope, thresholdVoltage);
      const runs = await getRuns();
      setAllRuns(runs);
      if (res.run_id) {
        await handleRunChange(res.run_id);
      }
    } catch (err) {
      setError('Failed to generate synthetic dataset: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSettingsSave = async ({ slope, voltage, contamination }) => {
    setThresholdSlope(slope);
    setThresholdVoltage(voltage);
    setContaminationRate(contamination);
    // Trigger re-screen with updated thresholds
    setIsGenerating(true);
    try {
      const res = await generateSyntheticRun(120, slope, voltage);
      const runs = await getRuns();
      setAllRuns(runs);
      if (res.run_id) {
        await handleRunChange(res.run_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenUpload={() => setIsUploadOpen(true)}
        onGenerateSynthetic={handleGenerateSynthetic}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isGenerating={isGenerating}
        activeRun={activeRun}
        serverStatus={serverStatus}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
          activeRun={activeRun}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={loadInitialData}
                className="px-3 py-1 rounded bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-100 font-medium hover:bg-rose-300 transition"
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center h-96 space-y-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="text-xs font-medium">Loading burn-in telemetry & ML models...</span>
            </div>
          ) : (
            <>
              {/* Dashboard View */}
              {currentView === 'dashboard' && (
                <div className="space-y-6 animate-fadeIn">
                  <KpiCards
                    kpis={activeRun?.kpis}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                  />

                  <TrendChart
                    components={activeRun?.components}
                    thresholdSlope={thresholdSlope}
                  />

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Active Screening Batch
                      </h3>
                      <button
                        onClick={() => setCurrentView('table')}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View Full Registry &rarr;
                      </button>
                    </div>
                    <ScreeningTable
                      components={activeRun?.components?.slice(0, 20)}
                      activeRunId={activeRunId}
                      onSelectComponent={(c) => setSelectedComponent(c)}
                    />
                  </div>
                </div>
              )}

              {/* Table / Registry View */}
              {currentView === 'table' && (
                <div className="space-y-4 animate-fadeIn">
                  <ScreeningTable
                    components={activeRun?.components}
                    activeRunId={activeRunId}
                    onSelectComponent={(c) => setSelectedComponent(c)}
                  />
                </div>
              )}

              {/* Trend Analysis View */}
              {currentView === 'trends' && (
                <div className="space-y-6 animate-fadeIn">
                  <TrendChart
                    components={activeRun?.components}
                    thresholdSlope={thresholdSlope}
                  />
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm text-xs text-slate-600 dark:text-slate-400">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">
                      Engineering Rule Definition
                    </h4>
                    <p className="leading-relaxed">
                      Burn-in screening identifies components whose parameter drift rate (slope) deviates from the standard thermal stabilization curve. The slope is computed across 24h and 48h early checkpoints. Components exhibiting $|Slope| &gt; {thresholdSlope}$ V/h or flagged by the unsupervised Isolation Forest model are categorized as <b>FLAG</b> for further bench inspection before qualification.
                    </p>
                  </div>
                </div>
              )}

              {/* Model Evaluation & R² View */}
              {currentView === 'evaluation' && (
                <div className="animate-fadeIn">
                  <EvaluationPanel
                    evaluation={activeRun?.evaluation}
                    summary={activeRun?.summary}
                  />
                </div>
              )}

              {/* Standards & Guidelines View */}
              {currentView === 'standards' && (
                <div className="animate-fadeIn">
                  <StandardsView />
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Modals & Drawers */}
      {selectedComponent && (
        <ComponentDetailModal
          component={selectedComponent}
          onClose={() => setSelectedComponent(null)}
          thresholdSlope={thresholdSlope}
        />
      )}

      {isUploadOpen && (
        <UploadModal
          onClose={() => setIsUploadOpen(false)}
          onSuccess={async (newRunId) => {
            const runs = await getRuns();
            setAllRuns(runs);
            await handleRunChange(newRunId);
          }}
          defaultThresholdSlope={thresholdSlope}
          defaultThresholdVoltage={thresholdVoltage}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSettingsSave}
          currentSlope={thresholdSlope}
          currentVoltage={thresholdVoltage}
          currentContamination={contaminationRate}
        />
      )}
    </div>
  );
}
