# Quiz Battle

Quiz Battle là trò chơi thi đấu giúp học tiếng Anh với các cấp độ CEFR từ A1 đến C2. Người chơi có thể thi Time Attack trong 60 giây, hoàn thành Daily Challenge gồm 10 câu giống nhau mỗi ngày, luyện tập trong phòng nhiều người và cạnh tranh trên bảng xếp hạng Redis toàn cục.

---

## Mục lục

- [Tính năng](#tính-năng)
- [Chế độ chơi](#chế-độ-chơi)
- [Ảnh chụp màn hình](#ảnh-chụp-màn-hình)
- [Công nghệ](#công-nghệ)
- [Kiến trúc](#kiến-trúc)
- [Luật chơi và tính điểm](#luật-chơi-và-tính-điểm)
- [Mô hình dữ liệu](#mô-hình-dữ-liệu)
- [Tài liệu API](#tài-liệu-api)
- [Sự kiện Socket.IO](#sự-kiện-socketio)
- [Bắt đầu](#bắt-đầu)
   - [Chạy bằng Docker](#chạy-bằng-docker)
   - [Thiết lập môi trường phát triển](#thiết-lập-môi-trường-phát-triển)
   - [Biến môi trường](#biến-môi-trường)
- [Chia sẻ liên kết công khai](#chia-sẻ-liên-kết-công-khai)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Xử lý sự cố](#xử-lý-sự-cố)
- [Giới hạn](#giới-hạn)
- [Định hướng phát triển](#định-hướng-phát-triển)

---

## Tính năng

- **Tài khoản**: đăng ký và đăng nhập bằng JWT; mật khẩu được băm bằng bcrypt.
- **Phòng chơi**: tạo phòng, tham gia bằng mã 5 ký tự; chủ phòng có thể bắt đầu trận.
- **Lộ trình CEFR**: học từ vựng và ngữ pháp tiếng Anh từ A1 đến C2; giao diện tiếng Việt, nội dung học bằng tiếng Anh.
- **Time Attack**: trả lời nhiều câu nhất có thể trong 60 giây; chuỗi trả lời đúng liên tiếp giúp nhân điểm.
- **Daily Challenge**: mỗi ngày UTC có cùng một bộ 10 câu B1 cho mọi người; mỗi tài khoản chỉ được tính điểm một lần mỗi ngày và có thể duy trì chuỗi ngày.
- **Phòng luyện tập**: giữ lại chế độ thi nhiều người bằng mã phòng và lịch sử trận đấu.
- **Dạng câu hỏi**: chọn nghĩa, xếp chữ cái, điền từ, nghe và chọn đáp án bằng giọng đọc tổng hợp của trình duyệt, cùng Wordle.
- **Vật phẩm hỗ trợ**: 50/50, thêm 10 giây và gợi ý chữ cái đầu; mỗi vật phẩm chỉ dùng một lần trong một lượt.
- **Thi đấu thời gian thực**: danh sách người chơi trực tiếp, dấu xác nhận khi người chơi đã trả lời và đồng hồ đếm ngược.
- **Tính điểm**: 100 điểm cho mỗi câu đúng, cộng tối đa 50 điểm thưởng tốc độ.
- **Bảng xếp hạng**: dùng Redis sorted set toàn cục cho hôm nay, tuần này và mọi lúc.
- **Lịch sử**: xem danh sách trận đã chơi và chi tiết từng trận.
- **Chống gian lận cơ bản**: máy chủ xác thực câu trả lời, điểm số và thời hạn; việc chuyển tab được ghi nhận.
- **Docker**: khởi động toàn bộ hệ thống bằng một lệnh.

## Ảnh chụp màn hình

> Thêm ảnh vào thư mục `docs/screenshots/` và giữ nguyên tên file bên dưới.
> Hiện repository chưa có các file ảnh này; hãy thêm ảnh vào thư mục để chúng hiển thị trong README.

| Đăng nhập | Trang chủ |
|---|---|
| ![Login](docs/screenshots/01-login.png) | ![Home](docs/screenshots/02-home.png) |

| Sảnh chờ | Đang chơi |
|---|---|
| ![Lobby](docs/screenshots/03-lobby.png) | ![Playing](docs/screenshots/04-playing.png) |

| Công bố đáp án | Kết quả cuối trận |
|---|---|
| ![Reveal](docs/screenshots/05-reveal.png) | ![Result](docs/screenshots/06-result.png) |

| Bảng xếp hạng | Lịch sử |
|---|---|
| ![Leaderboard](docs/screenshots/07-leaderboard.png) | ![History](docs/screenshots/08-history.png) |

| Chế độ ngữ pháp | Điện thoại (qua tunnel) |
|---|---|
| ![Grammar](docs/screenshots/09-grammar.png) | ![Mobile](docs/screenshots/11-mobile.png) |

**Các container đang chạy**

![Docker](docs/screenshots/10-docker.png)

## Công nghệ

| Lớp | Công nghệ |
|---|---|
| Frontend | React, TypeScript, Vite, Redux Toolkit, React Router, Axios, Socket.IO client |
| Backend | NestJS 12, Socket.IO, Passport JWT, bcrypt |
| Database | PostgreSQL 16, Prisma ORM |
| Cache / bảng xếp hạng / phiên chơi cá nhân | Redis 7 sorted set và key có thời hạn |
| Triển khai | Docker Compose (db, Redis, backend, frontend chạy bằng Nginx), Cloudflare Tunnel |

## Kiến trúc

```
Browser / phone
      |  https://xxx.trycloudflare.com   (optional, public link)
      v
 Cloudflare tunnel (cloudflared on your machine)
      |
      v
 localhost:80
 +--------------------------- Docker Compose ----------------------------+
 |  frontend (Nginx)                                                     |
 |    /            -> built React app (static files)                     |
 |    /api/        -> backend:3000   (REST)                              |
 |    /socket.io/  -> backend:3000   (WebSocket)                         |
 |                         |                                             |
 |                         v                                             |
|  backend (NestJS) --- Prisma ---> db (PostgreSQL, volume: dbdata)     |
|         |                                                            |
|         +---- redis (sorted sets / persistent solo sessions) --------|
 +-----------------------------------------------------------------------+
```

- **Nginx** phục vụ bản React đã build và làm reverse proxy, nhờ đó trình duyệt chỉ cần kết nối đến một địa chỉ.
- **REST** (`/api`) xử lý đăng ký, đăng nhập, bảng xếp hạng và lịch sử.
- **Socket.IO** (`/socket.io`) xử lý các hoạt động thời gian thực như phòng chơi, câu hỏi, câu trả lời và điểm số.
- Trạng thái phòng multiplayer được lưu trong bộ nhớ backend; phiên chơi cá nhân, trạng thái hoàn thành Daily Challenge/chuỗi ngày, điểm xếp hạng và tên người chơi được lưu trong Redis. Tài khoản và lịch sử trận multiplayer được lưu trong PostgreSQL.
- Chỉ container `frontend` mở cổng ra máy chủ; backend và database chỉ truy cập được bên trong mạng Docker.

## Luật chơi và tính điểm

| Luật | Giá trị |
|---|---|
| Time Attack | 60 giây, trả lời được càng nhiều câu càng tốt |
| Daily Challenge | 10 câu B1 cố định theo ngày UTC |
| Phòng multiplayer | 15 giây mỗi câu; công bố đáp án trong 3 giây |
| Số câu mỗi trận multiplayer | Từ 3 đến 20 câu (chủ phòng chọn) |
| Trả lời đúng | 100 điểm |
| Điểm thưởng tốc độ | Tối đa 50 điểm, tỷ lệ theo thời gian còn lại |
| Combo cá nhân | 10 điểm cơ bản cho mỗi câu đúng; cứ 3 câu đúng liên tiếp thì hệ số tăng, tối đa 5× |
| Kết thúc sớm | Câu hỏi kết thúc ngay khi tất cả người chơi đang kết nối đã trả lời |

Máy chủ tính thời gian và điểm số. Giao diện hiển thị hạn chót và đồng hồ đếm ngược do máy chủ cung cấp.

## Chế độ chơi

| Dạng chơi | Kỹ năng | Trạng thái |
|---|---|---|
| Chọn nghĩa | Từ vựng | Sẵn sàng |
| Xếp chữ cái | Chính tả | Sẵn sàng |
| Điền vào chỗ trống | Ngữ pháp | Sẵn sàng |
| Nghe và chọn đáp án | Nghe bằng chức năng đọc tiếng Anh của trình duyệt | Sẵn sàng |
| Wordle | Từ vựng và chính tả | Sẵn sàng |
| Ghép tranh, Hangman, sửa lỗi, xếp câu, nói, đọc hiểu, nối từ, ô chữ, Boggle | Tổng hợp | Đã tạo khung, còn TODO |

Các trò chơi cá nhân dùng chung interface module trong `backend/src/quiz/english-game-modes.ts`: mỗi module khai báo ID và kỹ năng, tạo câu hỏi theo cấp CEFR cùng bộ sinh số ngẫu nhiên được truyền vào, sau đó kiểm tra câu trả lời. Time Attack chọn các module đã hoàn thiện. Daily Challenge chọn module và câu hỏi có thể tái tạo từ seed theo ngày UTC.

### Thêm dạng chơi hoặc câu hỏi

1. Thêm mục từ vựng hoặc ngữ pháp có `level` từ `A1` đến `C2` vào `backend/src/quiz/english-learning-bank.ts`. Nên có ít nhất 4 mục mỗi cấp độ để tạo phương án nhiễu trắc nghiệm.
2. Khai báo `EnglishModeId` và `EnglishGameModule` trong `english-game-modes.ts`. Cài đặt `generateQuestion(level, random)` bằng hàm random được truyền vào để Daily Challenge luôn tái tạo được, đồng thời cài đặt `checkAnswer` ở server.
3. Chỉ thêm ID vào `PLAYABLE_MODES` khi dạng chơi đã sẵn sàng. Chỉ thêm vào `DAILY_MODES` nếu phù hợp với thử thách chung hằng ngày. Module đang dựng khung có `todo: true` nên sẽ không được chọn.
4. Thêm test tập trung trong `english-game-modes.spec.ts`, sau đó chạy `npm run build`, `npm run lint` và `npm test -- --runInBand src/quiz/english-game-modes.spec.ts` từ thư mục `backend/`.

## Mô hình dữ liệu

| Model | Trường | Mục đích |
|---|---|---|
| `User` | id, email (duy nhất), name, password (đã băm), createdAt | Tài khoản |
| `Match` | id, code, language (`EN`/`JA`), totalQuestions, createdAt | Một trận đã kết thúc |
| `MatchPlayer` | id, matchId, userId, score, rank | Kết quả người chơi trong trận |
| `KanjiCard` | id, kanji (duy nhất), meanings, kunReadings, onReadings, jlpt, grade | Dữ liệu câu hỏi cũ được giữ tương thích |

Quan hệ: `User` - `MatchPlayer` - `Match` (quan hệ nhiều-nhiều thông qua `MatchPlayer`).

Câu hỏi luyện tiếng Anh nằm trong `backend/src/quiz/english-learning-bank.ts`; interface các dạng chơi nằm trong `backend/src/quiz/english-game-modes.ts`. Model `KanjiCard` cũ và API trận multiplayer vẫn được giữ để tương thích.

## Tài liệu API

Tất cả route REST đều có tiền tố `/api`. Route yêu cầu xác thực cần header `Authorization: Bearer <token>`.

| Phương thức | Route | Xác thực | Mô tả |
|---|---|---|---|
| Phương thức | Route | Xác thực | Mô tả |
| POST | `/api/auth/register` | Không | Body `{email, name, password}` (mật khẩu tối thiểu 6 ký tự). Trả về `{token, user}` |
| POST | `/api/auth/login` | Không | Body `{email, password}`. Trả về `{token, user}` |
| GET | `/api/auth/me` | Có | Thông tin người dùng hiện tại |
| GET | `/api/matches/mine` | Có | 20 trận gần nhất của bạn |
| GET | `/api/matches/leaderboard?lang=EN\|JA` | Có | Bảng xếp hạng trận multiplayer cũ |
| GET | `/api/matches/:id` | Có | Chi tiết trận và thứ hạng |
| POST | `/api/english-games/start` | Có | Bắt đầu hoặc tiếp tục `{kind: time-attack\|daily, level: A1..C2}` |
| GET | `/api/english-games/:id` | Có | Tiếp tục phiên chơi cá nhân được lưu trong Redis |
| POST | `/api/english-games/:id/answer` | Có | Gửi câu trả lời; đáp án đúng không bao giờ được trả về |
| POST | `/api/english-games/:id/items` | Có | Dùng `fifty-fifty`, `extra-time` hoặc `hint` một lần mỗi lượt |
| POST | `/api/english-games/:id/tab-hidden` | Có | Ghi nhận việc chuyển tab trong lượt chơi |
| GET | `/api/english-games/leaderboard?scope=today\|week\|all` | Có | Top 10 toàn cục từ Redis sorted set |

## Sự kiện Socket.IO

Gói bắt tay Socket.IO phải có JWT: `io({ auth: { token } })`. Token không hợp lệ sẽ bị từ chối.

| Sự kiện | Chiều | Payload | Mô tả |
|---|---|---|---|
| `room:create` | client → server | `{lang, total, mode, level}` | Tạo phòng; ack trả về `{ok, code}` |
| `room:join` | client → server | `{code}` | Vào phòng; ack trả về `{ok, code, lang, mode, level}` hoặc `{error}` |
| `room:players` | server → phòng | `[{userId, name, score, isHost}]` | Danh sách người chơi, điểm và trạng thái chủ phòng |
| `game:start` | client → server | `{code}` | Chủ phòng yêu cầu bắt đầu trận |
| `game:start` | server → phòng | `{total}` | Thông báo trận đấu đã bắt đầu |
| `game:question` | server → phòng | `{index, total, text, options, durationMs}` | Câu hỏi mới (không gửi kèm đáp án đúng) |
| `game:answer` | client → server | `{code, choice}` | Gửi phương án đã chọn |
| `game:answered` | server → phòng | `{userId}` | Thông báo người chơi đã trả lời (hiện dấu ✓) |
| `game:reveal` | server → phòng | `{correctIndex, answers, players}` | Công bố đáp án và điểm mới khi hết giờ hoặc mọi người đang kết nối đã trả lời |
| `game:end` | server → phòng | `{ranking}` | Bảng xếp hạng cuối trận; kết quả được lưu vào database |

## Bắt đầu

### Chạy bằng Docker

Yêu cầu: [Docker Desktop](https://www.docker.com/products/docker-desktop/).

1. Tạo file `.env` ở thư mục gốc (tham khảo `.env.example`):

   ```env
   DB_PASSWORD=your-alphanumeric-password
   JWT_SECRET=a-long-random-secret
   ```

   Chỉ dùng chữ cái và chữ số cho mật khẩu vì giá trị này được ghép vào URL kết nối database.

2. Build và khởi động toàn bộ hệ thống:

   ```bash
   docker compose up -d --build
   docker compose ps
   ```

   Cả bốn service (`db`, `redis`, `backend`, `frontend`) phải ở trạng thái `Up`. Lần build đầu tiên có thể mất vài phút. Câu hỏi tiếng Anh đã đi kèm backend nên không cần seed dữ liệu. Compose này mở web ở cổng `80`; PostgreSQL và Redis chỉ hoạt động trong mạng Docker.

3. Mở **http://localhost**.

Các lệnh thường dùng:

| Lệnh | Tác dụng |
|---|---|
| `docker compose up -d` | Chạy stack ở chế độ nền |
| `docker compose up -d --build` | Build lại sau khi sửa code |
| `docker compose ps` | Xem trạng thái các service |
| `docker compose logs -f backend` | Theo dõi log backend |
| `docker compose logs -f redis` | Theo dõi log Redis |
| `docker compose restart backend` | Chỉ khởi động lại backend |
| `docker compose down` | Dừng và xóa container (giữ nguyên dữ liệu) |

Sau khi sửa code cho bản Docker, build và khởi động lại các image:

```powershell
cd F:\quiz-battle
docker compose up -d --build
docker compose ps
```

Sau đó mở hoặc tải lại **http://localhost**. Nhấn **Ctrl+F5** để buộc trình duyệt tải lại file, bỏ qua cache. Khác với chế độ dev, Docker phục vụ frontend đã build nên thay đổi source chỉ xuất hiện sau khi build lại image.

> `docker compose down -v` sẽ xóa dữ liệu PostgreSQL và Redis, bao gồm tài khoản, lịch sử trận, điểm xếp hạng và chuỗi Daily Challenge.

Nếu cổng 80 đang được sử dụng, đổi `"80:80"` thành `"8080:80"` trong `docker-compose.yml` rồi mở `http://localhost:8080`.

### Thiết lập môi trường phát triển

Dùng chế độ này khi đang sửa code. Yêu cầu: Node.js 20+, npm và Docker Desktop. Mở **ba cửa sổ PowerShell riêng biệt** và giữ cả ba cửa sổ hoạt động.

**PowerShell 1: PostgreSQL và Redis** — chạy từ thư mục gốc dự án:

```powershell
cd F:\quiz-battle
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml ps
```

Database phát triển được mở ở cổng `5433`; Redis ở cổng `6379`.

**PowerShell 2: Backend** — thiết lập một lần, sau đó chạy NestJS ở chế độ theo dõi file:

```powershell
cd F:\quiz-battle\backend
Copy-Item .env.example .env   # only the first time
npm install                  # only the first time, or after dependency changes
npx prisma migrate dev       # only when setting up/updating the database schema
npm run start:dev
```

Backend chạy tại `http://localhost:3000` và tự khởi động lại khi file backend thay đổi.

**PowerShell 3: Frontend** — cài dependency một lần, sau đó chạy Vite:

```powershell
cd F:\quiz-battle\frontend
npm install                  # only the first time, or after dependency changes
npm run dev
```

Mở **http://localhost:5173** (nhớ giữ `:5173` trong địa chỉ). Vite chuyển tiếp `/api` và `/socket.io` đến backend ở cổng `3000`; thay đổi frontend xuất hiện ngay, còn thay đổi backend sẽ kích hoạt NestJS khởi động lại. Volume PostgreSQL dùng cho phát triển tách biệt với database của Compose production nên tài khoản và lịch sử trận không được dùng chung. Dữ liệu Redis giữa hai Compose project cũng tách biệt.

Để dừng database và Redis phát triển, trước hết nhấn `Ctrl+C` ở hai cửa sổ đang chạy npm, sau đó chạy lệnh này từ thư mục gốc:

```powershell
docker compose -f docker-compose.dev.yml down
```

Để thử với hai người chơi trên cùng máy, dùng một cửa sổ bình thường và một cửa sổ ẩn danh (mỗi cửa sổ có `localStorage` riêng nên có thể đăng nhập hai tài khoản khác nhau).

### Biến môi trường

| File | Biến | Mô tả |
|---|---|---|
| `.env` (thư mục gốc) | `DB_PASSWORD` | Mật khẩu PostgreSQL dùng bởi Docker Compose |
| `.env` (thư mục gốc) | `JWT_SECRET` | Khóa bí mật dùng để ký JWT |
| `backend/.env` | `DATABASE_URL` | Chuỗi kết nối khi phát triển local, ví dụ `postgresql://postgres:<password>@localhost:5433/quizdb` |
| `backend/.env` | `JWT_SECRET` | Khóa bí mật dùng để ký JWT |
| `backend/.env` | `REDIS_URL` | URL kết nối Redis; mặc định local là `redis://localhost:6379` |

Các file `.env` được Git bỏ qua. Hãy sao chép file `.env.example` rồi điền giá trị riêng. **Không commit secret thật lên repository.**

## Share a Public Link

[Cloudflare quick tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/) gives friends a public URL without opening router ports or creating an account.

```bash
cloudflared tunnel --url http://localhost:80
```

If the tunnel cannot connect (some school or company networks block UDP), force HTTP/2:

```bash
cloudflared tunnel --protocol http2 --url http://localhost:80
```

- Keep the tunnel window open; closing it kills the link.
- The URL changes every time you restart the tunnel.
- The Docker stack must be running, and the laptop must stay awake and online.
- Before a demo, test with a phone on mobile data and check that the player list and check marks update instantly (this confirms WebSockets work through the tunnel).

## Project Structure

```
quiz-battle/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          Data model
│   │   ├── migrations/            Database migrations
│   │   └── seed-kanji.ts          Kanji importer (kanjiapi.dev)
│   ├── src/
│   │   ├── auth/                  Register, login, JWT strategy
│   │   ├── prisma/                Prisma service and module
│   │   ├── redis/                  Redis connection and global state
│   │   ├── quiz/
│   │   │   ├── game.service.ts        Rooms, timer, scoring
│   │   │   ├── question.service.ts    Question generation
│   │   │   ├── english-learning-bank.ts
│   │   │   ├── english-game-modes.ts   Shared game-module registry
│   │   │   ├── english-game.service.ts Solo sessions, scoring, items, leaderboards
│   │   │   ├── english-game.controller.ts Solo-game REST API
│   │   │   ├── quiz.gateway.ts        Socket.IO gateway
│   │   │   ├── match.controller.ts    History and leaderboard
│   │   │   └── quiz.module.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/                 AuthPage, Home, Room, Leaderboard, History, MatchDetail
│   │   ├── store/                 Redux slices (auth, game)
│   │   ├── api.ts                 Axios instance
│   │   ├── socket.ts              Socket.IO client
│   │   └── App.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docs/screenshots/              README images
├── docker-compose.yml             Production stack
├── docker-compose.dev.yml         Database for development
├── demo.bat                       One-click start for demos (Windows)
├── .env.example
└── README.md
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| `port is already allocated` | Port 80 is busy. Use `"8080:80"` in `docker-compose.yml` |
| `EADDRINUSE ... 3000` (dev) | An old backend is still running. Stop node processes and start again |
| `Can't reach database server` | The database is not ready. Check `docker compose ps` and wait about 20 seconds |
| `Cannot find module '/app/dist/main'` | Build output is in the wrong place. Check `backend/tsconfig.build.json` and rebuild with `--build` |
| `secretOrKey must be provided` | `JWT_SECRET` is missing, or `import 'dotenv/config'` is not at the top of `main.ts` |
| Web shows 502 | Backend is not up yet or crashed. Check `docker compose logs backend` |
| Table does not exist | Apply the committed migrations with `npx prisma migrate deploy` from `backend/` (or `docker compose exec backend npx prisma migrate deploy` for Docker) |
| Redis connection refused | Start Docker Compose, including the Redis service, or run the dev Redis container on port 6379 |
| Daily Challenge says it is already complete | Each account can score once per UTC day; an unfinished session resumes in the same browser |
| English level has too few questions | Add vocabulary and grammar entries for that CEFR level in `english-learning-bank.ts` |
| Garbled characters (`?` or a replacement symbol) | A file was saved in the wrong encoding. Re-save it as UTF-8 |
| Blank page when opening `index.html` directly | Expected. Use `http://localhost` (Docker) or `http://localhost:5173` (dev) |
| Page not updated after editing code | Dev mode: open `http://localhost:5173` and check Vite is running. Docker mode: run `docker compose up -d --build`, then press `Ctrl+F5` at `http://localhost` |

## Limitations

- Active rooms are stored in server memory, so only a single backend instance is supported and running games are lost when the backend restarts. To scale horizontally, use the Socket.IO Redis adapter and keep room state in Redis.
- The old Kanji schema and seed remain in the repository for compatibility, but the current frontend is an English-learning experience.
- Reconnecting in the middle of a match does not restore the current question.
- Cloudflare quick tunnels have no uptime guarantee and are meant for demos, not production.

## Roadmap

- Rejoin a running match after a connection drop
- Question categories and custom question sets managed by an admin
- Sound effects, streaks, and a red countdown bar for the last 5 seconds
- Persistent room state in Redis and deployment to a VPS
