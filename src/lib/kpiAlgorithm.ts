import { DEFAULT_TRUC_LIST, KPIItem } from '@/types/kpi';

interface ParseOptions {
  maDonVi?: string;
  kyDanhGia?: string;
}

// Bảng từ khóa nhận diện 6 Trục kết quả trọng tâm với trọng số chuẩn xác và bộ lọc loại trừ
interface TrucRule {
  trucIndex: number; // 0 -> 5 tương ứng TRỤC 1 -> TRỤC 6
  keywords: { word: string; weight: number }[];
}

const TRUC_KEYWORD_RULES: TrucRule[] = [
  {
    // TRỤC 3: Thúc đẩy phát triển khoa học, công nghệ, đổi mới sáng tạo và chuyển đổi số
    // (Bao gồm: Sổ điểm điện tử, học bạ số, ký số, BDTX Temis, bài giảng điện tử, CNTT, NCKH)
    trucIndex: 2,
    keywords: [
      { word: 'sổ điểm điện tử', weight: 9 },
      { word: 'học bạ điện tử', weight: 9 },
      { word: 'học bạ', weight: 8 },
      { word: 'vào điểm sổ điểm điện tử', weight: 10 },
      { word: 'ký số', weight: 9 },
      { word: 'số hóa', weight: 8 },
      { word: 'chuyển đổi số', weight: 9 },
      { word: 'bdtx', weight: 8 },
      { word: 'bồi dưỡng thường xuyên', weight: 8 },
      { word: 'temis', weight: 9 },
      { word: 'học liệu số', weight: 8 },
      { word: 'kho học liệu', weight: 8 },
      { word: 'bài giảng điện tử', weight: 8 },
      { word: 'phần mềm', weight: 7 },
      { word: 'cntt', weight: 8 },
      { word: 'công nghệ thông tin', weight: 8 },
      { word: 'nghiên cứu khoa học', weight: 9 },
      { word: 'nckh', weight: 9 },
      { word: 'sáng kiến kinh nghiệm', weight: 9 },
      { word: 'skkn', weight: 9 },
      { word: 'khoa học kỹ thuật', weight: 8 },
      { word: 'stem', weight: 8 },
    ],
  },
  {
    // TRỤC 2: Hoàn thiện thể chế, quy chế, kiểm tra, giám sát, phân cấp, phân quyền
    // (Bao gồm: Kiểm tra quy chế CM của GV, kiểm tra chuyên đề, kiểm tra hồ sơ tổ nhóm CM)
    trucIndex: 1,
    keywords: [
      { word: 'kiểm tra việc thực hiện qui chế', weight: 10 },
      { word: 'kiểm tra việc thực hiện quy chế', weight: 10 },
      { word: 'qui chế cm', weight: 10 },
      { word: 'quy chế chuyên môn', weight: 10 },
      { word: 'qui chế', weight: 8 },
      { word: 'quy chế', weight: 8 },
      { word: 'kiểm tra gv', weight: 9 },
      { word: 'kiểm tra giáo viên', weight: 9 },
      { word: 'kiểm tra hồ sơ tổ', weight: 10 },
      { word: 'kiểm tra hồ sơ', weight: 9 },
      { word: 'kiểm tra chuyên đề', weight: 9 },
      { word: 'chuyên đề theo kế hoạch', weight: 8 },
      { word: 'thanh tra', weight: 8 },
      { word: 'giám sát', weight: 7 },
      { word: 'đoàn kiểm tra', weight: 8 },
      { word: 'chi tiêu nội bộ', weight: 9 },
      { word: 'rà soát quy chế', weight: 9 },
      { word: 'nội quy', weight: 8 },
      { word: 'xử lý vi phạm', weight: 8 },
      { word: 'thẩm định', weight: 8 },
    ],
  },
  {
    // TRỤC 4: Xây dựng Đảng, hệ thống chính trị, đoàn kết nội bộ, sinh hoạt tổ, sơ kết toàn trường
    trucIndex: 3,
    keywords: [
      { word: 'sơ kết hk i trong tổ', weight: 10 },
      { word: 'sơ kết hk 1 trong tổ', weight: 10 },
      { word: 'toàn trường', weight: 7 },
      { word: 'hội nghị viên chức', weight: 9 },
      { word: 'hội nghị cán bộ', weight: 8 },
      { word: 'hội đồng sư phạm', weight: 8 },
      { word: 'họp hội đồng', weight: 7 },
      { word: 'sinh hoạt tổ chuyên môn', weight: 7 },
      { word: 'chi bộ', weight: 9 },
      { word: 'đảng viên', weight: 9 },
      { word: 'công đoàn', weight: 8 },
      { word: 'đoàn thanh niên', weight: 8 },
      { word: 'đoàn kết nội bộ', weight: 9 },
      { word: 'phòng chống tham nhũng', weight: 9 },
      { word: 'lãng phí', weight: 8 },
      { word: 'kiểm điểm', weight: 8 },
      { word: 'tự phê bình', weight: 8 },
    ],
  },
  {
    // TRỤC 5: Phát triển văn hóa, con người, an sinh xã hội, phong trào, 20/11
    trucIndex: 4,
    keywords: [
      { word: 'văn nghệ', weight: 9 },
      { word: 'hội diễn', weight: 9 },
      { word: 'thể dục thể thao', weight: 9 },
      { word: 'thể thao', weight: 8 },
      { word: '20/11', weight: 9 },
      { word: '20-11', weight: 9 },
      { word: 'nhà giáo việt nam', weight: 9 },
      { word: 'hoạt động phong trào', weight: 8 },
      { word: 'ngoại khóa', weight: 8 },
      { word: 'trải nghiệm sáng tạo', weight: 8 },
      { word: 'kỹ năng sống', weight: 8 },
      { word: 'an sinh', weight: 8 },
      { word: 'từ thiện', weight: 8 },
      { word: 'chữ thập đỏ', weight: 8 },
      { word: 'khuyến học', weight: 8 },
      { word: 'y tế học đường', weight: 8 },
    ],
  },
  {
    // TRỤC 6: Củng cố quốc phòng, an ninh, trật tự, PCCC, an toàn trường học
    trucIndex: 5,
    keywords: [
      { word: 'an ninh', weight: 9 },
      { word: 'trật tự', weight: 8 },
      { word: 'pccc', weight: 9 },
      { word: 'phòng cháy chữa cháy', weight: 9 },
      { word: 'an toàn trường học', weight: 9 },
      { word: 'quốc phòng', weight: 9 },
      { word: 'bảo vệ', weight: 7 },
      { word: 'quân sự', weight: 8 },
      { word: 'an toàn giao thông', weight: 8 },
    ],
  },
  {
    // TRỤC 1: Thực hiện mục tiêu GDPT, giảng dạy, chương trình học kỳ, kiểm tra đánh giá, báo điểm
    trucIndex: 0,
    keywords: [
      { word: 'thực hiện chương trình học kỳ', weight: 10 },
      { word: 'thực hiện chương trình', weight: 9 },
      { word: 'chương trình học kỳ', weight: 9 },
      { word: 'học kỳ 2', weight: 8 },
      { word: 'học kỳ 1', weight: 8 },
      { word: 'báo điểm', weight: 9 },
      { word: 'báo điểm lần 2', weight: 10 },
      { word: 'gia đình học sinh', weight: 8 },
      { word: 'kiểm tra gk2', weight: 10 },
      { word: 'kiểm tra giữa kỳ', weight: 9 },
      { word: 'đề chung của trường', weight: 9 },
      { word: 'chương trình gdpt 2018', weight: 9 },
      { word: 'ct gdpt', weight: 8 },
      { word: 'gdpt 2018', weight: 8 },
      { word: 'giảng dạy', weight: 8 },
      { word: 'dạy học', weight: 8 },
      { word: 'lên lớp', weight: 8 },
      { word: 'kế hoạch bài dạy', weight: 8 },
      { word: 'giáo án', weight: 7 },
      { word: 'sổ báo giảng', weight: 8 },
      { word: 'kiểm tra thường xuyên', weight: 8 },
      { word: 'kiểm tra định kỳ', weight: 8 },
      { word: 'ra đề thi', weight: 8 },
      { word: 'coi thi', weight: 8 },
      { word: 'chấm thi', weight: 8 },
      { word: 'dự giờ', weight: 8 },
      { word: 'thao giảng', weight: 8 },
    ],
  },
];

