// General MIDI playback for the game's music (MCI sequencer in engine/platform/win32_media.cpp): SpessaSynth
// (Apache-2.0) with the GeneralUser GS soundfont, both installed in web/vendor by tools/fetch_vendor.py.
// The game decides what plays and when (its MCI notifications), so the sequencer never loops on its own.
const VENDOR = new URL('./vendor/', import.meta.url);

export async function createMidiSynth(context, destination) {
  const {WorkletSynthesizer, Sequencer} = await import(new URL('spessasynth_lib/index.js', VENDOR).href);
  const [, bank] = await Promise.all([
    context.audioWorklet.addModule(new URL('spessasynth_lib/spessasynth_processor.min.js', VENDOR).href),
    fetch(new URL('soundfont/GeneralUser-GS.sf2', VENDOR)).then(r => { if (!r.ok) throw new Error('soundfont ' + r.status); return r.arrayBuffer(); }),
  ]);
  const synth = new WorkletSynthesizer(context);
  synth.connect(destination);
  await synth.soundBankManager.addSoundBank(bank, 'main');
  await synth.isReady;
  // MCI positions are exact: don't skip the silence before the first note.
  const sequencer = new Sequencer(synth, {skipToFirstNoteOn: false});
  sequencer.loopCount = 0;
  return {
    play(bytes, fromMs) {
      const binary = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      sequencer.loadNewSongList([{binary, fileName: 'music.mid'}]);
      sequencer.loopCount = 0;
      if (fromMs > 0) sequencer.currentTime = fromMs / 1000;
      sequencer.play();
    },
    stop() { sequencer.pause(); synth.stopAll(true); },
    // Diagnostics: playback position in seconds and whether the sequencer is running.
    get state() { return {time: sequencer.currentTime, paused: sequencer.paused}; },
  };
}
