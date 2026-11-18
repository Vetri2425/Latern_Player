import { Pause, Play } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { usePlayer } from "@/player/store";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function IconButton({
  label,
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cx(
        "tap inline-flex size-11 shrink-0 items-center justify-center rounded-full text-fg hover:bg-surface-2",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function PlayButton({ size = "lg" }: { size?: "lg" | "md" }) {
  const playing = usePlayer((state) => state.playing);
  const toggle = usePlayer((state) => state.toggle);
  return (
    <button
      type="button"
      aria-label={playing ? "Pause" : "Play"}
      onClick={(event) => {
        event.stopPropagation();
        void toggle();
      }}
      className={cx(
        "tap relative inline-flex items-center justify-center rounded-full bg-primary text-primary-fg",
        size === "lg" ? "size-16" : "size-11",
      )}
    >
      <span className={cx("icon-swap absolute", playing ? "icon-in" : "icon-out")}>
        <Pause className={size === "lg" ? "size-7" : "size-5"} fill="currentColor" />
      </span>
      <span className={cx("icon-swap", playing ? "icon-out" : "icon-in")}>
        <Play className={cx(size === "lg" ? "size-7" : "size-5", "translate-x-0.5")} fill="currentColor" />
      </span>
    </button>
  );
}

export function Cover({
  id,
  title,
  shape = "disc",
  spinning = false,
  className,
}: {
  id?: string;
  title: string;
  shape?: "disc" | "sleeve";
  spinning?: boolean;
  className?: string;
}) {
  const art = usePlayer((state) => (id ? state.artUrls[id] : undefined));
  const letter = (title.trim()[0] || "L").toUpperCase();
  return (
    <div
      className={cx(
        "relative shrink-0 overflow-hidden bg-surface-2",
        shape === "disc" ? "rounded-full" : "rounded-xl",
        spinning ? "disc-spin" : shape === "disc" ? "disc-spin is-paused" : "",
        className,
      )}
    >
      {art ? (
        <img src={art} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-display text-2xl text-primary">{letter}</div>
      )}
      {shape === "disc" ? <span className="spindle pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-bg ring-2 ring-primary/50" /> : null}
      <span className="pointer-events-none absolute inset-0 ring-1 ring-line ring-inset" />
    </div>
  );
}

export function Bars() {
  return (
    <span className="bars" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}