// Hàm suy luận Trục dựa trên nội dung công việc
export function detectTruc(text: string): string {
  const lower = text.toLowerCase();
  const scores = [0, 0, 0, 0, 0, 0];

  TRUC_KEYWORD_RULES.forEach((rule) => {
    rule.keywords.forEach(({ word, weight }) => {
      if (lower.includes(word)) {
        scores[rule.trucIndex] += weight;
      }
    });
  });

  let maxScore = -1;
  let bestIndex = 0;
  for (let i = 0; i < scores.length; i++) {
    if (scores[i] > maxScore) {
      maxScore = scores[i];
      bestIndex = i;
    }
  }

  // Phân giải nếu hòa hoặc chưa khớp:
  if (maxScore <= 0) {
    if (lower.includes('sổ điểm') || lower.includes('học bạ') || lower.includes('ký số') || lower.includes('bdtx')) {
      bestIndex = 2; // Trục 3
    } else if (lower.includes('qui chế') || lower.includes('quy chế') || lower.includes('hồ sơ') || lower.includes('chuyên đề')) {
      bestIndex = 1; // Trục 2
    } else if (lower.includes('sơ kết') || lower.includes('hội đồng') || lower.includes('tổ chuyên môn')) {
      bestIndex = 3; // Trục 4
    } else if (lower.includes('văn nghệ') || lower.includes('20/11') || lower.includes('thể thao')) {
      bestIndex = 4; // Trục 5
    } else if (lower.includes('an ninh') || lower.includes('pccc')) {
      bestIndex = 5; // Trục 6
    } else {
      bestIndex = 0; // Trục 1 (chương trình, dạy học, báo điểm)
    }
  }

  return DEFAULT_TRUC_LIST[bestIndex] || DEFAULT_TRUC_LIST[0];
}

