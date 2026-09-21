export type EnergyLevel = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  estimated_minutes: number;
  urgency: number; // 1-5
  importance: number; // 1-5
  energy_required: EnergyLevel;
  can_break_down: boolean;
  first_step?: string;
  status: "pending" | "active" | "done" | "skipped";
  difficulty_feedback?: "easy" | "fine" | "hard";
}

export interface AIRecommendation {
  tasks: Task[];
  recommended_task_id: string;
  reason: string; // uso interno, nunca se muestra al usuario
}

export type StuckReason =
  | "too_big"
  | "dont_know_how"
  | "low_energy"
  | "overwhelmed";

export type ViewState =
  | "onboarding-1"
  | "onboarding-2"
  | "dump"
  | "processing"
  | "next-action"
  | "stuck"
  | "breathing"
  | "reset"
  | "focus"
  | "completion";
