"use client";

import { useEffect, useRef, useState } from "react";
import { Screen, Statement, PrimaryButton, SecondaryButton, TextLink } from "./ui";
import { useAppStore } from "@/lib/store";
import { track } from "@/lib/analytics";
import { t } from "@/lib/i18n";
import { fetchFirstStep } from "@/lib/stuck-flow";

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function Focus() {
  const locale = useAppStore((s) => s.locale);
  const tasks = useAppStore((s) => s.tasks);
  const currentTaskId = useAppStore((s) => s.currentTaskId);
  const setView = useAppStore((s) => s.setView);
  const markTaskStatus = useAppStore((s) => s.markTaskStatus);
  const incrementStuckCount = useAppStore((s) => s.incrementStuckCount);
  const overrideFirstStep = useAppStore((s) => s.overrideCurrentTaskFirstStep);
  const setFocusOverrideMinutes = useAppStore((s) => s.setFocusOverrideMinutes);
  const focusOverrideMinutesFromStore = useAppStore((s) => s.focusOverrideMinutes);

  const task = tasks.find((t) => t.id === currentTaskId);

  // "Just 2 minutes" (regla de los 2 minutos de Atomic Habits) fuerza el
  // timer aunque la tarea en sí dure más — se consume una sola vez.
  const [overrideMinutes] = useState(() => focusOverrideMinutesFromStore);
  useEffect(() => {
    if (overrideMinutes !== null) setFocusOverrideMinutes(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalSeconds = (overrideMinutes ?? task?.estimated_minutes ?? 5) * 60;
  const [remaining, setRemaining] = useState(totalSeconds);
  const [stuckLoading, setStuckLoading] = useState(false);
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    const interval = setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTaskId]);

  useEffect(() => {
    if (!task) setView("next-action");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task]);

  if (!task) return null;

  const elapsedMinutes = Math.round((Date.now() - startRef.current) / 60000);

  function handleDone() {
    markTaskStatus(task!.id, "done");
    track("task_completed", { task_id: task!.id, actual_minutes: elapsedMinutes || 1 });
    setView("completion");
  }

  function handleStop() {
    markTaskStatus(task!.id, "pending");
    setView("next-action");
  }

  // Misma regla "never miss twice" que en NextAction: la segunda vez seguida
  // que se pide ayuda en esta tarea, se salta el menú y se pide un paso más chico.
  async function handleStuck() {
    if (!task) return;
    const count = incrementStuckCount(task.id);
    track("stuck_clicked", { task_id: task.id, count });

    if (count >= 2) {
      setStuckLoading(true);
      try {
        const firstStep = await fetchFirstStep(task.title, "too_big", locale);
        overrideFirstStep(firstStep);
      } finally {
        setStuckLoading(false);
        setView("next-action");
      }
      return;
    }

    setView("stuck");
  }

  return (
    <Screen>
      <div className="flex flex-col gap-8 items-center">
        <Statement>{task.first_step ?? task.title}</Statement>
        <p className="font-display text-[56px] tabular-nums text-ink">
          {formatTime(remaining)}
        </p>
      </div>

      <div className="w-full flex flex-col gap-4">
        <PrimaryButton onClick={handleDone}>{t(locale, "common.done")}</PrimaryButton>
        <SecondaryButton onClick={handleStuck} disabled={stuckLoading}>
          {t(locale, "common.stuck")}
        </SecondaryButton>
        <TextLink onClick={handleStop}>{t(locale, "focus.stop")}</TextLink>
      </div>
    </Screen>
  );
}