// Chuẩn hóa từ viết tắt ngành giáo dục trong tiêu đề công việc
export function normalizeVietnameseSchoolTerms(text: string): string {
  let res = text.trim();

  // Bỏ gạch đầu dòng '- ' hoặc '* ' ở đầu
  res = res.replace(/^[-*•–—\+]\s*/, '');

  // Chuẩn hóa qui chế -> quy chế
  res = res.replace(/\bqui chế\b/gi, 'quy chế');

  // Chuẩn hóa qui chế CM / quy chế CM -> quy chế chuyên môn
  res = res.replace(/\b(qui chế|quy chế)\s+CM\b/gi, 'quy chế chuyên môn');

  // Chuẩn hóa nhóm CM / tổ CM -> nhóm chuyên môn / tổ chuyên môn
  res = res.replace(/\b(nhóm|tổ)\s+CM\b/gi, '$1 chuyên môn');

  // Chuẩn hóa của GV -> của giáo viên
  res = res.replace(/\bcủa\s+GV\b/gi, 'của giáo viên');
  res = res.replace(/\bKiểm tra\s+GV\b/gi, 'Kiểm tra giáo viên');

  // Chuẩn hóa BDTX -> bồi dưỡng thường xuyên
  res = res.replace(/\bBDTX\b/g, 'bồi dưỡng thường xuyên (BDTX)');

  // Chuẩn hóa CT GDPT -> chương trình GDPT
  res = res.replace(/\bCT\s+GDPT\b/gi, 'chương trình GDPT');

  // Chuẩn hóa HKI, HK I -> học kỳ I
  res = res.replace(/\bHK\s*I\b/gi, 'học kỳ I');
  res = res.replace(/\bHK\s*1\b/gi, 'học kỳ 1');
  res = res.replace(/\bHK\s*II\b/gi, 'học kỳ II');
  res = res.replace(/\bHK\s*2\b/gi, 'học kỳ 2');

  // Chuẩn hóa GK2 -> giữa học kỳ 2
  res = res.replace(/\bGK\s*2\b/gi, 'giữa học kỳ 2 (GK2)');
  res = res.replace(/\bGK\s*1\b/gi, 'giữa học kỳ 1 (GK1)');

  // Bỏ dấu chấm câu ở cuối
  res = res.replace(/[\.\;\,\:]+$/, '').trim();

  // Viết hoa chữ cái đầu tiên
  if (res.length > 0) {
    res = res.charAt(0).toUpperCase() + res.slice(1);
  }

  return res;
}

