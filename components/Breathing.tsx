"use client";

import { useEffect, useRef, useState } from "react";
import { Screen, Statement, Subtext, TextLink } from "./ui";
import { useAppStore } from "@/lib/store";
import { track } from "@/lib/analytics";

const CYCLE_MS = 10_000; // 4s inhale + 6s exhale
const TOTAL_MS = 60_000;

export default function Breathing() {
  const [phase, setPhase] = useState<"inhale" | "exhale">("inhale");
  const [done, setDone] = useState(false);
  const setView = useAppStore((s) => s.setView);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      track("breathing_started");
    }

    const startTime = Date.now();
    const phaseTimer = setInterval(() => {
      const elapsed = (Date.now() - startTime) % CYCLE_MS;
      setPhase(elapsed < 4000 ? "inhale" : "exhale");
    }, 200);

    const endTimer = setTimeout(() => {
      clearInterval(phaseTimer);
      track("breathing_completed");
      setDone(true);
      setTimeout(() => setView("next-action"), 900);
    }, TOTAL_MS);

    return () => {
      clearInterval(phaseTimer);
      clearTimeout(endTimer);
    };
  }, [setView]);

  if (done) {
    return (
      <Screen>
        <Statement>Ready.</Statement>
      </Screen>
    );
  }

  return (
    <Screen>
      <div className="flex flex-col gap-3">
        <Statement>Reset.</Statement>
        <Subtext>60 seconds. Nothing else.</Subtext>
      </div>

      <div className="h-56 w-56 flex items-center justify-center">
        <div
          className="h-40 w-40 rounded-full bg-accent/25 border border-accent-soft/40"
          style={{
            animation: "breathe 10s ease-in-out infinite",
          }}
        />
      </div>

      <p className="text-[15px] tracking-wide text-stone">
        {phase === "inhale" ? "Inhale" : "Exhale"}
      </p>

      <TextLink onClick={() => setView("next-action")}>Skip</TextLink>
    </Screen>
  );
}
