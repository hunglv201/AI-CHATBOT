# Giọng đọc ElevenLabs

- Model `eleven_v3`, giọng **Adam - Dominant, Firm** (`voice_id` `pNInz6obpgDQGcFmaJgB`). Nếu cần giọng khác thì dùng `creative_list_voices`, không đoán id.
- Tạo một flow (`creative_create_flow`) rồi truyền `flow_id` vào mọi lần `creative_generate_speech`. Hỏi trạng thái bằng `creative_get_flow_run_status` đến khi hoàn tất.
- Mỗi video **3 câu ngắn**, cách nhau bằng dấu chấm và xuống dòng, tổng 8-12 giây đọc. Câu 1 nêu chuyện, câu 2 miêu tả hành động, câu 3 là móc câu hỏi hoặc lời mời ("Bạn đoán đúng chưa?", "Nhớ chiếm đồi trước nhé!"). Script ghép dựa vào quãng nghỉ giữa các câu để đặt phụ đề, nên số câu phải bằng số phụ đề trong dict `V`.
- Chỉ tạo một lần mỗi giọng, không tạo lại để thử (tốn credit). Báo "busy" thì không bị tính tiền, nhưng đừng thử lại ngay.
- Tải mp3 về `vo/<mã>.mp3` bằng curl. Nếu bị 403, thêm host `elevenlabsusercontent.com` vào mạng cho phép của môi trường.
