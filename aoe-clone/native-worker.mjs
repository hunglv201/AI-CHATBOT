// Runs the real WinMain build (engine/game.wasm) in a Web Worker. The page sends input events and an
// OffscreenCanvas; the game's DirectDraw primary surface is converted to RGBA when presented.
import createGame from './engine/game.mjs';
import {canvasFonts} from './aoe-fonts.mjs';
import {openStorage, loadFiles, FileSaver} from './native-storage.mjs';
import {attachDirectPlay} from './native-dplay.mjs';
import {attachMedia} from './native-media.mjs';
import {setRoom} from './native-room.mjs';

const json = async url => { const r = await fetch(url); if (!r.ok) throw new Error('Cannot load ' + url); return r.json(); };
const bytes = async url => { const r = await fetch(url); if (!r.ok) throw new Error('Cannot load ' + url); return new Uint8Array(await r.arrayBuffer()); };
const send = (type, data = {}) => postMessage({type, ...data});
// The prepared game folder under web/ (tools/prepare_native.py --out); the page passes ?data=<name>.
let dataDir = 'game';
let ended = false, game = null, canvas = null, ctx = null, image = null, saver = null;
let aspect = [0, 0];
// The page's start click (a user gesture lets the browser play sound from the first intro frame), with the
// lobby's room if there is one (index.html; native-room.mjs).
let go;
const started = new Promise(resolve => { go = resolve; });
const end = (kind, data) => { if (!ended) { ended = true; send('end', {kind, ...data}); } };

function present(bits, width, height, pitch, palette) {
  if (!ctx) return;
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; send('size', {width, height}); }
  if (!image || image.width !== width || image.height !== height) image = ctx.createImageData(width, height);
  const heap = game.HEAPU8, out = new Uint32Array(image.data.buffer), colors = new Uint32Array(256);
  for (let i = 0; i < 256; i++) colors[i] = 0xff000000 | heap[palette + i * 4 + 2] << 16 | heap[palette + i * 4 + 1] << 8 | heap[palette + i * 4];
  for (let y = 0; y < height; y++) {
    const row = bits + y * pitch, o = y * width;
    for (let x = 0; x < width; x++) out[o + x] = colors[heap[row + x]];
  }
  ctx.putImageData(image, 0, 0);
}

async function start(commandLine) {
  const native = await json(dataDir + '/native.json');
  // key (+ count): the status for pages that show it in their own words (lobby-i18n.mjs).
  send('status', {text: `Loading ${native.files.length} game files…`, key: 'loading', count: native.files.length});
  const db = await openStorage();
  const [wasmBinary, stored, ...contents] = await Promise.all([bytes('engine/game.wasm'), loadFiles(db), ...native.files.map(f => bytes(f.url))]);
  send('status', {text: 'Starting WinMain…', key: 'starting'});
  game = await createGame({
    wasmBinary,
    noInitialRun: true,
    aoeFonts: canvasFonts(),
    aoePresent: present,
    onMessageBox: (title, text) => send('messagebox', {title, text}),
    aoeCursor: css => send('cursor', {css}),
    aoeHelp: (file, command, key) => send('help', {file, command, key}),
    print: line => send('log', {line}),
    printErr: line => send('log', {line, error: true}),
    preRun: [m => {
      for (const dir of native.directories) m.FS.mkdirTree('/' + dir);
      native.files.forEach((f, i) => m.FS.writeFile('/' + f.path.toLowerCase(), contents[i]));
      // Files the game wrote in earlier sessions (profiles, saves, registry) replace the originals.
      for (const [path, data] of stored) { m.FS.mkdirTree(path.slice(0, path.lastIndexOf('/')) || '/'); m.FS.writeFile(path, data); }
    }],
    onGameExit: code => end('exit', {code}),
    onExit: code => end('exit', {code}),
    onAbort: reason => end('abort', {reason: String(reason)}),
  });
  game._aoe_set_display_aspect(...aspect);
  // DirectPlay "Browser" connection type: the relay served by the Go server (server/).
  attachDirectPlay(game, `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/dplay`);
  // Sound, music and intro videos play on the page (web/native-media.mjs).
  attachMedia(game, (m, transfer) => postMessage({type: 'media', m}, transfer || []), native.videos || {});
  saver = new FileSaver(db, game.FS);
  setInterval(() => saver.save().catch(() => {}), 3000);
  send('ready');
  const room = await started;
  if (room) {
    try { setRoom(game, room, (event, code) => send('room', {event, code})); }
    catch (error) { send('room', {event: 'failed', code: 0, reason: String(error?.message || error)}); return; }
  }
  send('status', db ? {text: 'Running', key: 'running'} : {text: 'Running (browser storage unavailable: profiles and saves are not kept)', key: 'runningNoStorage'});
  try { game.callMain(commandLine.split(/\s+/).filter(Boolean)); } catch (error) { if (!/unwind/i.test(String(error))) end('abort', {reason: String(error)}); }
}

// Runtime errors after an Asyncify resume surface as uncaught errors in the worker; report them.
self.addEventListener('error', event => end('abort', {reason: String(event.message || event.error)}));
self.addEventListener('unhandledrejection', event => end('abort', {reason: String(event.reason?.message || event.reason)}));

self.onmessage = ({data}) => {
  if (data.type === 'start') {
    if (/^[a-z0-9][a-z0-9-]{0,40}$/.test(data.dataDir || '')) dataDir = data.dataDir;
    canvas = data.canvas;
    ctx = canvas.getContext('2d', {alpha: false});
    start(data.commandLine).catch(error => end('abort', {reason: String(error && error.message || error)}));
  } else if (data.type === 'go') go(data.room || null);
  // Widescreen: the shape of the page's space for the game (0 width: always 4:3). Kept until the game exists.
  else if (data.type === 'aspect') { aspect = [data.width | 0, data.height | 0]; game?._aoe_set_display_aspect(...aspect); }
  else if (game && !ended) {
    // Modifier flags correct only changes the page never saw: after a key's own message (so a Shift press is
    // queued as WM_KEYDOWN, not applied at once), before a mouse message (whose wParam carries them).
    const modifiers = () => data.mods && game._aoe_input_modifiers(+data.mods.shift, +data.mods.ctrl, +data.mods.alt, +data.mods.caps);
    if (data.type === 'mouse') { modifiers(); game._aoe_input_mouse(data.kind, data.button, data.x, data.y, data.time - performance.timeOrigin); }
    else if (data.type === 'key') { game._aoe_input_key(data.vk, data.scan, data.down ? 1 : 0, data.extended ? 1 : 0, data.ch | 0); modifiers(); }
    else if (data.type === 'active') game._aoe_set_page_active(data.active ? 1 : 0);
    else if (data.type === 'release-keys') game._aoe_input_reset();
    else if (data.type === 'video-ended') game._aoe_media_video_ended();
    else if (data.type === 'persist') saver?.save().catch(() => {});
    else if (data.type === 'debug') { game._aoe_debug_windows(); send('log', {line: `[aoe] frames presented: ${game._aoe_frames_presented()}; mode ${game._aoe_test_state(0)}, world time ${game._aoe_test_state(1)}, turn ${game._aoe_test_state(2)}, out of sync ${game._aoe_test_state(3)}`}); }
  }
};
