import { useState } from "react";
import { Server, Shield } from "lucide-react";
import { pmsOptions } from "@/lib/onboarding";
import { connectPms, useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Badge, Button, Card, Eyebrow, SectionTitle } from "./ui";
import { ConnectionHealth } from "./ConnectionHealth";
import { OAuthConsent } from "./OAuthConsent";

export function OnboardingPmsStep() {
  const pms = useApp((s) => s.onboarding.pms);
  const profile = useApp((s) => s.hotelProfile);

  const [choice, setChoice] = useState<string>(pms.provider?.toLowerCase() ?? "mews");
  const [propertyId, setPropertyId] = useState(pms.propertyId ?? "");
  const [consent, setConsent] = useState(false);

  const option = pmsOptions.find((p) => p.key === choice) ?? pmsOptions[0];

  if (pms.state === "connected") {
    return (
      <Card>
        <SectionTitle title="Property management system" hint="Your PMS stays the source of truth for reservations" />
        <ConnectionHealth
          title={pms.provider ?? "PMS"}
          identifier={pms.propertyName ?? profile.name}
          state="connected"
          rows={[
            { label: "Availability and rates", ok: true },
            { label: "Reservations and folios", ok: true },
            { label: "Writes back", value: "never" },
            { label: "Last sync", value: pms.lastSync ?? "—" },
          ]}
        />
        <p className="mt-3 flex items-start gap-1.5 border-t border-line-soft pt-3 text-[11.5px] leading-snug text-ink-4">
          <Shield className="mt-px size-3.5 shrink-0 text-pine-600" />
          Read-only, and it stays that way. Hotelogx never creates, changes or cancels a reservation and never takes payment.
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <SectionTitle title="Which PMS do you use?" hint="We request read-only access — you approve it once" />

        <div className="grid gap-2 sm:grid-cols-2">
          {pmsOptions.map((p) => {
            const active = p.key === choice;
            return (
              <button
                key={p.key}
                onClick={() => setChoice(p.key)}
                className={cn(
                  "flex items-start gap-2.5 rounded-[10px] border px-3 py-2.5 text-left transition-colors",
                  active ? "border-pine-400 bg-pine-50/60" : "border-line bg-surface hover:border-ink-4",
                )}
              >
                <Server className={cn("mt-0.5 size-3.5 shrink-0", active ? "text-pine-600" : "text-ink-4")} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-[13px] font-medium text-ink">{p.name}</span>
                    {!p.available && <Badge tone="mute">Coming soon</Badge>}
                  </span>
                  <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-4">{p.note}</span>
                </span>
              </button>
            );
          })}
        </div>

        {option.available ? (
          <div className="mt-4 rounded-[10px] border border-line bg-paper/50 p-3.5">
            <Eyebrow>Identify the property</Eyebrow>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-[11.5px] font-medium text-ink-3">Property name</span>
                <input
                  value={profile.name}
                  readOnly
                  className="mt-1 w-full rounded-[9px] border border-line bg-surface/60 px-2.5 py-2 text-[13px] text-ink-2 outline-none"
                />
              </label>
              <label className="block">
                <span className="text-[11.5px] font-medium text-ink-3">
                  {option.key === "mews" ? "Mews property ID" : "Property or account ID"}
                </span>
                <input
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  placeholder={option.key === "mews" ? "MEWS-0000-NAME" : "property-id"}
                  className="tnum mt-1 w-full rounded-[9px] border border-line bg-surface px-2.5 py-2 font-mono text-[12.5px] outline-none focus:border-pine-400"
                />
              </label>
            </div>
            <Button className="mt-3" disabled={propertyId.trim().length < 4} onClick={() => setConsent(true)}>
              Authorise {option.name}
            </Button>
            <p className="mt-2.5 flex items-start gap-1.5 text-[11.5px] leading-snug text-ink-4">
              <Shield className="mt-px size-3.5 shrink-0 text-pine-600" />
              You approve read-only access in {option.name}. We never ask you to paste an API key into this page — if your
              PMS needs one, we send a single-use secure link instead.
            </p>
          </div>
        ) : (
          <div className="mt-4 rounded-[10px] border border-attend/30 bg-attend-bg/40 p-3.5">
            <p className="text-[13px] font-medium text-ink">{option.name} is not connected yet.</p>
            <p className="mt-1 text-[12.5px] leading-snug text-ink-3">
              Tell us you need it and it moves up the queue. You can finish setup now and connect the PMS later — the AI will
              answer everything except live availability and rates.
            </p>
            <Button
              className="mt-2.5"
              variant="outline"
              onClick={() => connectPms(option.name, "requested")}
            >
              Register interest and continue
            </Button>
          </div>
        )}
      </Card>

      {consent && (
        <OAuthConsent
          provider="generic"
          providerName={option.name}
          host={option.key === "mews" ? "app.mews.com" : `identity.${option.key}.com`}
          title={`${option.name} wants to grant Hotelogx read-only access`}
          account={`${profile.name} · ${propertyId}`}
          scopes={["Read availability and rates", "Read reservations and arrivals", "Read folios for billing questions", "No write access of any kind"]}
          onCancel={() => setConsent(false)}
          onAllow={() => {
            setConsent(false);
            connectPms(option.name, propertyId.trim());
          }}
        />
      )}
    </>
  );
}
