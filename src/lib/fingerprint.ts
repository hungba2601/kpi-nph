import FingerprintJS from '@fingerprintjs/fingerprintjs';

// Fallback hàm băm đơn giản nếu môi trường không có crypto.subtle
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36).toUpperCase().padStart(8, '0');
}

// Fallback Canvas & Hardware Fingerprinting dự phòng
function getHardwareFallback(): string {
  if (typeof window === 'undefined') return 'SERVER_DEVICE';

  const components: string[] = [];
  try {
    // 1. Screen & Color
    components.push(`${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`);
    components.push(`${window.screen.availWidth}x${window.screen.availHeight}`);
    components.push(`ratio:${window.devicePixelRatio || 1}`);

    // 2. Timezone & Locale
    components.push(Intl.DateTimeFormat().resolvedOptions().timeZone || '');
    components.push(navigator.language || '');

    // 3. Hardware Concurrency & Memory
    components.push(`cores:${navigator.hardwareConcurrency || 4}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const navAny = navigator as any;
    if (navAny.deviceMemory) components.push(`mem:${navAny.deviceMemory}`);
    if (navigator.platform) components.push(`plat:${navigator.platform}`);

    // 4. Canvas Fingerprint
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = "14px 'Arial'";
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('KPI_AUTH_DEVICE_FINGERPRINT_2026', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('KPI_AUTH_DEVICE_FINGERPRINT_2026', 4, 17);
      components.push(`canvas:${canvas.toDataURL()}`);
    }

    // 5. WebGL Renderer
    try {
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const vendor = (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          components.push(`gl:${vendor}~${renderer}`);
        }
      }
    } catch {
      // Ignore WebGL error
    }
  } catch (e) {
    console.warn('Fallback fingerprint error:', e);
  }

  const rawString = components.join('||');
  return `DEV_${simpleHash(rawString)}`;
}

let cachedDeviceId: string | null = null;

/**
 * Lấy mã DeviceID duy nhất của thiết bị bằng Browser Fingerprinting
 * Không phụ thuộc vào localStorage hay Cookie (xóa cache/chế độ ẩn danh vẫn giữ nguyên mã máy).
 */
export async function getDeviceFingerprint(): Promise<string> {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  try {
    // 1. Thử lấy bằng thư viện FingerprintJS chuẩn
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    if (result && result.visitorId) {
      cachedDeviceId = `FP_${result.visitorId.toUpperCase()}`;
      return cachedDeviceId;
    }
  } catch (err) {
    console.warn('FingerprintJS load failed, using hardware fallback:', err);
  }

  // 2. Dự phòng bằng thuật toán phần cứng Canvas + WebGL
  const fallbackId = getHardwareFallback();
  cachedDeviceId = fallbackId;
  return cachedDeviceId;
}
