'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  Eye,
  EyeOff,
  Cpu,
  ExternalLink,
  Check,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { KPIConfig, AVAILABLE_MODELS } from '@/types/kpi';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: KPIConfig;
  onSave: (config: KPIConfig) => void;
}

interface FetchedModel {
  name: string;
  displayName: string;
  description?: string;
}

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
}) => {
  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [model, setModel] = useState(config.model || 'gemini-3.6-flash');
  const [showKey, setShowKey] = useState(false);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [fetchingModels, setFetchingModels] = useState(false);
  const [fetchedModels, setFetchedModels] = useState<FetchedModel[]>([]);

  useEffect(() => {
    setApiKey(config.apiKey || '');
    setModel(config.model || 'gemini-3.6-flash');
    setTestResult(null);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleFetchLiveModels = async () => {
    if (!apiKey.trim()) {
      setTestResult({
        success: false,
        message: 'Vui lòng nhập API Key để lấy danh sách mô hình từ tài khoản của bạn.',
      });
      return;
    }

    setFetchingModels(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/list-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.models)) {
        setFetchedModels(data.models);
        setTestResult({
          success: true,
          message: `Đã kết nối Google API thành công! Tìm thấy ${data.models.length} mô hình được cấp phép cho khóa API của bạn.`,
        });
      } else {
        throw new Error(data.error || 'Không thể lấy danh sách mô hình từ Google.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestResult({
        success: false,
        message: `Lỗi truy vấn mô hình: ${msg}`,
      });
    } finally {
      setFetchingModels(false);
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: 'Vui lòng nhập API Key trước khi kiểm tra.' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/generate-kpi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          model: model,
          text: 'Soạn giáo án và giảng dạy môn Khoa học tự nhiên tuần 10. Hạn: 20/12/2026.',
          maDonVi: config.maDonVi || 'H29.205.10',
          kyDanhGia: config.kyDanhGia || '(Chính thức)KPI-Q4-2026',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: `Kết nối thành công! AI đã phản hồi chuẩn xác (qua mô hình ${data.executedModel || model}).`,
        });
      } else {
        let errDesc = data.error || 'Khóa API không hợp lệ hoặc model không phản hồi.';
        if (errDesc.includes('503') || errDesc.includes('high demand')) {
          errDesc = 'Google phản hồi lỗi tải cao (503 Service Unavailable: High demand). Hệ thống đã tự động thử lại 3 lần. Bạn có thể bấm thử lại lần nữa hoặc chuyển sang mô hình khác.';
        }
        setTestResult({
          success: false,
          message: errDesc,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestResult({
        success: false,
        message: `Lỗi kết nối máy chủ: ${msg}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSave({
      ...config,
      apiKey: apiKey.trim(),
      model,
    });
    onClose();
  };

  // Combine default models with any fetched live models
  const combinedModels = [...AVAILABLE_MODELS];
  fetchedModels.forEach((fm) => {
    if (!combinedModels.some((m) => m.id === fm.name)) {
      combinedModels.push({
        id: fm.name,
        name: `${fm.displayName || fm.name} (Tài khoản của bạn)`,
        desc: fm.description || 'Mô hình từ tài khoản Google của bạn',
      });
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Cấu hình kết nối Google Gemini</h2>
              <p className="text-xs text-slate-500">Khóa API được lưu cục bộ an toàn trên trình duyệt của bạn</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Gemini API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-slate-700 flex items-center space-x-1.5">
                <span>Google Gemini API Key</span>
                <span className="text-rose-500">*</span>
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center space-x-1"
              >
                <span>Lấy khóa miễn phí</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Dán AIzaSy... vào đây"
                className="w-full px-3.5 py-2.5 pr-10 text-sm font-mono rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15 outline-hidden transition-all text-slate-800 placeholder-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-400 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Chỉ lưu trong LocalStorage thiết bị này, không gửi về bất kỳ máy chủ bên thứ ba nào.</span>
            </p>
          </div>

          {/* Model Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-slate-700 flex items-center space-x-1.5">
                <Cpu className="w-4 h-4 text-slate-500" />
                <span>Phiên bản Mô hình AI (Gemini Model)</span>
              </label>
              {apiKey.trim() && (
                <button
                  type="button"
                  onClick={handleFetchLiveModels}
                  disabled={fetchingModels}
                  className="text-xs text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center space-x-1 disabled:opacity-50"
                  title="Tra cứu danh sách mô hình thực tế được cấp phép trên API Key này"
                >
                  <RefreshCw className={`w-3 h-3 ${fetchingModels ? 'animate-spin' : ''}`} />
                  <span>{fetchingModels ? 'Đang tra cứu...' : 'Tra cứu Model từ Key'}</span>
                </button>
              )}
            </div>

            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15 outline-hidden bg-white text-slate-800 font-medium"
            >
              {combinedModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-500">
              {combinedModels.find((m) => m.id === model)?.desc ||
                'Mô hình xử lý ngôn ngữ thế hệ mới của Google với tính năng tự động thử lại khi quá tải.'}
            </p>
          </div>

          {/* Test Status feedback */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start space-x-2 animate-in fade-in ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {testResult.success ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="flex-1 leading-relaxed">{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || !apiKey.trim()}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 disabled:opacity-50 border border-slate-300 rounded-xl transition-all inline-flex items-center space-x-1.5 shadow-2xs cursor-pointer"
          >
            {testing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Đang kiểm tra & tự động thử lại...</span>
              </>
            ) : (
              <span>Kiểm tra kết nối</span>
            )}
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              Lưu cấu hình
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
