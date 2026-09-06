"use client";

import { Screen, Statement, SmallLabel, PrimaryButton, TextLink } from "./ui";
import { useAppStore } from "@/lib/store";
import { track } from "@/lib/analytics";

export default function NextAction() {
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
        <Statement>All clear.</Statement>
        <TextLink onClick={() => setView("dump")}>Start a new brain dump</TextLink>
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
        <SmallLabel>Forget the rest for now.</SmallLabel>
        <Statement>{task.first_step ?? task.title}</Statement>
        <SmallLabel>About {task.estimated_minutes} min</SmallLabel>
      </div>

      <div className="w-full flex flex-col gap-4">
        <PrimaryButton onClick={handleStart}>Start</PrimaryButton>
        <div className="flex justify-center gap-6">
          <TextLink onClick={handleStuck}>I&apos;m stuck</TextLink>
          <TextLink onClick={handleNotNow}>Not now</TextLink>
        </div>
      </div>

      {waitingCount > 0 && <SmallLabel>{waitingCount} things waiting</SmallLabel>}
    </Screen>
  );
}
