"use client";

import { useState } from "react";
import { Screen, Statement, SecondaryButton, PrimaryButton, TextLink } from "./ui";
import { useAppStore } from "@/lib/store";
import type { StuckReason } from "@/lib/types";

const OPTIONS: { reason: StuckReason; label: string }[] = [
  { reason: "too_big", label: "It feels too big" },
  { reason: "dont_know_how", label: "I don't know how to start" },
  { reason: "low_energy", label: "I don't have the energy" },
  { reason: "overwhelmed", label: "I'm overwhelmed" },
];

export default function Stuck() {
  const [offerReset, setOfferReset] = useState(false);
  const [loading, setLoading] = useState(false);

  const tasks = useAppStore((s) => s.tasks);
  const currentTaskId = useAppStore((s) => s.currentTaskId);
  const setView = useAppStore((s) => s.setView);
  const overrideFirstStep = useAppStore((s) => s.overrideCurrentTaskFirstStep);
  const setCurrentTask = useAppStore((s) => s.setCurrentTask);

  const task = tasks.find((t) => t.id === currentTaskId);

  async function handleOption(reason: StuckReason) {
    if (reason === "overwhelmed") {
      setOfferReset(true);
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

  if (offerReset) {
    return (
      <Screen>
        <Statement>Reset for 60 seconds?</Statement>
        <div className="w-full flex flex-col gap-4">
          <PrimaryButton onClick={() => setView("breathing")}>Yes</PrimaryButton>
          <TextLink onClick={() => setView("next-action")}>Skip</TextLink>
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <Statement>What&apos;s getting in the way?</Statement>
      <div className="w-full flex flex-col gap-3">
        {OPTIONS.map((opt) => (
          <SecondaryButton
            key={opt.reason}
            disabled={loading}
            onClick={() => handleOption(opt.reason)}
          >
            {opt.label}
          </SecondaryButton>
        ))}
      </div>
      <TextLink onClick={() => setView("next-action")}>Back</TextLink>
    </Screen>
  );
}
