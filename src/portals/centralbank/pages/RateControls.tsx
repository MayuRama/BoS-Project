import React, { useState, useEffect, useCallback } from 'react';
import { Save, AlertTriangle, CheckCircle, TrendingUp, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { dealers } from '../../../data/mockData';
import { api } from '../../../api/client';

interface RateControl {
  id: string;
  buyFloor: number;
  buyCeiling: number;
  sellFloor: number;
  sellCeiling: number;
  maxSpreadPct: number;
  marketRef: number;
  updatedBy: string;
  updatedAt: string;
}

interface RateHistoryEntry {
  id: string;
  date: string;
  buyRate: number;
  sellRate: number;
  marketRef: number;
}

const RateControls: React.FC = () => {
  const [limits, setLimits] = useState({
    buyFloor: 558, buyCeiling: 575,
    sellFloor: 560, sellCeiling: 580,
    maxSpread: 2.5,
    marketRef: 570,
  });
  const [rateHistory, setRateHistory] = useState<RateHistoryEntry[]>([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastUpdatedBy, setLastUpdatedBy] = useState('');

  const fetchControls = useCallback(async () => {
    try {
      const control = await api.get<RateControl | null>('/rates/controls');
      if (control) {
        setLimits({
          buyFloor: Number(control.buyFloor),
          buyCeiling: Number(control.buyCeiling),
          sellFloor: Number(control.sellFloor),
          sellCeiling: Number(control.sellCeiling),
          maxSpread: Number(control.maxSpreadPct),
          marketRef: Number(control.marketRef),
        });
        setLastUpdatedBy(control.updatedBy);
      }
    } catch {
      // backend unavailable — keep defaults
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const history = await api.get<RateHistoryEntry[]>('/rates/history?days=30');
      setRateHistory(history.map(h => ({
        ...h,
        date: typeof h.date === 'string' ? h.date.slice(0, 10) : h.date,
        buyRate: Number(h.buyRate),
        sellRate: Number(h.sellRate),
        marketRef: Number(h.marketRef),
      })));
    } catch {
      // keep empty
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchControls(), fetchHistory()]).finally(() => setLoading(false));
    // Poll every 15s for rate control updates from other sessions
    const interval = setInterval(fetchControls, 15000);
    return () => clearInterval(interval);
  }, [fetchControls, fetchHistory]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await api.put('/rates/controls', {
        buyFloor: limits.buyFloor,
        buyCeiling: limits.buyCeiling,
        sellFloor: limits.sellFloor,
        sellCeiling: limits.sellCeiling,
        maxSpreadPct: limits.maxSpread,
        marketRef: limits.marketRef,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      fetchControls();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Request failed';
      if (msg.includes('token') || msg.includes('401') || msg.includes('Unauthorized')) {
        setSaveError('Not authenticated — please log out and sign back in using CB credentials (e.g. fxdesk / admin123) to save rate limits.');
      } else {
        setSaveError(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const isOutOfBounds = (d: typeof dealers[0]) =>
    d.buyRate < limits.buyFloor || d.buyRate > limits.buyCeiling ||
    d.sellRate < limits.sellFloor || d.sellRate > limits.sellCeiling;

  const activeDealers = dealers.filter(d => d.status === 'Active');

  // Compute stats from history
  const historyRates = rateHistory.map(h => h.marketRef);
  const todayHigh = historyRates.length ? Math.max(...historyRates.slice(-5)) : limits.marketRef;
  const todayLow  = historyRates.length ? Math.min(...historyRates.slice(-5)) : limits.marketRef;
  const avg30d    = historyRates.length ? Math.round(historyRates.reduce((a, b) => a + b, 0) / historyRates.length) : limits.marketRef;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rate Controls</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure exchange rate limits and monitor dealer compliance</p>
        </div>
        {loading && <RefreshCw size={16} className="text-gray-400 animate-spin" />}
      </div>

      {/* Market Reference Rate */}
      <div className="bg-bos-navy text-white rounded-xl p-5 flex flex-wrap gap-6 items-center">
        <div>
          <p className="text-white/60 text-xs uppercase tracking-wide mb-1">Market Reference Rate</p>
          <p className="text-3xl font-bold">SL {limits.marketRef.toLocaleString()}</p>
          <p className="text-white/50 text-xs mt-1">
            {lastUpdatedBy ? `Last set by: ${lastUpdatedBy}` : 'Source: External Market Feed'}
          </p>
        </div>
        <div className="flex-1 flex flex-wrap gap-8">
          <div>
            <p className="text-white/60 text-xs">Recent High</p>
            <p className="font-semibold text-bos-green">SL {todayHigh.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-white/60 text-xs">Recent Low</p>
            <p className="font-semibold text-orange-300">SL {todayLow.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-white/60 text-xs">30-Day Avg</p>
            <p className="font-semibold">SL {avg30d.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-white/60 text-xs">Volatility Index</p>
            <p className="font-semibold text-yellow-300">Low (0.8%)</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rate Limit Configuration */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Rate Limit Configuration</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Buy Rate Floor</label>
                <input type="number" value={limits.buyFloor} onChange={e => setLimits(p => ({ ...p, buyFloor: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-bos-green/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Buy Rate Ceiling</label>
                <input type="number" value={limits.buyCeiling} onChange={e => setLimits(p => ({ ...p, buyCeiling: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-bos-green/30" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Sell Rate Floor</label>
                <input type="number" value={limits.sellFloor} onChange={e => setLimits(p => ({ ...p, sellFloor: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-bos-green/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Sell Rate Ceiling</label>
                <input type="number" value={limits.sellCeiling} onChange={e => setLimits(p => ({ ...p, sellCeiling: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-bos-green/30" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Maximum Spread (%)</label>
                <input type="number" step="0.1" value={limits.maxSpread} onChange={e => setLimits(p => ({ ...p, maxSpread: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-bos-green/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Market Reference (SL)</label>
                <input type="number" value={limits.marketRef} onChange={e => setLimits(p => ({ ...p, marketRef: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-bos-green/30" />
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
              <p><span className="font-medium">Allowed Buy Range:</span> SL {limits.buyFloor.toLocaleString()} — SL {limits.buyCeiling.toLocaleString()}</p>
              <p><span className="font-medium">Allowed Sell Range:</span> SL {limits.sellFloor.toLocaleString()} — SL {limits.sellCeiling.toLocaleString()}</p>
              <p><span className="font-medium">Max Spread:</span> {limits.maxSpread}%</p>
            </div>

            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 bg-bos-green text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-bos-green/90 disabled:opacity-60">
              <Save size={15} />
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save & Broadcast Limits'}
            </button>
            {saved && (
              <div className="flex items-center gap-2 text-green-700 text-xs bg-green-50 rounded-lg px-3 py-2">
                <CheckCircle size={14} /> Rate limits updated and broadcast to all active dealers.
              </div>
            )}
            {saveError && (
              <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 rounded-lg px-3 py-2">
                <AlertTriangle size={14} /> {saveError}
              </div>
            )}
          </div>
        </div>

        {/* Rate History Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-bos-green" />
            <h2 className="text-base font-semibold text-gray-800">Rate History (Last 30 Days)</h2>
          </div>
          {rateHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={rateHistory.slice(-15)} margin={{ right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} interval={2} />
                <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="marketRef" stroke="#94a3b8" strokeWidth={1.5} dot={false} name="Market Ref" />
                <Line type="monotone" dataKey="buyRate" stroke="#6ab04c" strokeWidth={2} dot={false} name="Avg Buy Rate" />
                <Line type="monotone" dataKey="sellRate" stroke="#1e40af" strokeWidth={2} dot={false} name="Avg Sell Rate" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
              {loading ? 'Loading rate history...' : 'No history data available'}
            </div>
          )}
        </div>
      </div>

      {/* Dealer Rates Compliance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-1">Dealer Rate Compliance Monitor</h2>
        <p className="text-xs text-gray-400 mb-4">Rates highlighted in red are outside configured limits</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Dealer', 'Tier', 'Buy Rate', 'Sell Rate', 'Spread', 'Status', 'Compliance'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activeDealers.map(d => {
                const outBounds = isOutOfBounds(d);
                const spread = (((d.sellRate - d.buyRate) / d.buyRate) * 100).toFixed(2);
                return (
                  <tr key={d.id} className={outBounds ? 'bg-red-50' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-2.5 font-medium text-gray-800">
                      {outBounds && <AlertTriangle size={12} className="inline text-red-500 mr-1" />}
                      {d.name}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${d.tier === 1 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
                        Tier {d.tier}
                      </span>
                    </td>
                    <td className={`px-4 py-2.5 font-medium ${(d.buyRate < limits.buyFloor || d.buyRate > limits.buyCeiling) ? 'text-red-600' : 'text-gray-800'}`}>
                      SL {d.buyRate.toLocaleString()}
                    </td>
                    <td className={`px-4 py-2.5 font-medium ${(d.sellRate < limits.sellFloor || d.sellRate > limits.sellCeiling) ? 'text-red-600' : 'text-gray-800'}`}>
                      SL {d.sellRate.toLocaleString()}
                    </td>
                    <td className={`px-4 py-2.5 text-sm ${Number(spread) > limits.maxSpread ? 'text-red-600 font-medium' : 'text-gray-600'}`}>{spread}%</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${outBounds ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {outBounds ? 'Out of Bounds' : 'Compliant'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-bos-green rounded-full" style={{ width: `${d.complianceScore}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{d.complianceScore}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RateControls;
