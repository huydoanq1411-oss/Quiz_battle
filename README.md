# Quiz Battle

Quiz Battle là ứng dụng web trò chơi câu hỏi trực tuyến, cho phép người chơi tạo phòng, tham gia ngay bằng mã phòng và thi đấu theo thời gian thực. Ứng dụng hỗ trợ cả tiếng Anh và tiếng Nhật, với nhiều mức độ từ cơ bản đến nâng cao, kèm theo bảng xếp hạng, lịch sử trận đấu và chi tiết từng match.

## Tính năng chính

- Đăng ký / đăng nhập bằng JWT
- Tạo phòng chơi theo ngôn ngữ, mức độ và số câu hỏi
- Tham gia phòng bằng mã code
- Câu hỏi theo thời gian thực qua Socket.IO
- Chế độ trò chơi đa người: lobby, bắt đầu, trả lời, lật đáp án và tổng kết
- Bảng xếp hạng tổng hợp theo ngôn ngữ
- Lịch sử trận đấu và chi tiết từng trận
- Hỗ trợ đề thi tiếng Anh (Vocabulary / IELTS) và tiếng Nhật (JLPT)

## Stack công nghệ

- Frontend: React 19, Vite, Redux Toolkit, Axios, React Router, Socket.IO Client
- Backend: NestJS, Prisma ORM, PostgreSQL, JWT, Socket.IO Server
- Cơ sở dữ liệu: PostgreSQL
- Triển khai: Docker Compose, Nginx

## Cấu trúc dự án

```text
quiz-battle/
├── backend/                 # API + game server + Prisma
│   ├── prisma/              # schema.prisma, migrations, seed
│   ├── src/                 # NestJS source
│   ├── Dockerfile
│   ├── package.json
│   └── README.md
├── frontend/                # React app
│   ├── src/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── README.md
├── docker-compose.yml       # Production stack
├── docker-compose.dev.yml   # DB for local development
├── README.md
└── .env.example (nếu bạn tạo file này)
```

## Yêu cầu hệ thống

- Node.js 20+
- npm hoặc pnpm
- Docker + Docker Compose (nếu chạy bằng container)
- PostgreSQL 16 (hoặc dùng Docker)

## Thiết lập biến môi trường

### 1) Biến môi trường cho Docker
Tạo file `.env` ở thư mục gốc:

```env
DB_PASSWORD=MatKhauManh123
JWT_SECRET=your_super_secret_key
```

`docker-compose.yml` sẽ dùng:
- `DB_PASSWORD` cho PostgreSQL
- `JWT_SECRET` cho backend

### 2) Biến môi trường cho backend khi chạy local
Tạo file `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:MatKhauManh123@localhost:5433/quizdb?schema=public"
JWT_SECRET="your_super_secret_key"
```

## Các cách chạy ứng dụng

| Cách chạy | Địa chỉ | Dùng khi | Cần mở | Sửa code | Database |
|---|---|---|---|---|---|
| Docker | `http://localhost` | Chạy thử toàn bộ ứng dụng, demo hoặc nộp bài | Docker Desktop | Cần build lại image | Container `db` trong `docker-compose.yml` |
| Dev local | `http://localhost:5173` | Đang viết và sửa code | Docker cho DB và 2 cửa sổ PowerShell | Frontend/backend tự cập nhật | Container dev, cổng `5433` |
| Công khai qua tunnel | Link `https://....trycloudflare.com` | Cho người khác truy cập để chơi | Docker và một cửa sổ `cloudflared` | Cần build lại như cách Docker | Container `db` trong `docker-compose.yml` |

### Cách 1: Chạy toàn bộ bằng Docker

Yêu cầu: Docker Desktop đang chạy. Tạo file `.env` ở thư mục gốc với nội dung:

```env
DB_PASSWORD=MatKhauManh123
JWT_SECRET=your_super_secret_key
```

Mở PowerShell tại thư mục gốc dự án và chạy:

```bash
docker compose up --build
```

Ứng dụng sẽ chạy tại `http://localhost`. Backend và Socket.IO được frontend proxy nội bộ; PostgreSQL chạy trong container `db`. Để xem trạng thái, mở PowerShell khác tại thư mục gốc và chạy `docker compose ps`. Dừng các container bằng `Ctrl+C` ở cửa sổ đang chạy Compose, hoặc chạy `docker compose down` ở cửa sổ khác.

### Cách 2: Chạy dev local

Yêu cầu: Docker Desktop đang chạy, cùng hai cửa sổ PowerShell. Cách này chỉ chạy PostgreSQL trong Docker; frontend và backend chạy trực tiếp để tự cập nhật khi sửa code.

**Bước 1: Khởi động database** — tại thư mục gốc, chạy ở cửa sổ PowerShell thứ nhất:

```powershell
docker compose -f docker-compose.dev.yml up -d
```

**Bước 2: Cài dependency, migrate và chạy backend** — trước tiên tạo `backend/.env` theo mẫu ở phần biến môi trường. Trong cửa sổ thứ nhất:

```powershell
Set-Location backend
npm install
npx prisma migrate deploy
npm run seed:kanji
npm run start:dev
```

Backend chạy tại `http://localhost:3000`.

