// Stand-in for the "fflate" package imported by spessasynth_core (web/vendor). Its inflateSync is only used
// for compressed sound banks and MIDI containers; the game's plain .MID files and the .sf2 soundfont never
// reach it.
export function inflateSync() { throw new Error('Compressed data is not supported in this build (fflate not bundled)'); }
