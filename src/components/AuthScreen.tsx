'use client';

import React, { useState, useEffect } from 'react';
import {
  Lock,
  User,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  X,
  SlidersHorizontal,
  Unlock,
} from 'lucide-react';
import { getDeviceFingerprint } from '@/lib/fingerprint';

interface AuthScreenProps {
  onLoginSuccess: (user: { username: string; deviceId: string; fullName?: string }) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [deviceId, setDeviceId] = useState<string>('');
  const [isGettingFp, setIsGettingFp] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedFp, setCopiedFp] = useState(false);

  // Chế độ kiểm tra mã máy (Mặc định: true = Có kiểm tra mã máy)
  const [checkDeviceMode, setCheckDeviceMode] = useState<boolean>(true);

  // Modal quản trị cấu hình đăng nhập
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminPasswordError, setAdminPasswordError] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<boolean>(true);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Đọc cài đặt đã lưu trong localStorage khi tải trang
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('kpi_auth_check_device');
      if (savedMode !== null) {
        setCheckDeviceMode(savedMode === 'true');
        setSelectedMode(savedMode === 'true');
      }
    } catch (err) {
      console.error('Error reading auth config from localStorage:', err);
    }
  }, []);

  // Quét mã thiết bị ngay khi mở trang
  useEffect(() => {
    let isMounted = true;
    async function scanFingerprint() {
      try {
        const id = await getDeviceFingerprint();
        if (isMounted) {
          setDeviceId(id);
          setIsGettingFp(false);
        }
      } catch (err) {
        console.error('Scan fingerprint error:', err);
        if (isMounted) {
          setDeviceId('DEV_OFFLINE_DEVICE');
          setIsGettingFp(false);
        }
      }
    }
    scanFingerprint();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopyFp = () => {
    if (deviceId) {
      navigator.clipboard.writeText(deviceId);
      setCopiedFp(true);
      setTimeout(() => setCopiedFp(false), 2000);
    }
  };

  // Mở modal cấu hình khi nhấp vào nút chìa khóa
  const handleOpenConfigModal = () => {
    setAdminPasswordInput('');
    setAdminPasswordError(null);
    setSelectedMode(checkDeviceMode);
    setSaveSuccessNotice(false);
    setIsConfigModalOpen(true);
  };

  // Đóng modal cấu hình
  const handleCloseConfigModal = () => {
    setIsConfigModalOpen(false);
    setAdminPasswordInput('');
    setAdminPasswordError(null);
    setSaveSuccessNotice(false);
  };

  // Xác thực mật khẩu quản trị "Hung@2601"
  const handleVerifyAdminPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === 'Hung@2601') {
      setIsAdminAuthenticated(true);
      setAdminPasswordError(null);
    } else {
      setAdminPasswordError('Mật khẩu quản trị không chính xác! Vui lòng thử lại.');
    }
  };

  // Lưu cài đặt chế độ kiểm tra mã máy
  const handleSaveConfig = () => {
    setCheckDeviceMode(selectedMode);
    try {
      localStorage.setItem('kpi_auth_check_device', String(selectedMode));
    } catch (err) {
      console.error('Error saving config to localStorage:', err);
    }
    setSaveSuccessNotice(true);
    setTimeout(() => {
      setIsConfigModalOpen(false);
      setSaveSuccessNotice(false);
    }, 1200);
  };

  // Xử lý gửi form đăng nhập
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!username.trim()) {
      setErrorMsg('Vui lòng nhập tài khoản.');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Vui lòng nhập mật khẩu.');
      return;
    }

    // Nếu đang ở chế độ có kiểm tra mã máy mà chưa quét xong mã
    if (checkDeviceMode && !deviceId && isGettingFp) {
      setErrorMsg('Đang nhận diện mã thiết bị. Vui lòng đợi trong giây lát...');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          deviceId: deviceId ? deviceId.trim() : 'DEV_NO_CHECK',
          checkDevice: checkDeviceMode,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Đăng nhập không thành công.');
      }

      setSuccessMsg(data.message || 'Đăng nhập thành công!');
      setTimeout(() => {
        onLoginSuccess(data.user || { username, deviceId });
      }, 500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 bg-gradient-to-br from-emerald-50 via-teal-50/40 to-emerald-100/60 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden text-slate-800 font-sans">
      {/* Background glowing emerald / teal orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-200/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-teal-200/50 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div className="max-w-md w-full bg-white/95 backdrop-blur-xl border border-emerald-100 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/5 relative z-10">
        
        {/* Top Bar: Trạng thái & Nút Chìa Khóa Quản Trị */}
        <div className="flex items-center justify-between mb-4">
          {/* Badge chế độ hiện tại */}
          {checkDeviceMode ? (
            <div className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-[11px] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Chế độ: Có kiểm tra mã máy</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-[11px] font-semibold">
              <Unlock className="w-3.5 h-3.5 text-amber-600" />
              <span>Chế độ: Bỏ qua mã máy</span>
            </div>
          )}

          {/* Nút Chìa Khóa Quản Trị */}
          <button
            type="button"
            onClick={handleOpenConfigModal}
            className="group flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100/80 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs"
            title="Nhấp để cấu hình chế độ đăng nhập (Mật khẩu: Hung@2601)"
          >
            <KeyRound className="w-4 h-4 text-emerald-600 group-hover:rotate-45 transition-transform duration-300" />
            <span className="text-xs font-semibold text-slate-700 group-hover:text-emerald-900">
              Quản trị
            </span>
          </button>
        </div>

        {/* Header Icon & Title */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-600/25 border border-emerald-400/20">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
            Đăng Nhập Hệ Thống KPI
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Xác thực tài khoản & Khóa định danh thiết bị độc quyền
          </p>
        </div>

        {/* Device Fingerprint Badge */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 mb-6 text-xs">
          <div className="flex items-center justify-between text-slate-600 mb-1.5">
            <span className="flex items-center space-x-1.5 font-semibold text-slate-700">
              <Cpu className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mã thiết bị (Browser Fingerprint):</span>
            </span>
            <button
              type="button"
              onClick={handleCopyFp}
              disabled={isGettingFp || !deviceId}
              className="text-emerald-700 hover:text-emerald-900 font-medium transition-colors flex items-center space-x-1 cursor-pointer"
              title="Sao chép mã máy"
            >
              {copiedFp ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-[10px] text-emerald-600">Đã chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span className="text-[10px]">Chép mã</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-xl border border-emerald-200/90 font-mono text-[11px] text-emerald-800 shadow-2xs">
            {isGettingFp ? (
              <span className="flex items-center space-x-1.5 text-slate-500 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />
                <span>Đang nhận diện phần cứng thiết bị...</span>
              </span>
            ) : (
              <span className="truncate font-semibold">{deviceId}</span>
            )}
            {checkDeviceMode ? (
              <span title="Bật khóa thiết bị">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
              </span>
            ) : (
              <span title="Bỏ qua kiểm tra mã máy">
                <Unlock className="w-4 h-4 text-amber-500 shrink-0 ml-2" />
              </span>
            )}
          </div>
          <p className="text-[10px] text-emerald-700/80 mt-1.5 leading-snug">
            {checkDeviceMode
              ? '* Mã máy duy nhất, không thay đổi ngay cả khi xóa lịch sử web hoặc dùng tab ẩn danh.'
              : '* Chế độ hiện tại: Bỏ qua kiểm tra mã máy (Chỉ cần đúng Tài khoản & Mật khẩu).'}
          </p>
        </div>

        {/* Alert Messages */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 mb-5 flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed font-medium">{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 mb-5 flex items-center space-x-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input Tài khoản */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tài khoản (tk)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên tài khoản được cấp..."
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-2xs"
                autoComplete="username"
              />
            </div>
          </div>

          {/* Input Mật khẩu */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Mật khẩu (mk)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                disabled={isLoading}
                className="w-full pl-10 pr-10 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-2xs"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || (checkDeviceMode && isGettingFp && !deviceId)}
            className="w-full mt-2 py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-98 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang kiểm tra thông tin...</span>
              </>
            ) : (
              <>
                <span>ĐĂNG NHẬP VÀO HỆ THỐNG</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-xs text-slate-500">
        <span>KPI Assistant AI • Made by Nguyễn Phi Hùng • Zalo: 0938750424</span>
      </div>

      {/* MODAL CẤU HÌNH ĐĂNG NHẬP (QUẢN TRỊ VIÊN) */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-emerald-100 relative text-slate-800 animate-in fade-in zoom-in-95 duration-200">
            {/* Nút đóng modal */}
            <button
              type="button"
              onClick={handleCloseConfigModal}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* BƯỚC 1: XÁC THỰC MẬT KHẨU QUẢN TRỊ (Hung@2601) */}
            {!isAdminAuthenticated ? (
              <div>
                <div className="text-center mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 shadow-inner">
                    <KeyRound className="w-7 h-7" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Xác Thực Quản Trị Viên
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Nhập mật khẩu quản trị để mở khóa cài đặt chế độ đăng nhập
                  </p>
                </div>

                {adminPasswordError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 mb-4 flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{adminPasswordError}</span>
                  </div>
                )}

                <form onSubmit={handleVerifyAdminPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Mật khẩu Quản trị
                    </label>
                    <div className="relative">
                      <input
                        type={showAdminPassword ? 'text' : 'password'}
                        value={adminPasswordInput}
                        onChange={(e) => setAdminPasswordInput(e.target.value)}
                        placeholder="Nhập mật khẩu quản trị..."
                        autoFocus
                        className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                        tabIndex={-1}
                      >
                        {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCloseConfigModal}
                      className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/25 transition-colors cursor-pointer"
                    >
                      Xác nhận
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* BƯỚC 2: CẤU HÌNH CHẾ ĐỘ ĐĂNG NHẬP */
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Cấu Hình Chế Độ Đăng Nhập
                    </h2>
                    <p className="text-xs text-slate-500">
                      Chọn cách thức kiểm tra khi người dùng đăng nhập
                    </p>
                  </div>
                </div>

                {saveSuccessNotice && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 mb-4 flex items-center space-x-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">Đã lưu cấu hình đăng nhập thành công!</span>
                  </div>
                )}

                <div className="space-y-3 my-4">
                  {/* Mục 1: Có kiểm tra mã máy */}
                  <label
                    onClick={() => setSelectedMode(true)}
                    className={`block p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      selectedMode
                        ? 'bg-emerald-50/80 border-emerald-500 shadow-sm'
                        : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="pt-0.5">
                        <input
                          type="radio"
                          name="checkDeviceConfig"
                          checked={selectedMode === true}
                          onChange={() => setSelectedMode(true)}
                          className="w-4 h-4 text-emerald-600 accent-emerald-600"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-1.5 font-bold text-slate-900 text-sm">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>1. Có kiểm tra mã máy (Khuyên dùng)</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          Tài khoản chỉ được đăng nhập đúng trên thiết bị đã liên kết (Cột C trong Sheet). Thiết bị lạ sẽ bị chặn.
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Mục 2: Không kiểm tra mã máy */}
                  <label
                    onClick={() => setSelectedMode(false)}
                    className={`block p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      !selectedMode
                        ? 'bg-amber-50/80 border-amber-500 shadow-sm'
                        : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="pt-0.5">
                        <input
                          type="radio"
                          name="checkDeviceConfig"
                          checked={selectedMode === false}
                          onChange={() => setSelectedMode(false)}
                          className="w-4 h-4 text-amber-600 accent-amber-600"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-1.5 font-bold text-slate-900 text-sm">
                          <Unlock className="w-4 h-4 text-amber-600" />
                          <span>2. Không kiểm tra mã máy (Bỏ qua DeviceID)</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          Chỉ cần nhập đúng <strong>Tài khoản (tk)</strong> và <strong>Mật khẩu (mk)</strong> là vào được hệ thống, bỏ qua hoàn toàn bước kiểm tra mã máy.
                        </p>
                      </div>
                    </div>
                  </label>
                </div>

                <div className="flex space-x-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCloseConfigModal}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
                  >
                    Lưu Cấu Hình
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
