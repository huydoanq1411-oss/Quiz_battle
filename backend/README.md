# Backend - Quiz Battle

Backend của Quiz Battle là API + game server cho hệ thống quiz realtime. Ứng dụng dùng NestJS, Prisma và PostgreSQL để xử lý xác thực người chơi, lưu lịch sử trận, tính điểm và quản lý phòng chơi qua Socket.IO.

## Chức năng chính

- Đăng ký và đăng nhập người dùng bằng JWT
- Tạo phòng trận đấu realtime với mã code
- Xử lý vòng chơi, câu hỏi, thời gian trả lời và điểm số
- Lưu lịch sử match và bảng xếp hạng
- Quản lý dữ liệu người chơi, kết quả và rank
- Seed dữ liệu Kanji/JLPT

## Stack

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- Socket.IO
- Passport + JWT

## Cài đặt

```bash
cd backend
npm install
```

## Biến môi trường

Tạo file `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:MatKhauManh123@localhost:5432/quizdb?schema=public"
JWT_SECRET="your_super_secret_key"
```

## Chạy backend

```bash
npm run start
```

Chế độ dev:

```bash
npm run start:dev
```

## Database

Khởi tạo database và chạy migration:

```bash
npx prisma migrate deploy
```

Nếu cần seed bộ câu hỏi Kanji:

```bash
npm run seed:kanji
```

## Prisma schema

Các model chính:

- `User`: thông tin người dùng
- `Match`: thông tin một trận đấu
- `MatchPlayer`: kết quả từng người chơi trong một trận
- `KanjiCard`: dữ liệu kanji / JLPT

## API endpoints

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me` (yêu cầu JWT)

### Match

- `GET /matches/mine` (danh sách trận đã chơi của user)
- `GET /matches/leaderboard?lang=EN` hoặc `?lang=JA`
- `GET /matches/:id` (chi tiết một trận)

## Socket.IO

Backend expose các event realtime cho frontend:

- `room:create`
- `room:join`
- `room:players`
- `game:start`
- `game:question`
- `game:answered`
- `game:reveal`
- `game:end`

## Luồng trò chơi

1. Người tạo phòng gửi `room:create` với ngôn ngữ, mức độ và số câu hỏi
2. Người chơi join bằng `room:join`
3. Host bắt đầu trò chơi bằng `game:start`
4. Backend random câu hỏi từ `QuestionService`
5. Người chơi trả lời trên thời gian giới hạn
6. Backend tính điểm theo độ chính xác và thời gian còn lại
7. Khi hết câu, emit `game:end` và lưu match vào DB

## Scripts hữu ích

```bash
npm run build
npm run test
npm run test:e2e
npm run lint
```

## Lưu ý

- Bật PostgreSQL trước khi chạy backend
- Nếu chạy ở Docker, `DATABASE_URL` được cung cấp từ compose
- Nếu đổi cấu trúc Prisma, nhớ chạy `npx prisma generate` hoặc migration tương ứng
