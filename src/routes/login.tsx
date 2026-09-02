import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Wand2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Avatar, Button } from "@/components/ui";
import { hotel, staff } from "@/lib/data";
import { roleHome, roleLabel, signIn } from "@/lib/session";
import { startOnboarding } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  component: Login,
});

const steps = [
  {
    title: "The guest writes wherever they already are",
    body: "WhatsApp, Gmail, Outlook or your own mailbox. One thread per guest, whatever they use.",
  },
  {
    title: "The AI answers, and knows when not to",
    body: "It replies from your own policies and live availability, and escalates complaints, refunds and safety to a human.",
  },
  {
    title: "Work reaches the right department on WhatsApp",
    body: "Housekeeping and maintenance update rooms and tickets with a tap. No new app to learn.",
  },
  {
    title: "Everyone sees only what needs them",
    body: "Managers get a morning briefing instead of an inbox. Reception gets prepared answers instead of questions.",
  },
];

function Login() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(staff[0].id);
  const [busy, setBusy] = useState(false);
  const user = staff.find((u) => u.id === selected)!;

  const submit = () => {
    setBusy(true);
    signIn(user.id);
    setTimeout(() => navigate({ to: roleHome[user.role] }), 380);
  };

  // First login for a hotel that has not been set up yet — clears the seeded connections
  // and opens the onboarding wizard as the manager.
  const firstLogin = () => {
    const manager = staff.find((u) => u.role === "manager") ?? user;
    setBusy(true);
    startOnboarding();
    signIn(manager.id);
    setTimeout(() => navigate({ to: "/onboarding" }), 380);
  };

  return (
    <div className="grain grid min-h-dvh bg-paper lg:grid-cols-[1.05fr_1fr]">
      {/* left — positioning */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-pine-900 px-10 py-12 text-pine-100 lg:flex xl:px-14">
        <span
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 15%, #4c8574 0%, transparent 45%), radial-gradient(circle at 85% 80%, #3f5c96 0%, transparent 40%)",
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <Logo />
            <span>
              <span className="block font-display text-[16px] leading-tight font-semibold text-white">Hotelogx</span>
              <span className="block text-[10.5px] tracking-[0.14em] text-pine-200 uppercase">Connect</span>
            </span>
          </div>

          <h1 className="mt-12 max-w-lg font-display text-[38px] leading-[1.08] font-medium text-white xl:text-[44px]">
            An AI front office and operations assistant.
          </h1>
          <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-pine-200">
            Not a chatbot, not another inbox. The AI handles routine guest communication and coordinates your departments —
            your team sees only what genuinely requires a person.
          </p>
        </div>

        <ol className="relative mt-12 space-y-5">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-3.5">
              <span className="tnum mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-pine-400/50 font-mono text-[11px] text-pine-200">
                {i + 1}
              </span>
              <div>
                <p className="text-[13.5px] font-medium text-white">{step.title}</p>
                <p className="mt-0.5 max-w-sm text-[12.5px] leading-snug text-pine-200/85">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="relative mt-10 flex max-w-md items-start gap-2 border-t border-pine-400/25 pt-5 text-[12px] leading-snug text-pine-200/75">
          <Sparkles className="mt-px size-3.5 shrink-0" />
          Reservations always complete on your own booking engine — the AI checks availability and pricing in your PMS, then
          hands the guest a direct link. It never takes payment.
        </p>
      </section>

      {/* right — sign in */}
      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <Logo />
            <span className="font-display text-[16px] font-semibold text-ink">Hotelogx Connect</span>
          </div>

          <p className="text-[11px] font-semibold tracking-[0.14em] text-ink-4 uppercase">Sign in</p>
          <h2 className="mt-1.5 font-display text-[26px] leading-tight font-medium text-ink">{hotel.name}</h2>
          <p className="mt-1.5 text-[13px] text-ink-3">
            Every staff member has their own login. Your role decides what you see — there is no department to pick.
          </p>

          <div className="mt-6 space-y-1.5">
            {staff.map((u) => (
              <button
                key={u.id}
                onClick={() => setSelected(u.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[11px] border px-3 py-2.5 text-left transition-colors",
                  u.id === selected ? "border-pine-400 bg-pine-50" : "border-line bg-surface hover:border-ink-4",
                )}
              >
                <Avatar initials={u.initials} size={32} tone={u.id === selected ? "pine" : "mute"} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium text-ink">{u.name}</span>
                  <span className="block truncate text-[11.5px] text-ink-3">{u.title}</span>
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2 py-0.5 text-[10.5px] font-medium",
                    u.id === selected ? "border-pine-200 bg-surface text-pine-700" : "border-line text-ink-4",
                  )}
                >
                  {roleLabel[u.role]}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-2.5">
            <label className="block">
              <span className="text-[11.5px] font-medium text-ink-3">Work email</span>
              <input
                readOnly
                value={user.email}
                className="mt-1 w-full rounded-[9px] border border-line bg-paper-2 px-3 py-2 font-mono text-[12.5px] text-ink-2 outline-none"
              />
            </label>
            <label className="block">
              <span className="text-[11.5px] font-medium text-ink-3">Password</span>
              <input
                type="password"
                defaultValue="demo-access"
                className="mt-1 w-full rounded-[9px] border border-line bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-pine-400"
              />
            </label>
          </div>

          <Button className="mt-5 w-full" onClick={submit} disabled={busy} icon={ArrowRight}>
            {busy ? "Opening…" : `Sign in as ${user.name.split(" ")[0]}`}
          </Button>

          <p className="mt-4 text-[11.5px] leading-snug text-ink-4">
            Demo accounts — pick any of the five to see that role's workspace. A manager can invite colleagues and change
            roles under Settings.
          </p>

          <div className="mt-5 border-t border-line-soft pt-4">
            <p className="text-[12.5px] font-medium text-ink">New hotel?</p>
            <p className="mt-0.5 text-[11.5px] leading-snug text-ink-4">
              Start from nothing: the onboarding wizard walks the manager through the profile, the PMS, email, both WhatsApp
              numbers, the knowledge base, the team and the AI rules.
            </p>
            <Button variant="outline" size="sm" className="mt-2.5" icon={Wand2} onClick={firstLogin} disabled={busy}>
              Set up a new hotel
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
