import { create } from "zustand";
import type { StuckReason, Task, ViewState } from "./types";

interface AppState {
  view: ViewState;
  brainDumpId: string | null;
  originalText: string;
  tasks: Task[];
  currentTaskId: string | null;
  stuckReason: StuckReason | null;
  breathingReturnView: ViewState;

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
