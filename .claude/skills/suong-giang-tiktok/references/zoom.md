# Độ zoom theo từng cảnh

Điện thoại nhỏ và TikTok nén video, nên chi tiết nhỏ biến mất. Chọn cỡ cảnh theo chuyện gì là điểm chính.

| Loại cảnh | Zoom | Ví dụ |
|---|---|---|
| Một nhân vật/con vật là trung tâm | Gần: nhân vật chiếm khoảng 1/4 đến 1/3 chiều cao màn hình (`look(...,1.6-1.9)`) | dỗ voi, khỉ trộm quả, sói, công xòe đuôi, tướng đấu tướng |
| Hai bên cách xa nhưng cả hai đều quan trọng | Cắt cảnh: gần bên A rồi chuyển sang gần bên B | máy bắn đá bắn, rồi cận nhà cháy |
| Đám đông, số lượng là điểm hay | Xa (`look(...,0.9-1.0)`) | 30 đấu 30, 50 đấu 50, làng lớn lên, bốn mùa |
| Kết quả cuối | Lùi xa 1-2 giây | thấy ai thắng |

## Nhịp cỡ cảnh trong một video
- 0-2 giây: cảnh rộng để người xem biết chuyện xảy ra ở đâu.
- Sau đó: zoom sát hành động chính. Dùng `kf([[0,x,y,1.0],[2,x,y,1.8],...])` để chuyển mượt.
- Gần cuối: lùi xa nếu cần cho thấy kết quả.
- Không để một khung hình đứng im cả video.

## Phụ đề
Đặt phía trên (y=250), không che mặt nhân vật. Cỡ chữ 62, nền viền đen. Chữ dài quá thì xuống dòng thủ công (`\n`), mỗi dòng tối đa khoảng 26 ký tự.

## Lỗi đã gặp
- Máy bắn đá nằm nhỏ xíu ở góc, nhà cháy mới là điểm chính: đã sửa bằng cắt cảnh.
- Cung thủ trên đồi quá nhỏ, không thấy đồi cao: đã sửa bằng zoom 1.9.
- Cảnh trống ở đầu vì game đang tải: cắt đầu 2-2,2 giây (giá trị thứ hai trong dict `V`).
