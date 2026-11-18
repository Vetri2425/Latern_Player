import type { Playlist, Track } from "@/player/types";

const DB_NAME = "lantern";
const DB_VERSION = 1;

let opening: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("This browser is blocking on-device storage."));
  }
  if (!opening) {
    opening = new Promise((resolve, reject) => {
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
        reject(request.error ?? new Error("Could not open the library."));
      };
    });
  }
  return opening;
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Storage write failed."));
    tx.onabort = () => reject(tx.error ?? new Error("Storage write aborted."));
  });
}

export async function dbListTracks(): Promise<Track[]> {
  const db = await openDb();
  const tx = db.transaction("tracks", "readonly");
  const rows = await new Promise<Track[]>((resolve, reject) => {
    const request = tx.objectStore("tracks").getAll();
    request.onsuccess = () => resolve(request.result as Track[]);
    request.onerror = () => reject(request.error);
  });
  return rows.sort((a, b) => b.addedAt - a.addedAt);
}

export async function dbListPlaylists(): Promise<Playlist[]> {
  const db = await openDb();
  const tx = db.transaction("playlists", "readonly");
  const rows = await new Promise<Playlist[]>((resolve, reject) => {
    const request = tx.objectStore("playlists").getAll();
    request.onsuccess = () => resolve(request.result as Playlist[]);
    request.onerror = () => reject(request.error);
  });
  return rows.sort((a, b) => a.createdAt - b.createdAt);
}

export async function dbPutTrack(track: Track, audio: Blob, art: Blob | null): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(["tracks", "blobs", "art"], "readwrite");
  tx.objectStore("tracks").put(track);
  tx.objectStore("blobs").put(audio, track.id);
  if (art) tx.objectStore("art").put(art, track.id);
  await done(tx);
}

export async function dbPatchTrack(track: Track): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("tracks", "readwrite");
  tx.objectStore("tracks").put(track);
  await done(tx);
}

export async function dbGetBlob(id: string): Promise<Blob | null> {
  const db = await openDb();
  const tx = db.transaction("blobs", "readonly");
  return new Promise((resolve, reject) => {
    const request = tx.objectStore("blobs").get(id);
    request.onsuccess = () => resolve((request.result as Blob | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function dbListArt(): Promise<Array<{ id: string; blob: Blob }>> {
  const db = await openDb();
  const tx = db.transaction("art", "readonly");
  const store = tx.objectStore("art");
  const [keys, values] = await Promise.all([
    new Promise<IDBValidKey[]>((resolve, reject) => {
      const request = store.getAllKeys();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }),
    new Promise<Blob[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as Blob[]);
      request.onerror = () => reject(request.error);
    }),
  ]);
  return keys.map((key, index) => ({ id: String(key), blob: values[index] })).filter((row) => row.blob instanceof Blob);
}

export async function dbDeleteTrack(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(["tracks", "blobs", "art"], "readwrite");
  tx.objectStore("tracks").delete(id);
  tx.objectStore("blobs").delete(id);
  tx.objectStore("art").delete(id);
  await done(tx);
}

export async function dbPutPlaylist(playlist: Playlist): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("playlists", "readwrite");
  tx.objectStore("playlists").put(playlist);
  await done(tx);
}

export async function dbDeletePlaylist(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("playlists", "readwrite");
  tx.objectStore("playlists").delete(id);
  await done(tx);
}
