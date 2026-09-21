"use client";

import { useEffect, useRef, useState } from "react";
import {
  Screen,
  Statement,
  Subtext,
  SmallLabel,
  PrimaryButton,
  SecondaryButton,
  TextLink,
} from "./ui";
import { useAppStore } from "@/lib/store";
import { track } from "@/lib/analytics";
import { t, type TranslationKey } from "@/lib/i18n";

type ExerciseId = "sigh" | "shake" | "grounding";
type Stage = "select" | "intro" | "run" | "done";

const ORDER: ExerciseId[] = ["sigh", "shake", "grounding"];

// Physiological sigh: 2s inhale + 1s second inhale + 3s exhale = 6s por ciclo.
// 30s / 6s = exactamente 5 ciclos.
const SIGH_SECONDS = 30;
const SIGH_CYCLE_S = 6;
const SIGH_INHALE_S = 2;
const SIGH_TOP_UP_S = 1;

// Shake it out: 20s repartidos entre manos, brazos y hombros.
const SHAKE_SECONDS = 20;
const SHAKE_PROMPTS: { until: number; text: TranslationKey }[] = [
  { until: 7, text: "reset.shake.hands" },
  { until: 14, text: "reset.shake.arms" },
  { until: SHAKE_SECONDS, text: "reset.shake.shoulders" },
];

const GROUNDING_STEPS: { count: number; text: TranslationKey }[] = [
  { count: 5, text: "reset.grounding.see" },
  { count: 4, text: "reset.grounding.feel" },
  { count: 3, text: "reset.grounding.hear" },
  { count: 2, text: "reset.grounding.smell" },
  { count: 1, text: "reset.grounding.taste" },
];

// Segundos transcurridos desde que se monta; llama onDone una vez al llegar a `total`.
function useExerciseClock(total: number, onDone: () => void) {
  const [elapsed, setElapsed] = useState(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const seconds = (Date.now() - start) / 1000;
      if (seconds >= total) {
        clearInterval(interval);
        setElapsed(total);
        onDoneRef.current();
        return;
      }
      setElapsed(seconds);
    }, 200);
    return () => clearInterval(interval);
  }, [total]);

  return elapsed;
}

