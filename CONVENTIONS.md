# Quy ước mobile

Quy ước chung của 3 repo nằm ở [CONVENTIONS.md trong repo web](https://github.com/thien-0408/office-hours/blob/main/docs/CONVENTIONS.md). Kế hoạch nằm ở [MOBILE-PLAN.md](MOBILE-PLAN.md).

## Cấu trúc thư mục

MO-03 sẽ tạo cấu trúc này:

```text
src/
  api/          API client và các hàm gọi backend
  features/     mỗi tính năng một thư mục: auth, booking, chat, campus...
  firebase/     Firebase Auth, Realtime Database, Firestore, FCM
  navigation/   điều hướng
  components/   component dùng lại
  theme/        màu, cỡ chữ, khoảng cách
```

Một feature không import trực tiếp file bên trong feature khác. Phần dùng chung thì chuyển sang `components`, `api` hoặc `firebase`.

## Đặt tên

| Loại | Mẫu | Ví dụ |
|---|---|---|
| Màn hình | `<Tên>Screen.tsx` | `BookingDetailScreen.tsx` |
| Component | `PascalCase.tsx` | `SlotCard.tsx` |
| Hook | `use<Tên>.ts` | `useCampusLocation.ts` |
| Hàm và module tiện ích | `camelCase.ts` | `geo.ts` |

## Gọi dữ liệu

| Dữ liệu | Cách làm |
|---|---|
| Backend REST | Qua API client trong `src/api`, dùng `@tanstack/react-query` |
| Chat | Qua STOMP tới `/ws`. Mất kết nối thì lấy phần thiếu bằng REST |
| Bản sao trên Firestore | Chỉ đọc |
| Vị trí | Ghi `/bookingLive/{bookingId}/{uid}` trên Realtime Database |

- Token lưu bằng `expo-secure-store`, không ghi ra log.
- Ghi vị trí tối đa 1 lần mỗi 5 giây, hoặc ngay khi đi quá 5 m hay đổi block.
- Vị trí không gửi qua backend và không lưu vào Postgres.
- Danh sách dài dùng `@shopify/flash-list` và phân trang cursor.
- Khi đổi Firebase security rules, phải chạy lại test trên emulator (MO-13).

## Dữ liệu campus

- `docs/campus/*.json` được commit. OpenStreetMap yêu cầu ghi nguồn ODbL.
- `docs/campus/reference/` chỉ để ở máy vì sơ đồ thuộc về trường.

## Lệnh

```bash
npm start           # Metro
npm run android     # build và chạy trên Android
npm test
npm run lint
```

- Android cần JDK 21, và đường dẫn project không được có dấu tiếng Việt.
- Test GPS và chia sẻ vị trí trên máy thật, cần 2 điện thoại Android.
