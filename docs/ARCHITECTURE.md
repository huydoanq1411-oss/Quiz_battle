# Kiến trúc cloud và khôi phục multiplayer

Phạm vi: giữ React/Vite, NestJS, Socket.IO, Prisma/PostgreSQL và Redis; chuẩn bị một backend Render cùng frontend Vercel. Chưa phát hành cloud, chưa bật autoscaling hoặc thêm dịch vụ trả phí.

## Luồng dữ liệu

Frontend gọi REST qua `VITE_API_URL`, Socket.IO qua `VITE_SOCKET_URL`. Backend chỉ cho phép origin trong `CLIENT_ORIGIN`. Mặc định local vẫn dùng `/api` và cùng origin cho Socket.IO.

PostgreSQL giữ User/Match/MatchPlayer. Redis giữ phiên cá nhân và phòng multiplayer. Phòng gồm ID UUID, mã mời, người chơi, điểm, bộ câu hỏi, câu hiện tại, đáp án đã gửi, phase, revision và thời hạn theo đồng hồ máy chủ. Socket ID và cờ kết nối được cập nhật lại khi vào phòng.

## Nhất quán

Mỗi thay đổi phòng lấy khóa Redis 15 giây, đọc snapshot, thay đổi và ghi lại bằng Lua chỉ khi còn sở hữu khóa. Thao tác quá hạn không được ghi đè snapshot mới. Snapshot lưu Map dưới dạng mảng cặp khóa/giá trị và có TTL 24 giờ.

Các phase: `lobby → starting → playing → reveal → playing / finishing → ended`. Deadline lưu trong Redis; timer trong tiến trình chỉ đánh thức lần chuyển phase tiếp theo. Backend khởi động quét key phòng, đánh dấu socket cũ offline và dựng lại timer. Không quét Redis mỗi giây khi nhàn rỗi.

`finishing` được lưu trước khi ghi PostgreSQL. Ghi lịch sử bằng upsert theo `Match.roomId` unique; nếu tiến trình chết giữa ghi DB và ghi Redis, lần tiếp theo dùng cùng ID. Chỉ phát trạng thái ended sau khi lưu DB thành công.

Máy chủ gửi snapshot riêng qua `room:state` cho từng người chơi: chỉ lựa chọn của chính họ, danh sách ai đã trả lời và dữ liệu câu hỏi công khai. Đáp án chuẩn chỉ có ở reveal/finishing. Request trả lời chứa index câu hỏi; socket cũ và index cũ bị từ chối. Frontend bỏ snapshot có revision thấp hơn và khôi phục lại phòng khi Socket.IO reconnect.

## Ràng buộc

Thiết kế dành cho một tiến trình backend. Muốn nhiều replica phải bổ sung adapter phát sự kiện và cơ chế duy nhất sở hữu lịch chuyển phase; không chỉ tăng số instance. Redis là dữ liệu bền nhưng vẫn cần quản lý quota, chính sách lưu trữ và sao lưu phù hợp.

## Tiêu chí nghiệm thu

- Local/Docker vẫn chạy với cấu hình mặc định.
- Build/lint hai phần và test hồi quy đạt.
- Test mô phỏng hai vòng đời backend dùng chung store: khôi phục lựa chọn, điểm và deadline; từ chối đáp án cũ; lịch sử dùng cùng unique ID khi thử lại.
- Sau khi có tài nguyên cloud: kiểm thử thực hai tài khoản, restart backend và mở app khi máy cá nhân tắt theo `DEPLOYMENT.md`.
