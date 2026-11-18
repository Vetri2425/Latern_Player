import * as Slider from "@radix-ui/react-slider";
import { ChevronDown, Heart, ListMusic, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, SlidersHorizontal, Timer, Volume2, VolumeX } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Bars, Cover, cx, IconButton, PlayButton } from "@/components/player/bits";
import { engine } from "@/player/engine";
import { formatClock, formatLabel } from "@/player/format";
import { usePlayer } from "@/player/store";
import type { EqBands } from "@/player/types";

const RATES = [0.75, 1, 1.25, 1.5, 2];
const SLEEPS = [15, 30, 45, 60];
const PRESETS: Array<{ name: string; eq: EqBands }> = [
  { name: "Flat", eq: [0, 0, 0, 0, 0] },
  { name: "Warm", eq: [4, 3, 1, -1, -2] },
  { name: "Voice", eq: [-2, 1, 3, 3, 1] },
  { name: "Night", eq: [-3, -1, 0, -2, -4] },
];
const BAND_LABELS = ["80", "250", "1k", "4k", "12k"];

function useSleepLabel(): string | null {
  const ends = usePlayer((state) => state.sleepEndsAt);
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!ends) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [ends]);
  if (!ends || !now) return ends ? "On" : null;
  const remain = Math.max(0, ends - now);
  const minutes = Math.floor(remain / 60000);
  const seconds = Math.floor((remain % 60000) / 1000);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function NowPlaying({ variant, onClose }: { variant: "sheet" | "stage"; onClose?: () => void }) {
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
  const [drag, setDrag] = useState<number | null>(null);
  const [panel, setPanel] = useState<"eq" | "queue" | "sleep" | null>(null);
  const shown = drag ?? currentTime;
  const queued = queue
    .map((id, position) => ({ track: tracks.find((item) => item.id === id), position }))
    .filter((item): item is { track: NonNullable<typeof item.track>; position: number } => Boolean(item.track));

  return (
    <section
      className={cx(
        "flex h-full min-h-0 flex-col bg-bg text-fg",
        variant === "sheet" && "fixed inset-0 z-40 h-dvh",
      )}
    >
      <header className="safe-top flex items-center justify-between px-2">
        {variant === "sheet" ? (
          <IconButton label="Close player" onClick={onClose}>
            <ChevronDown className="size-6" />
          </IconButton>
        ) : (
          <span className="size-11" />
        )}
        <p className="font-display text-lg italic text-muted">Listening</p>
        {track ? (
          <IconButton label={track.favorite ? "Remove favorite" : "Favorite"} onClick={() => toggleFavorite(track.id)}>
            <Heart className={cx("size-5", track.favorite && "fill-current text-primary")} />
          </IconButton>
        ) : (
          <span className="size-11" />
        )}
      </header>

      {track ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-6">
          <div className="relative mx-auto mt-1 mb-4">
            <div className="lamp pointer-events-none absolute top-1/2 left-1/2 size-64 -translate-x-1/2 -translate-y-1/2" />
            <Cover
              id={track.id}
              title={track.title}
              shape="disc"
              spinning={playing}
              className="relative size-56 sm:size-64"
            />
          </div>
          <div className="mx-auto w-full max-w-md">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-display text-3xl leading-tight text-balance">{track.title}</h2>
                <p className="mt-1 truncate text-muted">
                  {track.artist || "Unknown artist"}
                  {track.album ? ` · ${track.album}` : ""} · {formatLabel(track.ext)}
                </p>
              </div>
              {playing ? <Bars /> : null}
            </div>
            {decodeError ? <p className="mt-3 text-sm text-primary">{decodeError}</p> : null}

            <div className="mt-4">
              <Slider.Root
                aria-label="Seek"
                disabled={!duration}
                className="relative flex h-11 w-full touch-none items-center select-none"
                value={[Math.min(shown, duration || 0)]}
                max={duration || 1}
                step={0.1}
                onValueChange={([value]) => setDrag(value ?? 0)}
                onValueCommit={([value]) => {
                  engine.seek(value ?? 0);
                  setDrag(null);
                }}
              >
                <Slider.Track className="relative h-1 grow rounded-full bg-line">
                  <Slider.Range className="absolute h-full rounded-full bg-primary" />
                </Slider.Track>
                <Slider.Thumb className="block size-4 rounded-full bg-fg" />
              </Slider.Root>
              <div className="flex justify-between text-sm text-muted tabular-nums">
                <span>{formatClock(shown)}</span>
                <span>{formatClock(duration)}</span>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <IconButton label={shuffle ? "Shuffle on" : "Shuffle off"} aria-pressed={shuffle} onClick={toggleShuffle}>
                <Shuffle className={cx("size-5", shuffle && "text-primary")} />
              </IconButton>
              <IconButton label="Previous" onClick={prev}>
                <SkipBack className="size-6" fill="currentColor" />
              </IconButton>
              <PlayButton />
              <IconButton label="Next" onClick={next}>
                <SkipForward className="size-6" fill="currentColor" />
              </IconButton>
              <IconButton
                label={repeat === "one" ? "Repeat one" : repeat === "all" ? "Repeat all" : "Repeat off"}
                aria-pressed={repeat !== "off"}
                onClick={cycleRepeat}
              >
                {repeat === "one" ? (
                  <Repeat1 className="size-5 text-primary" />
                ) : (
                  <Repeat className={cx("size-5", repeat === "all" && "text-primary")} />
                )}
              </IconButton>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <IconButton
                label={volume === 0 ? "Unmute" : "Mute"}
                onClick={() => setVolume(volume === 0 ? 0.9 : 0)}
              >
                {volume === 0 ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
              </IconButton>
              <Slider.Root
                aria-label="Volume"
                className="relative flex h-11 min-w-0 flex-1 touch-none items-center select-none"
                value={[volume]}
                max={1}
                step={0.01}
                onValueChange={([value]) => setVolume(value ?? 0)}
              >
                <Slider.Track className="relative h-1 grow rounded-full bg-line">
                  <Slider.Range className="absolute h-full rounded-full bg-primary" />
                </Slider.Track>
                <Slider.Thumb className="block size-4 rounded-full bg-fg" />
              </Slider.Root>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-2">
              <PanelButton
                label={`Speed ${rate}×`}
                active={rate !== 1}
                onClick={() => {
                  const nextRate = RATES[(RATES.indexOf(rate) + 1) % RATES.length] ?? 1;
                  setRate(nextRate);
                }}
              >
                {rate === 1 ? "1×" : `${rate}×`}
              </PanelButton>
              <PanelButton label="Sleep timer" active={Boolean(sleepLabel)} onClick={() => setPanel(panel === "sleep" ? null : "sleep")}>
                <Timer className="size-4" />
                {sleepLabel ?? "Sleep"}
              </PanelButton>
              <PanelButton label="Tone" active={eqOn || panel === "eq"} onClick={() => setPanel(panel === "eq" ? null : "eq")}>
                <SlidersHorizontal className="size-4" />
                Tone
              </PanelButton>
            </div>
            <button
              type="button"
              className="tap mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-surface-2 text-sm"
              onClick={() => setPanel(panel === "queue" ? null : "queue")}
            >
              <ListMusic className="size-4" />
              Queue · {queued.length}
            </button>

            {panel === "sleep" ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {SLEEPS.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    className="tap h-10 rounded-full bg-surface-2 px-4 text-sm"
                    onClick={() => {
                      setSleep(minutes);
                      setPanel(null);
                    }}
                  >
                    {minutes} min
                  </button>
                ))}
                <button
                  type="button"
                  className="tap h-10 rounded-full bg-surface-2 px-4 text-sm text-muted"
                  onClick={() => {
                    setSleep(null);
                    setPanel(null);
                  }}
                >
                  Off
                </button>
              </div>
            ) : null}

            {panel === "eq" ? (
              <div className="mt-4 rounded-xl bg-surface p-4">
                <div className="mb-4 flex flex-wrap gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      className="tap h-10 rounded-full bg-surface-2 px-4 text-sm"
                      onClick={() => setEq(preset.eq, preset.name !== "Flat")}
                    >
                      {preset.name}
                    </button>
                  ))}
                  <button type="button" className="tap h-10 rounded-full px-4 text-sm text-muted" onClick={toggleEq}>
                    {eqOn ? "Bypass" : "Enable"}
                  </button>
                </div>
                <div className="flex items-end justify-between px-2">
                  {BAND_LABELS.map((label, band) => (
                    <label key={label} className="flex flex-col items-center gap-2 text-xs text-muted">
                      <Slider.Root
                        orientation="vertical"
                        aria-label={`${label} hertz`}
                        className="relative flex h-32 w-8 touch-none items-center justify-center"
                        value={[eq[band] ?? 0]}
                        min={-12}
                        max={12}
                        step={1}
                        onValueChange={([value]) => {
                          const nextEq = [...eq] as EqBands;
                          nextEq[band] = value ?? 0;
                          setEq(nextEq, true);
                        }}
                      >
                        <Slider.Track className="relative h-full w-1 rounded-full bg-line">
                          <Slider.Range className="absolute w-full rounded-full bg-primary" />
                        </Slider.Track>
                        <Slider.Thumb className="block size-4 rounded-full bg-fg" />
                      </Slider.Root>
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            {panel === "queue" ? (
              <ol className="mt-4 divide-y divide-line overflow-hidden rounded-xl bg-surface">
                {queued.map(({ track: item, position }) => (
                  <li key={`${item.id}-${position}`}>
                    <button
                      type="button"
                      className="tap flex h-14 w-full items-center gap-3 px-3 text-left"
                      onClick={() => void playIndex(position)}
                    >
                      <span className="w-6 text-sm text-muted tabular-nums">{position + 1}</span>
                      <span className="min-w-0 flex-1 truncate">{item.title}</span>
                      {position === index ? <Bars /> : null}
                    </button>
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <Cover title="Lantern" shape="disc" className="size-40" />
          <h2 className="mt-6 font-display text-3xl italic text-balance">Nothing on the spindle</h2>
          <p className="mt-2 max-w-xs text-pretty text-muted">
            Pick songs stored on this device. Lantern keeps a copy and plays them with no internet.
          </p>
        </div>
      )}
    </section>
  );
}

function PanelButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cx(
        "tap flex h-11 items-center justify-center gap-2 rounded-full text-sm",
        active ? "bg-primary text-primary-fg" : "bg-surface-2 text-fg",
      )}
    >
      {children}
    </button>
  );
}
