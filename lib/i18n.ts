export type Locale = "en" | "es";

export const LOCALES: Locale[] = ["en", "es"];

// Solo textos fijos de la interfaz. El texto del brain dump y las tareas que
// genera la AI nunca pasan por aquí: se muestran en el idioma original.
const en = {
  "language.label": "Language",

  "common.back": "Back",
  "common.skip": "Skip",
  "common.start": "Start",
  "common.next": "Next",
  "common.done": "Done",
  "common.stuck": "I'm stuck",

  "onboarding1.title": "Too much in your head?",
  "onboarding1.subtitle": "Tell us everything. We'll help you find the next step.",
  "onboarding1.cta": "Get started",

  "onboarding2.title": "NEXT is not another to-do list.",
  "onboarding2.line1": "You tell us what's on your mind.",
  "onboarding2.line2": "We show you one thing at a time.",
  "onboarding2.cta": "Continue",

  "dump.title": "What's on your mind?",
  "dump.placeholder":
    "I need to reply to Sarah, send an invoice, work out, buy groceries, edit a video…",
  "dump.voice": "Voice input (coming soon)",
  "dump.cta": "Clear my head",
  "dump.loading": "Clearing…",

  "processing.label": "Clearing the noise…",

  "nextAction.allClear": "All clear.",
  "nextAction.newDump": "Start a new brain dump",
  "nextAction.forgetRest": "Forget the rest for now.",
  "nextAction.about": "About {n} min",
  "nextAction.notNow": "Not now",
  "nextAction.waiting": "{n} things waiting",

  "stuck.title": "What's getting in the way?",
  "stuck.tooBig": "It feels too big",
  "stuck.dontKnowHow": "I don't know how to start",
  "stuck.lowEnergy": "I don't have the energy",
  "stuck.overwhelmed": "I'm overwhelmed",
  "stuck.quickReset": "Or take a quick reset",

  "focus.stop": "Stop",

  "completion.done": "Done.",
  "completion.howDidItFeel": "How did that feel?",
  "completion.easy": "Easy",
  "completion.fine": "Fine",
  "completion.hard": "Hard",
  "completion.readyForNext": "Ready for the next one?",
  "completion.everything": "That was everything.",
  "completion.showMe": "Show me",
  "completion.newDump": "New brain dump",

  "breathing.title": "Reset.",
  "breathing.duration": "60 seconds. Nothing else.",
  "breathing.headphones": "Best used with headphones.",
  "breathing.eyes": "Close your eyes when you're ready.",
  "breathing.getReady": "Get ready.",
  "breathing.ready": "Ready.",
  "breathing.inhale": "Inhale",
  "breathing.hold": "Hold",
  "breathing.exhale": "Exhale",
  "breathing.say.in": "Breathe in",
  "breathing.say.out": "Breathe out",
  "breathing.say.hold": "Hold",
  "breathing.say.last": "Last breath",

  "reset.title": "Quick reset.",
  "reset.subtitle": "Pick one. Nothing else.",
  "reset.sigh.title": "Physiological sigh",
  "reset.sigh.blurb": "30 seconds",
  "reset.sigh.intro":
    "Two short breaths in through your nose, one long breath out through your mouth.",
  "reset.sigh.in": "Breathe in",
  "reset.sigh.inAgain": "Breathe in again",
  "reset.sigh.out": "Long breath out",
  "reset.shake.title": "Shake it out",
  "reset.shake.blurb": "20 seconds",
  "reset.shake.intro": "Shake your hands, arms and shoulders. Let the tension go.",
  "reset.shake.hands": "Shake your hands",
  "reset.shake.arms": "Now your arms",
  "reset.shake.shoulders": "Now your shoulders",
  "reset.grounding.title": "5-4-3-2-1 grounding",
  "reset.grounding.blurb": "At your own pace",
  "reset.grounding.intro":
    "Five quick steps. Name what you notice, out loud or in your head.",
  "reset.grounding.step": "Step {n} of {total}",
  "reset.grounding.see": "things you can see",
  "reset.grounding.feel": "things you can feel",
  "reset.grounding.hear": "things you can hear",
  "reset.grounding.smell": "things you can smell",
  "reset.grounding.taste": "thing you can taste",
  "reset.grounding.takeYourTime": "Take your time.",
  "reset.ready": "Are we ready now?",
  "reset.startAgain": "Start again",
};

export type TranslationKey = keyof typeof en;

