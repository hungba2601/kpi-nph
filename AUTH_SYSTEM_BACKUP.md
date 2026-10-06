# HỆ THỐNG XÁC THỰC & ĐĂNG NHẬP (AUTH SYSTEM BACKUP & RESTORE)

> **Ghi chú quan trọng:** Tài liệu này sao lưu và hướng dẫn toàn bộ cơ chế đăng nhập, xác thực tài khoản và khóa mã thiết bị (Browser Fingerprint) của dự án **KPI Assistant AI**.
> Toàn bộ mã nguồn của hệ thống đăng nhập vẫn được **GIỮ NGUYÊN VẸN 100%** trong dự án.

---

## 1. CÁCH BẬT LẠI MÀN HÌNH ĐĂNG NHẬP (CHỈ CẦN 1 BƯỚC)

Khi bạn muốn kích hoạt lại màn hình đăng nhập:
1. Mở file: `src/app/page.tsx`
2. Tìm dòng số **28**:
   ```typescript
   const REQUIRE_AUTH = false;
   ```
3. Đổi thành:
   ```typescript
   const REQUIRE_AUTH = true;
   ```
4. Lưu file và đẩy lên GitHub. Ngay lập tức màn hình đăng nhập và cơ chế bảo vệ sẽ được bật trở lại!

---

## 2. DANH SÁCH TẤT CẢ FILE VÀ THÀNH PHẦN HỆ THỐNG ĐĂNG NHẬP

Tất cả các file dưới đây đều đang được lưu giữ nguyên vẹn trong dự án:

### 1. `src/components/AuthScreen.tsx`
- **Màn hình đăng nhập người dùng:**
  - Tự động quét và hiển thị mã máy **Browser Fingerprint** (duy nhất, không đổi ngay cả khi xóa lịch sử web hoặc dùng tab ẩn danh).
  - Nút sao chép mã máy.
  - Ô nhập Tài khoản (`tk`) và Mật khẩu (`mk`).
  - Badge trạng thái: **"Chế độ: Có kiểm tra mã máy"** hoặc **"Chế độ: Bỏ qua mã máy"**.
  - Nút **Quản trị** (hình chìa khóa góc trên bên phải): Nhập mật khẩu quản trị `Hung@2601` để chuyển đổi chế độ kiểm tra mã máy và ghi vào ô **F1** của Google Sheet.

### 2. `src/app/api/auth/login/route.ts`
- **API Xử lý đăng nhập phía server Next.js:**
  - Nhận `username`, `password`, `deviceId`, `checkDevice`.
  - Gửi yêu cầu sang Google Apps Script Web App để đối soát với Google Sheet.
  - Hỗ trợ chế độ bỏ qua mã máy nếu ô F1 là `0`.

### 3. `src/app/api/auth/mode/route.ts`
- **API Đọc/Ghi trạng thái ô F1 Google Sheet:**
  - `GET`: Đọc trực tiếp ô F1 từ Google Sheet (1: Có kiểm tra mã máy, 0: Bỏ qua mã máy) mà không cache.
  - `POST`: Nhận lệnh từ Admin và ghi trực tiếp số `1` hoặc `0` vào ô F1 trên Google Sheet.

### 4. `google_apps_script.js`
- **Mã nguồn Google Apps Script Web App:**
  - Kết nối với Google Sheet chứa danh sách tài khoản:
    - **Ô A1:** `tk` (Tài khoản)
    - **Ô B1:** `mk` (Mật khẩu)
    - **Ô C1:** `DeviceID` (Mã máy liên kết)
    - **Ô D1:** `NgayDangNhap` (Thời gian đăng nhập gần nhất)
    - **Ô E1:** `GhiChu` (Tên giáo viên / Ghi chú)
    - **Ô F1:** `CheDoKiemTra` (Cấu hình: `1` = Có kiểm tra mã máy, `0` = Không kiểm tra mã máy)
  - Hỗ trợ các action:
    - `action=ping`: Kiểm tra kết nối.
    - `action=login`: Xác thực tài khoản, kiểm tra hoặc bỏ qua mã máy.
    - `action=get_mode`: Đọc giá trị ô F1.
    - `action=set_mode`: Ghi giá trị 1 hoặc 0 vào ô F1.
    - `action=reset_device`: Xóa mã máy cũ để người dùng đăng ký máy mới.

### 5. `src/config/auth.ts`
- Nơi khai báo đường dẫn Web App Google Apps Script (`GOOGLE_APPS_SCRIPT_URL`).

### 6. `src/lib/fingerprint.ts`
- Thư viện trích xuất phần cứng và trình duyệt (FingerprintJS) để sinh mã máy độc quyền `FP_...`.

---

## 3. CÁCH CẤU HÌNH GOOGLE APPS SCRIPT KHI CẦN DÙNG LẠI

1. Mở Google Sheet -> **Tiện ích mở rộng** -> **Apps Script**.
2. Dán toàn bộ nội dung file `google_apps_script.js` vào.
3. Bấm **Triển khai (Deploy)** -> **Tùy chọn triển khai mới (New deployment)**.
   - Loại: **Ứng dụng web (Web App)**.
   - Thực thi dưới dạng: **Tôi (Me)**.
   - Ai có quyền truy cập: **Bất kỳ ai (Anyone)** *(Bắt buộc)*.
4. Copy URL Web App dán vào file `src/config/auth.ts`.
5. Đổi `REQUIRE_AUTH = true` trong `src/app/page.tsx`.
