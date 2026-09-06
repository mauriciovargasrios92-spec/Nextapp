"use client";

import { useState } from "react";
import { Screen, Statement, SecondaryButton, PrimaryButton } from "./ui";
import { useAppStore } from "@/lib/store";

type Feeling = "easy" | "fine" | "hard";

export default function Completion() {
  const [stage, setStage] = useState<"feeling" | "ready">("feeling");
  const tasks = useAppStore((s) => s.tasks);
  const currentTaskId = useAppStore((s) => s.currentTaskId);
  const markTaskStatus = useAppStore((s) => s.markTaskStatus);
  const pickNextTask = useAppStore((s) => s.pickNextTask);
  const setView = useAppStore((s) => s.setView);

  function handleFeeling(feeling: Feeling) {
    if (currentTaskId) markTaskStatus(currentTaskId, "done", feeling);
    setStage("ready");
  }

  function handleShowMe() {
    const next = pickNextTask();
    if (!next) {
      setView("dump");
    } else {
      setView("next-action");
    }
  }

  if (stage === "feeling") {
    return (
      <Screen>
        <Statement>Done.</Statement>
        <div className="flex flex-col gap-3 w-full">
          <p className="text-[16px] text-stone mb-1">How did that feel?</p>
          <SecondaryButton onClick={() => handleFeeling("easy")}>Easy</SecondaryButton>
          <SecondaryButton onClick={() => handleFeeling("fine")}>Fine</SecondaryButton>
          <SecondaryButton onClick={() => handleFeeling("hard")}>Hard</SecondaryButton>
        </div>
      </Screen>
    );
  }

  const remaining = tasks.filter((t) => t.status === "pending").length;

  return (
    <Screen>
      <Statement>
        {remaining > 0 ? "Ready for the next one?" : "That was everything."}
      </Statement>
      {remaining > 0 ? (
        <PrimaryButton onClick={handleShowMe}>Show me</PrimaryButton>
      ) : (
        <PrimaryButton onClick={() => setView("dump")}>New brain dump</PrimaryButton>
      )}
    </Screen>
  );
}