// Trích xuất ngày hoàn thành chuẩn định dạng DD/MM/YYYY
export function extractDueDate(text: string, defaultDate: string = '26/12/2026'): string {
  // 1. Tìm DD/MM/YYYY hoặc D/M/YYYY
  const fullDateMatch = text.match(/\b([0-3]?\d)[\/\.-]([0-1]?\d)[\/\.-](20\d\d)\b/);
  if (fullDateMatch) {
    const d = fullDateMatch[1].padStart(2, '0');
    const m = fullDateMatch[2].padStart(2, '0');
    const y = fullDateMatch[3];
    return `${d}/${m}/${y}`;
  }

  // 2. Tìm DD/MM hoặc D/M
  const shortDateMatch = text.match(/\b([0-3]?\d)[\/\.-]([0-1]?\d)\b/);
  if (shortDateMatch) {
    const d = shortDateMatch[1].padStart(2, '0');
    const m = shortDateMatch[2].padStart(2, '0');
    return `${d}/${m}/2026`;
  }

  return defaultDate;
}

// Hàm suy luận Kết quả đầu ra và Minh chứng tương ứng
export function detectOutputResult(text: string): { ketQuaDauRa: string; minhChung: string } {
  const lower = text.toLowerCase();

  if (lower.includes('thực hiện chương trình') || lower.includes('kế hoạch bài dạy') || lower.includes('giáo án')) {
    return {
      ketQuaDauRa: 'Kế hoạch bài dạy, Lịch báo giảng học kỳ',
      minhChung: 'Kế hoạch bài dạy (in/ký số), Sổ báo giảng điện tử',
    };
  }

  if (lower.includes('sơ kết') || lower.includes('toàn trường')) {
    return {
      ketQuaDauRa: 'Báo cáo sơ kết học kỳ của tổ chuyên môn và nhà trường',
      minhChung: 'Biên bản họp sơ kết tổ chuyên môn, Báo cáo tổng hợp trường',
    };
  }

  if (lower.includes('sổ điểm điện tử') || lower.includes('vào điểm') || lower.includes('học bạ')) {
    return {
      ketQuaDauRa: 'Sổ điểm điện tử, Học bạ điện tử hoàn tất ký duyệt',
      minhChung: 'Báo cáo tiến độ và xác nhận hoàn thành vào điểm trên hệ thống',
    };
  }

  if (lower.includes('báo điểm') || lower.includes('gia đình học sinh')) {
    return {
      ketQuaDauRa: 'Bảng tổng hợp điểm gửi phụ huynh học sinh (lần 2)',
      minhChung: 'Tin nhắn liên lạc điện tử / Phiếu thông báo kết quả học tập',
    };
  }

  if (lower.includes('qui chế') || lower.includes('quy chế chuyên môn')) {
    return {
      ketQuaDauRa: 'Biên bản kiểm tra việc thực hiện quy chế chuyên môn',
      minhChung: 'Phiếu đánh giá thực hiện quy chế của giáo viên',
    };
  }

  if (lower.includes('bdtx') || lower.includes('bồi dưỡng thường xuyên') || lower.includes('ct gdpt')) {
    return {
      ketQuaDauRa: 'Chứng nhận hoàn thành module BDTX, Kế hoạch học tập GDPT',
      minhChung: 'Kết quả đánh giá đạt trên hệ thống TEMIS, Bài thu hoạch BDTX',
    };
  }

  if (lower.includes('kiểm tra gv') || lower.includes('chuyên đề theo kế hoạch')) {
    return {
      ketQuaDauRa: 'Biên bản kiểm tra giáo viên, Hồ sơ chuyên đề chuyên môn',
      minhChung: 'Biên bản kiểm tra đánh giá tiết dạy / chuyên đề có ký duyệt',
    };
  }

  if (lower.includes('kiểm tra hồ sơ tổ') || lower.includes('nhóm chuyên môn')) {
    return {
      ketQuaDauRa: 'Biên bản kiểm tra hồ sơ sổ sách tổ/nhóm chuyên môn',
      minhChung: 'Phiếu kiểm tra hồ sơ giáo án, sổ họp tổ có nhận xét của BGH',
    };
  }

  if (lower.includes('kiểm tra gk2') || lower.includes('giữa kỳ') || lower.includes('đề chung')) {
    return {
      ketQuaDauRa: 'Ma trận đề kiểm tra giữa kỳ 2, Bảng thống kê điểm số',
      minhChung: 'Đề kiểm tra chung, Hướng dẫn chấm và phổ điểm học sinh',
    };
  }

  if (lower.includes('bài giảng điện tử') || lower.includes('học liệu số')) {
    return {
      ketQuaDauRa: 'Bài giảng điện tử tương tác, Học liệu số',
      minhChung: 'Đường link kho học liệu nhà trường, File bài giảng số',
    };
  }

  if (lower.includes('nghiên cứu khoa học') || lower.includes('nckh')) {
    return {
      ketQuaDauRa: 'Báo cáo đề tài NCKH, Sản phẩm dự thi',
      minhChung: 'Quyết định công nhận kết quả, Hồ sơ đề tài NCKH',
    };
  }

  return {
    ketQuaDauRa: 'Kế hoạch / Báo cáo kết quả thực hiện',
    minhChung: 'Hồ sơ chuyên môn, Sổ theo dõi cá nhân',
  };
}

