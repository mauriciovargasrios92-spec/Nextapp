"use client";

import { useEffect, useRef, useState } from "react";
import { Screen, Statement, Subtext, PrimaryButton, TextLink } from "./ui";
import { useAppStore } from "@/lib/store";
import { track } from "@/lib/analytics";
import { t, SPEECH_LANG, type Locale, type TranslationKey } from "@/lib/i18n";

// Ciclo de respiración: 4s inhale, 4s hold, 6s exhale, 6s hold = 20s por ciclo.
// 60s / 20s = exactamente 3 ciclos completos.
const INHALE_S = 4;
const HOLD1_S = 4;
const EXHALE_S = 6;
const HOLD2_S = 6;
const CYCLE_S = INHALE_S + HOLD1_S + EXHALE_S + HOLD2_S; // 20
const TOTAL_SECONDS = 60;
const TOTAL_CYCLES = TOTAL_SECONDS / CYCLE_S; // 3

type Phase = "inhale" | "hold1" | "exhale" | "hold2";

function getPhaseInfo(elapsedInCycle: number): { phase: Phase; count: number } {
  if (elapsedInCycle < INHALE_S) {
    return { phase: "inhale", count: elapsedInCycle + 1 };
  }
  if (elapsedInCycle < INHALE_S + HOLD1_S) {
    return { phase: "hold1", count: elapsedInCycle - INHALE_S + 1 };
  }
  if (elapsedInCycle < INHALE_S + HOLD1_S + EXHALE_S) {
    return { phase: "exhale", count: elapsedInCycle - INHALE_S - HOLD1_S + 1 };
  }
  return { phase: "hold2", count: elapsedInCycle - INHALE_S - HOLD1_S - EXHALE_S + 1 };
}

const PHASE_LABEL: Record<Phase, TranslationKey> = {
  inhale: "breathing.inhale",
  hold1: "breathing.hold",
  exhale: "breathing.exhale",
  hold2: "breathing.hold",
};

function speak(text: string, locale: Locale) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = SPEECH_LANG[locale];
    utterance.rate = 0.82;
    utterance.pitch = 0.75;
    utterance.volume = 0.9;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Si la voz no está disponible, la respiración sigue funcionando sin ella.
  }
}

type Stage = "preStart" | "countdown" | "breathing" | "done";

export default function Breathing() {
  const [stage, setStage] = useState<Stage>("preStart");
  const [countdownValue, setCountdownValue] = useState(3);
  const [phase, setPhase] = useState<Phase>("inhale");
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const locale = useAppStore((s) => s.locale);
  const setView = useAppStore((s) => s.setView);

  // Las voces se generan dentro de timers; el ref evita usar un idioma desactualizado.
  const localeRef = useRef(locale);
  localeRef.current = locale;

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const gainRef = useRef<GainNode | null>(null);
  const lastSpokenKeyRef = useRef<string>("");

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
    window.speechSynthesis?.cancel();
  }

  function handleStart() {
    setStage("countdown");
    startAudio();
    track("breathing_started");
  }

  function handleSkip() {
    stopAudio();
    setView("next-action");
  }

  useEffect(() => {
    if (stage !== "countdown") return;

    setCountdownValue(3);
    speak("3", localeRef.current);
    const t2 = setTimeout(() => {
      setCountdownValue(2);
      speak("2", localeRef.current);
    }, 1000);
    const t1 = setTimeout(() => {
      setCountdownValue(1);
      speak("1", localeRef.current);
    }, 2000);
    const tGo = setTimeout(() => {
      setStage("breathing");
    }, 3000);

    return () => {
      clearTimeout(t2);
      clearTimeout(t1);
      clearTimeout(tGo);
    };
  }, [stage]);

  useEffect(() => {
    if (stage !== "breathing") return;

    const startTime = Date.now();
    lastSpokenKeyRef.current = "";

    const tick = () => {
      const elapsedMs = Date.now() - startTime;
      const elapsedSec = Math.floor(elapsedMs / 1000);
      const remaining = Math.max(TOTAL_SECONDS - elapsedSec, 0);
      setSecondsLeft(remaining);

      if (elapsedSec >= TOTAL_SECONDS) return;

      const cycleIndex = Math.floor(elapsedSec / CYCLE_S);
      const elapsedInCycle = elapsedSec % CYCLE_S;
      const { phase: currentPhase, count } = getPhaseInfo(elapsedInCycle);
      setPhase(currentPhase);

      const key = `${elapsedSec}`;
      if (lastSpokenKeyRef.current !== key) {
        lastSpokenKeyRef.current = key;
        const isLastCycle = cycleIndex === TOTAL_CYCLES - 1;
        const l = localeRef.current;
        if (count === 1) {
          if (currentPhase === "inhale") {
            speak(t(l, isLastCycle ? "breathing.say.last" : "breathing.say.in"), l);
          } else if (currentPhase === "exhale") {
            speak(t(l, "breathing.say.out"), l);
          } else {
            speak(t(l, "breathing.say.hold"), l);
          }
        } else {
          speak(String(count), l);
        }
      }
    };

    tick();
    const interval = setInterval(tick, 200);

    const endTimer = setTimeout(() => {
      clearInterval(interval);
      stopAudio();
      track("breathing_completed");
      setStage("done");
      setTimeout(() => setView("next-action"), 900);
    }, TOTAL_SECONDS * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(endTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  useEffect(() => {
    return () => stopAudio();
  }, []);

  if (stage === "done") {
    return (
      <Screen>
        <Statement>{t(locale, "breathing.ready")}</Statement>
      </Screen>
    );
  }

  if (stage === "preStart") {
    return (
      <Screen>
        <div className="flex flex-col gap-3">
          <Statement>{t(locale, "breathing.title")}</Statement>
          <Subtext>{t(locale, "breathing.duration")}</Subtext>
        </div>
        <div className="rounded-2xl border border-stone-light bg-white/50 px-5 py-4 flex flex-col gap-1">
          <p className="text-[14px] text-stone">{t(locale, "breathing.headphones")}</p>
          <p className="text-[14px] text-stone">{t(locale, "breathing.eyes")}</p>
        </div>
        <div className="w-full flex flex-col gap-4">
          <PrimaryButton onClick={handleStart}>{t(locale, "common.start")}</PrimaryButton>
          <TextLink onClick={() => setView("next-action")}>{t(locale, "common.skip")}</TextLink>
        </div>
      </Screen>
    );
  }

  if (stage === "countdown") {
    return (
      <Screen>
        <Subtext>{t(locale, "breathing.getReady")}</Subtext>
        <p className="font-display text-[64px] text-ink">{countdownValue}</p>
      </Screen>
    );
  }

  return (
    <Screen>
      <div className="flex flex-col gap-3">
        <Statement>{t(locale, "breathing.title")}</Statement>
      </div>

      <div className="h-56 w-56 flex items-center justify-center">
        <div
          className="h-40 w-40 rounded-full bg-accent/25 border border-accent-soft/40"
          style={{ animation: "breathe-cycle 20s ease-in-out infinite" }}
        />
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-[15px] tracking-wide text-stone">{t(locale, PHASE_LABEL[phase])}</p>
        <p className="font-display text-[40px] tabular-nums text-ink">{secondsLeft}</p>
      </div>

      <TextLink onClick={handleSkip}>{t(locale, "common.skip")}</TextLink>

      <style jsx>{`
        @keyframes breathe-cycle {
          0% {
            transform: scale(0.55);
          }
          20% {
            transform: scale(1);
          }
          40% {
            transform: scale(1);
          }
          70% {
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
