"use client";

import { Screen, Statement, Subtext, PrimaryButton } from "./ui";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";

export default function Onboarding1() {
  const locale = useAppStore((s) => s.locale);
  const setView = useAppStore((s) => s.setView);

  return (
    <Screen>
      <div className="flex flex-col gap-5">
        <Statement>{t(locale, "onboarding1.title")}</Statement>
        <Subtext>{t(locale, "onboarding1.subtitle")}</Subtext>
      </div>
      <PrimaryButton onClick={() => setView("onboarding-2")}>
        {t(locale, "onboarding1.cta")}
      </PrimaryButton>
    </Screen>
  );
}
