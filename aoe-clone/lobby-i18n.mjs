// The room lobby's text in English and Vietnamese (index.html, lobby.mjs). Only the lobby is translated: the
// game's own text comes from its language DLLs, and names still reach the game as Windows-1252 (cp1252.mjs),
// so the Vietnamese defaults below (the room name) use only characters that code page has.
// index.html marks static text with data-i18n (text), data-i18n-placeholder, data-i18n-aria-label and
// data-i18n-title; its English text stays in the markup for a page without scripts.

const FIELD_EN = {name: 'your name', room: 'the room name', password: 'the password'};
const FIELD_VI = {name: 'Tên', room: 'Tên phòng', password: 'Mật khẩu'};
const quoted = chars => chars.map(c => `“${c}”`).join(' ');

export const STRINGS = {
  en: {
    title: 'Rise of Rome rooms',
    gameTitle: room => `${room} - Rise of Rome`,
    language: 'Language',
    yourName: 'Your name',
    nameCaption: 'Other players see you by this name.',
    changeName: 'Change name',
    saveName: 'Save name',
    cancel: 'Cancel',
    rooms: 'Rooms',
    tabJoin: 'Join a room',
    tabCreate: 'Create a room',
    searchRooms: 'Search rooms',
    searchPlaceholder: 'Search rooms or hosts',
    roomName: 'Room name',
    password: 'Password',
    optional: '(optional)',
    show: 'Show',
    hide: 'Hide',
    passwordHelp: 'Leave it empty and anyone can join. With a password, only players who know it can.',
    createRoom: 'Create room',
    game: 'Game',
    locked: 'locked',
    copyInvite: 'Copy invite link',
    linkCopied: 'Link copied',
    copyFailed: 'Copy failed',
    fullScreen: 'Full screen',
    exitFullScreen: 'Exit full screen',
    fullScreenTip: 'Alt+Enter. The game keeps the mouse; hold Esc to leave.',
    leaveRoom: 'Leave room',
    leaveMatch: 'Leave the match?',
    leave: 'Leave',
    stay: 'Stay',
    help: 'Help',
    close: 'Close',
    ok: 'OK',
    join: 'Join',
    roomPassword: 'Password for this room',
    needsPassword: 'Needs a password',
    hostedBy: host => `Hosted by ${host}`,
    hostArriving: 'Host is arriving',
    players: (n, max) => `${n} of ${max}`,
    playersLabel: (n, max) => `${n} of ${max} players`,
    full: 'Full',
    inGame: 'In game',
    joinRoom: room => `Join ${room}`,
    defaultRoom: player => `${player}'s room`,
    missing: field => `Enter ${FIELD_EN[field]}.`,
    tooLong: (field, max) => `Use at most ${max} characters for ${FIELD_EN[field]}.`,
    unsupported: chars => `The game can't write ${quoted(chars)}. Use Latin letters, digits and common punctuation.`,
    serverDown: 'The server is not answering. Trying again…',
    lookingForRooms: 'Looking for rooms…',
    noMatch: query => `No room or host matches “${query}”.`,
    noRooms: 'No rooms yet. Create one and share its name.',
    inviteClosed: 'The room in your invite link has closed. Pick another one or create your own.',
    wrongPassword: 'That password is not right. Check it with the host.',
    roomClosed: 'This room is full, or its match has started.',
    roomGone: 'This room has closed.',
    slowDown: 'Too many tries. Wait a few seconds, then try again.',
    offline: 'The server is not answering. Try again in a moment.',
    gameClosed: 'The game closed.',
    gameStopped: reason => `The game stopped: ${reason}`,
    reload: reason => `${reason} Reload the page to try again.`,
    creating: room => `Creating ${room}`,
    joining: room => `Joining ${room}`,
    passwordChanged: room => `The password for ${room} has changed. Ask the host for it.`,
    namedRoomClosed: room => `${room} is full, or its match has started.`,
    namedRoomGone: room => `${room} has closed.`,
    createFailed: room => `${room} could not be created. Try again.`,
    joinFailed: room => `Could not join ${room}. Try again.`,
    left: room => `You left ${room}.`,
    // Worker status (native-worker.mjs), by key.
    loading: count => `Loading ${count} game files…`,
    starting: 'Starting WinMain…',
    running: 'Running',
    runningNoStorage: 'Running (browser storage unavailable: profiles and saves are not kept)',
    workerError: message => `Worker error: ${message}`,
  },
  vi: {
    title: 'Phòng chơi Rise of Rome',
    gameTitle: room => `${room} - Rise of Rome`,
    language: 'Ngôn ngữ',
    yourName: 'Tên của bạn',
    nameCaption: 'Người chơi khác sẽ thấy bạn qua tên này.',
    changeName: 'Đổi tên',
    saveName: 'Lưu tên',
    cancel: 'Hủy',
    rooms: 'Phòng',
    tabJoin: 'Vào phòng',
    tabCreate: 'Tạo phòng',
    searchRooms: 'Tìm phòng',
    searchPlaceholder: 'Tìm theo tên phòng hoặc chủ phòng',
    roomName: 'Tên phòng',
    password: 'Mật khẩu',
    optional: '(không bắt buộc)',
    show: 'Hiện',
    hide: 'Ẩn',
    passwordHelp: 'Để trống thì ai cũng vào được. Nếu đặt mật khẩu, chỉ người biết mật khẩu mới vào được.',
    createRoom: 'Tạo phòng',
    game: 'Trò chơi',
    locked: 'có mật khẩu',
    copyInvite: 'Sao chép liên kết mời',
    linkCopied: 'Đã sao chép liên kết',
    copyFailed: 'Không sao chép được',
    fullScreen: 'Toàn màn hình',
    exitFullScreen: 'Thoát toàn màn hình',
    fullScreenTip: 'Alt+Enter. Trò chơi giữ chuột; giữ phím Esc để thoát.',
    leaveRoom: 'Rời phòng',
    leaveMatch: 'Rời trận đấu?',
    leave: 'Rời',
    stay: 'Ở lại',
    help: 'Trợ giúp',
    close: 'Đóng',
    ok: 'OK',
    join: 'Vào',
    roomPassword: 'Mật khẩu của phòng này',
    needsPassword: 'Cần mật khẩu',
    hostedBy: host => `Chủ phòng: ${host}`,
    hostArriving: 'Chủ phòng đang vào',
    players: (n, max) => `${n}/${max}`,
    playersLabel: (n, max) => `${n} trên ${max} người chơi`,
    full: 'Đã đầy',
    inGame: 'Đang chơi',
    joinRoom: room => `Vào ${room}`,
    // "Phòng của …" would need "ủ", which Windows-1252 doesn't have; "ò" it has.
    defaultRoom: player => `Phòng ${player}`,
    missing: field => ({name: 'Hãy nhập tên của bạn.', room: 'Hãy nhập tên phòng.', password: 'Hãy nhập mật khẩu.'})[field],
    tooLong: (field, max) => `${FIELD_VI[field]} chỉ được dài tối đa ${max} ký tự.`,
    unsupported: chars => `Trò chơi không viết được ${quoted(chars)}. Tên chưa hỗ trợ chữ tiếng Việt có dấu: hãy dùng chữ không dấu, chữ số và dấu câu thông dụng.`,
    serverDown: 'Máy chủ không phản hồi. Đang thử lại…',
    lookingForRooms: 'Đang tìm phòng…',
    noMatch: query => `Không có phòng hay chủ phòng nào khớp với “${query}”.`,
    noRooms: 'Chưa có phòng nào. Hãy tạo một phòng và chia sẻ tên phòng.',
    inviteClosed: 'Phòng trong liên kết mời đã đóng. Hãy chọn phòng khác hoặc tự tạo phòng.',
    wrongPassword: 'Mật khẩu không đúng. Hãy hỏi lại chủ phòng.',
    roomClosed: 'Phòng này đã đầy hoặc trận đấu đã bắt đầu.',
    roomGone: 'Phòng này đã đóng.',
    slowDown: 'Thử quá nhiều lần. Hãy đợi vài giây rồi thử lại.',
    offline: 'Máy chủ không phản hồi. Hãy thử lại sau giây lát.',
    gameClosed: 'Trò chơi đã đóng.',
    gameStopped: reason => `Trò chơi đã dừng: ${reason}`,
    reload: reason => `${reason} Hãy tải lại trang để thử lại.`,
    creating: room => `Đang tạo ${room}`,
    joining: room => `Đang vào ${room}`,
    passwordChanged: room => `Mật khẩu của ${room} đã thay đổi. Hãy hỏi chủ phòng.`,
    namedRoomClosed: room => `${room} đã đầy hoặc trận đấu đã bắt đầu.`,
    namedRoomGone: room => `${room} đã đóng.`,
    createFailed: room => `Không tạo được ${room}. Hãy thử lại.`,
    joinFailed: room => `Không vào được ${room}. Hãy thử lại.`,
    left: room => `Bạn đã rời ${room}.`,
    loading: count => `Đang tải ${count} tệp trò chơi…`,
    starting: 'Đang khởi động trò chơi…',
    running: 'Đang chạy',
    runningNoStorage: 'Đang chạy (trình duyệt không cho lưu trữ: hồ sơ và bản lưu sẽ không được giữ lại)',
    workerError: message => `Lỗi worker: ${message}`,
  },
};
export const LANGUAGES = Object.keys(STRINGS);

