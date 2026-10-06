'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles, CheckCircle2, Cpu, Zap } from 'lucide-react';

interface ProcessingStateProps {
  currentStep: number; // 1, 2, 3
  modelName: string;
  isAlgorithmMode?: boolean;
}

export const ProcessingState: React.FC<ProcessingStateProps> = ({
  currentStep,
  modelName,
  isAlgorithmMode = false,
}) => {
  const [progress, setProgress] = useState(isAlgorithmMode ? 65 : 15);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isAlgorithmMode) {
      setProgress(100);
      return;
    }

    if (currentStep === 1) {
      setProgress(25);
    } else if (currentStep === 2) {
      setProgress((prev) => Math.max(prev, 35));
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 92) return 92;
          const step = prev < 60 ? 3 : prev < 80 ? 2 : 1;
          return prev + step;
        });
      }, 350);
    } else if (currentStep >= 3) {
      setProgress(100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentStep, isAlgorithmMode]);

  const steps = isAlgorithmMode
    ? [
        {
          num: 1,
          title: 'Đọc & Chuẩn hóa văn bản',
          desc: 'Tách dòng, nhận diện đánh số và làm sạch tiêu đề nhiệm vụ',
        },
        {
          num: 2,
          title: 'Thuật toán ánh xạ 6 Trục & Điểm chuẩn',
          desc: 'Phân loại từ khóa theo quy chế, gán kết quả đầu ra & hệ số độ khó',
        },
        {
          num: 3,
          title: 'Điền vào khuôn mẫu mau.xlsx',
          desc: 'Hoàn thiện 14 cột dữ liệu sẵn sàng xuất file Excel',
        },
      ]
    : [
        {
          num: 1,
          title: 'Chuẩn bị văn bản & Tham số',
          desc: 'Bóc tách văn bản thô, làm sạch câu từ và kiểm tra kết nối API',
        },
        {
          num: 2,
          title: `Gemini AI (${modelName}) phân tích nghiệp vụ`,
          desc: 'Phân loại công việc vào 6 Trục kết quả trọng tâm, gán kết quả đầu ra & hệ số độ khó',
        },
        {
          num: 3,
          title: 'Định dạng & Ánh xạ mẫu Excel',
          desc: 'Tính điểm quy đổi, hoàn thiện cấu trúc dữ liệu theo mẫu mau.xlsx',
        },
      ];

  const getStatusText = () => {
    if (isAlgorithmMode) {
      return '⚡ Đang thực thi thuật toán phân loại 6 trục và kết xuất bảng dữ liệu...';
    }
    if (progress < 30) return 'Đang khởi tạo ngữ cảnh & chuẩn bị nội dung...';
    if (progress < 60) return `Đang gửi yêu cầu tới mô hình ${modelName}...`;
    if (progress < 85) return 'Đang bóc tách danh mục công việc & phân bổ vào 6 Trục kết quả...';
    if (progress < 98) return 'Đang chuẩn hóa điểm chuẩn (10đ / 12đ) & tính điểm quy đổi...';
    return 'Hoàn tất! Đang kết xuất bảng danh mục KPI...';
  };

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-xl p-6 sm:p-8 my-6 text-center animate-in fade-in duration-300 relative overflow-hidden">
      {/* Background soft glow */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none" />

      {/* Center Icon */}
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 relative border shadow-inner ${
        isAlgorithmMode
          ? 'bg-gradient-to-tr from-emerald-50 to-teal-50 text-emerald-600 border-emerald-100'
          : 'bg-gradient-to-tr from-blue-50 to-indigo-50 text-blue-600 border-blue-100'
      }`}>
        {isAlgorithmMode ? (
          <Zap className="w-8 h-8 animate-pulse text-emerald-600" />
        ) : (
          <Sparkles className="w-8 h-8 animate-pulse text-blue-600" />
        )}
        <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full animate-ping opacity-75 ${
          isAlgorithmMode ? 'bg-emerald-600' : 'bg-blue-600'
        }`} />
      </div>

      {/* Main Title */}
      <h3 className="text-lg font-bold text-slate-800">
        {isAlgorithmMode
          ? '⚡ Đang bóc tách KPI siêu tốc bằng Thuật toán chuẩn hóa...'
          : 'Đang phân tích và khởi tạo danh mục KPI...'}
      </h3>
      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
        {isAlgorithmMode
          ? 'Thuật toán quy tắc đang tự động phân loại nhiệm vụ vào 6 trục kết quả, gắn kết quả đầu ra và tính điểm trong chớp mắt.'
          : 'Trí tuệ nhân tạo Gemini đang bóc tách nhiệm vụ và phân loại theo 6 trục kết quả trọng tâm. Quá trình này thường mất 3 - 8 giây.'}
      </p>

      {/* Progress Bar & Percentage (%) Section */}
      <div className="my-6 max-w-xl mx-auto bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700">
            <Cpu className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            <span>Tiến trình xử lý:</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className={`text-xl font-extrabold tracking-tight font-mono ${
              isAlgorithmMode ? 'text-emerald-600' : 'text-blue-600'
            }`}>
              {progress}%
            </span>
          </div>
        </div>

        {/* Progress bar track */}
        <div className="w-full h-3 bg-slate-200/80 rounded-full overflow-hidden p-0.5 shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-300 ease-out relative shadow-sm ${
              isAlgorithmMode
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/25 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Real-time status text */}
        <p className="text-[11px] text-slate-500 mt-2 font-medium italic text-left truncate">
          {getStatusText()}
        </p>
      </div>

      {/* Steps List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-4xl mx-auto">
        {steps.map((s) => {
          const isDone = currentStep > s.num || (currentStep === 3 && progress === 100);
          const isActive = currentStep === s.num && !isDone;

          return (
            <div
              key={s.num}
              className={`p-4 rounded-xl border transition-all ${
                isActive
                  ? 'border-blue-500 bg-blue-50/60 shadow-xs ring-2 ring-blue-500/15'
                  : isDone
                  ? 'border-emerald-200 bg-emerald-50/40 text-slate-600'
                  : 'border-slate-200 bg-slate-50/40 opacity-60'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1.5">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : isActive ? (
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                ) : (
                  <span className="w-4 h-4 rounded-full border border-slate-300 text-[10px] flex items-center justify-center text-slate-400 font-bold shrink-0">
                    {s.num}
                  </span>
                )}
                <span
                  className={`text-xs font-bold ${
                    isActive ? 'text-blue-900' : isDone ? 'text-emerald-900' : 'text-slate-500'
                  }`}
                >
                  {s.title}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug pl-6">
                {s.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
