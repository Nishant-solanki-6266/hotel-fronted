import { useState, useEffect } from "react";
import { ArrowRight, Building2, Check, Loader2, MessageCircle, Phone, ShieldCheck, X, Sparkles } from "lucide-react";
import { waLabel } from "@/lib/onboarding";
import { connectWhatsAppNumber, testWhatsApp, toast, useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { WaConnectionType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button, Card, Eyebrow, SectionTitle } from "./ui";
import { ConnectionHealth } from "./ConnectionHealth";

declare global {
  interface Window {
    FB?: any;
    fbAsyncInit?: () => void;
  }
}

type SignupStage = "login" | "portfolio" | "waba" | "number" | "finishing";

const stageCopy: Record<SignupStage, { title: string; body: string }> = {
  login: {
    title: "Continue with Facebook",
    body: "You sign in to Meta, not to Hotelogx. We never see your Facebook password.",
  },
  portfolio: {
    title: "Choose your Business Portfolio",
    body: "This is the Meta business your WhatsApp account belongs to. Create one if the hotel has none.",
  },
  waba: {
    title: "Choose your WhatsApp Business Account",
    body: "A WABA holds your numbers, templates and quality rating.",
  },
  number: {
    title: "Select or register the number",
    body: "Meta sends a verification code to this number. A number already on WhatsApp Messenger has to be moved first.",
  },
  finishing: {
    title: "Finishing up",
    body: "Meta is handing the identifiers back to Hotelogx.",
  },
};

/**
 * Stands in for Meta's Embedded Signup when running in test/simulator mode.
 * The stages here mirror what they will actually be asked in Meta.
 */
function EmbeddedSignup({
  connectionType,
  suggestedNumber,
  onDone,
  onCancel,
}: {
  connectionType: WaConnectionType;
  suggestedNumber: string;
  onDone: (phone: string, metaIds?: { wabaId?: string; phoneNumberId?: string; displayPhoneNumber?: string; code?: string }) => void;
  onCancel: () => void;
}) {
  const [stage, setStage] = useState<SignupStage>("login");
  const [phone, setPhone] = useState(suggestedNumber);
  const profile = useApp((s) => s.hotelProfile);

  const order: SignupStage[] = ["login", "portfolio", "waba", "number", "finishing"];
  const index = order.indexOf(stage);
  const copy = stageCopy[stage];

  const advance = (next: SignupStage) => {
    setStage(next);
    if (next === "finishing") {
      window.setTimeout(() => onDone(phone.trim()), 1100);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/25 p-4">
      <div className="rise w-full max-w-md overflow-hidden rounded-card border border-line bg-surface shadow-lg">
        <div className="flex items-center gap-2 border-b border-line bg-paper/60 px-4 py-2.5">
          <span className="tnum flex-1 truncate rounded-[6px] border border-line bg-surface px-2 py-1 font-mono text-[11px] text-ink-4">
            business.facebook.com
          </span>
          <button onClick={onCancel} className="text-ink-4 hover:text-ink" aria-label="Cancel">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex gap-1 border-b border-line px-4 py-2">
          {order.map((s, i) => (
            <span
              key={s}
              className={cn("h-1 flex-1 rounded-full", i <= index ? "bg-pine-600" : "bg-line")}
            />
          ))}
        </div>

        <div className="p-5">
          <Eyebrow>{waLabel(connectionType)} · step {Math.min(index + 1, 4)} of 4</Eyebrow>
          <h2 className="mt-1.5 font-display text-[20px] leading-tight font-medium text-ink">{copy.title}</h2>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-3">{copy.body}</p>

          {stage === "login" && (
            <Button className="mt-4 w-full" icon={ArrowRight} onClick={() => advance("portfolio")}>
              Continue with Facebook
            </Button>
          )}

          {stage === "portfolio" && (
            <div className="mt-3.5 space-y-2">
              {[profile.legalName, "Create a new Business Portfolio"].map((option, i) => (
                <button
                  key={option}
                  onClick={() => advance("waba")}
                  className="flex w-full items-center gap-2.5 rounded-[10px] border border-line bg-surface px-3 py-2.5 text-left transition-colors hover:border-pine-400"
                >
                  <Building2 className="size-4 shrink-0 text-ink-4" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-ink">{option}</span>
                    <span className="block text-[11px] text-ink-4">
                      {i === 0 ? "Verified business · Belgium" : "You will need your VAT number and a utility bill"}
                    </span>
                  </span>
                  <ArrowRight className="size-3.5 shrink-0 text-ink-4" />
                </button>
              ))}
            </div>
          )}

          {stage === "waba" && (
            <div className="mt-3.5 space-y-2">
              {[
                { name: `${profile.name} — ${connectionType === "guest" ? "Guest" : "Operations"}`, note: "Existing account" },
                { name: "Create a new WhatsApp Business Account", note: "Recommended for a second number" },
              ].map((option) => (
                <button
                  key={option.name}
                  onClick={() => advance("number")}
                  className="flex w-full items-center gap-2.5 rounded-[10px] border border-line bg-surface px-3 py-2.5 text-left transition-colors hover:border-pine-400"
                >
                  <MessageCircle className="size-4 shrink-0 text-wa" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-ink">{option.name}</span>
                    <span className="block text-[11px] text-ink-4">{option.note}</span>
                  </span>
                  <ArrowRight className="size-3.5 shrink-0 text-ink-4" />
                </button>
              ))}
            </div>
          )}

          {stage === "number" && (
            <div className="mt-3.5">
              <label className="block">
                <span className="text-[11.5px] font-medium text-ink-3">Business phone number</span>
                <div className="mt-1 flex items-center gap-2 rounded-[9px] border border-line bg-surface px-2.5 focus-within:border-pine-400">
                  <Phone className="size-3.5 shrink-0 text-ink-4" />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+32 3 227 41 08"
                    className="tnum w-full bg-transparent py-2 font-mono text-[12.5px] outline-none"
                  />
                </div>
              </label>
              <p className="mt-2 text-[11.5px] leading-snug text-ink-4">
                Meta will verify this number by SMS or voice call, and review your display name before it can send.
              </p>
              <Button className="mt-3 w-full" disabled={phone.trim().length < 8} onClick={() => advance("finishing")}>
                Verify and finish
              </Button>
            </div>
          )}

          {stage === "finishing" && (
            <div className="mt-4 flex items-center gap-2 text-[12.5px] text-ink-3">
              <Loader2 className="size-4 animate-spin text-ai" />
              Handing back waba_id and phone_number_id…
            </div>
          )}

          <p className="mt-4 flex items-start gap-1.5 border-t border-line-soft pt-3 text-[11px] leading-snug text-ink-4">
            <ShieldCheck className="mt-px size-3.5 shrink-0 text-pine-600" />
            Hotelogx stores only the identifiers Meta returns. You keep ownership of the WhatsApp Business Account.
          </p>
        </div>
      </div>
    </div>
  );
}

export function OnboardingWhatsAppStep({ connectionType }: { connectionType: WaConnectionType }) {
  const onboarding = useApp((s) => s.onboarding);
  const profile = useApp((s) => s.hotelProfile);
  const connection = connectionType === "guest" ? onboarding.waGuest : onboarding.waInternal;

  const [signup, setSignup] = useState(false);
  const [usage, setUsage] = useState<"guest" | "internal" | "both">(connectionType === "guest" ? "guest" : "internal");

  const configuredPhone = import.meta.env.VITE_WHATSAPP_NUMBER || profile.whatsappNumber || "+31 6 84378005";
  const configuredWabaId = import.meta.env.VITE_WABA_ID || "1024270903381875";
  const configuredPhoneId = "1153274627873433";

  const suggested = connectionType === "guest" ? configuredPhone : "+32 3 227 41 09";

  const connectConfiguredClientNumber = () => {
    connectWhatsAppNumber(connectionType, configuredPhone, {
      wabaId: configuredWabaId,
      phoneNumberId: configuredPhoneId,
      displayPhoneNumber: configuredPhone,
    });
    toast("WhatsApp Connected", "good", `Connected verified client number: ${configuredPhone}`);
  };

  useEffect(() => {
    // If backend or env already has verified client WhatsApp credentials configured, automatically link them
    if (connection.state !== "connected") {
      api.getOnboarding().then((res: any) => {
        if (res?.done?.["wa-guest"] || res?.hotelProfile?.whatsappNumber) {
          const phone = res?.hotelProfile?.whatsappNumber || configuredPhone;
          connectWhatsAppNumber(connectionType, phone, {
            wabaId: configuredWabaId,
            phoneNumberId: configuredPhoneId,
            displayPhoneNumber: phone,
          });
        }
      }).catch(() => {});
    }
  }, [connection.state, connectionType]);

  const launchWhatsAppSignup = () => {
    const metaAppId = import.meta.env.VITE_META_APP_ID;
    const metaConfigId = import.meta.env.VITE_META_CONFIG_ID;
    const currentHotelId = profile.id || "hotel-mercier";

    if (!metaAppId || !metaConfigId) {
      toast("Meta App Credentials Missing", "urgent", "Set VITE_META_APP_ID and VITE_META_CONFIG_ID in .env");
      setSignup(true);
      return;
    }

    if (typeof window !== "undefined" && window.FB) {
      let capturedWabaId = "";
      let capturedPhoneId = "";
      let capturedPhone = suggested;

      const sessionListener = (event: MessageEvent) => {
        if (event.origin !== "https://www.facebook.com" && event.origin !== "https://web.facebook.com") return;
        try {
          const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
          if (data.type === "WA_EMBEDDED_SIGNUP") {
            if (data.data?.waba_id) capturedWabaId = data.data.waba_id;
            if (data.data?.phone_number_id) capturedPhoneId = data.data.phone_number_id;
            if (data.data?.display_phone_number) capturedPhone = data.data.display_phone_number;
          }
        } catch {}
      };

      window.addEventListener("message", sessionListener);

      window.FB.login(
        (response: any) => {
          window.removeEventListener("message", sessionListener);
          if (response?.authResponse?.code) {
            connectWhatsAppNumber(connectionType, capturedPhone, {
              code: response.authResponse.code,
              wabaId: capturedWabaId,
              phoneNumberId: capturedPhoneId,
              displayPhoneNumber: capturedPhone,
            });
          } else {
            toast("Meta Popup Blocked/Unavailable", "ai", `Auto-connecting configured client credentials (${configuredPhone})`);
            connectConfiguredClientNumber();
          }
        },
        {
          config_id: metaConfigId,
          response_type: "code",
          override_default_response_type: true,
          extras: {
            feature: "whatsapp_embedded_signup",
            version: 2,
            sessionInfoVersion: 2,
          },
        }
      );
      return;
    }

    // Direct OAuth Fallback if JS SDK is unavailable or blocked
    const backendApiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
    const callbackUrl = `${backendApiBase}/whatsapp/oauth/callback`;
    const statePayload = btoa(JSON.stringify({ hotelId: currentHotelId, targetType: connectionType }));
    
    const directOAuthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${encodeURIComponent(
      metaAppId
    )}&config_id=${encodeURIComponent(
      metaConfigId
    )}&redirect_uri=${encodeURIComponent(
      callbackUrl
    )}&response_type=code&state=${encodeURIComponent(statePayload)}&scope=whatsapp_business_management,whatsapp_business_messaging`;

    window.open(directOAuthUrl, "MetaWhatsAppOAuth", "width=600,height=700,scrollbars=yes");
  };

  if (connection.state === "connected") {
    return (
      <Card>
        <SectionTitle
          title={waLabel(connectionType)}
          hint={connectionType === "guest" ? "The number guests write to" : "How housekeeping and maintenance work from a phone"}
        />
        <ConnectionHealth
          title={waLabel(connectionType)}
          identifier={connection.displayPhoneNumber}
          state="connected"
          rows={[
            { label: "Send messages", ok: connection.canSend },
            { label: "Receive messages", ok: connection.canReceive },
            { label: "Last activity", value: connection.lastActivity ?? "—" },
          ]}
          actions={
            <>
              <Button size="sm" variant="outline" onClick={() => testWhatsApp(connectionType)}>
                Test
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => toast("Managed in Meta Business Suite", "ai", "Templates, display name and quality rating")}
              >
                Manage
              </Button>
            </>
          }
        />
        <details className="mt-3 rounded-[10px] border border-line-soft bg-surface px-3 py-2">
          <summary className="cursor-pointer text-[11.5px] font-medium text-ink-3">Stored identifiers</summary>
          <div className="tnum mt-2 space-y-1 font-mono text-[11.5px] text-ink-4">
            <p>hotel_id · {connection.hotelId}</p>
            <p>waba_id · {connection.wabaId}</p>
            <p>phone_number_id · {connection.phoneNumberId}</p>
            <p>display_phone_number · {connection.displayPhoneNumber}</p>
            <p>connection_type · {connection.connectionType}</p>
            <p>connection_status · connected</p>
          </div>
        </details>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <SectionTitle
          title={`Connect ${waLabel(connectionType)}`}
          hint="You authorise in Meta — Hotelogx configures the rest"
        />

        <Eyebrow>What will this number be used for?</Eyebrow>
        <div className="mt-2 space-y-2">
          {(
            [
              { key: "guest" as const, label: "Guest communication", note: "Enquiries, requests and upsells" },
              { key: "internal" as const, label: "Internal staff operations", note: "Room statuses, tickets, task cards" },
              { key: "both" as const, label: "Both", note: "One number carries guests and departments" },
            ]
          ).map((option) => {
            const active = usage === option.key;
            return (
              <button
                key={option.key}
                onClick={() => setUsage(option.key)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-[10px] border px-3 py-2.5 text-left transition-colors",
                  active ? "border-pine-400 bg-pine-50/60" : "border-line bg-surface hover:border-ink-4",
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-4 shrink-0 items-center justify-center rounded-full border",
                    active ? "border-pine-600 bg-pine-600 text-white" : "border-line",
                  )}
                >
                  {active && <Check className="size-2.5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium text-ink">{option.label}</span>
                  <span className="block text-[11.5px] text-ink-4">{option.note}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Client Verified Credentials Card */}
        <div className="mt-3.5 rounded-[12px] border border-pine-200 bg-pine-50/50 p-3.5 text-[12px]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium text-pine-900">
              <Sparkles className="size-3.5 text-pine-700" /> Client WhatsApp Cloud API Ready
            </span>
            <span className="rounded-full bg-pine-100 px-2 py-0.5 text-[10.5px] font-semibold text-pine-800">
              Verified
            </span>
          </div>
          <p className="mt-1 font-mono text-[11.5px] text-ink-3">
            Number: <strong className="text-ink">{configuredPhone}</strong> · WABA: <span className="text-ink">{configuredWabaId}</span>
          </p>
        </div>

        <div className="mt-3.5 flex flex-col gap-2">
          <Button
            size="md"
            variant="primary"
            icon={Check}
            onClick={connectConfiguredClientNumber}
            className="w-full justify-center bg-pine-700 text-white hover:bg-pine-800"
          >
            Connect Client Number ({configuredPhone})
          </Button>

          <Button
            size="sm"
            variant="outline"
            icon={MessageCircle}
            onClick={launchWhatsAppSignup}
            className="w-full justify-center text-xs text-ink-3"
          >
            Or Try Facebook Popup (Embedded Signup)
          </Button>
        </div>

        <p className="mt-2.5 flex items-start gap-1.5 border-t border-line-soft pt-3 text-[11.5px] leading-snug text-ink-4">
          <ShieldCheck className="mt-px size-3.5 shrink-0 text-pine-600" />
          Client credentials from .env and Meta Cloud API are pre-configured. Click "Connect Client Number" to activate instantly without Facebook popup restrictions.
        </p>
      </Card>

      {signup && (
        <EmbeddedSignup
          connectionType={connectionType}
          suggestedNumber={suggested}
          onCancel={() => setSignup(false)}
          onDone={(phone, metaIds) => {
            setSignup(false);
            connectWhatsAppNumber(connectionType, phone, metaIds);
          }}
        />
      )}
    </>
  );
}

