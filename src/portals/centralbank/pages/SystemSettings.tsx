import React, { useState, useEffect, useCallback } from 'react';
import { Save, CheckCircle, Loader } from 'lucide-react';
import { api } from '../../../api/client';

interface SystemSettingRow {
  key: string;
  value: string;
  label: string;
  category: string;
}

const SystemSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    amlThreshold: 50000,
    velocityLimit: 5,
    structuringCount: 5,
    sessionTimeout: 30,
    smsEnabled: true,
    ussdEnabled: true,
    maintenanceMode: false,
    twoFactorRequired: true,
    auditRetentionDays: 365,
  });

  const fetchSettings = useCallback(async () => {
    try {
      const rows = await api.get<SystemSettingRow[]>('/settings');
      const map = Object.fromEntries(rows.map((s: SystemSettingRow) => [s.key, s.value]));
      setSettings(prev => ({
        ...prev,
        amlThreshold:    map['aml_threshold']    ? Number(map['aml_threshold'])    : prev.amlThreshold,
        velocityLimit:   map['velocity_limit']   ? Number(map['velocity_limit'])   : prev.velocityLimit,
        structuringCount: map['structuring_count'] ? Number(map['structuring_count']) : prev.structuringCount,
        sessionTimeout:  map['session_timeout']  ? Number(map['session_timeout'])  : prev.sessionTimeout,
      }));
    } catch (err) {
      setError('Failed to load settings from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.put('/settings', [
        { key: 'aml_threshold',    value: String(settings.amlThreshold) },
        { key: 'velocity_limit',   value: String(settings.velocityLimit) },
        { key: 'structuring_count', value: String(settings.structuringCount) },
        { key: 'session_timeout',  value: String(settings.sessionTimeout) },
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader size={20} className="animate-spin text-bos-green mr-2" />
        <span className="text-gray-500 text-sm">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Platform-wide configuration and controls</p>
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AML Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">AML Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">AML Alert Threshold (USD)</label>
              <input type="number" value={settings.amlThreshold}
                onChange={e => setSettings(p => ({ ...p, amlThreshold: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bos-green/30" />
              <p className="text-xs text-gray-400 mt-1">Transactions above this amount trigger automatic AML review</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Velocity Limit (transactions/hour)</label>
              <input type="number" value={settings.velocityLimit}
                onChange={e => setSettings(p => ({ ...p, velocityLimit: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bos-green/30" />
              <p className="text-xs text-gray-400 mt-1">Number of transactions from same mobile in 60 min before VelocityCheck alert</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Structuring Pattern Count</label>
              <input type="number" value={settings.structuringCount}
                onChange={e => setSettings(p => ({ ...p, structuringCount: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bos-green/30" />
              <p className="text-xs text-gray-400 mt-1">Number of $8K–$10K transactions in 24h before StructuringPattern alert</p>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Security Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (minutes)</label>
              <input type="number" value={settings.sessionTimeout}
                onChange={e => setSettings(p => ({ ...p, sessionTimeout: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bos-green/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Audit Log Retention (days)</label>
              <input type="number" value={settings.auditRetentionDays}
                onChange={e => setSettings(p => ({ ...p, auditRetentionDays: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bos-green/30" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={settings.twoFactorRequired}
                onChange={e => setSettings(p => ({ ...p, twoFactorRequired: e.target.checked }))}
                className="accent-bos-green w-4 h-4" />
              <span className="text-sm text-gray-700">Require 2FA for all portal users</span>
            </label>
          </div>
        </div>

        {/* Channel Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Channel Controls</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-gray-700">SMS Notifications (OMO alerts)</span>
              <div className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${settings.smsEnabled ? 'bg-bos-green' : 'bg-gray-300'}`}
                onClick={() => setSettings(p => ({ ...p, smsEnabled: !p.smsEnabled }))}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.smsEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-gray-700">USSD Channel Active</span>
              <div className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${settings.ussdEnabled ? 'bg-bos-green' : 'bg-gray-300'}`}
                onClick={() => setSettings(p => ({ ...p, ussdEnabled: !p.ussdEnabled }))}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.ussdEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </label>
            <div className="border-t border-gray-100 pt-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm font-medium text-red-600">Maintenance Mode</span>
                  <p className="text-xs text-gray-400">Disables all dealer transactions</p>
                </div>
                <div className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-300'}`}
                  onClick={() => setSettings(p => ({ ...p, maintenanceMode: !p.maintenanceMode }))}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.maintenanceMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">System Information</h2>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Platform Version', value: 'BoS FX Platform v2.4.1' },
              { label: 'Environment', value: 'Production' },
              { label: 'Last Backup', value: '2024-03-15 03:00:00' },
              { label: 'API Status', value: 'All Systems Operational', valueClass: 'text-green-600 font-medium' },
              { label: 'USSD Gateway', value: 'Connected — hSenid Mobile', valueClass: 'text-green-600 font-medium' },
              { label: 'Database Status', value: 'Healthy', valueClass: 'text-green-600 font-medium' },
            ].map(item => (
              <div key={item.label} className="flex justify-between">
                <span className="text-gray-500">{item.label}</span>
                <span className={`font-medium ${item.valueClass || 'text-gray-800'}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 items-center">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-bos-green text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-bos-green/90 disabled:opacity-60"
        >
          {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
        {saved && (
          <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
            <CheckCircle size={16} /> Settings saved successfully.
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemSettings;
