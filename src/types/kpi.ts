export interface KPIItem {
  id?: string;
  stt: number;
  maDonVi: string;
  tenCongViec: string;
  ketQuaDauRa: string;
  thoiHanHoanThanh: string;
  loaiCongViec: 'Thường xuyên' | 'Đột xuất';
  diemChuan: number;
  heSoDoKho: number;
  diemQuyDoi: number;
  minhChung: string;
  ghiChu: string;
  trucKetQua: string;
  trangThai: 'Hoạt động' | 'Không hoạt động';
  kyDanhGia: string;
}

export interface KPIConfig {
  apiKey: string;
  model: string;
  maDonVi: string;
  tenDonVi: string;
  kyDanhGia: string;
}

export const DEFAULT_TRUC_LIST = [
  'TRỤC 1 - THỰC HIỆN MỤC TIÊU PHÁT TRIỂN KINH TẾ - XÃ HỘI VÀ NHIỆM VỤ CHÍNH TRỊ ĐƯỢC GIAO',
  'TRỤC 2 - HOÀN THIỆN THỂ CHẾ, ĐẨY MẠNH PHÂN CẤP, PHÂN QUYỀN GẮN VỚI KIỂM TRA, GIÁM SÁT',
  'TRỤC 3 - THÚC ĐẨY PHÁT TRIỂN KHOA HỌC, CÔNG NGHỆ, ĐỔI MỚI SÁNG TẠO VÀ CHUYỂN ĐỔI SỐ',
  'TRỤC 4 - XÂY DỰNG ĐẢNG VÀ HỆ THỐNG CHÍNH TRỊ TRONG SẠCH, VỮNG MẠNH; GIỮ GÌN ĐOÀN KẾT, THỐNG NHẤT NỘI BỘ; PHÒNG, CHỐNG THAM NHŨNG, LÃNG PHÍ, TIÊU CỰC',
  'TRỤC 5 - PHÁT TRIỂN VĂN HÓA, CON NGƯỜI, BẢO ĐẢM AN SINH XÃ HỘI, NÂNG CAO ĐỜI SỐNG NHÂN DÂN',
  'TRỤC 6 - CỦNG CỐ QUỐC PHÒNG, AN NINH, GIỮ VỮNG ỔN ĐỊNH CHÍNH TRỊ - XÃ HỘI, NÂNG CAO HIỆU QUẢ ĐỐI NGOẠI VÀ HỘI NHẬP QUỐC TẾ',
] as const;

export const DEFAULT_DON_VI_LIST = [
  { code: 'H29.205.10', name: 'Trường THCS An Nhơn' },
  { code: 'H29.205.01', name: 'Trường Tiểu học An Nhơn' },
  { code: 'H29.205.99', name: 'Đơn vị khác / Tùy chỉnh' },
];

export const DEFAULT_KY_LIST = [
  { code: '(Chính thức)KPI-Q4-2026', name: '(Chính thức) Đánh giá Quý IV/2026' },
  { code: '(Chính thức)KPI-Q3-2026', name: '(Chính thức) Đánh giá Quý III/2026' },
  { code: '(Chính thức)KPI-Q1-2027', name: '(Chính thức) Đánh giá Quý I/2027' },
  { code: 'VIETTELTAPHUAN01.10', name: 'Viettel tập huấn 01_10' },
];

export const AVAILABLE_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Mô hình đa năng, tốc độ phản hồi nhanh' },
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', desc: 'Mô hình hiệu năng cao, cân bằng và chuẩn xác' },
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash (Mặc định - Khuyến nghị)', desc: 'Mô hình thế hệ mới tối ưu tốc độ và trích xuất cấu trúc dữ liệu KPI' },
  { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash', desc: 'Mô hình nâng cao với khả năng xử lý ngữ cảnh sâu' },
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', desc: 'Mô hình thế hệ mới nhất, suy luận mạnh mẽ' },
];

