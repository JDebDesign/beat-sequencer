// Web Audio API drum sound synthesizer
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playKick(time?: number) {
  const ctx = getAudioContext();
  const t = time ?? ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(30, t + 0.15);
  gain.gain.setValueAtTime(1, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.3);
}

export function playSnare(time?: number) {
  const ctx = getAudioContext();
  const t = time ?? ctx.currentTime;

  // Noise component
  const bufferSize = ctx.sampleRate * 0.15;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.6, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 1000;
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(t);
  noise.stop(t + 0.15);

  // Tone component
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(200, t);
  osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);
  oscGain.gain.setValueAtTime(0.5, t);
  oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  osc.connect(oscGain);
  oscGain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.1);
}

export function playOpenHihat(time?: number) {
  const ctx = getAudioContext();
  const t = time ?? ctx.currentTime;
  const bufferSize = ctx.sampleRate * 0.3;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.3, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 8000;
  filter.Q.value = 1;
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start(t);
  noise.stop(t + 0.3);
}

export function playClosedHihat(time?: number) {
  const ctx = getAudioContext();
  const t = time ?? ctx.currentTime;
  const bufferSize = ctx.sampleRate * 0.08;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.3, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 10000;
  filter.Q.value = 1;
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start(t);
  noise.stop(t + 0.08);
}

export function playClap(time?: number) {
  const ctx = getAudioContext();
  const t = time ?? ctx.currentTime;
  // Multiple short noise bursts
  for (let i = 0; i < 3; i++) {
    const offset = i * 0.01;
    const bufferSize = ctx.sampleRate * 0.02;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let j = 0; j < bufferSize; j++) {
      data[j] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, t + offset);
    gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.02);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 0.5;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(t + offset);
    noise.stop(t + offset + 0.02);
  }
  // Tail
  const tailSize = ctx.sampleRate * 0.15;
  const tailBuffer = ctx.createBuffer(1, tailSize, ctx.sampleRate);
  const tailData = tailBuffer.getChannelData(0);
  for (let i = 0; i < tailSize; i++) {
    tailData[i] = Math.random() * 2 - 1;
  }
  const tailNoise = ctx.createBufferSource();
  tailNoise.buffer = tailBuffer;
  const tailGain = ctx.createGain();
  tailGain.gain.setValueAtTime(0.4, t + 0.03);
  tailGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  const tailFilter = ctx.createBiquadFilter();
  tailFilter.type = 'bandpass';
  tailFilter.frequency.value = 2500;
  tailFilter.Q.value = 2;
  tailNoise.connect(tailFilter);
  tailFilter.connect(tailGain);
  tailGain.connect(ctx.destination);
  tailNoise.start(t + 0.03);
  tailNoise.stop(t + 0.15);
}

export const INSTRUMENTS = ['kick', 'snare', 'openHihat', 'closedHihat', 'clap'] as const;
export type InstrumentName = typeof INSTRUMENTS[number];

export const INSTRUMENT_LABELS: Record<InstrumentName, string> = {
  kick: 'Kick',
  snare: 'Snare',
  openHihat: 'Open Hi-hat',
  closedHihat: 'Closed Hi-hat',
  clap: 'Clap',
};

const playFunctions: Record<InstrumentName, (time?: number) => void> = {
  kick: playKick,
  snare: playSnare,
  openHihat: playOpenHihat,
  closedHihat: playClosedHihat,
  clap: playClap,
};

export function playInstrument(name: InstrumentName, time?: number) {
  playFunctions[name](time);
}

export function getAudioCtx() {
  return getAudioContext();
}
