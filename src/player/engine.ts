const BANDS: Array<{ type: BiquadFilterType; freq: number; q?: number }> = [
  { type: "lowshelf", freq: 80 },
  { type: "peaking", freq: 250, q: 0.9 },
  { type: "peaking", freq: 1000, q: 0.9 },
  { type: "peaking", freq: 4000, q: 0.9 },
  { type: "highshelf", freq: 12000 },
];

export type EngineSnapshot = {
  playing: boolean;
  currentTime: number;
  duration: number;
  error: string | null;
  hasSource: boolean;
};

type Listener = (snapshot: EngineSnapshot) => void;

function finite(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

class Engine {
  private audio: HTMLAudioElement | null = null;
  private ctx: AudioContext | null = null;
  private gain: GainNode | null = null;
  private filters: BiquadFilterNode[] = [];
  private mediaNode: MediaElementAudioSourceNode | null = null;
  private bufferNode: AudioBufferSourceNode | null = null;
  private buffer: AudioBuffer | null = null;
  private blob: Blob | null = null;
  private url: string | null = null;
  private mode: "idle" | "element" | "buffer" = "idle";
  private playing = false;
  private error: string | null = null;
  private token = 0;
  private bufferOffset = 0;
  private bufferStarted = 0;
  private rate = 1;
  private volume = 0.9;
  private eq = [0, 0, 0, 0, 0];
  private eqOn = false;
  private pendingSeek = 0;
  private decoding = false;
  private raf = 0;
  private lastEmit = 0;
  private listeners = new Set<Listener>();
  private onEnded: (() => void) | null = null;
  private graphReady = false;

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  setOnEnded(handler: () => void): void {
    this.onEnded = handler;
  }

  snapshot(): EngineSnapshot {
    return {
      playing: this.playing,
      currentTime: this.now(),
      duration: this.dur(),
      error: this.error,
      hasSource: this.mode !== "idle",
    };
  }

  isPlaying(): boolean {
    return this.playing;
  }

  setVolume(value: number): void {
    this.volume = Math.min(1, Math.max(0, value));
    if (this.graphReady && this.gain && this.ctx) {
      this.gain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.02);
      if (this.audio) this.audio.volume = 1;
    } else if (this.audio) {
      this.audio.volume = this.volume;
    }
  }

  setRate(value: number): void {
    this.rate = value;
    if (this.audio) this.audio.playbackRate = value;
    if (this.bufferNode) this.bufferNode.playbackRate.value = value;
  }

  setEq(values: number[], on: boolean): void {
    this.eq = values.slice(0, 5);
    this.eqOn = on;
    if (!this.graphReady || !this.ctx) return;
    this.filters.forEach((filter, index) => {
      const gain = on ? (this.eq[index] ?? 0) : 0;
      filter.gain.setTargetAtTime(gain, this.ctx!.currentTime, 0.02);
    });
  }

  async load(blob: Blob, autoplay: boolean, seek = 0): Promise<void> {
    const audio = this.element();
    const token = ++this.token;
    this.stopBuffer();
    this.mode = "element";
    this.buffer = null;
    this.error = null;
    this.playing = false;
    this.pendingSeek = seek;
    this.blob = blob;
    if (this.url) URL.revokeObjectURL(this.url);
    this.url = URL.createObjectURL(blob);
    audio.pause();
    audio.src = this.url;
    audio.playbackRate = this.rate;
    audio.load();
    if (seek > 0.4) {
      const apply = () => {
        if (token !== this.token) return;
        const duration = finite(audio.duration);
        audio.currentTime = duration ? Math.min(seek, Math.max(0, duration - 0.25)) : seek;
        audio.removeEventListener("loadedmetadata", apply);
      };
      audio.addEventListener("loadedmetadata", apply);
    }
    this.emit(true);
    if (autoplay) await this.play();
  }

  async play(): Promise<void> {
    if (this.mode === "idle") return;
    await this.resumeContext();
    if (this.mode === "buffer" && this.buffer) {
      this.startBuffer(this.bufferOffset);
      return;
    }
    const audio = this.element();
    await audio.play();
    this.playing = true;
    this.error = null;
    this.emit(true);
    this.kick();
  }

  pause(): void {
    if (this.mode === "buffer") {
      this.bufferOffset = this.now();
      this.stopBuffer();
    } else {
      this.audio?.pause();
    }
    this.playing = false;
    this.emit(true);
  }

  stop(): void {
    this.token += 1;
    this.stopBuffer();
    if (this.audio) {
      this.audio.pause();
      this.audio.removeAttribute("src");
      this.audio.load();
    }
    if (this.url) URL.revokeObjectURL(this.url);
    this.url = null;
    this.blob = null;
    this.buffer = null;
    this.mode = "idle";
    this.playing = false;
    this.error = null;
    this.emit(true);
  }

  seek(time: number): void {
    const duration = this.dur();
    const next = Math.max(0, duration ? Math.min(time, Math.max(0, duration - 0.05)) : time);
    if (this.mode === "buffer" && this.buffer) {
      this.bufferOffset = next;
      if (this.playing) this.startBuffer(next);
      else this.emit(true);
      return;
    }
    const audio = this.audio;
    if (!audio) return;
    try {
      audio.currentTime = next;
    } catch {
      this.pendingSeek = next;
    }
    this.emit(true);
  }

  private element(): HTMLAudioElement {
    if (this.audio) return this.audio;
    const audio = new Audio();
    audio.preload = "auto";
    audio.setAttribute("playsinline", "true");
    audio.volume = this.volume;
    audio.dataset.lantern = "engine";
    audio.style.display = "none";
    audio.addEventListener("ended", () => {
      if (this.mode !== "element") return;
      this.playing = false;
      this.emit(true);
      this.onEnded?.();
    });
    audio.addEventListener("error", () => {
      const code = audio.error?.code;
      if (code === MediaError.MEDIA_ERR_ABORTED) return;
      const token = this.token;
      if (this.mode !== "element" || !this.url) return;
      window.setTimeout(() => {
        if (token !== this.token || this.mode !== "element") return;
        void this.tryBuffer(token);
      }, 0);
    });
    audio.addEventListener("timeupdate", () => this.emit(false));
    audio.addEventListener("playing", () => {
      this.playing = true;
      this.emit(true);
    });
    audio.addEventListener("pause", () => {
      if (this.mode === "element" && this.playing) {
        this.playing = false;
        this.emit(true);
      }
    });
    document.body.appendChild(audio);
    this.audio = audio;
    return audio;
  }

  private async resumeContext(): Promise<void> {
    const ctx = this.ensureGraph();
    if (ctx && ctx.state === "suspended") await ctx.resume();
  }

  private ensureGraph(): AudioContext | null {
    if (this.graphReady) return this.ctx;
    const Ctx = window.AudioContext;
    if (!Ctx) return null;
    try {
      const ctx = new Ctx();
      const gain = ctx.createGain();
      gain.gain.value = this.volume;
      const filters = BANDS.map((band) => {
        const filter = ctx.createBiquadFilter();
        filter.type = band.type;
        filter.frequency.value = band.freq;
        if (band.q) filter.Q.value = band.q;
        filter.gain.value = this.eqOn ? (this.eq[BANDS.indexOf(band)] ?? 0) : 0;
        return filter;
      });
      let node: AudioNode = filters[0]!;
      for (let i = 1; i < filters.length; i += 1) {
        node.connect(filters[i]!);
        node = filters[i]!;
      }
      node.connect(gain);
      gain.connect(ctx.destination);
      const media = ctx.createMediaElementSource(this.element());
      media.connect(filters[0]!);
      this.element().volume = 1;
      this.ctx = ctx;
      this.gain = gain;
      this.filters = filters;
      this.mediaNode = media;
      this.graphReady = true;
      return ctx;
    } catch {
      this.graphReady = false;
      return null;
    }
  }

  private async tryBuffer(token: number): Promise<void> {
    if (this.decoding || !this.blob || token !== this.token) return;
    this.decoding = true;
    try {
      const ctx = this.ensureGraph();
      if (!ctx) throw new Error("no audio context");
      if (ctx.state === "suspended") await ctx.resume();
      const copy = await this.blob.arrayBuffer();
      if (token !== this.token) return;
      const decoded = await ctx.decodeAudioData(copy.slice(0));
      if (token !== this.token) return;
      this.buffer = decoded;
      this.mode = "buffer";
      this.error = null;
      const audio = this.element();
      audio.pause();
      this.bufferOffset = Math.min(this.pendingSeek, Math.max(0, decoded.duration - 0.05));
      this.startBuffer(this.bufferOffset);
    } catch {
      if (token !== this.token) return;
      this.playing = false;
      this.error = "This device can't decode that file.";
      this.emit(true);
    } finally {
      this.decoding = false;
    }
  }

  private startBuffer(offset: number): void {
    if (!this.ctx || !this.buffer || !this.filters[0]) return;
    this.stopBuffer();
    const source = this.ctx.createBufferSource();
    source.buffer = this.buffer;
    source.playbackRate.value = this.rate;
    source.connect(this.filters[0]);
    const startAt = Math.min(Math.max(0, offset), Math.max(0, this.buffer.duration - 0.01));
    source.onended = () => {
      if (this.bufferNode !== source) return;
      const reachedEnd = this.now() >= (this.buffer?.duration ?? 0) - 0.25;
      if (!this.playing || !reachedEnd) return;
      this.playing = false;
      this.bufferOffset = 0;
      this.bufferNode = null;
      this.emit(true);
      this.onEnded?.();
    };
    source.start(0, startAt);
    this.bufferNode = source;
    this.bufferOffset = startAt;
    this.bufferStarted = this.ctx.currentTime;
    this.playing = true;
    this.mode = "buffer";
    this.emit(true);
    this.kick();
  }

  private stopBuffer(): void {
    const node = this.bufferNode;
    this.bufferNode = null;
    if (!node) return;
    node.onended = null;
    try {
      node.stop();
    } catch {
      /* already stopped */
    }
    try {
      node.disconnect();
    } catch {
      /* already disconnected */
    }
  }

  private now(): number {
    if (this.mode === "buffer" && this.buffer) {
      if (!this.playing || !this.ctx) return this.bufferOffset;
      const elapsed = (this.ctx.currentTime - this.bufferStarted) * this.rate;
      return Math.min(this.buffer.duration, this.bufferOffset + Math.max(0, elapsed));
    }
    return this.audio?.currentTime ?? 0;
  }

  private dur(): number {
    if (this.mode === "buffer" && this.buffer) return finite(this.buffer.duration);
    return finite(this.audio?.duration ?? 0);
  }

  private kick(): void {
    if (this.raf) return;
    const loop = () => {
      this.emit(false);
      this.raf = this.playing ? requestAnimationFrame(loop) : 0;
    };
    this.raf = requestAnimationFrame(loop);
  }

  private emit(force: boolean): void {
    const stamp = performance.now();
    if (!force && stamp - this.lastEmit < 200) return;
    this.lastEmit = stamp;
    const snapshot = this.snapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}

export const engine = new Engine();
