import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// Si no hay credenciales de Supabase (por ejemplo, al probar el MVP por
// primera vez), la app sigue funcionando: el brain dump y el flujo de tareas
// viven en memoria/localStorage y solo se registra un aviso en consola en
// vez de romper la experiencia.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string)
  : null;

// Usuario de demo fijo para poder probar el flujo sin login real.
// Coincide con el id insertado en supabase/seed.sql.
export const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";

export async function getCurrentUserId(): Promise<string> {
  if (!supabase) return DEMO_USER_ID;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? DEMO_USER_ID;
}
