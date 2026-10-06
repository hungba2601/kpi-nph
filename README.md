# KPI Assistant - Trợ Lý Khởi Tạo KPI Chuẩn Mẫu Excel

Hệ thống hỗ trợ giáo viên và viên chức tự động bóc tách kế hoạch công tác từ file Word (.docx), PDF hoặc dữ liệu có sẵn, tự động phân loại nhiệm vụ vào 6 Trục kết quả trọng tâm và điền trực tiếp vào file mẫu Excel chuẩn `mau.xlsx`.

**Bản quyền:** Made by **Nguyễn Phi Hùng** - Zalo: **0938750424**

---

## 🌟 Tính Năng Nổi Bật

1. **⚡ Chế độ Xử lý nhanh bằng Thuật toán (TỨC THÌ - KHÔNG CẦN AI / API KEY)**:
   - **Tốc độ dưới 0.1 giây:** Phù hợp với công việc định kỳ lặp lại, không phải chờ AI phân tích lâu.
   - **Hoạt động hoàn toàn trên máy:** Không lo hết hạn quota API, không bị nghẽn mạng hay lỗi máy chủ AI.
   - Tự động nhận diện cấu trúc nhiệm vụ, gạch đầu dòng, số thứ tự.
   - Phân loại chính xác vào **6 Trục kết quả trọng tâm** dựa trên từ điển chuyên ngành Giáo dục & Đào tạo.
   - Tự động tính điểm chuẩn: Thường xuyên (10đ), Đột xuất (12đ), hệ số độ khó (1.0, 1.1, 1.2) và điểm quy đổi theo đúng quy chế.

2. **✨ Chế độ Tùy chọn Google Gemini AI**:
   - Dành cho người dùng muốn AI phân tích ngữ cảnh mở rộng sâu hơn.
   - Hỗ trợ các mô hình: Gemini 3.6 Flash, Gemini 3.8 Flash, Gemini 2.5 Flash.
   - Cơ chế tự động fallback thông minh sang Thuật toán quy tắc nếu AI quá tải.

3. **Trích xuất thông minh từ DOCX & PDF**:
   - Sử dụng `mammoth` để đọc tệp Word (.docx).
   - Sử dụng `pdf-parse` để đọc tệp PDF.
   - Hỗ trợ nhập trực tiếp văn bản với các mẫu văn bản gợi ý nhanh cho Giáo viên THCS và Hành chính.

4. **Tương thích hoàn toàn với mẫu `mau.xlsx`**:
   - Tự động đọc và lấy danh sách **Mã đơn vị** và **Kỳ đánh giá** trực tiếp từ file mẫu.
   - Hỗ trợ **tải lên file mẫu khác (.xlsx)** để ứng dụng đọc và cập nhật danh sách tức thời.
   - Xuất file Excel bảo toàn 100% định dạng, font chữ, đường viền, danh sách thả xuống (dropdown) và các sheet đính kèm.

---

## 🚀 Hướng Dẫn Khởi Chạy

```bash
# Cài đặt thư viện
npm install

# Khởi chạy server phát triển
npm run dev
```

Mở trình duyệt tại [http://localhost:3000](http://localhost:3000).

---

## 👤 Tác Giả & Liên Hệ

- **Tác giả:** Nguyễn Phi Hùng
- **Zalo:** 0938750424
- **Bản quyền:** Made by Nguyễn Phi Hùng - Zalo 0938750424
