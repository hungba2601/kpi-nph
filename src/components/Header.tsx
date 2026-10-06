'use client';

import React from 'react';
import { Settings, Sparkles, CheckCircle2, AlertCircle, LogOut, UserCheck } from 'lucide-react';

interface HeaderProps {
  hasApiKey: boolean;
  onOpenSettings: () => void;
  selectedModel: string;
  currentUser?: { username: string; deviceId: string; fullName?: string } | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  hasApiKey,
  onOpenSettings,
  selectedModel,
  currentUser,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand / Logo */}
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 leading-none">
              KPI Assistant AI
            </span>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5">
              by Nguyễn Phi Hùng
            </span>
          </div>
        </div>

        {/* Center: App Title Centered (Clean, no clutter) */}
        <div className="text-center flex flex-col items-center justify-center">
          <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
            TRỢ LÝ KHỞI TẠO KPI CHUẨN MẪU EXCEL
          </h1>
          <p className="text-[11px] text-slate-500 hidden sm:block">
            Tự động trích xuất kế hoạch & Phân loại 6 Trục kết quả trọng tâm
          </p>
        </div>

        {/* Right: Actions (User badge + Logout + Status + Settings) */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {/* User info & Logout if logged in */}
          {currentUser && (
            <div className="flex items-center space-x-1.5 bg-slate-100/90 px-2.5 py-1 rounded-xl border border-slate-200 text-xs">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-semibold text-slate-700 max-w-[100px] truncate" title={currentUser.username}>
                {currentUser.username}
              </span>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="ml-1 text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                  title="Đăng xuất khỏi thiết bị này"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* API Status Badge */}
          <button
            onClick={onOpenSettings}
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl border transition-all ${
              hasApiKey
                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
            }`}
          >
            {hasApiKey ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-semibold hidden xl:inline">
                  {selectedModel.replace('gemini-', '')}
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Chưa có Key</span>
              </>
            )}
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-300 hover:border-slate-400 shadow-2xs transition-all focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 active:scale-95"
            aria-label="Cấu hình API"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Cấu hình</span>
          </button>
        </div>
      </div>
    </header>
  );
};
