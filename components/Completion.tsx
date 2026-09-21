"use client";

import { useState } from "react";
import { Screen, Statement, SecondaryButton, PrimaryButton } from "./ui";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";

type Feeling = "easy" | "fine" | "hard";

export default function Completion() {
  const [stage, setStage] = useState<"feeling" | "ready">("feeling");
  const locale = useAppStore((s) => s.locale);
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
        <Statement>{t(locale, "completion.done")}</Statement>
        <div className="flex flex-col gap-3 w-full">
          <p className="text-[16px] text-stone mb-1">{t(locale, "completion.howDidItFeel")}</p>
          <SecondaryButton onClick={() => handleFeeling("easy")}>
            {t(locale, "completion.easy")}
          </SecondaryButton>
          <SecondaryButton onClick={() => handleFeeling("fine")}>
            {t(locale, "completion.fine")}
          </SecondaryButton>
          <SecondaryButton onClick={() => handleFeeling("hard")}>
            {t(locale, "completion.hard")}
          </SecondaryButton>
        </div>
      </Screen>
    );
  }

  const remaining = tasks.filter((t) => t.status === "pending").length;

  return (
    <Screen>
      <Statement>
        {remaining > 0 ? t(locale, "completion.readyForNext") : t(locale, "completion.everything")}
      </Statement>
      {remaining > 0 ? (
        <PrimaryButton onClick={handleShowMe}>{t(locale, "completion.showMe")}</PrimaryButton>
      ) : (
        <PrimaryButton onClick={() => setView("dump")}>
          {t(locale, "completion.newDump")}
        </PrimaryButton>
      )}
    </Screen>
  );
}
