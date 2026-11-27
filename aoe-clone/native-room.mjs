// Room launch: hands the web lobby's room to the game before WinMain runs (engine/platform/room_launch.cpp).
// The game then goes from its main menu straight to the room's game setup screen, creating the room
// ({create: true, room, password}) or joining it ({id, password}), and reports through onEvent(event, code):
// 'setup' (in the room), 'failed' (code: the DirectPlay result, 0 if none) or 'left' (back on a menu).
import {encodeCP1252} from './cp1252.mjs';

// DirectPlay results the relay answers a join with (server/relay/protocol.go).
export const ROOM_ERRORS = {
  [0x88770154 | 0]: 'wrong-password',
  [0x8877014a | 0]: 'closed',
  [0x887700dc | 0]: 'gone',
};

export function setRoom(Module, {create = false, player, room = '', password = '', id = ''}, onEvent) {
  const strings = [player, room, password, id].map(text => encodeCP1252(text));
  if (strings.some(bytes => !bytes)) throw new Error('Room names and passwords must be Windows-1252 text');
  const pointers = strings.map(bytes => {
    const ptr = Module._malloc(bytes.length + 1);
    Module.HEAPU8.set(bytes, ptr);
    Module.HEAPU8[ptr + bytes.length] = 0;
    return ptr;
  });
  Module.aoeRoom = (event, code) => onEvent?.(event, code);
  try {
    if (!Module._aoe_room_set(create ? 1 : 0, ...pointers)) throw new Error('The game did not accept the room');
  } finally {
    for (const ptr of pointers) Module._free(ptr);
  }
}
