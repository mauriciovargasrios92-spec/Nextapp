"use client";

import { Screen, Subtext } from "./ui";

export default function Processing() {
  return (
    <Screen>
      <div className="flex flex-col items-center gap-6">
        <div className="h-14 w-14 rounded-full border-2 border-stone-light border-t-ink animate-spin" />
        <Subtext>Clearing the noise…</Subtext>
      </div>
    </Screen>
  );
}
