import { i as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, o as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { _ as ListMusic, a as Trash2, b as Ellipsis, c as SkipForward, d as Search, f as Repeat, g as Pause, h as Play, l as SkipBack, m as Plus, n as VolumeX, o as Timer, p as Repeat1, r as Volume2, s as SlidersHorizontal, t as X, u as Shuffle, v as Heart, x as ChevronDown, y as FolderOpen } from "../_libs/lucide-react.mjs";
import { a as DialogOverlay, i as DialogDescription, n as DialogClose, o as DialogPortal, r as DialogContent, s as DialogTitle, t as Dialog } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as create } from "../_libs/zustand.mjs";
import { i as SliderTrack, n as SliderRange, r as SliderThumb, t as Slider } from "../_libs/@radix-ui/react-slider+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-pgnYC9Jh.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var DB_NAME = "lantern";
var DB_VERSION = 1;
var opening = null;
function openDb() {
	if (typeof indexedDB === "undefined") return Promise.reject(/* @__PURE__ */ new Error("This browser is blocking on-device storage."));
	if (!opening) opening = new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);
		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains("tracks")) db.createObjectStore("tracks", { keyPath: "id" });
			if (!db.objectStoreNames.contains("blobs")) db.createObjectStore("blobs");
			if (!db.objectStoreNames.contains("art")) db.createObjectStore("art");
			if (!db.objectStoreNames.contains("playlists")) db.createObjectStore("playlists", { keyPath: "id" });
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => {
			opening = null;
			reject(request.error ?? /* @__PURE__ */ new Error("Could not open the library."));
		};
	});
	return opening;
}
function done(tx) {
	return new Promise((resolve, reject) => {
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error ?? /* @__PURE__ */ new Error("Storage write failed."));
		tx.onabort = () => reject(tx.error ?? /* @__PURE__ */ new Error("Storage write aborted."));
	});
}
async function dbListTracks() {
	const tx = (await openDb()).transaction("tracks", "readonly");
	return (await new Promise((resolve, reject) => {
		const request = tx.objectStore("tracks").getAll();
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	})).sort((a, b) => b.addedAt - a.addedAt);
}
async function dbListPlaylists() {
	const tx = (await openDb()).transaction("playlists", "readonly");
	return (await new Promise((resolve, reject) => {
		const request = tx.objectStore("playlists").getAll();
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	})).sort((a, b) => a.createdAt - b.createdAt);
}
async function dbPutTrack(track, audio, art) {
	const tx = (await openDb()).transaction([
		"tracks",
		"blobs",
		"art"
	], "readwrite");
	tx.objectStore("tracks").put(track);
	tx.objectStore("blobs").put(audio, track.id);
	if (art) tx.objectStore("art").put(art, track.id);
	await done(tx);
}
async function dbPatchTrack(track) {
	const tx = (await openDb()).transaction("tracks", "readwrite");
	tx.objectStore("tracks").put(track);
	await done(tx);
}
async function dbGetBlob(id) {
	const tx = (await openDb()).transaction("blobs", "readonly");
	return new Promise((resolve, reject) => {
		const request = tx.objectStore("blobs").get(id);
		request.onsuccess = () => resolve(request.result ?? null);
		request.onerror = () => reject(request.error);
	});
}
async function dbListArt() {
	const store = (await openDb()).transaction("art", "readonly").objectStore("art");
	const [keys, values] = await Promise.all([new Promise((resolve, reject) => {
		const request = store.getAllKeys();
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	}), new Promise((resolve, reject) => {
		const request = store.getAll();
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	})]);
	return keys.map((key, index) => ({
		id: String(key),
		blob: values[index]
	})).filter((row) => row.blob instanceof Blob);
}
async function dbDeleteTrack(id) {
	const tx = (await openDb()).transaction([
		"tracks",
		"blobs",
		"art"
	], "readwrite");
	tx.objectStore("tracks").delete(id);
	tx.objectStore("blobs").delete(id);
	tx.objectStore("art").delete(id);
	await done(tx);
}
async function dbPutPlaylist(playlist) {
	const tx = (await openDb()).transaction("playlists", "readwrite");
	tx.objectStore("playlists").put(playlist);
	await done(tx);
}
async function dbDeletePlaylist(id) {
	const tx = (await openDb()).transaction("playlists", "readwrite");
	tx.objectStore("playlists").delete(id);
	await done(tx);
}
var BANDS = [
	{
		type: "lowshelf",
		freq: 80
	},
	{
		type: "peaking",
		freq: 250,
		q: .9
	},
	{
		type: "peaking",
		freq: 1e3,
		q: .9
	},
	{
		type: "peaking",
		freq: 4e3,
		q: .9
	},
	{
		type: "highshelf",
		freq: 12e3
	}
];
function finite(value) {
	return Number.isFinite(value) && value > 0 ? value : 0;
}
var Engine = class {
	audio = null;
	ctx = null;
	gain = null;
	filters = [];
	mediaNode = null;
	bufferNode = null;
	buffer = null;
	blob = null;
	url = null;
	mode = "idle";
	playing = false;
	error = null;
	token = 0;
	bufferOffset = 0;
	bufferStarted = 0;
	rate = 1;
	volume = .9;
	eq = [
		0,
		0,
		0,
		0,
		0
	];
	eqOn = false;
	pendingSeek = 0;
	decoding = false;
	raf = 0;
	lastEmit = 0;
	listeners = /* @__PURE__ */ new Set();
	onEnded = null;
	graphReady = false;
	subscribe(listener) {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}
	setOnEnded(handler) {
		this.onEnded = handler;
	}
	snapshot() {
		return {
			playing: this.playing,
			currentTime: this.now(),
			duration: this.dur(),
			error: this.error,
			hasSource: this.mode !== "idle"
		};
	}
	isPlaying() {
		return this.playing;
	}
	setVolume(value) {
		this.volume = Math.min(1, Math.max(0, value));
		if (this.graphReady && this.gain && this.ctx) {
			this.gain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, .02);
			if (this.audio) this.audio.volume = 1;
		} else if (this.audio) this.audio.volume = this.volume;
	}
	setRate(value) {
		this.rate = value;
		if (this.audio) this.audio.playbackRate = value;
		if (this.bufferNode) this.bufferNode.playbackRate.value = value;
	}
	setEq(values, on) {
		this.eq = values.slice(0, 5);
		this.eqOn = on;
		if (!this.graphReady || !this.ctx) return;
		this.filters.forEach((filter, index) => {
			const gain = on ? this.eq[index] ?? 0 : 0;
			filter.gain.setTargetAtTime(gain, this.ctx.currentTime, .02);
		});
	}
	async load(blob, autoplay, seek = 0) {
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
		if (seek > .4) {
			const apply = () => {
				if (token !== this.token) return;
				const duration = finite(audio.duration);
				audio.currentTime = duration ? Math.min(seek, Math.max(0, duration - .25)) : seek;
				audio.removeEventListener("loadedmetadata", apply);
			};
			audio.addEventListener("loadedmetadata", apply);
		}
		this.emit(true);
		if (autoplay) await this.play();
	}
	async play() {
		if (this.mode === "idle") return;
		await this.resumeContext();
		if (this.mode === "buffer" && this.buffer) {
			this.startBuffer(this.bufferOffset);
			return;
		}
		await this.element().play();
		this.playing = true;
		this.error = null;
		this.emit(true);
		this.kick();
	}
	pause() {
		if (this.mode === "buffer") {
			this.bufferOffset = this.now();
			this.stopBuffer();
		} else this.audio?.pause();
		this.playing = false;
		this.emit(true);
	}
	stop() {
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
	seek(time) {
		const duration = this.dur();
		const next = Math.max(0, duration ? Math.min(time, Math.max(0, duration - .05)) : time);
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
	element() {
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
			if (audio.error?.code === MediaError.MEDIA_ERR_ABORTED) return;
			const token = this.token;
			if (this.mode !== "element" || !this.url) return;
			window.setTimeout(() => {
				if (token !== this.token || this.mode !== "element") return;
				this.tryBuffer(token);
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
	async resumeContext() {
		const ctx = this.ensureGraph();
		if (ctx && ctx.state === "suspended") await ctx.resume();
	}
	ensureGraph() {
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
				filter.gain.value = this.eqOn ? this.eq[BANDS.indexOf(band)] ?? 0 : 0;
				return filter;
			});
			let node = filters[0];
			for (let i = 1; i < filters.length; i += 1) {
				node.connect(filters[i]);
				node = filters[i];
			}
			node.connect(gain);
			gain.connect(ctx.destination);
			const media = ctx.createMediaElementSource(this.element());
			media.connect(filters[0]);
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
	async tryBuffer(token) {
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
			this.element().pause();
			this.bufferOffset = Math.min(this.pendingSeek, Math.max(0, decoded.duration - .05));
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
	startBuffer(offset) {
		if (!this.ctx || !this.buffer || !this.filters[0]) return;
		this.stopBuffer();
		const source = this.ctx.createBufferSource();
		source.buffer = this.buffer;
		source.playbackRate.value = this.rate;
		source.connect(this.filters[0]);
		const startAt = Math.min(Math.max(0, offset), Math.max(0, this.buffer.duration - .01));
		source.onended = () => {
			if (this.bufferNode !== source) return;
			const reachedEnd = this.now() >= (this.buffer?.duration ?? 0) - .25;
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
	stopBuffer() {
		const node = this.bufferNode;
		this.bufferNode = null;
		if (!node) return;
		node.onended = null;
		try {
			node.stop();
		} catch {}
		try {
			node.disconnect();
		} catch {}
	}
	now() {
		if (this.mode === "buffer" && this.buffer) {
			if (!this.playing || !this.ctx) return this.bufferOffset;
			const elapsed = (this.ctx.currentTime - this.bufferStarted) * this.rate;
			return Math.min(this.buffer.duration, this.bufferOffset + Math.max(0, elapsed));
		}
		return this.audio?.currentTime ?? 0;
	}
	dur() {
		if (this.mode === "buffer" && this.buffer) return finite(this.buffer.duration);
		return finite(this.audio?.duration ?? 0);
	}
	kick() {
		if (this.raf) return;
		const loop = () => {
			this.emit(false);
			this.raf = this.playing ? requestAnimationFrame(loop) : 0;
		};
		this.raf = requestAnimationFrame(loop);
	}
	emit(force) {
		const stamp = performance.now();
		if (!force && stamp - this.lastEmit < 200) return;
		this.lastEmit = stamp;
		const snapshot = this.snapshot();
		this.listeners.forEach((listener) => listener(snapshot));
	}
};
var engine = new Engine();
var AUDIO_EXTENSIONS = [
	"mp3",
	"mp2",
	"mp1",
	"wav",
	"wave",
	"flac",
	"ogg",
	"oga",
	"opus",
	"spx",
	"m4a",
	"m4b",
	"m4p",
	"m4r",
	"aac",
	"mp4",
	"alac",
	"caf",
	"aiff",
	"aif",
	"aifc",
	"wma",
	"asf",
	"ape",
	"wv",
	"mpc",
	"tta",
	"tak",
	"dsf",
	"dff",
	"webm",
	"weba",
	"mkv",
	"mka",
	"amr",
	"3gp",
	"3g2",
	"ac3",
	"eac3",
	"dts",
	"mid",
	"midi",
	"kar",
	"ra",
	"ram",
	"au",
	"snd",
	"voc",
	"gsm",
	"m3a",
	"f4a",
	"f4b"
];
var SKIP_EXTENSIONS = /* @__PURE__ */ new Set([
	"jpg",
	"jpeg",
	"png",
	"gif",
	"webp",
	"bmp",
	"svg",
	"txt",
	"nfo",
	"cue",
	"m3u",
	"m3u8",
	"pls",
	"lrc",
	"db",
	"ini",
	"pdf",
	"zip",
	"rar",
	"7z",
	"exe",
	"dll",
	"json",
	"xml",
	"html",
	"css",
	"js",
	"log",
	"sfv",
	"md5",
	"part",
	"ds_store"
]);
var MIME_BY_EXT = {
	mp3: "audio/mpeg",
	mp2: "audio/mpeg",
	mp1: "audio/mpeg",
	wav: "audio/wav",
	wave: "audio/wav",
	flac: "audio/flac",
	ogg: "audio/ogg",
	oga: "audio/ogg",
	opus: "audio/ogg",
	spx: "audio/ogg",
	m4a: "audio/mp4",
	m4b: "audio/mp4",
	m4p: "audio/mp4",
	m4r: "audio/mp4",
	aac: "audio/aac",
	mp4: "audio/mp4",
	alac: "audio/mp4",
	caf: "audio/x-caf",
	aiff: "audio/aiff",
	aif: "audio/aiff",
	aifc: "audio/aiff",
	wma: "audio/x-ms-wma",
	asf: "audio/x-ms-wma",
	ape: "audio/ape",
	wv: "audio/wavpack",
	webm: "audio/webm",
	weba: "audio/webm",
	mkv: "video/webm",
	mka: "audio/webm",
	amr: "audio/amr",
	"3gp": "audio/3gpp",
	"3g2": "audio/3gpp2",
	mid: "audio/midi",
	midi: "audio/midi"
};
var AUDIO_EXT_SET = new Set(AUDIO_EXTENSIONS);
var FILE_ACCEPT = [
	"audio/*",
	"video/mp4",
	"video/webm",
	"video/3gpp",
	...AUDIO_EXTENSIONS.map((ext) => `.${ext}`)
].join(",");
function extensionOf(name) {
	const base = name.split(/[/\\]/).pop() ?? name;
	const dot = base.lastIndexOf(".");
	if (dot <= 0) return "";
	return base.slice(dot + 1).toLowerCase();
}
function stripExt(name) {
	const base = name.split(/[/\\]/).pop() ?? name;
	const dot = base.lastIndexOf(".");
	return dot > 0 ? base.slice(0, dot) : base;
}
function mimeFor(name, given) {
	if (given && given !== "application/octet-stream") return given;
	return MIME_BY_EXT[extensionOf(name)] ?? (given || "application/octet-stream");
}
function isAudioFile(file, allowUnknown) {
	if (file.size <= 0 || file.size > 1073741824) return false;
	const ext = extensionOf(file.name);
	if (ext === "ds_store" || file.name === ".DS_Store") return false;
	if (SKIP_EXTENSIONS.has(ext)) return false;
	if (file.type.startsWith("audio/")) return true;
	if (file.type.startsWith("video/")) return true;
	if (AUDIO_EXT_SET.has(ext)) return true;
	return allowUnknown;
}
function formatClock(seconds) {
	if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
	const total = Math.floor(seconds);
	const hours = Math.floor(total / 3600);
	const minutes = Math.floor(total % 3600 / 60);
	const remain = total % 60;
	if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${String(remain).padStart(2, "0")}`;
	return `${minutes}:${String(remain).padStart(2, "0")}`;
}
function formatBytes(bytes) {
	if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
	if (bytes < 1048576) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
	if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(bytes < 10485760 ? 1 : 0)} MB`;
	return `${(bytes / 1073741824).toFixed(2)} GB`;
}
function formatLabel(ext) {
	const value = ext.toLowerCase();
	if (value === "mp3" || value === "mp2" || value === "mp1") return "MP3";
	if (!value) return "AUDIO";
	return value.toUpperCase();
}
function emptyTags(name, mime) {
	return {
		title: stripExt(name) || "Untitled",
		artist: "",
		album: "",
		duration: 0,
		art: null,
		artMime: null,
		trackNo: null,
		discNo: null,
		mime
	};
}
async function readTags(file) {
	const mime = mimeFor(file.name, file.type);
	const fallback = emptyTags(file.name, mime);
	try {
		const { parseBlob } = await import("../_libs/music-metadata+[...].mjs").then((n) => n.t);
		const metadata = await parseBlob(file, { duration: true });
		const picture = metadata.common.picture?.[0];
		let art = null;
		let artMime = null;
		if (picture?.data?.byteLength) {
			const copy = new Uint8Array(picture.data.byteLength);
			copy.set(picture.data);
			artMime = picture.format || "image/jpeg";
			art = new Blob([copy], { type: artMime });
		}
		const trackNo = metadata.common.track?.no;
		const discNo = metadata.common.disk?.no;
		return {
			title: metadata.common.title?.trim() || fallback.title,
			artist: metadata.common.artist?.trim() || metadata.common.albumartist?.trim() || "",
			album: metadata.common.album?.trim() || "",
			duration: Number.isFinite(metadata.format.duration) ? metadata.format.duration ?? 0 : 0,
			art,
			artMime,
			trackNo: typeof trackNo === "number" ? trackNo : null,
			discNo: typeof discNo === "number" ? discNo : null,
			mime
		};
	} catch {
		return fallback;
	}
}
function midiToHz(note) {
	return 440 * Math.pow(2, (note - 69) / 12);
}
function encodeWav(samples, sampleRate) {
	const buffer = /* @__PURE__ */ new ArrayBuffer(44 + samples.length * 2);
	const view = new DataView(buffer);
	const write = (offset, value) => {
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
		view.setInt16(offset, sample < 0 ? sample * 32768 : sample * 32767, true);
		offset += 2;
	}
	return new Blob([buffer], { type: "audio/wav" });
}
/** A short original piece so the player can be tried before any files are added. */
function makeFirstLight() {
	const sampleRate = 22050;
	const length = sampleRate * 18;
	const data = new Float32Array(length);
	const beat = 60 / 72;
	const chords = [
		[
			50,
			57,
			62,
			65
		],
		[
			46,
			53,
			58,
			65
		],
		[
			45,
			52,
			57,
			60
		],
		[
			43,
			50,
			55,
			62
		]
	];
	const melody = [
		74,
		77,
		74,
		72,
		69,
		72,
		74,
		77,
		81,
		77,
		74,
		72,
		69,
		67,
		69,
		72
	];
	for (let i = 0; i < length; i += 1) {
		const time = i / sampleRate;
		const chordIndex = Math.floor(time / (beat * 4)) % chords.length;
		const chordTime = time % (beat * 4);
		const beatIndex = Math.floor(time / beat);
		const beatTime = time % beat;
		let sample = 0;
		const pad = Math.min(1, chordTime * 8) * Math.exp(-chordTime * .22);
		const chord = chords[chordIndex] ?? chords[0];
		for (let voice = 0; voice < chord.length; voice += 1) {
			const frequency = midiToHz(chord[voice] ?? 50);
			sample += Math.sin(2 * Math.PI * frequency * time) * pad * .075;
		}
		const frequency = midiToHz(melody[beatIndex % melody.length] ?? 74);
		const pluck = Math.min(1, beatTime * 50) * Math.exp(-beatTime * 4.2);
		sample += Math.sin(2 * Math.PI * frequency * time) * pluck * .2;
		sample += Math.sin(2 * Math.PI * frequency * 2 * time) * pluck * .035;
		const fade = Math.min(1, i / (sampleRate * .04), (length - i) / (sampleRate * .45));
		data[i] = Math.max(-1, Math.min(1, sample * fade));
	}
	return encodeWav(data, sampleRate);
}
var SETTINGS_KEY = "lantern-settings-v1";
var SEEDED_KEY = "lantern-seeded-v1";
var SAMPLE_DEDUPE = "builtin:first-light";
var FLAT = [
	0,
	0,
	0,
	0,
	0
];
function defaultSettings() {
	return {
		volume: .9,
		shuffle: false,
		repeat: "off",
		eqOn: false,
		eq: FLAT,
		rate: 1,
		lastTrackId: null,
		lastTime: 0
	};
}
function loadSettings() {
	const base = defaultSettings();
	try {
		const raw = localStorage.getItem(SETTINGS_KEY);
		if (!raw) return base;
		const parsed = JSON.parse(raw);
		const eq = Array.isArray(parsed.eq) && parsed.eq.length === 5 ? parsed.eq.map((n) => Number(n) || 0) : FLAT;
		return {
			...base,
			...parsed,
			eq,
			volume: typeof parsed.volume === "number" ? parsed.volume : base.volume,
			rate: typeof parsed.rate === "number" ? parsed.rate : base.rate,
			repeat: parsed.repeat === "all" || parsed.repeat === "one" ? parsed.repeat : "off"
		};
	} catch {
		return base;
	}
}
function isQuota(error) {
	return error instanceof DOMException && (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED");
}
function shuffleIds(ids) {
	const next = [...ids];
	for (let i = next.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		const swap = next[i];
		next[i] = next[j] ?? next[i];
		next[j] = swap ?? next[j];
	}
	return next;
}
var playToken = 0;
var bootOnce = null;
var durationSaved = /* @__PURE__ */ new Set();
var sessionReady = false;
function currentTrack(state) {
	const id = state.queue[state.index];
	return state.tracks.find((track) => track.id === id);
}
function persist() {
	const state = usePlayer.getState();
	const track = currentTrack(state);
	const settings = {
		volume: state.volume,
		shuffle: state.shuffle,
		repeat: state.repeat,
		eqOn: state.eqOn,
		eq: state.eq,
		rate: state.rate,
		lastTrackId: track?.id ?? state.resumeTrackId,
		lastTime: track ? state.currentTime : state.resumeTime
	};
	localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
function syncSession(snapshot) {
	if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
	const state = usePlayer.getState();
	const track = currentTrack(state);
	navigator.mediaSession.playbackState = snapshot.playing ? "playing" : "paused";
	const duration = snapshot.duration || track?.duration || 0;
	if (duration > 0) try {
		navigator.mediaSession.setPositionState({
			duration,
			playbackRate: state.rate,
			position: Math.min(duration, Math.max(0, snapshot.currentTime || 0))
		});
	} catch {}
}
function setSessionMeta(track) {
	if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
	const art = usePlayer.getState().artUrls[track.id];
	const artwork = art ? [{
		src: art,
		sizes: "512x512",
		type: track.artMime || "image/jpeg"
	}] : [];
	navigator.mediaSession.metadata = new MediaMetadata({
		title: track.title,
		artist: track.artist || "Lantern",
		album: track.album || "On this device",
		artwork
	});
}
function installSessionHandlers() {
	if (sessionReady || typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
	sessionReady = true;
	const bind = (action, run) => {
		try {
			navigator.mediaSession.setActionHandler(action, run);
		} catch {}
	};
	bind("play", () => void usePlayer.getState().toggle());
	bind("pause", () => engine.pause());
	bind("previoustrack", () => usePlayer.getState().prev());
	bind("nexttrack", () => usePlayer.getState().next());
	bind("seekbackward", (details) => engine.seek(engine.snapshot().currentTime - (details.seekOffset || 10)));
	bind("seekforward", (details) => engine.seek(engine.snapshot().currentTime + (details.seekOffset || 10)));
	bind("seekto", (details) => {
		if (typeof details.seekTime === "number") engine.seek(details.seekTime);
	});
}
async function rememberArt(tracks) {
	const art = await dbListArt();
	const urls = { ...usePlayer.getState().artUrls };
	for (const row of art) {
		if (!tracks.some((track) => track.id === row.id) || urls[row.id]) continue;
		urls[row.id] = URL.createObjectURL(row.blob);
	}
	usePlayer.setState({ artUrls: urls });
}
async function insertTrack(track, audio, art) {
	await dbPutTrack(track, audio, art);
	const artUrl = art ? URL.createObjectURL(art) : null;
	usePlayer.setState((state) => ({
		tracks: [track, ...state.tracks.filter((item) => item.id !== track.id)],
		artUrls: artUrl ? {
			...state.artUrls,
			[track.id]: artUrl
		} : state.artUrls
	}));
}
async function addSample() {
	if (usePlayer.getState().tracks.find((track) => track.dedupe === SAMPLE_DEDUPE)) return;
	const blob = makeFirstLight();
	await insertTrack({
		id: crypto.randomUUID(),
		dedupe: SAMPLE_DEDUPE,
		title: "First Light",
		artist: "Lantern",
		album: "Built-in",
		duration: 18,
		mime: "audio/wav",
		ext: "wav",
		size: blob.size,
		addedAt: Date.now(),
		favorite: false,
		hasArt: false,
		artMime: null,
		builtIn: true,
		trackNo: 1,
		discNo: 1
	}, blob, null);
}
function onSnapshot(snapshot) {
	const state = usePlayer.getState();
	const sameTime = Math.abs(state.currentTime - snapshot.currentTime) < .05;
	const sameDur = Math.abs((state.duration || 0) - (snapshot.duration || 0)) < .05;
	if (state.playing === snapshot.playing && state.decodeError === snapshot.error && sameTime && sameDur) {
		if (snapshot.playing) syncSession(snapshot);
		return;
	}
	usePlayer.setState({
		playing: snapshot.playing,
		currentTime: snapshot.currentTime,
		duration: snapshot.duration || state.duration,
		decodeError: snapshot.error
	});
	const track = currentTrack(usePlayer.getState());
	if (track && snapshot.duration && Math.abs(track.duration - snapshot.duration) > .75) {
		const key = `${track.id}:${Math.round(snapshot.duration)}`;
		if (!durationSaved.has(key)) {
			durationSaved.add(key);
			const updated = {
				...track,
				duration: snapshot.duration
			};
			dbPatchTrack(updated);
			usePlayer.setState({ tracks: usePlayer.getState().tracks.map((item) => item.id === track.id ? updated : item) });
		}
	}
	syncSession(snapshot);
}
var usePlayer = create((set, get) => ({
	booted: false,
	bootError: null,
	tracks: [],
	artUrls: {},
	playlists: [],
	query: "",
	tab: "songs",
	sort: "added",
	favoritesOnly: false,
	activePlaylistId: null,
	queue: [],
	index: 0,
	playing: false,
	currentTime: 0,
	duration: 0,
	volume: .9,
	shuffle: false,
	repeat: "off",
	eqOn: false,
	eq: FLAT,
	rate: 1,
	playerOpen: false,
	importing: null,
	decodeError: null,
	menuTrackId: null,
	addOpen: false,
	sleepEndsAt: null,
	resumeTrackId: null,
	resumeTime: 0,
	setQuery: (query) => set({ query }),
	setTab: (tab) => set({ tab }),
	setSort: (sort) => set({ sort }),
	setFavoritesOnly: (favoritesOnly) => set({ favoritesOnly }),
	setActivePlaylist: (activePlaylistId) => set({ activePlaylistId }),
	setPlayerOpen: (playerOpen) => set({ playerOpen }),
	setMenuTrackId: (menuTrackId) => set({ menuTrackId }),
	setAddOpen: (addOpen) => set({ addOpen }),
	setVolume: (volume) => {
		const next = Math.min(1, Math.max(0, volume));
		engine.setVolume(next);
		set({ volume: next });
		persist();
	},
	setRate: (rate) => {
		engine.setRate(rate);
		set({ rate });
		persist();
	},
	setEq: (eq, on) => {
		const eqOn = on ?? get().eqOn;
		engine.setEq(eq, eqOn);
		set({
			eq,
			eqOn
		});
		persist();
	},
	toggleEq: () => {
		const eqOn = !get().eqOn;
		engine.setEq(get().eq, eqOn);
		set({ eqOn });
		persist();
	},
	toggleShuffle: () => {
		const shuffle = !get().shuffle;
		const state = get();
		const current = state.queue[state.index];
		if (shuffle && current) set({
			shuffle,
			queue: [current, ...shuffleIds(state.queue.filter((id) => id !== current))],
			index: 0
		});
		else set({ shuffle });
		persist();
	},
	cycleRepeat: () => {
		const order = [
			"off",
			"all",
			"one"
		];
		set({ repeat: order[(order.indexOf(get().repeat) + 1) % order.length] ?? "off" });
		persist();
	},
	toggleFavorite: (id) => {
		const track = get().tracks.find((item) => item.id === id);
		if (!track) return;
		const updated = {
			...track,
			favorite: !track.favorite
		};
		set({ tracks: get().tracks.map((item) => item.id === id ? updated : item) });
		dbPatchTrack(updated);
	},
	toggle: async () => {
		if (engine.isPlaying()) {
			engine.pause();
			persist();
			return;
		}
		if (engine.snapshot().hasSource) {
			try {
				await engine.play();
			} catch {
				toast.error("Playback was blocked. Tap play again.");
			}
			return;
		}
		if (get().queue.length) await get().playIndex(get().index);
	},
	next: () => {
		const { index, queue, repeat } = get();
		if (index + 1 < queue.length) get().playIndex(index + 1);
		else if (repeat !== "off" && queue.length) get().playIndex(0);
	},
	prev: () => {
		if (engine.snapshot().currentTime > 3) {
			engine.seek(0);
			return;
		}
		const { index } = get();
		if (index > 0) get().playIndex(index - 1);
		else engine.seek(0);
	},
	playTracks: (tracks, id) => {
		const ids = tracks.map((track) => track.id);
		const picked = ids.indexOf(id);
		if (picked < 0) return;
		let queue = ids;
		let index = picked;
		if (get().shuffle) {
			queue = [id, ...shuffleIds(ids.filter((item) => item !== id))];
			index = 0;
		}
		set({
			queue,
			index,
			playerOpen: false,
			decodeError: null
		});
		get().playIndex(index);
	},
	queueNext: (id) => {
		const state = get();
		const current = state.queue[state.index];
		if (!current) {
			const track = state.tracks.find((item) => item.id === id);
			if (track) get().playTracks([track], id);
			return;
		}
		const without = state.queue.filter((item) => item !== id);
		const currentIndex = without.indexOf(current);
		if (currentIndex < 0) return;
		without.splice(currentIndex + 1, 0, id);
		set({
			queue: without,
			index: currentIndex,
			menuTrackId: null
		});
		toast("Playing next");
	},
	playIndex: async (index) => {
		const token = ++playToken;
		const id = get().queue[index];
		const track = get().tracks.find((item) => item.id === id);
		if (!track) return;
		const resume = id === get().resumeTrackId ? get().resumeTime : 0;
		set({
			index,
			decodeError: null,
			currentTime: resume > 1 ? resume : 0,
			duration: track.duration,
			resumeTrackId: null,
			resumeTime: 0
		});
		setSessionMeta(track);
		try {
			const blob = await dbGetBlob(id);
			if (token !== playToken) return;
			if (!blob) {
				toast.error("That song is missing from on-device storage.");
				return;
			}
			const typed = blob.type ? blob : new Blob([blob], { type: track.mime || "application/octet-stream" });
			await engine.load(typed, true, resume > 1 ? resume : 0);
			persist();
		} catch {
			if (token !== playToken) return;
			toast.error("Couldn't open that song.");
		}
	},
	importFiles: async (files, allowUnknown) => {
		const chosen = files.filter((file) => isAudioFile(file, allowUnknown));
		const tooBig = files.filter((file) => file.size > 1073741824).length;
		if (!chosen.length) {
			toast.error(tooBig ? "Those files are over 1 GB." : "No playable audio files in that selection.");
			return;
		}
		const known = new Set(get().tracks.map((track) => track.dedupe));
		set({
			importing: {
				done: 0,
				total: chosen.length
			},
			addOpen: false
		});
		let added = 0;
		let skipped = 0;
		let failed = 0;
		for (let i = 0; i < chosen.length; i += 1) {
			const file = chosen[i];
			const dedupe = `${file.size}:${file.name}`;
			if (known.has(dedupe)) skipped += 1;
			else try {
				const tags = await readTags(file);
				await insertTrack({
					id: crypto.randomUUID(),
					dedupe,
					title: tags.title,
					artist: tags.artist,
					album: tags.album,
					duration: tags.duration,
					mime: tags.mime || mimeFor(file.name, file.type),
					ext: extensionOf(file.name) || "audio",
					size: file.size,
					addedAt: Date.now(),
					favorite: false,
					hasArt: Boolean(tags.art),
					artMime: tags.artMime,
					builtIn: false,
					trackNo: tags.trackNo,
					discNo: tags.discNo
				}, file, tags.art);
				known.add(dedupe);
				added += 1;
			} catch (error) {
				failed += 1;
				if (isQuota(error)) {
					toast.error("This device is out of space for more songs.");
					break;
				}
			}
			set({ importing: {
				done: i + 1,
				total: chosen.length
			} });
			await new Promise((resolve) => setTimeout(resolve, 0));
		}
		set({ importing: null });
		if (added && !skipped && !failed) toast.success(added === 1 ? "Added 1 song" : `Added ${added} songs`);
		else if (added) toast.success(`Added ${added}. Skipped ${skipped + failed}.`);
		else if (skipped) toast("Already in your library");
		else toast.error("Couldn't save those files.");
	},
	removeTrack: async (id) => {
		const state = get();
		const wasCurrent = state.queue[state.index] === id;
		const removedAt = state.queue.indexOf(id);
		await dbDeleteTrack(id);
		const art = state.artUrls[id];
		if (art) URL.revokeObjectURL(art);
		const tracks = state.tracks.filter((track) => track.id !== id);
		const queue = state.queue.filter((item) => item !== id);
		let index = state.index;
		if (removedAt >= 0 && removedAt < index) index -= 1;
		if (index >= queue.length) index = Math.max(0, queue.length - 1);
		const playlists = state.playlists.map((playlist) => playlist.trackIds.includes(id) ? {
			...playlist,
			trackIds: playlist.trackIds.filter((item) => item !== id)
		} : playlist);
		await Promise.all(playlists.filter((playlist, i) => playlist !== state.playlists[i]).map((playlist) => dbPutPlaylist(playlist)));
		const artUrls = { ...state.artUrls };
		delete artUrls[id];
		set({
			tracks,
			queue,
			index,
			playlists,
			artUrls,
			menuTrackId: null
		});
		if (wasCurrent) {
			if (queue.length) await get().playIndex(index);
			else engine.stop();
		}
	},
	createPlaylist: async (name, trackId) => {
		const trimmed = name.trim();
		if (!trimmed) return;
		const playlist = {
			id: crypto.randomUUID(),
			name: trimmed,
			trackIds: trackId ? [trackId] : [],
			createdAt: Date.now()
		};
		await dbPutPlaylist(playlist);
		set({
			playlists: [...get().playlists, playlist],
			menuTrackId: trackId ? null : get().menuTrackId
		});
		toast.success(`Saved “${trimmed}”`);
	},
	addToPlaylist: async (playlistId, trackId) => {
		const playlist = get().playlists.find((item) => item.id === playlistId);
		if (!playlist || playlist.trackIds.includes(trackId)) {
			set({ menuTrackId: null });
			return;
		}
		const next = {
			...playlist,
			trackIds: [...playlist.trackIds, trackId]
		};
		await dbPutPlaylist(next);
		set({
			playlists: get().playlists.map((item) => item.id === playlistId ? next : item),
			menuTrackId: null
		});
		toast.success(`Added to ${next.name}`);
	},
	removeFromPlaylist: async (playlistId, trackId) => {
		const playlist = get().playlists.find((item) => item.id === playlistId);
		if (!playlist) return;
		const next = {
			...playlist,
			trackIds: playlist.trackIds.filter((id) => id !== trackId)
		};
		await dbPutPlaylist(next);
		set({
			playlists: get().playlists.map((item) => item.id === playlistId ? next : item),
			menuTrackId: null
		});
	},
	deletePlaylist: async (id) => {
		await dbDeletePlaylist(id);
		set({
			playlists: get().playlists.filter((playlist) => playlist.id !== id),
			activePlaylistId: get().activePlaylistId === id ? null : get().activePlaylistId
		});
	},
	setSleep: (minutes) => {
		if (!minutes) {
			set({ sleepEndsAt: null });
			return;
		}
		set({ sleepEndsAt: Date.now() + minutes * 60 * 1e3 });
		toast(`Sleep timer · ${minutes} min`);
	},
	restoreSample: async () => {
		await addSample();
	}
}));
engine.setOnEnded(() => {
	const state = usePlayer.getState();
	if (state.repeat === "one") {
		engine.seek(0);
		engine.play();
		return;
	}
	state.next();
});
function startPlayer() {
	if (!bootOnce) bootOnce = (async () => {
		try {
			installSessionHandlers();
			engine.subscribe(onSnapshot);
			const settings = loadSettings();
			engine.setVolume(settings.volume);
			engine.setRate(settings.rate);
			engine.setEq(settings.eq, settings.eqOn);
			const [tracks, playlists] = await Promise.all([dbListTracks(), dbListPlaylists()]);
			const resume = tracks.find((track) => track.id === settings.lastTrackId);
			usePlayer.setState({
				booted: true,
				tracks,
				playlists,
				volume: settings.volume,
				shuffle: settings.shuffle,
				repeat: settings.repeat,
				eqOn: settings.eqOn,
				eq: settings.eq,
				rate: settings.rate,
				queue: resume ? [resume.id] : [],
				index: 0,
				duration: resume?.duration ?? 0,
				resumeTrackId: resume?.id ?? null,
				resumeTime: settings.lastTime
			});
			if (!localStorage.getItem(SEEDED_KEY) && tracks.length === 0) {
				await addSample();
				localStorage.setItem(SEEDED_KEY, "1");
			} else if (!localStorage.getItem(SEEDED_KEY)) localStorage.setItem(SEEDED_KEY, "1");
			const ready = usePlayer.getState();
			if (!ready.queue.length && ready.tracks[0]) usePlayer.setState({
				queue: [ready.tracks[0].id],
				index: 0,
				duration: ready.tracks[0].duration
			});
			rememberArt(usePlayer.getState().tracks);
			if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => void 0);
			window.addEventListener("pagehide", persist);
		} catch (error) {
			usePlayer.setState({
				booted: true,
				bootError: error instanceof Error ? error.message : "Lantern couldn't open on-device storage."
			});
		}
	})();
	return bootOnce;
}
function cx(...parts) {
	return parts.filter(Boolean).join(" ");
}
function IconButton({ label, children, className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-label": label,
		className: cx("tap inline-flex size-11 shrink-0 items-center justify-center rounded-full text-fg hover:bg-surface-2", className),
		...props,
		children
	});
}
function PlayButton({ size = "lg" }) {
	const playing = usePlayer((state) => state.playing);
	const toggle = usePlayer((state) => state.toggle);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		"aria-label": playing ? "Pause" : "Play",
		onClick: (event) => {
			event.stopPropagation();
			toggle();
		},
		className: cx("tap relative inline-flex items-center justify-center rounded-full bg-primary text-primary-fg", size === "lg" ? "size-16" : "size-11"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: cx("icon-swap absolute", playing ? "icon-in" : "icon-out"),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, {
				className: size === "lg" ? "size-7" : "size-5",
				fill: "currentColor"
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: cx("icon-swap", playing ? "icon-out" : "icon-in"),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
				className: cx(size === "lg" ? "size-7" : "size-5", "translate-x-0.5"),
				fill: "currentColor"
			})
		})]
	});
}
function Cover({ id, title, shape = "disc", spinning = false, className }) {
	const art = usePlayer((state) => id ? state.artUrls[id] : void 0);
	const letter = (title.trim()[0] || "L").toUpperCase();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cx("relative shrink-0 overflow-hidden bg-surface-2", shape === "disc" ? "rounded-full" : "rounded-xl", spinning ? "disc-spin" : shape === "disc" ? "disc-spin is-paused" : "", className),
		children: [
			art ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: art,
				alt: "",
				className: "h-full w-full object-cover"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex h-full w-full items-center justify-center font-display text-2xl text-primary",
				children: letter
			}),
			shape === "disc" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "spindle pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-bg ring-2 ring-primary/50" }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "pointer-events-none absolute inset-0 ring-1 ring-line ring-inset" })
		]
	});
}
function Bars() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "bars",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {})
		]
	});
}
function MiniDock() {
	const trackId = usePlayer((state) => state.queue[state.index]);
	const track = usePlayer((state) => state.tracks.find((item) => item.id === trackId));
	const currentTime = usePlayer((state) => state.currentTime);
	const duration = usePlayer((state) => state.duration || track?.duration || 0);
	const setPlayerOpen = usePlayer((state) => state.setPlayerOpen);
	const next = usePlayer((state) => state.next);
	if (!track) return null;
	const pct = duration ? Math.min(100, currentTime / duration * 100) : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "safe-bottom border-t border-line bg-surface lg:hidden",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "h-0.5 bg-line",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-full bg-primary",
				style: { width: `${pct}%` }
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-1 px-2 py-1",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setPlayerOpen(true),
					className: "tap flex min-w-0 flex-1 items-center gap-3 px-1 text-left",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cover, {
						id: track.hasArt ? track.id : void 0,
						title: track.title,
						shape: "disc",
						className: "size-11"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block truncate font-medium",
							children: track.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block truncate text-sm text-muted",
							children: track.artist || formatLabel(track.ext)
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayButton, { size: "md" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
					label: "Next",
					onClick: next,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkipForward, {
						className: "size-5",
						fill: "currentColor"
					})
				})
			]
		})]
	});
}
var RATES = [
	.75,
	1,
	1.25,
	1.5,
	2
];
var SLEEPS = [
	15,
	30,
	45,
	60
];
var PRESETS = [
	{
		name: "Flat",
		eq: [
			0,
			0,
			0,
			0,
			0
		]
	},
	{
		name: "Warm",
		eq: [
			4,
			3,
			1,
			-1,
			-2
		]
	},
	{
		name: "Voice",
		eq: [
			-2,
			1,
			3,
			3,
			1
		]
	},
	{
		name: "Night",
		eq: [
			-3,
			-1,
			0,
			-2,
			-4
		]
	}
];
var BAND_LABELS = [
	"80",
	"250",
	"1k",
	"4k",
	"12k"
];
function useSleepLabel() {
	const ends = usePlayer((state) => state.sleepEndsAt);
	const [now, setNow] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		if (!ends) return;
		setNow(Date.now());
		const timer = window.setInterval(() => setNow(Date.now()), 1e3);
		return () => window.clearInterval(timer);
	}, [ends]);
	if (!ends || !now) return ends ? "On" : null;
	const remain = Math.max(0, ends - now);
	const minutes = Math.floor(remain / 6e4);
	const seconds = Math.floor(remain % 6e4 / 1e3);
	return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
