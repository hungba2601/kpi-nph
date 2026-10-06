import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { KPIItem } from '@/types/kpi';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items = [], fileName = 'Danh_Muc_KPI.xlsx', customTemplateBase64 } = body as {
      items: KPIItem[];
      fileName?: string;
      customTemplateBase64?: string;
    };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Danh sách công việc trống' }, { status: 400 });
    }

    const workbook = new ExcelJS.Workbook();

    if (customTemplateBase64) {
      const templateBuffer = Buffer.from(customTemplateBase64, 'base64');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await workbook.xlsx.load(templateBuffer as any);
    } else {
      // Locate mau.xlsx template
      const templatePaths = [
        path.join('/tmp', 'mau.xlsx'),
        path.join(process.cwd(), 'mau.xlsx'),
        path.join(process.cwd(), 'public', 'mau.xlsx'),
      ];

      let templatePath = '';
      for (const p of templatePaths) {
        if (fs.existsSync(/* turbopackIgnore: true */ p)) {
          templatePath = p;
          break;
        }
      }

      if (templatePath) {
        await workbook.xlsx.readFile(templatePath);
      } else {
        // Fallback: create fresh workbook if template missing
        const sheet = workbook.addWorksheet('01. Mẫu import');
        sheet.addRow(['DANH MỤC SẢN PHẨM CHUẨN CỦA GV']);
        sheet.addRow([
          'TT', 'Mã đơn vị *', 'Tên công việc *', 'Kết quả đầu ra *', 'Thời hạn hoàn thành *',
          'Loại công việc *', 'Điểm chuẩn *', 'Hệ số độ khó *', 'Điểm quy đổi tối đa *',
          'Minh chứng', 'Ghi chú', 'Trục kết quả trọng tâm *', 'Trạng thái *', 'Kỳ đánh giá *'
        ]);
        sheet.addRow([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
      }
    }

    const worksheet = workbook.worksheets[0];
    const initialRowCount = worksheet.rowCount;

    // Standard border and font
    const thinBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
      bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
      left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
      right: { style: 'thin', color: { argb: 'FFD3D3D3' } },
    };

    const regularFont: Partial<ExcelJS.Font> = {
      name: 'Calibri',
      size: 10,
      color: { argb: 'FF000000' },
    };

    const sheetTruc = workbook.worksheets.find(
      (s) => s.name.toLowerCase().includes('trục') || s.name.toLowerCase().includes('truc')
    );
    const sheetKy = workbook.worksheets.find(
      (s) => s.name.toLowerCase().includes('kỳ') || s.name.toLowerCase().includes('ky')
    );

    const trucFormula = sheetTruc
      ? `'${sheetTruc.name}'!$A$1:$A$100`
      : "'03. Trục kết quả trọng tâm'!$A$1:$A$100";
    const kyFormula = sheetKy
      ? `'${sheetKy.name}'!$B$3:$B$1000`
      : "'05. Kỳ đánh giá'!$B$3:$B$1000";

    // Clear bloated validation model if present to keep export super fast (<300ms)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wsInternal = worksheet as any;
    if (wsInternal.dataValidations) {
      wsInternal.dataValidations.model = {};
    }

    // Data validation rules matching template
    const valLoaiCongViec: ExcelJS.DataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Thường xuyên,Đột xuất"'],
      showInputMessage: true,
      showErrorMessage: true,
    };

    const valHeSo: ExcelJS.DataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"100%,110%,120%"'],
      showInputMessage: true,
      showErrorMessage: true,
    };

    const valTruc: ExcelJS.DataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [trucFormula],
      showInputMessage: true,
      showErrorMessage: true,
    };

    const valTrangThai: ExcelJS.DataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Hoạt động,Không hoạt động"'],
      showInputMessage: true,
      showErrorMessage: true,
    };

    const valKy: ExcelJS.DataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: [kyFormula],
      showErrorMessage: true,
      errorTitle: 'Dữ liệu không hợp lệ',
      error: 'Vui lòng chọn Kỳ đánh giá',
    };

    // First, clear old sample data rows (from row 4 upwards) and clean any shared formulas
    const totalExistingRows = worksheet.rowCount;
    for (let r = 4; r <= Math.max(totalExistingRows, 4 + items.length + 5); r++) {
      const row = worksheet.getRow(r);
      for (let c = 1; c <= 14; c++) {
        const cell = row.getCell(c);
        cell.value = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((cell as any).sharedFormula) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          delete (cell as any).sharedFormula;
        }
      }
    }

    // Now write items starting at row 4
    items.forEach((item, index) => {
      const rowNum = 4 + index;
      const row = worksheet.getRow(rowNum);

      const stt = item.stt || index + 1;
      const diemChuan = Number(item.diemChuan) || 10;
      const heSo = Number(item.heSoDoKho) || 1;
      const diemQuyDoi = Math.round(diemChuan * heSo * 10) / 10;

      // Col A: TT
      const cellA = row.getCell(1);
      cellA.value = stt;
      cellA.alignment = { vertical: 'middle', horizontal: 'center' };

      // Col B: Mã đơn vị
      const cellB = row.getCell(2);
      cellB.value = item.maDonVi || 'H29.205.10';
      cellB.alignment = { vertical: 'middle', horizontal: 'center' };

      // Col C: Tên công việc
      const cellC = row.getCell(3);
      cellC.value = item.tenCongViec || '';
      cellC.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

      // Col D: Kết quả đầu ra
      const cellD = row.getCell(4);
      cellD.value = item.ketQuaDauRa || '';
      cellD.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

      // Col E: Thời hạn hoàn thành
      const cellE = row.getCell(5);
      cellE.value = item.thoiHanHoanThanh || '20/12/2026';
      cellE.alignment = { vertical: 'middle', horizontal: 'center' };

      // Col F: Loại công việc (Dropdown validation)
      const cellF = row.getCell(6);
      cellF.value = item.loaiCongViec || 'Thường xuyên';
      cellF.alignment = { vertical: 'middle', horizontal: 'center' };
      cellF.dataValidation = valLoaiCongViec;

      // Col G: Điểm chuẩn
      const cellG = row.getCell(7);
      cellG.value = diemChuan;
      cellG.alignment = { vertical: 'middle', horizontal: 'right' };

      // Col H: Hệ số độ khó (Dropdown validation)
      const cellH = row.getCell(8);
      cellH.value = heSo;
      cellH.numFmt = '0%';
      cellH.alignment = { vertical: 'middle', horizontal: 'right' };
      cellH.dataValidation = valHeSo;

      // Col I: Điểm quy đổi tối đa (Formula + computed result)
      const cellI = row.getCell(9);
      cellI.value = {
        formula: `IFERROR(H${rowNum}*G${rowNum},0)`,
        result: diemQuyDoi,
      };
      cellI.alignment = { vertical: 'middle', horizontal: 'right' };

      // Col J: Minh chứng
      const cellJ = row.getCell(10);
      cellJ.value = item.minhChung || '';
      cellJ.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

      // Col K: Ghi chú
      const cellK = row.getCell(11);
      cellK.value = item.ghiChu || '';
      cellK.alignment = { vertical: 'middle', horizontal: 'left' };

      // Col L: Trục kết quả trọng tâm (Dropdown validation from sheet 03)
      const cellL = row.getCell(12);
      cellL.value = item.trucKetQua || '';
      cellL.alignment = { vertical: 'middle', horizontal: 'left' };
      cellL.dataValidation = valTruc;

      // Col M: Trạng thái (Dropdown validation)
      const cellM = row.getCell(13);
      cellM.value = item.trangThai || 'Hoạt động';
      cellM.alignment = { vertical: 'middle', horizontal: 'center' };
      cellM.dataValidation = valTrangThai;

      // Col N: Kỳ đánh giá (Dropdown validation from sheet 05)
      const cellN = row.getCell(14);
      cellN.value = item.kyDanhGia || '(Chính thức)KPI-Q4-2026';
      cellN.alignment = { vertical: 'middle', horizontal: 'center' };
      cellN.dataValidation = valKy;

      // Apply border and font to all 14 cells
      for (let c = 1; c <= 14; c++) {
        const cell = row.getCell(c);
        cell.border = thinBorder;
        cell.font = regularFont;
      }

      row.commit();
    });

    // Also attach dropdown validations to 30 buffer rows below the data
    // so if the user adds new rows directly in Excel, dropdowns are ready
    const lastItemRow = 3 + items.length;
    for (let bufR = lastItemRow + 1; bufR <= lastItemRow + 30; bufR++) {
      const bufRow = worksheet.getRow(bufR);
      bufRow.getCell(6).dataValidation = valLoaiCongViec;
      bufRow.getCell(8).dataValidation = valHeSo;
      bufRow.getCell(8).numFmt = '0%';
      bufRow.getCell(12).dataValidation = valTruc;
      bufRow.getCell(13).dataValidation = valTrangThai;
      bufRow.getCell(14).dataValidation = valKy;
    }

    const buffer = await workbook.xlsx.writeBuffer();

    const safeFileName = encodeURIComponent(
      fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`
    );

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${safeFileName}"; filename*=UTF-8''${safeFileName}`,
      },
    });
  } catch (error: unknown) {
    console.error('Export Excel error:', error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Lỗi xuất file Excel: ${errMsg}` }, { status: 500 });
  }
}
