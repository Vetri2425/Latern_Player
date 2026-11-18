import * as Dialog from "@radix-ui/react-dialog";
import { FolderOpen, MoreHorizontal, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { Bars, Cover, cx, IconButton } from "@/components/player/bits";
import { MiniDock } from "@/components/player/mini-dock";
import { NowPlaying } from "@/components/player/now-playing";
import { engine } from "@/player/engine";
import { FILE_ACCEPT, formatBytes, formatClock, formatLabel } from "@/player/format";
import { startPlayer, usePlayer, type LibraryTab, type SortKey } from "@/player/store";
import type { Track } from "@/player/types";

const TABS: Array<{ id: LibraryTab; label: string }> = [
  { id: "songs", label: "Songs" },
  { id: "albums", label: "Albums" },
  { id: "lists", label: "Playlists" },
];

export function PlayerApp() {
  const booted = usePlayer((state) => state.booted);
  const bootError = usePlayer((state) => state.bootError);
  const playerOpen = usePlayer((state) => state.playerOpen);
  const setPlayerOpen = usePlayer((state) => state.setPlayerOpen);
  const sleepEndsAt = usePlayer((state) => state.sleepEndsAt);
  const setSleep = usePlayer((state) => state.setSleep);
  const [dropping, setDropping] = useState(false);
  const importFiles = usePlayer((state) => state.importFiles);

  useEffect(() => {
    void startPlayer();
  }, []);

  useEffect(() => {
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

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const state = usePlayer.getState();
      if (event.key === " ") {
        event.preventDefault();
        void state.toggle();
      } else if (event.key === "ArrowRight") {
        engine.seek(engine.snapshot().currentTime + 10);
      } else if (event.key === "ArrowLeft") {
        engine.seek(Math.max(0, engine.snapshot().currentTime - 10));
      } else if (event.key === "n" || event.key === "N") {
        state.next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!booted) {
    return (
      <main className="flex h-dvh flex-col justify-end bg-bg px-6 pb-16 text-fg">
        <p className="text-sm text-muted">On this device</p>
        <h1 className="font-display text-5xl italic text-balance">Lantern</h1>
        <p className="mt-3 max-w-sm text-pretty text-muted">Local music, with no internet and no account.</p>
      </main>
    );
  }

  if (bootError) {
    return (
      <main className="flex h-dvh flex-col justify-center bg-bg px-6 text-fg">
        <h1 className="font-display text-4xl italic">Lantern</h1>
        <p className="mt-3 max-w-sm text-pretty text-muted">{bootError}</p>
      </main>
    );
  }

  return (
    <main
      className="h-dvh overflow-hidden bg-bg text-fg"
      onDragOver={(event) => {
        event.preventDefault();
        setDropping(true);
      }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node)) return;
        setDropping(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDropping(false);
        void importFiles(Array.from(event.dataTransfer.files), true);
      }}
    >
      <div className="mx-auto flex h-full w-full max-w-6xl">
        <Library />
        <div className="hidden min-w-0 flex-1 lg:flex">
          <NowPlaying variant="stage" />
        </div>
      </div>
      {playerOpen ? (
        <div className="lg:hidden">
          <NowPlaying variant="sheet" onClose={() => setPlayerOpen(false)} />
        </div>
      ) : null}
      {dropping ? (
        <div className="pointer-events-none fixed inset-4 z-50 flex items-center justify-center rounded-2xl border-2 border-dashed border-primary bg-bg/90">
          <p className="font-display text-3xl italic">Drop songs</p>
        </div>
      ) : null}
      <AddDialog />
      <TrackMenu />
    </main>
  );
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
  const [searching, setSearching] = useState(false);
  const visible = useVisibleTracks();
  const bytes = tracks.reduce((sum, track) => sum + track.size, 0);

  return (
    <section className="flex h-full min-h-0 w-full flex-col lg:w-96 lg:shrink-0 lg:border-r lg:border-line">
      <header className="safe-top px-4">
        <div className="flex items-center gap-2">
          <div className="min-w-0">
            <h1 className="font-display text-4xl leading-none italic">Lantern</h1>
            <p className="mt-1 text-sm text-muted">On this device · no signal needed</p>
          </div>
          <div className="ml-auto flex">
            <IconButton
              label={searching ? "Close search" : "Search"}
              onClick={() => {
                setSearching((open) => !open);
                if (searching) setQuery("");
              }}
            >
              {searching ? <X className="size-5" /> : <Search className="size-5" />}
            </IconButton>
            <IconButton label="Add music" onClick={() => setAddOpen(true)}>
              <Plus className="size-5" />
            </IconButton>
          </div>
        </div>
        {searching ? (
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Songs, artists, albums, formats"
            className="mt-3 h-11 w-full rounded-full bg-surface-2 px-4 text-base text-fg outline-none placeholder:text-muted"
          />
        ) : null}
        <div className="mt-4 flex gap-4 border-b border-line">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cx(
                "tap h-11 border-b-2 text-sm",
                tab === item.id ? "border-primary text-fg" : "border-transparent text-muted",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 py-3">
          <button
            type="button"
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={cx(
              "tap h-10 rounded-full px-4 text-sm",
              favoritesOnly ? "bg-primary text-primary-fg" : "bg-surface-2 text-fg",
            )}
          >
            Favorites
          </button>
          <label className="ml-auto">
            <span className="sr-only">Sort</span>
            <select
              aria-label="Sort"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="h-10 rounded-full bg-surface-2 px-3 text-sm text-fg"
            >
              <option value="added">Recent</option>
              <option value="title">Title</option>
              <option value="artist">Artist</option>
              <option value="album">Album</option>
            </select>
          </label>
        </div>
        {importing ? (
          <p className="pb-2 text-sm text-muted" role="status">
            Adding {importing.done} of {importing.total}
          </p>
        ) : null}
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "albums" ? <Albums tracks={visible} /> : tab === "lists" ? <Playlists tracks={visible} /> : <SongList tracks={visible} />}
        <p className="px-4 py-4 text-center text-sm text-muted">
          {tracks.length === 1 ? "1 song" : `${tracks.length} songs`} · {formatBytes(bytes)} saved here
        </p>
      </div>
      <MiniDock />
    </section>
  );
}

function useVisibleTracks(): Track[] {
  const tracks = usePlayer((state) => state.tracks);
  const query = usePlayer((state) => state.query);
  const sort = usePlayer((state) => state.sort);
  const favoritesOnly = usePlayer((state) => state.favoritesOnly);
  const tab = usePlayer((state) => state.tab);
  const activePlaylistId = usePlayer((state) => state.activePlaylistId);
  const playlists = usePlayer((state) => state.playlists);
  return useMemo(() => {
    const playlist = playlists.find((item) => item.id === activePlaylistId);
    const inPlaylist = tab === "lists" && playlist;
    let list = tracks;
    if (favoritesOnly && !inPlaylist) list = list.filter((track) => track.favorite);
    if (inPlaylist && playlist) {
      const byId = new Map(tracks.map((track) => [track.id, track]));
      list = playlist.trackIds.map((id) => byId.get(id)).filter((track): track is Track => Boolean(track));
    }
    const needle = query.trim().toLowerCase();
    if (needle) {
      list = list.filter((track) => `${track.title} ${track.artist} ${track.album} ${track.ext}`.toLowerCase().includes(needle));
    }
    if (inPlaylist) return list;
    return [...list].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "artist") return (a.artist || "\uffff").localeCompare(b.artist || "\uffff");
      if (sort === "album") return (a.album || "\uffff").localeCompare(b.album || "\uffff");
      return b.addedAt - a.addedAt;
    });
  }, [tracks, query, sort, favoritesOnly, tab, activePlaylistId, playlists]);
}

