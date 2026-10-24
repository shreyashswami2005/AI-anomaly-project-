import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle, 
  AlertTriangle, 
  AlertOctagon, 
  HelpCircle, 
  Download, 
  FileText, 
  ArrowUpDown,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { getExportCsvUrl, getExportPdfUrl, downloadClientExportCsv } from '../api';

export default function ScreeningTable({ components, activeRunId, onSelectComponent }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortField, setSortField] = useState('component_id');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const filteredComponents = useMemo(() => {
    if (!components || !Array.isArray(components)) return [];
    
    const searchLower = searchTerm.trim().toLowerCase();

    return components
      .filter((c) => {
        const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
        if (!matchesStatus) return false;

        if (!searchLower) return true;

        const idMatch = c.component_id && c.component_id.toLowerCase().includes(searchLower);
        const lotMatch = c.lot_number && c.lot_number.toLowerCase().includes(searchLower);
        const reasonMatch = c.reason && c.reason.toLowerCase().includes(searchLower);

        return idMatch || lotMatch || reasonMatch;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (valA === null || valA === undefined) valA = '';
        if (valB === null || valB === undefined) valB = '';

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA;
        }
        return sortAsc
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
  }, [components, searchTerm, statusFilter, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filteredComponents.length / pageSize));

  // Auto-clamp page if filter shrinks total pages
  const safePage = Math.min(currentPage, totalPages);

  const paginatedComponents = useMemo(() => {
    const startIndex = (safePage - 1) * pageSize;
    return filteredComponents.slice(startIndex, startIndex + pageSize);
  }, [filteredComponents, safePage, pageSize]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleFilterChange = (filter) => {
    setStatusFilter(filter);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PASS':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>PASS</span>
          </span>
        );
      case 'FLAG':
        return (
          <span 
            title="FLAG means further inspection is needed, not confirmed failure."
            className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800 cursor-help"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>FLAG (Review)</span>
          </span>
        );
      case 'INVALID DATA':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
            <span>INVALID DATA</span>
          </span>
        );
      case 'THRESHOLD REQUIRED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <HelpCircle className="w-3.5 h-3.5 text-purple-500" />
            <span>THRESHOLD REQ</span>
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden transition-colors">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Component ID, Lot, Reason..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['ALL', 'PASS', 'FLAG', 'INVALID DATA'].map((filter) => (
            <button
              key={filter}
              onClick={() => handleFilterChange(filter)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
                statusFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Export Buttons */}
        {activeRunId && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => downloadClientExportCsv(components)}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>
            <a
              href={getExportPdfUrl(activeRunId)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </a>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800 select-none">
            <tr>
              <th onClick={() => handleSort('component_id')} className="px-4 py-3 cursor-pointer hover:text-blue-500">
                <div className="flex items-center space-x-1">
                  <span>Component ID</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="px-4 py-3">Lot Number</th>
              <th className="px-4 py-3">V(0h)</th>
              <th className="px-4 py-3">V(24h)</th>
              <th className="px-4 py-3">V(Intermediate)</th>
              <th onClick={() => handleSort('v_168h_pred')} className="px-4 py-3 cursor-pointer hover:text-blue-500">
                <div className="flex items-center space-x-1">
                  <span>Pred 168h (V)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th onClick={() => handleSort('slope_24_48')} className="px-4 py-3 cursor-pointer hover:text-blue-500">
                <div className="flex items-center space-x-1">
                  <span>Slope (V/h)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th onClick={() => handleSort('anomaly_score')} className="px-4 py-3 cursor-pointer hover:text-blue-500">
                <div className="flex items-center space-x-1">
                  <span>Iso Score</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th onClick={() => handleSort('status')} className="px-4 py-3 cursor-pointer hover:text-blue-500">
                <div className="flex items-center space-x-1">
                  <span>Decision</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="px-4 py-3">Explainable Rationale</th>
              <th className="px-4 py-3 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedComponents.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-8 text-slate-400">
                  No components match the current search or filter criteria.
                </td>
              </tr>
            ) : (
              paginatedComponents.map((c) => (
                <tr
                  key={c.id || c.component_id}
                  onClick={() => onSelectComponent(c)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition"
                >
                  <td className="px-4 py-2.5 font-mono font-medium text-slate-900 dark:text-white">
                    {c.component_id}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-500 dark:text-slate-400">
                    {c.lot_number}
                  </td>
                  <td className="px-4 py-2.5 font-mono">{c.v_0h !== null ? c.v_0h.toFixed(3) : '-'}</td>
                  <td className="px-4 py-2.5 font-mono">{c.v_24h !== null ? c.v_24h.toFixed(3) : '-'}</td>
                  <td className="px-4 py-2.5 font-mono">{c.v_48h !== null ? c.v_48h.toFixed(3) : '-'}</td>
                  <td className="px-4 py-2.5 font-mono font-semibold text-blue-600 dark:text-blue-400">
                    {c.v_168h_pred !== null ? c.v_168h_pred.toFixed(3) : '-'}
                  </td>
                  <td className="px-4 py-2.5 font-mono">
                    {c.slope_24_48 !== null ? (
                      <span className={Math.abs(c.slope_24_48) > 0.0015 ? 'text-amber-500 font-semibold' : ''}>
                        {c.slope_24_48.toFixed(6)}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-500">
                    {c.anomaly_score !== null ? c.anomaly_score.toFixed(3) : '-'}
                  </td>
                  <td className="px-4 py-2.5">{getStatusBadge(c.status)}</td>
                  <td className="px-4 py-2.5 max-w-xs truncate text-[11px] text-slate-500 dark:text-slate-400" title={c.reason}>
                    {c.reason}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectComponent(c);
                      }}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-500"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer & High-Performance Pagination Bar */}
      <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <span>
            Showing <span className="font-semibold text-slate-700 dark:text-slate-200">
              {filteredComponents.length > 0 ? (safePage - 1) * pageSize + 1 : 0}
            </span> to <span className="font-semibold text-slate-700 dark:text-slate-200">
              {Math.min(safePage * pageSize, filteredComponents.length)}
            </span> of <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredComponents.length}</span> units
          </span>

          <div className="flex items-center space-x-1.5 text-xs">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Page Buttons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={safePage <= 1}
            title="First Page"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
            disabled={safePage <= 1}
            title="Previous Page"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="px-3 py-1 font-mono text-xs font-medium text-slate-700 dark:text-slate-300">
            Page {safePage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
            disabled={safePage >= totalPages}
            title="Next Page"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={safePage >= totalPages}
            title="Last Page"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
