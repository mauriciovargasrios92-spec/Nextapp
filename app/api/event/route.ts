import { NextRequest, NextResponse } from "next/server";
import { supabase, DEMO_USER_ID } from "@/lib/supabase";

export const runtime = "nodejs";

const VALID_EVENTS = [
  "brain_dump_created",
  "task_started",
  "task_completed",
  "task_skipped",
  "stuck_clicked",
  "breathing_started",
  "breathing_completed",
  "reset_started",
  "reset_completed",
] as const;

export async function POST(req: NextRequest) {
  const { event, metadata = {} } = await req.json();

  if (!VALID_EVENTS.includes(event)) {
    return NextResponse.json({ error: "Evento no reconocido." }, { status: 400 });
  }

  if (!supabase) {
    // Modo demo sin Supabase configurado: solo log, no rompe el flujo.
    console.log("[analytics:demo]", event, metadata);
    return NextResponse.json({ ok: true, demo: true });
  }

  const { error } = await supabase.from("analytics_events").insert({
    user_id: DEMO_USER_ID,
    event,
    metadata,
  });

  if (error) {
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
