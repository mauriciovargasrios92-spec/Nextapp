"use client";

import { useState } from "react";
import { Screen, Statement, SmallLabel, PrimaryButton, TextLink } from "./ui";
import { useAppStore } from "@/lib/store";
import { track } from "@/lib/analytics";
import { t } from "@/lib/i18n";
import { fetchFirstStep } from "@/lib/stuck-flow";

export default function NextAction() {
  const [loading, setLoading] = useState(false);
  const locale = useAppStore((s) => s.locale);
  const tasks = useAppStore((s) => s.tasks);
  const currentTaskId = useAppStore((s) => s.currentTaskId);
  const setView = useAppStore((s) => s.setView);
  const markTaskStatus = useAppStore((s) => s.markTaskStatus);
  const pickNextTask = useAppStore((s) => s.pickNextTask);
  const incrementStuckCount = useAppStore((s) => s.incrementStuckCount);
  const overrideFirstStep = useAppStore((s) => s.overrideCurrentTaskFirstStep);
  const setFocusOverrideMinutes = useAppStore((s) => s.setFocusOverrideMinutes);

  const task = tasks.find((t) => t.id === currentTaskId);
  const waitingCount = tasks.filter(
    (t) => t.status === "pending" && t.id !== currentTaskId
  ).length;

  if (!task) {
    return (
      <Screen>
        <Statement>{t(locale, "nextAction.allClear")}</Statement>
        <TextLink onClick={() => setView("dump")}>
          {t(locale, "nextAction.newDump")}
        </TextLink>
      </Screen>
    );
  }

  function handleStart() {
    if (!task) return;
    markTaskStatus(task.id, "active");
    track("task_started", { task_id: task.id });
    setView("focus");
  }

  function handleJust2Min() {
    if (!task) return;
    markTaskStatus(task.id, "active");
    track("task_started", { task_id: task.id, mode: "2min" });
    setFocusOverrideMinutes(2);
    setView("focus");
  }

  function handleNotNow() {
    if (!task) return;
    markTaskStatus(task.id, "skipped");
    track("task_skipped", { task_id: task.id });
    const next = pickNextTask();
    if (!next) setView("dump");
  }

  // "Never miss twice" (Atomic Habits): si ya se tocó "stuck" antes en esta
  // misma tarea sin resolverla, la segunda vez no se vuelve a preguntar qué
  // se interpone — se asume que el primer paso ofrecido no alcanzó y se
  // pide directo uno todavía más pequeño.
  async function handleStuck() {
    if (!task) return;
    const count = incrementStuckCount(task.id);
    track("stuck_clicked", { task_id: task.id, count });

    if (count >= 2) {
      setLoading(true);
      try {
        const firstStep = await fetchFirstStep(task.title, "too_big", locale);
        overrideFirstStep(firstStep);
      } finally {
        setLoading(false);
      }
      return;
    }

    setView("stuck");
  }

  return (
    <Screen>
      <div className="flex flex-col gap-4">
        <SmallLabel>{t(locale, "nextAction.forgetRest")}</SmallLabel>
        <Statement>{task.first_step ?? task.title}</Statement>
        <SmallLabel>{t(locale, "nextAction.about", { n: task.estimated_minutes })}</SmallLabel>
      </div>

      <div className="w-full flex flex-col gap-4">
        <PrimaryButton onClick={handleStart} disabled={loading}>
          {t(locale, "common.start")}
        </PrimaryButton>
        <TextLink onClick={handleJust2Min} disabled={loading}>
          {t(locale, "nextAction.just2min")}
        </TextLink>
        <div className="flex justify-center gap-6">
          <TextLink onClick={handleStuck} disabled={loading}>
            {t(locale, "common.stuck")}
          </TextLink>
          <TextLink onClick={handleNotNow} disabled={loading}>
            {t(locale, "nextAction.notNow")}
          </TextLink>
        </div>
      </div>

      {waitingCount > 0 && (
        <SmallLabel>{t(locale, "nextAction.waiting", { n: waitingCount })}</SmallLabel>
      )}
    </Screen>
  );
}
