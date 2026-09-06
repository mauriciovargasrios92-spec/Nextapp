# NEXT

"Tell us everything. We'll tell you what to do next."

MVP funcional: brain dump → una sola acción recomendada → foco → listo.

## 1. Correr localmente

```bash
npm install
npm run dev
```

Abre http://localhost:3000 — funciona de inmediato **sin configurar nada**:
- Sin `ANTHROPIC_API_KEY`: `/api/process-dump` usa un fallback heurístico
  (separa el texto por comas/saltos de línea) para que puedas probar todo
  el flujo igual.
- Sin Supabase: la app corre en "modo demo", solo guarda en memoria del
  navegador durante la sesión y loguea eventos en la consola del servidor.

## 2. Conectar Supabase (opcional pero recomendado)

1. Crea un proyecto en https://supabase.com.
2. Ve a **SQL Editor** y ejecuta, en este orden:
   - `supabase/schema.sql` (crea las tablas y las políticas de RLS)
   - `supabase/seed.sql` (crea un brain dump y 6 tareas de prueba)
3. Copia `.env.local.example` a `.env.local` y completa:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   ```
   (Settings → API en el dashboard de Supabase.)
4. Reinicia `npm run dev`.

Nota: el MVP usa un `DEMO_USER_ID` fijo (ver `lib/supabase.ts`) para que
puedas probar sin implementar login todavía. Cuando quieras auth real,
Supabase Auth (magic link) ya está soportado por el cliente — solo falta
la pantalla de login, que se dejó fuera a propósito para no inflar el MVP.

## 3. Colocar la API key de Claude

En `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

Se usa únicamente en el servidor, dentro de:
- `app/api/process-dump/route.ts` (brain dump → tareas + recomendación)
- `app/api/breakdown/route.ts` (I'm stuck → siguiente paso)

Nunca se expone al cliente (no tiene el prefijo `NEXT_PUBLIC_`).

## 4. Probar el flujo ahora mismo

Con el seed de Supabase cargado (o incluso sin Supabase configurado),
solo abre la app y escribe algo como:

> "necesito responder a un cliente, terminar la presentación del jueves,
> ir al gimnasio, comprar café"

y presiona **Clear my head**. Vas a ver una sola tarea recomendada, con
"I'm stuck" y "Not now" como únicas salidas — nunca la lista completa.

## Decisiones de arquitectura (resumen)

- **Una sola pantalla-orquestador** (`app/page.tsx`) que conmuta entre
  vistas según un estado (`lib/store.ts`, Zustand) en vez de rutas
  separadas por pantalla. Es más simple de mantener para un flujo lineal
  de "una cosa a la vez" y evita side-effects de navegación del navegador
  (back button rompiendo la promesa de "una sola acción").
- **Fallback heurístico sin AI**: para que el MVP se pueda demostrar a
  10 usuarios esta semana aunque todavía no tengas la API key a mano.
- **Sin tabla `users` propia**: se apoya en `auth.users` de Supabase para
  no duplicar autenticación; el MVP usa un `DEMO_USER_ID` mientras no hay
  login implementado.
- **`reason` de la AI nunca llega a la UI** — se guarda solo para debug
  interno, tal como pediste.
