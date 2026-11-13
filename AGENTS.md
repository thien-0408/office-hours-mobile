# Hướng dẫn cho agent: repo mobile

Repo này là **app React Native** của OfficeHours, làm cho môn CSW434. Quy ước code ở [CONVENTIONS.md](CONVENTIONS.md), kế hoạch ở [MOBILE-PLAN.md](MOBILE-PLAN.md), tiến độ ở [CHECKLIST.md](CHECKLIST.md), danh sách màn hình và cách cài Firebase ở [SCREENS-FIREBASE.md](SCREENS-FIREBASE.md).

- Trước khi làm giao diện, đọc [docs/STYLE-MOCHY.md](docs/STYLE-MOCHY.md) §8 và mock ở `docs/mockups-mochy/`. §8 được ưu tiên hơn các mục khác trong file đó.
- Chạy `npm test` và `npm run lint` trước khi push.

## Dự án OfficeHours: 3 repo

Ba repo được clone **cạnh nhau trong cùng một thư mục cha**, nên đường dẫn dưới đây tính từ thư mục gốc của repo này. Không đặt repo trong đường dẫn có dấu tiếng Việt, vì build Android sẽ lỗi.

| Repo | Đường dẫn | Remote, nhánh | Vai trò |
|---|---|---|---|
| Web | `../office-hours` | `thien-0408/office-hours`, tạo nhánh từ `main` | Next.js. Giữ hợp đồng API và schema |
| Backend | `../office-hours-backend` (Maven ở `OfficeHours/`) | `chaunhattang/office-hours` (private), chỉ dùng `feature/realtime-hybrid` | Spring Boot, backend duy nhất cho web và mobile |
| Mobile | `../office-hours-mobile` | `thien-0408/office-hours-mobile`, tạo nhánh từ `main` | React Native cho CSW434 |

Nếu thiếu repo nào thì clone vào cạnh repo này: `gh repo clone <remote> <thư mục>`. Với backend thì checkout thêm `feature/realtime-hybrid`.

**Đọc docs trước. Chỉ đọc code repo khác khi docs không trả lời được.**

| Cần | Đọc |
|---|---|
| Bản đồ và tiến độ cả dự án | `../office-hours/docs/PROJECT-HUB.md` |
| Quy ước chung: nhánh, commit, JSON, lỗi, thời gian | `../office-hours/docs/CONVENTIONS.md` |
| Hợp đồng API (§8.1 là realtime và Firebase) | `../office-hours/docs/capstone-api-endpoints.md` |
| Schema database | `../office-hours/docs/capstone-db-schema.md` |
| Kiến trúc backend, mô hình hybrid Postgres + Firebase | `../office-hours-backend/OfficeHours/ARCHITECTURE.md` |
| Plan và checklist từng repo | Web: `docs/WEB-CHECKLIST.md`. Backend: `OfficeHours/BACKEND-PLAN.md`, `OfficeHours/CHECKLIST.md`. Mobile: `MOBILE-PLAN.md`, `CHECKLIST.md`, `SCREENS-FIREBASE.md` |

- JSON mà API trả về thật nằm ở DTO của backend: `OfficeHours/src/main/java/eiu/officehours/*/model/responses/` và `*/spi/*Response.java`. Nếu DTO khác docs thì báo người dùng, không tự chọn một bên.
- Không lấy type từ `lib/office-hours/types.ts` của web. File đó là dữ liệu mock, id dạng số, còn API dùng UUID.
- Đổi API hoặc schema thì sửa docs ở web trước, rồi backend, rồi mới tới web và mobile.
- Chỉ sửa repo khác khi người dùng yêu cầu. Backend là nhánh dùng chung: không commit hay push vào đó khi chưa được đồng ý.
