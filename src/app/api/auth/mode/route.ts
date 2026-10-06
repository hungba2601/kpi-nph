import { NextRequest, NextResponse } from 'next/server';
import { GOOGLE_APPS_SCRIPT_URL } from '@/config/auth';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CONFIG_PATH = path.join(process.cwd(), 'src', 'config', 'auth_mode.json');

// Bộ nhớ đệm tạm thời
let inMemoryMode: boolean = true;

async function getLocalConfigMode(): Promise<boolean> {
  try {
    const data = await fs.readFile(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    if (typeof parsed.checkDeviceMode === 'boolean') {
      inMemoryMode = parsed.checkDeviceMode;
      return parsed.checkDeviceMode;
    }
  } catch {
    // Không đọc được file, dùng inMemoryMode
  }
  return inMemoryMode;
}

async function saveLocalConfigMode(mode: boolean): Promise<void> {
  inMemoryMode = mode;
  try {
    await fs.writeFile(
      CONFIG_PATH,
      JSON.stringify({ checkDeviceMode: mode, updatedAt: new Date().toISOString() }, null, 2),
      'utf-8'
    );
  } catch (e) {
    console.warn('Could not write auth_mode.json to disk (e.g. read-only env):', e);
  }
}

export async function GET() {
  const scriptUrl =
    GOOGLE_APPS_SCRIPT_URL && GOOGLE_APPS_SCRIPT_URL.startsWith('http') && !GOOGLE_APPS_SCRIPT_URL.includes('...')
      ? GOOGLE_APPS_SCRIPT_URL
      : process.env.GOOGLE_APPS_SCRIPT_URL;

  // 1. ƯU TIÊN ĐỌC TRỰC TIẾP TỪ Ô F1 TRÊN GOOGLE SHEET
  if (scriptUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(scriptUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'get_mode' }),
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const text = await res.text();
        const data = JSON.parse(text);
        if (data && data.success && typeof data.checkDeviceMode === 'boolean') {
          await saveLocalConfigMode(data.checkDeviceMode);
          return NextResponse.json(
            {
              success: true,
              checkDeviceMode: data.checkDeviceMode,
              f1Value: data.f1Value,
              source: 'google_sheet_f1',
            },
            {
              headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              },
            }
          );
        }
      }
    } catch (err) {
      console.warn('Lỗi đọc ô F1 từ Google Sheet Apps Script:', err);
    }
  }

  // 2. Dự phòng nếu Google Apps Script chưa phản hồi
  const mode = await getLocalConfigMode();
  return NextResponse.json(
    {
      success: true,
      checkDeviceMode: mode,
      source: 'local_fallback',
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { checkDeviceMode, adminPassword } = body;

    // Kiểm tra mật khẩu quản trị nếu có truyền
    if (adminPassword && adminPassword !== 'Hung@2601') {
      return NextResponse.json(
        { success: false, error: 'Mật khẩu quản trị không chính xác.' },
        { status: 403 }
      );
    }

    if (typeof checkDeviceMode !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Trường checkDeviceMode không hợp lệ (phải là true/false).' },
        { status: 400 }
      );
    }

    // 1. Ghi trực tiếp vào Google Sheet (Ô F1: 1 = Có kiểm tra, 0 = Không kiểm tra)
    const scriptUrl =
      GOOGLE_APPS_SCRIPT_URL && GOOGLE_APPS_SCRIPT_URL.startsWith('http') && !GOOGLE_APPS_SCRIPT_URL.includes('...')
        ? GOOGLE_APPS_SCRIPT_URL
        : process.env.GOOGLE_APPS_SCRIPT_URL;

    let gasSynced = false;
    let gasMessage = '';
    if (scriptUrl) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(scriptUrl.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'set_mode',
            checkDeviceMode: checkDeviceMode,
          }),
          signal: controller.signal,
          cache: 'no-store',
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const text = await res.text();
          const data = JSON.parse(text);
          if (data && data.success) {
            gasSynced = true;
            gasMessage = data.message || 'Đã ghi vào ô F1 Google Sheet';
          }
        }
      } catch (err) {
        console.warn('Không thể ghi trực tiếp sang Google Apps Script:', err);
      }
    }

    // 2. Lưu bộ đệm local trên server
    await saveLocalConfigMode(checkDeviceMode);

    return NextResponse.json({
      success: true,
      checkDeviceMode: checkDeviceMode,
      f1Value: checkDeviceMode ? 1 : 0,
      gasSynced,
      message: gasSynced
        ? `Đã lưu thành công vào ô F1 Google Sheet (${checkDeviceMode ? '1: Có kiểm tra' : '0: Bỏ qua kiểm tra'})!`
        : 'Đã lưu cấu hình thành công!',
    });
  } catch (error) {
    console.error('Mode API POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi máy chủ khi lưu cấu hình.' },
      { status: 500 }
    );
  }
}
