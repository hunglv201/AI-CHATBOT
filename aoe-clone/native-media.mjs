// Browser side of the game's multimedia (engine/platform/win32_media.cpp).
//
// In the worker, attachMedia() gives the game a Module.aoeMedia that forwards every call to the page, because
// Web Audio and <video> only exist there. Timing (is a sound still playing, when does a MIDI file end, is the
// video over) stays in the game; the page only renders. On the page, MediaHost plays the calls:
//   - DirectSound buffers: the game's 8/16-bit PCM, with DirectSound volume (1/100 dB), pan and frequency.
//   - Mixer lines: 1 = wave (sound effects), 2 = synthesizer (music); gains 0..1 from the game's sliders.
//   - MIDI: handed to a General MIDI synth once loaded (setSynth, web/native-midi.mjs); silent otherwise.
//   - Intro videos: the game's AVIs converted by tools/prepare_native.py, shown over the canvas.

// ---------------------------------------------------------------- worker side
export function attachMedia(Module, post, videos = {}) {
  let video = null;
  const name = path => path.replace(/\\/g, '/').split('/').pop().replace(/\.[^.]*$/, '').toLowerCase();
  Module.aoeMedia = {
    hasVideos: () => Object.keys(videos).length > 0,
    soundData: (id, data, rate, channels, bits) => post({op: 'soundData', id, data, rate, channels, bits}, [data.buffer]),
    soundDuplicate: (id, source) => post({op: 'soundDuplicate', id, source}),
    soundPlay: (id, loop, volume, pan, frequency) => post({op: 'soundPlay', id, loop, volume, pan, frequency}),
    soundUpdate: (id, volume, pan, frequency) => post({op: 'soundUpdate', id, volume, pan, frequency}),
    soundStop: id => post({op: 'soundStop', id}),
    soundRelease: id => post({op: 'soundRelease', id}),
    volume: (line, gain) => post({op: 'volume', line, gain}),
    midiPlay: (id, data, from) => post({op: 'midiPlay', id, data, from}, [data.buffer]),
    midiStop: id => post({op: 'midiStop', id}),
    videoOpen: path => { video = videos[name(path)] || null; return video ? video.width << 16 | video.height : 0; },
    videoPlay: (x, y, w, h, screenW, screenH) => video && post({op: 'videoPlay', url: video.url, x, y, w, h, screenW, screenH}),
    videoPause: paused => post({op: 'videoPause', paused}),
    videoClose: () => post({op: 'videoClose'}),
  };
  return Module.aoeMedia;
}

// ---------------------------------------------------------------- page side
const LINE_WAVE = 1, LINE_SYNTH = 2;
const gainOf = volume => Math.pow(10, Math.max(-10000, Math.min(0, volume)) / 2000);
// DirectSound pan attenuates the opposite side by |pan| / 100 dB; StereoPanner takes -1..1.
const panOf = pan => Math.sign(pan) * (1 - Math.pow(10, -Math.min(10000, Math.abs(pan)) / 2000));

export class MediaHost {
  constructor(stage, onVideoEnded) {
    this.stage = stage;
    this.onVideoEnded = onVideoEnded;
    this.context = null;
    this.buffers = new Map();     // sound id -> {pcm, rate, channels, bits, audio (AudioBuffer, made on first play)}
    this.voices = new Map();      // sound id -> {source, gain, panner, rate}
    this.lineGain = {[LINE_WAVE]: 1, [LINE_SYNTH]: 1};
    this.synth = null;
    this.midi = null;             // {id, data, from} of the file the game is playing
    this.video = null;
  }

