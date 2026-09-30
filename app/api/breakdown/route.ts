import { NextRequest, NextResponse } from "next/server";
import {
  BREAKDOWN_SYSTEM_PROMPT,
  buildBreakdownPrompt,
} from "@/lib/ai-prompt";
import { callClaude, parseJSONSafe } from "@/lib/anthropic";
import { matchCategory, type TaskCategory } from "@/lib/task-categories";

export const runtime = "nodejs";

interface BreakdownResponse {
  first_step: string;
  estimated_minutes: number;
}

// Primeros pasos concretos y físicos por categoría, sin devolverle la
// decisión al usuario ("Do this.", no "piensa cómo empezar esto.").
const FIRST_STEP_TEXT: Record<"en" | "es", Record<TaskCategory | "default", string>> = {
  en: {
    message: "Open your email and write just the subject line.",
    call: "Open your phone and find the number.",
    invoice: "Open your invoicing tool and type the client's name.",
    shopping: "Write down the first 3 items you need.",
    cleaning: "Pick up the closest single item and put it away.",
    meeting: "Open your calendar and check the time.",
    exercise: "Put on your workout shoes.",
    presentation: "Open a blank document and write only the title.",
    default: "Do one small thing right now: write the first word or line.",
  },
  es: {
    message: "Abre tu correo y escribe solo el asunto.",
    call: "Abre tu teléfono y busca el número.",
    invoice: "Abre tu herramienta de facturación y escribe el nombre del cliente.",
    shopping: "Escribe los primeros 3 productos que necesitas.",
    cleaning: "Levanta solo el objeto más cercano y guárdalo.",
    meeting: "Abre tu calendario y revisa la hora.",
    exercise: "Ponte los zapatos de entrenar.",
    presentation: "Abre un documento en blanco y escribe solo el título.",
    default: "Haz una sola cosa pequeña ahora: escribe la primera palabra o línea.",
  },
};

function heuristicFirstStep(taskTitle: string, locale: "en" | "es"): BreakdownResponse {
  const match = matchCategory(taskTitle);
  const text = FIRST_STEP_TEXT[locale][match?.category ?? "default"];
  return { first_step: text, estimated_minutes: 2 };
}

export async function POST(req: NextRequest) {
  try {
    const { taskTitle, stuckReason, locale } = await req.json();
    const safeLocale: "en" | "es" = locale === "es" ? "es" : "en";
    if (!taskTitle || (stuckReason !== "too_big" && stuckReason !== "dont_know_how")) {
      return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
    }

    try {
      const userPrompt = buildBreakdownPrompt({ taskTitle, stuckReason });
      const raw = await callClaude(BREAKDOWN_SYSTEM_PROMPT, userPrompt);
      const parsed = parseJSONSafe<BreakdownResponse>(raw);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json(heuristicFirstStep(taskTitle, safeLocale));
    }
  } catch {
    return NextResponse.json({ error: "No se pudo dividir la tarea." }, { status: 500 });
  }
}
