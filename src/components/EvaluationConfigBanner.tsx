'use client';

import React, { useRef, useState } from 'react';
import {
  Building2,
  Calendar,
  Check,
  SlidersHorizontal,
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export interface TemplateDonVi {
  code: string;
  name: string;
}

export interface TemplateKy {
  code: string;
  name: string;
}

interface EvaluationConfigBannerProps {
  maDonVi: string;
  setMaDonVi: (val: string) => void;
  tenDonVi: string;
  setTenDonVi: (val: string) => void;
  kyDanhGia: string;
  setKyDanhGia: (val: string) => void;
  donViList: TemplateDonVi[];
  kyDanhGiaList: TemplateKy[];
  templateName: string;
  onTemplateUpdated: (info: {
    templateName: string;
    donViList: TemplateDonVi[];
    kyDanhGiaList: TemplateKy[];
  }) => void;
}

export const EvaluationConfigBanner: React.FC<EvaluationConfigBannerProps> = ({
  maDonVi,
  setMaDonVi,
  setTenDonVi,
  kyDanhGia,
  setKyDanhGia,
  donViList,
  kyDanhGiaList,
  templateName,
  onTemplateUpdated,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{
    success: boolean;
    text: string;
  } | null>(null);

  const handleTemplateFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setUploadMessage({
        success: false,
        text: 'Vui lòng chọn file mẫu có định dạng Excel (.xlsx)',
      });
      return;
    }

    setIsUploading(true);
    setUploadMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/template-info', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể đọc nội dung file mẫu');
      }

      onTemplateUpdated({
        templateName: data.templateName || file.name,
        donViList: data.donViList || [],
        kyDanhGiaList: data.kyDanhGiaList || [],
      });

      // Auto select first items if available
      if (data.donViList && data.donViList.length > 0) {
        setMaDonVi(data.donViList[0].code);
        setTenDonVi(data.donViList[0].name);
      }
      if (data.kyDanhGiaList && data.kyDanhGiaList.length > 0) {
        // Prefer Q4 or last
        const q4 = data.kyDanhGiaList.find((k: TemplateKy) => k.code.includes('Q4')) || data.kyDanhGiaList[0];
        setKyDanhGia(q4.code);
      }

      setUploadMessage({
        success: true,
        text: `Đã đọc thành công file "${file.name}": Tìm thấy ${data.donViList?.length || 0} đơn vị và ${data.kyDanhGiaList?.length || 0} kỳ đánh giá!`,
      });

      setTimeout(() => setUploadMessage(null), 6000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setUploadMessage({
        success: false,
        text: `Lỗi đọc file mẫu: ${msg}`,
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
      {/* Header bar of Evaluation Parameters */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Thông số đánh giá & Đơn vị áp dụng
              </h3>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                <span>Nguồn: {templateName || 'mau.xlsx'}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Dữ liệu được nạp trực tiếp từ các sheet của file mẫu Excel (Cột 2: Mã đơn vị, Cột 14: Kỳ đánh giá)
            </p>
          </div>
        </div>

        {/* Upload Custom Template File Button */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleTemplateFileUpload(e.target.files[0]);
              }
            }}
            className="hidden"
          />
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 rounded-xl transition-all shadow-2xs inline-flex items-center space-x-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Đang đọc file mẫu...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>Tải lên file mẫu khác (.xlsx)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Upload Notification feedback */}
      {uploadMessage && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center space-x-2 animate-in fade-in ${
            uploadMessage.success
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {uploadMessage.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{uploadMessage.text}</span>
        </div>
      )}

      {/* Two columns: Mã đơn vị & Kỳ đánh giá KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Column 1: Mã đơn vị */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Mã đơn vị (Trường/Đơn vị)</span>
              <span className="text-rose-500">*</span>
            </label>
            <span className="text-[10px] text-slate-400">
              (Từ sheet: 04. Danh sách đơn vị)
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              value={maDonVi}
              onChange={(e) => setMaDonVi(e.target.value)}
              placeholder="VD: H29.205.10"
              className="w-full px-3.5 py-2.5 text-sm font-medium rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15 outline-hidden transition-all text-slate-800 bg-white"
            />
          </div>

          {/* Dynamic pills for Unit from template */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {donViList && donViList.length > 0 ? (
              donViList.map((dv) => {
                const isSelected = maDonVi === dv.code;
                return (
                  <button
                    key={dv.code}
                    type="button"
                    onClick={() => {
                      setMaDonVi(dv.code);
                      setTenDonVi(dv.name);
                    }}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center space-x-1 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-blue-600" />}
                    <span>
                      {dv.code} ({dv.name})
                    </span>
                  </button>
                );
              })
            ) : (
              <span className="text-xs text-slate-400 italic">
                Chưa tìm thấy danh sách đơn vị trong file mẫu.
              </span>
            )}
          </div>
        </div>

        {/* Column 2: Kỳ đánh giá KPI */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Kỳ đánh giá KPI</span>
              <span className="text-rose-500">*</span>
            </label>
            <span className="text-[10px] text-slate-400">
              (Từ sheet: 05. Kỳ đánh giá)
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              value={kyDanhGia}
              onChange={(e) => setKyDanhGia(e.target.value)}
              placeholder="VD: (Chính thức)KPI-Q4-2026"
              className="w-full px-3.5 py-2.5 text-sm font-medium rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15 outline-hidden transition-all text-slate-800 bg-white"
            />
          </div>

          {/* Dynamic pills for Period from template */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {kyDanhGiaList && kyDanhGiaList.length > 0 ? (
              kyDanhGiaList.map((ky) => {
                const isSelected = kyDanhGia === ky.code;
                return (
                  <button
                    key={ky.code}
                    type="button"
                    onClick={() => setKyDanhGia(ky.code)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center space-x-1 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-blue-600" />}
                    <span>{ky.code}</span>
                  </button>
                );
              })
            ) : (
              <span className="text-xs text-slate-400 italic">
                Chưa tìm thấy kỳ đánh giá trong file mẫu.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
