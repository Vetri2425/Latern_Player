import { toast } from "sonner";
import { create } from "zustand";
import { dbDeletePlaylist, dbDeleteTrack, dbGetBlob, dbListArt, dbListPlaylists, dbListTracks, dbPatchTrack, dbPutPlaylist, dbPutTrack } from "@/player/db";
import { engine, type EngineSnapshot } from "@/player/engine";
import { extensionOf, isAudioFile, mimeFor } from "@/player/format";
import { readTags } from "@/player/metadata";
import { makeFirstLight } from "@/player/sample";
import type { EqBands, Playlist, RepeatMode, Track } from "@/player/types";

const SETTINGS_KEY = "lantern-settings-v1";
const SEEDED_KEY = "lantern-seeded-v1";
const SAMPLE_DEDUPE = "builtin:first-light";

export type LibraryTab = "songs" | "albums" | "lists";
export type SortKey = "added" | "title" | "artist" | "album";

type Settings = {
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
  eqOn: boolean;
  eq: EqBands;
  rate: number;
  lastTrackId: string | null;
  lastTime: number;
};

type PlayerState = {
  booted: boolean;
  bootError: string | null;
  tracks: Track[];
  artUrls: Record<string, string>;
  playlists: Playlist[];
  query: string;
  tab: LibraryTab;
  sort: SortKey;
  favoritesOnly: boolean;
  activePlaylistId: string | null;
  queue: string[];
  index: number;
  playing: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
  eqOn: boolean;
  eq: EqBands;
  rate: number;
  playerOpen: boolean;
  importing: { done: number; total: number } | null;
  decodeError: string | null;
  menuTrackId: string | null;
  addOpen: boolean;
  sleepEndsAt: number | null;
  resumeTrackId: string | null;
  resumeTime: number;
  setQuery: (query: string) => void;
  setTab: (tab: LibraryTab) => void;
  setSort: (sort: SortKey) => void;
  setFavoritesOnly: (value: boolean) => void;
  setActivePlaylist: (id: string | null) => void;
  setPlayerOpen: (open: boolean) => void;
  setMenuTrackId: (id: string | null) => void;
  setAddOpen: (open: boolean) => void;
  setVolume: (volume: number) => void;
  setRate: (rate: number) => void;
  setEq: (eq: EqBands, on?: boolean) => void;
  toggleEq: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  toggleFavorite: (id: string) => void;
  toggle: () => Promise<void>;
  next: () => void;
  prev: () => void;
  playTracks: (tracks: Track[], id: string) => void;
  queueNext: (id: string) => void;
  playIndex: (index: number) => Promise<void>;
  importFiles: (files: File[], allowUnknown: boolean) => Promise<void>;
  removeTrack: (id: string) => Promise<void>;
  createPlaylist: (name: string, trackId?: string) => Promise<void>;
  addToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  removeFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  setSleep: (minutes: number | null) => void;
  restoreSample: () => Promise<void>;
};

const FLAT: EqBands = [0, 0, 0, 0, 0];

function defaultSettings(): Settings {
  return {
    volume: 0.9,
    shuffle: false,
    repeat: "off",
    eqOn: false,
    eq: FLAT,
    rate: 1,
    lastTrackId: null,
    lastTime: 0,
  };
}

function loadSettings(): Settings {
  const base = defaultSettings();
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    const eq = Array.isArray(parsed.eq) && parsed.eq.length === 5 ? (parsed.eq.map((n) => Number(n) || 0) as EqBands) : FLAT;
    return {
      ...base,
      ...parsed,
      eq,
      volume: typeof parsed.volume === "number" ? parsed.volume : base.volume,
      rate: typeof parsed.rate === "number" ? parsed.rate : base.rate,
      repeat: parsed.repeat === "all" || parsed.repeat === "one" ? parsed.repeat : "off",
    };
  } catch {
    return base;
  }
}