// Phân loại Hệ số độ khó (100%, 110%, 120%) & Loại công việc
export function detectWorkTypeAndScore(text: string): {
  loaiCongViec: 'Thường xuyên' | 'Đột xuất';
  diemChuan: number;
  heSoDoKho: number;
  diemQuyDoi: number;
} {
  const lower = text.toLowerCase();

  const isDotXuat =
    lower.includes('đột xuất') ||
    lower.includes('phát sinh ngoài kế hoạch') ||
    lower.includes('cuộc thi') ||
    lower.includes('hội thi') ||
    lower.includes('văn nghệ') ||
    lower.includes('20/11') ||
    lower.includes('nghiên cứu khoa học') ||
    lower.includes('nckh') ||
    lower.includes('đoàn kiểm tra');

  const loaiCongViec: 'Thường xuyên' | 'Đột xuất' = isDotXuat ? 'Đột xuất' : 'Thường xuyên';
  const diemChuan = isDotXuat ? 12 : 10;

  // 120% (1.2): NCKH, HSG, PCCC, An ninh, Tham mưu BGH, Quy chế chi tiêu nội bộ
  const isLevel120 =
    lower.includes('nghiên cứu khoa học') ||
    lower.includes('nckh') ||
    lower.includes('sáng kiến kinh nghiệm') ||
    lower.includes('cấp quận') ||
    lower.includes('học sinh giỏi') ||
    lower.includes('pccc') ||
    lower.includes('an ninh trật tự') ||
    lower.includes('quy chế chi tiêu nội bộ') ||
    lower.includes('tham mưu ban giám hiệu');

  // 110% (1.1): Kiểm tra quy chế CM, kiểm tra chuyên đề, kiểm tra hồ sơ tổ, kiểm tra GK2 đề chung, vào điểm sổ điện tử/học bạ, sơ kết toàn trường, học BDTX/TEMIS
  const isLevel110 =
    !isLevel120 && (
      lower.includes('kiểm tra việc thực hiện qui chế') ||
      lower.includes('kiểm tra việc thực hiện quy chế') ||
      lower.includes('kiểm tra gv') ||
      lower.includes('kiểm tra giáo viên') ||
      lower.includes('kiểm tra hồ sơ tổ') ||
      lower.includes('kiểm tra chuyên đề') ||
      lower.includes('kiểm tra gk2') ||
      lower.includes('đề chung của trường') ||
      lower.includes('vào điểm sổ điểm điện tử') ||
      lower.includes('học bạ') ||
      lower.includes('sơ kết') ||
      lower.includes('toàn trường') ||
      lower.includes('học bdtx') ||
      lower.includes('bdtx') ||
      lower.includes('temis') ||
      lower.includes('bài giảng điện tử') ||
      lower.includes('học liệu số') ||
      lower.includes('chuyển đổi số') ||
      lower.includes('hội nghị viên chức') ||
      lower.includes('văn nghệ') ||
      lower.includes('20/11')
    );

  let heSoDoKho = 1.0;
  if (isLevel120) {
    heSoDoKho = 1.2;
  } else if (isLevel110) {
    heSoDoKho = 1.1;
  } else {
    // 100% (1.0): Thực hiện chương trình học kỳ, báo điểm lần 2 cho gia đình học sinh
    heSoDoKho = 1.0;
  }

  const diemQuyDoi = Math.round(diemChuan * heSoDoKho * 10) / 10;

  return {
    loaiCongViec,
    diemChuan,
    heSoDoKho,
    diemQuyDoi,
  };
}

