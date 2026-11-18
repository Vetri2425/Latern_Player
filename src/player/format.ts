const AUDIO_EXTENSIONS = [
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
  "f4b",
] as const;

const SKIP_EXTENSIONS = new Set([
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
  "ds_store",
]);

const MIME_BY_EXT: Record<string, string> = {
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
  midi: "audio/midi",
};

const AUDIO_EXT_SET = new Set<string>(AUDIO_EXTENSIONS);

export const FILE_ACCEPT = ["audio/*", "video/mp4", "video/webm", "video/3gpp", ...AUDIO_EXTENSIONS.map((ext) => `.${ext}`)].join(
  ",",
);

export const MAX_FILE_BYTES = 1024 * 1024 * 1024;

export function extensionOf(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? name;
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return "";
  return base.slice(dot + 1).toLowerCase();
}

export function stripExt(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? name;
  const dot = base.lastIndexOf(".");
  return dot > 0 ? base.slice(0, dot) : base;
}

export function mimeFor(name: string, given?: string): string {
  if (given && given !== "application/octet-stream") return given;
  return MIME_BY_EXT[extensionOf(name)] ?? (given || "application/octet-stream");
}

export function isAudioFile(file: File, allowUnknown: boolean): boolean {
  if (file.size <= 0 || file.size > MAX_FILE_BYTES) return false;
  const ext = extensionOf(file.name);
  if (ext === "ds_store" || file.name === ".DS_Store") return false;
  if (SKIP_EXTENSIONS.has(ext)) return false;
  if (file.type.startsWith("audio/")) return true;
  if (file.type.startsWith("video/")) return true;
  if (AUDIO_EXT_SET.has(ext)) return true;
  return allowUnknown;
}

export function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remain = total % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${String(remain).padStart(2, "0")}`;
  return `${minutes}:${String(remain).padStart(2, "0")}`;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatLabel(ext: string): string {
  const value = ext.toLowerCase();
  if (value === "mp3" || value === "mp2" || value === "mp1") return "MP3";
  if (!value) return "AUDIO";
  return value.toUpperCase();
}
