# Backend - Quiz Battle

Backend của Quiz Battle là API + game server cho hệ thống học tiếng Anh thi đấu. Ứng dụng dùng NestJS, Prisma/PostgreSQL, Redis và Socket.IO cho xác thực, phòng multiplayer, Time Attack, Daily Challenge và bảng xếp hạng toàn cục.

## Chức năng chính

- Đăng ký và đăng nhập người dùng bằng JWT
- Tạo phòng trận đấu realtime với mã code
- Xử lý vòng chơi, câu hỏi, thời gian trả lời và điểm số
- Lưu lịch sử match và bảng xếp hạng
- Quản lý dữ liệu người chơi, kết quả và rank
- Tạo câu hỏi từ vựng/ngữ pháp CEFR A1-C2 từ question bank TypeScript
- Lưu solo sessions, Daily Challenge và leaderboard trong Redis

## Stack

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
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
REDIS_URL="redis://localhost:6379"
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

Question bank tiếng Anh được đóng gói cùng source, không cần seed. Seed Kanji chỉ còn để tương thích dữ liệu cũ:

```bash
npm run seed:kanji
```

## Prisma schema

Các model chính:

- `User`: thông tin người dùng
- `Match`: thông tin một trận đấu
- `MatchPlayer`: kết quả từng người chơi trong một trận
- `KanjiCard`: dữ liệu kanji / JLPT

Solo sessions, Daily Challenge và leaderboard dùng Redis; tài khoản và lịch sử multiplayer dùng PostgreSQL.

## API endpoints

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me` (yêu cầu JWT)

### Match

- `GET /matches/mine` (danh sách trận đã chơi của user)
- `GET /matches/leaderboard?lang=EN` hoặc `?lang=JA`
- `GET /matches/:id` (chi tiết một trận)

### English games (yêu cầu JWT)

- `POST /english-games/start` với `{kind: "time-attack" | "daily", level: "A1".."C2"}`
- `GET /english-games/:id` (resume session)
- `POST /english-games/:id/answer` với `{answer}`
- `POST /english-games/:id/items` với `{item: "fifty-fifty" | "extra-time" | "hint"}`
- `POST /english-games/:id/tab-hidden`
- `GET /english-games/leaderboard?scope=today|week|all`

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
7. Khi hết câu, emit `game:end` và lưu multiplayer match vào PostgreSQL

Time Attack dùng đồng hồ 60 giây và Daily Challenge dùng 10 câu B1 cố định theo ngày UTC. Trạng thái solo lưu Redis để có thể resume sau khi backend restart.

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