const KEY = 'aoe.language';
const stored = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
// The saved choice, else the browser's first language the lobby has, else English.
export let language = LANGUAGES.includes(stored()) ? stored()
  : (globalThis.navigator?.languages || [globalThis.navigator?.language]).map(l => String(l).slice(0, 2).toLowerCase()).find(l => LANGUAGES.includes(l)) || 'en';

// The text for key in the current language (English when it has none). Functions take the arguments.
export function t(key, ...args) {
  const value = STRINGS[language][key] ?? STRINGS.en[key];
  if (value === undefined) throw new Error('No lobby text for ' + key);
  return typeof value === 'function' ? value(...args) : value;
}

const ATTRIBUTES = {'data-i18n-placeholder': 'placeholder', 'data-i18n-aria-label': 'aria-label', 'data-i18n-title': 'title'};
// Applies the data-i18n* keys under root (a document, element or template content).
export function translate(root) {
  for (const el of root.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const [attribute, target] of Object.entries(ATTRIBUTES)) {
    for (const el of root.querySelectorAll(`[${attribute}]`)) el.setAttribute(target, t(el.getAttribute(attribute)));
  }
}

const listeners = [];
export const onLanguageChange = fn => listeners.push(fn);
export function setLanguage(lang) {
  if (!LANGUAGES.includes(lang)) return;
  language = lang;
  try { localStorage.setItem(KEY, lang); } catch {}
  document.documentElement.lang = lang;
  for (const fn of listeners) fn(lang);
}
