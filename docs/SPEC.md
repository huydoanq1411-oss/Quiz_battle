# Ôn câu sai và giải thích đáp án

## Nâng cấp chế độ chơi

### Không lặp câu và chọn chủ đề (19/11/2026)

- Chọn Tổng hợp/Du lịch/Công việc/Đời sống khi tạo phòng và tạo link thách đấu; Time Attack và bài học nhận đúng chủ đề đã chọn. Chủ đề riêng dùng ngân hàng từ vựng tương ứng; ngữ pháp dùng ngân hàng tổng hợp, giao diện nêu rõ.
- Mỗi đề chỉ có câu khác nhau theo nội dung, không coi đảo đáp án/chữ cái/ID là câu mới. Lịch sử được lưu trong Redis không TTL theo tài khoản và chế độ/cấp/chủ đề; áp dụng từ phiên bản mới, không thể tái tạo toàn bộ câu đúng của trận cũ.
- Phòng đấu chọn câu chưa cấp cho bất kỳ thành viên nào. Link thách đấu giữ nguyên đề; người đã gặp câu của đề trong thách đấu trước được báo để tạo link khác. Daily dùng đề chung theo ngày và không lặp với các đề Daily mới trước đó; tách khỏi lịch sử luyện tự do để giữ đề chung.
- Lượt cố định cần đủ 10 câu mới (hoặc số câu đã chọn); thiếu thì báo số câu còn lại và yêu cầu đổi chủ đề/cấp. Không tự xóa lịch sử hoặc tái sử dụng câu cũ. Time Attack kết thúc khi hết câu mới. Tải lại/tiếp tục cùng lượt không tạo đề khác.
- Mở rộng mỗi chủ đề/cấp lên ít nhất 20 từ; kiểm tra cùng lượt, hai lượt liên tiếp, nhiều tài khoản, thao tác đồng thời, đề chung và không lộ đáp án/lịch sử nội bộ. Không thêm dịch vụ hoặc dependency.

- 1v1: đúng hai tài khoản, 10 câu chung; kết quả so sánh số câu đúng và tổng thời gian (câu bỏ trống tính 15 giây). Ưu tiên độ chính xác rồi tốc độ.
- Lộ trình: Du lịch, Công việc, Đời sống; mỗi chủ đề có A1–C2, bài 10 câu và phần ôn cuối bài. Không khóa cấp độ.
- Daily: 10 câu, đạt ít nhất 8 câu đúng và hoàn thành đủ 10 câu để tính ngày đạt mục tiêu. Tuần UTC từ thứ Hai; huy hiệu Đồng/Bạc/Vàng ở 3/5/7 ngày. Mỗi ngày chỉ tính một lần.
- Thách đấu bất đồng bộ: link có hạn 7 ngày, cùng đề/cấp độ, mỗi tài khoản một lượt; thời gian 150 giây, không vật phẩm. Chỉ công bố kết quả đã hoàn thành; đáp án riêng chỉ xuất hiện sau lượt của chính mình. Redis lưu link và lượt chơi 7 ngày, cần bật persistence ở dịch vụ Redis.
- Dạng mới: xếp câu, sửa câu sai ngữ pháp, ghép từ với nghĩa; có hướng dẫn nhập và giải thích, dùng chung chấm điểm server và ôn câu sai.
- Giữ frontend Vercel, backend Render, PostgreSQL và Redis hiện có; không cần tiến trình trên máy cá nhân. Kiểm tra build/lint, bảo mật đáp án, giới hạn người chơi/lượt, tải lại và giao diện mobile.

Phạm vi: Time Attack, Daily Challenge và phòng multiplayer. Giữ nguyên cách tính điểm và giới hạn Daily; không thêm AI hoặc dịch vụ mới.

- Máy chủ lưu câu trả lời sai và câu chưa trả lời khi hết thời gian. Wordle chỉ tính sai khi hết lượt đoán hoặc hết giờ; đoán sai rồi tìm được từ trong cùng câu không bị tính thành một câu sai.
- Mỗi mục ôn có câu hỏi, lựa chọn đã gửi, đáp án đúng và giải thích bằng tiếng Việt. Câu ngữ pháp có quy tắc và câu hoàn chỉnh; từ vựng/chính tả có từ và nghĩa; Kanji dùng dữ liệu có sẵn.
- Không đưa danh sách ôn hoặc giải thích chứa đáp án vào phản hồi khi lượt chơi còn đang diễn ra. Multiplayer chỉ gửi phần ôn riêng của người chơi sau khi trận kết thúc.
- Luyện lại diễn ra tại frontend từ danh sách đã được phép xem, không có đồng hồ, không cộng điểm, không thay đổi Daily/streak. Người học làm từng câu, xem giải thích sau khi gửi, và có thể luyện tiếp các câu vẫn sai.
- Phiên cá nhân giữ phần ôn trong Redis cùng phiên (TTL 7 ngày); giữ ID lượt gần nhất theo tài khoản để tải lại kết quả. Không tái tạo được các câu sai trước khi phiên bản này lưu dữ liệu ôn.
- Multiplayer lưu phần ôn vào MatchPlayer, cho phép mở lại trong lịch sử. Người khác không được đọc phần ôn riêng của bạn.

Nghiệm thu: test không lộ đáp án giữa lượt; ghi đúng lựa chọn/câu bỏ trống; không ghi trùng; giữ ôn qua tải lại; lịch sử chỉ trả ôn của người gọi; luyện lại đủ trạng thái đúng/sai/rỗng/hoàn thành; build/lint/test đạt. Kiểm thử browser với dữ liệu mô phỏng, không tác động tài khoản production.

## Kiểm chứng nâng cấp (18/11/2026)

- Backend: build/lint đạt; 36 test trong 9 suite đạt. Kiểm tra 3 chủ đề × 6 cấp, đáp án dạng mới, đề chung 10 câu, một lượt mỗi tài khoản/link, hạn thời gian, quyền riêng tư, mục tiêu Daily đủ bài và 8/10, giới hạn 1v1, chấm tốc độ và hòa.
- Frontend: build/lint đạt; 4 test đạt. Trình duyệt với API fixture kiểm tra chọn chủ đề/cấp, tiến độ, xếp câu, ghép nghĩa bằng select, sửa câu, khôi phục kết quả, huy hiệu tuần và quay lại link sau đăng nhập. Màn hình 390px không tràn ngang, không có page error.
- Kiểm thử 1v1 bằng hai browser context, Socket.IO/JWT gateway và GameService thật; kho lưu trong bộ nhớ thay Redis/Postgres. Hai tài khoản hoàn thành đủ 10 câu chung, người thứ ba bị từ chối, so sánh 10/10 với 9/10 và kiểm tra dữ liệu truyền vào thao tác lưu lịch sử.
- Chưa chạy migration hoặc kiểm thử Redis Lua/PostgreSQL trên dịch vụ thật, chưa deploy và chưa push. Docker daemon không chạy trong môi trường kiểm thử; không dùng database production cho test. Cần kiểm tra smoke trên cloud sau khi áp dụng hai migration mới.
