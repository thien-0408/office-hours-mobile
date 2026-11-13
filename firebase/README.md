# Firebase Realtime Database rules (MO-13)

File rules: `database.rules.json` (repo root). Test: `npm run test:rules` (cần Java 21+, lần đầu tải emulator jar). Project id `demo-officehours` (tiền tố `demo-` giữ emulator chạy offline, không cần project thật).

Firestore rules nằm ở repo backend (`OfficeHours/firebase/firestore.rules`), không ở đây.

## Quyết định cho từng rule

| Đường | Rule | Lý do |
|---|---|---|
| `/` | `.read` và `.write` đều `false` | Mặc định đóng, chỉ mở từng đường bên dưới. |
| `/activeBookings/{id}` | Đọc: chỉ `studentId` hoặc `lecturerId`. Ghi: `false` | Backend ghi bằng Admin SDK (bỏ qua rules). Không có `.read` ở `/activeBookings` nên không liệt kê được toàn bộ. |
| `/bookingLive/{id}` | Đọc: chỉ hai người trong booking, xác định qua `/activeBookings/{id}` | Người ngoài booking, hoặc booking đã bị backend xóa, thì không đọc được. |
| `/bookingLive/{id}/{uid}` ghi | `auth.uid === $uid`, là người trong booking, và `startAtMs <= now <= endAtMs + 900000` | Khung giờ lấy từ dữ liệu backend ghi, `now` là giờ server nên máy khách chỉnh đồng hồ cũng không qua được. |
| xóa node của mình | Chỉ cần là chủ node và booking còn trong `/activeBookings`, không xét giờ | Để `onDisconnect().remove()` chạy được cả khi đã quá khung giờ. Backend xóa luôn `/bookingLive/{id}` khi booking kết thúc. |
| `building` | string, 1 đến 16 ký tự | Mã block như `B11`. |
| `x`, `z` | number, trong khoảng -1000 đến 1000 (mét) | Chặn giá trị rác; campus nhỏ hơn nhiều. |
| `acc` | number, 0 đến 200 | App đã bỏ điểm sai số trên 25 m, 200 chỉ là chặn trên an toàn. |
| `updatedAt` | number, trong khoảng `now` ±60 giây | Chặn dữ liệu cũ hoặc đồng hồ máy lệch nhiều. Dùng `ServerValue.TIMESTAMP` thì luôn hợp lệ. |
| `floor` | tùy chọn, số nguyên từ -2 đến 20 | Giữ giới hạn của bản nháp, thêm điều kiện nguyên. |
| `floorSource` | tùy chọn, `baro`, `manual` hoặc `room` | Khớp MOBILE-PLAN §4. |
| con khác | `$other: { ".validate": false }` | Từ chối trường lạ, kể cả `{ "secret": ... }`. Dữ liệu vị trí chỉ gồm các trường trên. |
| `/presence` đọc | mọi người đã đăng nhập | Sinh viên cần thấy giảng viên có mặt hay không. |
| `/presence/{uid}` ghi | `auth.uid === $uid` và `auth.token.role === 'LECTURER'` | Claim `role` do backend gắn vào custom token (`STUDENT`, `LECTURER`, `ADMIN`). ADMIN cũng không ghi được presence. |
| payload `/presence/{uid}` | bắt buộc `status` (`IN_ROOM`, `ON_CAMPUS`, `AWAY`) và `updatedAt` (±60 giây), không cho trường lạ | Docs chưa quy định payload này; đây là đề xuất, đổi ở đây nếu màn hình giảng viên cần thêm trường. Xóa node (null) luôn được với giảng viên. |

## Dữ liệu backend thật (đã đối chiếu)

- `/activeBookings/{bookingId}`: `studentId`, `lecturerId` (UUID dạng chuỗi), `startAt`, `endAt` (ISO), `startAtMs`, `endAtMs` (epoch ms). Nguồn: `realtime/service/ActiveBookingProjection.java`.
- Custom token: `uid` = UUID user, claim `role` = `STUDENT`, `LECTURER` hoặc `ADMIN`. Nguồn: `FirebaseTokenServiceImplementation.java`.

## Deploy (khi có project thật, MO-02)

```bash
npx firebase deploy --only database --project <project-id>
```
