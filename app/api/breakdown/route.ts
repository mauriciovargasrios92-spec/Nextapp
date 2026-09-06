import { NextRequest, NextResponse } from "next/server";
import {
  BREAKDOWN_SYSTEM_PROMPT,
  buildBreakdownPrompt,
} from "@/lib/ai-prompt";
import { callClaude, parseJSONSafe } from "@/lib/anthropic";

export const runtime = "nodejs";

interface BreakdownResponse {
  first_step: string;
  estimated_minutes: number;
}

function heuristicFirstStep(taskTitle: string): BreakdownResponse {
  return {
    first_step: `Abre lo necesario para "${taskTitle.toLowerCase()}" y da el primer paso pequeño.`,
    estimated_minutes: 2,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { taskTitle, stuckReason } = await req.json();
    if (!taskTitle || (stuckReason !== "too_big" && stuckReason !== "dont_know_how")) {
      return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
    }

    try {
      const userPrompt = buildBreakdownPrompt({ taskTitle, stuckReason });
      const raw = await callClaude(BREAKDOWN_SYSTEM_PROMPT, userPrompt);
      const parsed = parseJSONSafe<BreakdownResponse>(raw);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json(heuristicFirstStep(taskTitle));
    }
  } catch {
    return NextResponse.json({ error: "No se pudo dividir la tarea." }, { status: 500 });
  }
}
