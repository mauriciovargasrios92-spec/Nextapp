"use client";

import { Screen, Statement, Subtext, PrimaryButton } from "./ui";
import { useAppStore } from "@/lib/store";

export default function Onboarding1() {
  const setView = useAppStore((s) => s.setView);

  return (
    <Screen>
      <div className="flex flex-col gap-5">
        <Statement>Too much in your head?</Statement>
        <Subtext>Tell us everything. We&apos;ll help you find the next step.</Subtext>
      </div>
      <PrimaryButton onClick={() => setView("onboarding-2")}>
        Get started
      </PrimaryButton>
    </Screen>
  );
}
