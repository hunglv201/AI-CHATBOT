# Ghép video: cắt cảnh .webm + giọng Adam (vo/<mã>.mp3) + phụ đề + thẻ kết.
# Chạy trong thư mục chứa <mã>.webm và vo/ :  python3 mix_video.py x2 x3   (bỏ trống = tất cả)
# Muốn thêm video mới: thêm một dòng vào dict V (mã -> (tên file, giây bắt đầu cắt, [các câu phụ đề])).
import subprocess,re,os,sys
FB='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
# tên: (cảnh, giây bắt đầu cắt, [câu phụ đề theo thứ tự lời đọc])
V={
 'x1':('1-voi-chien-pha-cong',2.2,['Voi chiến đập cổng thành!','Hai con voi lao tới,\ncổng thành rung lên từng nhát.','Ai dám chặn đường\nvoi chiến?']),
 'x2':('2-may-ban-da',2.2,['Ba máy bắn đá\ncùng nhả đạn.','Nhà địch bốc cháy,\nkhói đen bay lên.','Phá nhà từ xa,\nan toàn quá!']),
 'x3':('3-cung-thu-tren-doi',2.0,['Cung thủ đứng trên đồi\nbắn xa hơn một ô.','Địch xông tới,\nđã bị bắn rát từ xa.','Nhớ chiếm đồi\ntrước nhé!']),
 'x4':('4-tuong-dau-tuong',2.2,['Tướng quân đấu\nnữ tướng.','Một chọi một,\nkhông ai nhường ai.','Một vị tướng đã ngã xuống!\nBạn đoán đúng chưa?']),
 'x5':('5-thuyen-chien',2.0,['Thuyền chiến giao tranh\ntrên sông.','Ba thuyền xanh, ba thuyền đỏ,\ntên bay như mưa.','Bên nào chìm trước?']),
 'x6':('6-50-dau-50',2.2,['Năm mươi lính\nđấu năm mươi lính.','Hai đạo quân lao vào nhau,\nvoi chiến dẫn đầu.','Bụi mù mịt, xác ngổn ngang.\nBạn đoán bên nào thắng?']),
 'x7':('7-giu-lang',2.2,['Ba đợt địch kéo tới,\nmỗi đợt một đông hơn.','Chòi canh bắn xuống,\nlính giáo chặn cửa.','Giữ được làng không?\nXem đến cuối nhé!']),

 'w0':('0b-gioi-thieu-man-rong',1.4,['Đây là Sương Giang,\ngame dựng làng, giữ đất,\nchơi ngay trên trình duyệt.','Bản đồ rộng với sông hồ,\nrừng rậm, voi, hổ\nvà cả bầy thú hoang.','Dựng nhà, nuôi lính,\nthuần hóa voi chiến,\nđối đầu trại Sơn.','Chơi miễn phí,\nlink ở bio!']),
 'y2':('2-chi-dung-dan-lang',2.2,['Thử thách:\nchỉ dùng dân làng.','Mười lăm người cầm cuốc\nđấu ba con sói.','Dân làng có thắng\nnổi không?']),
 'y3':('3-tua-nhanh-lang-lon',2.0,['Một ván Sương Giang,\ntua nhanh bằng\nchế độ tự chơi.','Từ vài dân làng,\nlàng lớn dần\nthành thị trấn.','Bạn muốn thử không?']),
 'y1':('1-ho-dau-ca-sau',2.2,['Hổ đấu cá sấu\nbên bờ sông.','Hổ nhanh hơn,\ncá sấu thì dai hơn.','Bạn đoán\ncon nào thắng?']),
 'y4':('4-bo-giap',2.0,['Bốn bộ giáp\ncho lính trong game.','Cấm vệ, Dạ hành,\nBộ đội và Cơ giáp.','Bạn thích\nbộ nào nhất?']),
 'y5':('5-nam-meo-nguoi-moi',2.2,['Năm mẹo cho người mới.','Một, xây nhà trước\nđể có thêm dân.','Hai, nhớ trồng\nruộng lúa.','Ba, đặt cung thủ lên đồi,\nbắn xa hơn một ô.','Bốn, luyện lính\nở trại lính.','Năm, bật chế độ tự chơi\nđể học cách làm.']),
 'y6':('6-thuyen-chien',2.0,['Thuyền chiến giao tranh\ntrên sông.','Ba thuyền xanh, ba thuyền đỏ,\ntên bay như mưa.','Bên nào chìm trước?']),
 'y7':('7-ma-bi-mat',2.2,['Ba mã bí mật\ntrong Sương Giang.','Phát tài:\nnhận 1000 mỗi loại.','Xin lính:\nsáu quân cạnh Đình làng.','Sương tan:\nnhìn thấy cả bản đồ.','Nhập thử đi!']),
 'z1':('1-voi-dau-linh',2.2,['Một con voi chiến đấu\nmười hai lính giáo.','Voi to,\nnhưng lính đông.','Bạn đoán ai thắng?']),
 'z2':('2-bao-thap',2.0,['Xây Bảo tháp,\ncông trình lớn nhất.','Cần thật nhiều\ngỗ và vàng.','Nhìn từ xa\ncũng thấy ngay!']),
 'z3':('3-thay-lang',2.2,['Thầy lang đứng sau\nchữa thương cho lính.','Máu tụt xuống,\nlại đầy lên.','Có thầy lang\nlà khác hẳn!']),
 'z4':('4-trai-chan-nuoi',2.0,['Trại chăn nuôi\ncho gà, heo và bò.','Có thịt cho cả làng,\nkhông lo đói.','Nuôi thử chưa?']),
 'z5':('5-sau-loai-ban-do',1.6,['Sáu loại bản đồ\ntrong Sương Giang.','Đồng bằng, sông lớn,\nrừng rậm, hồ lớn,\nvịnh biển, thảo nguyên.','Bạn thích\nbản đồ nào?']),
 'z6':('6-ky-binh-xong-tran',2.2,['Tám kỵ binh xông vào\ntám cung thủ.','Ngựa nhanh,\nnhưng cung tên bắn xa.','Bạn đoán\nbên nào thắng?']),
 'z7':('7-dem-soi',2.2,['Đêm xuống,\nbầy sói kéo đến làng.','Chòi canh bắn trả,\nlính giáo giữ cửa.','Sống sót qua đêm\nđược không?']),
 'v1':('1-cho-san-dau-soi',2.0,['Chó săn đấu sói.', 'Bé mà có võ.', 'Bạn đoán ai thắng?']),
 'v2':('2-voi-dau-te-giac',2.0,['Voi đấu tê giác.', 'Hai gã khổng lồ\\nchạm trán.', 'Bạn chọn bên nào?']),
 'v3':('3-hai-tuong-dau-ky-binh',2.2,['Hai vị tướng đấu\\nsáu kỵ binh.', 'Ngược dòng\\nđược không?']),
 'v4':('4-tuong-thanh-chan-linh',2.0,['Mười hai lính\\ntấn công tường thành.', 'Chòi canh bắn\\ntừ trên cao.', 'Thủ được bao lâu?']),
 'v5':('5-xay-lang-20-giay',1.6,['Xây làng trong\\nhai mươi giây.', 'Nhà, ruộng, trại lính,\\nchòi canh.', 'Nhìn là mê!']),
 'v6':('6-meo-giao-khac-ngua',2.0,['Mẹo nhỏ.', 'Lính giáo\\nkhắc kỵ binh.', 'Đừng đưa ngựa\\nđấu giáo!']),
 'v7':('7-meo-cung-thu-sau-giao',2.0,['Mẹo nhỏ.', 'Cung thủ đứng\\nsau lính giáo.', 'Bắn thoải mái,\\nđịch không chạm tới.']),
 'v8':('8-meo-di-san-huou',2.0,['Mẹo nhỏ.', 'Cho dân làng đi săn\\nhươu lấy thịt.', 'Lúc đầu nhanh hơn\\ntrồng ruộng.']),
 'v9':('9-binh-minh-lang',1.5,['Bình minh ở làng\\nven sông.', 'Sương còn trên\\nmặt nước.']),
 'v10':('10-dom-dom-dem',1.5,['Đêm xuống,\\nđom đóm bay quanh\\nđình làng.']),
 'v11':('11-mua-tren-lang',1.5,['Mưa rơi trên làng.', 'Nghe thôi\\ncũng thấy yên.']),
 'v12':('12-mua-thu',1.5,['Mùa thu về,\\nlá đổi màu khắp làng.']),
 'v15':('15-nha-doi-hinh-theo-doi',1.5,['Nhà đổi hình\\ntheo từng đời.', 'Từ nhà tranh\\nđến đình ngói.']),
 'v16':('16-linh-qua-cac-doi',1.5,['Lính khoác giáp mới\\ntheo từng đời.', 'Bạn thích đời nào?']),
 'v17':('17-ca-sau-ven-song',2.0,['Cẩn thận ven sông.', 'Cá sấu rình\\nsẵn đấy!']),
 'v13':('13-ba-linh-giao-dau-ho',2.0,['Ba lính giáo\nđấu một con hổ.','Ai thắng?']),
 'v14':('14-tuong-dau-nam-cung-thu',2.0,['Tướng quân đấu\nnăm cung thủ.','Bạn đoán ai thắng?']),
 'v18':('18-may-ban-da-dau-choi-canh',2.0,['Máy bắn đá\nđấu chòi canh.','Bắn xa hay\nđứng cao?','Đoán đi!']),
 'v19':('19-mua-ten',2.0,['Hai mươi cung thủ\nbắn mưa tên.','Hai mươi lính giáo\nxông lên.']),
 'v20':('20-choi-ngay',2.8,['Bạn đã chơi\nSương Giang chưa?','Chơi miễn phí,\nlink ở bio.']),
 'u1':('1-xep-hang-ba-binh-chung',1.6,['Xếp hạng\\nba binh chủng.', 'Hạng 3:\\nkỵ binh.', 'Hạng 2:\\ncung thủ.', 'Hạng 1:\\nvoi chiến.']),
 'u2':('2-muoi-ba-loai-thu',1.6,['Sương Giang có\\nmười ba loài thú hoang.', 'Bạn gặp được\\nmấy con?']),
 'u3':('3-mot-ngay-o-lang',1.8,['Một ngày ở làng.', 'Người gặt lúa,\\nngười đốn củi,\\nngười xây nhà.']),
 'u4':('4-dung-hay-sai-tuong-thanh',1.8,['Đúng hay sai?', 'Tường thành chặn\\nđược voi chiến.', 'Sai!', 'Voi phá tường\\nrất nhanh.']),
 'u5':('5-ngay-xua-co-mot-lang',1.8,['Ngày xưa, ven sông\\ncó một ngôi làng nhỏ.', 'Sương mù phủ kín.', 'Giặc từ rừng\\nkéo đến.']),
 'u6':('6-bon-mua',1.5,['Bốn mùa\\ntrong Sương Giang.', 'Xuân, hạ, thu, đông.', 'Bạn thích\\nmùa nào?']),
 'u7':('7-bon-nhan-vat-dac-biet',1.6,['Gặp bốn nhân vật\\nđặc biệt.', 'Tướng quân, nữ tướng,\\nthầy lang và thầy tu.']),
 'u8':('8-ban-do-rat-lon',2.8,['Chế độ hai đấu hai\\ntrên bản đồ rất lớn.', 'Đủ chỗ cho bốn phe\\ntranh đất.']),
 'u9':('9-ba-ma-bi-mat-nua',1.8,['Ba mã bí mật nữa.', 'Xây nhanh, luyện quân\\nnhanh, đổi áo.', 'Nhập thử đi!']),
 'u10':('10-dung-lang-giu-dat',2.8,['Sương Giang.', 'Dựng làng, giữ đất.', 'Chơi miễn phí\\ntrên trình duyệt.']),
}
WIDE={'w0','v20','u8','u10'}   # cảnh quay màn rộng 1600x900: đặt giữa khung dọc trên nền mờ, chữ nằm phía trên
CAP=float(os.environ.get('CAP',16.5))   # độ dài tối đa phần thân (video giới thiệu dài đặt CAP=24)
DEL={}
MANUAL={
 'u1':[(0, 1.31), (1.68, 2.91), (3.32, 4.68), (5.0, 6.48)],
 'u2':[(0, 1.92), (2.32, 3.47)],
 'u3':[(0, 1.13), (1.44, 4.11)],
 'u4':[(0, 0.81), (1.44, 2.89), (3.8, 4.27), (4.74, 6.27)],
 'u5':[(0, 2.74), (3.36, 4.56), (4.97, 6.19)],
 'u6':[(0, 1.38), (1.85, 4.01), (4.66, 5.64)],
 'u7':[(0, 1.34), (1.98, 5.49)],
 'u8':[(0, 2.33), (2.83, 4.99)],
 'u9':[(0, 1.34), (2.0, 4.69), (5.22, 6.11)],
 'u10':[(0, 0.69), (1.08, 2.3), (2.84, 4.6)],
 'v13':[(0,1.55),(2.05,2.85)],
 'v14':[(0,1.46),(1.82,3.0)],
 'v18':[(0,1.45),(1.90,3.07),(3.53,4.13)],
 'v19':[(0,1.92),(2.29,4.2)],
 'v20':[(0,1.42),(1.89,4.05)],
 'v1':[(0, 1.25), (1.6, 2.56), (3.14, 4.28)],
 'v2':[(0, 1.1), (1.79, 3.36), (3.8, 4.99)],
 'v3':[(0, 1.74), (2.29, 3.32)],
 'v4':[(0, 1.62), (2.05, 3.47), (3.89, 5.07)],
 'v5':[(0, 1.25), (1.72, 4.73), (5.11, 6.27)],
 'v6':[(0, 0.75), (1.51, 2.77), (3.49, 4.83)],
 'v7':[(0, 0.69), (1.16, 2.78), (3.2, 5.72)],
 'v8':[(0, 0.84), (1.42, 3.2), (3.74, 5.49)],
 'v9':[(0, 1.51), (2.04, 3.32)],
 'v10':[(0, 2.69)],
 'v11':[(0, 1.14), (1.69, 3.24)],
 'v12':[(0, 2.77)],
 'v15':[(0, 1.45), (1.85, 3.55)],
 'v16':[(0, 1.55), (2.08, 3.0)],
 'v17':[(0, 1.12), (1.57, 2.69)],
   # nhịp ngắt câu chọn tay khi lời đọc có nhiều dấu phẩy (silencedetect tự động dễ nhầm)
 'y5':[(0,1.26),(1.73,4.13),(4.48,6.41),(6.88,10.27),(10.66,12.68),(13.0,15.9)],
 'z1':[(0,2.29),(2.84,4.59),(5.18,6.35)],
 'z2':[(0,2.81),(3.22,4.76),(5.25,6.92)],
 'z3':[(0,2.12),(2.61,4.78),(5.38,6.84)],
 'z4':[(0,2.29),(2.65,4.56),(5.10,6.19)],
 'z5':[(0,1.86),(2.40,7.59),(8.26,9.4)],
 'z6':[(0,1.96),(2.33,4.47),(4.96,6.27)],
 'z7':[(0,2.21),(2.55,5.0),(5.39,7.0)],
 'y7':[(0,1.77),(2.25,5.05),(5.48,7.88),(8.43,10.56),(10.84,11.6)],
}
def segs(mp3,n):
    d=float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',mp3],capture_output=True,text=True).stdout)
    out=subprocess.run(['ffmpeg','-hide_banner','-i',mp3,'-af','silencedetect=noise=-35dB:d=0.2','-f','null','-'],capture_output=True,text=True).stderr
    st=[float(x) for x in re.findall(r'silence_start: ([0-9.]+)',out)];en=[float(x) for x in re.findall(r'silence_end: ([0-9.]+)',out)]
    gaps=[(s,e) for s,e in zip(st,en) if s>0.3 and e<d-0.2]
    gaps=sorted(sorted(gaps,key=lambda g:g[0]-g[1])[:n-1])   # n-1 quãng nghỉ dài nhất
    b=[0]+[x for g in gaps for x in g]+[d];return [(b[2*i],b[2*i+1]) for i in range(n)],d