**Bước 3: Chạy frontend** — mở cửa sổ PowerShell thứ hai tại thư mục gốc:

```powershell
Set-Location frontend
npm install
npm run dev
```

Mở `http://localhost:5173`. Vite tự proxy API và Socket.IO đến backend cổng `3000`. Database dev truy cập từ máy host tại cổng `5433`. Khi dừng làm việc, có thể tắt database bằng lệnh sau tại thư mục gốc:

```powershell
docker compose -f docker-compose.dev.yml down
```

### Cách 3: Công khai ứng dụng qua Cloudflare Tunnel

Yêu cầu: hoàn tất Cách 1, cài `cloudflared` và giữ Docker Compose hoạt động. Cách này tạo URL công khai tạm thời; bất kỳ ai có link đều có thể truy cập ứng dụng.

Mở thêm một cửa sổ PowerShell tại thư mục gốc và chạy:

```powershell
cloudflared tunnel --url http://localhost
```

Chờ lệnh hiển thị URL dạng `https://....trycloudflare.com`, rồi gửi link đó cho người chơi. Giữ cửa sổ `cloudflared` và các container Docker mở trong suốt thời gian chia sẻ. Nhấn `Ctrl+C` để dừng tunnel; URL tạm thời sẽ không còn hoạt động.

> Nếu chạy dev local, cần khởi động database trước backend; `DATABASE_URL` phải dùng cổng `5433` như mẫu ở trên.

## Migration & seed database

```bash
cd backend
npx prisma migrate deploy
npm run seed:kanji
```

`seed:kanji` dùng để nạp dữ liệu từ bộ thẻ Kanji/JLPT vào bảng `KanjiCard`.

## API chính

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

### Match history

- `GET /matches/mine`
- `GET /matches/leaderboard?lang=EN` hoặc `?lang=JA`
- `GET /matches/:id`

## Socket.IO events

Một số sự kiện chính mà frontend sử dụng:

- `room:create`
- `room:join`
- `game:start`
- `game:question`
- `game:answered`
- `game:reveal`
- `game:end`
- `room:players`

## Quy trình trò chơi

1. Người tạo phòng chọn ngôn ngữ, cấp độ, tổng số câu hỏi và tối đa người chơi
2. Người khác nhập mã phòng để join
3. Host bắt đầu trò chơi
4. Hệ thống random câu hỏi theo chủ đề và độ khó
5. Mỗi câu hỏi có thời gian giới hạn
6. Người chơi trả lời và hệ thống tính điểm theo thời gian còn lại
7. Sau khi hết lượt, hiện đáp án đúng và xếp hạng
8. Lịch sử trận đấu được lưu vào PostgreSQL

## Danh sách ảnh chụp màn hình

Thực hiện các bước dưới đây và lưu ảnh với tên tương ứng:

1. `01-login.png` — Trang đăng nhập. Bấm **Đăng xuất** rồi chụp màn hình.
2. `02-home.png` — Trang chủ. Sau khi đăng nhập, chọn English/日本語, chế độ chơi và cấp độ.
3. `03-lobby.png` — Sảnh chờ có 2 người chơi và mã phòng. Tài khoản 1 tạo phòng; tài khoản 2 mở cửa sổ ẩn danh và tham gia bằng mã phòng.
4. `04-playing.png` — Màn hình đang chơi có câu hỏi, thanh đếm ngược và dấu ✓. Bấm **Bắt đầu**, rồi chụp khi một người đã trả lời.
5. `05-reveal.png` — Màn hình xem đáp án, trong đó màu xanh là đúng và màu đỏ là sai. Chụp ngay sau khi hết giờ của một câu.
6. `06-result.png` — Bảng kết quả cuối trận. Chơi hết trận; chọn 3 câu để hoàn thành nhanh.
7. `07-leaderboard.png` — Bảng xếp hạng. Mở menu **Xếp hạng** sau khi đã có trận đấu.
8. `08-history.png` — Lịch sử trận đấu. Mở menu **Lịch sử**.
9. `09-japanese.png` — Một câu hỏi tiếng Nhật (日本語). Chơi thêm một trận ở chế độ tiếng Nhật.
10. `10-docker.png` — Kết quả lệnh `docker compose ps`. Chụp cửa sổ PowerShell sau khi chạy lệnh.
11. `11-mobile.png` — Màn hình điện thoại truy cập qua link tunnel (không bắt buộc).

## Gỡ lỗi nhanh

- `PrismaClientInitializationError`: kiểm tra `DATABASE_URL` và database đang chạy
- `JWT_SECRET` không tồn tại: thêm `JWT_SECRET` vào `.env` hoặc env runtime
- `Socket.IO` không kết nối: đảm bảo frontend gọi đúng backend và proxy `/socket.io/`
- `seed:kanji` lỗi: đảm tra `backend/prisma/schema.prisma` và database connection

## Đóng góp

- Tạo nhánh mới cho tính năng
- Commit mô tả rõ mục tiêu
- Kiểm tra build và test trước khi mở PR

## License

Dự án hiện chưa khai báo giấy phép rõ ràng. Nếu cần, bạn nên thiết lập license phù hợp như MIT hoặc Apache 2.0.
