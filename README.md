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
DATABASE_URL="postgresql://postgres:MatKhauManh123@localhost:5432/quizdb?schema=public"
JWT_SECRET="your_super_secret_key"
```

## Chạy bằng Docker (khuyến nghị cho production-like setup)

Từ thư mục gốc:

```bash
docker compose up --build
```

Sau khi khởi động:

- Frontend: http://localhost
- Backend: http://localhost/api
- Database: PostgreSQL chạy trong container

Nếu muốn chỉ chạy database để phát triển local:

```bash
docker compose -f docker-compose.dev.yml up -d
```

## Chạy local development

### Backend

```bash
cd backend
npm install
npx prisma migrate deploy
npm run seed:kanji
npm run start:dev
```

Backend sẽ chạy tại http://localhost:3000

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend React sẽ chạy tại http://localhost:5173

> Nếu bạn chạy local, nhớ bật database PostgreSQL trước, và backend/frontend cần cùng truy cập đúng `DATABASE_URL` và `JWT_SECRET`.

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