function SongList({ tracks }: { tracks: Track[] }) {
  const playTracks = usePlayer((state) => state.playTracks);
  const restoreSample = usePlayer((state) => state.restoreSample);
  const setAddOpen = usePlayer((state) => state.setAddOpen);
  const total = usePlayer((state) => state.tracks.length);
  if (!tracks.length) {
    return (
      <div className="px-5 py-10">
        <h2 className="font-display text-2xl italic text-balance">{total ? "Nothing matches" : "The shelf is empty"}</h2>
        <p className="mt-2 text-pretty text-muted">
          {total
            ? "Try another word, or clear favorites."
            : "Add music stored on this phone. Nothing is uploaded, and playback works offline."}
        </p>
        {!total ? (
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" className="tap h-11 rounded-full bg-primary px-5 text-sm font-medium text-primary-fg" onClick={() => setAddOpen(true)}>
              Add songs
            </button>
            <button type="button" className="tap h-11 rounded-full bg-surface-2 px-5 text-sm" onClick={() => void restoreSample()}>
              Play First Light
            </button>
          </div>
        ) : null}
      </div>
    );
  }
  return (
    <ul>
      {tracks.map((track) => (
        <SongRow key={track.id} track={track} onPlay={() => playTracks(tracks, track.id)} />
      ))}
    </ul>
  );
}

