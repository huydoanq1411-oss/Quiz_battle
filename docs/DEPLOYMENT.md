# Quiz Battle trên cloud

Mục tiêu: người chơi mở URL HTTPS là sử dụng được, kể cả khi máy của chủ dự án tắt. Không dùng Docker Desktop hoặc tunnel trên máy cá nhân để phục vụ bản cloud.

## Kiến trúc đã chuẩn bị

| Thành phần | Dịch vụ | Cấu hình trong repo |
| --- | --- | --- |
| Frontend React/Vite | Vercel | `frontend/vercel.json` |
| Backend NestJS + Socket.IO | Một Web Service Render | `render.yaml` |
| Tài khoản và lịch sử | Neon PostgreSQL | Prisma schema và migrations |
| Phòng, phiên cá nhân, bảng xếp hạng | Upstash Redis | `REDIS_URL`, giao thức Redis qua TLS |

## Tiến độ triển khai — 17/11/2026

- Frontend đã deploy thành công trên Vercel theo ảnh người dùng cung cấp.
- Backend Render đã Live tại `https://quiz-battle-api.onrender.com`, từ commit `ee449e4`.
- Health check: `https://quiz-battle-api.onrender.com/api/health`. Người dùng đã xác nhận truy cập thành công; chưa được kiểm tra độc lập từ môi trường phát triển.
- Giá trị kết nối frontend với backend:

  ```dotenv
  VITE_API_URL=https://quiz-battle-api.onrender.com/api
  VITE_SOCKET_URL=https://quiz-battle-api.onrender.com
  ```

- Domain frontend ban đầu: `quizbattle-frontend-iota.vercel.app`. Yêu cầu đổi sang `quizbattle.vercel.app` bị Vercel từ chối vì đã gán cho project khác. Domain thay thế sau đó chưa được xác nhận trong phiên làm việc.
- Kiểm tra domain cuối trong Vercel → Settings → Domains, rồi đặt `CLIENT_ORIGIN` trên Render thành origin HTTPS tương ứng, không có `/` cuối. Lưu và redeploy backend nếu giá trị thay đổi.
- Nếu chưa thêm hai biến `VITE_*` phía trên, thêm trong Vercel → Settings → Environment Variables → Production, rồi redeploy frontend.
- Còn cần xác nhận luồng đăng ký, đăng nhập, tạo/vào phòng và khôi phục giữa trận trên domain cuối.
- Secrets được quản lý trong dashboard của dịch vụ, không lưu connection string, mật khẩu hoặc `JWT_SECRET` vào Git.

Các mục bên dưới là hướng dẫn cấu hình và tái triển khai.

## 1. Tạo database

1. Tạo project Neon riêng cho Quiz Battle, chọn gói Free. Không dùng database LinguaPilot để chạy migration của Quiz Battle.
2. Lấy connection string PostgreSQL từ Neon, giữ tham số TLS `sslmode=require`. Có thể dùng URL kết nối trực tiếp cho backend nhỏ này và migration; không chép URL vào Git.
3. Tạo database Redis Upstash riêng, chọn gói Free và vùng gần backend.
4. Lấy URL **Redis protocol** dạng `rediss://default:<password>@<host>:6379`. Không dùng REST URL hoặc REST token thay cho `REDIS_URL`. Không tắt xác minh chứng chỉ TLS.

## 2. Tạo frontend Vercel

Import repository và chọn **Root Directory = frontend**, framework Vite. `vercel.json` đã có SPA fallback để các URL như `/room/ABCDE` mở trực tiếp được.

Lấy domain frontend chính thức để điền `CLIENT_ORIGIN` ở Render. Bản frontend đầu tiên chưa chơi được khi chưa có backend; sau bước 3, đặt hai biến môi trường và redeploy:

```dotenv
VITE_API_URL=https://<backend>.onrender.com/api
VITE_SOCKET_URL=https://<backend>.onrender.com
```

Hai biến trên là URL công khai. Không đặt mật khẩu DB, Redis hay JWT_SECRET trong bất kỳ biến `VITE_*` nào. Vite đóng gói giá trị biến vào frontend lúc build; thay biến cần redeploy.

## 3. Tạo backend Render

Có thể tạo Blueprint từ `render.yaml`, hoặc tạo Web Service thủ công với:

