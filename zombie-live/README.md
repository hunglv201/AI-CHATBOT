# Zombie Live Survival

Game sinh tồn chống zombie, điều khiển bằng comment/quà/like của người xem TikTok LIVE.

## Chạy thử (không cần TikTok)
Mở `index.html` bằng trình duyệt. Panel bên phải giả lập mọi sự kiện.

## Nối với TikTok LIVE thật
```
cd server
npm install
node server.js <username_tiktok>     # kênh phải đang LIVE, không cần @
```
Mở `http://localhost:8080/?ws=ws://localhost:8080`. Trong OBS dùng Browser Source với link thêm `&obs=1`.
Thử luồng WebSocket bằng sự kiện giả: `node server.js --mock`.

## Định dạng sự kiện (JSON qua WebSocket)
`{type:'join'|'comment'|'like'|'follow'|'share'|'gift', user, text?, count?, gift?:'rose'|'rocket'|'turret'|'lion'}`

Quà TikTok được ánh xạ theo kim cương: <10 hoa hồng, 10–98 tháp súng, 99–999 tên lửa, ≥1000 sư tử (sửa trong `giftKind`).

Lưu ý: `tiktok-live-connector` là thư viện không chính thức, có thể hỏng khi TikTok đổi hệ thống. Chưa thử với kênh thật, chỉ đã thử chế độ `--mock`.
