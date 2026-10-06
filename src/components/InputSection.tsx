'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  FileCheck,
  X,
  Sparkles,
  RefreshCw,
  Loader2,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { SAMPLE_TEXTS } from '@/types/kpi';

interface InputSectionProps {
  inputText: string;
  onTextChange: (text: string) => void;
  disabled?: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({
  inputText,
  onTextChange,
  disabled = false,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    charCount: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploadError(null);

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['docx', 'pdf', 'txt', 'md'].includes(ext || '')) {
      setUploadError('Chỉ hỗ trợ tệp định dạng .DOCX, .PDF hoặc .TXT');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setUploadError('Dung lượng tệp vượt quá giới hạn 20MB');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Trích xuất nội dung thất bại');
      }

      onTextChange(data.text);
      setUploadedFile({
        name: file.name,
        size: file.size,
        charCount: data.charCount,
      });
      setActiveTab('manual'); // Switch to editor so user sees extracted content
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const charCount = inputText.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Header Tabs */}
      <div className="flex items-center justify-between px-6 pt-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center space-x-2 ${
              activeTab === 'upload'
                ? 'border-blue-600 text-blue-600 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>1. Tải lên tệp (DOCX / PDF)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center space-x-2 ${
              activeTab === 'manual'
                ? 'border-blue-600 text-blue-600 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>2. Nhập / Chỉnh sửa văn bản</span>
            {inputText.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>
        </div>

        {/* Quick sample loader dropdown/chips */}
        <div className="hidden sm:flex items-center space-x-2 pb-2">
          <span className="text-[11px] text-slate-400 flex items-center space-x-1">
            <BookOpen className="w-3 h-3" />
            <span>Mẫu thử nhanh:</span>
          </span>
          {SAMPLE_TEXTS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => {
                onTextChange(sample.content);
                setActiveTab('manual');
              }}
              className="px-2.5 py-1 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 rounded-lg transition-all"
            >
              {idx === 0 ? 'Mẫu GV THCS' : 'Mẫu Hành chính'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* Tab 1: Upload File */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
                  : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/50 bg-slate-50/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.pdf,.txt,.md"
                onChange={handleFileInputChange}
                className="hidden"
                disabled={disabled || uploading}
              />

              {uploading ? (
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center animate-spin">
                    <Loader2 className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    Đang bóc tách nội dung văn bản...
                  </p>
                  <p className="text-xs text-slate-500">
                    Sử dụng Mammoth.js cho DOCX & PDF parser
                  </p>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 shadow-inner group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <p className="text-base font-semibold text-slate-800">
                    Kéo & thả tệp tin vào đây, hoặc{' '}
                    <span className="text-blue-600 underline">chọn tệp từ máy tính</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1.5 max-w-sm">
                    Hỗ trợ tệp <strong>DOCX, PDF, TXT</strong> (Kế hoạch công tác năm, Báo cáo chuyên môn, Quyết định phân công nhiệm vụ...)
                  </p>
                  <div className="mt-4 flex items-center space-x-2">
                    <span className="px-2.5 py-1 text-[11px] font-semibold bg-blue-50 text-blue-700 rounded-md border border-blue-100">
                      DOCX (Mammoth)
                    </span>
                    <span className="px-2.5 py-1 text-[11px] font-semibold bg-rose-50 text-rose-700 rounded-md border border-rose-100">
                      PDF (pdf-parse)
                    </span>
                    <span className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100">
                      Tối đa 20MB
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Upload Error notification */}
            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Extracted file badge if exists */}
            {uploadedFile && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{uploadedFile.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {(uploadedFile.size / 1024).toFixed(1)} KB • Trích xuất {uploadedFile.charCount.toLocaleString()} ký tự
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('manual')}
                    className="px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Xem văn bản đã đọc
                  </button>
                  <button
                    type="button"
                    onClick={removeUploadedFile}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Manual Textarea Editor */}
        {activeTab === 'manual' && (
          <div className="space-y-3">
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => onTextChange(e.target.value)}
                placeholder="Dán hoặc gõ nội dung kế hoạch công tác, báo cáo nhiệm vụ tại đây...
Ví dụ:
1. Thực hiện kế hoạch bài dạy môn KHTN 7 theo chương trình GDPT 2018. Hạn chót: 20/12/2026.
2. Kiểm tra định kỳ và đánh giá thường xuyên học sinh trên hệ thống sổ điểm điện tử..."
                rows={10}
                disabled={disabled}
                className="w-full p-4 text-sm text-slate-800 bg-slate-50/40 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15 focus:bg-white outline-hidden font-normal leading-relaxed transition-all resize-y placeholder-slate-400"
              />
            </div>

            {/* Bottom bar of textarea */}
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
              <div className="flex items-center space-x-3">
                <span>
                  Số từ: <strong className="text-slate-700">{wordCount}</strong>
                </span>
                <span>•</span>
                <span>
                  Số ký tự: <strong className="text-slate-700">{charCount}</strong>
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {inputText && (
                  <button
                    type="button"
                    onClick={() => onTextChange('')}
                    disabled={disabled}
                    className="text-slate-400 hover:text-rose-600 text-xs px-2 py-1 rounded transition-colors"
                  >
                    Xóa trắng
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className="text-blue-600 hover:text-blue-700 text-xs font-medium px-2 py-1 rounded transition-colors"
                >
                  Tải tệp tin khác
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
