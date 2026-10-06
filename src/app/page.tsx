'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { ApiConfigModal } from '@/components/ApiConfigModal';
import { InputSection } from '@/components/InputSection';
import { ProcessingState } from '@/components/ProcessingState';
import { ResultSection } from '@/components/ResultSection';
import { EvaluationConfigBanner } from '@/components/EvaluationConfigBanner';
import { AuthScreen } from '@/components/AuthScreen';
import { KPIConfig, KPIItem } from '@/types/kpi';
import { getDeviceFingerprint } from '@/lib/fingerprint';
import {
  Sparkles,
  Zap,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
  Info,
  Loader2,
} from 'lucide-react';

const STORAGE_KEY = 'kpi_assistant_config_v1';
const AUTH_USER_KEY = 'kpi_auth_user_session_v1';
const GAS_URL_KEY = 'kpi_gas_url_v1';

// ====================================================================================
// CẤU HÌNH BẬT / TẮT MÀN HÌNH ĐĂNG NHẬP:
// - false: Bỏ qua đăng nhập, vào thẳng app luôn (Đang tắt theo yêu cầu của bạn)
// - true: Bật lại màn hình đăng nhập bảo vệ (Xem tài liệu AUTH_SYSTEM_BACKUP.md)
// ====================================================================================
const REQUIRE_AUTH = false;

