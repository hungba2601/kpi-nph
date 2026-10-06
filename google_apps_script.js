/**
 * ======================================================================================
 * HỆ THỐNG XÁC THỰC NGƯỜI DÙNG & KHÓA THIẾT BỊ DUY NHẤT (BROWSER FINGERPRINT)
 * Ứng dụng: KPI Assistant AI - Made by Nguyễn Phi Hùng
 * ======================================================================================
 * 
 * HƯỚNG DẪN CÀI ĐẶT TRÊN GOOGLE SHEET:
 * 
 * Bước 1: Mở Google Sheet mới (hoặc có sẵn). Đặt tiêu đề cho Hàng 1 của Sheet 1 như sau:
 *   - Ô A1: tk (Tài khoản)
 *   - Ô B1: mk (Mật khẩu)
 *   - Ô C1: DeviceID (Mã thiết bị - Quản trị viên để trống, hệ thống sẽ tự điền khi đăng nhập lần đầu)
 *   - Ô D1: NgayDangNhap (Thời gian đăng nhập gần nhất)
 *   - Ô E1: GhiChu (Tùy chọn: Tên giáo viên / Ghi chú)
 * 
 * Bước 2: Nhập danh sách tài khoản và mật khẩu vào Cột A và Cột B từ hàng số 2.
 *   (LƯU Ý: Cột C DeviceID để trống để user đăng nhập lần đầu máy nào thì tự động khóa vào máy đó).
 * 
 * Bước 3: Vào menu "Tiện ích mở rộng" (Extensions) -> Chọn "Apps Script".
 * 
 * Bước 4: Xóa hết code mặc định trong Apps Script, dán toàn bộ đoạn mã bên dưới vào.
 * 
 * Bước 5: Bấm nút "Triển khai" (Deploy) màu xanh ở góc trên bên phải -> Chọn "Tùy chọn triển khai mới" (New deployment).
 *   - Chọn loại: "Ứng dụng web" (Web App).
 *   - Mô tả: "KPI Login API"
 *   - Thực thi dưới dạng (Execute as): "Tôi" (Me - địa chỉ email của bạn).
 *   - Ai có quyền truy cập (Who has access): "Bất kỳ ai" (Anyone).  <-- BẮT BUỘC CHỌN "ANYONE"
 *   - Bấm nút "Triển khai" (Deploy) và cấp quyền (Authorize Access).
 * 
 * Bước 6: Sao chép URL Ứng dụng web (có dạng: https://script.google.com/macros/s/AKfycb.../exec)
 *         và dán trực tiếp vào file: src/config/auth.ts trong code ứng dụng.
 * ======================================================================================
 */

function doPost(e) {
  return handleAuthRequest(e);
}

function doGet(e) {
  return handleAuthRequest(e);
}

