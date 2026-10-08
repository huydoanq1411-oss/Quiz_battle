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
- [Ba cách chạy ứng dụng](#ba-cách-chạy-ứng-dụng)
   - [Cách A: Docker](#cách-a-docker)
   - [Cách B: Dev](#cách-b-dev)
   - [Cách C: Link công khai](#cách-c-link-công-khai)
   - [Biến môi trường](#biến-môi-trường)
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
| ![Đăng nhập](docs/screenshots/01-login.png) | ![Trang chủ](docs/screenshots/02-home.png) |

| Sảnh chờ | Đang chơi |
|---|---|
| ![Sảnh chờ](docs/screenshots/03-lobby.png) | ![Đang chơi](docs/screenshots/04-playing.png) |

| Công bố đáp án | Kết quả cuối trận |
|---|---|
| ![Công bố đáp án](docs/screenshots/05-reveal.png) | ![Kết quả](docs/screenshots/06-result.png) |

| Bảng xếp hạng | Lịch sử |
|---|---|
| ![Bảng xếp hạng](docs/screenshots/07-leaderboard.png) | ![Lịch sử](docs/screenshots/08-history.png) |

| Chế độ ngữ pháp | Điện thoại (qua tunnel) |
|---|---|
| ![Ngữ pháp](docs/screenshots/09-grammar.png) | ![Điện thoại](docs/screenshots/11-mobile.png) |

**Các container đang chạy**

![Docker](docs/screenshots/10-docker.png)

## Công nghệ

| Lớp | Công nghệ |
|---|---|
| Giao diện | React, TypeScript, Vite, Redux Toolkit, React Router, Axios, Socket.IO client |
| Máy chủ | NestJS 12, Socket.IO, Passport JWT, bcrypt |
| Cơ sở dữ liệu | PostgreSQL 16, Prisma ORM |
| Bộ nhớ đệm / bảng xếp hạng / phiên chơi cá nhân | Redis 7 sorted set và key có thời hạn |
| Triển khai | Docker Compose (db, Redis, backend, frontend chạy bằng Nginx), Cloudflare Tunnel |

## Kiến trúc

```
Trình duyệt / điện thoại
      |  https://xxx.trycloudflare.com   (tùy chọn, liên kết công khai)
      v
 Cloudflare tunnel (cloudflared chạy trên máy của bạn)
      |
      v
 localhost:80
 +--------------------------- Docker Compose ----------------------------+
 |  frontend (Nginx)                                                     |
|    /            -> ứng dụng React đã build (file tĩnh)                 |
 |    /api/        -> backend:3000   (REST)                              |
 |    /socket.io/  -> backend:3000   (WebSocket)                         |
 |                         |                                             |
 |                         v                                             |
|  backend (NestJS) --- Prisma ---> db (PostgreSQL, volume: dbdata)     |
|         |                                                            |
|         +---- redis (xếp hạng / phiên cá nhân được lưu bền vững) -----|
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

## Ba cách chạy ứng dụng

| Cách chạy | Địa chỉ | Dùng khi | Cần mở | Sửa code có tự cập nhật? | Database |
|---|---|---|---|---|---|
| **A. Docker** | `http://localhost` | Demo, nộp bài, chụp ảnh | Docker Desktop | Không; phải build lại | Container `db` và `redis` của Compose |
| **B. Dev** | `http://localhost:5173` | Đang viết và sửa code | Docker (chỉ PostgreSQL/Redis) và 2 cửa sổ PowerShell chạy backend/frontend | Có; Vite và NestJS tự tải lại | Container dev; PostgreSQL host port `5433`, Redis `6379` |
| **C. Link công khai** | `https://...trycloudflare.com` | Cho người khác chơi từ xa | Cách A và một cửa sổ `cloudflared` | Như cách A | Như cách A |

Quy tắc nhớ nhanh:

- Đang sửa code thì dùng **Cách B**.
- Sửa xong và muốn chạy bản gần production thì dùng **Cách A**.
- Muốn bạn bè hoặc thầy cô truy cập từ xa thì chạy **Cách A**, sau đó thêm **Cách C**.

> Database của Cách A và Cách B là riêng biệt. Tài khoản đăng ký ở `localhost` không dùng được ở `localhost:5173` và ngược lại. Redis và dữ liệu bảng xếp hạng cũng tách riêng.

### Cách A: Docker

Yêu cầu: mở [Docker Desktop](https://www.docker.com/products/docker-desktop/) và đợi Docker Engine sẵn sàng. Tạo file `.env` ở thư mục gốc nếu chưa có, tham khảo `.env.example`:

```env
DB_PASSWORD=your-alphanumeric-password
JWT_SECRET=a-long-random-secret
```

Chỉ dùng chữ cái và chữ số cho mật khẩu vì giá trị này được ghép vào URL kết nối PostgreSQL.

**Khởi động** — tại PowerShell ở thư mục gốc:

```powershell
cd F:\quiz-battle
docker compose up -d --build
docker compose ps
```

Phải thấy đủ **4 service** `db`, `redis`, `backend`, `frontend` ở trạng thái `Up`. Mở Chrome hoặc Edge tại **http://localhost**. Câu hỏi tiếng Anh đã đi kèm backend nên không cần chạy lệnh seed Kanji.

Nếu stack đã chạy sẵn, chỉ cần mở Docker Desktop và truy cập web. Sau khi sửa code, chạy lại `docker compose up -d --build` để build các image mới, rồi nhấn **Ctrl+F5** tại `http://localhost` để tải lại tài nguyên trình duyệt.

**Dừng ứng dụng**:

```powershell
cd F:\quiz-battle
docker compose down
```

Không thêm `-v` trừ khi muốn xóa dữ liệu PostgreSQL và Redis (tài khoản, lịch sử trận, điểm xếp hạng và chuỗi Daily Challenge). Nếu cổng 80 bị chiếm, đổi `"80:80"` thành `"8080:80"` trong `docker-compose.yml`, khởi động lại stack rồi mở `http://localhost:8080`.

### Cách B: Dev

Dùng khi đang sửa code để frontend tự cập nhật và backend tự khởi động lại. Cần Node.js 20+, npm và Docker Desktop. Mở **3 cửa sổ PowerShell riêng**.

**Cửa sổ 1: PostgreSQL và Redis dev** — chạy từ thư mục gốc:

```powershell
cd F:\quiz-battle
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml ps
```

**Cửa sổ 2: Backend** — cài dependency và tạo `.env` lần đầu; sau đó chỉ cần chạy `npm run start:dev`:

```powershell
cd F:\quiz-battle\backend
Copy-Item .env.example .env   # chỉ chạy lần đầu
npm install                  # chỉ chạy lần đầu hoặc khi dependency thay đổi
npx prisma migrate dev       # chỉ chạy khi khởi tạo/cập nhật schema database
npm run start:dev
```

Đợi thông báo `Nest application successfully started`. Backend chạy tại `http://localhost:3000`; khi sửa file trong `backend/src/`, NestJS sẽ tự biên dịch và khởi động lại. Các phòng multiplayer đang chơi sẽ mất khi backend khởi động lại, vì trạng thái phòng hiện vẫn nằm trong bộ nhớ.

**Cửa sổ 3: Frontend** — cài dependency lần đầu; sau đó chạy Vite:

```powershell
cd F:\quiz-battle\frontend
npm install                  # chỉ chạy lần đầu hoặc khi dependency thay đổi
npm run dev
```

Mở **http://localhost:5173** (nhớ giữ `:5173`). Khi sửa file trong `frontend/src/`, Vite sẽ tự cập nhật trang. Vite chuyển tiếp `/api` và `/socket.io` đến backend tại cổng `3000`.

Để thử hai người chơi trên cùng máy, dùng một cửa sổ trình duyệt bình thường và một cửa sổ ẩn danh; mỗi cửa sổ có `localStorage` riêng nên đăng nhập được bằng hai tài khoản.

**Dừng môi trường dev**: nhấn `Ctrl+C` ở cửa sổ backend và frontend. Sau đó, tại thư mục gốc, dừng PostgreSQL và Redis:

```powershell
docker compose -f docker-compose.dev.yml down
```

### Cách C: Link công khai

Chạy Cách A trước vì tunnel sẽ chuyển tiếp tới cổng `80`. Mở thêm PowerShell và chạy lệnh tương ứng với nơi đã cài `cloudflared`:

```powershell
cloudflared tunnel --protocol http2 --url http://localhost:80
```

Hoặc nếu cài tại `F:\cloudflared`:

```powershell
F:\cloudflared\cloudflared.exe tunnel --protocol http2 --url http://localhost:80
```

Trong cửa sổ lệnh sẽ hiện URL dạng `https://ten-ngau-nhien.trycloudflare.com`; gửi URL đó cho người chơi. Giữ cửa sổ tunnel mở, máy tính cần bật và không chuyển sang chế độ ngủ. URL thay đổi mỗi lần chạy tunnel và có thể cần 10–30 giây mới truy cập được. Nếu Docker đang dùng cổng `8080`, thay `localhost:80` bằng `localhost:8080` trong lệnh.

**Chạy nhanh bằng `demo.bat`**: mở Docker Desktop, đợi Docker Engine sẵn sàng, sau đó nhấp đúp `demo.bat` ở thư mục dự án. File này chạy `docker compose up -d` rồi mở tunnel bằng `F:\cloudflared\cloudflared.exe`; giữ cửa sổ đang mở để link tiếp tục hoạt động.

### Biến môi trường

| File | Biến | Mô tả |
|---|---|---|
| `.env` (thư mục gốc) | `DB_PASSWORD` | Mật khẩu PostgreSQL dùng bởi Docker Compose |
| `.env` (thư mục gốc) | `JWT_SECRET` | Khóa bí mật dùng để ký JWT |
| `backend/.env` | `DATABASE_URL` | Chuỗi kết nối khi phát triển local, ví dụ `postgresql://postgres:<password>@localhost:5433/quizdb` |
| `backend/.env` | `JWT_SECRET` | Khóa bí mật dùng để ký JWT |
| `backend/.env` | `REDIS_URL` | URL kết nối Redis; mặc định local là `redis://localhost:6379` |

Các file `.env` được Git bỏ qua. Hãy sao chép file `.env.example` rồi điền giá trị riêng. **Không commit secret thật lên repository.**

## Cấu trúc dự án

```
quiz-battle/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          Mô hình dữ liệu
│   │   ├── migrations/            Các migration database
│   │   └── seed-kanji.ts          Công cụ nhập Kanji (kanjiapi.dev)
│   ├── src/
│   │   ├── auth/                  Đăng ký, đăng nhập, chiến lược JWT
│   │   ├── prisma/                Prisma service và module
│   │   ├── redis/                  Kết nối Redis và trạng thái toàn cục
│   │   ├── quiz/
│   │   │   ├── game.service.ts        Phòng chơi, đồng hồ, tính điểm
│   │   │   ├── question.service.ts    Tạo câu hỏi
│   │   │   ├── english-learning-bank.ts
│   │   │   ├── english-game-modes.ts   Danh mục module trò chơi dùng chung
│   │   │   ├── english-game.service.ts Phiên cá nhân, điểm, vật phẩm, xếp hạng
│   │   │   ├── english-game.controller.ts REST API trò chơi cá nhân
│   │   │   ├── quiz.gateway.ts        Cổng Socket.IO
│   │   │   ├── match.controller.ts    Lịch sử và bảng xếp hạng
│   │   │   └── quiz.module.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/                 Các trang đăng nhập, sảnh, phòng, xếp hạng, lịch sử
│   │   ├── store/                 Redux slices (xác thực, trò chơi)
│   │   ├── api.ts                 Cấu hình Axios
│   │   ├── socket.ts              Socket.IO client
│   │   └── App.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docs/screenshots/              Ảnh trong README
├── docker-compose.yml             Stack production
├── docker-compose.dev.yml         Database và Redis cho phát triển
├── demo.bat                       Khởi động demo bằng một lệnh (Windows)
├── .env.example
└── README.md
```

## Xử lý sự cố

| Hiện tượng | Cách xử lý |
|---|---|
| `port is already allocated` | Cổng 80 đang bận. Đổi mapping thành `"8080:80"` trong `docker-compose.yml` |
| `EADDRINUSE ... 3000` (dev) | Backend cũ vẫn đang chạy. Dừng tiến trình Node cũ rồi khởi động lại |
| `Can't reach database server` | Database chưa sẵn sàng. Kiểm tra `docker compose ps` và chờ khoảng 20 giây |
| `Cannot find module '/app/dist/main'` | Sai vị trí build output. Kiểm tra `backend/tsconfig.build.json` rồi build lại bằng `--build` |
| `secretOrKey must be provided` | Thiếu `JWT_SECRET` hoặc `import 'dotenv/config'` chưa ở đầu `main.ts` |
| Web hiển thị 502 | Backend chưa khởi động hoặc đã bị crash. Kiểm tra `docker compose logs backend` |
| Không tìm thấy bảng dữ liệu | Chạy migration đã commit bằng `npx prisma migrate deploy` từ `backend/` (hoặc `docker compose exec backend npx prisma migrate deploy` khi dùng Docker) |
| Không kết nối được Redis | Khởi động Docker Compose có service Redis hoặc chạy Redis dev trên cổng 6379 |
| Daily Challenge báo đã hoàn thành | Mỗi tài khoản chỉ được tính điểm một lần mỗi ngày UTC; phiên chưa xong có thể tiếp tục trên cùng trình duyệt |
| Cấp CEFR có quá ít câu hỏi | Bổ sung từ vựng và ngữ pháp cho cấp độ đó trong `english-learning-bank.ts` |
| Ký tự bị lỗi (`?` hoặc ký hiệu thay thế) | File có thể đã lưu sai encoding. Lưu lại bằng UTF-8 |
| Trang trắng khi mở trực tiếp `index.html` | Đây là hành vi bình thường. Dùng `http://localhost` (Docker) hoặc `http://localhost:5173` (dev) |
| Trang không cập nhật sau khi sửa code | Dev: mở `http://localhost:5173` và kiểm tra Vite đang chạy. Docker: chạy `docker compose up -d --build`, sau đó nhấn `Ctrl+F5` tại `http://localhost` |

## Giới hạn

- Phòng multiplayer được lưu trong bộ nhớ server nên sẽ mất khi backend khởi động lại; chạy nhiều backend cần Socket.IO Redis adapter. Phiên chơi cá nhân và bảng xếp hạng đã dùng Redis.
- Schema và seed Kanji cũ vẫn nằm trong repository để tương thích, nhưng frontend hiện tập trung vào học tiếng Anh.
- Kết nối lại giữa trận hiện chưa khôi phục được câu hỏi đang chơi.
- Cloudflare quick tunnel không đảm bảo uptime và chỉ phù hợp cho demo, không dùng làm môi trường production.

## Định hướng phát triển

- Cho phép vào lại trận đang diễn ra sau khi mất kết nối
- Thêm danh mục câu hỏi và bộ câu hỏi tùy chỉnh do quản trị viên quản lý
- Thêm hiệu ứng âm thanh, chuỗi trả lời đúng và thanh đếm ngược đỏ trong 5 giây cuối
- Lưu trạng thái phòng trong Redis và triển khai lên VPS
