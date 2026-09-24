import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { StuckReason, Task, ViewState } from "./types";
import type { Locale } from "./i18n";

const LOCALE_KEY = "next-locale";
const STORAGE_KEY = "next-app-storage";

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

// Mayor urgencia+importancia primero.
function highestPriority(tasks: Task[]): Task | undefined {
  return [...tasks].sort((a, b) => b.urgency + b.importance - (a.urgency + a.importance))[0];
}

type PersistedState = Pick<
  AppState,
  "brainDumpId" | "originalText" | "tasks" | "currentTaskId" | "stuckReason"
>;

// "view" no se persiste: se deriva de los datos guardados para no restaurar
// pantallas a medias (un fetch en "processing" o un timer en "focus").
function restoreState(saved: PersistedState): PersistedState & { view: ViewState } {
  // Una tarea "active" era la del timer de focus, que no sobrevive a la recarga.
  const tasks = (saved.tasks ?? []).map((t) =>
    t.status === "active" ? { ...t, status: "pending" as const } : t
  );
  const pending = tasks.filter((t) => t.status === "pending");

  if (tasks.length === 0) return { ...saved, tasks, view: "onboarding-1" };
  if (pending.length === 0) return { ...saved, tasks, view: "dump" };

  const currentIsPending = pending.some((t) => t.id === saved.currentTaskId);
  return {
    ...saved,
    tasks,
    currentTaskId: currentIsPending ? saved.currentTaskId : highestPriority(pending)!.id,
    view: "next-action",
  };
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
  hydrated: boolean;

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

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
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
      hydrated: false,

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
          tasks: tasks.map((t) => (t.id === currentTaskId ? { ...t, first_step: firstStep } : t)),
        });
      },

      markTaskStatus: (id, status, difficulty) =>
        set({
          tasks: get().tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status,
                  difficulty_feedback: difficulty ?? t.difficulty_feedback,
                }
              : t
          ),
        }),

      // Elige la siguiente tarea pendiente por urgencia+importancia, sin llamar a la AI de nuevo.
      pickNextTask: () => {
        const pending = get().tasks.filter((t) => t.status === "pending");
        if (pending.length === 0) return null;
        const next = highestPriority(pending)!;
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
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s): PersistedState => ({
        brainDumpId: s.brainDumpId,
        originalText: s.originalText,
        tasks: s.tasks,
        currentTaskId: s.currentTaskId,
        stuckReason: s.stuckReason,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...restoreState({
          ...current,
          ...(persisted as Partial<PersistedState>),
        }),
      }),
      // Se rehidrata en el cliente al montar (ver app/page.tsx) para que el primer
      // render coincida con el HTML del servidor.
      skipHydration: true,
      onRehydrateStorage: () => () => useAppStore.setState({ hydrated: true }),
    }
  )
);
