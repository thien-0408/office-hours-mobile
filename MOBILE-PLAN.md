# Kế hoạch app mobile OfficeHours

Cập nhật: 04/11/2026. Dùng cho đồ án môn **CSW434 Advanced Mobile Programming**.

Tài liệu liên quan: `docs/HANDOFF-mobile-hybrid-gps.md` trong repo web và `OfficeHours/BACKEND-PLAN.md` trong repo backend. Các mã `BE-xx` bên dưới là task trong plan backend. Theo dõi tiến độ ở `CHECKLIST.md`, bản đồ cả 3 repo ở [PROJECT-HUB.md](https://github.com/thien-0408/office-hours/blob/main/docs/PROJECT-HUB.md).

## 1. Sản phẩm

Sinh viên đặt lịch gặp giảng viên. Khi đến giờ hẹn, nếu cả hai cùng bật GPS thì sẽ thấy nhau trên **map 3D của campus EIU**: đang ở block nào và vị trí cập nhật theo thời gian thực. Hai người trao đổi qua chat của booking, giống chat với tài xế trên Grab, và giảng viên xác nhận đã gặp ngay trong chat đó.

## 2. Đáp ứng yêu cầu môn

| Yêu cầu trong đề | Cách đáp ứng | Task |
|---|---|---|
| Chủ đề realtime hoặc dữ liệu lớn | Vị trí trực tiếp, chat, trạng thái booking | MO-14, MO-16, MO-20 |
| Tối thiểu 20 màn hình | 24 màn hình (mục 7) | Nhiều task |
| API realtime hai chiều, tối ưu băng thông | Realtime Database, Firestore, WebSocket; giới hạn tần suất ghi GPS | MO-14, MO-16, MO-20 |
| Firebase làm database chính | Hybrid: vị trí và trạng thái online thuộc Firebase, booking là bản sao từ Postgres, chat ở backend | MO-12 đến MO-15, MO-20, BE-26 |
| Query có filter, index, phân trang | Booking và thông báo trên Firestore, lịch sử chat, user | MO-06, MO-16, MO-20, MO-30 |
| Lazy loading, batch, cache | FlashList, phân trang cursor, cache offline | MO-30 |
| Firebase Performance Monitoring | Trace tùy chỉnh | MO-29 |
| Tối thiểu 2 tính năng AI | Quét ảnh thời khóa biểu, tóm tắt biên bản họp | MO-27, MO-28 |
| Thuyết trình 10–15 slide | Theo đúng 8 mục của đề | MO-31 |

Đề ghi "Use Firebase as the main database". Handoff ghi giảng viên đã chấp nhận hybrid, nhưng đó là theo lời kể. Bản hybrid đó có chat nằm trên Firebase, còn giờ chat đã chuyển sang backend, nên cần báo lại giảng viên và lưu xác nhận bằng văn bản.

## 3. Kết quả tìm hiểu campus EIU

**Địa chỉ:** 81 Nam Kỳ Khởi Nghĩa, Thành phố mới Bình Dương (theo sổ tay sinh viên 2026–2027 và trang tuyển sinh). Sau sáp nhập hành chính, OpenStreetMap ghi là Phường Bình Dương, TP. Hồ Chí Minh.

| Thông tin | Giá trị | Nguồn |
|---|---|---|
| Ranh giới campus | OSM way `225069027`, 9 điểm, tính ra khoảng **26,8 ha** | OpenStreetMap |
| Diện tích công bố | 26 ha, khớp với ranh giới trên | Báo Bình Dương |
| Khung bao | Vĩ độ 11.049912 – 11.055651, kinh độ 106.663299 – 106.668999 | OpenStreetMap |
| Đường bao quanh | Nam Kỳ Khởi Nghĩa, Lê Duẩn, Hữu Nghị, Nguyễn Bỉnh Khiêm | OpenStreetMap |

**Gốc tọa độ đề xuất:** `lat0 = 11.0528`, `lng0 = 106.6661`, gần tâm campus. Điểm này chỉ dùng để tính toán nên không cần trùng một góc nhà nào. Nếu muốn đổi thì phải đổi trước khi dựng model 3D.

**Hai nguồn dữ liệu chính của trường:**
- **Sơ đồ khuôn viên, mục 1.4 trong [sổ tay sinh viên 2026–2027](https://orientation.eiu.edu.vn/wp-content/uploads/2026/07/Student-handbook-2026-2027-new_compressed-1.pdf):** cho biết hiện trạng và tên từng tòa. Bản 2026 có thêm một nhà giữ xe dọc Nam Kỳ Khởi Nghĩa so với bản 2025.
- **[Tour ảo Khám phá EIU](https://eiu.edu.vn/KhamPhaEIU/index.htm):** tổng mặt bằng quy hoạch có tỷ lệ, 13 sơ đồ tầng và khoảng 160 ảnh 360 độ, rất tiện để tham khảo khi dựng model 3D.

Sơ đồ trong sổ tay xoay khoảng 90° so với thực tế: đường Nam Kỳ Khởi Nghĩa ở dưới là phía đông, bên phải là phía bắc. Số trong chú giải của nó khác số trên tổng mặt bằng, chỉ các số block là trùng.

**Các tòa trong khuôn viên theo sổ tay:** có 8 block, không có Block 1, 2 và 7.

| Tòa | Công năng theo sổ tay | Số tầng | Vị trí |
|---|---|---|---|
| Block 3 | Quản trị kinh doanh | 3 | OSM, tâm 11.052507, 106.667553 |
| Block 4 | Thư viện; có Highlands Coffee | 3 | OSM, tâm 11.053686, 106.667290 |
| Block 5 | Hành chính | 3 | OSM, tâm 11.053706, 106.667705 |
| Block 6 | Vườn ươm doanh nghiệp BBI | 2 | OSM, tâm 11.052124, 106.667893 |
| Block 8 | Phòng học đa năng; có Family Mart | 4 | **Ước tính**, tâm 11.054673, 106.666466 |
| Block 9 | Chưa ghi công năng | 4 | **Ước tính**, tâm 11.054202, 106.665317 |
| Block 10 | Trung tâm ngoại ngữ | 4 | **Ước tính**, tâm 11.053632, 106.665208 |
| Block 11 | Văn phòng khoa, phòng thí nghiệm | 4 | **Ước tính**, tâm 11.054139, 106.666631 |
| Căn tin | Căn tin EIU | 1 | OSM, tâm 11.055172, 106.667233 |

Ngoài ra còn Fami Pizza, các nhà giữ xe, và phía bên kia đường Hữu Nghị là Trung tâm AMC và Công ty Aspire.

**Độ tin cậy:** tôi khớp 4 góc của tổng mặt bằng với ranh giới OSM, sai lệch dưới 3 m tại các góc, tỷ lệ khoảng 0,65 m mỗi pixel. Sau đó kiểm tra trên Block 3, 4, 5, 6: vị trí suy ra lệch 10–19 m so với OSM và gần như lệch về một phía, nên đã bù độ lệch này cho Block 8, 9, 10 và 11. Thứ tự các tòa này khớp với sơ đồ trong sổ tay, nhưng vị trí vẫn có thể sai 10–20 m cho đến khi đi đo.

**Dữ liệu đã lưu:**
- `docs/campus/eiu-osm-seed.json`: ranh giới, tòa nhà và đường nội bộ đã đổi sang mét, cùng ước tính cho Block 8, 9, 10 và 11.
- `docs/campus/eiu-rooms.json`: danh sách phòng đọc từ sơ đồ tầng, dùng được để seed bảng `campus_rooms` ở BE-32.
- `docs/campus/reference/`: bản tải về của các sơ đồ, **chỉ để ở máy, đã chặn khỏi git** vì repo public và sơ đồ thuộc về trường.

**Còn phải xác minh:**
- Tổng mặt bằng là bản quy hoạch, nên các số 12–30 không dùng làm hiện trạng. Theo sổ tay, phần đất đó vẫn là cây xanh, nên map không dựng các tòa này.
- Block 9 và 10 chưa có sơ đồ tầng trong tour ảo.
- Chưa biết phòng làm việc của từng giảng viên.
- OSM chỉ có 6 đoạn lối đi bộ và 15 đường nội bộ, chưa đủ cho chỉ đường.
- Nên xin phép trường trước khi dùng sơ đồ này để dựng và công bố map.

MO-07 vẫn cần đi thực địa, nhưng chỉ còn việc đo góc 4 tòa chưa có đường viền (Block 8, 9, 10, 11), đo lối đi và kiểm tra sai số GPS.

**Nguồn:** [Tour ảo Khám phá EIU](https://eiu.edu.vn/KhamPhaEIU/index.htm), [OpenStreetMap way 225069027](https://www.openstreetmap.org/way/225069027) (© OpenStreetMap contributors, ODbL 1.0; app phải ghi công), [Sổ tay sinh viên 2026–2027](https://orientation.eiu.edu.vn/wp-content/uploads/2026/07/Student-handbook-2026-2027-new_compressed-1.pdf), [Báo Bình Dương](https://oldm.baobinhduong.vn/en/80-of-progress-of-eiu-s-1st-phase-completed-a1464.html), [Phòng Hợp tác Quốc tế EIU](https://sites.google.com/eiu.edu.vn/office-of-international-affair/about-us), [Tuyển Sinh Số](https://tuyensinhso.vn/school/dai-hoc-quoc-te-mien-dong.html).

## 4. Kiến trúc tính năng GPS

```
Booking được xác nhận
  → Backend ghi /activeBookings/{id}: hai người trong booking và khung giờ
Hai người bật chia sẻ vị trí
  → GPS → bỏ điểm sai số > 25 m → làm mượt → đổi sang mét → xác định block
  → Ghi /bookingLive/{bookingId}/{uid}
  → Máy còn lại nhận dữ liệu và vẽ chấm trên map 3D
Hết giờ hẹn
  → Backend xóa /bookingLive/{bookingId}
```

**Quy tắc:**
- Vị trí đi thẳng từ điện thoại lên Realtime Database, không qua Spring Boot và không lưu vào Postgres.
- Cả hai cùng bật thì mới thấy nhau. Chỉ trong khung giờ hẹn, tối đa 15 phút sau giờ kết thúc.
- Chỉ chạy khi app đang mở. Tắt màn hình hoặc chuyển app là ngừng cập nhật.
- Thông báo đẩy dùng FCM topic `user-<uuid>`: app subscribe sau khi đăng nhập, hủy khi đăng xuất.
- Tần suất: khoảng 2 giây khi mở map. Ghi Firebase tối đa 1 lần mỗi 5 giây, hoặc ngay khi đi quá 5 m hay đổi block.
- Cần có 2 lần đọc liên tiếp trong một block thì mới tính là đang ở block đó.
- Việc đã gặp hay chưa do giảng viên xác nhận trong chat, không dựa vào GPS.

**Giới hạn cần nói rõ khi demo:** GPS sai khoảng 3–10 m ngoài trời và kém hơn trong nhà. App biết được block, không biết chính xác phòng. Tầng chỉ là ước lượng từ barometer và người dùng có thể tự chỉnh.

**Tầng và phòng (chốt 12/11/2026):**
- Không đoán phòng của người dùng. Phòng đích luôn có sẵn: phòng làm việc của giảng viên (`CampusRoomResponse`: `buildingCode`, `floor`, `xM`, `zM`). Map chỉ đường tới phòng đó.
- Tầng của sinh viên ước lượng bằng barometer, đo tương đối:
  1. Khi GPS xác nhận vừa vào block (2 lần đọc), coi là đang ở tầng 1 (trệt), lưu áp suất làm mốc `p0`. `eiu-rooms.json` đánh số tầng từ 1, số đầu của mã phòng là tầng (`306.B11` ở tầng 3).
  2. `h = (p0 − p) × 8.3` mét; tầng = 1 + `round(h / chiều cao tầng)`, giới hạn trong số tầng của block, chiều cao tầng lấy từ `campus.json`.
  3. Làm mượt và chỉ đổi tầng khi chênh quá 60% chiều cao một tầng trong ít nhất 3 giây.
  4. Ra khỏi block thì bỏ mốc. Máy không có barometer (`Barometer.isAvailableAsync()` trả `false`) thì hiện "Tầng ?" và cho chọn tay.
- Người dùng luôn chỉnh tay được; chọn tay thắng barometer cho tới khi ra khỏi block.
- Giảng viên đang "Có mặt" và GPS ở đúng block của phòng làm việc: vẽ chấm ngay tại phòng (`floor`, `xM`, `zM`), không dùng GPS trong nhà.
- Giao diện luôn ghi nguồn: "tầng 2 (ước lượng)", "tầng 2 (tự chọn)", "tại phòng 306.B11".
- Không làm QR ở cửa phòng, không dò Wi-Fi, không dùng beacon BLE. Đã gặp hay chưa vẫn do giảng viên xác nhận trong chat.
- MO-07 đo thêm: máy test nào có barometer, chênh áp suất mỗi tầng ở B11 trên 2 máy, chiều cao tầng 1 so với các tầng trên.

**Quyền riêng tư:** bật theo lựa chọn của người dùng, có màn hình giải thích, có nút xóa dữ liệu. Phải xin phép trường trước khi thử với người ngoài nhóm.

## 5. Thư viện

| Mục đích | Thư viện | Đổi so với handoff |
|---|---|---|
| GPS | `expo-location` | Thay `react-native-geolocation-service` (không cập nhật từ 2022) |
| Barometer | `expo-sensors` | Thay `react-native-sensors` (không cập nhật từ 2022) |
| 3D | `three`, `@react-three/fiber/native`, `expo-gl`, `expo-asset` | Bỏ `expo-three`, vì nó ghim `three ^0.166`; thêm lại nếu MO-01 cho thấy cần |
| Chụp ảnh | `expo-camera` | Thay `react-native-vision-camera`, đơn giản hơn |
| Chat | `@stomp/stompjs` | Mới, chạy trên WebSocket có sẵn của React Native |
| Firebase | `@react-native-firebase/` `app`, `auth`, `database`, `firestore`, `messaging`, `perf` | Thêm `firestore`, `messaging` |
| OCR | `@react-native-ml-kit/text-recognition` | Chạy trên máy, miễn phí |
| LLM | `@react-native-firebase/ai` | App không phải chứa API key |
| Điều hướng | `@react-navigation/native`, `native-stack`, `bottom-tabs` | Mới |
| Dữ liệu API | `@tanstack/react-query` | Mới |
| Danh sách dài | `@shopify/flash-list` | Mới |
| Lưu token | `expo-secure-store` | Mới |

Tôi mới kiểm tra các gói này tồn tại trên npm, và các gói Expo khớp với SDK 58. **Chưa build thử cùng nhau**, đó là việc của MO-01.

Tài liệu Chapter 5 của môn dùng `@react-native-firebase/ml`. Gói này đang tụt phiên bản so với các gói Firebase còn lại (26.4 so với 27.1), nên chọn ML Kit chạy trên máy. Nếu giảng viên yêu cầu đúng thư viện trong bài giảng thì cần đổi lại.

## 6. Thứ tự phase và task

Các phase M0–M3 không cần chờ booking backend nên làm được ngay. Ước lượng tính bằng ngày công. Mức ưu tiên: **Must** bắt buộc, **Should** nên có, **Could** làm nếu còn thời gian.

| Phase | Nội dung | Khi nào bắt đầu được |
|---|---|---|
| **M0** | Nền app, Firebase | Ngay |
| **M1** | Tài khoản, hồ sơ, admin | Ngay, backend đã sẵn |
| **M2** | Xử lý GPS, map 3D | Ngay, cần đi khảo sát campus |
| **M3** | Realtime: 2 máy thấy nhau, trạng thái giảng viên | Sau MO-12 |
| **M4** | Luồng booking, chat | Theo tiến độ backend B1–B5 |
| **M5** | Gắn GPS vào booking thật, xác nhận đã gặp | Sau BE-31, BE-49 |
| **M6** | AI | Sau BE-12, BE-20 |
| **M7** | Hiệu năng, slide | Làm dần, gom cuối |

**Mốc quan trọng:** hết M3 là có thể demo 2 điện thoại thấy nhau trên map 3D, kể cả khi backend chưa có booking. Để làm vậy, tạo `/activeBookings` thử bằng tay trong Firebase Console.

### M0 — Nền

| ID | Task | Ngày | Mức | Cần trước |
|---|---|---|---|---|
| MO-01 | Cài toàn bộ thư viện native, build và chạy trên điện thoại thật; vẽ thử một khối 3D | 1.5 | Must | – |
| MO-02 | Tạo Firebase project, đăng ký `vn.edu.eiu.officehours`, bật Auth, Firestore, Realtime Database, FCM, Performance | 0.5 | Must | – |
| MO-03 | Khung app: điều hướng, theme, API client tự refresh token | 1.5 | Must | MO-01 |

### M1 — Tài khoản

| ID | Task | Ngày | Mức | Cần trước |
|---|---|---|---|---|
| MO-04 | Đăng nhập, đăng ký, quên mật khẩu, lưu token an toàn | 1.5 | Must | MO-03 |
| MO-05 | Hồ sơ, Cài đặt, Trợ giúp và Giới thiệu | 1.5 | Must | MO-04 |
| MO-06 | Admin: danh sách user có tìm kiếm, phân trang | 1.5 | Must | MO-04 |

### M2 — GPS và map 3D

| ID | Task | Ngày | Mức | Cần trước |
|---|---|---|---|---|
| MO-07 | Đi đo góc Block 8–11 và lối đi, đo sai số GPS ở 5 điểm, lập `campus.json` | 1.5 | Must | – |
| MO-08 | `geo.ts`: đổi tọa độ, lọc, làm mượt, xác định block; có unit test | 1.5 | Must | – |
| MO-09 | `useCampusLocation`, màn hình xin phép và giải thích, công tắc chia sẻ | 2 | Must | MO-01, MO-08 |
| MO-10 | Map 3D dạng khối hộp: camera, chạm vào block, chấm vị trí, vòng sai số | 5 | Must | MO-01, MO-07, MO-08 |
| MO-11 | Thay khối hộp bằng model `.glb` dựng trong Blender | 4 | Could | MO-10 |

### M3 — Realtime

| ID | Task | Ngày | Mức | Cần trước |
|---|---|---|---|---|
| MO-12 | Đăng nhập Firebase bằng custom token từ `POST /realtime/firebase-token` | 1 | Must | MO-02, MO-04 |
| MO-13 | Security rules và test trên emulator: không ghi được vị trí người khác | 1.5 | Must | MO-12 |
| MO-14 | Hai máy thấy nhau qua `/bookingLive`, giới hạn tần suất, `onDisconnect` | 2 | Must | MO-09, MO-10, MO-13 |
| MO-15 | Trạng thái giảng viên: Trong phòng, Trong trường, Vắng mặt | 1.5 | Must | MO-14 |

MO-12 cần bật Firebase ở backend (`FIREBASE_ENABLED=true`) nhưng không cần code thêm.

### M4 — Booking

| ID | Task | Ngày | Mức | Cần trước |
|---|---|---|---|---|
| MO-17 | Tìm giảng viên, xem slot, đặt lịch | 3 | Must | MO-03, BE-06, BE-14, BE-15 |
| MO-18 | Danh sách và chi tiết booking, duyệt, từ chối | 2.5 | Must | MO-03, BE-16, BE-17 |
| MO-19 | Giảng viên quản lý availability, xem lịch bận | 2 | Should | MO-03, BE-11, BE-13 |
| MO-20 | Hủy, đổi lịch, trung tâm thông báo, nhận FCM, nghe Firestore | 3 | Must | MO-18, BE-19, BE-26 |
| MO-21 | Dashboard realtime: booking hôm nay, thay đổi trực tiếp | 1.5 | Must | MO-20 |
| MO-22 | Waitlist: vào, rời, nhận offer | 1.5 | Should | MO-18, BE-28 |
| MO-16 | Chat theo booking qua WebSocket: phòng chat, đang gõ, đã xem, phân trang, tự nối lại | 3 | Must | MO-18, BE-48 |

### M5 — Buổi hẹn trực tiếp

| ID | Task | Ngày | Mức | Cần trước |
|---|---|---|---|---|
| MO-23 | Gắn chia sẻ vị trí vào booking thật, nhắc khi đến giờ | 1.5 | Must | MO-14, MO-18, BE-31 |
| MO-24 | Chỉ đường A* theo lối đi, vẽ trên map 3D, ước tính thời gian | 2 | Should | MO-07, MO-10, BE-32 |
| MO-25 | Nút xác nhận đã gặp hoặc vắng mặt trong chat của giảng viên | 0.5 | Must | MO-16, BE-49 |
| MO-26 | Ước lượng tầng bằng barometer (mốc lúc vào block), chỉnh tay, ghi `floor` và `floorSource` vào `/bookingLive` | 1 | Could | MO-09 |

### M6 — AI

| ID | Task | Ngày | Mức | Cần trước |
|---|---|---|---|---|
| MO-27 | Chụp thời khóa biểu, ML Kit đọc chữ, người dùng soát lại, gửi batch import | 3 | Must | MO-01, BE-12 |
| MO-28 | Tóm tắt biên bản họp bằng LLM | 1.5 | Must | MO-02, BE-20 |

### M7 — Hiệu năng và thuyết trình

| ID | Task | Ngày | Mức | Cần trước |
|---|---|---|---|---|
| MO-29 | Trace `location_to_render`, `presence_publish`, kiểm tra trên Firebase console | 1 | Must | MO-14 |
| MO-30 | FlashList, phân trang cursor, cache offline, đo pin | 1.5 | Must | MO-16, MO-20 |
| MO-31 | Slide 10–15 trang, ảnh chụp, biểu đồ hiệu năng, video demo | 1.5 | Must | MO-29, MO-30 |

## 7. Danh sách 24 màn hình

| Nhóm | Màn hình |
|---|---|
| Tài khoản | 1. Đăng nhập · 2. Đăng ký · 3. Quên mật khẩu |
| Chung | 4. Dashboard realtime · 5. Hồ sơ · 6. Cài đặt · 7. Thông báo · 8. Trợ giúp và Giới thiệu |
| Booking | 9. Tìm giảng viên · 10. Chi tiết giảng viên và slot · 11. Đặt lịch · 12. Danh sách booking · 13. Chi tiết booking · 14. Waitlist |
| Lịch | 15. Quét thời khóa biểu |
| Chat | 16. Phòng chat, mở từ chi tiết booking |
| Campus | 17. Map 3D · 18. Xin phép vị trí · 19. Buổi hẹn trực tiếp |
| Giảng viên | 20. Availability · 21. Hàng đợi duyệt · 22. Biên bản họp và tóm tắt AI |
| Admin | 23. Quản lý user · 24. Sơ đồ hoạt động campus (ẩn danh) |

Nếu thiếu thời gian, có thể bỏ 14, 20 và 24 mà vẫn đạt 20 màn hình trở lên.

## 8. Khối lượng

| Phase | Ngày công |
|---|---|
| M0 | 3.5 |
| M1 | 4.5 |
| M2 | 14 |
| M3 | 6 |
| M4 | 16.5 |
| M5 | 5 |
| M6 | 4.5 |
| M7 | 4 |
| **Tổng** | **58** |

Bỏ các task Should và Could thì còn 47.5 ngày, vẫn nhiều cho một người. Chưa gán người vì chưa rõ thành viên nhóm.

## 9. Rủi ro

| Rủi ro | Cách xử lý |
|---|---|
| Thư viện 3D hoặc Firebase xung đột với RN 0.88 | MO-01 làm đầu tiên, phát hiện sớm |
| Map 3D tốn thời gian hơn dự kiến | Giao khối hộp trước, `.glb` chỉ là Could |
| Backend booking chưa xong khi đến hạn nộp | Demo bằng `/activeBookings` tạo tay |
| GPS nhiễu gần tòa nhà | Vòng sai số, quy tắc 2 lần đọc, không dùng GPS để xác nhận đã gặp |
| Máy thật cần thiết để test GPS | Cần ít nhất 2 điện thoại Android |
| Hết hạn mức gói Firebase miễn phí khi test | Giới hạn tần suất ghi, xem usage hằng tuần |

## 10. Cần chốt

1. **Thành viên nhóm và cách hiểu "each student must complete all requirements independently".** Câu này ảnh hưởng cách chia việc, nên hỏi giảng viên.
2. **Xin phép dùng lại hệ thống capstone cho môn này**, nếu chưa hỏi cả hai giảng viên. Nhớ nói rõ chat đã chuyển sang backend.
3. **Gốc tọa độ** ở mục 3. Đề xuất giữ nguyên nếu không có lý do đổi.
