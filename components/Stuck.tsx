"use client";

import { useState } from "react";
import { Screen, Statement, SecondaryButton, TextLink } from "./ui";
import { useAppStore } from "@/lib/store";
import { t, type TranslationKey } from "@/lib/i18n";
import type { StuckReason } from "@/lib/types";

const OPTIONS: { reason: StuckReason; label: TranslationKey }[] = [
  { reason: "too_big", label: "stuck.tooBig" },
  { reason: "dont_know_how", label: "stuck.dontKnowHow" },
  { reason: "low_energy", label: "stuck.lowEnergy" },
  { reason: "overwhelmed", label: "stuck.overwhelmed" },
];

export default function Stuck() {
  const [loading, setLoading] = useState(false);

  const locale = useAppStore((s) => s.locale);
  const tasks = useAppStore((s) => s.tasks);
  const currentTaskId = useAppStore((s) => s.currentTaskId);
  const setView = useAppStore((s) => s.setView);
  const overrideFirstStep = useAppStore((s) => s.overrideCurrentTaskFirstStep);
  const setCurrentTask = useAppStore((s) => s.setCurrentTask);

  const task = tasks.find((t) => t.id === currentTaskId);

  async function handleOption(reason: StuckReason) {
    if (reason === "overwhelmed") {
      setView("reset");
      return;
    }

    if (reason === "low_energy") {
      const easier = [...tasks]
        .filter((t) => t.status === "pending" || t.id === currentTaskId)
        .sort((a, b) => {
          const energyScore = { low: 0, medium: 1, high: 2 };
          return (
            energyScore[a.energy_required] - energyScore[b.energy_required] ||
            a.estimated_minutes - b.estimated_minutes
          );
        })[0];
      if (easier) setCurrentTask(easier.id);
      setView("next-action");
      return;
    }

    // too_big | dont_know_how -> pedir a la AI el primer paso concreto
    if (!task) {
      setView("next-action");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskTitle: task.title, stuckReason: reason }),
      });
      const data = await res.json();
      overrideFirstStep(data.first_step);
    } finally {
      setLoading(false);
      setView("next-action");
    }
  }

  return (
    <Screen>
      <Statement>{t(locale, "stuck.title")}</Statement>
      <div className="w-full flex flex-col gap-3">
        {OPTIONS.map((opt) => (
          <SecondaryButton
            key={opt.reason}
            disabled={loading}
            onClick={() => handleOption(opt.reason)}
          >
            {t(locale, opt.label)}
          </SecondaryButton>
        ))}
      </div>
      <div className="flex flex-col items-center gap-4">
        <TextLink disabled={loading} onClick={() => setView("reset")}>
          {t(locale, "stuck.quickReset")}
        </TextLink>
        <TextLink onClick={() => setView("next-action")}>{t(locale, "common.back")}</TextLink>
      </div>
    </Screen>
  );
}
