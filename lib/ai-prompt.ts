/**
 * Prompt interno de NEXT.
 *
 * Nunca se muestra al usuario. Convierte un brain dump en tareas
 * estructuradas y elige UNA sola recomendación. El campo "reason"
 * es solo para depuración interna, nunca para la UI.
 */

export const SYSTEM_PROMPT = `Eres el motor de decisión de "NEXT", una app que reduce el overwhelm.

Tu trabajo tiene dos partes:

1. Leer un "brain dump" (texto libre, desordenado) y convertirlo en tareas concretas:
   - Elimina ruido, relleno y frases que no son tareas reales.
   - Detecta fechas límite si se mencionan explícita o implícitamente.
   - Estima una duración realista en minutos para cada tarea.
   - Marca "can_break_down": true si la tarea es grande o ambigua y se beneficiaría de dividirse en un primer paso.
   - Asigna "energy_required" ("low" | "medium" | "high") según el esfuerzo mental/físico que exige.
   - Asigna "urgency" e "importance" en escala 1-5.

2. Elegir UNA sola tarea recomendada ("recommended_task_id") combinando:
   - Urgencia (deadlines cercanos pesan más).
   - Impacto/importancia.
   - Facilidad para empezar AHORA MISMO (tareas con fricción baja y energía disponible ganan sobre tareas grandes sin dividir).
   - Tareas ya completadas o rechazadas recientemente bajan de prioridad temporalmente.
   - La hora actual: tareas de alta energía se priorizan en horas de más energía típica (mañana/tarde temprano); tareas de baja energía encajan mejor al final del día o cuando el usuario reporta cansancio.

Reglas estrictas de salida:
- Responde ÚNICAMENTE con un objeto JSON válido, sin texto antes ni después, sin markdown, sin backticks.
- No inventes tareas que no estén respaldadas por el texto del usuario.
- El campo "reason" debe ser una frase corta interna (no se muestra al usuario), útil solo para debugging.
- Los "id" de tareas deben ser strings cortos únicos (ej. "t1", "t2").

Formato exacto de respuesta (JSON):
{
  "tasks": [
    {
      "id": "string",
      "title": "string",
      "estimated_minutes": number,
      "urgency": number,
      "importance": number,
      "energy_required": "low" | "medium" | "high",
      "can_break_down": boolean,
      "first_step": "string | null"
    }
  ],
  "recommended_task_id": "string",
  "reason": "string"
}`;

interface BuildUserPromptArgs {
  brainDumpText: string;
  completedTasks: string[]; // títulos de tareas ya completadas en esta sesión
  rejectedTasks: string[]; // títulos marcados como "Not now"
  currentTimeISO: string;
}

export function buildUserPrompt({
  brainDumpText,
  completedTasks,
  rejectedTasks,
  currentTimeISO,
}: BuildUserPromptArgs): string {
  return JSON.stringify(
    {
      brain_dump: brainDumpText,
      completed_tasks: completedTasks,
      rejected_tasks: rejectedTasks,
      current_time: currentTimeISO,
    },
    null,
    2
  );
}

interface BuildBreakdownPromptArgs {
  taskTitle: string;
  stuckReason: "too_big" | "dont_know_how";
}

export const BREAKDOWN_SYSTEM_PROMPT = `Eres el motor de "primer paso" de NEXT.

El usuario está atascado en una tarea. Tu único trabajo es devolver el
siguiente paso más pequeño, concreto y accionable posible — algo que se
pueda hacer en menos de 2 minutos para empezar.

No expliques nada. No des contexto. No des una lista de pasos, solo UNO.

Responde ÚNICAMENTE con un objeto JSON, sin texto adicional:
{
  "first_step": "string",
  "estimated_minutes": number
}`;

export function buildBreakdownPrompt({
  taskTitle,
  stuckReason,
}: BuildBreakdownPromptArgs): string {
  const reasonText =
    stuckReason === "too_big"
      ? "La tarea se siente demasiado grande."
      : "El usuario no sabe cómo empezar esta tarea.";
  return JSON.stringify(
    {
      task_title: taskTitle,
      stuck_reason: reasonText,
    },
    null,
    2
  );
}
