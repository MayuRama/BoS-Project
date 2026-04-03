import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { dealers } from '../../../data/mockData';

const DealerMyRates: React.FC = () => {
  const [buyRate, setBuyRate] = useState(567);
  const [sellRate, setSellRate] = useState(572);
  const [newBuy, setNewBuy] = useState('');
  const [newSell, setNewSell] = useState('');
  const [effective, setEffective] = useState('Immediately');
  const [saved, setSaved] = useState(false);
  const [history] = useState([
    { date: '2024-03-14 16:30', prevBuy: 566, newBuy: 567, prevSell: 571, newSell: 572, by: 'Ahmed (ops)' },
    { date: '2024-03-12 09:15', prevBuy: 565, newBuy: 566, prevSell: 570, newSell: 571, by: 'Ahmed (ops)' },
    { date: '2024-03-10 11:00', prevBuy: 564, newBuy: 565, prevSell: 569, newSell: 570, by: 'Amina (admin)' },
    { date: '2024-03-07 14:45', prevBuy: 563, newBuy: 564, prevSell: 568, newSell: 569, by: 'Ahmed (ops)' },
    { date: '2024-03-05 08:30', prevBuy: 561, newBuy: 563, prevSell: 566, newSell: 568, by: 'Amina (admin)' },
  ]);

  const limits = { buyFloor: 558, buyCeiling: 575, sellFloor: 560, sellCeiling: 580 };
  const marketRef = 570;

  const newBuyNum = Number(newBuy);
  const newSellNum = Number(newSell);
  const buyOutBounds = newBuy && (newBuyNum < limits.buyFloor || newBuyNum > limits.buyCeiling);
  const sellOutBounds = newSell && (newSellNum < limits.sellFloor || newSellNum > limits.sellCeiling);

  const handleUpdate = () => {
    if (!buyOutBounds && !sellOutBounds && newBuy && newSell) {
      setBuyRate(newBuyNum);
      setSellRate(newSellNum);
      setNewBuy('');
      setNewSell('');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  // All dealers for comparison (anonymized except D002)
  const activeDealers = dealers.filter(d => d.status === 'Active');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Rates</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your exchange rates within Central Bank limits</p>
      </div>

      {/* Current Rates — Large Display */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl p-6">
          <p className="text-white/70 text-sm font-medium">My Current Buy Rate</p>
          <p className="text-5xl font-bold mt-2">SL {buyRate.toLocaleString()}</p>
          <p className="text-white/60 text-sm mt-2">Customer pays SL {buyRate.toLocaleString()} per USD</p>
        </div>
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl p-6">
          <p className="text-white/70 text-sm font-medium">My Current Sell Rate</p>
          <p className="text-5xl font-bold mt-2">SL {sellRate.toLocaleString()}</p>
          <p className="text-white/60 text-sm mt-2">Customer receives SL {sellRate.toLocaleString()} per USD</p>
        </div>
      </div>

      {/* Market Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-wrap gap-6 text-sm">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-bos-green" />
          <span className="text-gray-500">Market Reference:</span>
          <span className="font-bold text-gray-800">SL {marketRef.toLocaleString()}</span>
        </div>
        <div className="w-px h-5 bg-gray-300 hidden sm:block" />
        <div>
          <span className="text-gray-500">Allowed Buy: </span>
          <span className="font-medium text-gray-700">SL {limits.buyFloor.toLocaleString()} — SL {limits.buyCeiling.toLocaleString()}</span>
        </div>
        <div className="w-px h-5 bg-gray-300 hidden sm:block" />
        <div>
          <span className="text-gray-500">Allowed Sell: </span>
          <span className="font-medium text-gray-700">SL {limits.sellFloor.toLocaleString()} — SL {limits.sellCeiling.toLocaleString()}</span>
        </div>
        <div className="w-px h-5 bg-gray-300 hidden sm:block" />
        <div>
          <span className="text-gray-500">Max Spread: </span>
          <span className="font-medium text-gray-700">2%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Update form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Update Exchange Rates</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Buy Rate (SL/USD)</label>
              <input type="number" value={newBuy} onChange={e => setNewBuy(e.target.value)} placeholder={`Current: SL ${buyRate.toLocaleString()}`}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${buyOutBounds ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-bos-blue/30'}`} />
              {buyOutBounds && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertTriangle size={12} /> Outside allowed range ({limits.buyFloor.toLocaleString()} — {limits.buyCeiling.toLocaleString()})
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Sell Rate (SL/USD)</label>
              <input type="number" value={newSell} onChange={e => setNewSell(e.target.value)} placeholder={`Current: SL ${sellRate.toLocaleString()}`}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${sellOutBounds ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-bos-blue/30'}`} />
              {sellOutBounds && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertTriangle size={12} /> Outside allowed range ({limits.sellFloor.toLocaleString()} — {limits.sellCeiling.toLocaleString()})
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Effective From</label>
              <select value={effective} onChange={e => setEffective(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bos-blue/30">
                <option>Immediately</option>
                <option>Schedule</option>
              </select>
            </div>
            <button
              onClick={handleUpdate}
              disabled={!newBuy || !newSell || !!buyOutBounds || !!sellOutBounds}
              className="w-full bg-bos-blue text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-bos-blue/90 disabled:opacity-50">
              Update Rates
            </button>
            {saved && (
              <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <CheckCircle size={15} /> Rates updated and published to USSD platform.
              </div>
            )}
          </div>
        </div>

        {/* Rate History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Rate Change History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-gray-100">
                <tr>
                  {['Date', 'Prev Buy', 'New Buy', 'Prev Sell', 'New Sell', 'By'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase pb-2 pr-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {history.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-2 pr-3 text-gray-500">{r.date}</td>
                    <td className="py-2 pr-3 text-gray-400">{r.prevBuy.toLocaleString()}</td>
                    <td className="py-2 pr-3 font-medium text-green-700">{r.newBuy.toLocaleString()}</td>
                    <td className="py-2 pr-3 text-gray-400">{r.prevSell.toLocaleString()}</td>
                    <td className="py-2 pr-3 font-medium text-blue-700">{r.newSell.toLocaleString()}</td>
                    <td className="py-2 text-gray-500">{r.by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Market Comparison */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-1">Market Rate Comparison</h2>
        <p className="text-xs text-gray-400 mb-4">Other dealers shown anonymized · Your rates highlighted</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Dealer', 'Buy Rate', 'Sell Rate', 'Spread'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-2.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activeDealers.map((d, i) => {
                const isMe = d.id === 'D002';
                const spread = (((d.sellRate - d.buyRate) / d.buyRate) * 100).toFixed(2);
                return (
                  <tr key={d.id} className={isMe ? 'bg-blue-50 font-semibold' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-2.5">
                      {isMe ? (
                        <span className="flex items-center gap-2 text-blue-700 font-bold">
                          Premier Exchange Co. <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full">You</span>
                        </span>
                      ) : `Dealer ${String.fromCharCode(65 + i)}`}
                    </td>
                    <td className={`px-4 py-2.5 ${isMe ? 'text-blue-700' : 'text-gray-800'}`}>SL {d.buyRate.toLocaleString()}</td>
                    <td className={`px-4 py-2.5 ${isMe ? 'text-blue-700' : 'text-gray-800'}`}>SL {d.sellRate.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-gray-500">{spread}%</td>
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

export default DealerMyRates;