name=sys.argv[1:] or list(V)
for k in name:
    if not os.path.exists(f'vo/{k}.mp3'):print('thiếu',k);continue
    scene,ss,caps=V[k];dl=DEL.get(k,[0]*len(caps));sg,d=segs(f'vo/{k}.mp3',len(caps));sg=MANUAL.get(k,sg);body=max(min(d+1.2+max(dl),CAP),float(os.environ.get('MINB',0)))
    subprocess.run(['ffmpeg','-v','error','-y','-ss',str(ss),'-t',f'{body:.2f}','-i',f'{k}.webm','-vf',("split[a][b];[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=30:5[bg];[b]scale=1080:-2:flags=lanczos[fg];[bg][fg]overlay=0:(H-h)/2,fps=30,setsar=1,fade=t=in:st=0:d=0.2" if k in WIDE else 'fps=30,scale=1080:1920:flags=lanczos,setsar=1,fade=t=in:st=0:d=0.2'),'-an','-c:v','libx264','-crf','17','-pix_fmt','yuv420p','body.mp4'],check=True)
    subprocess.run(['ffmpeg','-v','error','-y','-loop','1','-t','2.8','-i',os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','assets','end_card.png'),'-vf','fps=30,format=yuv420p,fade=t=in:st=0:d=0.3','-c:v','libx264','-crf','17','endc.mp4'],check=True)
    open('l.txt','w').write("file 'body.mp4'\nfile 'endc.mp4'\n");subprocess.run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i','l.txt','-c','copy','b.mp4'],check=True)
    tot=body+2.8;dt=[];af=[];ins=['-i','b.mp4'];off=0.35
    for i,((a0,a1),txt) in enumerate(zip(sg,caps)):
        D=dl[i]
        tf=f'wt{i}.txt';open(tf,'w').write(txt)
        dt.append(f"drawtext=fontfile={FB}:textfile={tf}:fontsize=62:line_spacing=12:fontcolor=white:borderw=6:bordercolor=black@0.85:x=(w-text_w)/2:y=250:enable='between(t,{a0+off+D:.2f},{a1+off+D+0.3:.2f})'")
        ins+=['-ss',f'{a0:.2f}','-t',f'{a1-a0+.05:.2f}','-i',f'vo/{k}.mp3'];ms=int((a0+off+D)*1000);af.append(f"[{i+1}:a]adelay={ms}|{ms}[a{i}]")
    mix=';'.join(af)+';'+''.join(f'[a{i}]' for i in range(len(af)))+f"amix=inputs={len(af)}:normalize=0,alimiter=limit=0.7:level=0,apad,atrim=0:{tot:.2f},aresample=44100[aout]"
    os.makedirs('final',exist_ok=True)
    subprocess.run(['ffmpeg','-v','error','-y',*ins,'-filter_complex',f"[0:v]{','.join(dt)}[vout];{mix}",'-map','[vout]','-map','[aout]','-c:v','libx264','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-movflags','+faststart',f'final/{scene}.mp4'],check=True)
    print(k,scene,round(tot,1),[tuple(round(x,1) for x in s) for s in sg])