  // Browsers start audio only after a user gesture: call from one (the page's start click).
  unlock() {
    if (!this.context) {
      this.context = new AudioContext();
      this.waveBus = this.context.createGain();
      this.waveBus.gain.value = this.lineGain[LINE_WAVE];
      this.waveBus.connect(this.context.destination);
      this.musicBus = this.context.createGain();
      this.musicBus.gain.value = this.lineGain[LINE_SYNTH];
      this.musicBus.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') this.context.resume().catch(() => {});
  }

  // A General MIDI synth already connected to musicBus: {play(bytes, fromMs), stop()} (web/native-midi.mjs).
  setSynth(synth) {
    this.synth = synth;
    if (this.midi) synth.play(this.midi.data, this.midi.from + (performance.now() - this.midi.at));
  }

  handle(m) {
    const f = this[m.op];
    if (f) f.call(this, m);
  }

  // Stops everything the game started, for the next game on the same page (the lobby's next room). The
  // audio context and the synth stay.
  reset() {
    for (const id of [...this.voices.keys()]) this.soundStop({id});
    this.buffers.clear();
    this.midi = null;
    this.synth?.stop();
    this.videoClose();
  }

  // ---- DirectSound
  soundData({id, data, rate, channels, bits}) { this.buffers.set(id, {pcm: data, rate, channels, bits, audio: null}); }
  soundDuplicate({id, source}) { const b = this.buffers.get(source); if (b) this.buffers.set(id, b); }
  soundRelease({id}) { this.soundStop({id}); this.buffers.delete(id); }
  audioBuffer(b) {
    if (b.audio) return b.audio;
    const bytesPerSample = b.bits / 8, frames = Math.floor(b.pcm.length / (bytesPerSample * b.channels));
    if (!frames) return null;
    const audio = this.context.createBuffer(b.channels, frames, Math.max(3000, Math.min(384000, b.rate)));
    const view = new DataView(b.pcm.buffer, b.pcm.byteOffset, b.pcm.byteLength);
    for (let c = 0; c < b.channels; c++) {
      const out = audio.getChannelData(c);
      for (let i = 0; i < frames; i++) {
        const at = (i * b.channels + c) * bytesPerSample;
        out[i] = b.bits === 8 ? (view.getUint8(at) - 128) / 128 : view.getInt16(at, true) / 32768;
      }
    }
    return (b.audio = audio);
  }
  soundPlay({id, loop, volume, pan, frequency}) {
    if (!this.context || this.context.state !== 'running') return;
    const b = this.buffers.get(id), audio = b && this.audioBuffer(b);
    if (!audio) return;
    this.soundStop({id});
    const source = this.context.createBufferSource(), gain = this.context.createGain(), panner = this.context.createStereoPanner();
    source.buffer = audio;
    source.loop = loop;
    source.connect(gain).connect(panner).connect(this.waveBus);
    const voice = {source, gain, panner, rate: audio.sampleRate};
    this.voices.set(id, voice);
    this.setVoice(voice, volume, pan, frequency);
    source.onended = () => { if (this.voices.get(id) === voice) this.voices.delete(id); };
    source.start();
  }
  setVoice(v, volume, pan, frequency) {
    v.gain.gain.value = gainOf(volume);
    v.panner.pan.value = panOf(pan);
    v.source.playbackRate.value = frequency > 0 ? frequency / v.rate : 1;
  }
  soundUpdate({id, volume, pan, frequency}) { const v = this.voices.get(id); if (v) this.setVoice(v, volume, pan, frequency); }
  soundStop({id}) {
    const v = this.voices.get(id);
    if (!v) return;
    this.voices.delete(id);
    try { v.source.stop(); } catch {}
  }

  // ---- mixer
  volume({line, gain}) {
    this.lineGain[line] = gain;
    const bus = line === LINE_WAVE ? this.waveBus : line === LINE_SYNTH ? this.musicBus : null;
    if (bus) bus.gain.value = gain;
  }

  // ---- MIDI
  midiPlay({id, data, from}) { this.midi = {id, data, from, at: performance.now()}; this.synth?.play(data, from); }
  midiStop({id}) { if (this.midi?.id === id) { this.midi = null; this.synth?.stop(); } }

  // ---- video
  videoPlay({url, x, y, w, h, screenW, screenH}) {
    this.videoClose();
    const v = document.createElement('video');
    v.src = url;
    v.playsInline = true;
    v.className = 'game-video';
    Object.assign(v.style, {left: `${100 * x / screenW}%`, top: `${100 * y / screenH}%`, width: `${100 * w / screenW}%`, height: `${100 * h / screenH}%`});
    const done = () => { if (this.video === v) { this.videoClose(); this.onVideoEnded(); } };
    v.onended = done;
    v.onerror = done;
    this.stage.append(v);
    this.video = v;
    // Without a user gesture yet, the browser only allows muted playback.
    v.play().catch(() => { v.muted = true; return v.play(); }).catch(done);
  }
  videoPause({paused}) { if (this.video) paused ? this.video.pause() : this.video.play().catch(() => {}); }
  videoClose() {
    const v = this.video;
    this.video = null;
    if (v) { v.onended = v.onerror = null; v.pause(); v.removeAttribute('src'); v.load(); v.remove(); }
  }
}
