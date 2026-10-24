import React, { useState, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine, 
  ScatterChart, 
  Scatter, 
  ZAxis, 
  Legend 
} from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function TrendChart({ components, thresholdSlope = 0.0015 }) {
  const [chartMode, setChartMode] = useState('sampleCurves'); // 'sampleCurves' or 'scatter'

  // Pick sample components for comparative burn-in curves
  const { timeSeriesData, scatterData } = useMemo(() => {
    if (!components || !Array.isArray(components) || components.length === 0) {
      return { timeSeriesData: [], scatterData: [] };
    }

    const passSample = components.find((c) => c.status === 'PASS');
    const flagSample = components.find((c) => c.status === 'FLAG');
    const otherSample = components.find((c) => c.status === 'FLAG' && c.component_id !== flagSample?.component_id) || components[2];

    const curves = [
      {
        time: '0h (Init)',
        hours: 0,
        passVal: passSample?.v_0h,
        flagVal: flagSample?.v_0h,
        otherVal: otherSample?.v_0h,
      },
      {
        time: '24h',
        hours: 24,
        passVal: passSample?.v_24h,
        flagVal: flagSample?.v_24h,
        otherVal: otherSample?.v_24h,
      },
      {
        time: 'Intermediate',
        hours: 48,
        passVal: passSample?.v_48h,
        flagVal: flagSample?.v_48h,
        otherVal: otherSample?.v_48h,
      },
      {
        time: '72h',
        hours: 72,
        passVal: passSample?.v_72h,
        flagVal: flagSample?.v_72h,
        otherVal: otherSample?.v_72h,
      },
      {
        time: '168h (Pred)',
        hours: 168,
        passVal: passSample?.v_168h_pred,
        flagVal: flagSample?.v_168h_pred,
        otherVal: otherSample?.v_168h_pred,
      },
    ];

    // Optimize Scatter: filter and sample down to max 120 points for instant 60fps rendering
    const validPoints = components.filter(
      (c) => c.slope_24_48 !== null && c.anomaly_score !== null
    );

    let sampled = validPoints;
    if (validPoints.length > 120) {
      const step = Math.ceil(validPoints.length / 120);
      sampled = validPoints.filter((_, idx) => idx % step === 0);
    }

    const scatter = sampled.map((c) => ({
      id: c.component_id,
      slope: c.slope_24_48,
      anomalyScore: c.anomaly_score,
      status: c.status,
      fill: c.status === 'PASS' ? '#10b981' : (c.status === 'FLAG' ? '#f59e0b' : '#ef4444')
    }));

    return { timeSeriesData: curves, scatterData: scatter };
  }, [components]);

  if (!components || components.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-slate-400">
        No telemetry data available for trend visualization.
      </div>
    );
  }

  const passSample = components.find((c) => c.status === 'PASS');
  const flagSample = components.find((c) => c.status === 'FLAG');
  const otherSample = components.find((c) => c.status === 'FLAG' && c.component_id !== flagSample?.component_id) || components[2];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-colors mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span>Electrical Degradation & Anomaly Trajectory Analysis</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            JEDEC 168-Hour HTOL burn-in curve forecasting from early checkpoints
          </p>
        </div>

        <div className="flex items-center space-x-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
          <button
            onClick={() => setChartMode('sampleCurves')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              chartMode === 'sampleCurves'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Comparative Burn-In Curves
          </button>
          <button
            onClick={() => setChartMode('scatter')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              chartMode === 'scatter'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Slope vs Anomaly Distribution
          </button>
        </div>
      </div>

      <div className="mt-5 h-72 w-full">
        {chartMode === 'sampleCurves' ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeSeriesData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
              <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={11} unit="V" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  color: '#f8fafc',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              {passSample && (
                <Line
                  type="monotone"
                  dataKey="passVal"
                  name={`PASS: ${passSample.component_id} (Stable)`}
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  isAnimationActive={false}
                />
              )}
              {flagSample && (
                <Line
                  type="monotone"
                  dataKey="flagVal"
                  name={`FLAG: ${flagSample.component_id} (Elevated Drift)`}
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={{ r: 4 }}
                  isAnimationActive={false}
                />
              )}
              {otherSample && (
                <Line
                  type="monotone"
                  dataKey="otherVal"
                  name={`FLAG: ${otherSample.component_id} (Outlier)`}
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  isAnimationActive={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
              <XAxis
                type="number"
                dataKey="slope"
                name="Early Slope"
                unit=" V/h"
                stroke="#94a3b8"
                fontSize={11}
              />
              <YAxis
                type="number"
                dataKey="anomalyScore"
                name="Isolation Forest Score"
                stroke="#94a3b8"
                fontSize={11}
              />
              <ZAxis range={[50, 80]} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg text-xs text-white">
                        <div className="font-bold text-blue-400">{data.id}</div>
                        <div>Status: <span className="font-semibold">{data.status}</span></div>
                        <div>Slope: {data.slope?.toFixed(6)} V/h</div>
                        <div>Score: {data.anomalyScore?.toFixed(4)}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine x={thresholdSlope} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: `+Threshold`, fill: '#f59e0b', fontSize: 10 }} />
              <ReferenceLine x={-thresholdSlope} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: `-Threshold`, fill: '#f59e0b', fontSize: 10 }} />
              <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="2 2" />
              <Scatter name="Components" data={scatterData} fill="#3b82f6" isAnimationActive={false} />
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>PASS (In Tolerance)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>FLAG (Requires bench curve tracer)</span>
          </span>
        </div>
        <div className="font-mono text-slate-400">
          Slope Threshold: ±{thresholdSlope} V/hour
        </div>
      </div>
    </div>
  );
}
