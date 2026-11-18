import { SkipForward } from "lucide-react";
import { Cover, IconButton, PlayButton } from "@/components/player/bits";
import { formatLabel } from "@/player/format";
import { usePlayer } from "@/player/store";

export function MiniDock() {
  const trackId = usePlayer((state) => state.queue[state.index]);
  const track = usePlayer((state) => state.tracks.find((item) => item.id === trackId));
  const currentTime = usePlayer((state) => state.currentTime);
  const duration = usePlayer((state) => state.duration || track?.duration || 0);
  const setPlayerOpen = usePlayer((state) => state.setPlayerOpen);
  const next = usePlayer((state) => state.next);
  if (!track) return null;
  const pct = duration ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="safe-bottom border-t border-line bg-surface lg:hidden">
      <div className="h-0.5 bg-line">
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center gap-1 px-2 py-1">
        <button type="button" onClick={() => setPlayerOpen(true)} className="tap flex min-w-0 flex-1 items-center gap-3 px-1 text-left">
          <Cover id={track.hasArt ? track.id : undefined} title={track.title} shape="disc" className="size-11" />
          <span className="min-w-0">
            <span className="block truncate font-medium">{track.title}</span>
            <span className="block truncate text-sm text-muted">{track.artist || formatLabel(track.ext)}</span>
          </span>
        </button>
        <PlayButton size="md" />
        <IconButton label="Next" onClick={next}>
          <SkipForward className="size-5" fill="currentColor" />
        </IconButton>
      </div>
    </div>
  );
}
