import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DEFAULT_TRUC_LIST, KPIItem } from '@/types/kpi';
import { parseKPIWithAlgorithm } from '@/lib/kpiAlgorithm';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const {
      text,
      apiKey,
      model = 'gemini-3.6-flash',
      maDonVi = 'H29.205.10',
      kyDanhGia = '(Chính thức)KPI-Q4-2026',
      mode = 'auto', // 'algorithm' | 'ai' | 'auto'
    } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Nội dung văn bản đầu vào trống' }, { status: 400 });
    }

    const geminiKey = (apiKey || process.env.GEMINI_API_KEY || '').trim();

    // KỊCH BẢN 1: Người dùng yêu cầu chạy Thuật toán HOẶC không có API Key
    if (mode === 'algorithm' || !geminiKey) {
      const items = parseKPIWithAlgorithm(text, { maDonVi, kyDanhGia });
      const executionTimeMs = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        count: items.length,
        items,
        modeUsed: 'algorithm',
        message: !geminiKey
          ? 'Đã bóc tách thành công bằng Thuật toán chuẩn (Không cần API Key)'
          : 'Đã bóc tách siêu tốc bằng Thuật toán quy tắc chuyên môn',
        executionTimeMs,
      });
    }

    // KỊCH BẢN 2: Người dùng có API Key và yêu cầu chạy AI
    const genAI = new GoogleGenerativeAI(geminiKey);

    // Prepare model fallback chain
    const requested = (model || 'gemini-3.6-flash').toLowerCase();
    const candidateModels = [
      requested,
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
    ].filter((m, idx, arr) => arr.indexOf(m) === idx);

    const systemPrompt = `Bạn là một chuyên gia phân tích và thiết lập KPI / Danh mục sản phẩm chuẩn của giáo viên và viên chức theo quy định của ngành Giáo dục & Đào tạo.
Nhiệm vụ của bạn: Đọc toàn bộ nội dung văn bản đầu vào do người dùng cung cấp (kế hoạch công tác, phân công nhiệm vụ, báo cáo hoạt động...), bóc tách chi tiết thành từng đầu mục công việc cụ thể và chuẩn hóa thành danh mục KPI.

Các yêu cầu bắt buộc:
1. Mỗi công việc phải được phân loại chính xác vào 1 trong đúng 6 TRỤC KẾT QUẢ TRỌNG TÂM sau (ghi chính xác từng ký tự):
${DEFAULT_TRUC_LIST.map((t) => `   - "${t}"`).join('\n')}

2. Quy tắc các trường thông tin:
   - "tenCongViec": Ghi nội dung ngắn gọn, súc tích, phản ánh đúng nhiệm vụ (ví dụ: "Thực hiện kế hoạch giảng dạy, kế hoạch bài dạy (giáo án) chương trình GDPT 2018 Quý IV/2026").
   - "ketQuaDauRa": Bắt buộc ghi loại văn bản hoặc sản phẩm cụ thể (ví dụ: "Kế hoạch bài dạy, Lịch báo giảng", "Sổ điểm, Bài kiểm tra có lời nhận xét", "Biên bản họp", "Bài giảng điện tử, Học liệu số").
   - "thoiHanHoanThanh": Ghi ngày cụ thể định dạng DD/MM/YYYY (ví dụ: "20/12/2026", "25/12/2026", "01/12/2026"). Nếu trong văn bản không ghi rõ ngày, hãy ước lượng ngày hợp lý trong kỳ đánh giá.
   - "loaiCongViec": Chỉ chọn 1 trong 2 giá trị: "Thường xuyên" hoặc "Đột xuất".
   - "diemChuan": 10 nếu là "Thường xuyên", 12 nếu là "Đột xuất".
   - "heSoDoKho": Chọn số thập phân: 1 (100% cho việc thông thường), 1.1 (110% cho việc phối hợp nhiều bên hoặc chuyên môn cao hơn), hoặc 1.2 (120% cho việc đặc biệt quan trọng/phức tạp).
   - "minhChung": Hồ sơ, minh chứng cụ thể chứng minh kết quả (ví dụ: "Kế hoạch bài dạy (in/ký số), Sổ báo giảng", "Danh sách điểm danh, Sổ ghi chép cá nhân").
   - "ghiChu": Thông tin chú thích thêm nếu cần, hoặc để rỗng "".
   - "trucKetQua": Phải là 1 trong 6 tên Trục đầy đủ đã nêu ở trên.
   - "maDonVi": "${maDonVi}"
   - "trangThai": "Hoạt động"
   - "kyDanhGia": "${kyDanhGia}"

3. Trả về định dạng JSON thuần túy là một mảng (array) các object, cấu trúc:
[
  {
    "stt": 1,
    "maDonVi": "${maDonVi}",
    "tenCongViec": "...",
    "ketQuaDauRa": "...",
    "thoiHanHoanThanh": "DD/MM/YYYY",
    "loaiCongViec": "Thường xuyên",
    "diemChuan": 10,
    "heSoDoKho": 1,
    "diemQuyDoi": 10,
    "minhChung": "...",
    "ghiChu": "",
    "trucKetQua": "TRỤC ...",
    "trangThai": "Hoạt động",
    "kyDanhGia": "${kyDanhGia}"
  }
]`;

    const userPrompt = `Dưới đây là văn bản kế hoạch / phân công công việc cần trích xuất và chuẩn hóa KPI:
---
${text}
---

Hãy phân tích toàn diện, bóc tách đầy đủ các nhiệm vụ và trả về mảng JSON đúng theo quy cách.`;

    let lastError: unknown = null;
    let responseText = '';
    let executedModel = requested;

    for (const modelCandidate of candidateModels) {
      try {
        const genModel = genAI.getGenerativeModel({
          model: modelCandidate,
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        });

        let attempt = 0;
        const maxAttempts = 2;
        let successResult = null;

        while (attempt < maxAttempts) {
          try {
            attempt++;
            successResult = await genModel.generateContent({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
                },
              ],
            });
            break;
          } catch (callErr: unknown) {
            const errStr = String(callErr || '');
            const is503 = errStr.includes('503') || errStr.includes('high demand') || errStr.includes('Service Unavailable');
            const is429 = errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED');

            if ((is503 || is429) && attempt < maxAttempts) {
              await new Promise((r) => setTimeout(r, 1000));
              continue;
            }
            throw callErr;
          }
        }

        if (successResult) {
          responseText = successResult.response.text();
          executedModel = modelCandidate;
          lastError = null;
          break;
        }
      } catch (err: unknown) {
        lastError = err;
        console.warn(`Model "${modelCandidate}" failed:`, err instanceof Error ? err.message : err);
      }
    }

    // Nếu AI gặp lỗi (hết quota, 503, mạng...), TỰ ĐỘNG DỰ PHÒNG bằng thuật toán
    if (!responseText) {
      console.warn('AI failed, falling back to algorithm parser:', lastError);
      const items = parseKPIWithAlgorithm(text, { maDonVi, kyDanhGia });
      return NextResponse.json({
        success: true,
        count: items.length,
        items,
        modeUsed: 'algorithm_fallback',
        message: 'Mô hình AI đang bận hoặc quá tải, hệ thống đã tự động bóc tách chính xác bằng Thuật toán nội bộ.',
        executionTimeMs: Date.now() - startTime,
      });
    }

    let parsedItems: Partial<KPIItem>[] = [];
    try {
      const cleaned = responseText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      parsedItems = JSON.parse(cleaned);
      if (!Array.isArray(parsedItems)) {
        if (typeof parsedItems === 'object' && parsedItems !== null) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const values = Object.values(parsedItems).find(Array.isArray) as any[];
          if (values) parsedItems = values;
        }
      }
    } catch {
      // Nếu AI parse JSON lỗi, fallback ngay sang thuật toán
      const items = parseKPIWithAlgorithm(text, { maDonVi, kyDanhGia });
      return NextResponse.json({
        success: true,
        count: items.length,
        items,
        modeUsed: 'algorithm_fallback',
        message: 'Tự động hoàn tất bằng Thuật toán chuẩn hóa.',
        executionTimeMs: Date.now() - startTime,
      });
    }

    // Format & validate each item
    const formattedItems: KPIItem[] = parsedItems.map((item, index) => {
      const loai = item.loaiCongViec === 'Đột xuất' ? 'Đột xuất' : 'Thường xuyên';
      const diemChuan = loai === 'Đột xuất' ? 12 : 10;
      const heSo = typeof item.heSoDoKho === 'number' && item.heSoDoKho > 0 ? item.heSoDoKho : 1;
      const diemQuyDoi = Math.round(diemChuan * heSo * 10) / 10;

      let truc = item.trucKetQua || DEFAULT_TRUC_LIST[0];
      const matchedTruc = DEFAULT_TRUC_LIST.find((t) =>
        t.toLowerCase().includes(truc.toLowerCase().slice(0, 8))
      );
      if (matchedTruc) truc = matchedTruc;

      return {
        id: `kpi-${Date.now()}-${index + 1}`,
        stt: index + 1,
        maDonVi: item.maDonVi || maDonVi,
        tenCongViec: item.tenCongViec || `Nhiệm vụ số ${index + 1}`,
        ketQuaDauRa: item.ketQuaDauRa || 'Kế hoạch / Báo cáo thực hiện',
        thoiHanHoanThanh: item.thoiHanHoanThanh || '20/12/2026',
        loaiCongViec: loai,
        diemChuan: diemChuan,
        heSoDoKho: heSo,
        diemQuyDoi: diemQuyDoi,
        minhChung: item.minhChung || 'Hồ sơ, sổ theo dõi cá nhân',
        ghiChu: item.ghiChu || '',
        trucKetQua: truc,
        trangThai: 'Hoạt động',
        kyDanhGia: item.kyDanhGia || kyDanhGia,
      };
    });

    return NextResponse.json({
      success: true,
      count: formattedItems.length,
      items: formattedItems,
      executedModel,
      modeUsed: 'ai',
      executionTimeMs: Date.now() - startTime,
    });
  } catch (error: unknown) {
    console.error('Generation error:', error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Lỗi xử lý dữ liệu: ${errMsg}` },
      { status: 500 }
    );
  }
}
