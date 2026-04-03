import React, { useState } from 'react';
import { Download, Search, Filter } from 'lucide-react';
import { auditLogs } from '../../../data/mockData';

const actionColors: Record<string, string> = {
  CREATE: 'bg-blue-100 text-blue-800',
  UPDATE: 'bg-yellow-100 text-yellow-800',
  EXECUTE: 'bg-purple-100 text-purple-800',
  LOGIN: 'bg-green-100 text-green-800',
  LOGOUT: 'bg-gray-100 text-gray-700',
  VIEW: 'bg-indigo-100 text-indigo-800',
  EXPORT: 'bg-teal-100 text-teal-800',
  ALERT: 'bg-red-100 text-red-800',
  CANCEL: 'bg-orange-100 text-orange-800',
};

const AuditLogs: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('All');
  const [filterRole, setFilterRole] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const actions = ['All', ...Array.from(new Set(auditLogs.map(l => l.action)))];
  const roles = ['All', ...Array.from(new Set(auditLogs.map(l => l.role)))];

  const filtered = auditLogs.filter(l => {
    const matchSearch = search === '' || l.actor.toLowerCase().includes(search.toLowerCase()) || l.details.toLowerCase().includes(search.toLowerCase());
    const matchAction = filterAction === 'All' || l.action === filterAction;
    const matchRole = filterRole === 'All' || l.role === filterRole;
    return matchSearch && matchAction && matchRole;
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-sm text-gray-500 mt-0.5">Complete activity trail for compliance and oversight</p>
        </div>
        <button className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
          <Download size={14} /> Export Logs
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Filter size={14} />
            <span className="font-medium">Filters:</span>
          </div>
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search actor or details..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-lg pl-8 pr-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-bos-green/20" />
          </div>
          <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-bos-green/20">
            {actions.map(a => <option key={a}>{a}</option>)}
          </select>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-bos-green/20">
            {roles.map(r => <option key={r}>{r}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-bos-green/20" />
          <span className="text-gray-400 text-sm">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-bos-green/20" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-500">{filtered.length} log entries</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Timestamp', 'Actor', 'Role', 'Action', 'Entity', 'Details', 'IP Address'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-500 font-mono whitespace-nowrap">
                    {log.timestamp.replace('T', '\n').slice(0, 19)}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{log.actor}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{log.role}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${actionColors[log.action] || 'bg-gray-100 text-gray-700'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{log.entity}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate" title={log.details}>{log.details}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs font-mono">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="text-center text-gray-400 py-12">No log entries match the filters.</p>}
      </div>
    </div>
  );
};

export default AuditLogs;
