export function track(event: string, metadata: Record<string, unknown> = {}) {
  // fire-and-forget, nunca bloquea la UI
  fetch("/api/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, metadata }),
  }).catch(() => {});
}
