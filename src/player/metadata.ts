import { mimeFor, stripExt } from "@/player/format";

export type Tags = {
  title: string;
  artist: string;
  album: string;
  duration: number;
  art: Blob | null;
  artMime: string | null;
  trackNo: number | null;
  discNo: number | null;
  mime: string;
};

function emptyTags(name: string, mime: string): Tags {
  return {
    title: stripExt(name) || "Untitled",
    artist: "",
    album: "",
    duration: 0,
    art: null,
    artMime: null,
    trackNo: null,
    discNo: null,
    mime,
  };
}

export async function readTags(file: File): Promise<Tags> {
  const mime = mimeFor(file.name, file.type);
  const fallback = emptyTags(file.name, mime);
  try {
    const { parseBlob } = await import("music-metadata");
    const metadata = await parseBlob(file, { duration: true });
    const picture = metadata.common.picture?.[0];
    let art: Blob | null = null;
    let artMime: string | null = null;
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
      duration: Number.isFinite(metadata.format.duration) ? (metadata.format.duration ?? 0) : 0,
      art,
      artMime,
      trackNo: typeof trackNo === "number" ? trackNo : null,
      discNo: typeof discNo === "number" ? discNo : null,
      mime,
    };
  } catch {
    return fallback;
  }
}
