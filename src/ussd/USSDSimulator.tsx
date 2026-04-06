import React, { useState, useRef, useEffect } from 'react';
import { Phone, RefreshCw, Clock, Wifi, Battery, Signal, AlertCircle } from 'lucide-react';
import { dealers } from '../data/mockData';
import { api } from '../api/client';

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Screen =
  | 'main_menu'
  | 'buy_amount'
  | 'buy_dealers'
  | 'buy_confirm'
  | 'buy_pin'
  | 'buy_success'
  | 'buy_insufficient'
  | 'sell_amount'
  | 'sell_dealers'
  | 'sell_confirm'
  | 'sell_pin'
  | 'sell_success'
  | 'sell_insufficient'
  | 'balance'
  | 'invalid'
  | 'end';

interface SimDealer {
  id: string;
  name: string;
  shortName: string;
  buyRate: number;
  sellRate: number;
}

interface SimTransaction {
  ref: string;
  type: 'BUY' | 'SELL';
  usdAmount: number;
  slsAmount: number;
  rate: number;
  dealerName: string;
  mobileNumber: string;
  timestamp: string;
  status: 'Success';
}

interface Wallet {
  usd: number;
  sls: number;
}

interface HistoryEntry {
  text: string;
  isUser: boolean;
}

// ─── MOCK DEALERS (from mockData) ────────────────────────────────────────────

const simDealers: SimDealer[] = dealers.slice(0, 5).map(d => ({
  id: d.id,
  name: d.name,
  shortName: d.name.length > 16 ? d.name.substring(0, 15) + '…' : d.name,
  buyRate: d.buyRate,
  sellRate: d.sellRate,
}));

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const generateRef = () => `TXN-${Date.now().toString().slice(-8)}`;

const isEndScreen = (s: Screen) =>
  ['buy_success', 'sell_success', 'buy_insufficient', 'sell_insufficient', 'balance', 'end'].includes(s);

// ─── COMPONENT ───────────────────────────────────────────────────────────────

