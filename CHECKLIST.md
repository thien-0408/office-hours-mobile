# Checklist mobile

Chi tiết từng task ở [MOBILE-PLAN.md](MOBILE-PLAN.md), quy ước ở [CONVENTIONS.md](CONVENTIONS.md), bản đồ cả 3 repo ở [PROJECT-HUB.md](https://github.com/thien-0408/office-hours/blob/main/docs/PROJECT-HUB.md).

Checklist theo từng màn hình và các bước cài Firebase ở [SCREENS-FIREBASE.md](SCREENS-FIREBASE.md).

Tick task cùng commit với code. Mã `BE-xx` là task trong [checklist backend](https://github.com/chaunhattang/office-hours/blob/feature/realtime-hybrid/OfficeHours/CHECKLIST.md).

## M0 — Nền

- [ ] MO-01 Cài toàn bộ thư viện native, build và chạy trên điện thoại thật; vẽ thử một khối 3D (Must)
- [ ] MO-02 Tạo Firebase project, đăng ký `vn.edu.eiu.officehours`, bật Auth, Firestore, Realtime Database, FCM, Performance (Must)
- [ ] MO-03 Khung app: điều hướng, theme, API client tự refresh token (Must, chờ MO-01)

## M1 — Tài khoản

- [ ] MO-04 Đăng nhập, đăng ký, quên mật khẩu, lưu token an toàn (Must, chờ MO-03)
- [ ] MO-05 Hồ sơ, Cài đặt, Trợ giúp và Giới thiệu (Must, chờ MO-04)
- [ ] MO-06 Admin: danh sách user có tìm kiếm, phân trang (Must, chờ MO-04)

## M2 — GPS và map 3D

- [ ] MO-07 Đi đo góc Block 8–11 và lối đi, đo sai số GPS ở 5 điểm, lập `campus.json` (Must)
- [ ] MO-08 `geo.ts`: đổi tọa độ, lọc, làm mượt, xác định block; có unit test (Must)
- [ ] MO-09 `useCampusLocation`, màn hình xin phép và giải thích, công tắc chia sẻ (Must, chờ MO-01, MO-08)
- [ ] MO-10 Map 3D dạng khối hộp: camera, chạm vào block, chấm vị trí, vòng sai số (Must, chờ MO-01, MO-07, MO-08)
- [ ] MO-11 Thay khối hộp bằng model `.glb` dựng trong Blender (Could, chờ MO-10)

## M3 — Realtime

- [ ] MO-12 Đăng nhập Firebase bằng custom token từ `POST /realtime/firebase-token` (Must, chờ MO-02, MO-04)
- [ ] MO-13 Security rules và test trên emulator: không ghi được vị trí người khác (Must, chờ MO-12)
- [ ] MO-14 Hai máy thấy nhau qua `/bookingLive`, giới hạn tần suất, `onDisconnect` (Must, chờ MO-09, MO-10, MO-13)
- [ ] MO-15 Trạng thái giảng viên: Trong phòng, Trong trường, Vắng mặt (Must, chờ MO-14)

## M4 — Booking

- [ ] MO-17 Tìm giảng viên, xem slot, đặt lịch (Must, chờ MO-03, BE-06, BE-14, BE-15)
- [ ] MO-18 Danh sách và chi tiết booking, duyệt, từ chối (Must, chờ MO-03, BE-16, BE-17)
- [ ] MO-19 Giảng viên quản lý availability, xem lịch bận (Should, chờ MO-03, BE-11, BE-13)
- [ ] MO-20 Hủy, đổi lịch, trung tâm thông báo, nhận FCM, nghe Firestore (Must, chờ MO-18, BE-19, BE-26)
- [ ] MO-21 Dashboard realtime: booking hôm nay, thay đổi trực tiếp (Must, chờ MO-20)
- [ ] MO-22 Waitlist: vào, rời, nhận offer (Should, chờ MO-18, BE-28)
- [ ] MO-16 Chat theo booking qua WebSocket: phòng chat, đang gõ, đã xem, phân trang, tự nối lại (Must, chờ MO-18, BE-48)

## M5 — Buổi hẹn trực tiếp

- [ ] MO-23 Gắn chia sẻ vị trí vào booking thật, nhắc khi đến giờ (Must, chờ MO-14, MO-18, BE-31)
- [ ] MO-24 Chỉ đường A* theo lối đi, vẽ trên map 3D, ước tính thời gian (Should, chờ MO-07, MO-10, BE-32)
- [ ] MO-25 Nút xác nhận đã gặp hoặc vắng mặt trong chat của giảng viên (Must, chờ MO-16, BE-49)
- [ ] MO-26 Ước lượng tầng bằng barometer (mốc lúc vào block), chỉnh tay, ghi `floor` và `floorSource` vào `/bookingLive` (Could, chờ MO-09)

## M6 — AI

- [ ] MO-27 Chụp thời khóa biểu, ML Kit đọc chữ, người dùng soát lại, gửi batch import (Must, chờ MO-01, BE-12)
- [ ] MO-28 Tóm tắt biên bản họp bằng LLM (Must, chờ MO-02, BE-20)

## M7 — Hiệu năng và thuyết trình

- [ ] MO-29 Trace `location_to_render`, `presence_publish`, kiểm tra trên Firebase console (Must, chờ MO-14)
- [ ] MO-30 FlashList, phân trang cursor, cache offline, đo pin (Must, chờ MO-16, MO-20)
- [ ] MO-31 Slide 10–15 trang, ảnh chụp, biểu đồ hiệu năng, video demo (Must, chờ MO-29, MO-30)
