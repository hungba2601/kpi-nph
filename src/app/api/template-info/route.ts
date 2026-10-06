import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

interface DonViItem {
  code: string;
  name: string;
}

interface KyItem {
  code: string;
  name: string;
}

function parseWorkbookInfo(workbook: ExcelJS.Workbook, templateName: string) {
  const donViList: DonViItem[] = [];
  const kyDanhGiaList: KyItem[] = [];
  const trucList: string[] = [];

  // 1. Parse Don Vi
  const wsDonVi = workbook.worksheets.find((s) => {
    const name = s.name.toLowerCase();
    return name.includes('đơn vị') || name.includes('don vi') || name.includes('danh sách đơn vị');
  });

  if (wsDonVi) {
    for (let r = 2; r <= wsDonVi.rowCount; r++) {
      const row = wsDonVi.getRow(r);
      // Col 1 is STT or header; Col 2 is Code, Col 3 is Name
      const col1 = String(row.getCell(1).value || '').trim();
      const col2 = String(row.getCell(2).value || '').trim();
      const col3 = String(row.getCell(3).value || '').trim();

      // Skip header rows
      if (
        col1.toLowerCase() === 'stt' ||
        col2.toLowerCase().includes('mã') ||
        col3.toLowerCase().includes('tên')
      ) {
        continue;
      }

      if (col2 && col2 !== 'null' && col2 !== 'undefined') {
        donViList.push({
          code: col2,
          name: col3 || col2,
        });
      }
    }
  }

  // 2. Parse Ky danh gia
  const wsKy = workbook.worksheets.find((s) => {
    const name = s.name.toLowerCase();
    return name.includes('kỳ') || name.includes('ky') || name.includes('đánh giá');
  });

  if (wsKy) {
    for (let r = 2; r <= wsKy.rowCount; r++) {
      const row = wsKy.getRow(r);
      const col1 = String(row.getCell(1).value || '').trim();
      const col2 = String(row.getCell(2).value || '').trim();
      const col3 = String(row.getCell(3).value || '').trim();

      if (
        col1.toLowerCase() === 'stt' ||
        col2.toLowerCase().includes('mã kỳ') ||
        col3.toLowerCase().includes('tên kỳ')
      ) {
        continue;
      }

      if (col2 && col2 !== 'null' && col2 !== 'undefined') {
        kyDanhGiaList.push({
          code: col2,
          name: col3 || col2,
        });
      }
    }
  }

  // 3. Parse Truc
  const wsTruc = workbook.worksheets.find((s) => {
    const name = s.name.toLowerCase();
    return name.includes('trục') || name.includes('truc');
  });

  if (wsTruc) {
    for (let r = 1; r <= wsTruc.rowCount; r++) {
      const val = String(wsTruc.getRow(r).getCell(1).value || '').trim();
      if (val && val.toUpperCase().includes('TRỤC')) {
        trucList.push(val);
      }
    }
  }

  return {
    templateName,
    donViList,
    kyDanhGiaList,
    trucList,
  };
}

// GET: Read existing default template
export async function GET() {
  try {
    const templatePaths = [
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

    if (!templatePath) {
      return NextResponse.json(
        { error: 'Không tìm thấy file mẫu mau.xlsx' },
        { status: 404 }
      );
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    const info = parseWorkbookInfo(workbook, path.basename(templatePath));
    return NextResponse.json({ success: true, ...info });
  } catch (error: unknown) {
    console.error('Error reading template info:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST: Upload custom template file and parse its contents
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Không tìm thấy tệp tin file mẫu tải lên' },
        { status: 400 }
      );
    }

    const fileName = file.name || 'mau.xlsx';
    if (!fileName.endsWith('.xlsx')) {
      return NextResponse.json(
        { error: 'Vui lòng tải lên file định dạng Excel (.xlsx)' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = new ExcelJS.Workbook();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(buffer as any);

    // Save uploaded template to mau.xlsx and public/mau.xlsx
    const rootPath = path.join(process.cwd(), 'mau.xlsx');
    const publicPath = path.join(process.cwd(), 'public', 'mau.xlsx');
    fs.writeFileSync(rootPath, buffer);
    fs.writeFileSync(publicPath, buffer);

    const info = parseWorkbookInfo(workbook, fileName);

    return NextResponse.json({
      success: true,
      message: `Đã nạp file mẫu ${fileName} thành công!`,
      ...info,
    });
  } catch (error: unknown) {
    console.error('Error uploading template:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Lỗi khi đọc file mẫu Excel: ${msg}` },
      { status: 500 }
    );
  }
}
