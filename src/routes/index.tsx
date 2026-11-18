import { createFileRoute } from "@tanstack/react-router";
import { PlayerApp } from "@/components/player/player-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <PlayerApp />;
}
