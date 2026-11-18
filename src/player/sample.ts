function midiToHz(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const write = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i] ?? 0));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }
  return new Blob([buffer], { type: "audio/wav" });
}

/** A short original piece so the player can be tried before any files are added. */
export function makeFirstLight(): Blob {
  const sampleRate = 22050;
  const seconds = 18;
  const length = sampleRate * seconds;
  const data = new Float32Array(length);
  const beat = 60 / 72;
  const chords = [
    [50, 57, 62, 65],
    [46, 53, 58, 65],
    [45, 52, 57, 60],
    [43, 50, 55, 62],
  ];
  const melody = [74, 77, 74, 72, 69, 72, 74, 77, 81, 77, 74, 72, 69, 67, 69, 72];

  for (let i = 0; i < length; i += 1) {
    const time = i / sampleRate;
    const chordIndex = Math.floor(time / (beat * 4)) % chords.length;
    const chordTime = time % (beat * 4);
    const beatIndex = Math.floor(time / beat);
    const beatTime = time % beat;
    let sample = 0;
    const pad = Math.min(1, chordTime * 8) * Math.exp(-chordTime * 0.22);
    const chord = chords[chordIndex] ?? chords[0];
    for (let voice = 0; voice < chord.length; voice += 1) {
      const frequency = midiToHz(chord[voice] ?? 50);
      sample += Math.sin(2 * Math.PI * frequency * time) * pad * 0.075;
    }
    const note = melody[beatIndex % melody.length] ?? 74;
    const frequency = midiToHz(note);
    const pluck = Math.min(1, beatTime * 50) * Math.exp(-beatTime * 4.2);
    sample += Math.sin(2 * Math.PI * frequency * time) * pluck * 0.2;
    sample += Math.sin(2 * Math.PI * frequency * 2 * time) * pluck * 0.035;
    const fade = Math.min(1, i / (sampleRate * 0.04), (length - i) / (sampleRate * 0.45));
    data[i] = Math.max(-1, Math.min(1, sample * fade));
  }

  return encodeWav(data, sampleRate);
}
