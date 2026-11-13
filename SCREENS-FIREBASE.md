# Checklist màn hình, tính năng và Firebase

Cập nhật: 12/11/2026. Backend đã xong B0–B7, nên mọi API dưới đây đều có sẵn trừ khi ghi khác.

Tài liệu liên quan: [MOBILE-PLAN.md](MOBILE-PLAN.md) (task `MO-xx`), [CHECKLIST.md](CHECKLIST.md) (tiến độ theo task), hợp đồng API [capstone-api-endpoints.md](https://github.com/thien-0408/office-hours/blob/main/docs/capstone-api-endpoints.md) (§8.1 là phần realtime cho mobile). API đang chạy thật xem ở Swagger `http://<host>:8080/api/v1/swagger`.

Tick màn hình khi đã nối API thật (không còn dữ liệu giả), cùng commit với code.

## 1. Màn hình và tính năng

Ký hiệu vai trò: **SV** sinh viên, **GV** giảng viên, **AD** admin. Đường dẫn API tính từ `/api/v1`. Dấu ➕ là màn hình chưa có trong 24 màn hình của MOBILE-PLAN §7, nhưng backend đã có API.

### Tài khoản

- [ ] **1. Đăng nhập** `LoginScreen` · tất cả · MO-04
  - [ ] `POST /auth/login`, lưu `accessToken` và `refreshToken` bằng `expo-secure-store`
  - [ ] Sau đăng nhập: `GET /users/me`, `POST /realtime/firebase-token`, `signInWithCustomToken`, subscribe FCM topic `user-<uuid>`
  - [ ] Xử lý `429 AUTH_RATE_LIMITED`, hiện thời gian chờ theo header `Retry-After`
- [ ] **2. Đăng ký** `RegisterScreen` · SV, GV · MO-04
  - [ ] `POST /auth/register` (chỉ chọn `STUDENT` hoặc `LECTURER`), xong thì quay về đăng nhập
  - [ ] Hiện lỗi theo từng field từ `details.errors[]` của `400 VALIDATION_FAILED`
- [ ] **3. Quên mật khẩu** `ForgotPasswordScreen` · tất cả · MO-04
  - [ ] `POST /auth/forgot-password`, luôn hiện cùng một thông báo (backend luôn trả `202`)
- [ ] ➕ **4. Đặt lại mật khẩu** `ResetPasswordScreen` · tất cả · MO-04
  - [ ] Mở từ deep link có `token`, gọi `POST /auth/reset-password`
  - [ ] Link trong email hiện trỏ tới `FRONTEND_URL` của web. Muốn mở thẳng app thì cần thêm Android App Links, nếu không thì cho phép dán token bằng tay.

### Chung

- [ ] **5. Dashboard realtime** `DashboardScreen` · tất cả · MO-21
  - [ ] Nghe Firestore `users/{uid}/bookings`, hiện booking hôm nay và sắp tới, cập nhật ngay khi trạng thái đổi
  - [ ] SV: card gợi ý `GET /users/me/suggested-slots?category=&limit=6`, đặt nhanh 1 chạm
  - [ ] GV: số yêu cầu đang chờ duyệt, nút sang màn 24
- [ ] **6. Hồ sơ** `ProfileScreen` · tất cả · MO-05
  - [ ] `GET /users/me`, `PATCH /users/me` (`fullName`, `department`)
  - [ ] GV: chọn phòng làm việc từ `GET /campus/rooms`, lưu `officeRoomId`
- [ ] **7. Cài đặt** `SettingsScreen` · tất cả · MO-05
  - [ ] 4 công tắc `notificationPrefs` (chỉ ảnh hưởng email, không ảnh hưởng push)
  - [ ] Ngôn ngữ `en`/`vi`, gửi qua header `Accept-Language`
  - [ ] Công tắc chia sẻ vị trí, nút xóa dữ liệu vị trí
  - [ ] ➕ Đổi mật khẩu `POST /users/me/change-password`
  - [ ] Đăng xuất: `POST /auth/logout`, hủy subscribe FCM, `signOut` Firebase, xóa token
- [ ] **8. Thông báo** `NotificationsScreen` · tất cả · MO-20
  - [ ] Danh sách từ Firestore `users/{uid}/notifications` (realtime) hoặc `GET /notifications?unreadOnly=`
  - [ ] `POST /notifications/{id}/read`, `POST /notifications/read-all`
  - [ ] Chạm vào thông báo có `bookingId` thì mở màn 14, có `waitlistEntryId` thì mở màn 16
- [ ] **9. Trợ giúp và Giới thiệu** `HelpScreen` · tất cả · MO-05
  - [ ] Ghi nguồn OpenStreetMap (ODbL) và giải thích quyền riêng tư vị trí

### Booking

- [ ] **10. Tìm giảng viên** `LecturerSearchScreen` · SV · MO-17
  - [ ] `GET /lecturers?q=&department=&dayOfWeek=&availableOnly=`, phân trang, FlashList
- [ ] **11. Chi tiết giảng viên và slot** `LecturerDetailScreen` · SV · MO-17
  - [ ] `GET /lecturers/{id}` (có `officeRoom`), `GET /lecturers/{id}/slots?week=YYYY-Www`
  - [ ] Slot `available: false` thì hiện nút vào waitlist, `conflict: true` thì báo trùng booking của mình
  - [ ] Nút "xem phòng trên map" nếu có `officeRoom`
- [ ] **12. Đặt lịch** `BookSlotScreen` (hoặc bottom sheet) · SV · MO-17
  - [ ] `POST /bookings { slotId, topic }`. Không gửi `participantEmails`, vì group booking chưa có (BE-37).
  - [ ] `409` có `waitlistAvailable: true` thì gợi ý vào waitlist; `409 BOOKING_ALREADY_REQUESTED`; `422` trùng lịch học
- [ ] **13. Danh sách booking** `BookingListScreen` · SV, GV · MO-18
  - [ ] `GET /bookings?status=`, tab theo trạng thái, phân trang
- [ ] **14. Chi tiết booking** `BookingDetailScreen` · SV, GV · MO-18, MO-20
  - [ ] `GET /bookings/{id}`, `GET /bookings/{id}/timeline`
  - [ ] SV: hủy `POST /bookings/{id}/cancel` (xử lý `409 CANCELLATION_NOTICE_PASSED`), đổi lịch
  - [ ] GV: duyệt hoặc từ chối, sửa link họp `PATCH /bookings/{id}`
  - [ ] Nút mở chat (khi `CONFIRMED` hoặc đã kết thúc), nút mở buổi hẹn trực tiếp khi gần đến giờ
- [ ] ➕ **15. Chọn slot đổi lịch** `RescheduleScreen` (hoặc bottom sheet) · SV · MO-20
  - [ ] Lấy slot của cùng giảng viên, gọi `POST /bookings/{id}/reschedule { newSlotId }`; booking mới ở trạng thái `PENDING`
- [ ] **16. Waitlist** `WaitlistScreen` · SV · MO-22
  - [ ] `POST /slots/{id}/waitlist`, `GET /waitlist/me`, `DELETE /waitlist/{id}`
  - [ ] Nghe Firestore `users/{uid}/waitlist` để thấy `position` và offer ngay
  - [ ] Offer: đếm ngược tới `offerExpiresAt`, `POST /waitlist/{id}/accept` hoặc `/decline`

### Lịch

- [ ] ➕ **17. Lịch bận của tôi** `MyScheduleScreen` · SV, GV · MO-19
  - [ ] `GET /users/me/schedule-entries`, thêm `POST /users/me/schedule-entries`, xóa `DELETE /schedule-entries/{id}`
  - [ ] Lịch sử import `GET /users/me/schedule-imports`
- [ ] **18. Quét thời khóa biểu (AI)** `ScheduleScanScreen` · SV, GV · MO-27
  - [ ] Chụp ảnh, ML Kit đọc chữ, chuyển thành `ParsedTimetableRow[]`
  - [ ] Màn soát lại cho sửa từng dòng trước khi gửi
  - [ ] `POST /users/me/schedule-entries/batch` (`REPLACE`/`MERGE`, tối đa 2.000 dòng); `422` thì chỉ ra dòng lỗi theo `rowIndex`

### Chat

- [ ] **19. Phòng chat** `ChatScreen` · SV, GV · MO-16, MO-25
  - [ ] STOMP qua `ws://<host>:8080/api/v1/ws`, gửi `Authorization: Bearer` trong frame CONNECT
  - [ ] Subscribe `/topic/bookings/{id}/messages`, `/topic/bookings/{id}/typing`, `/user/queue/chat-errors`
  - [ ] Gửi `/app/bookings/{id}/messages { clientMessageId, body }`, khử trùng tin theo `id`
  - [ ] Lịch sử `GET /bookings/{id}/messages?before=`; nối lại thì lấy phần thiếu bằng `?after=`
  - [ ] Đang gõ, đã xem `POST /bookings/{id}/messages/read`; dịch tin `SYSTEM` theo key
  - [ ] `ROOM_CLOSED` thì khóa ô nhập
  - [ ] GV: nút "Đã gặp" `POST /bookings/{id}/complete` và "Vắng mặt" `/no-show` (chỉ hiện từ giờ bắt đầu)

### Campus

- [ ] **20. Map 3D** `CampusMapScreen` · tất cả · MO-10, MO-15, MO-24
  - [ ] Các block lấy từ `campus.json`, phòng từ `GET /campus/rooms`
  - [ ] Trạng thái giảng viên từ `/presence`; chỉ đường A* (Should)
- [ ] **21. Xin phép vị trí** `LocationConsentScreen` · tất cả · MO-09
  - [ ] Giải thích dữ liệu nào được chia sẻ, với ai, trong bao lâu, rồi mới xin quyền hệ điều hành
- [ ] **22. Buổi hẹn trực tiếp** `LiveMeetingScreen` · SV, GV · MO-14, MO-23
  - [ ] Đọc `/activeBookings/{id}`, ghi `/bookingLive/{id}/{uid}` (giới hạn tần suất), `onDisconnect().remove()`
  - [ ] Hiện chấm của người kia; chỉ mở được khi booking còn trong `/activeBookings`
  - [ ] Payload: `building`, `x`, `z`, `acc`, `updatedAt`, thêm `floor` (số hoặc `null`) và `floorSource` (`baro`, `manual`, `room`). Ghi rõ nguồn tầng trên giao diện

### Giảng viên

- [ ] **23. Availability** `AvailabilityScreen` · GV · MO-19
  - [ ] Rules: `GET/POST /lecturers/{me}/availability-rules`, `PATCH/DELETE /availability-rules/{id}`
  - [ ] Exceptions: `GET/POST /lecturers/{me}/availability-exceptions`, `DELETE /availability-exceptions/{id}`
  - [ ] Học kỳ đang dùng lấy từ `GET /semesters/active`
- [ ] **24. Hàng đợi duyệt** `ReviewQueueScreen` · GV · MO-18
  - [ ] `GET /bookings?status=PENDING`, `POST /bookings/{id}/confirm`, `/decline { reason }`
  - [ ] Xử lý `409 SLOT_ALREADY_CONFIRMED` và `409 SLOT_HELD_FOR_WAITLIST`
  - [ ] Tab tùy chọn: hàng đợi waitlist `GET /lecturers/me/slot-waitlist`
- [ ] **25. Biên bản họp và tóm tắt AI** `MeetingRecordScreen` · GV · MO-28
  - [ ] `PATCH /bookings/{id}/meeting-record { attended, notes }`
  - [ ] Nút tóm tắt bằng `@react-native-firebase/ai`, cho sửa trước khi lưu

### Admin

- [ ] **26. Quản lý user** `UserAdminScreen` · AD · MO-06
  - [ ] `GET /users?role=&department=`, `GET/PATCH/DELETE /users/{id}`
- [ ] **27. Sơ đồ hoạt động campus (ẩn danh)** `CampusActivityScreen` · AD · Could
  - [ ] Chỉ hiện số người theo block, không hiện danh tính

Nếu thiếu thời gian: gộp 12 và 15 thành bottom sheet, gộp đổi mật khẩu vào màn 7, bỏ 16, 23 và 27. Khi đó vẫn còn trên 20 màn hình.

### Tính năng dùng chung (không phải màn hình)

- [ ] API client: base URL theo môi trường, tự gọi `/auth/refresh` một lần khi gặp `401` rồi gửi lại, gửi `Accept-Language` và `X-Request-Id`
- [ ] Đọc lỗi theo `status` + `error` (không dựa vào `message`), hiện lỗi theo field cho `VALIDATION_FAILED` và `MULTIPLE_ERRORS`
- [ ] React Query: hủy cache liên quan khi nhận FCM hoặc khi Firestore đổi
- [ ] Điều hướng theo vai trò: tab khác nhau cho SV, GV, AD
- [ ] Giờ hiển thị theo `Asia/Ho_Chi_Minh`, `dayOfWeek` theo ISO (1 = Thứ 2)
- [ ] Trạng thái mất mạng, tự nối lại STOMP khi app quay lại foreground
- [ ] Không có endpoint `/research/*`, `/admin/analytics/*`, `/bookings/group`, `/bookings/recurring`; không làm màn hình cho các phần này
- [ ] Không có chart trên mobile. Dashboard dùng số lớn; biểu đồ tải giảng viên chỉ có trên web (`GET /admin/stats/booking-load`, BE-51)

## 2. Cài Firebase

Thứ tự: làm 2.1–2.5 trong console và ở backend trước (MO-02), sau đó cài vào app (2.6), cuối cùng là rules và emulator (2.7, MO-13).

### 2.1 Tạo project và app Android

- [ ] Tạo Firebase project (ví dụ `officehours-eiu`). Google Analytics không bắt buộc.
- [ ] Add app Android, package `vn.edu.eiu.officehours` (khớp `applicationId` trong `android/app/build.gradle`).
- [ ] Thêm SHA-1 của debug keystore: `cd android && ./gradlew signingReport`. Đăng nhập bằng custom token không cần SHA-1, nhưng thêm sẵn để sau này không phải quay lại.
- [ ] Tải `google-services.json`, đặt vào `android/app/`.
- [ ] Repo đang public, nên thêm `android/app/google-services.json` vào `.gitignore` và gửi file này riêng cho thành viên. File không chứa bí mật như service account, nhưng không cần đưa lên công khai.

### 2.2 Bật các dịch vụ

| Dịch vụ | Cài trong console | Ghi chú |
|---|---|---|
| Authentication | Mở trang Authentication, bấm Get started | Không cần bật provider nào; custom token chạy được ngay |
| Firestore | Create database, region `asia-southeast1`, chế độ production | Rules lấy từ repo backend (2.5) |
| Realtime Database | Create database, region `asia-southeast1`, chế độ locked | Lấy URL dạng `https://<project>-default-rtdb.asia-southeast1.firebasedatabase.app` |
| Cloud Messaging | FCM API (V1) đã bật sẵn | Không cần làm gì thêm cho topic |
| Performance Monitoring | Mở trang Performance, bấm Get started | Dữ liệu đầu tiên có thể mất vài giờ mới hiện |
| Firebase AI Logic | Bật, chọn Gemini Developer API | Dùng cho MO-28; nên bật App Check trước khi demo công khai |

Firestore và Realtime Database chọn cùng region và chọn ngay từ đầu, vì sau khi tạo thì không đổi được region.

### 2.3 Service account cho backend

- [ ] Project settings → Service accounts → Generate new private key.
- [ ] Lưu file JSON **ngoài git** (repo backend đã chặn `*firebase-adminsdk*.json`).
- [ ] Đặt biến môi trường cho backend:

```env
FIREBASE_ENABLED=true
FIREBASE_CREDENTIALS_PATH=/đường/dẫn/tới/officehours-eiu-firebase-adminsdk.json
FIREBASE_PROJECT_ID=officehours-eiu
FIREBASE_DATABASE_URL=https://officehours-eiu-default-rtdb.asia-southeast1.firebasedatabase.app
```

- [ ] Kiểm tra: đăng nhập, gọi `POST /realtime/firebase-token`, phải nhận `200 { firebaseToken }`. Nhận `503 REALTIME_DISABLED` nghĩa là chưa bật, `502 REALTIME_UPSTREAM_FAILED` nghĩa là credentials sai.
- [ ] Thiếu `FIREBASE_DATABASE_URL` thì backend bỏ qua việc ghi `/activeBookings` và chỉ log một cảnh báo.

### 2.4 Dữ liệu backend đẩy lên Firebase

Chỉ backend được ghi các đường này, app chỉ đọc.

| Nơi | Đường | Dùng ở màn |
|---|---|---|
| Firestore | `users/{uid}/bookings/{bookingId}` | 5, 13, 14 |
| Firestore | `users/{uid}/notifications/{id}` | 8 |
| Firestore | `users/{uid}/waitlist/{entryId}` | 16 |
| Firestore | `lecturerSlots/{lecturerId}` (dữ liệu chung, **chưa** lọc theo lịch của sinh viên) | 11, chỉ để biết khi nào cần tải lại |
| Realtime DB | `/activeBookings/{bookingId}` `{ studentId, lecturerId, startAt, endAt, startAtMs, endAtMs }` (`*Ms` là epoch milliseconds, dùng cho rules) | 22 |
| FCM | topic `user-<uuid>` | Toàn app |

Các đường app được ghi: `/bookingLive/{bookingId}/{uid}` (người trong booking) và `/presence/{uid}` (giảng viên).

FCM data: thông báo có `type` (tên dạng chấm như `booking.confirmed`), `notificationId`, và `bookingId`, `waitlistEntryId`, `slotId` nếu có. Tin chat có `{ type: "CHAT_MESSAGE", bookingId, messageId }`.

### 2.5 Firestore rules

- [ ] Dùng file `OfficeHours/firebase/firestore.rules` trong repo backend: chủ tài khoản đọc được `users/{uid}/**`, ai đăng nhập cũng đọc được `lecturerSlots`, không ai ghi được.
- [ ] Deploy: `firebase deploy --only firestore:rules --project <project-id>`.
- [ ] Query có `where` + `orderBy` trên hai field khác nhau sẽ cần composite index; bấm vào link trong lỗi để tạo, rồi lưu lại vào `firestore.indexes.json`.

### 2.6 Cài vào app

- [ ] Cài các gói (cùng một phiên bản chính, kiểm tra trên rnfirebase.io):

```bash
npm i @react-native-firebase/app @react-native-firebase/auth \
  @react-native-firebase/database @react-native-firebase/firestore \
  @react-native-firebase/messaging @react-native-firebase/perf \
  @react-native-firebase/ai
```

- [ ] `android/build.gradle`: thêm classpath `com.google.gms:google-services` và `com.google.firebase:perf-plugin`.
- [ ] `android/app/build.gradle`: apply `com.google.gms.google-services` và `com.google.firebase.firebase-perf`.
- [ ] Build lại bằng `npm run android` (không dùng lại bản build cũ).
- [ ] Đăng nhập:

```ts
const { firebaseToken } = await api.post('/realtime/firebase-token');
await auth().signInWithCustomToken(firebaseToken);
// auth().currentUser.uid === UUID của user trên backend
// role nằm trong token claims: (await auth().currentUser.getIdTokenResult()).claims.role
```

- [ ] Token Firebase tự làm mới; nếu backend tắt Firebase (`503`) thì app vẫn chạy được phần REST.
- [ ] FCM:
  - [ ] Android 13 trở lên: xin quyền `POST_NOTIFICATIONS`
  - [ ] Sau đăng nhập `messaging().subscribeToTopic('user-' + uid)`, khi đăng xuất `unsubscribeFromTopic`
  - [ ] `setBackgroundMessageHandler` đặt trong `index.js`, trước khi đăng ký app
  - [ ] Tạo notification channel cho Android
  - [ ] Chạm vào push thì điều hướng theo `type`
- [ ] Performance: trace tùy chỉnh `location_to_render`, `presence_publish` (MO-29). Request gọi bằng `fetch` từ JS không tự được đo; muốn đo thì bọc bằng `perf().newHttpMetric`.
- [ ] Kết nối backend khi dev: emulator Android dùng `http://10.0.2.2:8080/api/v1`, điện thoại thật dùng IP LAN của máy chạy backend. Bản debug đã cho phép HTTP thường (`usesCleartextTraffic`).

### 2.7 Realtime Database rules và emulator (MO-13)

Backend chưa có rules cho Realtime Database; repo mobile giữ file này. Bản nháp `database.rules.json`:

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "activeBookings": {
      "$bookingId": {
        ".read": "auth != null && (data.child('studentId').val() === auth.uid || data.child('lecturerId').val() === auth.uid)",
        ".write": false
      }
    },
    "bookingLive": {
      "$bookingId": {
        ".read": "auth != null && (root.child('activeBookings').child($bookingId).child('studentId').val() === auth.uid || root.child('activeBookings').child($bookingId).child('lecturerId').val() === auth.uid)",
        "$uid": {
          ".write": "auth != null && auth.uid === $uid && (root.child('activeBookings').child($bookingId).child('studentId').val() === auth.uid || root.child('activeBookings').child($bookingId).child('lecturerId').val() === auth.uid) && (!newData.exists() || (now >= root.child('activeBookings').child($bookingId).child('startAtMs').val() && now <= root.child('activeBookings').child($bookingId).child('endAtMs').val() + 900000))",
          ".validate": "newData.hasChildren(['building', 'x', 'z', 'acc', 'updatedAt']) && (!newData.child('floor').exists() || (newData.child('floor').isNumber() && newData.child('floor').val() >= -2 && newData.child('floor').val() <= 20)) && (!newData.child('floorSource').exists() || newData.child('floorSource').val().matches(/^(baro|manual|room)$/))"
        }
      }
    },
    "presence": {
      ".read": "auth != null",
      "$uid": {
        ".write": "auth != null && auth.uid === $uid && auth.token.role === 'LECTURER'"
      }
    }
  }
}
```

**Khung giờ:** chỉ ghi được vị trí từ `startAtMs` đến `endAtMs` + 15 phút (900000 ms), lấy từ `/activeBookings` do backend ghi. Xóa vị trí của chính mình (`onDisconnect().remove()`) thì luôn được, miễn booking còn trong `/activeBookings`. Muốn cho chia sẻ sớm hơn giờ bắt đầu (ví dụ để đi tới phòng) thì đổi `now >= startAtMs` thành `now >= startAtMs - 900000`. App vẫn nên tự tắt chia sẻ ngoài khung giờ để không bị rules từ chối liên tục.

- [ ] `firebase init emulators`: chọn Auth, Firestore, Database; tạo `firebase.json` ở repo mobile
- [ ] Test rules bằng `@firebase/rules-unit-testing`:
  - [ ] Không ghi được `/bookingLive/{id}/{uid người khác}`
  - [ ] Không ghi được vị trí trước `startAtMs` hoặc sau `endAtMs` + 15 phút
  - [ ] Người ngoài booking không đọc được `/bookingLive/{id}`
  - [ ] Sinh viên không ghi được `/presence`
  - [ ] Không ai ghi được `/activeBookings`
- [ ] Deploy: `firebase deploy --only database --project <project-id>`

### 2.8 Kiểm tra toàn luồng

- [ ] Hai tài khoản trên hai máy: SV đặt, GV duyệt, cả hai thấy Firestore `bookings` đổi ngay và nhận push
- [ ] `/activeBookings/{id}` xuất hiện sau khi duyệt và biến mất khi hủy hoặc hoàn thành
- [ ] Hai máy thấy nhau trong `/bookingLive` lúc đến giờ hẹn
- [ ] App ở background nhận được push chat, chạm vào thì mở đúng phòng chat
- [ ] Firebase console có số liệu Performance và mức dùng còn trong gói miễn phí
