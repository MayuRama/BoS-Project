import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, XCircle, Zap, RefreshCw } from 'lucide-react';
import StatusBadge from '../../../components/ui/StatusBadge';
import { api } from '../../../api/client';

const fmtUSD = (n: number) => `$${n.toLocaleString()}`;

interface APIBid {
  id: string;
  sessionId: string;
  dealerId: string;
  tier: string;
  bidAmount: number;
  bidRate: number | null;
  allocatedAmount: number | null;
  status: string;
  submittedAt: string;
  updatedAt: string;
  dealer: { id: string; name: string; tier: string };
}

interface APIAllocationResult {
  id: string;
  sessionId: string;
  dealerId: string;
  bidAmount: number;
  allocatedAmount: number;
  fixedRate: number;
  slSettlement: number;
  dealer: { id: string; name: string };
}

interface APIOMOSession {
  id: string;
  type: string;
  fixedRate: number;
  totalAmount: number;
  startTime: string;
  durationMinutes: number;
  allocationMethod: string;
  maxBidTier1: number;
  maxBidTier2: number;
  notes: string | null;
  status: string;
  closedAt: string | null;
  createdBy: string;
  createdAt: string;
  bids: APIBid[];
  allocationResults: APIAllocationResult[];
}

const OMOSessionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<APIOMOSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [allocating, setAllocating] = useState(false);
  const [allocateError, setAllocateError] = useState('');

  const fetchSession = useCallback(async () => {
    if (!id) return;
    try {
      const data = await api.get<APIOMOSession>(`/omo-sessions/${id}`);
      setSession(data);
      setNotFound(false);
      // Calculate time remaining from startTime + durationMinutes
      if (data.status === 'Open') {
        const end = new Date(data.startTime).getTime() + data.durationMinutes * 60 * 1000;
        const remaining = Math.max(0, Math.floor((end - Date.now()) / 1000));
        setTimeLeft(remaining);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('not found') || msg.includes('404')) {
        setNotFound(true);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Initial fetch + poll every 10s
  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 10000);
    return () => clearInterval(interval);
  }, [fetchSession]);

  // Countdown timer
  useEffect(() => {
    if (!session || session.status !== 'Open') return;
    const interval = setInterval(() => setTimeLeft(t => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(interval);
  }, [session?.status]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleAllocate = async () => {
    if (!session) return;
    setAllocating(true);
    setAllocateError('');
    try {
      await api.post(`/omo-sessions/${session.id}/allocate`, {});
      await fetchSession();
    } catch (err: unknown) {
      setAllocateError(err instanceof Error ? err.message : 'Allocation failed');
    } finally {
      setAllocating(false);
    }
  };

  const handleCancel = async () => {
    if (!session) return;
    try {
      await api.patch(`/omo-sessions/${session.id}/cancel`);
      await fetchSession();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Cancel failed');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-gray-500">
        <RefreshCw size={16} className="animate-spin" /> Loading session...
      </div>
    );
  }

  if (notFound || !session) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Session not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline flex items-center gap-1">
          <ArrowLeft size={14} /> Back
        </button>
      </div>
    );
  }

  const bids = session.bids ?? [];
  const allocationResults = session.allocationResults ?? [];
  const totalBids = bids.reduce((a, b) => a + Number(b.bidAmount), 0);
  const pct = Math.min((totalBids / Number(session.totalAmount)) * 100, 100);
  const isAllocated = session.status === 'Completed' && allocationResults.length > 0;

  const isBestBid = session.allocationMethod === 'BestBidPriceWins';

  const allocationMethodLabel =
    session.allocationMethod === 'EqualDistribution' ? 'Allotment' :
    session.allocationMethod === 'BestBidPriceWins'  ? 'Best Bid Price Wins' :
    session.allocationMethod;

  return (
    <div className="p-6 space-y-5">
      {/* Back + header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">Session #{session.id}</h1>
            <StatusBadge status={session.status} size="md" />
            {session.status === 'Open' && (
              <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg px-3 py-1 text-sm font-mono font-semibold">
                <Clock size={14} className="animate-pulse" />
                {formatTime(timeLeft)} remaining
              </div>
            )}
          </div>
        </div>
        <button onClick={fetchSession} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50" title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">{error}</div>
      )}

      {/* Session details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: isBestBid ? 'Baseline Rate' : 'Fixed Rate', value: `SL ${Number(session.fixedRate).toLocaleString()}` },
          { label: 'Total Liquidity', value: fmtUSD(Number(session.totalAmount)) },
          { label: 'Bid Limits', value: `T1: ${fmtUSD(Number(session.maxBidTier1))} / T2: ${fmtUSD(Number(session.maxBidTier2))}` },
          { label: 'Allocation Method', value: allocationMethodLabel },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400 font-medium">{item.label}</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Liquidity bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-semibold text-gray-800">Bids Received vs Total Pool</h2>
          <span className="text-sm font-bold text-gray-700">
            {fmtUSD(totalBids)} / {fmtUSD(Number(session.totalAmount))}
          </span>
        </div>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-bos-green to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">{pct.toFixed(1)}% subscribed — {bids.length} bids received</p>
      </div>

      {/* Bids table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-800">Live Bids</h2>
          {session.status === 'Open' && (
            <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Live
            </span>
          )}
        </div>
        {bids.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No bids yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  {['Dealer Name', 'Tier', 'Bid Amount (USD)',
                    ...(isBestBid ? ['Bid Rate (SL/USD)'] : []),
                    'Submitted At', 'Status'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bids.map(bid => (
                  <tr key={bid.id} className="hover:bg-gray-50">
                    <td className="py-2.5 pr-4 font-medium text-gray-800">{bid.dealer?.name ?? bid.dealerId}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${bid.tier === 'Tier1' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
                        {bid.tier === 'Tier1' ? 'Tier 1' : 'Tier 2'}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 font-semibold">{fmtUSD(Number(bid.bidAmount))}</td>
                    {isBestBid && (
                      <td className="py-2.5 pr-4 font-semibold text-indigo-700">
                        {bid.bidRate != null ? `SL ${Number(bid.bidRate).toLocaleString()}` : '—'}
                      </td>
                    )}
                    <td className="py-2.5 pr-4 text-gray-400 text-xs">{(bid.submittedAt ?? bid.updatedAt).replace('T', ' ').slice(0, 16)}</td>
                    <td className="py-2.5 pr-4"><StatusBadge status={bid.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {(session.status === 'Open') && (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleAllocate}
            disabled={allocating || bids.filter(b => b.status === 'Submitted').length === 0}
            className="flex items-center gap-2 bg-bos-green text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-bos-green/90 disabled:opacity-50"
          >
            {allocating
              ? <><RefreshCw size={16} className="animate-spin" /> Allocating...</>
              : <><Zap size={16} /> Execute Allocation</>}
          </button>
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 border border-red-200 text-red-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-50"
          >
            <XCircle size={16} /> Cancel Session
          </button>
        </div>
      )}

      {allocateError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">{allocateError}</div>
      )}

      {/* Allocation Results */}
      {isAllocated && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={20} className="text-green-600" />
            <h2 className="text-sm font-semibold text-green-800">Allocation Executed Successfully</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm bg-white rounded-lg overflow-hidden">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Dealer', 'Bid Amount', 'Allocated Amount', 'Exchange Rate', 'SL Settlement'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-2.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allocationResults.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium">{r.dealer?.name ?? r.dealerId}</td>
                    <td className="px-4 py-2.5">{fmtUSD(Number(r.bidAmount))}</td>
                    <td className="px-4 py-2.5 font-semibold text-green-700">{fmtUSD(Number(r.allocatedAmount))}</td>
                    <td className="px-4 py-2.5">SL {Number(r.fixedRate).toLocaleString()}</td>
                    <td className="px-4 py-2.5">SL {Number(r.slSettlement).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OMOSessionDetail;
