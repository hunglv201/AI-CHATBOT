// The page side of the game: the worker (native-worker.mjs), its canvas, input, full screen and mouse
// capture, help and message boxes. native.html (the debugging page) and index.html (the lobby) both use it.
// A host is one run of the game; destroy() ends it, and a new host starts the next one on the same page.
import {createMidiSynth} from './native-midi.mjs';
import {cp1252Byte} from './cp1252.mjs';

// Browsers start audio only after a user gesture: call from one. The MIDI synth loads once the audio context
// exists; without web/vendor (tools/fetch_vendor.py) the game runs with sound effects only.
export function unlockMedia(media, onError) {
  media.unlock();
  if (media.synthLoading) return;
  media.synthLoading = true;
  createMidiSynth(media.context, media.musicBus).then(synth => media.setSynth(synth))
    .catch(error => onError?.('MIDI music unavailable: ' + (error?.message || error)));
}

// stage: the element the game fills (a canvas#screen and the capture cursor are added to it; CSS sizes it
// with --aspect). media: a MediaHost (native-media.mjs), kept by the page between games. dialogs: the page's
// message box {box, title, text} and help {dialog, frame, title, close}. space() is the page's room for the
// game outside full screen, {width, height} in CSS pixels (widescreen). The on* callbacks are optional:
// onStatus(text, {key, count, message}: the status by key, see native-worker.mjs), onLog(text, error), onReady(), onEnd({kind, code, reason}), onRoom(event, code), onFullscreen(on).
export function createGameHost({stage, media, dialogs, space, commandLine = 'NODXCHECK', dataDir = 'game', wide = true,
  onStatus, onLog, onReady, onEnd, onRoom, onFullscreen}) {
  const off = new AbortController(), signal = off.signal;
  const listen = (target, type, handler, options = {}) => target.addEventListener(type, handler, {...options, signal});
  const log = (text, error) => onLog?.(text, error);

  const screen = document.createElement('canvas');
  Object.assign(screen, {id: 'screen', width: 800, height: 600, tabIndex: 0});
  screen.setAttribute('aria-label', 'Age of Empires: The Rise of Rome');
  const cursorMark = document.createElement('div');
  cursorMark.id = 'cursor';
  cursorMark.hidden = true;
  stage.append(screen, cursorMark);

  const worker = new Worker(new URL('./native-worker.mjs', import.meta.url), {type: 'module'});
  const offscreen = screen.transferControlToOffscreen();
  media.onVideoEnded = () => worker.postMessage({type: 'video-ended'});
  let size = {width: 800, height: 600}, started = false, destroyed = false;
  worker.postMessage({type: 'start', canvas: offscreen, commandLine, dataDir}, [offscreen]);

  // Widescreen: the game screen widens to the shape of the space the page has for it (the menus stay 4:3);
  // in full screen the game has the whole screen. wide false keeps the retail 4:3 game screen.
  const sendAspect = () => {
    const room = document.fullscreenElement ? {width: innerWidth, height: innerHeight} : space();
    worker.postMessage({type: 'aspect', width: wide ? Math.max(0, room.width) : 0, height: Math.max(1, room.height)});
  };
  let aspectTimer = 0;
  sendAspect();
  listen(window, 'resize', () => { clearTimeout(aspectTimer); aspectTimer = setTimeout(sendAspect, 250); });

  worker.onmessage = ({data}) => {
    if (data.type === 'status') onStatus?.(data.text, data);
    else if (data.type === 'media') media.handle(data.m);
    // WinHelp from the game: a keyword topic, the contents, or quit (game/help, made by tools/prepare_native.py).
    else if (data.type === 'help') showHelp(data.command, data.key);
    // The game's Windows cursor; 'none' while it draws its own pointer into the frame.
    else if (data.type === 'cursor') { screen.style.cursor = data.css; gameCursor = data.css; showCursor(); }
    else if (data.type === 'ready') onReady?.();
    else if (data.type === 'size') { size = {width: data.width, height: data.height}; stage.style.setProperty('--aspect', `${data.width}/${data.height}`); moveVirtual(0, 0); }
    else if (data.type === 'log') { (data.error ? console.warn : console.log)(data.line); log(data.line, data.error); }
    else if (data.type === 'room') onRoom?.(data.event, data.code);
    else if (data.type === 'messagebox') {
      dialogs.box.title.textContent = data.title; dialogs.box.text.textContent = data.text;
      if (!dialogs.box.box.open) { release(); dialogs.box.box.showModal(); }
    } else if (data.type === 'end') {
      gameOver = true; screen.style.cursor = 'auto';
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); else release();
      onEnd?.(data);
    }
  };
  worker.onerror = event => { onStatus?.('Worker error: ' + event.message, {key: 'workerError', message: event.message}); console.error(event.message); };

  // ---- full screen and mouse capture
  // In full screen the game takes the mouse like the original full-screen game: the pointer is locked to
  // the canvas and a virtual cursor (in game pixels) follows the mouse's relative motion, clamped to the
  // game screen, so it cannot leave the window and pushing against an edge scrolls the map. Esc is kept
  // for the game where the browser allows it (Keyboard Lock); holding Esc leaves full screen.
  let locked = false, lockRefused = false, gameOver = false, gameCursor = 'default';
  const virtual = {x: 0, y: 0};
  const moveVirtual = (dx, dy) => {
    virtual.x = Math.max(0, Math.min(size.width - 1, virtual.x + dx));
    virtual.y = Math.max(0, Math.min(size.height - 1, virtual.y + dy));
  };
  // The stand-in arrow for the game's Windows cursor; in the game view (cursor 'none') the game draws its own.
  const showCursor = () => {
    cursorMark.hidden = !locked || gameCursor === 'none';
    if (!cursorMark.hidden) { cursorMark.style.left = `${100 * Math.floor(virtual.x) / size.width}%`; cursorMark.style.top = `${100 * Math.floor(virtual.y) / size.height}%`; }
  };
  const capture = () => {
    if (!document.fullscreenElement || locked || gameOver || !started || dialogs.box.box.open || dialogs.help.dialog.open) return;
    try { screen.requestPointerLock()?.catch?.(() => {}); } catch {}
  };
  const release = () => { if (document.pointerLockElement === screen) document.exitPointerLock(); };
  listen(document, 'pointerlockchange', () => { locked = document.pointerLockElement === screen; showCursor(); if (locked) { lockRefused = false; screen.focus(); } });
  listen(document, 'pointerlockerror', () => { lockRefused = true; log('[aoe] The browser did not let the game capture the mouse; click the game to try again.', true); });
  async function toggleFullscreen() {
    if (document.fullscreenElement) { await document.exitFullscreen().catch(() => {}); return; }
    try { await document.documentElement.requestFullscreen({navigationUI: 'hide'}); }
    catch (error) { log('[aoe] Full screen unavailable: ' + (error?.message || error), true); return; }
    // Chromium only: Esc goes to the game instead of leaving full screen (hold Esc to leave).
    navigator.keyboard?.lock?.(['Escape']).catch(() => {});
    capture();
  }
  listen(document, 'fullscreenchange', () => {
    // Widescreen: the game screen re-fits to the whole screen, or back to the page.
    clearTimeout(aspectTimer); aspectTimer = setTimeout(sendAspect, 250);
    onFullscreen?.(!!document.fullscreenElement);
    if (document.fullscreenElement) return;
    navigator.keyboard?.unlock?.();
    release();
    screen.focus();
  });
  listen(window, 'keydown', e => { if (e.altKey && (e.code === 'Enter' || e.code === 'NumpadEnter') && !e.repeat) { e.preventDefault(); e.stopPropagation(); toggleFullscreen(); } }, {capture: true});

  // ---- mouse: canvas pixels (or the captured virtual cursor) -> game screen coordinates
  const point = e => {
    if (locked) return {x: Math.floor(virtual.x), y: Math.floor(virtual.y)};
    const r = screen.getBoundingClientRect();
    const x = Math.max(0, Math.min(size.width - 1, (e.clientX - r.left) * size.width / r.width)), y = Math.max(0, Math.min(size.height - 1, (e.clientY - r.top) * size.height / r.height));
    // Capturing the mouse starts the virtual cursor where the pointer was.
    virtual.x = x; virtual.y = y;
    return {x: Math.floor(x), y: Math.floor(y)};
  };
  const mods = e => ({shift: e.shiftKey, ctrl: e.ctrlKey, alt: e.altKey, caps: !!e.getModifierState?.('CapsLock')});
  const mouse = (kind, e) => { const p = point(e); worker.postMessage({type: 'mouse', mods: mods(e), kind, button: e.button ?? 0, time: performance.timeOrigin + e.timeStamp, x: p.x, y: p.y}); };
  // A button pressed or released while another is held arrives as a pointermove with e.button set (-1 otherwise).
  const buttonBit = [1, 4, 2];
  listen(screen, 'pointermove', e => {
    if (locked) {
      // Relative motion in page pixels, scaled to game pixels as shown on screen.
      const r = screen.getBoundingClientRect();
      moveVirtual(e.movementX * size.width / r.width, e.movementY * size.height / r.height);
      showCursor();
    }
    mouse(e.button >= 0 && e.button <= 2 ? (e.buttons & buttonBit[e.button] ? 1 : 2) : 0, e);
  });
  listen(screen, 'pointerdown', e => {
    screen.focus();
    e.preventDefault();
    // In full screen, a click that (re)captures the mouse is not passed to the game (unless the browser
    // refused the last capture, so the game stays playable).
    if (document.fullscreenElement && !locked && !gameOver) { point(e); capture(); if (!lockRefused) return; }
    if (!locked) screen.setPointerCapture(e.pointerId);
    mouse(1, e);
  });
  listen(screen, 'pointerup', e => { mouse(2, e); e.preventDefault(); });
  listen(screen, 'contextmenu', e => e.preventDefault());

  // ---- keyboard: KeyboardEvent.code -> [virtual key, scan code, extended]
  const keys = {Escape:[0x1B,1],F1:[0x70,59],F2:[0x71,60],F3:[0x72,61],F4:[0x73,62],F5:[0x74,63],F6:[0x75,64],F7:[0x76,65],F8:[0x77,66],F9:[0x78,67],F10:[0x79,68],F11:[0x7A,87],F12:[0x7B,88],
    Backquote:[0xC0,41],Minus:[0xBD,12],Equal:[0xBB,13],Backspace:[0x08,14],Tab:[0x09,15],BracketLeft:[0xDB,26],BracketRight:[0xDD,27],Backslash:[0xDC,43],CapsLock:[0x14,58],
    Semicolon:[0xBA,39],Quote:[0xDE,40],Enter:[0x0D,28],ShiftLeft:[0xA0,42],ShiftRight:[0xA1,54],Comma:[0xBC,51],Period:[0xBE,52],Slash:[0xBF,53],
    ControlLeft:[0xA2,29],ControlRight:[0xA3,29,1],AltLeft:[0xA4,56],AltRight:[0xA5,56,1],Space:[0x20,57],Pause:[0x13,69],ScrollLock:[0x91,70],NumLock:[0x90,69,1],
    Insert:[0x2D,82,1],Delete:[0x2E,83,1],Home:[0x24,71,1],End:[0x23,79,1],PageUp:[0x21,73,1],PageDown:[0x22,81,1],ArrowUp:[0x26,72,1],ArrowDown:[0x28,80,1],ArrowLeft:[0x25,75,1],ArrowRight:[0x27,77,1],
    NumpadDivide:[0x6F,53,1],NumpadMultiply:[0x6A,55],NumpadSubtract:[0x6D,74],NumpadAdd:[0x6B,78],NumpadEnter:[0x0D,28,1],NumpadDecimal:[0x6E,83]};
  const letters = 'QWERTYUIOPASDFGHJKLZXCVBNM', scans = [16,17,18,19,20,21,22,23,24,25,30,31,32,33,34,35,36,37,38,44,45,46,47,48,49,50];
  for (let i = 0; i < 26; i++) keys['Key' + letters[i]] = [letters.charCodeAt(i), scans[i]];
  for (let d = 0; d <= 9; d++) { keys['Digit' + d] = [0x30 + d, d ? d + 1 : 11]; keys['Numpad' + d] = [0x60 + d, [82,79,80,81,75,76,77,71,72,73][d]]; }
  // WM_KEYDOWN carries the generic VK_SHIFT/VK_CONTROL/VK_MENU codes for modifier keys.
  const generic = {0xA0:0x10,0xA1:0x10,0xA2:0x11,0xA3:0x11,0xA4:0x12,0xA5:0x12};
  const key = (e, down) => {
    const k = keys[e.code];
    if (!k) return;
    e.preventDefault();
    const vk = generic[k[0]] ?? k[0];
    // The modifier's own state comes from its key event; the others from the event's flags.
    const m = mods(e);
    if (vk === 0x10) m.shift = down; else if (vk === 0x11) m.ctrl = down; else if (vk === 0x12) m.alt = down;
    // Single printable characters as Windows-1252 (the game's code page); 0 for keys without one.
    worker.postMessage({type: 'key', mods: m, vk, scan: k[1], down, extended: !!k[2], ch: down ? cp1252Byte(e.key) : 0});
  };
  listen(screen, 'keydown', e => key(e, true));
  listen(screen, 'keyup', e => key(e, false));
  // A hidden page is a minimized full-screen game (WM_ACTIVATEAPP). Losing focus alone only releases held
  // keys, so clicking another window doesn't stall a multiplayer match.
  listen(document, 'visibilitychange', () => { worker.postMessage({type: 'active', active: !document.hidden}); if (document.hidden) worker.postMessage({type: 'persist'}); });
  listen(window, 'pagehide', () => worker.postMessage({type: 'persist'}));
  listen(window, 'blur', () => worker.postMessage({type: 'release-keys'}));

  // ---- help: the converted EMPIRES.HLP in an overlay (WinHelp opened its own window over the game).
  const help = dialogs.help;
  let helpIndex = null;
  const loadHelp = () => helpIndex ??= fetch(dataDir + '/help/help.json').then(r => r.ok ? r.json() : null).catch(() => null);
  async function showHelp(command, key) {
    if (command === 2) { if (help.dialog.open) help.dialog.close(); return; }   // HELP_QUIT
    const index = await loadHelp();
    if (!index) { log('[aoe] Help is not available (run tools/prepare_native.py)', true); return; }
    const topic = key ? index.keywords[key.toLowerCase()] ?? index.keywords[Object.keys(index.keywords).find(k => k.startsWith(key.toLowerCase())) ?? ''] : null;
    help.frame.src = dataDir + '/help/' + (topic || index.contents);
    help.title.textContent = index.title || 'Help';
    if (!help.dialog.open) { release(); help.dialog.showModal(); }
  }
  listen(help.close, 'click', () => help.dialog.close());
  listen(help.dialog, 'close', () => { screen.focus(); capture(); });
  listen(dialogs.box.box, 'close', () => { screen.focus(); capture(); });
  // The help's GAME button (ActivateTribeGame) returns to the game.
  listen(window, 'message', event => { if (event.origin === location.origin && event.data === 'aoe-help-close' && help.dialog.open) help.dialog.close(); });

  return {
    worker, screen, toggleFullscreen,
    // Sends the page's space for the game again (the page showed or resized the stage without a resize event).
    fit: sendAspect,
    // Starts WinMain; call from a user gesture (sound). room: the lobby's room (native-room.mjs), if any.
    go(room) {
      if (started || destroyed) return;
      started = true;
      unlockMedia(media, text => log('[aoe] ' + text, true));
      worker.postMessage({type: 'go', room});
      screen.focus();
      capture();
    },
    // Ends this run of the game: the worker (its DirectPlay connection closes, so it leaves its room), its
    // canvas and listeners. The media host stays for the next game.
    destroy() {
      if (destroyed) return;
      destroyed = true;
      off.abort();
      clearTimeout(aspectTimer);
      release();
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      if (help.dialog.open) help.dialog.close();
      if (dialogs.box.box.open) dialogs.box.box.close();
      worker.terminate();
      media.reset();
      screen.remove();
      cursorMark.remove();
    },
    debug: () => worker.postMessage({type: 'debug'}),
  };
}
