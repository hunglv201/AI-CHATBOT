---
name: suong-giang-tiktok
description: Tạo video TikTok dọc 1080x1920 cho game Sương Giang (game-fable/index.html) - quay cảnh trong game bằng Playwright, giọng Adam của ElevenLabs, phụ đề tiếng Việt khớp lời, thẻ kết, caption, hashtag và lịch đăng 2 video/ngày (12:00 và 21:00). Dùng khi người dùng nhắc tới video TikTok cho game, kênh Sương Giang, "làm video tuần N", quay lại một video, ý tưởng video, độ dài hay độ zoom video, hoặc prompt để extension Chrome hẹn lịch đăng TikTok Studio, kể cả khi họ không nói tên skill.
---

# Video TikTok cho Sương Giang

Quy trình đã dùng cho 3 tuần video (tuần 1: giới thiệu và tính năng, tuần 2: động vật, tuần 3: đánh trận). Mục tiêu: mỗi video 10-35 giây, có giọng Adam, phụ đề khớp lời, zoom hợp cảnh, mỗi ngày đăng 2 video.

## Việc không làm được
Không tạo tài khoản và không đăng được TikTok (cần điện thoại/email của người dùng). Mình làm video + caption + lịch; người dùng đăng hoặc nhờ extension Chrome điền TikTok Studio. Extension không lấy được file từ chat, nên video phải tải về thư mục Downloads trước rồi mới chọn file.

## Quy trình
1. **Chọn ý tưởng** - xem `references/ideas.md`. Mỗi video một ý duy nhất, 3 giây đầu phải có chuyển động.
2. **Viết cảnh** trong `scripts/record_scenes.js`: mỗi cảnh là một khối `rec('xN', giây, setup, during)`. Dùng `window.SG` để dựng trận (`SG.start`, `SG.spawn`, `SG.build`, `order`). Hàm tiện ích có sẵn: `clear/away` (dọn bãi trống), `look(x,y,zoom)`, `follow(...)`, `kf([[t,x,y,zoom],...])` (cắt/chuyển camera theo thời gian). **Chọn zoom theo `references/zoom.md`** - đây là lỗi hay gặp nhất.
3. **Quay**: `cd <thư mục làm việc> && OUT=out node <skill>/scripts/record_scenes.js x2` (cần `playwright`, chromium có sẵn trong môi trường cloud). Viewport 720x1280, deviceScaleFactor 1. Headless chạy game chậm hơn giờ thật, nếu cảnh quá chậm đặt `SG.speed=2`.
4. **Kiểm tra khung hình** trước khi làm giọng: `ffmpeg -i xN.webm -vf "fps=0.5,scale=240:-1,tile=9x1" -frames:v 1 chk.png` rồi xem ảnh. Kiểm tra: nhân vật chính đủ lớn, hành động xảy ra thật (nhà cháy, tướng ngã...), không có khung trống.
5. **Giọng đọc**: xem `references/voice.md` (ElevenLabs, Adam, 3 câu ngắn mỗi video).
6. **Ghép**: đặt `xN.webm` và `vo/xN.mp3` cùng thư mục, thêm dòng vào dict `V` trong `scripts/mix_video.py`, chạy `python3 mix_video.py xN`. Script tự tách lời theo quãng nghỉ, đặt phụ đề từng câu, trộn âm lượng (đỉnh khoảng -3 dB) và nối thẻ kết 2,8 giây. Cần ffmpeg và font DejaVuSans-Bold.
7. **Caption + lịch**: xem `references/channel.md` và mẫu `examples/captions-week3.txt`. Đóng gói zip các video + file chú thích để người dùng tải về.
8. **Gửi** video bằng SendUserFile, mỗi video nên xem lại một lần trước khi gửi.

## Quy tắc cố định (người dùng đã chọn)
- Video luôn có **phụ đề tiếng Việt và giọng đọc** (Adam).
- **Thẻ kết trung tính** (`assets/end_card.png`), không ghi "làm game bằng AI".
- Hướng kênh là game, không phải "dạy làm game bằng AI". Chỉ nhắc nhẹ trong caption: "game có AI hỗ trợ làm, giọng đọc AI" và bật nhãn nội dung do AI tạo khi đăng.
- Link game trong bio phải là link công khai (artifact mặc định riêng tư).
- Không tự đăng, không tự bấm gì trên tài khoản TikTok của người dùng.

## Video giới thiệu màn rộng
`scripts/record_wide_intro.js` quay toàn bản đồ ở viewport 1600x900, bỏ menu/popup (ẩn UI bằng CSS và gọi `SG.start`), camera đi từ toàn cảnh tới làng rồi qua thú hoang. Ghép bằng `mix_video.py` với mã `w0` (đặt `CAP=24`): cảnh rộng nằm giữa khung dọc trên nền mờ, phụ đề nằm phía trên.

## Việc thường gặp
- **Quay lại một video**: chỉ sửa cảnh và chạy lại bước 3-6, giữ nguyên giọng nên không tốn credit ElevenLabs.
- **ElevenLabs báo "busy"**: không tính tiền, đừng tạo lại ngay trong cùng lượt, hãy làm việc khác rồi thử sau.
- **Tải mp3 bị 403**: host `elevenlabsusercontent.com` phải nằm trong danh sách cho phép của môi trường.
- **Sau 2-3 ngày** nhắc người dùng gửi ảnh Analytics để chọn kiểu video nào hợp.
