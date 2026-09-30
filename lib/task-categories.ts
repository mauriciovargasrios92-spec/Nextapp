/**
 * Categorías de tareas compartidas entre el fallback de process-dump
 * (duración estimada) y el fallback de breakdown (primer paso concreto),
 * para que ambos usen exactamente la misma detección por palabras clave.
 */

export type TaskCategory =
  | "message"
  | "call"
  | "invoice"
  | "shopping"
  | "cleaning"
  | "meeting"
  | "exercise"
  | "presentation";

interface CategoryRule {
  category: TaskCategory;
  keywords: string[];
  minutes: number;
  energy: "low" | "medium" | "high";
}

export const CATEGORY_RULES: CategoryRule[] = [
  {
    category: "message",
    keywords: ["responder", "reply", "email", "correo", "mensaje", "message", "texto", "textear"],
    minutes: 5,
    energy: "low",
  },
  { category: "call", keywords: ["llamar", "llamada", "call"], minutes: 10, energy: "low" },
  {
    category: "invoice",
    keywords: ["factura", "invoice", "pago", "payment", "pagar", "cobrar"],
    minutes: 15,
    energy: "low",
  },
  {
    category: "shopping",
    keywords: ["comprar", "mandado", "groceries", "compras", "supermercado"],
    minutes: 20,
    energy: "medium",
  },
  {
    category: "cleaning",
    keywords: ["limpiar", "organizar", "ordenar", "clean", "organize", "tidy"],
    minutes: 25,
    energy: "medium",
  },
  {
    category: "meeting",
    keywords: ["reunion", "reunión", "meeting", "junta"],
    minutes: 30,
    energy: "medium",
  },
  {
    category: "exercise",
    keywords: ["ejercicio", "gym", "gimnasio", "entrenar", "workout", "correr", "run"],
    minutes: 40,
    energy: "high",
  },
  {
    category: "presentation",
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

export function matchCategory(title: string): CategoryRule | null {
  const lower = title.toLowerCase();
  return CATEGORY_RULES.find((rule) => rule.keywords.some((kw) => lower.includes(kw))) ?? null;
}
