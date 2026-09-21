"use client";

import { useAppStore } from "@/lib/store";
import Onboarding1 from "@/components/Onboarding1";
import Onboarding2 from "@/components/Onboarding2";
import BrainDump from "@/components/BrainDump";
import Processing from "@/components/Processing";
import NextAction from "@/components/NextAction";
import Stuck from "@/components/Stuck";
import Breathing from "@/components/Breathing";
import ResetExercises from "@/components/ResetExercises";
import Focus from "@/components/Focus";
import Completion from "@/components/Completion";

export default function Home() {
  const view = useAppStore((s) => s.view);

  switch (view) {
    case "onboarding-1":
      return <Onboarding1 />;
    case "onboarding-2":
      return <Onboarding2 />;
    case "dump":
      return <BrainDump />;
    case "processing":
      return <Processing />;
    case "next-action":
      return <NextAction />;
    case "stuck":
      return <Stuck />;
    case "breathing":
      return <Breathing />;
    case "reset":
      return <ResetExercises />;
    case "focus":
      return <Focus />;
    case "completion":
      return <Completion />;
    default:
      return <Onboarding1 />;
  }
}
