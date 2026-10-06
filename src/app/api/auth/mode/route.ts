import { NextRequest, NextResponse } from 'next/server';
import { GOOGLE_APPS_SCRIPT_URL } from '@/config/auth';
import fs from 'fs/promises';
import path from 'path';

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
  let mode = await getLocalConfigMode();

  // Thử kiểm tra cấu hình trên Google Apps Script (nếu có cấu hình URL)
  const scriptUrl =
    GOOGLE_APPS_SCRIPT_URL && GOOGLE_APPS_SCRIPT_URL.startsWith('http') && !GOOGLE_APPS_SCRIPT_URL.includes('...')
      ? GOOGLE_APPS_SCRIPT_URL
      : process.env.GOOGLE_APPS_SCRIPT_URL;

  if (scriptUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout
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
          mode = data.checkDeviceMode;
          // Đồng bộ lại local
          await saveLocalConfigMode(mode);
        }
      }
    } catch {
      // Giữ nguyên mode từ local nếu GAS timeout hoặc script chưa hỗ trợ
    }
  }

  return NextResponse.json({
    success: true,
    checkDeviceMode: mode,
  });
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

    // 1. Lưu cấu hình vào server Next.js
    await saveLocalConfigMode(checkDeviceMode);

    // 2. Đồng bộ sang Google Apps Script (nếu có URL)
    const scriptUrl =
      GOOGLE_APPS_SCRIPT_URL && GOOGLE_APPS_SCRIPT_URL.startsWith('http') && !GOOGLE_APPS_SCRIPT_URL.includes('...')
        ? GOOGLE_APPS_SCRIPT_URL
        : process.env.GOOGLE_APPS_SCRIPT_URL;

    let gasSynced = false;
    if (scriptUrl) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
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
          gasSynced = true;
        }
      } catch (err) {
        console.warn('Could not sync mode to Google Apps Script:', err);
      }
    }

    return NextResponse.json({
      success: true,
      checkDeviceMode: checkDeviceMode,
      gasSynced,
      message: 'Cập nhật cấu hình chế độ đăng nhập thành công cho toàn bộ hệ thống!',
    });
  } catch (error) {
    console.error('Mode API POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi máy chủ khi lưu cấu hình.' },
      { status: 500 }
    );
  }
}
