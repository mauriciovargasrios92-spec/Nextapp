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

type ExerciseId = "sigh" | "shake" | "grounding";
type Stage = "select" | "intro" | "run" | "done";

interface ExerciseInfo {
  title: string;
  blurb: string;
  intro: string;
}

const EXERCISES: Record<ExerciseId, ExerciseInfo> = {
  sigh: {
    title: "Physiological sigh",
    blurb: "30 seconds",
    intro: "Two short breaths in through your nose, one long breath out through your mouth.",
  },
  shake: {
    title: "Shake it out",
    blurb: "20 seconds",
    intro: "Shake your hands, arms and shoulders. Let the tension go.",
  },
  grounding: {
    title: "5-4-3-2-1 grounding",
    blurb: "At your own pace",
    intro: "Five quick steps. Name what you notice, out loud or in your head.",
  },
};

const ORDER: ExerciseId[] = ["sigh", "shake", "grounding"];

// Physiological sigh: 2s inhale + 1s second inhale + 3s exhale = 6s por ciclo.
// 30s / 6s = exactamente 5 ciclos.
const SIGH_SECONDS = 30;
const SIGH_CYCLE_S = 6;
const SIGH_INHALE_S = 2;
const SIGH_TOP_UP_S = 1;

// Shake it out: 20s repartidos entre manos, brazos y hombros.
const SHAKE_SECONDS = 20;
const SHAKE_PROMPTS = [
  { until: 7, text: "Shake your hands" },
  { until: 14, text: "Now your arms" },
  { until: SHAKE_SECONDS, text: "Now your shoulders" },
];

const GROUNDING_STEPS = [
  { count: 5, text: "things you can see" },
  { count: 4, text: "things you can feel" },
  { count: 3, text: "things you can hear" },
  { count: 2, text: "things you can smell" },
  { count: 1, text: "thing you can taste" },
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
  const elapsed = useExerciseClock(SIGH_SECONDS, onDone);
  const secondsLeft = Math.ceil(SIGH_SECONDS - elapsed);
  const inCycle = elapsed % SIGH_CYCLE_S;

  const label =
    inCycle < SIGH_INHALE_S
      ? "Breathe in"
      : inCycle < SIGH_INHALE_S + SIGH_TOP_UP_S
      ? "Breathe in again"
      : "Long breath out";

  return (
    <Screen>
      <Statement>Physiological sigh</Statement>

      <div className="h-56 w-56 flex items-center justify-center">
        <div
          className="h-40 w-40 rounded-full bg-accent/25 border border-accent-soft/40"
          style={{ animation: `sigh-cycle ${SIGH_CYCLE_S}s ease-in-out infinite` }}
        />
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-[15px] tracking-wide text-stone">{label}</p>
        <p className="font-display text-[40px] tabular-nums text-ink">{secondsLeft}</p>
      </div>

      <TextLink onClick={onSkip}>Skip</TextLink>

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
  const elapsed = useExerciseClock(SHAKE_SECONDS, onDone);
  const secondsLeft = Math.ceil(SHAKE_SECONDS - elapsed);
  const prompt = (SHAKE_PROMPTS.find((p) => elapsed < p.until) ?? SHAKE_PROMPTS[2]).text;

  return (
    <Screen>
      <Statement>Shake it out</Statement>

      <div className="flex flex-col items-center gap-6">
        <p className="text-[17px] text-ink">{prompt}</p>
        <p className="font-display text-[56px] tabular-nums text-ink">{secondsLeft}</p>
      </div>

      <TextLink onClick={onSkip}>Skip</TextLink>
    </Screen>
  );
}

function GroundingRun({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const [step, setStep] = useState(0);
  const current = GROUNDING_STEPS[step];
  const isLast = step === GROUNDING_STEPS.length - 1;

  return (
    <Screen>
      <SmallLabel>
        Step {step + 1} of {GROUNDING_STEPS.length}
      </SmallLabel>

      <div className="flex flex-col items-center gap-4">
        <p className="font-display text-[64px] text-ink">{current.count}</p>
        <Statement>{current.text}</Statement>
        <Subtext>Take your time.</Subtext>
      </div>

      <div className="w-full flex flex-col gap-4">
        <PrimaryButton onClick={() => (isLast ? onDone() : setStep(step + 1))}>
          {isLast ? "Done" : "Next"}
        </PrimaryButton>
        <TextLink onClick={onBack}>Back</TextLink>
      </div>
    </Screen>
  );
}

export default function ResetExercises() {
  const [stage, setStage] = useState<Stage>("select");
  const [exercise, setExercise] = useState<ExerciseId | null>(null);
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
        <Statement>Are we ready now?</Statement>
        <div className="w-full">
          <PrimaryButton onClick={() => setView("next-action")}>Start again</PrimaryButton>
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
    const info = EXERCISES[exercise];
    return (
      <Screen>
        <div className="flex flex-col gap-3">
          <Statement>{info.title}</Statement>
          <Subtext>{info.intro}</Subtext>
        </div>
        <div className="w-full flex flex-col gap-4">
          <PrimaryButton onClick={handleStart}>Start</PrimaryButton>
          <TextLink onClick={handleBackToSelect}>Back</TextLink>
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <div className="flex flex-col gap-3">
        <Statement>Quick reset.</Statement>
        <Subtext>Pick one. Nothing else.</Subtext>
      </div>
      <div className="w-full flex flex-col gap-3">
        {ORDER.map((id) => (
          <SecondaryButton key={id} onClick={() => handlePick(id)}>
            <span className="block">{EXERCISES[id].title}</span>
            <span className="block text-[13px] text-stone font-normal">
              {EXERCISES[id].blurb}
            </span>
          </SecondaryButton>
        ))}
      </div>
      <TextLink onClick={() => setView("next-action")}>Back</TextLink>
    </Screen>
  );
}
