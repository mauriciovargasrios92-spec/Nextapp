"use client";

import { Screen, Statement, Subtext, PrimaryButton } from "./ui";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";

export default function Onboarding2() {
  const locale = useAppStore((s) => s.locale);
  const setView = useAppStore((s) => s.setView);

  return (
    <Screen>
      <div className="flex flex-col gap-5">
        <Statement>{t(locale, "onboarding2.title")}</Statement>
        <Subtext>
          {t(locale, "onboarding2.line1")}
          <br />
          {t(locale, "onboarding2.line2")}
        </Subtext>
      </div>
      <PrimaryButton onClick={() => setView("dump")}>
        {t(locale, "onboarding2.cta")}
      </PrimaryButton>
    </Screen>
  );
}
