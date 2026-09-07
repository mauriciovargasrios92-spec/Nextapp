"use client";

import { useEffect, useRef, useState } from "react";
import { Screen, Statement, Subtext, PrimaryButton, TextLink } from "./ui";
import { useAppStore } from "@/lib/store";
import { track } from "@/lib/analytics";

// Ciclo de respiración: 4s inhale, 4s hold, 6s exhale, 4s hold = 18s por ciclo.
const INHALE_MS = 4000;
const HOLD1_MS = 4000;
const EXHALE_MS = 6000;
const HOLD2_MS = 4000;
const CYCLE_MS = INHALE_MS + HOLD1_MS + EXHALE_MS + HOLD2_MS; // 18000
const TOTAL_SECONDS = 60;

type Phase = "inhale" | "hold1" | "exhale" | "hold2";

function getPhase(elapsedInCycle: number): Phase {
  if (elapsedInCycle < INHALE_MS) return "inhale";
  if (elapsedInCycle < INHALE_MS + HOLD1_MS) return "hold1";
  if (elapsedInCycle < INHALE_MS + HOLD1_MS + EXHALE_MS) return "exhale";
  return "hold2";
}

const PHASE_LABEL: Record<Phase, string> = {
  inhale: "Inhale",
  hold1: "Hold",
  exhale: "Exhale",
  hold2: "Hold",
};

export default function Breathing() {
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState<Phase>("inhale");
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [done, setDone] = useState(false);
  const setView = useAppStore((s) => s.setView);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const gainRef = useRef<GainNode | null>(null);

  function startAudio() {
    try {
      const AudioContextCtor =
        window.AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = new AudioContextCtor();
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.connect(ctx.destination);
      gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 1.5);

      const makeChannel = (freq: number, pan: number) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq;
        const panner = ctx.createStereoPanner();
        panner.pan.value = pan;
        osc.connect(panner).connect(gain);
        osc.start();
        return osc;
      };

      const left = makeChannel(200, -1);
      const right = makeChannel(204, 1);

      audioCtxRef.current = ctx;
      gainRef.current = gain;
      oscillatorsRef.current = [left, right];
    } catch {
      // Si el navegador bloquea audio, la respiración sigue funcionando sin sonido.
    }
  }

  function stopAudio() {
    const ctx = audioCtxRef.current;
    const gain = gainRef.current;
    if (ctx && gain) {
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
      setTimeout(() => {
        oscillatorsRef.current.forEach((osc) => {
          try {
            osc.stop();
          } catch {}
        });
        ctx.close().catch(() => {});
      }, 700);
    }
    audioCtxRef.current = null;
    gainRef.current = null;
    oscillatorsRef.current = [];
  }

  function handleStart() {
    setStarted(true);
    startAudio();
    track("breathing_started");
  }

  function handleSkip() {
    stopAudio();
    setView("next-action");
  }

  useEffect(() => {
    if (!started) return;

    const startTime = Date.now();

    const phaseTimer = setInterval(() => {
      const elapsedInCycle = (Date.now() - startTime) % CYCLE_MS;
      setPhase(getPhase(elapsedInCycle));
    }, 100);

    const secondsTimer = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      setSecondsLeft(Math.max(TOTAL_SECONDS - elapsedSeconds, 0));
    }, 250);

    const endTimer = setTimeout(() => {
      clearInterval(phaseTimer);
      clearInterval(secondsTimer);
      stopAudio();
      track("breathing_completed");
      setDone(true);
      setTimeout(() => setView("next-action"), 900);
    }, TOTAL_SECONDS * 1000);

    return () => {
      clearInterval(phaseTimer);
      clearInterval(secondsTimer);
      clearTimeout(endTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  useEffect(() => {
    return () => stopAudio();
  }, []);

  if (done) {
    return (
      <Screen>
        <Statement>Ready.</Statement>
      </Screen>
    );
  }

  if (!started) {
    return (
      <Screen>
        <div className="flex flex-col gap-3">
          <Statement>Reset.</Statement>
          <Subtext>60 seconds. Nothing else.</Subtext>
        </div>
        <div className="rounded-2xl border border-stone-light bg-white/50 px-5 py-4">
          <p className="text-[14px] text-stone">
            Best used with headphones.
          </p>
        </div>
        <div className="w-full flex flex-col gap-4">
          <PrimaryButton onClick={handleStart}>Start</PrimaryButton>
          <TextLink onClick={() => setView("next-action")}>Skip</TextLink>
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <div className="flex flex-col gap-3">
        <Statement>Reset.</Statement>
      </div>

      <div className="h-56 w-56 flex items-center justify-center">
        <div
          className="h-40 w-40 rounded-full bg-accent/25 border border-accent-soft/40"
          style={{ animation: "breathe-cycle 18s ease-in-out infinite" }}
        />
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-[15px] tracking-wide text-stone">{PHASE_LABEL[phase]}</p>
        <p className="font-display text-[40px] tabular-nums text-ink">{secondsLeft}</p>
      </div>

      <TextLink onClick={handleSkip}>Skip</TextLink>

      <style jsx>{`
        @keyframes breathe-cycle {
          0% {
            transform: scale(0.55);
          }
          22.22% {
            transform: scale(1);
          }
          44.44% {
            transform: scale(1);
          }
          77.78% {
            transform: scale(0.55);
          }
          100% {
            transform: scale(0.55);
          }
        }
      `}</style>
    </Screen>
  );
}
