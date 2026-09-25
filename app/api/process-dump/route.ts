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
 * Diccionario de palabras clave (ES/EN) -> duración estimada y energía.
 * Usado solo por el fallback sin AI, para que la demo se sienta razonable
 * aunque todavía no haya una ANTHROPIC_API_KEY configurada.
 */
const KEYWORD_RULES: {
  keywords: string[];
  minutes: number;
  energy: Task["energy_required"];
}[] = [
  {
    keywords: ["responder", "reply", "email", "correo", "mensaje", "message", "texto", "textear"],
    minutes: 5,
    energy: "low",
  },
  { keywords: ["llamar", "llamada", "call"], minutes: 10, energy: "low" },
  {
    keywords: ["factura", "invoice", "pago", "payment", "pagar", "cobrar"],
    minutes: 15,
    energy: "low",
  },
  {
    keywords: ["comprar", "mandado", "groceries", "compras", "supermercado"],
    minutes: 20,
    energy: "medium",
  },
  {
    keywords: ["limpiar", "organizar", "ordenar", "clean", "organize", "tidy"],
    minutes: 25,
    energy: "medium",
  },
  { keywords: ["reunion", "reunión", "meeting", "junta", "call de trabajo"], minutes: 30, energy: "medium" },
  {
    keywords: ["ejercicio", "gym", "gimnasio", "entrenar", "workout", "correr", "run"],
    minutes: 40,
    energy: "high",
  },
  {
    keywords: [
      "presentacion",
      "presentación",
      "reporte",
      "informe",
      "presentation",
      "report",
      "propuesta",
      "proposal",
    ],
    minutes: 60,
    energy: "high",
  },
];

const DEFAULT_MINUTES = 15;
const DEFAULT_ENERGY: Task["energy_required"] = "medium";

// Fechas/horas explícitas -> la tarea sube a urgencia máxima.
const DATE_PATTERN =
  /\b(hoy|today|mañana|manana|tomorrow|lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b|\b\d{1,2}(:\d{2})?\s?(am|pm|hrs?)\b/i;

function estimateTask(title: string): {
  minutes: number;
  energy: Task["energy_required"];
  canBreakDown: boolean;
} {
  const lower = title.toLowerCase();
  const match = KEYWORD_RULES.find((rule) =>
    rule.keywords.some((kw) => lower.includes(kw))
  );

  if (match) {
    return { minutes: match.minutes, energy: match.energy, canBreakDown: match.minutes >= 45 };
  }

  // Sin coincidencia: si el texto es largo, asumimos que es más compleja.
  if (title.length > 40) {
    return { minutes: 35, energy: "high", canBreakDown: true };
  }

  return { minutes: DEFAULT_MINUTES, energy: DEFAULT_ENERGY, canBreakDown: false };
}

/**
 * Fallback sin AI: separa el texto por comas/saltos de línea, estima
 * duración/energía por palabras clave, sube la urgencia si detecta una
 * fecha/hora explícita, y recomienda la tarea con mejor combinación de
 * urgencia (primero) y menor duración (para favorecer algo fácil de empezar).
 */
function heuristicFallback(text: string): AIRecommendation {
  const chunks = text
    .split(/[,\n]|(?<=\.)\s(?=[A-ZÁÉÍÓÚÑ])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  const tasks: Task[] = chunks.slice(0, 8).map((rawTitle, i) => {
    const title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
    const { minutes, energy, canBreakDown } = estimateTask(title);
    const hasDate = DATE_PATTERN.test(title);

    return {
      id: `t${i + 1}`,
      title,
      estimated_minutes: minutes,
      urgency: hasDate ? 5 : 3,
      importance: 3,
      energy_required: energy,
      can_break_down: canBreakDown,
      status: "pending",
    };
  });

  if (tasks.length === 0) {
    const title = text.slice(0, 60) || "Revisar mis pendientes";
    const { minutes, energy, canBreakDown } = estimateTask(title);
    tasks.push({
      id: "t1",
      title,
      estimated_minutes: minutes,
      urgency: 3,
      importance: 3,
      energy_required: energy,
      can_break_down: canBreakDown,
      status: "pending",
    });
  }

  // Mayor urgencia primero; a igual urgencia, menor duración primero
  // (favorece una tarea fácil de arrancar).
  const recommended = [...tasks].sort(
    (a, b) => b.urgency - a.urgency || a.estimated_minutes - b.estimated_minutes
  )[0];

  return {
    tasks,
    recommended_task_id: recommended.id,
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
