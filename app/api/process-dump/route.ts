import { NextRequest, NextResponse } from "next/server";
import { buildUserPrompt, SYSTEM_PROMPT } from "@/lib/ai-prompt";
import { callClaude, parseJSONSafe } from "@/lib/anthropic";
import type { AIRecommendation, Task } from "@/lib/types";

export const runtime = "nodejs";

interface RawTask {
  id: string;
  title: string;
  estimated_minutes: number;
  urgency: number;
  importance: number;
  energy_required: Task["energy_required"];
  can_break_down: boolean;
  first_step: string | null;
}

interface RawAIResponse {
  tasks: RawTask[];
  recommended_task_id: string;
  reason: string;
}

function toClientTasks(raw: RawAIResponse): AIRecommendation {
  const tasks: Task[] = raw.tasks.map((t) => ({
    id: t.id,
    title: t.title,
    estimated_minutes: t.estimated_minutes,
    urgency: t.urgency,
    importance: t.importance,
    energy_required: t.energy_required,
    can_break_down: t.can_break_down,
    first_step: t.first_step ?? undefined,
    status: "pending",
  }));
  return {
    tasks,
    recommended_task_id: raw.recommended_task_id,
    reason: raw.reason,
  };
}

/**
 * Fallback sin AI: separa el texto por comas/saltos de línea para que el
 * flujo completo se pueda probar aunque todavía no haya una ANTHROPIC_API_KEY
 * configurada. Es intencionalmente simple (no estima energía real, etc.).
 */
function heuristicFallback(text: string): AIRecommendation {
  const chunks = text
    .split(/[,\n]|(?<=\.)\s(?=[A-ZÁÉÍÓÚÑ])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  const tasks: Task[] = chunks.slice(0, 8).map((title, i) => ({
    id: `t${i + 1}`,
    title: title.charAt(0).toUpperCase() + title.slice(1),
    estimated_minutes: title.length > 40 ? 25 : 10,
    urgency: i === 0 ? 4 : 3,
    importance: 3,
    energy_required: title.length > 40 ? "high" : "medium",
    can_break_down: title.length > 40,
    status: "pending",
  }));

  if (tasks.length === 0) {
    tasks.push({
      id: "t1",
      title: text.slice(0, 60) || "Revisar mis pendientes",
      estimated_minutes: 10,
      urgency: 3,
      importance: 3,
      energy_required: "medium",
      can_break_down: false,
      status: "pending",
    });
  }

  return {
    tasks,
    recommended_task_id: tasks[0].id,
    reason: "fallback heurístico (sin ANTHROPIC_API_KEY configurada)",
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      text,
      completedTasks = [],
      rejectedTasks = [],
    }: { text: string; completedTasks?: string[]; rejectedTasks?: string[] } =
      body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "El brain dump está vacío." },
        { status: 400 }
      );
    }

    try {
      const userPrompt = buildUserPrompt({
        brainDumpText: text,
        completedTasks,
        rejectedTasks,
        currentTimeISO: new Date().toISOString(),
      });
      const raw = await callClaude(SYSTEM_PROMPT, userPrompt);
      const parsed = parseJSONSafe<RawAIResponse>(raw);
      return NextResponse.json(toClientTasks(parsed));
    } catch (err) {
      // Sin API key o error del modelo: no rompemos la demo, usamos fallback.
      const fallback = heuristicFallback(text);
      return NextResponse.json(fallback);
    }
  } catch (e) {
    return NextResponse.json(
      { error: "No se pudo procesar el brain dump." },
      { status: 500 }
    );
  }
}
