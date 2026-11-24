// Cầu nối TikTok LIVE -> game. Dùng: node server.js <username>   (hoặc: node server.js --mock)
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const args = process.argv.slice(2);
const mock = args.includes('--mock');
const username = args.find(a => !a.startsWith('--'));
const PORT = +(process.env.PORT || 8080);

if (!mock && !username) {
  console.log('Cách dùng:\n  node server.js <username_tiktok>   # kênh đang LIVE, không cần @\n  node server.js --mock              # sự kiện giả để thử');
  process.exit(1);
}

/* ---- web server: phục vụ game + WebSocket cùng một cổng ---- */
const GAME = path.join(__dirname, '..', 'index.html');
const server = http.createServer((req, res) => {
  if (req.url.split('?')[0] === '/' ) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(fs.readFileSync(GAME));
  }
  res.writeHead(404); res.end('not found');
});
const wss = new WebSocketServer({ server });
const broadcast = ev => {
  const msg = JSON.stringify(ev);
  for (const c of wss.clients) if (c.readyState === 1) c.send(msg);
};
wss.on('connection', () => console.log('[game] một trang game vừa kết nối'));

/* ---- chuyển quà TikTok -> loại quà trong game theo giá trị kim cương ---- */
function giftKind(name, diamonds) {
  const n = String(name || '').toLowerCase();
  if (/lion|universe|galaxy|castle|sư tử/.test(n) || diamonds >= 1000) return 'lion';
  if (/rocket|drone|jet|tên lửa/.test(n) || diamonds >= 99) return 'rocket';
  if (diamonds >= 10) return 'turret';
  return 'rose';
}
const who = d => (d.user && (d.user.nickname || d.user.uniqueId)) || d.nickname || d.uniqueId || 'Ẩn danh';

/* ---- nguồn sự kiện ---- */
if (mock) {
  const names = ['Minh', 'Lan Anh', 'Hùng', 'Thảo', 'Nam', 'Hà My'];
  const p = a => a[Math.floor(Math.random() * a.length)];
  const u = () => p(names) + ' ' + (10 + Math.floor(Math.random() * 90));
  setInterval(() => {
    const r = Math.random();
    if (r < .15) broadcast({ type: 'join', user: u() });
    else if (r < .5) broadcast({ type: 'comment', user: u(), text: p(['bắn', 'skill', 'hello', 'bắn đi']) });
    else if (r < .8) broadcast({ type: 'like', user: u(), count: 5 });
    else if (r < .95) broadcast({ type: 'gift', user: u(), gift: p(['rose', 'rocket', 'turret']), count: 1 });
    else broadcast({ type: 'follow', user: u() });
  }, 400);
  console.log('[mock] đang phát sự kiện giả');
} else {
  const { TikTokLiveConnection, WebcastEvent, ControlEvent } = require('tiktok-live-connector');
  const conn = new TikTokLiveConnection(username.replace(/^@/, ''));
  conn.on(WebcastEvent.MEMBER, d => broadcast({ type: 'join', user: who(d) }));
  conn.on(WebcastEvent.CHAT, d => broadcast({ type: 'comment', user: who(d), text: d.comment }));
  conn.on(WebcastEvent.LIKE, d => broadcast({ type: 'like', user: who(d), count: d.likeCount || 1 }));
  conn.on(WebcastEvent.FOLLOW, d => broadcast({ type: 'follow', user: who(d) }));
  conn.on(WebcastEvent.SHARE, d => broadcast({ type: 'share', user: who(d) }));
  conn.on(WebcastEvent.GIFT, d => {
    // quà dạng chuỗi (streak): chỉ tính khi kết thúc chuỗi để không đếm lặp
    const det = d.giftDetails || d.extendedGiftInfo || {};
    if (det.giftType === 1 && d.repeatEnd === false) return;
    const diamonds = det.diamondCount ?? det.diamond_count ?? 1;
    const name = det.giftName ?? det.name ?? d.giftName;
    const count = Math.min(d.repeatCount || 1, 20);
    broadcast({ type: 'gift', user: who(d), gift: giftKind(name, diamonds), count });
    console.log('[gift]', who(d), name, diamonds + '💎 x' + count);
  });
  conn.on(ControlEvent.ERROR, e => console.error('[tiktok] lỗi:', e && e.message || e));
  conn.on(ControlEvent.DISCONNECTED, () => { console.log('[tiktok] mất kết nối, thử lại sau 5s'); setTimeout(connect, 5000); });
  const connect = () => conn.connect()
    .then(s => console.log('[tiktok] đã kết nối phòng', s && s.roomId))
    .catch(e => { console.error('[tiktok] không kết nối được:', e.message, '- thử lại sau 10s'); setTimeout(connect, 10000); });
  connect();
}

server.listen(PORT, () => {
  console.log('Game: http://localhost:' + PORT + '/?ws=ws://localhost:' + PORT + (process.env.OBS ? '&obs=1' : ''));
  console.log('Đưa link này vào OBS (Browser Source), thêm &obs=1 để ẩn panel.');
});
