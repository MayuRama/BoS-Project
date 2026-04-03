import React, { useState } from 'react';
import { Save, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { dealers, rateHistory } from '../../../data/mockData';

const RateControls: React.FC = () => {
  const [limits, setLimits] = useState({
    buyFloor: 558, buyCeiling: 575,
    sellFloor: 560, sellCeiling: 580,
    maxSpread: 2,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const isOutOfBounds = (d: typeof dealers[0]) =>
    d.buyRate < limits.buyFloor || d.buyRate > limits.buyCeiling ||
    d.sellRate < limits.sellFloor || d.sellRate > limits.sellCeiling;

  const activeDealers = dealers.filter(d => d.status === 'Active');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rate Controls</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure exchange rate limits and monitor dealer compliance</p>
      </div>

      {/* Market Reference Rate */}
      <div className="bg-bos-navy text-white rounded-xl p-5 flex flex-wrap gap-6 items-center">
        <div>
          <p className="text-white/60 text-xs uppercase tracking-wide mb-1">Market Reference Rate</p>
          <p className="text-3xl font-bold">SL 570</p>
          <p className="text-white/50 text-xs mt-1">Source: External Market Feed · Updated 2 mins ago</p>
        </div>
        <div className="flex-1 flex flex-wrap gap-8">
          <div>
            <p className="text-white/60 text-xs">Today's High</p>
            <p className="font-semibold text-bos-green">SL 10,220</p>
          </div>
          <div>
            <p className="text-white/60 text-xs">Today's Low</p>
            <p className="font-semibold text-orange-300">SL 10,150</p>
          </div>
          <div>
            <p className="text-white/60 text-xs">30-Day Avg</p>
            <p className="font-semibold">SL 10,195</p>
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
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Maximum Spread (%)</label>
              <input type="number" step="0.1" value={limits.maxSpread} onChange={e => setLimits(p => ({ ...p, maxSpread: Number(e.target.value) }))}
                className="w-40 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-bos-green/30" />
            </div>

            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
              <p><span className="font-medium">Allowed Buy Range:</span> SL {limits.buyFloor.toLocaleString()} — SL {limits.buyCeiling.toLocaleString()}</p>
              <p><span className="font-medium">Allowed Sell Range:</span> SL {limits.sellFloor.toLocaleString()} — SL {limits.sellCeiling.toLocaleString()}</p>
              <p><span className="font-medium">Max Spread:</span> {limits.maxSpread}%</p>
            </div>

            <button onClick={handleSave}
              className="flex items-center gap-2 bg-bos-green text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-bos-green/90">
              <Save size={15} />
              {saved ? 'Saved!' : 'Save Limits'}
            </button>
            {saved && (
              <div className="flex items-center gap-2 text-green-700 text-xs bg-green-50 rounded-lg px-3 py-2">
                <CheckCircle size={14} /> Rate limits updated and broadcast to all active dealers.
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