const es: Record<TranslationKey, string> = {
  "language.label": "Idioma",

  "common.back": "Atrás",
  "common.skip": "Omitir",
  "common.start": "Empezar",
  "common.next": "Siguiente",
  "common.done": "Listo",
  "common.stuck": "No puedo avanzar",

  "onboarding1.title": "¿Demasiado en la cabeza?",
  "onboarding1.subtitle": "Cuéntanos todo. Te ayudaremos a encontrar el siguiente paso.",
  "onboarding1.cta": "Empezar",

  "onboarding2.title": "NEXT no es otra lista de tareas.",
  "onboarding2.line1": "Tú nos cuentas lo que tienes en la cabeza.",
  "onboarding2.line2": "Nosotros te mostramos una cosa a la vez.",
  "onboarding2.cta": "Continuar",

  "dump.title": "¿Qué tienes en la cabeza?",
  "dump.placeholder":
    "Tengo que responderle a Sara, enviar una factura, hacer ejercicio, comprar el mercado, editar un video…",
  "dump.voice": "Entrada de voz (próximamente)",
  "dump.cta": "Despeja mi mente",
  "dump.loading": "Despejando…",

  "processing.label": "Quitando el ruido…",

  "nextAction.allClear": "Todo despejado.",
  "nextAction.newDump": "Empezar un nuevo volcado mental",
  "nextAction.forgetRest": "Olvida el resto por ahora.",
  "nextAction.about": "Unos {n} min",
  "nextAction.notNow": "Ahora no",
  "nextAction.waiting": "{n} cosas en espera",

  "stuck.title": "¿Qué se interpone?",
  "stuck.tooBig": "Se siente demasiado grande",
  "stuck.dontKnowHow": "No sé cómo empezar",
  "stuck.lowEnergy": "No tengo energía",
  "stuck.overwhelmed": "Todo me sobrepasa",
  "stuck.quickReset": "O haz un reset rápido",

  "focus.stop": "Parar",

  "completion.done": "Listo.",
  "completion.howDidItFeel": "¿Cómo se sintió?",
  "completion.easy": "Fácil",
  "completion.fine": "Bien",
  "completion.hard": "Difícil",
  "completion.readyForNext": "¿Vamos con la siguiente?",
  "completion.everything": "Eso era todo.",
  "completion.showMe": "Muéstrame",
  "completion.newDump": "Nuevo volcado mental",

  "breathing.title": "Reset.",
  "breathing.duration": "60 segundos. Nada más.",
  "breathing.headphones": "Mejor con audífonos.",
  "breathing.eyes": "Cierra los ojos cuando quieras.",
  "breathing.getReady": "Prepárate.",
  "breathing.ready": "Listo.",
  "breathing.inhale": "Inhala",
  "breathing.hold": "Sostén",
  "breathing.exhale": "Exhala",
  "breathing.say.in": "Inhala",
  "breathing.say.out": "Exhala",
  "breathing.say.hold": "Sostén",
  "breathing.say.last": "Última respiración",

  "reset.title": "Reset rápido.",
  "reset.subtitle": "Elige uno. Nada más.",
  "reset.sigh.title": "Suspiro fisiológico",
  "reset.sigh.blurb": "30 segundos",
  "reset.sigh.intro":
    "Dos inhalaciones cortas por la nariz y una exhalación larga por la boca.",
  "reset.sigh.in": "Inhala",
  "reset.sigh.inAgain": "Inhala otra vez",
  "reset.sigh.out": "Exhala largo",
  "reset.shake.title": "Sacúdelo",
  "reset.shake.blurb": "20 segundos",
  "reset.shake.intro": "Sacude las manos, los brazos y los hombros. Suelta la tensión.",
  "reset.shake.hands": "Sacude las manos",
  "reset.shake.arms": "Ahora los brazos",
  "reset.shake.shoulders": "Ahora los hombros",
  "reset.grounding.title": "Anclaje 5-4-3-2-1",
  "reset.grounding.blurb": "A tu ritmo",
  "reset.grounding.intro":
    "Cinco pasos rápidos. Nombra lo que notas, en voz alta o en tu mente.",
  "reset.grounding.step": "Paso {n} de {total}",
  "reset.grounding.see": "cosas que puedes ver",
  "reset.grounding.feel": "cosas que puedes sentir",
  "reset.grounding.hear": "cosas que puedes oír",
  "reset.grounding.smell": "cosas que puedes oler",
  "reset.grounding.taste": "cosa que puedes saborear",
  "reset.grounding.takeYourTime": "Tómate tu tiempo.",
  "reset.ready": "¿Ya estamos listos?",
  "reset.startAgain": "Empezar de nuevo",
};

export const translations: Record<Locale, Record<TranslationKey, string>> = { en, es };

// Idioma de la voz sintetizada (speechSynthesis) para cada locale.
export const SPEECH_LANG: Record<Locale, string> = { en: "en-US", es: "es-ES" };

export function t(
  locale: Locale,
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  const text = translations[locale]?.[key] ?? translations.en[key];
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name) =>
    name in params ? String(params[name]) : match
  );
}
