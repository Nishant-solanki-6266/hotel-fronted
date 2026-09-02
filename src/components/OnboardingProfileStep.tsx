import { useState } from "react";
import { Check } from "lucide-react";
import { updateHotelProfile, useApp } from "@/lib/store";
import type { HotelProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button, Card, Eyebrow, SectionTitle } from "./ui";

type ProfileTextKey = {
  [K in keyof HotelProfile]: HotelProfile[K] extends string ? K : never;
}[keyof HotelProfile];

const fields: { key: ProfileTextKey; label: string; mono?: boolean; placeholder?: string }[] = [
  { key: "name", label: "Hotel name", placeholder: "Hotel Mercier" },
  { key: "legalName", label: "Legal entity", placeholder: "Hotel Mercier BV" },
  { key: "address", label: "Street", placeholder: "Leopoldstraat 42" },
  { key: "postcode", label: "Postcode", mono: true },
  { key: "city", label: "City" },
  { key: "country", label: "Country" },
  { key: "phone", label: "Reception phone", mono: true },
  { key: "website", label: "Website", mono: true, placeholder: "yourhotel.com" },
  { key: "checkIn", label: "Check-in from", mono: true },
  { key: "checkOut", label: "Check-out by", mono: true },
];

const languageOptions = ["Dutch", "French", "English", "German", "Spanish", "Italian"];

export function OnboardingProfileStep() {
  const profile = useApp((s) => s.hotelProfile);
  const [draft, setDraft] = useState<HotelProfile>(profile);

  const dirty = JSON.stringify(draft) !== JSON.stringify(profile);
  const setField = (key: ProfileTextKey, next: string) =>
    setDraft((d) => {
      const copy = { ...d };
      copy[key] = next;
      return copy;
    });

  return (
    <Card>
      <SectionTitle
        title="Tell us about the hotel"
        hint="These are the facts the AI treats as certain — everything else it looks up"
        action={
          <Button size="sm" icon={Check} disabled={!dirty} onClick={() => updateHotelProfile(draft)}>
            {dirty ? "Save" : "Saved"}
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.key} className="block">
            <span className="text-[11.5px] font-medium text-ink-3">{f.label}</span>
            <input
              value={draft[f.key]}
              placeholder={f.placeholder}
              onChange={(e) => setField(f.key, e.target.value)}
              className={cn(
                "mt-1 w-full rounded-[9px] border border-line bg-surface px-2.5 py-2 outline-none focus:border-pine-400",
                f.mono ? "tnum font-mono text-[12.5px]" : "text-[13px]",
              )}
            />
          </label>
        ))}
        <label className="block">
          <span className="text-[11.5px] font-medium text-ink-3">Rooms</span>
          <input
            value={draft.rooms}
            inputMode="numeric"
            onChange={(e) => setDraft((d) => ({ ...d, rooms: Number(e.target.value.replace(/\D/g, "")) || 0 }))}
            className="tnum mt-1 w-full rounded-[9px] border border-line bg-surface px-2.5 py-2 font-mono text-[12.5px] outline-none focus:border-pine-400"
          />
        </label>
        <label className="block">
          <span className="text-[11.5px] font-medium text-ink-3">Rating</span>
          <select
            value={draft.stars}
            onChange={(e) => setDraft((d) => ({ ...d, stars: Number(e.target.value) }))}
            className="mt-1 w-full rounded-[9px] border border-line bg-surface px-2.5 py-2 text-[13px] outline-none focus:border-pine-400"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} star{n > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 border-t border-line-soft pt-3.5">
        <Eyebrow>Languages your team can proofread</Eyebrow>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {languageOptions.map((language) => {
            const on = draft.languages.includes(language);
            return (
              <button
                key={language}
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    languages: on ? d.languages.filter((l) => l !== language) : [...d.languages, language],
                  }))
                }
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors",
                  on ? "border-pine-400 bg-pine-50/60 text-ink" : "border-line bg-surface text-ink-4 hover:text-ink",
                )}
              >
                {language}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11.5px] leading-snug text-ink-4">
          The AI answers in whatever language the guest writes in. These are the ones a person here can check.
        </p>
      </div>

      <label className="mt-4 block border-t border-line-soft pt-3.5">
        <span className="text-[11.5px] font-medium text-ink-3">How should the AI describe the hotel?</span>
        <textarea
          value={draft.description}
          rows={3}
          onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          placeholder="A 48-room townhouse hotel five minutes from the station…"
          className="mt-1 w-full resize-none rounded-[9px] border border-line bg-surface px-2.5 py-2 text-[13px] leading-relaxed outline-none focus:border-pine-400"
        />
      </label>
    </Card>
  );
}