| Mục | Giá trị |
| --- | --- |
| Plan | Free |
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm ci --include=dev && npx prisma generate && npm run build` |
| Start Command | `npx prisma migrate deploy && node dist/main` |
| Health Check Path | `/api/health` |
| Node version | `24.21.0` |

Đặt các biến môi trường ở Render:

| Biến | Giá trị |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Connection string Neon, gồm cấu hình TLS |
| `REDIS_URL` | Connection string `rediss://...` của Upstash |
| `JWT_SECRET` | Chuỗi ngẫu nhiên dài, riêng của Quiz Battle; Blueprint có thể tự sinh |
| `CLIENT_ORIGIN` | Origin frontend thật, ví dụ `https://<frontend>.vercel.app`, không có dấu `/` cuối |

Render cấp `PORT`; code đọc biến này và bind `0.0.0.0`. Nếu có nhiều origin được phép, phân cách bằng dấu phẩy; không dùng wildcard cho mọi preview Vercel. Thêm origin preview cụ thể nếu cần kiểm thử.

Migration mới chỉ thêm `Match.roomId` nullable và unique index, không xóa lịch sử cũ. Khi khởi động, backend tự áp dụng migrations đã commit. Triển khai từ repo cần commit/push các file đã review; file trên máy chưa commit sẽ không tự có trên Render/Vercel.

## 4. Kiểm tra sau deploy

- `/api/health` trả `{ "ok": true, "db": "up", "redis": "up" }`; lỗi kết nối trả 503, không lộ connection string.
- Đăng ký, đăng nhập và tải lại trang vẫn giữ phiên.
- Dùng hai trình duyệt/tài khoản tạo phòng, vào phòng, bắt đầu, trả lời và xem lịch sử.
- Tải lại trang khi đã trả lời: giữ lựa chọn, điểm và thời hạn câu hiện tại.
- Mất mạng rồi nối lại: tự vào lại đúng phòng; người chưa tham gia không vào được trận đang chạy.
- Ở môi trường thử, restart backend giữa trận: phòng và điểm còn, câu đã quá hạn chuyển sang công bố đáp án; các câu tiếp theo tiếp tục với thời gian mới.
- Kết thúc trận chỉ có một bản ghi lịch sử với `roomId` tương ứng.
- Thử Time Attack, Daily, vật phẩm và bảng xếp hạng trên điện thoại.
- Tắt máy cá nhân và mở URL frontend bằng điện thoại: ứng dụng vẫn chạy.

## Giới hạn và phục hồi

- Render Free có thể ngủ; lần truy cập sau thời gian không hoạt động có thể chờ khoảng một phút. Frontend chờ kết nối tối đa 90 giây và Socket.IO tự kết nối lại. Đây không phải cam kết chạy 24/7 không gián đoạn.
- Chỉ chạy **một backend instance**. Khóa Redis ngăn ghi đè đồng thời nhưng chưa thay thế Socket.IO adapter và cơ chế sở hữu timer khi chạy nhiều instance.
- Mỗi phòng Redis hết hạn sau 24 giờ không được cập nhật. Đóng tab không xóa ngay phòng. Điểm/lựa chọn đã được xác nhận mới được bảo đảm lưu; đáp án chưa nhận được xác nhận cần kiểm tra lại sau kết nối.
- Restart không cấp lại thời gian cho câu đang chơi. Câu đã hết hạn chuyển sang reveal rồi tiếp tục, không tự bỏ qua toàn bộ các câu còn lại trong thời gian backend ngừng chạy.
- Redis/DB mất kết nối: thao tác báo lỗi hoặc timer thử lại sau 2 giây; không công bố kết thúc thành công trước khi lưu lịch sử PostgreSQL.
- Không đổi tên key, xóa Redis hoặc chạy migration của dự án khác vào cùng database. Theo dõi quota của từng nhà cung cấp; miễn phí phụ thuộc mức sử dụng và chính sách hiện hành.
- Khi rollback code, giữ cột nullable `roomId`; không cần xóa cột hoặc lịch sử. Backend/frontend phải được nâng cấp cùng phiên bản giao thức `room:state`.

Tài liệu nhà cung cấp: [Render Web Services](https://render.com/docs/web-services), [Render Free](https://render.com/docs/free), [Vite trên Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Neon](https://neon.com/pricing), [Upstash](https://upstash.com/pricing/redis).
