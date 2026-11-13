# Học style từ Mochy Music để áp dụng cho OfficeHours mobile

> Nguồn: [realidkroo/Mochy-Music](https://github.com/realidkroo/Mochy-Music), commit `ca10089` (12/11/2026). Mochy là app nghe nhạc Android viết bằng Kotlin và Jetpack Compose, giấy phép **GPL-3.0**. Tài liệu này chỉ ghi lại **ý tưởng thiết kế và thông số**, không chép code. Code Kotlin cũng không dùng thẳng được cho React Native; chép nguyên văn còn kéo theo nghĩa vụ GPL.
>
> Đọc kèm: `docs/mockups/index.html` (design hiện tại lấy từ web), `SCREENS-FIREBASE.md`, `MOBILE-PLAN.md`.

---

## 1. Tóm tắt

Phong cách của Mochy: **nền đen, các thanh điều khiển nổi bằng kính mờ tối, màu lấy từ nội dung (ảnh bìa), chữ đậm và chặt, góc bo squircle, chuyển động spring có rung phản hồi.**

Không phải phần nào cũng hợp với OfficeHours. Web OfficeHours dùng giao diện sáng kiểu "restrained" (nền `paper-50`, thẻ trắng). App lại là công cụ học vụ: nhiều chữ, nhiều trạng thái, ít ảnh. Hướng đề xuất:

- **Chế độ sáng giữ nguyên design web.** Chỉ mượn phần *chuyển động*, *hình khối* và *thanh nav nổi* của Mochy.
- **Chế độ tối lấy cảm hứng Mochy mạnh hơn:** nền gần đen, kính tối, header nhuốm màu.
- **Màu nhuốm lấy từ dữ liệu,** không lấy từ ảnh: màu của khoa, màu trạng thái booking, hoặc màu hash từ id giảng viên.

---

## 2. Thông số trích từ Mochy

### 2.1 Màu (chế độ tối)

| Vai trò | Giá trị Mochy | Nguồn |
|---|---|---|
| Background / surface | `#000000` | `ui/theme/Theme.kt` |
| surfaceVariant | `#1A1A1A` | như trên |
| primaryContainer / secondaryContainer | `#333333` / `#2C2C2C` | như trên |
| primary / secondary | `#E0E0E0` / `#B0B0B0` | như trên |
| Nền kính của thanh điều khiển nổi | `#131313` phủ **78%** | `ui/component/FrostedGlass.kt` |
| Viền mảnh của kính | trắng **5%**, đúng **2 px** vật lý (không phải 2 dp) | như trên |
| Bóng của kính | bán kính 6.3 dp, lan 2 dp, đen **12%** | như trên |
| Nền viên thuốc của tab đang chọn, nền khi nhấn nút | trắng **10%** | như trên |
| Màu khung xương khi tải | `#D9D9D9` ở **22%** | `RevealOnAppear.kt` |
| Mức nhuốm màu trang lên thanh nav | **55%**, chuyển trong 500 ms | `GlassKit.kt` |
| Cặp gradient dự phòng cho thẻ lớn | `#2D2B55→#151521`, `#1B382D→#0F1F17`, `#381B24→#1F0F15`, `#1B2838→#0F1521` | `CoverTint.kt` |

Không dùng Material You. App dùng bảng màu riêng để giao diện luôn đồng nhất.

### 2.2 Chữ

| Thuộc tính | Giá trị |
|---|---|
| Font | Inter (Thin → Black). Tên nghệ sĩ dùng font hiển thị BBH Bartle |
| Độ đậm | **SemiBold cho mọi cỡ chữ** |
| Khoảng cách chữ | **−0.05em cho mọi cỡ chữ** |
| Thang cỡ chữ | Theo Material 3: 57/45/36 · 32/28/24 · 22/16/14 · 16/14/12 · 14/12/11 sp |

### 2.3 Hình khối và kích thước

| Thứ | Giá trị |
|---|---|
| Bo góc | Squircle (siêu elip), không dùng cung tròn. Bo góc của hàng = bo góc ảnh + padding, để các góc lồng nhau đồng tâm |
| Bán kính hay dùng nhất | 18 › 16 › 20 › 14 › 12 › 24 dp |
| Thanh nav, chip, nút | Dạng viên thuốc |
| Thanh nav / thanh nav mảnh | 80 / 64 dp |
| Mini player, app bar, hàng danh sách | 64 dp |
| Thumbnail trong danh sách | 48 dp |
| Hero ở trang chủ | 527/874 ≈ **60%** chiều cao màn hình |

### 2.4 Chuyển động

| Hiệu ứng | Thông số |
|---|---|
| `press3D` | Khi nhấn, thẻ nghiêng tối đa **7°** theo vị trí ngón tay và thu còn **0.97**. Spring không nảy, độ cứng 420 |
| Chỉ báo tab | Spring damping 0.82, độ cứng 700 (vị trí) và 320 (kích thước) |
| Thẻ hero | Spring nảy nhiều, damping 0.35–0.4 |
| Nav và bottom sheet | Spring không nảy, độ cứng thấp hoặc trung bình-thấp |
| Hiện nội dung khi tải | Khung xương có sóng mờ chạy qua → nghỉ một nhịp → nội dung mờ dần hiện ra và trượt lên. Các mục xuất hiện cùng lúc thì chạy lần lượt. Mỗi mục **chỉ chạy một lần**, kể cả khi cuộn ra rồi cuộn lại |
| Số đếm | Kiểu đồng hồ cơ: chữ số cuộn dọc, mờ dần ở hai mép |
| Chuyển trang hero | Hiệu ứng quét có viền mềm, trôi nhẹ và hơi mờ, không trượt nguyên trang |
| Rung phản hồi | Khoảng 240 chỗ gọi, người dùng chỉnh được độ nhạy |

### 2.5 Các thành phần đặc trưng

- **Thanh nav viên thuốc nổi** cách mép dưới, các tab chỉ có icon, tab đang chọn có nền trắng 10%.
- **Mini player nổi** phía trên thanh nav, cùng công thức kính.
- **Header progressive blur:** nét ở trên, mờ dần khi xuống dưới.
- **Quầng sáng đầu trang:** hai hình oval mờ ở hai góc trên, mỗi cái nhuốm màu một ảnh bìa, mờ dần khi cuộn.
- **Lớp nhiễu hạt** rất nhẹ phủ trên kính, để blur tối không bị sọc màu.
- **Tiêu đề dãy "Recently Played ›":** cả dòng là vùng chạm, khi nhấn thì sáng thành viên thuốc kéo ngang màn hình.
- **Dãy cuộn ngang:** thẻ vuông 137 dp, tên và dòng phụ bên dưới, không có viền.

---

## 3. Đối chiếu với OfficeHours

| Ý tưởng của Mochy | Áp dụng | Cách chuyển sang OfficeHours |
|---|---|---|
| Thanh nav viên thuốc nổi + kính | ✅ Cả hai chế độ | Thay tab bar dính đáy trong mock. Chế độ sáng: trắng 80% + blur + viền `paper-200`. Chế độ tối: theo công thức Mochy (`#131313` 78%) |
| Mini player nổi | ✅ Đổi mục đích | Thành thẻ **"Buổi hẹn sắp tới / đang diễn ra"** nổi trên thanh nav: còn 15 phút → bấm mở màn 22 Live hoặc màn 19 Chat |
| Header progressive blur | ✅ | Header các màn có danh sách dài (10, 13, 24, 26) |
| Nhuốm màu theo nội dung | ✅ Đổi nguồn màu | Màu theo khoa hoặc hash id giảng viên, dùng 4 cặp dự phòng ở §2.1 cộng `coral/rose/mint` của web. Dùng cho header màn 11 (chi tiết giảng viên) và thẻ "Next up" |
| Quầng sáng đầu trang | ⚠️ Chỉ ở chế độ tối | Dashboard: quầng `brand-500` bên trái, quầng màu trạng thái lịch kế tiếp bên phải |
| Chỉ chế độ tối, nền `#000` | ❌ | Giữ chế độ sáng làm mặc định cho khớp web. Chế độ tối dùng `ink-950` gần đen, không đen tuyền, để thẻ còn phân lớp |
| SemiBold + −0.05em cho mọi cỡ chữ | ⚠️ Một phần | Giữ Plus Jakarta Sans (có dấu tiếng Việt; Inter cũng có nhưng sẽ lệch với web). Chỉ siết chữ ở tiêu đề (≥ 20 sp): −0.03 đến −0.04em. Chữ thường giữ 0 để dấu tiếng Việt không dính nhau |
| Squircle + góc đồng tâm | ✅ | Thẻ 20 (giữ bán kính của web), avatar trong hàng 14, hàng = avatar + padding |
| `press3D` | ✅ | Thẻ giảng viên, thẻ slot, thẻ lịch hẹn. Giảm nghiêng còn **4°** cho hợp phong cách công cụ |
| Hiện nội dung lần lượt + khung xương | ✅ | Mọi danh sách tải qua React Query |
| Số đếm kiểu đồng hồ cơ | ✅ | Ô thống kê trên dashboard, đồng hồ đếm ngược của offer (màn 16) |
| Hero 60% màn hình | ❌ | Dashboard cần đưa thông tin lên trước. Thẻ "Next up" cao tối đa khoảng 30% |
| Lấy màu từ ảnh bìa | ❌ | OfficeHours không có ảnh bìa; memoji quá nhỏ để lấy màu |
| Nhiều kiểu player để chọn | ❌ | Không liên quan |

---

## 4. Làm bằng React Native được không?

Stack hiện tại: RN 0.88.1, Expo `~58.0.0`, New Architecture. Mọi phiên bản ở đây cần kiểm tra lại ở MO-01.

Ký hiệu độ khó: 🟢 dễ (< ½ ngày) · 🟡 trung bình (1–2 ngày) · 🔴 khó hoặc rủi ro.

| Hiệu ứng | Làm bằng RN | Độ khó | iOS | Android | Ghi chú |
|---|---|---|---|---|---|
| Kính mờ (nav, thẻ nổi, toast) | `expo-blur` (`BlurView`) | 🟡 | Tốt, blur native | ⚠️ Xem §4.1 | Phần đáng lo nhất |
| Nền kính 78% + viền mảnh + bóng | View chồng lên BlurView, `borderWidth: StyleSheet.hairlineWidth`, `boxShadow` (RN ≥ 0.76) | 🟢 | ✅ | ✅ | `hairlineWidth` ≈ 1 px vật lý. Muốn đúng 2 px thì dùng `2 / PixelRatio.get()` |
| Lớp nhiễu hạt | `expo-image` với ảnh PNG 64×64 lặp lại, opacity 3–4% | 🟢 | ✅ | ✅ | |
| Progressive blur | `@shopify/react-native-skia` (`BackdropBlur` + mask gradient), hoặc chồng nhiều `BlurView` qua `@react-native-masked-view/masked-view` | 🔴 | ✅ | ⚠️ | Mochy tự viết shader AGSL nhiều dải. Trên RN nên làm bản đơn giản: BlurView + gradient mờ dần (`expo-linear-gradient`). Khác biệt khó nhận ra |
| Nhuốm màu (gradient, quầng sáng) | `expo-linear-gradient`; quầng oval dùng Skia `RadialGradient` hoặc `react-native-svg` | 🟢 | ✅ | ✅ | Tính màu từ dữ liệu thì không cần thư viện đọc ảnh |
| Chuyển màu nhuốm trong 500 ms | Reanimated `interpolateColor` / `withTiming` | 🟢 | ✅ | ✅ | |
| Squircle | `react-native-figma-squircle` (dựa trên `react-native-svg`) hoặc Skia `Path` | 🟡 | ✅ | ✅ | Squircle không dùng `overflow: hidden` để cắt được. Cắt ảnh hay nội dung cần SVG mask hoặc Skia. Nên chỉ áp cho thẻ và avatar, các nơi khác dùng `borderRadius` thường. iOS có `borderCurve: 'continuous'`, gần giống squircle và không tốn gì |
| `press3D` (nghiêng theo ngón tay) | Gesture Handler `Gesture.Manual`/`Pan` + Reanimated `transform: [{perspective}, {rotateX}, {rotateY}, {scale}]` | 🟢 | ✅ | ✅ | Chạy trên UI thread, đặt trong FlashList vẫn mượt |
| Spring theo thông số | Reanimated `withSpring({ damping, stiffness, mass })` | 🟢 | ✅ | ✅ | Compose dùng `dampingRatio`, Reanimated dùng `damping`, nên phải đổi: `damping = dampingRatio × 2 × √(stiffness × mass)` |
| Rung phản hồi | `expo-haptics` | 🟢 | ✅ | ✅ | Android rung yếu hơn, nhiều máy giá rẻ không rung được |
| Hiện nội dung lần lượt + khung xương | Reanimated `entering={FadeInUp.delay(i*40)}` (layout animations). Sóng mờ: `withRepeat` trên opacity hoặc Skia | 🟢 | ✅ | ✅ | "Chỉ chạy một lần" → lưu một Set id đã hiện trong ref hoặc zustand, bỏ `entering` cho mục đã có. FlashList tái dùng ô nên cần kiểm tra kỹ |
| Số đếm kiểu đồng hồ cơ | Tự viết: mỗi chữ số là một cột 0–9, `translateY` theo Reanimated, mờ ở mép bằng MaskedView + gradient | 🟡 | ✅ | ✅ | Có thể thử thư viện có sẵn, nhưng tự viết chỉ khoảng 80 dòng |
| Thanh nav nổi | React Navigation `tabBar` tùy biến, `position: 'absolute'`; nội dung thêm `paddingBottom` | 🟢 | ✅ | ✅ | Viên thuốc tab đang chọn trượt theo bằng Reanimated |
| Thẻ "buổi hẹn" nổi (kiểu mini player) | View nằm ngoài navigator, đọc dữ liệu realtime từ RTDB `/bookingLive` | 🟡 | ✅ | ✅ | Phần khó là logic hiện/ẩn theo giờ, không phải phần giao diện |
| Hiệu ứng quét chuyển trang | Skia shader hoặc MaskedView + gradient động | 🔴 | ✅ | ✅ | Không cần cho OfficeHours. Bỏ |
| Font: siết chữ | `letterSpacing` trong RN tính bằng **pt, không phải em**. −0.04em × 24 sp = **−0.96** | 🟢 | ✅ | ✅ | Cần hàm `ls(size, em)` trong `tokens.ts` |

### 4.1 Kính mờ trên Android: phần rủi ro chính

- iOS: `BlurView` dùng `UIVisualEffectView`, nhanh và đẹp.
- Android: blur thật cần API 31+ (`RenderEffect`). `expo-blur` trên Android cần bật phương pháp blur riêng, gắn với view nguồn để chụp nền. **API này thay đổi qua nhiều bản SDK, phải đọc docs `expo-blur` của SDK 58 ở MO-01.** Nếu không bật, Android chỉ hiện nền mờ đục, không blur.
- Chi phí GPU: chính Mochy ghi nhận blur chất lượng cao tốn **11–15 ms GPU mỗi khung hình khi cuộn** trên máy tầm trung 120 Hz, nên nó tự hạ chất lượng trên máy yếu.

**Cách xử lý cho OfficeHours:**
1. Giới hạn kính ở **3 chỗ**: thanh nav, thẻ buổi hẹn nổi, toast. Header danh sách dùng nền đặc + gradient mờ dần.
2. Tạo component `<Glass>` có ba mức:
   - `high`: BlurView, cho iOS và Android API 31+ có `PixelRatio ≥ 3`;
   - `low`: BlurView với bán kính nhỏ hơn;
   - `solid`: nền `#131313` hoặc `paper-0` ở 94%, không blur.

   Thêm tùy chọn chất lượng trong màn 7 Cài đặt.
3. Màn 20 và 22 có canvas 3D (`expo-gl`). **Không đặt BlurView trên GLView**, vì blur phải chụp lại khung hình GL liên tục. Trên các màn này, nav dùng mức `solid`.
4. Đo trên **máy Android tầm trung thật** bằng Perf Monitor hoặc `adb shell dumpsys gfxinfo`, không chỉ đo trên emulator.

### 4.2 Hiệu năng danh sách

- Danh sách dùng `@shopify/flash-list` (đã có trong plan). Mọi hiệu ứng chạy bằng Reanimated worklet, không dùng `Animated` của RN core.
- `press3D` chỉ tạo shared value khi đang nhấn. Không đặt `useAnimatedStyle` nặng trong mọi ô.
- Ảnh dùng `expo-image` với `recyclingKey`, để ảnh không nhấp nháy khi FlashList tái dùng ô.

---

## 5. Thư viện cần thêm

So với bảng ở `docs/mockups/index.html`, cần thêm:

| Gói | Dùng cho | Bắt buộc? |
|---|---|---|
| `@shopify/react-native-skia` | Quầng sáng, sóng mờ của khung xương, progressive blur nếu làm bản đầy đủ | Không bắt buộc. Gói nặng (khoảng 4–6 MB APK), chỉ thêm khi thật cần |
| `react-native-figma-squircle` | Squircle | Không bắt buộc. iOS có `borderCurve: 'continuous'`, Android dùng `borderRadius` thường cũng chấp nhận được |
| `@react-native-masked-view/masked-view` | Mép mờ của số đếm, progressive blur đơn giản | Nên có |

Các gói đã nằm trong đề xuất trước: `expo-blur`, `expo-linear-gradient`, `react-native-reanimated`, `react-native-gesture-handler`, `expo-haptics`, `expo-image`, `@shopify/flash-list`.

---

## 6. Token đề xuất (`src/theme/tokens.ts`)

```ts
// Glass — lấy từ FrostedGlass.kt của Mochy, chỉnh lại cho chế độ sáng
export const glass = {
  dark:  { tint: 'rgba(19,19,19,0.78)', outline: 'rgba(255,255,255,0.05)', highlight: 'rgba(255,255,255,0.10)', blur: 48 },
  light: { tint: 'rgba(255,255,255,0.80)', outline: 'rgba(220,226,237,0.9)' /* paper-200 #DCE2ED */, highlight: 'rgba(52,101,224,0.10)' /* brand-500 */, blur: 32 },
  shadow: '0 2px 6px rgba(0,0,0,0.12)',
} as const;

// Thang bo góc (squircle khi có thể); hàng = avatar + padding
export const radius = { xs: 8, sm: 12, md: 14, lg: 18, card: 20, sheet: 26, pill: 999 } as const;

// Kích thước cố định
export const size = { navBar: 72, floatingCard: 64, listRow: 64, avatarRow: 44, appBar: 56 } as const;

// letterSpacing của RN tính bằng pt
export const ls = (fontSize: number, em: number) => fontSize * em;
export const tracking = { display: -0.04, title: -0.03, body: 0 } as const;

// Spring (Reanimated): đổi từ dampingRatio của Compose
const spring = (ratio: number, stiffness: number, mass = 1) =>
  ({ damping: ratio * 2 * Math.sqrt(stiffness * mass), stiffness, mass });
export const springs = {
  press:     spring(1.0, 420),   // press3D
  indicator: spring(0.82, 700),  // viên thuốc tab đang chọn
  sheet:     spring(1.0, 400),   // bottom sheet
  bouncy:    spring(0.4, 900),   // điểm nhấn nhỏ (huy hiệu, nút gửi)
} as const;

export const press3D = { maxTilt: 4, pressedScale: 0.97 } as const;

// Gradient nhuốm màu dự phòng (lấy từ CoverTint.kt), chọn bằng hash(lecturerId) % 4
export const tintPairs = [
  ['#2D2B55', '#151521'], ['#1B382D', '#0F1F17'], ['#381B24', '#1F0F15'], ['#1B2838', '#0F1521'],
] as const;
```

---

## 7. Lộ trình đề xuất

| Bước | Việc | Khi nào |
|---|---|---|
| 1 | `tokens.ts` (§6), component `<Glass>` ba mức, `<PressableCard press3D>` | Cùng MO-02 (theme) |
| 2 | Thanh nav viên thuốc nổi, khung xương + hiện nội dung lần lượt cho mọi danh sách | Khi làm màn 5, 10, 13 |
| 3 | Thẻ "buổi hẹn sắp tới" nổi (đọc RTDB `/bookingLive`) | Sau khi realtime chạy (màn 22) |
| 4 | Header nhuốm màu ở chi tiết giảng viên, số đếm kiểu đồng hồ cơ ở dashboard | Giai đoạn chỉnh giao diện |
| 5 | Chế độ tối theo phong cách Mochy, quầng sáng | Sau cùng, khi chế độ sáng đã ổn định |
| — | Progressive blur đầy đủ, hiệu ứng quét chuyển trang | Bỏ, trừ khi còn thời gian |

**Kết luận:** khoảng 80% phong cách Mochy làm được trên RN với chi phí thấp, chủ yếu bằng Reanimated, Gesture Handler, `expo-blur` và `expo-linear-gradient`. Rủi ro thật nằm ở **blur trên Android**: chi phí GPU và API của `expo-blur` thay đổi theo SDK. Vì vậy cần component `<Glass>` có mức `solid` dự phòng ngay từ đầu, và không đặt kính lên canvas 3D.

---

## 8. Quy tắc giao diện đã chốt (12/11/2026)

> Mục này **ghi đè** các mục trên nếu có chỗ mâu thuẫn. Mock áp dụng các quy tắc này nằm ở `docs/mockups-mochy/`.

### 8.1 Hướng chung
- **Dark-first.** Nền `#000`, các lớp tách bằng độ sáng: `#0D0D0D` thẻ, `#161616` ô nhập, `#1F1F1F` avatar và nút tròn. Chế độ sáng làm sau.
- **Màn auth dùng chung ngôn ngữ với phần còn lại.** Bỏ kiểu neo-brutalist sáng của web.
- **Font Inter.** Chữ thường đậm 500–600, khoảng cách −0.01 đến −0.02em. Tiêu đề đậm 700, −0.045 đến −0.055em. Không dùng −0.05em cho chữ thường tiếng Việt vì dấu dễ dính nhau.
- **Nút chính** là viên thuốc `#E0E0E0` chữ đen. Link là chữ trắng đậm. Màu brand `#3465E0` chỉ còn ở quầng sáng nền và icon app.

### 8.2 Nội dung đi trước, icon đi sau
Các app lớn trông hiện đại vì **nội dung thật** (ảnh, logo dịch vụ, số liệu) chiếm chỗ, không phải icon. OfficeHours có các nội dung sau:

| Nội dung | Nguồn | Dùng ở |
|---|---|---|
| Ảnh giảng viên | `photoUrl` (`LecturerMapper`, `SuggestedSlotResponse`) | Dashboard, tìm kiếm, chi tiết giảng viên (header kiểu trang nghệ sĩ), lịch hẹn, thông báo, chat |
| Ảnh sinh viên | Memoji, hoặc ảnh khi đã có upload | Danh sách duyệt, chat, admin |
| Logo dịch vụ họp | Tên miền của `meetingUrl` → Zoom, Google Meet, Teams | Nút "Tham gia trên Zoom" ở lịch hẹn online |
| Logo ứng dụng ngoài | Gmail, Google Calendar | Màn "Kiểm tra hộp thư", "Thêm vào lịch" |
| Số liệu, ngày giờ | API | Số lớn, khối ngày `18 / TH 11`, thời gian dạng chữ |

- **Ảnh giảng viên là "ảnh bìa" của app.** Header chi tiết giảng viên: ảnh tràn viền, mờ dần xuống nền đen. Nền thẻ nhuốm theo màu chủ đạo của ảnh; tốt nhất backend tính sẵn màu này khi upload.
- **Ảnh dự phòng là memoji**, không dùng icon người hay chữ cái viết tắt.
- **Ảnh phải được người trong ảnh đồng ý.** Giảng viên tự tải lên. Không lấy ảnh từ website trường khi chưa xin phép.

### 8.3 Giới hạn icon
Icon nét (Lucide, đơn sắc) **chỉ dùng ở**:
1. Tab bar (4–5 icon).
2. Nút back, đóng, thêm, xem thêm (⋯).
3. Hành động trong không gian chật: gửi tin, hiện/ẩn mật khẩu, xóa chữ trong ô.
4. Chevron `›` báo có thể bấm vào.

**Không dùng icon ở:**
- Đầu ô nhập (nhãn chữ là đủ).
- Trước mỗi dòng thông tin (ngày, giờ, phòng): trình bày bằng chữ như "Thứ Tư 18/11 · 14:00 · B11.204".
- Tiêu đề mục, dòng trong cài đặt, empty state.
- Ô icon to giữa màn hình (vòng tròn chứa phong bì, vòng tròn chứa dấu tick).
- Tính năng AI: **không dùng ✨**, không dùng gradient tím. Gọi tên tính năng bằng chữ, ví dụ "Tóm tắt tự động".

**Không có icon màu và không có ô nền màu sau icon.** Icon dùng `currentColor` ở 3 mức: 100% (đang chọn, hành động chính), 62% (bình thường), 38% (phụ, bị tắt).

### 8.4 Glyph trạng thái
Không dùng chấm tròn 6px trước nhãn trạng thái (kiểu AI hay dùng). Mỗi trạng thái là **một glyph tròn đặc có dấu khoét rỗng**, kiểu SF Symbols `.fill`:

| Glyph | Trạng thái | Độ sáng |
|---|---|---|
| Đồng hồ | `PENDING` | 62% |
| Tick | `CONFIRMED`, `FULFILLED` | 100% |
| Tick đôi | `COMPLETED` | 100% |
| Ba gạch | `WAITING` | 62% |
| Mũi tên chéo | `OFFERED` | 100% |
| × | `DECLINED` | 62% |
| − | `CANCELLED`, `EXPIRED` | 62% |
| ! | `NO_SHOW`, toast lỗi | 100% |

- Glyph luôn đi kèm chữ, không đứng một mình.
- Toast dùng glyph 30px ở đầu, không đặt icon trong vòng xám.
- Trong RN: dùng `react-native-svg`, khoét bằng `fillRule="evenodd"` hoặc `<Mask>`.

### 8.5 Màu
Ngoài đen, trắng và các sắc xám, màu chỉ xuất hiện ở:
1. **Ảnh và logo thương hiệu**, giữ nguyên màu gốc.
2. **Quầng sáng nền** mờ, mỗi màn một tông lấy từ `tintPairs` hoặc từ ảnh giảng viên.
3. **Chữ và viền báo lỗi** `#FF8A80`.

### 8.6 Logo thương hiệu bên ngoài
- Chỉ dùng logo khi bấm vào sẽ mở đúng dịch vụ đó.
- Dùng file gốc hoặc Simple Icons (CC0, nhưng nhãn hiệu vẫn thuộc chủ sở hữu). Không đổi màu, không kéo méo, chừa đủ khoảng trống quanh logo.
- Không có nút "Đăng nhập bằng Google/Microsoft" khi backend chưa hỗ trợ.

### 8.7 Logo OfficeHours
- Chữ **"oh"** viết thường bằng nét tròn: chữ o là vòng thời gian còn hở một khe ở hướng 12–2 giờ ("còn slot trống"), chữ h đứng sát bên. Chỉ một màu.
- File nằm ở `docs/mockups-mochy/logo/`: `oh-mark.svg`, `oh-appicon.svg`, `oh-appicon-light.svg`, `oh-wordmark.svg`.
- Wordmark viết thường: **officehours**, Inter 700, −0.05em.
- Logo cũ dùng 3 gradient (`office-hours/public/Logo.svg`) cần thay cùng lúc trên web để đồng bộ.

### 8.8 Bố cục
- **Thanh nav viên thuốc nổi**, kính tối `#131313` 78%. Tab chỉ có icon; tab đang chọn có nền trắng 10% và hiện thêm nhãn.
- **Thẻ "buổi hẹn sắp tới" nổi** trên thanh nav (thay cho mini player). Hiện từ 60 phút trước giờ hẹn đến lúc buổi hẹn kết thúc.
- **Tiêu đề mục kiểu "Gợi ý cho bạn ›":** cả dòng là vùng chạm, không có icon.
- **Dãy cuộn ngang** dùng thẻ ảnh chân dung. Danh sách dọc: ảnh 48px, hai dòng chữ, không có icon đầu dòng.

### 8.9 Số liệu và chart
- **Mobile không có chart.** Dashboard dùng số lớn (odometer) và một dòng mô tả ngắn. Chart tải giảng viên, Lorenz, Gini, frontier chỉ có trên web.
- Không thêm thư viện chart (`victory-native`, `react-native-gifted-charts`) vào app.
- Nếu sau này cần so sánh nhanh: xếp hạng dạng danh sách, mỗi dòng có ảnh, tên, con số và một thanh ngang mảnh màu xám (`View` thường, không phải chart).

### 8.10 Map và vị trí
- Vị trí luôn ghi nguồn bằng chữ nhỏ dưới tên người: "B11 · tầng 2 (ước lượng)", "B11 · tầng 2 (tự chọn)", "tại phòng 306.B11".
- Tầng ước lượng hiện nhãn viền nét đứt; tầng chọn tay hoặc phòng thật hiện nhãn viền liền.
- Chấm người trên map là ảnh tròn có viền trắng, không phải chấm màu. Vòng sai số là vòng tròn trắng 8% theo `acc`.
- Phòng đích là khối trắng sáng duy nhất trên map; mọi block khác xám.