function SongRow({ track, onPlay }: { track: Track; onPlay: () => void }) {
  const active = usePlayer((state) => state.queue[state.index] === track.id);
  const playing = usePlayer((state) => state.playing);
  const setMenuTrackId = usePlayer((state) => state.setMenuTrackId);
  return (
    <li className={cx("cv-auto flex items-center gap-1 border-l-2 pr-1", active ? "border-primary bg-surface" : "border-transparent")}>
      <button type="button" onClick={onPlay} className="tap flex min-w-0 flex-1 items-center gap-3 px-3 py-2 text-left">
        <Cover id={track.hasArt ? track.id : undefined} title={track.title} shape="sleeve" className="size-12" />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate font-medium">{track.title}</span>
            {active && playing ? <Bars /> : null}
          </span>
          <span className="block truncate text-sm text-muted">
            {track.artist || "Unknown artist"} · {formatLabel(track.ext)}
            {track.builtIn ? " · Built-in" : ""}
          </span>
        </span>
        <span className="w-12 shrink-0 text-right text-sm text-muted tabular-nums">{formatClock(track.duration)}</span>
      </button>
      <IconButton label={`Actions for ${track.title}`} onClick={() => setMenuTrackId(track.id)}>
        <MoreHorizontal className="size-5" />
      </IconButton>
    </li>
  );
}