function SighRun({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const locale = useAppStore((s) => s.locale);
  const elapsed = useExerciseClock(SIGH_SECONDS, onDone);
  const secondsLeft = Math.ceil(SIGH_SECONDS - elapsed);
  const inCycle = elapsed % SIGH_CYCLE_S;

  const label: TranslationKey =
    inCycle < SIGH_INHALE_S
      ? "reset.sigh.in"
      : inCycle < SIGH_INHALE_S + SIGH_TOP_UP_S
      ? "reset.sigh.inAgain"
      : "reset.sigh.out";

  return (
    <Screen>
      <Statement>{t(locale, "reset.sigh.title")}</Statement>

      <div className="h-56 w-56 flex items-center justify-center">
        <div
          className="h-40 w-40 rounded-full bg-accent/25 border border-accent-soft/40"
          style={{ animation: `sigh-cycle ${SIGH_CYCLE_S}s ease-in-out infinite` }}
        />
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-[15px] tracking-wide text-stone">{t(locale, label)}</p>
        <p className="font-display text-[40px] tabular-nums text-ink">{secondsLeft}</p>
      </div>

      <TextLink onClick={onSkip}>{t(locale, "common.skip")}</TextLink>

      <style jsx>{`
        @keyframes sigh-cycle {
          0% {
            transform: scale(0.55);
          }
          33% {
            transform: scale(0.8);
          }
          50% {
            transform: scale(1);
          }
          100% {
            transform: scale(0.55);
          }
        }
      `}</style>
    </Screen>
  );
}

function ShakeRun({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const locale = useAppStore((s) => s.locale);
  const elapsed = useExerciseClock(SHAKE_SECONDS, onDone);
  const secondsLeft = Math.ceil(SHAKE_SECONDS - elapsed);
  const prompt = (SHAKE_PROMPTS.find((p) => elapsed < p.until) ?? SHAKE_PROMPTS[2]).text;

  return (
    <Screen>
      <Statement>{t(locale, "reset.shake.title")}</Statement>

      <div className="flex flex-col items-center gap-6">
        <p className="text-[17px] text-ink">{t(locale, prompt)}</p>
        <p className="font-display text-[56px] tabular-nums text-ink">{secondsLeft}</p>
      </div>

      <TextLink onClick={onSkip}>{t(locale, "common.skip")}</TextLink>
    </Screen>
  );
}

function GroundingRun({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const [step, setStep] = useState(0);
  const locale = useAppStore((s) => s.locale);
  const current = GROUNDING_STEPS[step];
  const isLast = step === GROUNDING_STEPS.length - 1;

  return (
    <Screen>
      <SmallLabel>
        {t(locale, "reset.grounding.step", { n: step + 1, total: GROUNDING_STEPS.length })}
      </SmallLabel>

      <div className="flex flex-col items-center gap-4">
        <p className="font-display text-[64px] text-ink">{current.count}</p>
        <Statement>{t(locale, current.text)}</Statement>
        <Subtext>{t(locale, "reset.grounding.takeYourTime")}</Subtext>
      </div>

      <div className="w-full flex flex-col gap-4">
        <PrimaryButton onClick={() => (isLast ? onDone() : setStep(step + 1))}>
          {t(locale, isLast ? "common.done" : "common.next")}
        </PrimaryButton>
        <TextLink onClick={onBack}>{t(locale, "common.back")}</TextLink>
      </div>
    </Screen>
  );
}

export default function ResetExercises() {
  const [stage, setStage] = useState<Stage>("select");
  const [exercise, setExercise] = useState<ExerciseId | null>(null);
  const locale = useAppStore((s) => s.locale);
  const setView = useAppStore((s) => s.setView);

  function handlePick(id: ExerciseId) {
    setExercise(id);
    setStage("intro");
  }

  function handleBackToSelect() {
    setExercise(null);
    setStage("select");
  }

  function handleStart() {
    if (!exercise) return;
    track("reset_started", { exercise });
    setStage("run");
  }

  function handleDone() {
    if (exercise) track("reset_completed", { exercise });
    setStage("done");
  }

  if (stage === "done") {
    return (
      <Screen>
        <Statement>{t(locale, "reset.ready")}</Statement>
        <div className="w-full">
          <PrimaryButton onClick={() => setView("next-action")}>
            {t(locale, "reset.startAgain")}
          </PrimaryButton>
        </div>
      </Screen>
    );
  }

  if (stage === "run" && exercise) {
    if (exercise === "sigh") {
      return <SighRun onDone={handleDone} onSkip={handleBackToSelect} />;
    }
    if (exercise === "shake") {
      return <ShakeRun onDone={handleDone} onSkip={handleBackToSelect} />;
    }
    return <GroundingRun onDone={handleDone} onBack={handleBackToSelect} />;
  }

  if (stage === "intro" && exercise) {
    return (
      <Screen>
        <div className="flex flex-col gap-3">
          <Statement>{t(locale, `reset.${exercise}.title`)}</Statement>
          <Subtext>{t(locale, `reset.${exercise}.intro`)}</Subtext>
        </div>
        <div className="w-full flex flex-col gap-4">
          <PrimaryButton onClick={handleStart}>{t(locale, "common.start")}</PrimaryButton>
          <TextLink onClick={handleBackToSelect}>{t(locale, "common.back")}</TextLink>
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <div className="flex flex-col gap-3">
        <Statement>{t(locale, "reset.title")}</Statement>
        <Subtext>{t(locale, "reset.subtitle")}</Subtext>
      </div>
      <div className="w-full flex flex-col gap-3">
        {ORDER.map((id) => (
          <SecondaryButton key={id} onClick={() => handlePick(id)}>
            <span className="block">{t(locale, `reset.${id}.title`)}</span>
            <span className="block text-[13px] text-stone font-normal">
              {t(locale, `reset.${id}.blurb`)}
            </span>
          </SecondaryButton>
        ))}
      </div>
      <TextLink onClick={() => setView("next-action")}>{t(locale, "common.back")}</TextLink>
    </Screen>
  );
}