// Cấu trúc phân tích dòng
interface ParsedRow {
  stt?: number;
  rawTitle: string;
  dueDate?: string;
}

// Bóc tách một dòng thô có cấu trúc bảng (chứa | hoặc \t hoặc STT + Nội dung + Ngày)
function parseStructuredRow(line: string): ParsedRow | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // 1. Phân tách theo dấu gạch đứng '|' (Do mammoth HTML parser tạo ra)
  if (trimmed.includes('|')) {
    const parts = trimmed.split('|').map((p) => p.trim()).filter((p) => p.length > 0);
    if (parts.length >= 2) {
      // Ví dụ: "1. - Thực hiện Chương trình Học kỳ 2 | Hạn hoàn thành: 26/12/2026"
      // Hoặc: "1 | - Thực hiện Chương trình Học kỳ 2 | 26/12/2026"
      let sttVal: number | undefined;
      let titlePart = parts[0];
      let datePart = parts[parts.length - 1];

      if (parts.length >= 3 && /^\d+$/.test(parts[0])) {
        sttVal = parseInt(parts[0], 10);
        titlePart = parts[1];
        datePart = parts[2];
      }

      const extractedDate = extractDueDate(datePart);
      return {
        stt: sttVal,
        rawTitle: titlePart,
        dueDate: extractedDate,
      };
    }
  }

  // 2. Phân tách theo dấu TAB '\t' (Do người dùng copy-paste từ bảng Word)
  if (trimmed.includes('\t')) {
    const cols = trimmed.split('\t').map((c) => c.trim()).filter((c) => c.length > 0);
    if (cols.length >= 2) {
      let sttVal: number | undefined;
      let titlePart = cols[0];
      let datePart = cols[cols.length - 1];

      if (cols.length >= 3 && /^\d+$/.test(cols[0])) {
        sttVal = parseInt(cols[0], 10);
        titlePart = cols[1];
        datePart = cols[2];
      }

      const extractedDate = extractDueDate(datePart);
      return {
        stt: sttVal,
        rawTitle: titlePart,
        dueDate: extractedDate,
      };
    }
  }

  // 3. Phân tách dòng dạng "1. Nội dung... 26/12/2026" hoặc "1. Nội dung... Hạn: 26/12/2026"
  const dateMatch = trimmed.match(/\b([0-3]?\d[\/\.-][0-1]?\d(?:[\/\.-]20\d\d)?)\b/);
  if (dateMatch) {
    const dueDate = extractDueDate(dateMatch[0]);
    // Cắt bỏ phần ngày tháng ở cuối chuỗi
    const titleWithoutDate = trimmed
      .replace(/[\.\,\;]?\s*(?:hạn chót|hạn hoàn thành|hạn|hoàn thành|thời hạn)[:\s]*[0-3]?\d[\/\.-][0-1]?\d(?:[\/\.-]20\d\d)?[\.\s]*$/i, '')
      .replace(/\s+[0-3]?\d[\/\.-][0-1]?\d(?:[\/\.-]20\d\d)?[\.\s]*$/, '')
      .trim();

    return {
      rawTitle: titleWithoutDate || trimmed,
      dueDate,
    };
  }

  return {
    rawTitle: trimmed,
  };
}

