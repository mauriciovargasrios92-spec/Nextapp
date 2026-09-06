"use client";

import { useState } from "react";
import { Screen, Statement, PrimaryButton } from "./ui";
import { useAppStore } from "@/lib/store";
import { supabase, getCurrentUserId, DEMO_USER_ID } from "@/lib/supabase";
import { track } from "@/lib/analytics";
import { v4 as uuidv4 } from "uuid";
import type { AIRecommendation } from "@/lib/types";

const PLACEHOLDER =
  "I need to reply to Sarah, send an invoice, work out, buy groceries, edit a video…";

export default function BrainDump() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const startDump = useAppStore((s) => s.startDump);
  const setTasks = useAppStore((s) => s.setTasks);
  const setView = useAppStore((s) => s.setView);

  async function handleClearMyHead() {
    if (!text.trim() || loading) return;
    setLoading(true);

    const brainDumpId = uuidv4();
    startDump(brainDumpId, text);
    track("brain_dump_created", { length: text.length });

    if (supabase) {
      const userId = await getCurrentUserId();
      await supabase.from("brain_dumps").insert({
        id: brainDumpId,
        user_id: userId ?? DEMO_USER_ID,
        original_text: text,
      });
    }

    try {
      const res = await fetch("/api/process-dump", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, completedTasks: [], rejectedTasks: [] }),
      });
      const data: AIRecommendation = await res.json();
      setTasks(data.tasks, data.recommended_task_id);

      if (supabase && data.tasks.length > 0) {
        const userId = await getCurrentUserId();
        await supabase.from("tasks").insert(
          data.tasks.map((t) => ({
            user_id: userId ?? DEMO_USER_ID,
            brain_dump_id: brainDumpId,
            title: t.title,
            estimated_minutes: t.estimated_minutes,
            status: "pending",
            energy_required: t.energy_required,
            urgency: t.urgency,
            importance: t.importance,
          }))
        );
      }
    } catch {
      setView("dump");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <div className="w-full flex flex-col gap-6">
        <Statement>What&apos;s on your mind?</Statement>
        <div className="relative w-full">
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={PLACEHOLDER}
            rows={7}
            className="w-full resize-none rounded-2xl border border-stone-light bg-white/60 p-5 pr-14 text-[16px] leading-relaxed text-ink placeholder:text-stone/70 focus:border-accent-soft outline-none"
          />
          <button
            type="button"
            aria-label="Entrada de voz (próximamente)"
            title="Entrada de voz (próximamente)"
            className="absolute bottom-4 right-4 h-9 w-9 rounded-full border border-stone-light flex items-center justify-center text-stone hover:text-ink hover:border-stone transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 15a3 3 0 003-3V6a3 3 0 10-6 0v6a3 3 0 003 3z"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M19 11a7 7 0 01-14 0M12 19v3"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
      <PrimaryButton onClick={handleClearMyHead} disabled={!text.trim() || loading}>
        {loading ? "Clearing…" : "Clear my head"}
      </PrimaryButton>
    </Screen>
  );
}
