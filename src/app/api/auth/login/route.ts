import { NextRequest, NextResponse } from 'next/server';
import { GOOGLE_APPS_SCRIPT_URL } from '@/config/auth';
import fs from 'fs/promises';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'src', 'config', 'auth_mode.json');

async function getSystemCheckDeviceMode(): Promise<boolean> {
  try {
    const data = await fs.readFile(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    if (typeof parsed.checkDeviceMode === 'boolean') {
      return parsed.checkDeviceMode;
    }
  } catch {}
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, deviceId, checkDevice, gasUrl } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu.' },
        { status: 400 }
      );
    }

    const systemMode = await getSystemCheckDeviceMode();
    const effectiveCheckDevice = typeof checkDevice === 'boolean' ? checkDevice : systemMode;

    // Nếu bật kiểm tra thiết bị mà chưa lấy được mã
    if (effectiveCheckDevice && !deviceId) {
      return NextResponse.json(
        { success: false, error: 'Không nhận diện được mã thiết bị (DeviceID).' },
        { status: 400 }
      );
    }

    const effectiveDeviceId = deviceId || 'DEV_SKIP_CHECK';

    // 1. Ưu tiên URL cấu hình trực tiếp trong code (src/config/auth.ts)
    // 2. Tiếp theo là biến môi trường
    // 3. Cuối cùng là URL từ client truyền lên (nếu có)
    const scriptUrl =
      (GOOGLE_APPS_SCRIPT_URL && GOOGLE_APPS_SCRIPT_URL.startsWith('http') && !GOOGLE_APPS_SCRIPT_URL.includes('...'))
        ? GOOGLE_APPS_SCRIPT_URL
        : (process.env.GOOGLE_APPS_SCRIPT_URL || process.env.NEXT_PUBLIC_GAS_URL || gasUrl);

    if (!scriptUrl || !scriptUrl.trim().startsWith('http')) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Chưa cấu hình URL Google Apps Script trong file src/config/auth.ts. Vui lòng mở file src/config/auth.ts và dán link Web App của bạn vào.',
          needsConfig: true,
        },
        { status: 400 }
      );
    }

    // Gửi request tới Google Apps Script Web App
    const response = await fetch(scriptUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'login',
        username: username.trim(),
        password: password.trim(),
        deviceId: effectiveDeviceId.trim(),
        skipDeviceCheck: !effectiveCheckDevice,
      }),
      redirect: 'follow',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Google Sheet phản hồi lỗi HTTP ${response.status}`);
    }

    const textData = await response.text();
    let data;
    try {
      data = JSON.parse(textData);
    } catch {
      throw new Error(
        'Phản hồi từ Google Apps Script không phải định dạng JSON hợp lệ. Vui lòng kiểm tra lại quyền triển khai (Ai có quyền truy cập: Bất kỳ ai).'
      );
    }

    // Nếu chọn KHÔNG KIỂM TRA MÃ MÁY:
    // Trường hợp Apps Script trả về isDeviceMismatch (nghĩa là tk và mk hoàn toàn chính xác, chỉ khác mã máy):
    if (!effectiveCheckDevice && data && !data.success && data.isDeviceMismatch) {
      return NextResponse.json({
        success: true,
        message: 'Đăng nhập thành công (Đã bỏ qua kiểm tra mã máy)!',
        user: {
          username: username.trim(),
          deviceId: effectiveDeviceId,
          fullName: username.trim(),
        },
      });
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Login API error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: `Không thể kết nối đến máy chủ Google Sheet: ${msg}. Vui lòng kiểm tra lại đường dẫn Web App trong src/config/auth.ts.`,
      },
      { status: 500 }
    );
  }
}
