import { create } from "zustand";
import type { StuckReason, Task, ViewState } from "./types";
import type { Locale } from "./i18n";

const LOCALE_KEY = "next-locale";

// localStorage primero; si no hay nada guardado, navigator.language ("es*" -> es, resto -> en).
function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(LOCALE_KEY);
    if (saved === "en" || saved === "es") return saved;
  } catch {
    // localStorage puede no estar disponible (modo privado, SSR).
  }
  if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("es")) {
    return "es";
  }
  return "en";
}

interface AppState {
  view: ViewState;
  brainDumpId: string | null;
  originalText: string;
  tasks: Task[];
  currentTaskId: string | null;
  stuckReason: StuckReason | null;
  breathingReturnView: ViewState;
  locale: Locale;

  setLocale: (locale: Locale) => void;
  initLocale: () => void;
  setView: (v: ViewState) => void;
  startDump: (brainDumpId: string, text: string) => void;
  setTasks: (tasks: Task[], recommendedId: string) => void;
  setCurrentTask: (id: string) => void;
  overrideCurrentTaskFirstStep: (firstStep: string) => void;
  markTaskStatus: (
    id: string,
    status: Task["status"],
    difficulty?: Task["difficulty_feedback"]
  ) => void;
  pickNextTask: () => string | null;
  setStuckReason: (r: StuckReason | null) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  view: "onboarding-1",
  brainDumpId: null,
  originalText: "",
  tasks: [],
  currentTaskId: null,
  stuckReason: null,
  breathingReturnView: "next-action",
  // Siempre "en" en el primer render para que coincida con el HTML del servidor;
  // initLocale() detecta el idioma real en el cliente al montar la app.
  locale: "en",

  setLocale: (locale) => {
    set({ locale });
    try {
      localStorage.setItem(LOCALE_KEY, locale);
    } catch {
      // Sin localStorage la preferencia solo dura la sesión.
    }
    if (typeof document !== "undefined") document.documentElement.lang = locale;
  },

  initLocale: () => get().setLocale(detectLocale()),

  setView: (v) => set({ view: v }),

  startDump: (brainDumpId, text) =>
    set({ brainDumpId, originalText: text, view: "processing" }),

  setTasks: (tasks, recommendedId) =>
    set({ tasks, currentTaskId: recommendedId, view: "next-action" }),

  setCurrentTask: (id) => set({ currentTaskId: id }),

  overrideCurrentTaskFirstStep: (firstStep) => {
    const { tasks, currentTaskId } = get();
    set({
      tasks: tasks.map((t) =>
        t.id === currentTaskId ? { ...t, first_step: firstStep } : t
      ),
    });
  },

  markTaskStatus: (id, status, difficulty) =>
    set({
      tasks: get().tasks.map((t) =>
        t.id === id
          ? { ...t, status, difficulty_feedback: difficulty ?? t.difficulty_feedback }
          : t
      ),
    }),

  // Elige la siguiente tarea pendiente por urgencia+importancia, sin llamar a la AI de nuevo.
  pickNextTask: () => {
    const pending = get().tasks.filter((t) => t.status === "pending");
    if (pending.length === 0) return null;
    const sorted = [...pending].sort(
      (a, b) => b.urgency + b.importance - (a.urgency + a.importance)
    );
    const next = sorted[0];
    set({ currentTaskId: next.id });
    return next.id;
  },

  setStuckReason: (r) => set({ stuckReason: r }),

  reset: () =>
    set({
      view: "dump",
      brainDumpId: null,
      originalText: "",
      tasks: [],
      currentTaskId: null,
      stuckReason: null,
    }),
}));