function isQuota(error: unknown): boolean {
  return error instanceof DOMException && (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED");
}

function shuffleIds(ids: string[]): string[] {
  const next = [...ids];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const swap = next[i];
    next[i] = next[j] ?? next[i]!;
    next[j] = swap ?? next[j]!;
  }
  return next;
}

let playToken = 0;
let bootOnce: Promise<void> | null = null;
const durationSaved = new Set<string>();
let sessionReady = false;

function currentTrack(state: PlayerState): Track | undefined {
  const id = state.queue[state.index];
  return state.tracks.find((track) => track.id === id);
}

function persist(): void {
  const state = usePlayer.getState();
  const track = currentTrack(state);
  const settings: Settings = {
    volume: state.volume,
    shuffle: state.shuffle,
    repeat: state.repeat,
    eqOn: state.eqOn,
    eq: state.eq,
    rate: state.rate,
    lastTrackId: track?.id ?? state.resumeTrackId,
    lastTime: track ? state.currentTime : state.resumeTime,
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function syncSession(snapshot: EngineSnapshot): void {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  const state = usePlayer.getState();
  const track = currentTrack(state);
  navigator.mediaSession.playbackState = snapshot.playing ? "playing" : "paused";
  const duration = snapshot.duration || track?.duration || 0;
  if (duration > 0) {
    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: state.rate,
        position: Math.min(duration, Math.max(0, snapshot.currentTime || 0)),
      });
    } catch {
      /* ignore invalid position */
    }
  }
}

function setSessionMeta(track: Track): void {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  const art = usePlayer.getState().artUrls[track.id];
  const artwork: MediaImage[] = art
    ? [{ src: art, sizes: "512x512", type: track.artMime || "image/jpeg" }]
    : [];
  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.artist || "Lantern",
    album: track.album || "On this device",
    artwork,
  });
}