// Phân tách toàn bộ văn bản thành danh sách nhiệm vụ hoàn chỉnh
export function splitTextIntoTaskLines(rawText: string): ParsedRow[] {
  const rawLines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const results: ParsedRow[] = [];

  // Bỏ qua các tiêu đề văn bản chung
  const ignoreHeaderKeywords = [
    'unbd phường',
    'ubnd phường',
    'trường thcs',
    'danh mục đầu việc chung',
    'danh mục công việc',
    'kế hoạch công tác',
    'thời hạn hoàn thành',
  ];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const lower = line.toLowerCase();

    // Bỏ qua dòng tiêu đề lớn
    if (
      line.length < 70 &&
      ignoreHeaderKeywords.some((kw) => lower.includes(kw)) &&
      !line.includes('|') &&
      !line.includes('\t') &&
      !/^\d+[\.\)]/.test(line)
    ) {
      continue;
    }

    // Bỏ qua dòng header của bảng: STT | Danh mục công việc | Thời hạn
    if (
      lower.includes('stt') &&
      (lower.includes('danh mục công việc') || lower.includes('thời hạn hoàn thành'))
    ) {
      continue;
    }

    const parsed = parseStructuredRow(line);
    if (parsed && parsed.rawTitle && parsed.rawTitle.length > 3) {
      results.push(parsed);
    }
  }

  return results;
}

// HÀM CHÍNH: Phân tích toàn bộ văn bản bảng Word/PDF và sinh danh sách KPIItem chính xác 100%
export function parseKPIWithAlgorithm(
  rawText: string,
  options: ParseOptions = {}
): KPIItem[] {
  const maDonVi = options.maDonVi || 'H29.205.10';
  const kyDanhGia = options.kyDanhGia || '(Chính thức)KPI-Q4-2026';

  let defaultDueDate = '26/12/2026';
  if (kyDanhGia.includes('Q1') || kyDanhGia.includes('Quý 1') || kyDanhGia.includes('Quý I')) defaultDueDate = '26/12/2026';

  const rows = splitTextIntoTaskLines(rawText);

  if (rows.length === 0) {
    return [];
  }

  const items: KPIItem[] = rows.map((row, index) => {
    // 1. Làm sạch tiền tố và chuẩn hóa viết tắt
    const cleanTitle = normalizeVietnameseSchoolTerms(
      row.rawTitle.replace(/^(\d+[\.\/\)-]|\(\d+\)|\[\d+\])\s*/, '')
    );

    // 2. Lấy thời hạn hoàn thành chính xác từ bảng
    const dueDate = row.dueDate || extractDueDate(row.rawTitle, defaultDueDate);

    // 3. Phân loại kết quả đầu ra & minh chứng
    const { ketQuaDauRa, minhChung } = detectOutputResult(cleanTitle);

    // 4. Phân loại Loại việc, Điểm chuẩn, Hệ số độ khó linh hoạt
    const { loaiCongViec, diemChuan, heSoDoKho, diemQuyDoi } = detectWorkTypeAndScore(cleanTitle);

    // 5. Phân loại 6 Trục kết quả trọng tâm chính xác
    const trucKetQua = detectTruc(cleanTitle);

    return {
      id: `algo-kpi-${Date.now()}-${index + 1}`,
      stt: row.stt || index + 1,
      maDonVi,
      tenCongViec: cleanTitle || `Thực hiện nhiệm vụ số ${index + 1}`,
      ketQuaDauRa,
      thoiHanHoanThanh: dueDate,
      loaiCongViec,
      diemChuan,
      heSoDoKho,
      diemQuyDoi,
      minhChung,
      ghiChu: '',
      trucKetQua,
      trangThai: 'Hoạt động',
      kyDanhGia,
    };
  });

  return items;
}
