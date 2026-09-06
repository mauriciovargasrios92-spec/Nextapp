"use client";

import { Screen, Statement, Subtext, PrimaryButton } from "./ui";
import { useAppStore } from "@/lib/store";

export default function Onboarding2() {
  const setView = useAppStore((s) => s.setView);

  return (
    <Screen>
      <div className="flex flex-col gap-5">
        <Statement>NEXT is not another to-do list.</Statement>
        <Subtext>
          You tell us what&apos;s on your mind.
          <br />
          We show you one thing at a time.
        </Subtext>
      </div>
      <PrimaryButton onClick={() => setView("dump")}>Continue</PrimaryButton>
    </Screen>
  );
}
