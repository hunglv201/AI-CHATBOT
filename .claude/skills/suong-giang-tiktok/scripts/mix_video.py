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
}
WIDE={'w0'}   # cảnh quay màn rộng 1600x900: đặt giữa khung dọc trên nền mờ, chữ nằm phía trên
CAP=float(os.environ.get('CAP',16.5))   # độ dài tối đa phần thân (video giới thiệu dài đặt CAP=24)
DEL={}
MANUAL={   # nhịp ngắt câu chọn tay khi lời đọc có nhiều dấu phẩy (silencedetect tự động dễ nhầm)
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
    scene,ss,caps=V[k];dl=DEL.get(k,[0]*len(caps));sg,d=segs(f'vo/{k}.mp3',len(caps));sg=MANUAL.get(k,sg);body=min(d+1.2+max(dl),CAP)
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