function installSessionHandlers(): void {
  if (sessionReady || typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  sessionReady = true;
  const bind = (action: MediaSessionAction, run: (details: MediaSessionActionDetails) => void) => {
    try {
      navigator.mediaSession.setActionHandler(action, run);
    } catch {
      /* action not supported on this device */
    }
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

async function rememberArt(tracks: Track[]): Promise<void> {
  const art = await dbListArt();
  const urls = { ...usePlayer.getState().artUrls };
  for (const row of art) {
    if (!tracks.some((track) => track.id === row.id) || urls[row.id]) continue;
    urls[row.id] = URL.createObjectURL(row.blob);
  }
  usePlayer.setState({ artUrls: urls });
}

async function insertTrack(track: Track, audio: Blob, art: Blob | null): Promise<void> {
  await dbPutTrack(track, audio, art);
  const artUrl = art ? URL.createObjectURL(art) : null;
  usePlayer.setState((state) => ({
    tracks: [track, ...state.tracks.filter((item) => item.id !== track.id)],
    artUrls: artUrl ? { ...state.artUrls, [track.id]: artUrl } : state.artUrls,
  }));
}

async function addSample(): Promise<void> {
  const existing = usePlayer.getState().tracks.find((track) => track.dedupe === SAMPLE_DEDUPE);
  if (existing) return;
  const blob = makeFirstLight();
  const track: Track = {
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
    discNo: 1,
  };
  await insertTrack(track, blob, null);
}

function onSnapshot(snapshot: EngineSnapshot): void {
  const state = usePlayer.getState();
  const sameTime = Math.abs(state.currentTime - snapshot.currentTime) < 0.05;
  const sameDur = Math.abs((state.duration || 0) - (snapshot.duration || 0)) < 0.05;
  if (state.playing === snapshot.playing && state.decodeError === snapshot.error && sameTime && sameDur) {
    if (snapshot.playing) syncSession(snapshot);
    return;
  }
  usePlayer.setState({
    playing: snapshot.playing,
    currentTime: snapshot.currentTime,
    duration: snapshot.duration || state.duration,
    decodeError: snapshot.error,
  });
  const track = currentTrack(usePlayer.getState());
  if (track && snapshot.duration && Math.abs(track.duration - snapshot.duration) > 0.75) {
    const key = `${track.id}:${Math.round(snapshot.duration)}`;
    if (!durationSaved.has(key)) {
      durationSaved.add(key);
      const updated = { ...track, duration: snapshot.duration };
      void dbPatchTrack(updated);
      usePlayer.setState({
        tracks: usePlayer.getState().tracks.map((item) => (item.id === track.id ? updated : item)),
      });
    }
  }
  syncSession(snapshot);
}

export const usePlayer = create<PlayerState>((set, get) => ({
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
  volume: 0.9,
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
    set({ eq, eqOn });
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
    if (shuffle && current) {
      const rest = shuffleIds(state.queue.filter((id) => id !== current));
      set({ shuffle, queue: [current, ...rest], index: 0 });
    } else {
      set({ shuffle });
    }
    persist();
  },
  cycleRepeat: () => {
    const order: RepeatMode[] = ["off", "all", "one"];
    const repeat = order[(order.indexOf(get().repeat) + 1) % order.length] ?? "off";
    set({ repeat });
    persist();
  },
  toggleFavorite: (id) => {
    const track = get().tracks.find((item) => item.id === id);
    if (!track) return;
    const updated = { ...track, favorite: !track.favorite };
    set({ tracks: get().tracks.map((item) => (item.id === id ? updated : item)) });
    void dbPatchTrack(updated);
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
    if (index + 1 < queue.length) void get().playIndex(index + 1);
    else if (repeat !== "off" && queue.length) void get().playIndex(0);
  },
  prev: () => {
    if (engine.snapshot().currentTime > 3) {
      engine.seek(0);
      return;
    }
    const { index } = get();
    if (index > 0) void get().playIndex(index - 1);
    else engine.seek(0);
  },
  playTracks: (tracks, id) => {
    const ids = tracks.map((track) => track.id);
    const picked = ids.indexOf(id);
    if (picked < 0) return;
    let queue = ids;
    let index = picked;
    if (get().shuffle) {
      const rest = shuffleIds(ids.filter((item) => item !== id));
      queue = [id, ...rest];
      index = 0;
    }
    set({ queue, index, playerOpen: false, decodeError: null });
    void get().playIndex(index);
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
    set({ queue: without, index: currentIndex, menuTrackId: null });
    toast("Playing next");
  },
  playIndex: async (index) => {
    const token = ++playToken;
    const queue = get().queue;
    const id = queue[index];
    const track = get().tracks.find((item) => item.id === id);
    if (!track) return;
    const resume = id === get().resumeTrackId ? get().resumeTime : 0;
    set({
      index,
      decodeError: null,
      currentTime: resume > 1 ? resume : 0,
      duration: track.duration,
      resumeTrackId: null,
      resumeTime: 0,
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
    const tooBig = files.filter((file) => file.size > 1024 * 1024 * 1024).length;
    if (!chosen.length) {
      toast.error(tooBig ? "Those files are over 1 GB." : "No playable audio files in that selection.");
      return;
    }
    const known = new Set(get().tracks.map((track) => track.dedupe));
    set({ importing: { done: 0, total: chosen.length }, addOpen: false });
    let added = 0;
    let skipped = 0;
    let failed = 0;
    for (let i = 0; i < chosen.length; i += 1) {
      const file = chosen[i]!;
      const dedupe = `${file.size}:${file.name}`;
      if (known.has(dedupe)) {
        skipped += 1;
      } else {
        try {
          const tags = await readTags(file);
          const track: Track = {
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
            discNo: tags.discNo,
          };
          await insertTrack(track, file, tags.art);
          known.add(dedupe);
          added += 1;
        } catch (error) {
          failed += 1;
          if (isQuota(error)) {
            toast.error("This device is out of space for more songs.");
            break;
          }
        }
      }
      set({ importing: { done: i + 1, total: chosen.length } });
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
    const playlists = state.playlists.map((playlist) =>
      playlist.trackIds.includes(id) ? { ...playlist, trackIds: playlist.trackIds.filter((item) => item !== id) } : playlist,
    );
    await Promise.all(
      playlists.filter((playlist, i) => playlist !== state.playlists[i]).map((playlist) => dbPutPlaylist(playlist)),
    );
    const artUrls = { ...state.artUrls };
    delete artUrls[id];
    set({ tracks, queue, index, playlists, artUrls, menuTrackId: null });
    if (wasCurrent) {
      if (queue.length) await get().playIndex(index);
      else engine.stop();
    }
  },
  createPlaylist: async (name, trackId) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const playlist: Playlist = {
      id: crypto.randomUUID(),
      name: trimmed,
      trackIds: trackId ? [trackId] : [],
      createdAt: Date.now(),
    };
    await dbPutPlaylist(playlist);
    set({ playlists: [...get().playlists, playlist], menuTrackId: trackId ? null : get().menuTrackId });
    toast.success(`Saved “${trimmed}”`);
  },
  addToPlaylist: async (playlistId, trackId) => {
    const playlist = get().playlists.find((item) => item.id === playlistId);
    if (!playlist || playlist.trackIds.includes(trackId)) {
      set({ menuTrackId: null });
      return;
    }
    const next = { ...playlist, trackIds: [...playlist.trackIds, trackId] };
    await dbPutPlaylist(next);
    set({
      playlists: get().playlists.map((item) => (item.id === playlistId ? next : item)),
      menuTrackId: null,
    });
    toast.success(`Added to ${next.name}`);
  },
  removeFromPlaylist: async (playlistId, trackId) => {
    const playlist = get().playlists.find((item) => item.id === playlistId);
    if (!playlist) return;
    const next = { ...playlist, trackIds: playlist.trackIds.filter((id) => id !== trackId) };
    await dbPutPlaylist(next);
    set({
      playlists: get().playlists.map((item) => (item.id === playlistId ? next : item)),
      menuTrackId: null,
    });
  },
  deletePlaylist: async (id) => {
    await dbDeletePlaylist(id);
    set({
      playlists: get().playlists.filter((playlist) => playlist.id !== id),
      activePlaylistId: get().activePlaylistId === id ? null : get().activePlaylistId,
    });
  },
  setSleep: (minutes) => {
    if (!minutes) {
      set({ sleepEndsAt: null });
      return;
    }
    set({ sleepEndsAt: Date.now() + minutes * 60 * 1000 });
    toast(`Sleep timer · ${minutes} min`);
  },
  restoreSample: async () => {
    await addSample();
  },
}));

engine.setOnEnded(() => {
  const state = usePlayer.getState();
  if (state.repeat === "one") {
    engine.seek(0);
    void engine.play();
    return;
  }
  state.next();
});

export function startPlayer(): Promise<void> {
  if (!bootOnce) {
    bootOnce = (async () => {
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
          resumeTime: settings.lastTime,
        });
        if (!localStorage.getItem(SEEDED_KEY) && tracks.length === 0) {
          await addSample();
          localStorage.setItem(SEEDED_KEY, "1");
        } else if (!localStorage.getItem(SEEDED_KEY)) {
          localStorage.setItem(SEEDED_KEY, "1");
        }
        const ready = usePlayer.getState();
        if (!ready.queue.length && ready.tracks[0]) {
          usePlayer.setState({
            queue: [ready.tracks[0].id],
            index: 0,
            duration: ready.tracks[0].duration,
          });
        }
        void rememberArt(usePlayer.getState().tracks);
        if (import.meta.env.PROD && "serviceWorker" in navigator) {
          navigator.serviceWorker.register("/sw.js").catch(() => undefined);
        }
        window.addEventListener("pagehide", persist);
      } catch (error) {
        usePlayer.setState({
          booted: true,
          bootError: error instanceof Error ? error.message : "Lantern couldn't open on-device storage.",
        });
      }
    })();
  }
  return bootOnce;
}