export const SAMPLE_TEXTS = [
  {
    title: 'Kế hoạch công tác chuyên môn GV THCS (Quý IV)',
    content: `KẾ HOẠCH CÔNG TÁC CÁ NHÂN QUÝ IV/2026
Họ và tên giáo viên: Nguyễn Văn A - Tổ Khoa học Tự nhiên
Nhiệm vụ trọng tâm trong quý:
1. Thực hiện giảng dạy chương trình GDPT 2018 môn Khoa học tự nhiên lớp 7 và lớp 8 theo đúng phân phối chương trình và kế hoạch giáo dục. Soạn giáo án bài dạy đầy đủ trước khi lên lớp, hoàn thành sổ báo giảng hàng tuần. Hạn chót: 20/12/2026.
2. Kiểm tra, đánh giá thường xuyên học sinh qua hệ thống bài kiểm tra định kỳ 15 phút, 1 tiết và nhận xét đánh giá thường xuyên trên sổ theo dõi điện tử. Hạn chót: 20/12/2026.
3. Tham gia ra đề thi, coi thi và chấm thi kiểm tra đánh giá cuối học kỳ 1 năm học 2026-2027 theo phân công của Ban giám hiệu và tổ chuyên môn. Hạn chót: 25/12/2026.
4. Tham gia sinh hoạt tổ chuyên môn, họp Hội đồng sư phạm đầy đủ các tháng 10, 11, 12 năm 2026. Hoàn thành ghi chép sổ họp và biên bản. Hạn chót: 20/12/2026.
5. Xây dựng ít nhất 02 bài giảng điện tử tương tác ứng dụng CNTT, phần mềm mô phỏng và học liệu số đưa lên kho học liệu của nhà trường. Hạn chót: 20/12/2026.
6. Tham gia tổ chức chuỗi hoạt động văn nghệ, hội giảng chào mừng kỷ niệm 44 năm ngày Nhà giáo Việt Nam 20/11. Hoàn thành trước 01/12/2026.
7. Hướng dẫn học sinh tham gia cuộc thi Nghiên cứu Khoa học Kỹ thuật cấp trường và cấp quận năm học 2026-2027. Dự kiến có 01 sản phẩm dự thi đạt giải. Hạn chót: 15/12/2026.
8. Hoàn thành công tác bồi dưỡng thường xuyên module nâng cao phương pháp giảng dạy trên hệ thống TEMIS của Bộ GD&ĐT. Hạn chót: 10/12/2026.`
  },
  {
    title: 'Nhiệm vụ công tác hành chính - quản lý trường học',
    content: `BÁO CÁO PHÂN CÔNG NHIỆM VỤ THỰC HIỆN QUÝ IV
Đơn vị: Trường THCS An Nhơn
1. Thực hiện rà soát quy chế làm việc, quy chế chi tiêu nội bộ năm học 2026-2027, tham mưu Ban giám hiệu ban hành văn bản sửa đổi bổ sung. Hoàn thành: 15/11/2026.
2. Triển khai kế hoạch chuyển đổi số trong quản lý hồ sơ sổ sách, ký số học bạ và giáo án trên hệ thống quản lý trường học trực tuyến. Hoàn thành: 20/12/2026.
3. Tổ chức kiểm tra an toàn vệ sinh lao động, phòng cháy chữa cháy và an ninh trật tự trường học trước kỳ thi học kỳ I. Hoàn thành: 05/12/2026.
4. Phối hợp với Công đoàn cơ sở tổ chức Hội nghị Viên chức - Người lao động năm học 2026-2027. Văn kiện biên bản ban hành trước 20/10/2026.
5. Tham gia đoàn kiểm tra chuyên đề quy chế chuyên môn và hồ sơ sổ sách của các tổ bộ môn đợt 1 năm học 2026-2027. Hoàn thành: 30/11/2026.`
  }
];
