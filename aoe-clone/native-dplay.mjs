// WebSocket transport for the game's DirectPlay service provider (engine/platform/win32_dplay.cpp).
// Frames are opaque bytes in both directions; the relay is server/relay (Go). The socket opens on
// first use, and frames sent before it opens are queued.
export function attachDirectPlay(Module, url, Socket = globalThis.WebSocket) {
  let socket = null, open = false, closed = false;
  const queue = [];
  const deliver = bytes => {
    const ptr = Module._malloc(bytes.length);
    Module.HEAPU8.set(bytes, ptr);
    try { Module._aoe_dp_incoming(ptr, bytes.length); } finally { Module._free(ptr); }
  };
  const connect = () => {
    socket = new Socket(url);
    socket.binaryType = 'arraybuffer';
    socket.onopen = () => { open = true; for (const frame of queue.splice(0)) socket.send(frame); };
    socket.onmessage = event => { if (event.data instanceof ArrayBuffer) deliver(new Uint8Array(event.data)); };
    socket.onclose = socket.onerror = () => {
      if (closed) return;
      closed = true; open = false;
      Module._aoe_dp_disconnected();
    };
  };
  Module.aoeDirectPlay = {
    send(frame) {
      // A closed socket means the session is gone (the game was told via DPSYS_SESSIONLOST); later traffic
      // starts a new connection, as a new DirectPlay object would.
      if (!socket || closed) { socket = null; closed = false; open = false; queue.length = 0; connect(); }
      if (!open) { queue.push(frame); return; }
      try { socket.send(frame); } catch { socket.onclose?.(); }
    },
    close() { closed = true; socket?.close(); },
  };
  return Module.aoeDirectPlay;
}
