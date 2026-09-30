import type { Locale } from "./i18n";

/**
 * Pide a /api/breakdown un primer paso más pequeño para la tarea dada.
 * Compartido entre NextAction.tsx y Focus.tsx para no duplicar el fetch.
 */
export async function fetchFirstStep(
  taskTitle: string,
  stuckReason: "too_big" | "dont_know_how",
  locale: Locale
): Promise<string> {
  const res = await fetch("/api/breakdown", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taskTitle, stuckReason, locale }),
  });
  const data = await res.json();
  return data.first_step as string;
}
