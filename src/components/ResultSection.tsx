'use client';

import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Copy,
  Plus,
  Trash2,
  RefreshCw,
  Edit3,
  Award,
  Layers,
  Calendar,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import { KPIItem, DEFAULT_TRUC_LIST } from '@/types/kpi';

interface ResultSectionProps {
  items: KPIItem[];
  onItemsChange: (items: KPIItem[]) => void;
  onReset: () => void;
  fileName?: string;
  modeUsed?: 'algorithm' | 'ai' | 'algorithm_fallback';
  executionTimeMs?: number;
}

export const ResultSection: React.FC<ResultSectionProps> = ({
  items,
  onItemsChange,
  onReset,
  fileName = 'Danh_Muc_KPI_Giao_Vien.xlsx',
  modeUsed = 'algorithm',
  executionTimeMs,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Statistics
  const totalTasks = items.length;
  const regularTasks = items.filter((i) => i.loaiCongViec === 'Thường xuyên').length;
  const irregularTasks = items.filter((i) => i.loaiCongViec === 'Đột xuất').length;
  const totalScore = items.reduce((acc, curr) => acc + (curr.diemQuyDoi || 0), 0);

  // Distribution by Trục
  const trucDistribution = DEFAULT_TRUC_LIST.map((truc, idx) => {
    const count = items.filter((i) => i.trucKetQua === truc).length;
    return {
      truc,
      shortName: `Trục ${idx + 1}`,
      count,
    };
  });

  const handleCellChange = (
    index: number,
    field: keyof KPIItem,
    value: string | number
  ) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    // Recalculate if loaiCongViec or heSoDoKho changed
    if (field === 'loaiCongViec') {
      item.diemChuan = value === 'Đột xuất' ? 12 : 10;
      item.diemQuyDoi = Math.round(item.diemChuan * item.heSoDoKho * 10) / 10;
    } else if (field === 'heSoDoKho') {
      const num = Number(value) || 1;
      item.heSoDoKho = num;
      item.diemQuyDoi = Math.round(item.diemChuan * num * 10) / 10;
    }

    updated[index] = item;
    onItemsChange(updated);
  };

  const handleAddNewRow = () => {
    const newItem: KPIItem = {
      id: `manual-${Date.now()}`,
      stt: items.length + 1,
      maDonVi: items[0]?.maDonVi || 'H29.205.10',
      tenCongViec: 'Nhiệm vụ bổ sung mới',
      ketQuaDauRa: 'Kế hoạch / Báo cáo thực hiện',
      thoiHanHoanThanh: '20/12/2026',
      loaiCongViec: 'Thường xuyên',
      diemChuan: 10,
      heSoDoKho: 1,
      diemQuyDoi: 10,
      minhChung: 'Hồ sơ, minh chứng văn bản',
      ghiChu: '',
      trucKetQua: DEFAULT_TRUC_LIST[0],
      trangThai: 'Hoạt động',
      kyDanhGia: items[0]?.kyDanhGia || '(Chính thức)KPI-Q4-2026',
    };
    onItemsChange([...items, newItem]);
  };

  const handleDeleteRow = (index: number) => {
    const updated = items
      .filter((_, i) => i !== index)
      .map((item, i) => ({ ...item, stt: i + 1 }));
    onItemsChange(updated);
  };

  const handleDownloadExcel = async () => {
    if (items.length === 0) return;
    setDownloading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/export-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          fileName,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Xuất file Excel thất bại');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(items, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Main Actions */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/15 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
            <FileCheck2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold tracking-tight">
                Đã khởi tạo thành công {totalTasks} mục KPI!
              </h3>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 rounded-full">
                Sẵn sàng xuất file
              </span>
              {modeUsed === 'algorithm' ? (
                <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-400/25 text-amber-200 border border-amber-400/35 rounded-full inline-flex items-center space-x-1">
                  <span>⚡ Thuật toán quy chuẩn</span>
                  {executionTimeMs !== undefined && <span>({executionTimeMs}ms)</span>}
                </span>
              ) : modeUsed === 'algorithm_fallback' ? (
                <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-400/25 text-amber-200 border border-amber-400/35 rounded-full inline-flex items-center space-x-1">
                  <span>⚡ Tự động dùng Thuật toán dự phòng</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-purple-400/25 text-purple-200 border border-purple-400/35 rounded-full inline-flex items-center space-x-1">
                  <span>✨ Gemini AI</span>
                  {executionTimeMs !== undefined && <span>({(executionTimeMs / 1000).toFixed(1)}s)</span>}
                </span>
              )}
            </div>
            <p className="text-xs text-blue-100/90 mt-0.5">
              Dữ liệu đã được gán vào 6 Trục kết quả trọng tâm và kiểm tra điểm quy đổi theo quy chế.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handleDownloadExcel}
            disabled={downloading || items.length === 0}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-98 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {downloading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-blue-700" />
                <span>Đang đóng gói Excel...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-blue-700 stroke-[2.5]" />
                <span>TẢI XUỐNG FILE EXCEL (.XLSX)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tổng công việc</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalTasks}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Đã ánh xạ vào mẫu</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tổng điểm quy đổi</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2">{totalScore}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Điểm tối đa quy đổi</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Phân loại nhiệm vụ</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-xl font-bold text-slate-900">{regularTasks}</span>
            <span className="text-xs text-slate-500">thường xuyên</span>
            <span className="text-slate-300">|</span>
            <span className="text-xl font-bold text-rose-600">{irregularTasks}</span>
            <span className="text-xs text-slate-500">đột xuất</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">10đ / việc tx - 12đ / đột xuất</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Kỳ & Đơn vị</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs font-bold text-slate-900 mt-2 truncate">
            {items[0]?.maDonVi || 'H29.205.10'}
          </p>
          <p className="text-[11px] text-slate-500 truncate mt-0.5">
            {items[0]?.kyDanhGia || '(Chính thức)KPI-Q4-2026'}
          </p>
        </div>
      </div>

      {/* 6 Trục Distribution */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          <span>Phân bố nhiệm vụ theo 6 Trục kết quả trọng tâm</span>
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {trucDistribution.map((t, i) => (
            <div
              key={i}
              className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between ${
                t.count > 0
                  ? 'border-blue-200 bg-blue-50/50 text-blue-900'
                  : 'border-slate-100 bg-slate-50/50 text-slate-400'
              }`}
            >
              <span className="font-semibold">{t.shortName}</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-slate-500 truncate max-w-[80px]" title={t.truc}>
                  {t.truc.slice(9, 28)}...
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded-full font-bold text-xs ${
                    t.count > 0 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {t.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/40">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-slate-800">Bảng dữ liệu chi tiết</span>
            <span className="text-xs text-slate-500">
              (Nhấp vào ô bất kỳ để chỉnh sửa trực tiếp trước khi xuất Excel)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleAddNewRow}
              className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm dòng</span>
            </button>
            <button
              type="button"
              onClick={handleCopyJson}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center space-x-1"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Đã chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Chép JSON</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onReset}
              className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Làm mới lại
            </button>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100/80 sticky top-0 z-10 text-slate-700 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="p-2.5 text-center w-12 border-r border-slate-200">STT</th>
                <th className="p-2.5 min-w-[240px] border-r border-slate-200">Tên công việc *</th>
                <th className="p-2.5 min-w-[180px] border-r border-slate-200">Kết quả đầu ra *</th>
                <th className="p-2.5 min-w-[100px] border-r border-slate-200">Thời hạn</th>
                <th className="p-2.5 min-w-[110px] border-r border-slate-200">Loại CV</th>
                <th className="p-2.5 text-center w-16 border-r border-slate-200">Đ.Chuẩn</th>
                <th className="p-2.5 text-center w-20 border-r border-slate-200">Hệ số</th>
                <th className="p-2.5 text-center w-20 border-r border-slate-200">Đ.Quy đổi</th>
                <th className="p-2.5 min-w-[180px] border-r border-slate-200">Minh chứng</th>
                <th className="p-2.5 min-w-[260px] border-r border-slate-200">Trục kết quả trọng tâm *</th>
                <th className="p-2.5 text-center w-12">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {items.map((item, index) => (
                <tr
                  key={item.id || index}
                  className="hover:bg-blue-50/30 transition-colors group"
                >
                  {/* STT */}
                  <td className="p-2 text-center font-medium text-slate-500 border-r border-slate-100">
                    {item.stt}
                  </td>

                  {/* Tên công việc */}
                  <td className="p-2 border-r border-slate-100">
                    <textarea
                      rows={2}
                      value={item.tenCongViec}
                      onChange={(e) => handleCellChange(index, 'tenCongViec', e.target.value)}
                      className="w-full p-1.5 text-xs rounded border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white bg-transparent outline-hidden resize-none"
                    />
                  </td>

                  {/* Kết quả đầu ra */}
                  <td className="p-2 border-r border-slate-100">
                    <textarea
                      rows={2}
                      value={item.ketQuaDauRa}
                      onChange={(e) => handleCellChange(index, 'ketQuaDauRa', e.target.value)}
                      className="w-full p-1.5 text-xs rounded border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white bg-transparent outline-hidden resize-none"
                    />
                  </td>

                  {/* Thời hạn */}
                  <td className="p-2 border-r border-slate-100">
                    <input
                      type="text"
                      value={item.thoiHanHoanThanh}
                      onChange={(e) => handleCellChange(index, 'thoiHanHoanThanh', e.target.value)}
                      className="w-full p-1.5 text-xs rounded border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white bg-transparent outline-hidden text-center"
                    />
                  </td>

                  {/* Loại công việc */}
                  <td className="p-2 border-r border-slate-100 text-center">
                    <select
                      value={item.loaiCongViec}
                      onChange={(e) => handleCellChange(index, 'loaiCongViec', e.target.value)}
                      className={`text-xs px-2 py-1 rounded font-medium border outline-hidden ${
                        item.loaiCongViec === 'Đột xuất'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      <option value="Thường xuyên">Thường xuyên</option>
                      <option value="Đột xuất">Đột xuất</option>
                    </select>
                  </td>

                  {/* Điểm chuẩn */}
                  <td className="p-2 border-r border-slate-100 text-center font-semibold text-slate-700">
                    {item.diemChuan}
                  </td>

                  {/* Hệ số độ khó */}
                  <td className="p-2 border-r border-slate-100 text-center">
                    <select
                      value={item.heSoDoKho}
                      onChange={(e) => handleCellChange(index, 'heSoDoKho', Number(e.target.value))}
                      className="text-xs px-2 py-1 rounded border border-slate-200 bg-white outline-hidden font-semibold text-slate-700"
                    >
                      <option value={1}>100%</option>
                      <option value={1.1}>110%</option>
                      <option value={1.2}>120%</option>
                    </select>
                  </td>

                  {/* Điểm quy đổi */}
                  <td className="p-2 border-r border-slate-100 text-center font-bold text-blue-600">
                    {item.diemQuyDoi}
                  </td>

                  {/* Minh chứng */}
                  <td className="p-2 border-r border-slate-100">
                    <input
                      type="text"
                      value={item.minhChung}
                      onChange={(e) => handleCellChange(index, 'minhChung', e.target.value)}
                      className="w-full p-1.5 text-xs rounded border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white bg-transparent outline-hidden"
                    />
                  </td>

                  {/* Trục kết quả trọng tâm */}
                  <td className="p-2 border-r border-slate-100">
                    <select
                      value={item.trucKetQua}
                      onChange={(e) => handleCellChange(index, 'trucKetQua', e.target.value)}
                      className="w-full p-1.5 text-[11px] rounded border border-slate-200 bg-white outline-hidden truncate"
                      title={item.trucKetQua}
                    >
                      {DEFAULT_TRUC_LIST.map((truc, tIdx) => (
                        <option key={tIdx} value={truc}>
                          {truc}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Delete Button */}
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(index)}
                      className="p-1 text-slate-300 hover:text-rose-600 rounded transition-colors"
                      title="Xóa dòng này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