function handleAuthRequest(e) {
  try {
    var params = {};

    // 1. Phân tích dữ liệu gửi lên (Hỗ trợ cả POST JSON, Form, và GET URL params)
    if (e && e.postData && e.postData.contents) {
      try {
        params = JSON.parse(e.postData.contents);
      } catch (err) {
        params = e.parameter || {};
      }
    } else if (e && e.parameter) {
      params = e.parameter;
    }

    var action = (params.action || 'login').toLowerCase();

    // Action kiểm tra kết nối (Ping)
    if (action === 'ping' || action === 'test') {
      return createJsonResponse({
        success: true,
        message: 'Kết nối Google Sheet Apps Script thành công!',
        timestamp: new Date().toISOString()
      });
    }

    // Action lấy cấu hình chế độ kiểm tra thiết bị hiện tại (Đồng bộ mọi máy)
    if (action === 'get_mode' || action === 'get_config') {
      var savedModeProp = PropertiesService.getScriptProperties().getProperty('CHECK_DEVICE_MODE');
      var isCheckMode = (savedModeProp === null) ? true : (savedModeProp === 'true');
      return createJsonResponse({
        success: true,
        checkDeviceMode: isCheckMode,
        message: 'Lấy cấu hình thành công'
      });
    }

    // Action lưu cấu hình chế độ kiểm tra thiết bị (Đồng bộ mọi máy)
    if (action === 'set_mode' || action === 'set_config') {
      var newMode = params.checkDeviceMode;
      var isModeTrue = (newMode === true || newMode === 'true');
      PropertiesService.getScriptProperties().setProperty('CHECK_DEVICE_MODE', String(isModeTrue));
      return createJsonResponse({
        success: true,
        checkDeviceMode: isModeTrue,
        message: 'Đã lưu cấu hình chế độ thành công trên Google Apps Script!'
      });
    }

    // Action đăng nhập (Login)
    if (action === 'login') {
      var username = String(params.username || params.tk || '').trim();
      var password = String(params.password || params.mk || '').trim();
      var deviceId = String(params.deviceId || params.DeviceID || '').trim();

      if (!username || !password) {
        return createJsonResponse({
          success: false,
          error: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu.'
        });
      }

      if (!deviceId) {
        return createJsonResponse({
          success: false,
          error: 'Không nhận diện được mã định danh thiết bị (DeviceID).'
        });
      }

      var sheet = getAuthSheet();
      var lastRow = sheet.getLastRow();

      if (lastRow < 2) {
        return createJsonResponse({
          success: false,
          error: 'Chưa có tài khoản nào được tạo trong Google Sheet.'
        });
      }

      // Đọc toàn bộ dữ liệu từ hàng 2
      var data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
      var foundRowIndex = -1;
      var matchedRow = null;

      for (var i = 0; i < data.length; i++) {
        var rowTk = String(data[i][0]).trim();
        if (rowTk.toLowerCase() === username.toLowerCase()) {
          foundRowIndex = i + 2; // Hàng thực tế trong Sheet (1-indexed)
          matchedRow = data[i];
          break;
        }
      }

      // 1. Kiểm tra tài khoản tồn tại
      if (foundRowIndex === -1 || !matchedRow) {
        return createJsonResponse({
          success: false,
          error: 'Tài khoản không tồn tại trong hệ thống. Vui lòng liên hệ Quản trị viên.'
        });
      }

      // 2. Kiểm tra mật khẩu
      var rowMk = String(matchedRow[1]).trim();
      if (rowMk !== password) {
        return createJsonResponse({
          success: false,
          error: 'Mật khẩu không chính xác. Vui lòng kiểm tra lại.'
        });
      }

      // 3. Kiểm tra Mã thiết bị (DeviceID)
      var savedModeProp = PropertiesService.getScriptProperties().getProperty('CHECK_DEVICE_MODE');
      var globalSkipCheck = (savedModeProp === 'false');
      var skipDeviceCheck = (params.skipDeviceCheck === true || params.skipDeviceCheck === 'true' || params.checkDevice === false || params.checkDevice === 'false' || globalSkipCheck);
      var currentRegisteredDeviceId = String(matchedRow[2] || '').trim();
      var nowStr = Utilities.formatDate(new Date(), 'GMT+7', 'HH:mm:ss dd/MM/yyyy');

      // NẾU BẬT CHẾ ĐỘ BỎ QUA KIỂM TRA MÃ MÁY: Cho phép đăng nhập luôn
      if (skipDeviceCheck) {
        sheet.getRange(foundRowIndex, 4).setValue(nowStr);
        return createJsonResponse({
          success: true,
          message: 'Đăng nhập thành công (Chế độ: Không kiểm tra mã máy)!',
          isNewDevice: false,
          user: {
            username: matchedRow[0],
            deviceId: deviceId || 'DEV_SKIP_CHECK',
            fullName: matchedRow[4] || matchedRow[0]
          }
        });
      }

      // TRƯỜNG HỢP A: Chưa đăng ký thiết bị (Cột C trống) -> Lần đầu đăng nhập!
      if (!currentRegisteredDeviceId) {
        // Khóa thiết bị này vào tài khoản (Ghi vào Cột C và D)
        sheet.getRange(foundRowIndex, 3).setValue(deviceId);
        sheet.getRange(foundRowIndex, 4).setValue(nowStr);

        return createJsonResponse({
          success: true,
          message: 'Đăng ký thiết bị thành công! Tài khoản đã được liên kết với máy này.',
          isNewDevice: true,
          user: {
            username: matchedRow[0],
            deviceId: deviceId,
            fullName: matchedRow[4] || matchedRow[0]
          }
        });
      }

      // TRƯỜNG HỢP B: Đã có DeviceID và khớp đúng mã máy hiện tại -> Hợp lệ!
      if (currentRegisteredDeviceId === deviceId) {
        // Cập nhật lại thời gian đăng nhập mới nhất ở Cột D
        sheet.getRange(foundRowIndex, 4).setValue(nowStr);

        return createJsonResponse({
          success: true,
          message: 'Đăng nhập thành công!',
          isNewDevice: false,
          user: {
            username: matchedRow[0],
            deviceId: deviceId,
            fullName: matchedRow[4] || matchedRow[0]
          }
        });
      }

      // TRƯỜNG HỢP C: DeviceID không khớp (Đăng nhập trên máy khác) -> CHẶN LẠI!
      return createJsonResponse({
        success: false,
        isDeviceMismatch: true,
        error: 'Tài khoản này đã được liên kết cố định với một thiết bị khác! Để đổi máy, vui lòng liên hệ Quản trị viên để xóa mã thiết bị cũ.'
      });
    }

    // Action mở khóa / xóa thiết bị cũ (Reset device dành cho Admin)
    if (action === 'reset_device') {
      var userToReset = String(params.username || '').trim();
      var adminKey = String(params.adminKey || '').trim();

      // Kiểm tra mật khẩu admin nếu cần (mặc định cho phép nếu gọi có key hoặc cấu hình)
      var sheet = getAuthSheet();
      var lastRow = sheet.getLastRow();
      var data = sheet.getRange(2, 1, lastRow - 1, 3).getValues();

      for (var r = 0; r < data.length; r++) {
        if (String(data[r][0]).trim().toLowerCase() === userToReset.toLowerCase()) {
          sheet.getRange(r + 2, 3).setValue(''); // Xóa Cột C DeviceID
          return createJsonResponse({
            success: true,
            message: 'Đã mở khóa thiết bị thành công cho tài khoản ' + userToReset
          });
        }
      }

      return createJsonResponse({
        success: false,
        error: 'Không tìm thấy tài khoản cần mở khóa.'
      });
    }

    return createJsonResponse({
      success: false,
      error: 'Hành động không hợp lệ: ' + action
    });

  } catch (error) {
    return createJsonResponse({
      success: false,
      error: 'Lỗi máy chủ Google Apps Script: ' + error.toString()
    });
  }
}

// Tự động tìm Sheet chứa dữ liệu tài khoản
function getAuthSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  // Ưu tiên các tên phổ biến: Sheet1, Trang tính1, Trang tính 1, TaiKhoan, User
  var sheet = ss.getSheetByName('Sheet1') ||
    ss.getSheetByName('Trang tính1') ||
    ss.getSheetByName('Trang tính 1') ||
    ss.getSheetByName('TaiKhoan') ||
    ss.getSheetByName('User');
  if (!sheet) {
    // Nếu đặt tên khác thì tự động lấy sheet đầu tiên ở góc trái
    sheet = ss.getSheets()[0];
  }
  return sheet;
}

// Hàm chuẩn hóa phản hồi JSON với ContentService
function createJsonResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
