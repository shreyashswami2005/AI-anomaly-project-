import React from 'react';
import { 
  LayoutDashboard, 
  ListFilter, 
  LineChart, 
  Binary, 
  FileCheck2, 
  HelpCircle, 
  SlidersHorizontal 
} from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView, activeRun }) {
  const navItems = [
    { id: 'dashboard', label: 'Screening Overview', icon: LayoutDashboard },
    { id: 'table', label: 'Component Registry', icon: ListFilter, count: activeRun?.components?.length },
    { id: 'trends', label: 'Burn-In Curves', icon: LineChart },
    { id: 'evaluation', label: 'Model Metrics & R²', icon: Binary },
    { id: 'standards', label: 'JEDEC / Screening Rules', icon: FileCheck2 },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-colors select-none">
      <div className="p-4 border-b border-slate-800/80">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
          OPERATIONAL MODULE
        </div>
        <div className="text-sm font-medium text-white flex items-center justify-between">
          <span>HTOL Stress Screening</span>
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                  isActive ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Industrial Specs Box */}
      <div className="p-4 mx-3 mb-4 rounded-xl bg-slate-850 border border-slate-800 text-xs space-y-2">
        <div className="flex items-center justify-between text-slate-400 font-semibold uppercase text-[10px]">
          <span>Test Chamber Env</span>
          <span className="text-emerald-400 font-mono">125°C</span>
        </div>
        <div className="flex justify-between text-slate-300">
          <span className="text-slate-500">JEDEC Cycle:</span>
          <span className="font-mono text-slate-200">168 Hours</span>
        </div>
        <div className="flex justify-between text-slate-300">
          <span className="text-slate-500">Early Drift Check:</span>
          <span className="font-mono text-slate-200">24h - 48h</span>
        </div>
        <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400">
          Formula: <code className="text-blue-400 font-mono">(V2-V1)/(t2-t1)</code>
        </div>
      </div>
    </aside>
  );
}
