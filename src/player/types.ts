export type RepeatMode = "off" | "all" | "one";

export type Track = {
  id: string;
  dedupe: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  mime: string;
  ext: string;
  size: number;
  addedAt: number;
  favorite: boolean;
  hasArt: boolean;
  artMime: string | null;
  builtIn: boolean;
  trackNo: number | null;
  discNo: number | null;
};

export type Playlist = {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: number;
};

export type EqBands = [number, number, number, number, number];