function Albums({ tracks }: { tracks: Track[] }) {
  const playTracks = usePlayer((state) => state.playTracks);
  const albums = useMemo(() => {
    const grouped = new Map<string, { key: string; title: string; artist: string; tracks: Track[] }>();
    for (const track of tracks) {
      const title = track.album || "Unknown album";
      const artist = track.artist || "Unknown artist";
      const key = `${title}::${artist}`;
      const album = grouped.get(key) ?? { key, title, artist, tracks: [] };
      album.tracks.push(track);
      grouped.set(key, album);
    }
    return [...grouped.values()].map((album) => ({
      ...album,
      tracks: [...album.tracks].sort(
        (a, b) => (a.discNo ?? 0) - (b.discNo ?? 0) || (a.trackNo ?? 9999) - (b.trackNo ?? 9999) || a.title.localeCompare(b.title),
      ),
    }));
  }, [tracks]);

  if (!albums.length) {
    return <p className="px-5 py-10 text-muted">No albums in this view.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      {albums.map((album) => {
        const cover = album.tracks.find((track) => track.hasArt) ?? album.tracks[0];
        return (
          <button
            key={album.key}
            type="button"
            onClick={() => cover && playTracks(album.tracks, cover.id)}
            className="tap text-left"
          >
            <Cover id={cover?.hasArt ? cover.id : undefined} title={album.title} shape="sleeve" className="aspect-square w-full" />
            <span className="mt-2 block truncate font-medium">{album.title}</span>
            <span className="block truncate text-sm text-muted">
              {album.artist} · {album.tracks.length}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Playlists({ tracks }: { tracks: Track[] }) {
  const playlists = usePlayer((state) => state.playlists);
  const activeId = usePlayer((state) => state.activePlaylistId);
  const setActive = usePlayer((state) => state.setActivePlaylist);
  const createPlaylist = usePlayer((state) => state.createPlaylist);
  const deletePlaylist = usePlayer((state) => state.deletePlaylist);
  const [name, setName] = useState("");
  const active = playlists.find((playlist) => playlist.id === activeId);

  if (active) {
    return (
      <div>
        <div className="flex items-center gap-2 px-2">
          <button type="button" className="tap h-11 px-2 text-sm text-primary" onClick={() => setActive(null)}>
            All playlists
          </button>
          <h2 className="min-w-0 flex-1 truncate font-display text-xl italic">{active.name}</h2>
          <IconButton label={`Delete ${active.name}`} onClick={() => void deletePlaylist(active.id)}>
            <Trash2 className="size-5" />
          </IconButton>
        </div>
        <SongList tracks={tracks} />
      </div>
    );
  }

  return (
    <div className="px-4">
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void createPlaylist(name);
          setName("");
        }}
      >
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="New playlist"
          className="h-11 min-w-0 flex-1 rounded-full bg-surface-2 px-4 text-base text-fg outline-none placeholder:text-muted"
        />
        <button type="submit" className="tap h-11 rounded-full bg-primary px-4 text-sm font-medium text-primary-fg">
          Save
        </button>
      </form>
      <ul className="mt-3">
        {playlists.map((playlist) => (
          <li key={playlist.id}>
            <button type="button" onClick={() => setActive(playlist.id)} className="tap flex h-14 w-full items-center text-left">
              <span className="min-w-0 flex-1 truncate">{playlist.name}</span>
              <span className="text-sm text-muted tabular-nums">{playlist.trackIds.length}</span>
            </button>
          </li>
        ))}
      </ul>
      {!playlists.length ? <p className="py-6 text-sm text-muted">Playlists stay on this device, next to your songs.</p> : null}
    </div>
  );
}

function AddDialog() {
  const open = usePlayer((state) => state.addOpen);
  const setOpen = usePlayer((state) => state.setAddOpen);
  const importFiles = usePlayer((state) => state.importFiles);
  const filesRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const anyRef = useRef<HTMLInputElement>(null);

  const take = (allowUnknown: boolean) => (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length) void importFiles(files, allowUnknown);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-bg/80" />
        <Dialog.Content className="fixed inset-x-4 top-16 z-50 mx-auto max-w-md rounded-2xl border border-line bg-surface p-5 text-fg focus:outline-none">
          <div className="flex items-start justify-between gap-3">
            <Dialog.Title className="font-display text-3xl italic">Add music</Dialog.Title>
            <Dialog.Close className="tap inline-flex size-11 items-center justify-center rounded-full" aria-label="Close">
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-2 text-pretty text-muted">
            Lantern copies songs into the app so they keep playing with no internet, even if the originals move. Nothing is uploaded.
          </Dialog.Description>
          <div className="mt-5 flex flex-col gap-2">
            <button type="button" className="tap flex h-12 items-center gap-3 rounded-xl bg-surface-2 px-4 text-left" onClick={() => filesRef.current?.click()}>
              <Plus className="size-5 text-primary" />
              Songs or files
            </button>
            <button
              type="button"
              className="tap flex h-12 items-center gap-3 rounded-xl bg-surface-2 px-4 text-left"
              onClick={() => {
                folderRef.current?.setAttribute("webkitdirectory", "");
                folderRef.current?.setAttribute("directory", "");
                folderRef.current?.click();
              }}
            >
              <FolderOpen className="size-5 text-primary" />
              A folder
            </button>
            <button type="button" className="tap flex h-12 items-center gap-3 rounded-xl bg-surface-2 px-4 text-left" onClick={() => anyRef.current?.click()}>
              Any file type
            </button>
          </div>
          <p className="mt-4 text-sm text-pretty text-muted">
            MP3, AAC, M4A, FLAC, WAV, OGG, OPUS, AIFF, WebM, ALAC, and anything else this phone can decode. If the first player refuses a file, Lantern tries a second decoder.
          </p>
          <p className="mt-3 text-sm text-pretty text-muted">
            On Android, use the browser menu and choose Install app or Add to Home screen. Lantern then opens like an app, with lock-screen controls, and still plays offline.
          </p>
          <input ref={filesRef} className="hidden" type="file" multiple accept={FILE_ACCEPT} onChange={take(false)} />
          <input ref={folderRef} className="hidden" type="file" multiple accept={FILE_ACCEPT} onChange={take(false)} />
          <input ref={anyRef} className="hidden" type="file" multiple onChange={take(true)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
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
  const [name, setName] = useState("");

  return (
    <Dialog.Root open={Boolean(track)} onOpenChange={(open) => !open && setMenuTrackId(null)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-bg/80" />
        <Dialog.Content className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl border border-line bg-surface p-5 text-fg focus:outline-none">
          <Dialog.Title className="truncate font-display text-2xl italic">{track?.title ?? "Song"}</Dialog.Title>
          <Dialog.Description className="mt-1 truncate text-sm text-muted">
            {track ? `${track.artist || "Unknown artist"} · ${formatLabel(track.ext)}` : ""}
          </Dialog.Description>
          {track ? (
            <div className="mt-4 flex flex-col gap-2">
              <MenuButton onClick={() => queueNext(track.id)}>Play next</MenuButton>
              <MenuButton
                onClick={() => {
                  toggleFavorite(track.id);
                  setMenuTrackId(null);
                }}
              >
                {track.favorite ? "Remove favorite" : "Favorite"}
              </MenuButton>
              {activePlaylistId ? (
                <MenuButton onClick={() => void removeFromPlaylist(activePlaylistId, track.id)}>Remove from playlist</MenuButton>
              ) : null}
              {playlists.length ? (
                <div className="rounded-xl bg-surface-2 p-3">
                  <p className="mb-2 text-sm text-muted">Add to playlist</p>
                  <div className="flex max-h-36 flex-col gap-1 overflow-y-auto">
                    {playlists.map((playlist) => (
                      <button
                        key={playlist.id}
                        type="button"
                        className="tap h-10 truncate rounded-lg px-2 text-left text-sm hover:bg-surface"
                        onClick={() => void addToPlaylist(playlist.id, track.id)}
                      >
                        {playlist.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void createPlaylist(name, track.id);
                  setName("");
                }}
              >
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="New playlist"
                  className="h-11 min-w-0 flex-1 rounded-full bg-surface-2 px-4 text-base outline-none placeholder:text-muted"
                />
                <button type="submit" className="tap h-11 rounded-full bg-primary px-4 text-sm font-medium text-primary-fg">
                  Add
                </button>
              </form>
              <MenuButton onClick={() => void removeTrack(track.id)}>Remove from Lantern</MenuButton>
              <p className="text-sm text-pretty text-muted">This deletes the copy saved in Lantern. The original file on your phone stays put.</p>
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function MenuButton({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="tap h-12 rounded-xl bg-surface-2 px-4 text-left">
      {children}
    </button>
  );
}