const USSDSimulator: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('main_menu');
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [wallet, setWallet] = useState<Wallet>({ usd: 500, sls: 285000 });
  const [transactions, setTransactions] = useState<SimTransaction[]>([]);
  const [mobileNumber] = useState('063-7712-009');

  // Flow state
  const [txAmount, setTxAmount] = useState(0);
  const [selectedDealer, setSelectedDealer] = useState<SimDealer>(simDealers[0]);
  const [txRate, setTxRate] = useState(0);
  const [txSls, setTxSls] = useState(0);
  const [txType, setTxType] = useState<'BUY' | 'SELL'>('BUY');
  const [lastRef, setLastRef] = useState('');
  const [apiStatus, setApiStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [apiError, setApiError] = useState('');

  const historyEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // ─── POST TRANSACTION TO BACKEND ───────────────────────────────────────────
  const postTransaction = async (
    type: 'BuyUSD' | 'SellUSD',
    amount: number,
    dealer: SimDealer,
    rate: number,
    slsAmount: number,
    pin: string
  ): Promise<boolean> => {
    setApiStatus('loading');
    setApiError('');
    try {
      const telco = mobileNumber.startsWith('063') ? 'Telesom' : 'Somtel';
      const walletType = telco === 'Telesom' ? 'Zaad' : 'eDahab';
      const result = await api.post<{ transaction: { ref: string }; amlTriggered: boolean }>(
        '/ussd/simulate',
        {
          mobileNumber,
          telcoOperator: telco,
          walletType,
          customerWallet: mobileNumber,
          type,
          amountUSD: amount,
          dealerId: dealer.id,
          pin,
        }
      );
      setLastRef(result.transaction.ref);
      setTransactions(prev => [{
        ref: result.transaction.ref,
        type: type === 'BuyUSD' ? 'BUY' : 'SELL',
        usdAmount: amount,
        slsAmount,
        rate,
        dealerName: dealer.name,
        mobileNumber,
        timestamp: new Date().toLocaleTimeString(),
        status: 'Success',
      }, ...prev]);
      setApiStatus('idle');
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Backend unavailable';
      setApiError(msg);
      setApiStatus('error');
      // Fallback to local state so simulator still works
      const ref = `TXN-${Date.now().toString().slice(-8)}`;
      setLastRef(ref);
      setTransactions(prev => [{
        ref, type: type === 'BuyUSD' ? 'BUY' : 'SELL',
        usdAmount: amount, slsAmount, rate,
        dealerName: dealer.name, mobileNumber,
        timestamp: new Date().toLocaleTimeString(),
        status: 'Success',
      }, ...prev]);
      return false;
    }
  };

  // ─── SCREEN CONTENT ────────────────────────────────────────────────────────

  const getScreenContent = (s: Screen): string => {
    switch (s) {
      case 'main_menu':
        return [
          'CON Welcome to BoS FX',
          'Hargeisa National FX Service',
          '─────────────────────',
          '1. Buy USD',
          '2. Sell USD',
          '3. Check Balance',
          '0. Exit',
        ].join('\n');

      case 'buy_amount':
        return [
          'CON Buy USD',
          '─────────────────────',
          'Enter amount in USD:',
          '(e.g. 100)',
          '',
          '0. Back',
        ].join('\n');

      case 'buy_dealers': {
        const lines = simDealers.map((d, i) =>
          `${i + 1}. ${d.shortName.padEnd(17)} ${d.sellRate}`
        );
        return [
          `CON Buy USD — $${txAmount}`,
          'Select Dealer   Rate(SLS/USD)',
          '─────────────────────',
          ...lines,
          '0. Back',
        ].join('\n');
      }

      case 'buy_confirm':
        return [
          'CON Confirm Purchase',
          '─────────────────────',
          `Buy:    $${txAmount} USD`,
          `Rate:   ${txRate} SLS/USD`,
          `Cost:   ${txSls.toLocaleString()} SLS`,
          `Dealer: ${selectedDealer.shortName}`,
          '─────────────────────',
          '1. Confirm',
          '2. Cancel',
        ].join('\n');

      case 'buy_pin':
        return [
          'CON Enter 4-digit PIN',
          '─────────────────────',
          `Buying $${txAmount} USD`,
          `Cost: ${txSls.toLocaleString()} SLS`,
          '',
          'Enter PIN:',
        ].join('\n');

      case 'buy_success':
        return [
          'END Transaction Complete!',
          '─────────────────────',
          `Bought:  $${txAmount} USD`,
          `Debited: ${txSls.toLocaleString()} SLS`,
          `Dealer:  ${selectedDealer.shortName}`,
          `Ref:     ${lastRef}`,
          '─────────────────────',
          `USD Bal: $${wallet.usd.toFixed(2)}`,
          `SLS Bal: ${wallet.sls.toLocaleString()} SLS`,
        ].join('\n');

      case 'buy_insufficient':
        return [
          'END Insufficient Balance',
          '─────────────────────',
          `Required: ${txSls.toLocaleString()} SLS`,
          `Balance:  ${wallet.sls.toLocaleString()} SLS`,
          '',
          'Please top up your SLS',
          'wallet and try again.',
        ].join('\n');

      case 'sell_amount':
        return [
          'CON Sell USD',
          '─────────────────────',
          'Enter amount in USD:',
          '(e.g. 100)',
          '',
          '0. Back',
        ].join('\n');

      case 'sell_dealers': {
        const lines = simDealers.map((d, i) =>
          `${i + 1}. ${d.shortName.padEnd(17)} ${d.buyRate}`
        );
        return [
          `CON Sell USD — $${txAmount}`,
          'Select Dealer   Rate(SLS/USD)',
          '─────────────────────',
          ...lines,
          '0. Back',
        ].join('\n');
      }

      case 'sell_confirm':
        return [
          'CON Confirm Sale',
          '─────────────────────',
          `Sell:   $${txAmount} USD`,
          `Rate:   ${txRate} SLS/USD`,
          `Get:    ${txSls.toLocaleString()} SLS`,
          `Dealer: ${selectedDealer.shortName}`,
          '─────────────────────',
          '1. Confirm',
          '2. Cancel',
        ].join('\n');

      case 'sell_pin':
        return [
          'CON Enter 4-digit PIN',
          '─────────────────────',
          `Selling $${txAmount} USD`,
          `Get: ${txSls.toLocaleString()} SLS`,
          '',
          'Enter PIN:',
        ].join('\n');

      case 'sell_success':
        return [
          'END Transaction Complete!',
          '─────────────────────',
          `Sold:    $${txAmount} USD`,
          `Received:${txSls.toLocaleString()} SLS`,
          `Dealer:  ${selectedDealer.shortName}`,
          `Ref:     ${lastRef}`,
          '─────────────────────',
          `USD Bal: $${wallet.usd.toFixed(2)}`,
          `SLS Bal: ${wallet.sls.toLocaleString()} SLS`,
        ].join('\n');

      case 'sell_insufficient':
        return [
          'END Insufficient Balance',
          '─────────────────────',
          `Required: $${txAmount} USD`,
          `Balance:  $${wallet.usd.toFixed(2)} USD`,
          '',
          'Please top up your USD',
          'wallet and try again.',
        ].join('\n');

      case 'balance':
        return [
          'END BoS FX Balance',
          '─────────────────────',
          `Mobile: ${mobileNumber}`,
          '',
          `USD Wallet: $${wallet.usd.toFixed(2)}`,
          `SLS Wallet: ${wallet.sls.toLocaleString()} SLS`,
          '─────────────────────',
          'Thank you for using BoS FX',
        ].join('\n');

      case 'invalid':
        return [
          'CON Invalid input.',
          'Please try again.',
          '',
          '0. Back to Main Menu',
        ].join('\n');

      case 'end':
        return [
          'END Thank you for using',
          'BoS FX National Service.',
          '',
          'Have a great day!',
        ].join('\n');

      default:
        return '';
    }
  };

  // ─── INPUT HANDLER ─────────────────────────────────────────────────────────

  const handleSend = () => {
    const val = input.trim();
    if (!val) return;

    const currentContent = getScreenContent(screen);
    setHistory(prev => [
      ...prev,
      { text: currentContent, isUser: false },
      { text: val, isUser: true },
    ]);
    setInput('');

    let next: Screen = 'invalid';

    switch (screen) {
      case 'main_menu':
        if (val === '1') next = 'buy_amount';
        else if (val === '2') next = 'sell_amount';
        else if (val === '3') next = 'balance';
        else if (val === '0') next = 'end';
        else next = 'invalid';
        break;

      case 'buy_amount': {
        const amt = parseFloat(val);
        if (val === '0') { next = 'main_menu'; break; }
        if (!isNaN(amt) && amt > 0) {
          setTxAmount(amt);
          setTxType('BUY');
          next = 'buy_dealers';
        } else next = 'buy_amount';
        break;
      }

      case 'buy_dealers': {
        if (val === '0') { next = 'buy_amount'; break; }
        const idx = parseInt(val) - 1;
        if (idx >= 0 && idx < simDealers.length) {
          const d = simDealers[idx];
          setSelectedDealer(d);
          setTxRate(d.sellRate);
          setTxSls(Math.round(txAmount * d.sellRate));
          next = 'buy_confirm';
        } else next = 'buy_dealers';
        break;
      }

      case 'buy_confirm':
        if (val === '1') next = 'buy_pin';
        else if (val === '2') next = 'main_menu';
        else next = 'buy_confirm';
        break;

      case 'buy_pin': {
        if (val.length === 4 && /^\d{4}$/.test(val)) {
          const cost = Math.round(txAmount * txRate);
          if (wallet.sls >= cost) {
            setWallet(prev => ({ usd: prev.usd + txAmount, sls: prev.sls - cost }));
            postTransaction('BuyUSD', txAmount, selectedDealer, txRate, cost, val);
            next = 'buy_success';
          } else {
            next = 'buy_insufficient';
          }
        } else next = 'buy_pin';
        break;
      }

      case 'sell_amount': {
        const amt = parseFloat(val);
        if (val === '0') { next = 'main_menu'; break; }
        if (!isNaN(amt) && amt > 0) {
          setTxAmount(amt);
          setTxType('SELL');
          next = 'sell_dealers';
        } else next = 'sell_amount';
        break;
      }

      case 'sell_dealers': {
        if (val === '0') { next = 'sell_amount'; break; }
        const idx = parseInt(val) - 1;
        if (idx >= 0 && idx < simDealers.length) {
          const d = simDealers[idx];
          setSelectedDealer(d);
          setTxRate(d.buyRate);
          setTxSls(Math.round(txAmount * d.buyRate));
          next = 'sell_confirm';
        } else next = 'sell_dealers';
        break;
      }

      case 'sell_confirm':
        if (val === '1') next = 'sell_pin';
        else if (val === '2') next = 'main_menu';
        else next = 'sell_confirm';
        break;

      case 'sell_pin': {
        if (val.length === 4 && /^\d{4}$/.test(val)) {
          if (wallet.usd >= txAmount) {
            const received = Math.round(txAmount * txRate);
            setWallet(prev => ({ usd: prev.usd - txAmount, sls: prev.sls + received }));
            postTransaction('SellUSD', txAmount, selectedDealer, txRate, received, val);
            next = 'sell_success';
          } else {
            next = 'sell_insufficient';
          }
        } else next = 'sell_pin';
        break;
      }

      case 'invalid':
        if (val === '0') next = 'main_menu';
        else next = 'invalid';
        break;

      default:
        next = 'main_menu';
    }

    setScreen(next);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleReset = () => {
    setScreen('main_menu');
    setInput('');
    setHistory([]);
    setTxAmount(0);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  const ended = isEndScreen(screen);
  const currentContent = getScreenContent(screen);
  const displayContent = currentContent.replace(/^(CON|END) /, '');

  // ─── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Page Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Phone size={18} className="text-white" />
              </div>
              <h1 className="text-white text-2xl font-bold tracking-tight">BoS FX USSD Simulator</h1>
              <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full font-medium">
                DEV TOOL
              </span>
            </div>
            <p className="text-gray-500 text-sm ml-12">
              Simulate USSD FX transactions · Backend integration testing · <span className="font-mono text-gray-400">*123#</span>
            </p>
          </div>
          <div className="text-right text-xs text-gray-600">
            <p>Mobile: <span className="text-gray-400 font-mono">{mobileNumber}</span></p>
            <p className="mt-0.5">Telco: <span className="text-blue-400">Telesom / Zaad</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Phone Mockup ── */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-[2.5rem] p-4 border border-gray-700 shadow-2xl mx-auto max-w-xs">

              {/* Status bar */}
              <div className="flex items-center justify-between px-2 mb-3">
                <span className="text-gray-400 text-xs font-medium">9:41</span>
                <div className="flex items-center gap-1.5">
                  <Signal size={12} className="text-gray-400" />
                  <Wifi size={12} className="text-gray-400" />
                  <Battery size={12} className="text-gray-400" />
                </div>
              </div>

              {/* Screen */}
              <div className="bg-gray-950 rounded-2xl overflow-hidden border border-gray-700 mb-4">

                {/* Dialog title bar */}
                <div className="bg-gray-900 px-4 py-2.5 flex items-center justify-between border-b border-gray-700">
                  <span className="text-gray-300 text-xs font-medium">*123# · BoS FX</span>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500/60" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
                    <div className="w-2 h-2 rounded-full bg-green-500/60" />
                  </div>
                </div>

                {/* USSD Content */}
                <div className="p-4 min-h-52">
                  <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap leading-relaxed">
                    {displayContent}
                  </pre>
                </div>

                {/* Input / End zone */}
                <div className="px-4 pb-4">
                  {!ended ? (
                    <div className="space-y-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-gray-900 text-white text-sm px-3 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-green-500 font-mono placeholder-gray-600 transition-colors"
                        placeholder="Type response..."
                        autoFocus
                        maxLength={20}
                      />
                      <button
                        onClick={handleSend}
                        className="w-full bg-green-600 hover:bg-green-500 active:bg-green-700 text-white text-sm py-2.5 rounded-xl font-semibold transition-colors shadow-lg"
                      >
                        Send
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleReset}
                      className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm py-2.5 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg"
                    >
                      <RefreshCw size={14} />
                      New Session
                    </button>
                  )}
                </div>
              </div>

              {/* Wallet Card */}
              <div className="bg-gradient-to-br from-blue-900/40 to-gray-800/60 rounded-2xl p-3 border border-blue-800/30">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-[8px] font-bold">$</span>
                  </div>
                  <span className="text-gray-400 text-xs font-medium tracking-wide">SIMULATED WALLET</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-900/60 rounded-xl p-2.5 text-center">
                    <p className="text-green-400 text-base font-bold">${wallet.usd.toFixed(2)}</p>
                    <p className="text-gray-500 text-xs mt-0.5">USD</p>
                  </div>
                  <div className="bg-gray-900/60 rounded-xl p-2.5 text-center">
                    <p className="text-blue-400 text-base font-bold">{wallet.sls.toLocaleString()}</p>
                    <p className="text-gray-500 text-xs mt-0.5">SLS</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Flow Guide */}
            <div className="mt-4 bg-gray-900 rounded-2xl border border-gray-800 p-4 max-w-xs mx-auto">
              <h3 className="text-gray-300 text-xs font-semibold mb-3 uppercase tracking-wide">Quick Guide</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-green-400 font-semibold mb-1.5">Buy USD</p>
                  <div className="text-gray-500 space-y-0.5 font-mono">
                    <p>→ 1 (Buy USD)</p>
                    <p>→ amount (e.g. 100)</p>
                    <p>→ dealer (1–5)</p>
                    <p>→ 1 (confirm)</p>
                    <p>→ PIN (4 digits)</p>
                    <p className="text-green-500">→ ✓ Done</p>
                  </div>
                </div>
                <div>
                  <p className="text-orange-400 font-semibold mb-1.5">Sell USD</p>
                  <div className="text-gray-500 space-y-0.5 font-mono">
                    <p>→ 2 (Sell USD)</p>
                    <p>→ amount (e.g. 100)</p>
                    <p>→ dealer (1–5)</p>
                    <p>→ 1 (confirm)</p>
                    <p>→ PIN (4 digits)</p>
                    <p className="text-green-500">→ ✓ Done</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Panel ── */}
          <div className="lg:col-span-3 flex flex-col gap-4">

            {/* Session Dialog History */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 flex flex-col">
              <div className="px-5 py-3.5 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-white text-sm font-semibold">Session Dialog</h2>
                <button
                  onClick={handleReset}
                  className="text-gray-500 hover:text-white transition-colors flex items-center gap-1.5 text-xs"
                >
                  <RefreshCw size={12} />
                  Reset
                </button>
              </div>
              <div className="p-4 space-y-3 h-72 overflow-y-auto font-mono text-xs">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Phone size={24} className="text-gray-700 mb-2" />
                    <p className="text-gray-600">Dial <span className="text-gray-500 font-mono">*123#</span> and start a session</p>
                    <p className="text-gray-700 text-xs mt-1">Type a response in the phone and press Send</p>
                  </div>
                ) : (
                  history.map((h, i) => (
                    <div key={i} className={`flex ${h.isUser ? 'justify-end' : 'justify-start'}`}>
                      {!h.isUser && (
                        <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center mr-2 mt-0.5 shrink-0">
                          <span className="text-white text-[8px] font-bold">B</span>
                        </div>
                      )}
                      <div className={`max-w-56 px-3 py-2 rounded-xl whitespace-pre-wrap text-xs ${
                        h.isUser
                          ? 'bg-green-600/20 text-green-300 border border-green-700/40 rounded-br-sm'
                          : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-bl-sm'
                      }`}>
                        {h.isUser ? `> ${h.text}` : h.text.replace(/^(CON|END) /, '')}
                      </div>
                    </div>
                  ))
                )}
                <div ref={historyEndRef} />
              </div>
            </div>

            {/* Transaction Log */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 flex-1">
              <div className="px-5 py-3.5 border-b border-gray-800 flex items-center gap-2">
                <Clock size={14} className="text-gray-500" />
                <h2 className="text-white text-sm font-semibold">Transaction Log</h2>
                <div className="ml-auto flex items-center gap-2">
                  {apiStatus === 'loading' && <span className="text-xs text-yellow-400 animate-pulse">Saving...</span>}
                  {apiStatus === 'error' && (
                    <span className="flex items-center gap-1 text-xs text-red-400" title={apiError}>
                      <AlertCircle size={11} /> Offline mode
                    </span>
                  )}
                  {apiStatus === 'idle' && transactions.length > 0 && (
                    <span className="text-xs text-green-400">✓ Synced</span>
                  )}
                  <span className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded-full border border-gray-700">
                    {transactions.length} tx
                  </span>
                </div>
              </div>

              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Clock size={24} className="text-gray-700 mb-2" />
                  <p className="text-gray-600 text-sm">No transactions yet</p>
                  <p className="text-gray-700 text-xs mt-1">Completed transactions will appear here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left text-gray-500 px-4 py-2.5 font-medium">Ref</th>
                        <th className="text-left text-gray-500 px-3 py-2.5 font-medium">Type</th>
                        <th className="text-right text-gray-500 px-3 py-2.5 font-medium">USD</th>
                        <th className="text-right text-gray-500 px-3 py-2.5 font-medium">Rate</th>
                        <th className="text-right text-gray-500 px-3 py-2.5 font-medium">SLS</th>
                        <th className="text-left text-gray-500 px-3 py-2.5 font-medium">Dealer</th>
                        <th className="text-left text-gray-500 px-3 py-2.5 font-medium">Mobile</th>
                        <th className="text-left text-gray-500 px-3 py-2.5 font-medium">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map(tx => (
                        <tr key={tx.ref} className="border-b border-gray-800/50 hover:bg-gray-800/40 transition-colors">
                          <td className="px-4 py-2.5 text-gray-500 font-mono">{tx.ref}</td>
                          <td className="px-3 py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              tx.type === 'BUY'
                                ? 'bg-green-500/15 text-green-400'
                                : 'bg-orange-500/15 text-orange-400'
                            }`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right text-white font-medium">${tx.usdAmount}</td>
                          <td className="px-3 py-2.5 text-right text-gray-400">{tx.rate}</td>
                          <td className="px-3 py-2.5 text-right text-blue-400 font-medium">{tx.slsAmount.toLocaleString()}</td>
                          <td className="px-3 py-2.5 text-gray-300">{tx.dealerName.split(' ').slice(0, 2).join(' ')}</td>
                          <td className="px-3 py-2.5 text-gray-500 font-mono">{tx.mobileNumber}</td>
                          <td className="px-3 py-2.5 text-gray-600">{tx.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Dealer Rate Reference */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
              <h3 className="text-gray-300 text-xs font-semibold uppercase tracking-wide mb-3">Live Dealer Rates (SLS/USD)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left text-gray-500 pb-2 font-medium">Dealer</th>
                      <th className="text-right text-gray-500 pb-2 font-medium">Buy Rate</th>
                      <th className="text-right text-gray-500 pb-2 font-medium">Sell Rate</th>
                      <th className="text-right text-gray-500 pb-2 font-medium">Spread</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simDealers.map((d, i) => (
                      <tr key={d.id} className="border-b border-gray-800/50">
                        <td className="py-2 text-gray-300">{i + 1}. {d.name}</td>
                        <td className="py-2 text-right text-orange-400 font-mono">{d.buyRate}</td>
                        <td className="py-2 text-right text-green-400 font-mono">{d.sellRate}</td>
                        <td className="py-2 text-right text-gray-500 font-mono">{d.sellRate - d.buyRate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default USSDSimulator;
