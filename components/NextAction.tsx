"use client";

import { Screen, Statement, SmallLabel, PrimaryButton, TextLink } from "./ui";
import { useAppStore } from "@/lib/store";
import { track } from "@/lib/analytics";
import { t } from "@/lib/i18n";

export default function NextAction() {
  const locale = useAppStore((s) => s.locale);
  const tasks = useAppStore((s) => s.tasks);
  const currentTaskId = useAppStore((s) => s.currentTaskId);
  const setView = useAppStore((s) => s.setView);
  const markTaskStatus = useAppStore((s) => s.markTaskStatus);
  const pickNextTask = useAppStore((s) => s.pickNextTask);

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

  function handleNotNow() {
    if (!task) return;
    markTaskStatus(task.id, "skipped");
    track("task_skipped", { task_id: task.id });
    const next = pickNextTask();
    if (!next) setView("dump");
  }

  function handleStuck() {
    track("stuck_clicked", { task_id: task?.id });
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
        <PrimaryButton onClick={handleStart}>{t(locale, "common.start")}</PrimaryButton>
        <div className="flex justify-center gap-6">
          <TextLink onClick={handleStuck}>{t(locale, "common.stuck")}</TextLink>
          <TextLink onClick={handleNotNow}>{t(locale, "nextAction.notNow")}</TextLink>
        </div>
      </div>

      {waitingCount > 0 && (
        <SmallLabel>{t(locale, "nextAction.waiting", { n: waitingCount })}</SmallLabel>
      )}
    </Screen>
  );
}