export default function Home() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    deviceId: string;
    fullName?: string;
  } | null>(null);
  const [gasUrl, setGasUrl] = useState<string>('');
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // App configuration & data state
  const [config, setConfig] = useState<KPIConfig>({
    apiKey: '',
    model: 'gemini-3.6-flash',
    maDonVi: 'H29.205.10',
    tenDonVi: 'Trường THCS An Nhơn',
    kyDanhGia: '(Chính thức)KPI-Q4-2026',
  });

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [processingMode, setProcessingMode] = useState<'algorithm' | 'ai'>('algorithm');
  const [processingStep, setProcessingStep] = useState(1);
  const [generatedItems, setGeneratedItems] = useState<KPIItem[]>([]);
  const [modeUsed, setModeUsed] = useState<'algorithm' | 'ai' | 'algorithm_fallback'>('algorithm');
  const [executionTimeMs, setExecutionTimeMs] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const [templateName, setTemplateName] = useState('mau.xlsx');
  const [customTemplateBase64, setCustomTemplateBase64] = useState<string | null>(null);
  const [donViList, setDonViList] = useState<{ code: string; name: string }[]>([
    { code: 'H29.205.10', name: 'Trường THCS An Nhơn' },
  ]);
  const [kyDanhGiaList, setKyDanhGiaList] = useState<{ code: string; name: string }[]>([
    { code: '(Chính thức)KPI-Q4-2026', name: '(Chính thức) Đánh giá Quý IV/2026' },
    { code: '(Chính thức)KPI-Q3-2026', name: '(Chính thức) Đánh giá Quý III/2026' },
    { code: 'VIETTELTAPHUAN01.10', name: 'Viettel tập huấn 01_10' },
  ]);

  // Load saved session, fingerprint & configs on mount
  useEffect(() => {
    async function initAuthAndConfig() {
      // 1. Load Gas URL
      try {
        const savedGas = localStorage.getItem(GAS_URL_KEY);
        if (savedGas) {
          setGasUrl(savedGas);
        } else if (process.env.NEXT_PUBLIC_GAS_URL) {
          setGasUrl(process.env.NEXT_PUBLIC_GAS_URL);
        }
      } catch (e) {
        console.warn('Load GAS URL error:', e);
      }

      // 2. Validate saved session against current Hardware Fingerprint
      try {
        const savedUserJson = localStorage.getItem(AUTH_USER_KEY);
        if (savedUserJson) {
          const parsedUser = JSON.parse(savedUserJson);
          const currentFp = await getDeviceFingerprint();

          // Kiểm tra mã thiết bị hiện tại có khớp với phiên đã lưu không (hoặc phiên đăng nhập bỏ qua mã máy)
          if (parsedUser.deviceId && (parsedUser.deviceId === currentFp || parsedUser.deviceId === 'DEV_SKIP_CHECK')) {
            setCurrentUser(parsedUser);
          } else {
            // Khác thiết bị -> Hủy phiên
            localStorage.removeItem(AUTH_USER_KEY);
            setCurrentUser(null);
          }
        }
      } catch (e) {
        console.warn('Validate session error:', e);
        setCurrentUser(null);
      } finally {
        setIsAuthChecking(false);
      }

      // 3. Load app config
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          const modelToUse = parsed.model && parsed.model !== 'gemini-2.5-flash' ? parsed.model : 'gemini-3.6-flash';
          setConfig((prev) => ({ ...prev, ...parsed, model: modelToUse }));
        }
      } catch (e) {
        console.error('Failed to load config from localStorage', e);
      }

      // 4. Fetch template data
      try {
        const res = await fetch('/api/template-info');
        const data = await res.json();
        if (data.success) {
          if (data.templateName) setTemplateName(data.templateName);
          if (data.donViList && data.donViList.length > 0) setDonViList(data.donViList);
          if (data.kyDanhGiaList && data.kyDanhGiaList.length > 0) setKyDanhGiaList(data.kyDanhGiaList);
        }
      } catch (err) {
        console.error('Failed to load template info:', err);
      }
    }

    initAuthAndConfig();
  }, []);

  const handleLoginSuccess = (user: { username: string; deviceId: string; fullName?: string }) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('Failed to save auth session:', e);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(AUTH_USER_KEY);
    } catch (e) {
      console.warn('Logout clear session error:', e);
    }
  };

  const handleUpdateGasUrl = (url: string) => {
    setGasUrl(url);
    try {
      localStorage.setItem(GAS_URL_KEY, url);
    } catch (e) {
      console.warn('Failed to save Gas URL:', e);
    }
  };

  const handleSaveConfig = (newConfig: KPIConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch (e) {
      console.error('Failed to save config to localStorage', e);
    }
  };

  const updateConfigField = (field: keyof KPIConfig, value: string) => {
    setConfig((prev) => {
      const updated = { ...prev, [field]: value };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save config to localStorage', e);
      }
      return updated;
    });
  };

  // Hàm xử lý chung: nhận chế độ 'algorithm' (không cần AI/API) hoặc 'ai'
  const handleGenerate = async (selectedMode: 'algorithm' | 'ai' = 'algorithm') => {
    setError(null);

    if (!inputText.trim()) {
      setError('Vui lòng tải lên tệp tin Word (.docx), PDF hoặc dán nội dung văn bản trước khi xử lý.');
      return;
    }

    if (selectedMode === 'ai' && !config.apiKey.trim()) {
      setIsConfigOpen(true);
      setError('Bạn chưa thiết lập Google Gemini API Key. Vui lòng nhập khóa API hoặc sử dụng nút "⚡ XỬ LÝ NHANH THUẬT TOÁN" để chạy ngay mà không cần API.');
      return;
    }

    setProcessingMode(selectedMode);
    setIsGenerating(true);
    setProcessingStep(1);

    try {
      if (selectedMode === 'algorithm') {
        await new Promise((r) => setTimeout(r, 150));
        setProcessingStep(2);
      } else {
        await new Promise((r) => setTimeout(r, 600));
        setProcessingStep(2);
      }

      const res = await fetch('/api/generate-kpi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          apiKey: config.apiKey.trim(),
          model: config.model || 'gemini-3.6-flash',
          maDonVi: config.maDonVi || 'H29.205.10',
          kyDanhGia: config.kyDanhGia || '(Chính thức)KPI-Q4-2026',
          mode: selectedMode,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Xử lý dữ liệu thất bại.');
      }

      setProcessingStep(3);
      if (selectedMode === 'algorithm') {
        await new Promise((r) => setTimeout(r, 150));
      } else {
        await new Promise((r) => setTimeout(r, 500));
      }

      setGeneratedItems(data.items || []);
      setModeUsed(data.modeUsed || selectedMode);
      setExecutionTimeMs(data.executionTimeMs);

      setTimeout(() => {
        const el = document.getElementById('results-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth',
          });
        }
      }, 200);
    } catch (err: unknown) {
      console.error('Generation error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setGeneratedItems([]);
    setError(null);
  };

  // Màn hình chờ xác thực ban đầu (chỉ hiện khi bật REQUIRE_AUTH)
  if (REQUIRE_AUTH && isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-50 bg-gradient-to-br from-emerald-50 via-teal-50/40 to-emerald-100/60 flex flex-col items-center justify-center text-slate-800">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium tracking-wide">
          Đang xác thực định danh thiết bị an toàn...
        </p>
      </div>
    );
  }

  // Nếu CHƯA ĐĂNG NHẬP: Hiển thị màn hình đăng nhập bảo vệ (chỉ hiện khi bật REQUIRE_AUTH)
  if (REQUIRE_AUTH && !currentUser) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // ĐÃ ĐĂNG NHẬP: Hiển thị toàn bộ ứng dụng
  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col font-sans">
      {/* Header */}
      <Header
        hasApiKey={Boolean(config.apiKey && config.apiKey.trim().length > 5)}
        onOpenSettings={() => setIsConfigOpen(true)}
        selectedModel={config.model || 'gemini-3.6-flash'}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Banner / Instructions Centered */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs relative overflow-hidden text-center">
          <div className="max-w-3xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-semibold mb-3">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Hệ Thống Khởi Tạo KPI Chuẩn Mẫu Excel Tức Thì</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Tạo Bảng Danh Mục KPI Chuẩn Theo Mẫu Excel
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-2xl">
              Tải lên kế hoạch công tác hoặc phân công nhiệm vụ từ tệp <strong>Word (.docx)</strong> hoặc <strong>PDF</strong>. Hệ thống tự động phân loại vào <strong>6 Trục kết quả trọng tâm</strong>, gắn kết quả đầu ra, tính điểm chuẩn (10đ thường xuyên / 12đ đột xuất) và điền trực tiếp vào file mẫu mà <strong>KHÔNG CẦN NHẬP API KEY</strong>.
            </p>

            {/* Quick badges Centered */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
              <span className="flex items-center space-x-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Mẫu đơn vị: <strong>{config.maDonVi}</strong></span>
              </span>
              <span className="flex items-center space-x-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Kỳ: <strong>{config.kyDanhGia}</strong></span>
              </span>
              <span className="flex items-center space-x-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Bảo toàn cấu trúc & công thức mẫu</span>
              </span>
            </div>
          </div>
        </div>

        {/* Thông báo chế độ xử lý không cần API */}
        <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-emerald-900">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              <strong>Chạy dữ liệu có sẵn & Tệp tải lên (Không cần API Key):</strong> Hệ thống tích hợp sẵn <strong>Thuật toán quy tắc chuyên môn</strong> để tự động bóc tách từ file Word (.docx) hoặc PDF thành 6 Trục và tính điểm trong <strong>0.1 giây</strong> mà không cần kết nối AI bên ngoài.
            </span>
          </div>
          <button
            onClick={() => setIsConfigOpen(true)}
            className="px-3.5 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 font-semibold rounded-xl transition-all border border-emerald-300 shadow-2xs shrink-0"
          >
            {config.apiKey ? 'Cấu hình AI (Đã có Key)' : 'Thêm Gemini Key (Tùy chọn)'}
          </button>
        </div>

        {/* Error notification if any */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-3 text-xs text-rose-800">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-bold">Đã xảy ra lỗi:</strong> {error}
            </div>
          </div>
        )}

        {/* Evaluation Parameters (Mã đơn vị & Kỳ đánh giá) */}
        <section aria-label="Thông số đơn vị và kỳ đánh giá">
          <EvaluationConfigBanner
            maDonVi={config.maDonVi}
            setMaDonVi={(val) => updateConfigField('maDonVi', val)}
            tenDonVi={config.tenDonVi}
            setTenDonVi={(val) => updateConfigField('tenDonVi', val)}
            kyDanhGia={config.kyDanhGia}
            setKyDanhGia={(val) => updateConfigField('kyDanhGia', val)}
            donViList={donViList}
            kyDanhGiaList={kyDanhGiaList}
            templateName={templateName}
            onTemplateUpdated={(info) => {
              setTemplateName(info.templateName);
              setDonViList(info.donViList);
              setKyDanhGiaList(info.kyDanhGiaList);
              if (info.templateBase64) {
                setCustomTemplateBase64(info.templateBase64);
              }
            }}
          />
        </section>

        {/* Input Section */}
        <section aria-label="Khu vực nạp dữ liệu đầu vào">
          <InputSection
            inputText={inputText}
            onTextChange={setInputText}
            disabled={isGenerating}
          />
        </section>

        {/* Action Button Section: 2 lựa chọn rõ ràng */}
        <section className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-xs text-slate-500">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Công việc lặp lại? Hãy dùng <strong>Thuật toán siêu tốc</strong> để hoàn thành trong 1 nhấp chuột.
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-end">
            {/* Nút 1: XỬ LÝ NHANH THUẬT TOÁN (KHÔNG CẦN AI) - Màu xanh ngọc */}
            <button
              type="button"
              onClick={() => handleGenerate('algorithm')}
              disabled={isGenerating || !inputText.trim()}
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-98 disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2.5 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-white shrink-0" />
              <span>⚡ XỬ LÝ NHANH THUẬT TOÁN (TỨC THÌ - KHÔNG CẦN AI)</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            {/* Nút 2: Xử lý bằng Gemini AI - Màu CAM nổi bật, to bằng nút 1 */}
            <button
              type="button"
              onClick={() => handleGenerate('ai')}
              disabled={isGenerating || !inputText.trim()}
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 active:scale-98 disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center space-x-2.5 cursor-pointer"
              title="Sử dụng Gemini AI để phân tích mở rộng (Cần có API Key)"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>✨ XỬ LÝ VỚI GEMINI AI</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </section>

        {/* Processing State Animation */}
        {isGenerating && (
          <ProcessingState
            currentStep={processingStep}
            modelName={config.model}
            isAlgorithmMode={processingMode === 'algorithm'}
          />
        )}

        {/* Result & Data Table Section */}
        {generatedItems.length > 0 && !isGenerating && (
          <section id="results-section" aria-label="Kết quả danh mục KPI">
            <ResultSection
              items={generatedItems}
              onItemsChange={setGeneratedItems}
              onReset={handleReset}
              fileName={`KPI_${config.maDonVi}_${config.kyDanhGia.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`}
              modeUsed={modeUsed}
              executionTimeMs={executionTimeMs}
              customTemplateBase64={customTemplateBase64 || undefined}
            />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="font-bold text-slate-800 text-sm tracking-tight">
              Made by Nguyễn Phi Hùng
            </span>
            <span className="text-slate-300">•</span>
            <a
              href="https://zalo.me/0938750424"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:text-blue-700 font-semibold hover:underline inline-flex items-center space-x-1 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60 transition-colors"
            >
              <span>Zalo: 0938750424</span>
            </a>
          </div>
          <p className="text-[11px] text-slate-400">
            © 2026 KPI Assistant AI. Tương thích 100% với file mẫu <code>mau.xlsx</code>. Hỗ trợ chạy offline thuật toán tức thì không cần AI.
          </p>
        </div>
      </footer>

      {/* API Configuration Modal */}
      <ApiConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onSave={handleSaveConfig}
      />
    </div>
  );
}
