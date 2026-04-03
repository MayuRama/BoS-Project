import React, { useState } from 'react';
import { Plus, Search, Eye, PauseCircle, Edit2 } from 'lucide-react';
import StatusBadge from '../../../components/ui/StatusBadge';
import Modal from '../../../components/ui/Modal';
import { dealers as initialDealers } from '../../../data/mockData';
import type { Dealer } from '../../../types';

const fmtUSD = (n: number) => `$${n.toLocaleString()}`;

type FilterType = 'All' | 'Tier 1' | 'Tier 2' | 'Suspended';

const emptyDealer: Partial<Dealer> = {
  name: '', licenseNumber: '', tier: 1, dailyLimit: 200000, walletProvider: 'Zaad', status: 'Pending',
};

const DealerManagement: React.FC = () => {
  const [dealers, setDealers] = useState<Dealer[]>(initialDealers);
  const [filter, setFilter] = useState<FilterType>('All');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editDealer, setEditDealer] = useState<Partial<Dealer>>(emptyDealer);
  const [editing, setEditing] = useState<string | null>(null);

  const filtered = dealers.filter(d => {
    const matchFilter = filter === 'All' || (filter === 'Tier 1' && d.tier === 1) || (filter === 'Tier 2' && d.tier === 2) || (filter === 'Suspended' && d.status === 'Suspended');
    const matchSearch = search === '' || d.name.toLowerCase().includes(search.toLowerCase()) || d.id.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const openAdd = () => { setEditing(null); setEditDealer(emptyDealer); setShowModal(true); };
  const openEdit = (d: Dealer) => { setEditing(d.id); setEditDealer({ ...d }); setShowModal(true); };

  const handleSave = () => {
    if (editing) {
      setDealers(prev => prev.map(d => d.id === editing ? { ...d, ...editDealer } as Dealer : d));
    } else {
      const newDealer: Dealer = {
        id: `D${String(dealers.length + 1).padStart(3, '0')}`,
        name: editDealer.name || 'New Dealer',
        licenseNumber: editDealer.licenseNumber || 'FX-LIC-PENDING',
        tier: editDealer.tier || 1,
        buyRate: 10200,
        sellRate: 10260,
        dailyLimit: editDealer.dailyLimit || 100000,
        status: editDealer.status || 'Pending',
        walletProvider: editDealer.walletProvider || 'Zaad',
        registeredDate: new Date().toISOString().split('T')[0],
        volume30d: 0,
        txCount30d: 0,
        complianceScore: 80,
        contactEmail: '',
        contactPhone: '',
      };
      setDealers(prev => [...prev, newDealer]);
    }
    setShowModal(false);
  };

  const toggleSuspend = (id: string) => {
    setDealers(prev => prev.map(d => d.id === id ? { ...d, status: d.status === 'Suspended' ? 'Active' : 'Suspended' } : d));
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dealer Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{dealers.filter(d => d.status === 'Active').length} active dealers · {dealers.length} total registered</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-bos-green text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-bos-green/90">
          <Plus size={16} /> Add New Dealer
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['All', 'Tier 1', 'Tier 2', 'Suspended'] as FilterType[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === f ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by name or ID..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bos-green/20" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['ID', 'Dealer Name', 'License #', 'Tier', 'Buy Rate', 'Sell Rate', 'Daily Limit', 'Status', 'Wallet', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(d => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-500 text-xs">{d.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{d.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs font-mono">{d.licenseNumber}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${d.tier === 1 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
                      Tier {d.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">SL {d.buyRate.toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium">SL {d.sellRate.toLocaleString()}</td>
                  <td className="px-4 py-3">{fmtUSD(d.dailyLimit)}</td>
                  <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-3 text-gray-500">{d.walletProvider}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(d)} className="p-1 text-gray-400 hover:text-blue-600 rounded" title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => toggleSuspend(d.id)}
                        className={`p-1 rounded ${d.status === 'Suspended' ? 'text-green-500 hover:text-green-700' : 'text-gray-400 hover:text-orange-500'}`}
                        title={d.status === 'Suspended' ? 'Activate' : 'Suspend'}>
                        <PauseCircle size={14} />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-purple-600 rounded" title="View">
                        <Eye size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="text-center text-gray-400 py-12">No dealers found.</p>}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Dealer' : 'Add New Dealer'} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dealer Name</label>
            <input type="text" value={editDealer.name || ''} onChange={e => setEditDealer(p => ({ ...p, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bos-green/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
            <input type="text" value={editDealer.licenseNumber || ''} onChange={e => setEditDealer(p => ({ ...p, licenseNumber: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bos-green/30" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
              <select value={editDealer.tier} onChange={e => setEditDealer(p => ({ ...p, tier: Number(e.target.value) as 1 | 2 }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bos-green/30">
                <option value={1}>Tier 1</option>
                <option value={2}>Tier 2</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={editDealer.status} onChange={e => setEditDealer(p => ({ ...p, status: e.target.value as Dealer['status'] }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bos-green/30">
                <option>Active</option>
                <option>Suspended</option>
                <option>Pending</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Daily Transaction Limit (USD)</label>
            <input type="number" value={editDealer.dailyLimit || ''} onChange={e => setEditDealer(p => ({ ...p, dailyLimit: Number(e.target.value) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bos-green/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wallet Provider</label>
            <select value={editDealer.walletProvider} onChange={e => setEditDealer(p => ({ ...p, walletProvider: e.target.value as Dealer['walletProvider'] }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bos-green/30">
              <option>Zaad</option>
              <option>e-Dahab</option>
              <option>Both</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} className="px-5 py-2 bg-bos-green text-white rounded-lg text-sm font-semibold hover:bg-bos-green/90">Save Dealer</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DealerManagement;
