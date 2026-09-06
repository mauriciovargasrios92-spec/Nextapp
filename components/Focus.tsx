"use client";

import { useEffect, useRef, useState } from "react";
import { Screen, Statement, PrimaryButton, SecondaryButton, TextLink } from "./ui";
import { useAppStore } from "@/lib/store";
import { track } from "@/lib/analytics";

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
  const tasks = useAppStore((s) => s.tasks);
  const currentTaskId = useAppStore((s) => s.currentTaskId);
  const setView = useAppStore((s) => s.setView);
  const markTaskStatus = useAppStore((s) => s.markTaskStatus);

  const task = tasks.find((t) => t.id === currentTaskId);
  const totalSeconds = (task?.estimated_minutes ?? 5) * 60;
  const [remaining, setRemaining] = useState(totalSeconds);
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

  return (
    <Screen>
      <div className="flex flex-col gap-8 items-center">
        <Statement>{task.first_step ?? task.title}</Statement>
        <p className="font-display text-[56px] tabular-nums text-ink">
          {formatTime(remaining)}
        </p>
      </div>

      <div className="w-full flex flex-col gap-4">
        <PrimaryButton onClick={handleDone}>Done</PrimaryButton>
        <SecondaryButton onClick={() => setView("stuck")}>I&apos;m stuck</SecondaryButton>
        <TextLink onClick={handleStop}>Stop</TextLink>
      </div>
    </Screen>
  );
}
