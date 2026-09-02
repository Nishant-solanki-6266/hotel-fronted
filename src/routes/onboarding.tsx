import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { Toaster } from "@/components/ui";
import { useCurrentUser, useSession } from "@/lib/session";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
});

function Onboarding() {
  const session = useSession();
  const user = useCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (session.ready && !user) navigate({ to: "/login" });
  }, [session.ready, user, navigate]);

  if (!session.ready || !user) {
    return (
      <div className="grain flex min-h-dvh flex-col items-center justify-center gap-4 bg-paper">
        <Logo size={40} />
        <p className="text-[13px] text-ink-3">Opening setup…</p>
      </div>
    );
  }

  return (
    <>
      <OnboardingWizard />
      <Toaster />
    </>
  );
}
