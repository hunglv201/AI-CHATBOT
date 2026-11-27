// Stand-in for the "stb-vorbis" package imported by spessasynth_core (web/vendor). It decodes Ogg Vorbis
// samples of .sf3 soundfonts; this build uses an uncompressed .sf2 soundfont.
export const StbVorbis = {
  decode() { throw new Error('SF3 (Vorbis) soundfonts are not supported in this build (stb-vorbis not bundled)'); },
};
