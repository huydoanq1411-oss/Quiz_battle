# Frontend - Quiz Battle

Frontend của Quiz Battle được xây dựng bằng React + Vite, tập trung vào trải nghiệm người dùng cho các màn hình: đăng nhập, tạo phòng, tham gia phòng, bảng xếp hạng và lịch sử trận đấu.

## Chức năng chính

- Trang đăng nhập / đăng ký
- Trang sảnh chơi để tạo hoặc vào phòng
- Một phòng chơi realtime theo Socket.IO
- Màn hình trận đấu hiển thị câu hỏi, đáp án, đồng hồ và bảng điểm
- Bảng xếp hạng tổng hợp theo ngôn ngữ
- Lịch sử trận đấu cá nhân
- Trang chi tiết trận đấu

## Stack

- React 19
- TypeScript
- Vite
- Redux Toolkit
- React Router
- Axios
- Socket.IO Client

## Cài đặt

```bash
cd frontend
npm install
```

## Chạy ở môi trường dev

```bash
npm run dev
```

Mặc định Vite chạy tại:

- http://localhost:5173

## Build production

```bash
npm run build
```

Khi chạy production bằng Docker, frontend sẽ được phục vụ qua Nginx tại port 80.

## Kết nối API và Socket

- API HTTP: `/api`
- Socket.IO: `/socket.io/`

Tất cả request đi qua proxy được cấu hình trong `nginx.conf` khi chạy trong Docker.

## Cấu trúc thư mục

```text
src/
├── api.ts              # axios instance
├── App.tsx             # router + layout
├── main.tsx            # entry
├── socket.ts           # socket.io client setup
├── pages/              # AuthPage, Home, Room, Leaderboard, History, MatchDetail
├── store/              # Redux slices and store
└── assets/             # hình ảnh / icon / CSS
```

## Màn hình quan trọng

- `Home`: tạo phòng / tham gia bàn chơi
- `Room`: phòng lobby + bắt đầu game
- `Leaderboard`: thống kê điểm tổng và xếp hạng
- `History`: lịch sử bản thân
- `MatchDetail`: chi tiết từng trận

## Lưu ý

- Token JWT được lưu trong `localStorage`
- Khi người dùng đăng xuất, Socket sẽ đóng bằng `closeSocket()`
- Mọi màn hình riêng tư đều được kiểm soát bằng `Private` route trong `App.tsx`

