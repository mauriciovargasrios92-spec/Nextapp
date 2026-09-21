"use client";

import { Screen, Subtext } from "./ui";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";

export default function Processing() {
  const locale = useAppStore((s) => s.locale);

  return (
    <Screen>
      <div className="flex flex-col items-center gap-6">
        <div className="h-14 w-14 rounded-full border-2 border-stone-light border-t-ink animate-spin" />
        <Subtext>{t(locale, "processing.label")}</Subtext>
      </div>
    </Screen>
  );
}