function NowPlaying({ variant, onClose }) {
	const trackId = usePlayer((state) => state.queue[state.index]);
	const track = usePlayer((state) => state.tracks.find((item) => item.id === trackId));
	const playing = usePlayer((state) => state.playing);
	const currentTime = usePlayer((state) => state.currentTime);
	const duration = usePlayer((state) => state.duration || track?.duration || 0);
	const shuffle = usePlayer((state) => state.shuffle);
	const repeat = usePlayer((state) => state.repeat);
	const volume = usePlayer((state) => state.volume);
	const rate = usePlayer((state) => state.rate);
	const eq = usePlayer((state) => state.eq);
	const eqOn = usePlayer((state) => state.eqOn);
	const queue = usePlayer((state) => state.queue);
	const tracks = usePlayer((state) => state.tracks);
	const index = usePlayer((state) => state.index);
	const decodeError = usePlayer((state) => state.decodeError);
	const toggleShuffle = usePlayer((state) => state.toggleShuffle);
	const cycleRepeat = usePlayer((state) => state.cycleRepeat);
	const toggleFavorite = usePlayer((state) => state.toggleFavorite);
	const setVolume = usePlayer((state) => state.setVolume);
	const setRate = usePlayer((state) => state.setRate);
	const setEq = usePlayer((state) => state.setEq);
	const toggleEq = usePlayer((state) => state.toggleEq);
	const next = usePlayer((state) => state.next);
	const prev = usePlayer((state) => state.prev);
	const playIndex = usePlayer((state) => state.playIndex);
	const setSleep = usePlayer((state) => state.setSleep);
	const sleepLabel = useSleepLabel();
	const [drag, setDrag] = (0, import_react.useState)(null);
	const [panel, setPanel] = (0, import_react.useState)(null);
	const shown = drag ?? currentTime;
	const queued = queue.map((id, position) => ({
		track: tracks.find((item) => item.id === id),
		position
	})).filter((item) => Boolean(item.track));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: cx("flex h-full min-h-0 flex-col bg-bg text-fg", variant === "sheet" && "fixed inset-0 z-40 h-dvh"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "safe-top flex items-center justify-between px-2",
			children: [
				variant === "sheet" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
					label: "Close player",
					onClick: onClose,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-6" })
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-11" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-lg italic text-muted",
					children: "Listening"
				}),
				track ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
					label: track.favorite ? "Remove favorite" : "Favorite",
					onClick: () => toggleFavorite(track.id),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: cx("size-5", track.favorite && "fill-current text-primary") })
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-11" })
			]
		}), track ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative mx-auto mt-1 mb-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "lamp pointer-events-none absolute top-1/2 left-1/2 size-64 -translate-x-1/2 -translate-y-1/2" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cover, {
					id: track.id,
					title: track.title,
					shape: "disc",
					spinning: playing,
					className: "relative size-56 sm:size-64"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto w-full max-w-md",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "truncate font-display text-3xl leading-tight text-balance",
								children: track.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 truncate text-muted",
								children: [
									track.artist || "Unknown artist",
									track.album ? ` · ${track.album}` : "",
									" · ",
									formatLabel(track.ext)
								]
							})]
						}), playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bars, {}) : null]
					}),
					decodeError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-primary",
						children: decodeError
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Slider, {
							"aria-label": "Seek",
							disabled: !duration,
							className: "relative flex h-11 w-full touch-none items-center select-none",
							value: [Math.min(shown, duration || 0)],
							max: duration || 1,
							step: .1,
							onValueChange: ([value]) => setDrag(value ?? 0),
							onValueCommit: ([value]) => {
								engine.seek(value ?? 0);
								setDrag(null);
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderTrack, {
								className: "relative h-1 grow rounded-full bg-line",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRange, { className: "absolute h-full rounded-full bg-primary" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderThumb, { className: "block size-4 rounded-full bg-fg" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between text-sm text-muted tabular-nums",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatClock(shown) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatClock(duration) })]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex items-center justify-between",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
								label: shuffle ? "Shuffle on" : "Shuffle off",
								"aria-pressed": shuffle,
								onClick: toggleShuffle,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shuffle, { className: cx("size-5", shuffle && "text-primary") })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
								label: "Previous",
								onClick: prev,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkipBack, {
									className: "size-6",
									fill: "currentColor"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayButton, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
								label: "Next",
								onClick: next,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkipForward, {
									className: "size-6",
									fill: "currentColor"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
								label: repeat === "one" ? "Repeat one" : repeat === "all" ? "Repeat all" : "Repeat off",
								"aria-pressed": repeat !== "off",
								onClick: cycleRepeat,
								children: repeat === "one" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Repeat1, { className: "size-5 text-primary" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Repeat, { className: cx("size-5", repeat === "all" && "text-primary") })
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
							label: volume === 0 ? "Unmute" : "Mute",
							onClick: () => setVolume(volume === 0 ? .9 : 0),
							children: volume === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-5" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Slider, {
							"aria-label": "Volume",
							className: "relative flex h-11 min-w-0 flex-1 touch-none items-center select-none",
							value: [volume],
							max: 1,
							step: .01,
							onValueChange: ([value]) => setVolume(value ?? 0),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderTrack, {
								className: "relative h-1 grow rounded-full bg-line",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRange, { className: "absolute h-full rounded-full bg-primary" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderThumb, { className: "block size-4 rounded-full bg-fg" })]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 grid grid-cols-3 gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelButton, {
								label: `Speed ${rate}×`,
								active: rate !== 1,
								onClick: () => {
									const nextRate = RATES[(RATES.indexOf(rate) + 1) % RATES.length] ?? 1;
									setRate(nextRate);
								},
								children: rate === 1 ? "1×" : `${rate}×`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PanelButton, {
								label: "Sleep timer",
								active: Boolean(sleepLabel),
								onClick: () => setPanel(panel === "sleep" ? null : "sleep"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Timer, { className: "size-4" }), sleepLabel ?? "Sleep"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PanelButton, {
								label: "Tone",
								active: eqOn || panel === "eq",
								onClick: () => setPanel(panel === "eq" ? null : "eq"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, { className: "size-4" }), "Tone"]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "tap mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-surface-2 text-sm",
						onClick: () => setPanel(panel === "queue" ? null : "queue"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListMusic, { className: "size-4" }),
							"Queue · ",
							queued.length
						]
					}),
					panel === "sleep" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-wrap gap-2",
						children: [SLEEPS.map((minutes) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "tap h-10 rounded-full bg-surface-2 px-4 text-sm",
							onClick: () => {
								setSleep(minutes);
								setPanel(null);
							},
							children: [minutes, " min"]
						}, minutes)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "tap h-10 rounded-full bg-surface-2 px-4 text-sm text-muted",
							onClick: () => {
								setSleep(null);
								setPanel(null);
							},
							children: "Off"
						})]
					}) : null,
					panel === "eq" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 rounded-xl bg-surface p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-4 flex flex-wrap gap-2",
							children: [PRESETS.map((preset) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "tap h-10 rounded-full bg-surface-2 px-4 text-sm",
								onClick: () => setEq(preset.eq, preset.name !== "Flat"),
								children: preset.name
							}, preset.name)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "tap h-10 rounded-full px-4 text-sm text-muted",
								onClick: toggleEq,
								children: eqOn ? "Bypass" : "Enable"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex items-end justify-between px-2",
							children: BAND_LABELS.map((label, band) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex flex-col items-center gap-2 text-xs text-muted",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Slider, {
									orientation: "vertical",
									"aria-label": `${label} hertz`,
									className: "relative flex h-32 w-8 touch-none items-center justify-center",
									value: [eq[band] ?? 0],
									min: -12,
									max: 12,
									step: 1,
									onValueChange: ([value]) => {
										const nextEq = [...eq];
										nextEq[band] = value ?? 0;
										setEq(nextEq, true);
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderTrack, {
										className: "relative h-full w-1 rounded-full bg-line",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRange, { className: "absolute w-full rounded-full bg-primary" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderThumb, { className: "block size-4 rounded-full bg-fg" })]
								}), label]
							}, label))
						})]
					}) : null,
					panel === "queue" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
						className: "mt-4 divide-y divide-line overflow-hidden rounded-xl bg-surface",
						children: queued.map(({ track: item, position }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "tap flex h-14 w-full items-center gap-3 px-3 text-left",
							onClick: () => void playIndex(position),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "w-6 text-sm text-muted tabular-nums",
									children: position + 1
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "min-w-0 flex-1 truncate",
									children: item.title
								}),
								position === index ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bars, {}) : null
							]
						}) }, `${item.id}-${position}`))
					}) : null
				]
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-1 flex-col items-center justify-center px-8 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cover, {
					title: "Lantern",
					shape: "disc",
					className: "size-40"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-6 font-display text-3xl italic text-balance",
					children: "Nothing on the spindle"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 max-w-xs text-pretty text-muted",
					children: "Pick songs stored on this device. Lantern keeps a copy and plays them with no internet."
				})
			]
		})]
	});
}
function PanelButton({ label, active, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-label": label,
		onClick,
		className: cx("tap flex h-11 items-center justify-center gap-2 rounded-full text-sm", active ? "bg-primary text-primary-fg" : "bg-surface-2 text-fg"),
		children
	});
}
var TABS = [
	{
		id: "songs",
		label: "Songs"
	},
	{
		id: "albums",
		label: "Albums"
	},
	{
		id: "lists",
		label: "Playlists"
	}
];
function PlayerApp() {
	const booted = usePlayer((state) => state.booted);
	const bootError = usePlayer((state) => state.bootError);
	const playerOpen = usePlayer((state) => state.playerOpen);
	const setPlayerOpen = usePlayer((state) => state.setPlayerOpen);
	const sleepEndsAt = usePlayer((state) => state.sleepEndsAt);
	const setSleep = usePlayer((state) => state.setSleep);
	const [dropping, setDropping] = (0, import_react.useState)(false);
	const importFiles = usePlayer((state) => state.importFiles);
	(0, import_react.useEffect)(() => {
		startPlayer();
	}, []);
	(0, import_react.useEffect)(() => {
		if (!sleepEndsAt) return;
		const wait = sleepEndsAt - Date.now();
		if (wait <= 0) {
			engine.pause();
			setSleep(null);
			return;
		}
		const timer = window.setTimeout(() => {
			engine.pause();
			setSleep(null);
			toast("Sleep timer turned the music off");
		}, wait);
		return () => window.clearTimeout(timer);
	}, [sleepEndsAt, setSleep]);
	(0, import_react.useEffect)(() => {
		const onKey = (event) => {
			const target = event.target;
			if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
			const state = usePlayer.getState();
			if (event.key === " ") {
				event.preventDefault();
				state.toggle();
			} else if (event.key === "ArrowRight") engine.seek(engine.snapshot().currentTime + 10);
			else if (event.key === "ArrowLeft") engine.seek(Math.max(0, engine.snapshot().currentTime - 10));
			else if (event.key === "n" || event.key === "N") state.next();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
	if (!booted) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex h-dvh flex-col justify-end bg-bg px-6 pb-16 text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "On this device"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-5xl italic text-balance",
				children: "Lantern"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 max-w-sm text-pretty text-muted",
				children: "Local music, with no internet and no account."
			})
		]
	});
	if (bootError) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex h-dvh flex-col justify-center bg-bg px-6 text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-4xl italic",
			children: "Lantern"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 max-w-sm text-pretty text-muted",
			children: bootError
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "h-dvh overflow-hidden bg-bg text-fg",
		onDragOver: (event) => {
			event.preventDefault();
			setDropping(true);
		},
		onDragLeave: (event) => {
			if (event.currentTarget.contains(event.relatedTarget)) return;
			setDropping(false);
		},
		onDrop: (event) => {
			event.preventDefault();
			setDropping(false);
			importFiles(Array.from(event.dataTransfer.files), true);
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex h-full w-full max-w-6xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Library, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "hidden min-w-0 flex-1 lg:flex",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NowPlaying, { variant: "stage" })
				})]
			}),
			playerOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "lg:hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NowPlaying, {
					variant: "sheet",
					onClose: () => setPlayerOpen(false)
				})
			}) : null,
			dropping ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none fixed inset-4 z-50 flex items-center justify-center rounded-2xl border-2 border-dashed border-primary bg-bg/90",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-3xl italic",
					children: "Drop songs"
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AddDialog, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrackMenu, {})
		]
	});
}
function Library() {
	const tracks = usePlayer((state) => state.tracks);
	const query = usePlayer((state) => state.query);
	const setQuery = usePlayer((state) => state.setQuery);
	const tab = usePlayer((state) => state.tab);
	const setTab = usePlayer((state) => state.setTab);
	const sort = usePlayer((state) => state.sort);
	const setSort = usePlayer((state) => state.setSort);
	const favoritesOnly = usePlayer((state) => state.favoritesOnly);
	const setFavoritesOnly = usePlayer((state) => state.setFavoritesOnly);
	const setAddOpen = usePlayer((state) => state.setAddOpen);
	const importing = usePlayer((state) => state.importing);
	const [searching, setSearching] = (0, import_react.useState)(false);
	const visible = useVisibleTracks();
	const bytes = tracks.reduce((sum, track) => sum + track.size, 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "flex h-full min-h-0 w-full flex-col lg:w-96 lg:shrink-0 lg:border-r lg:border-line",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "safe-top px-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "font-display text-4xl leading-none italic",
								children: "Lantern"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted",
								children: "On this device · no signal needed"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ml-auto flex",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
								label: searching ? "Close search" : "Search",
								onClick: () => {
									setSearching((open) => !open);
									if (searching) setQuery("");
								},
								children: searching ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "size-5" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
								label: "Add music",
								onClick: () => setAddOpen(true),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-5" })
							})]
						})]
					}),
					searching ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						autoFocus: true,
						value: query,
						onChange: (event) => setQuery(event.target.value),
						placeholder: "Songs, artists, albums, formats",
						className: "mt-3 h-11 w-full rounded-full bg-surface-2 px-4 text-base text-fg outline-none placeholder:text-muted"
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 flex gap-4 border-b border-line",
						children: TABS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setTab(item.id),
							className: cx("tap h-11 border-b-2 text-sm", tab === item.id ? "border-primary text-fg" : "border-transparent text-muted"),
							children: item.label
						}, item.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setFavoritesOnly(!favoritesOnly),
							className: cx("tap h-10 rounded-full px-4 text-sm", favoritesOnly ? "bg-primary text-primary-fg" : "bg-surface-2 text-fg"),
							children: "Favorites"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "ml-auto",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "sr-only",
								children: "Sort"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								"aria-label": "Sort",
								value: sort,
								onChange: (event) => setSort(event.target.value),
								className: "h-10 rounded-full bg-surface-2 px-3 text-sm text-fg",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "added",
										children: "Recent"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "title",
										children: "Title"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "artist",
										children: "Artist"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "album",
										children: "Album"
									})
								]
							})]
						})]
					}),
					importing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "pb-2 text-sm text-muted",
						role: "status",
						children: [
							"Adding ",
							importing.done,
							" of ",
							importing.total
						]
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-h-0 flex-1 overflow-y-auto",
				children: [tab === "albums" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Albums, { tracks: visible }) : tab === "lists" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Playlists, { tracks: visible }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SongList, { tracks: visible }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "px-4 py-4 text-center text-sm text-muted",
					children: [
						tracks.length === 1 ? "1 song" : `${tracks.length} songs`,
						" · ",
						formatBytes(bytes),
						" saved here"
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniDock, {})
		]
	});
}
function useVisibleTracks() {
	const tracks = usePlayer((state) => state.tracks);
	const query = usePlayer((state) => state.query);
	const sort = usePlayer((state) => state.sort);
	const favoritesOnly = usePlayer((state) => state.favoritesOnly);
	const tab = usePlayer((state) => state.tab);
	const activePlaylistId = usePlayer((state) => state.activePlaylistId);
	const playlists = usePlayer((state) => state.playlists);
	return (0, import_react.useMemo)(() => {
		const playlist = playlists.find((item) => item.id === activePlaylistId);
		const inPlaylist = tab === "lists" && playlist;
		let list = tracks;
		if (favoritesOnly && !inPlaylist) list = list.filter((track) => track.favorite);
		if (inPlaylist && playlist) {
			const byId = new Map(tracks.map((track) => [track.id, track]));
			list = playlist.trackIds.map((id) => byId.get(id)).filter((track) => Boolean(track));
		}
		const needle = query.trim().toLowerCase();
		if (needle) list = list.filter((track) => `${track.title} ${track.artist} ${track.album} ${track.ext}`.toLowerCase().includes(needle));
		if (inPlaylist) return list;
		return [...list].sort((a, b) => {
			if (sort === "title") return a.title.localeCompare(b.title);
			if (sort === "artist") return (a.artist || "￿").localeCompare(b.artist || "￿");
			if (sort === "album") return (a.album || "￿").localeCompare(b.album || "￿");
			return b.addedAt - a.addedAt;
		});
	}, [
		tracks,
		query,
		sort,
		favoritesOnly,
		tab,
		activePlaylistId,
		playlists
	]);
}
function SongList({ tracks }) {
	const playTracks = usePlayer((state) => state.playTracks);
	const restoreSample = usePlayer((state) => state.restoreSample);
	const setAddOpen = usePlayer((state) => state.setAddOpen);
	const total = usePlayer((state) => state.tracks.length);
	if (!tracks.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-5 py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl italic text-balance",
				children: total ? "Nothing matches" : "The shelf is empty"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-pretty text-muted",
				children: total ? "Try another word, or clear favorites." : "Add music stored on this phone. Nothing is uploaded, and playback works offline."
			}),
			!total ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "tap h-11 rounded-full bg-primary px-5 text-sm font-medium text-primary-fg",
					onClick: () => setAddOpen(true),
					children: "Add songs"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "tap h-11 rounded-full bg-surface-2 px-5 text-sm",
					onClick: () => void restoreSample(),
					children: "Play First Light"
				})]
			}) : null
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: tracks.map((track) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SongRow, {
		track,
		onPlay: () => playTracks(tracks, track.id)
	}, track.id)) });
}
function SongRow({ track, onPlay }) {
	const active = usePlayer((state) => state.queue[state.index] === track.id);
	const playing = usePlayer((state) => state.playing);
	const setMenuTrackId = usePlayer((state) => state.setMenuTrackId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: cx("cv-auto flex items-center gap-1 border-l-2 pr-1", active ? "border-primary bg-surface" : "border-transparent"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: onPlay,
			className: "tap flex min-w-0 flex-1 items-center gap-3 px-3 py-2 text-left",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cover, {
					id: track.hasArt ? track.id : void 0,
					title: track.title,
					shape: "sleeve",
					className: "size-12"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "truncate font-medium",
							children: track.title
						}), active && playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bars, {}) : null]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "block truncate text-sm text-muted",
						children: [
							track.artist || "Unknown artist",
							" · ",
							formatLabel(track.ext),
							track.builtIn ? " · Built-in" : ""
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "w-12 shrink-0 text-right text-sm text-muted tabular-nums",
					children: formatClock(track.duration)
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
			label: `Actions for ${track.title}`,
			onClick: () => setMenuTrackId(track.id),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, { className: "size-5" })
		})]
	});
}
function Albums({ tracks }) {
	const playTracks = usePlayer((state) => state.playTracks);
	const albums = (0, import_react.useMemo)(() => {
		const grouped = /* @__PURE__ */ new Map();
		for (const track of tracks) {
			const title = track.album || "Unknown album";
			const artist = track.artist || "Unknown artist";
			const key = `${title}::${artist}`;
			const album = grouped.get(key) ?? {
				key,
				title,
				artist,
				tracks: []
			};
			album.tracks.push(track);
			grouped.set(key, album);
		}
		return [...grouped.values()].map((album) => ({
			...album,
			tracks: [...album.tracks].sort((a, b) => (a.discNo ?? 0) - (b.discNo ?? 0) || (a.trackNo ?? 9999) - (b.trackNo ?? 9999) || a.title.localeCompare(b.title))
		}));
	}, [tracks]);
	if (!albums.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "px-5 py-10 text-muted",
		children: "No albums in this view."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid grid-cols-2 gap-3 px-4",
		children: albums.map((album) => {
			const cover = album.tracks.find((track) => track.hasArt) ?? album.tracks[0];
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => cover && playTracks(album.tracks, cover.id),
				className: "tap text-left",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cover, {
						id: cover?.hasArt ? cover.id : void 0,
						title: album.title,
						shape: "sleeve",
						className: "aspect-square w-full"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mt-2 block truncate font-medium",
						children: album.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "block truncate text-sm text-muted",
						children: [
							album.artist,
							" · ",
							album.tracks.length
						]
					})
				]
			}, album.key);
		})
	});
}
function Playlists({ tracks }) {
	const playlists = usePlayer((state) => state.playlists);
	const activeId = usePlayer((state) => state.activePlaylistId);
	const setActive = usePlayer((state) => state.setActivePlaylist);
	const createPlaylist = usePlayer((state) => state.createPlaylist);
	const deletePlaylist = usePlayer((state) => state.deletePlaylist);
	const [name, setName] = (0, import_react.useState)("");
	const active = playlists.find((playlist) => playlist.id === activeId);
	if (active) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2 px-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "tap h-11 px-2 text-sm text-primary",
				onClick: () => setActive(null),
				children: "All playlists"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "min-w-0 flex-1 truncate font-display text-xl italic",
				children: active.name
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
				label: `Delete ${active.name}`,
				onClick: () => void deletePlaylist(active.id),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-5" })
			})
		]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SongList, { tracks })] });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "flex gap-2",
				onSubmit: (event) => {
					event.preventDefault();
					createPlaylist(name);
					setName("");
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: name,
					onChange: (event) => setName(event.target.value),
					placeholder: "New playlist",
					className: "h-11 min-w-0 flex-1 rounded-full bg-surface-2 px-4 text-base text-fg outline-none placeholder:text-muted"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "submit",
					className: "tap h-11 rounded-full bg-primary px-4 text-sm font-medium text-primary-fg",
					children: "Save"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3",
				children: playlists.map((playlist) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setActive(playlist.id),
					className: "tap flex h-14 w-full items-center text-left",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "min-w-0 flex-1 truncate",
						children: playlist.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm text-muted tabular-nums",
						children: playlist.trackIds.length
					})]
				}) }, playlist.id))
			}),
			!playlists.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "py-6 text-sm text-muted",
				children: "Playlists stay on this device, next to your songs."
			}) : null
		]
	});
}
function AddDialog() {
	const open = usePlayer((state) => state.addOpen);
	const setOpen = usePlayer((state) => state.setAddOpen);
	const importFiles = usePlayer((state) => state.importFiles);
	const filesRef = (0, import_react.useRef)(null);
	const folderRef = (0, import_react.useRef)(null);
	const anyRef = (0, import_react.useRef)(null);
	const take = (allowUnknown) => (event) => {
		const files = Array.from(event.target.files ?? []);
		event.target.value = "";
		if (files.length) importFiles(files, allowUnknown);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: setOpen,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, { className: "fixed inset-0 z-50 bg-bg/80" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "fixed inset-x-4 top-16 z-50 mx-auto max-w-md rounded-2xl border border-line bg-surface p-5 text-fg focus:outline-none",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
						className: "font-display text-3xl italic",
						children: "Add music"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
						className: "tap inline-flex size-11 items-center justify-center rounded-full",
						"aria-label": "Close",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
					className: "mt-2 text-pretty text-muted",
					children: "Lantern copies songs into the app so they keep playing with no internet, even if the originals move. Nothing is uploaded."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex flex-col gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "tap flex h-12 items-center gap-3 rounded-xl bg-surface-2 px-4 text-left",
							onClick: () => filesRef.current?.click(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-5 text-primary" }), "Songs or files"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "tap flex h-12 items-center gap-3 rounded-xl bg-surface-2 px-4 text-left",
							onClick: () => {
								folderRef.current?.setAttribute("webkitdirectory", "");
								folderRef.current?.setAttribute("directory", "");
								folderRef.current?.click();
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderOpen, { className: "size-5 text-primary" }), "A folder"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "tap flex h-12 items-center gap-3 rounded-xl bg-surface-2 px-4 text-left",
							onClick: () => anyRef.current?.click(),
							children: "Any file type"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm text-pretty text-muted",
					children: "MP3, AAC, M4A, FLAC, WAV, OGG, OPUS, AIFF, WebM, ALAC, and anything else this phone can decode. If the first player refuses a file, Lantern tries a second decoder."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-pretty text-muted",
					children: "On Android, use the browser menu and choose Install app or Add to Home screen. Lantern then opens like an app, with lock-screen controls, and still plays offline."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					ref: filesRef,
					className: "hidden",
					type: "file",
					multiple: true,
					accept: FILE_ACCEPT,
					onChange: take(false)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					ref: folderRef,
					className: "hidden",
					type: "file",
					multiple: true,
					accept: FILE_ACCEPT,
					onChange: take(false)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					ref: anyRef,
					className: "hidden",
					type: "file",
					multiple: true,
					onChange: take(true)
				})
			]
		})] })
	});
}
function TrackMenu() {
	const menuTrackId = usePlayer((state) => state.menuTrackId);
	const setMenuTrackId = usePlayer((state) => state.setMenuTrackId);
	const track = usePlayer((state) => state.tracks.find((item) => item.id === menuTrackId));
	const playlists = usePlayer((state) => state.playlists);
	const activePlaylistId = usePlayer((state) => state.activePlaylistId);
	const queueNext = usePlayer((state) => state.queueNext);
	const toggleFavorite = usePlayer((state) => state.toggleFavorite);
	const removeTrack = usePlayer((state) => state.removeTrack);
	const addToPlaylist = usePlayer((state) => state.addToPlaylist);
	const removeFromPlaylist = usePlayer((state) => state.removeFromPlaylist);
	const createPlaylist = usePlayer((state) => state.createPlaylist);
	const [name, setName] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: Boolean(track),
		onOpenChange: (open) => !open && setMenuTrackId(null),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, { className: "fixed inset-0 z-50 bg-bg/80" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl border border-line bg-surface p-5 text-fg focus:outline-none",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
					className: "truncate font-display text-2xl italic",
					children: track?.title ?? "Song"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
					className: "mt-1 truncate text-sm text-muted",
					children: track ? `${track.artist || "Unknown artist"} · ${formatLabel(track.ext)}` : ""
				}),
				track ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-col gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuButton, {
							onClick: () => queueNext(track.id),
							children: "Play next"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuButton, {
							onClick: () => {
								toggleFavorite(track.id);
								setMenuTrackId(null);
							},
							children: track.favorite ? "Remove favorite" : "Favorite"
						}),
						activePlaylistId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuButton, {
							onClick: () => void removeFromPlaylist(activePlaylistId, track.id),
							children: "Remove from playlist"
						}) : null,
						playlists.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl bg-surface-2 p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mb-2 text-sm text-muted",
								children: "Add to playlist"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex max-h-36 flex-col gap-1 overflow-y-auto",
								children: playlists.map((playlist) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "tap h-10 truncate rounded-lg px-2 text-left text-sm hover:bg-surface",
									onClick: () => void addToPlaylist(playlist.id, track.id),
									children: playlist.name
								}, playlist.id))
							})]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							className: "flex gap-2",
							onSubmit: (event) => {
								event.preventDefault();
								createPlaylist(name, track.id);
								setName("");
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: name,
								onChange: (event) => setName(event.target.value),
								placeholder: "New playlist",
								className: "h-11 min-w-0 flex-1 rounded-full bg-surface-2 px-4 text-base outline-none placeholder:text-muted"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								className: "tap h-11 rounded-full bg-primary px-4 text-sm font-medium text-primary-fg",
								children: "Add"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuButton, {
							onClick: () => void removeTrack(track.id),
							children: "Remove from Lantern"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-pretty text-muted",
							children: "This deletes the copy saved in Lantern. The original file on your phone stays put."
						})
					]
				}) : null
			]
		})] })
	});
}
function MenuButton({ children, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: "tap h-12 rounded-xl bg-surface-2 px-4 text-left",
		children
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayerApp, {});
}
//#endregion
export { Home as component };
