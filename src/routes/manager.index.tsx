import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BedDouble,
  ClipboardList,
  LogIn,
  LogOut,
  MessageSquare,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  Users,
  Wrench,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Briefing } from "@/components/Briefing";
import type { BriefLine } from "@/components/Briefing";
import { EscalationCard } from "@/components/EscalationCard";
import { Badge, Button, Card, Empty, Eyebrow, Meter, SectionTitle, Sparkline, StatCard, statusTone } from "@/components/ui";
import { aiTrend, conversationTrend, dailyStats, upsellTrend, weekdays } from "@/lib/data";
import { useCurrentUser } from "@/lib/session";
import { selectors, useApp } from "@/lib/store";
import { greeting, money } from "@/lib/utils";

export const Route = createFileRoute("/manager/")({
  component: ManagerDashboard,
});

function ManagerDashboard() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const escalations = useApp(selectors.escalations);
  const openTasks = useApp(selectors.openTasks);
  const openIssues = useApp(selectors.openIssues);
  const guestRequests = useApp(selectors.guestRequests);
  const rooms = useApp((s) => s.rooms);
  const tasks = useApp((s) => s.tasks);
  const upsellTotal = useApp(selectors.acceptedUpsellTotal);
  const conversations = useApp((s) => s.conversations);

  const roomsToClean = rooms.filter((r) => r.status === "Dirty").length;
  const roomsReady = rooms.filter((r) => r.status === "Clean" || r.status === "Inspected").length;
  const outOfService = rooms.filter((r) => r.status === "Blocked" || r.status === "Maintenance").length;
  const aiHandled = conversations.filter((c) => c.aiStatus === "ai-handling" || c.aiStatus === "resolved").length;

  const briefLines: BriefLine[] = [
    {
      text: `${dailyStats.arrivals} arrivals and ${dailyStats.departures} departures. ${dailyStats.vipArrivals} VIP arrivals, ${dailyStats.earlyCheckIns} early check-ins already agreed.`,
      tone: "ai",
      meta: `${dailyStats.occupancy} occupancy`,
    },
    {
      text: `The AI answered ${dailyStats.conversationsToday} guest messages overnight and this morning, ${dailyStats.aiResolutionRate}% without a human.`,
      tone: "good",
      meta: dailyStats.avgResponse,
    },
    {
      text: `${escalations.length} conversation${escalations.length === 1 ? "" : "s"} need you personally — a warm room in 302 and a billing dispute from a checked-out guest.`,
      tone: "urgent",
    },
    {
      text: `Room 307 is out of service with a shower leak and a VIP arrives at 14:00. Reception has been warned; a decision on moving the guest is yours.`,
      tone: "urgent",
      meta: "MT-115",
    },
    {
      text: `${roomsToClean} rooms still to clean, ${roomsReady} released. Room 401 was released at 12:26 for the 13:00 early arrival.`,
      tone: "attend",
    },
    {
      text: `${money(dailyStats.upsellToday)} of upsells accepted today from ${dailyStats.offersSent} offers — mostly breakfast, parking and one romantic package.`,
      tone: "good",
      meta: `${dailyStats.offersAccepted} accepted`,
    },
  ];

  const priorities = [
    { text: "Decide on 302 — upgrade to 310 or reduce the second night", tone: "urgent" as const, who: "You" },
    { text: "Approve the €47.60 credit note for Nadia Haddad", tone: "urgent" as const, who: "You" },
    { text: "307 shower leak must be closed before the 14:00 VIP arrival", tone: "attend" as const, who: "Maintenance" },
    { text: "Late checkout answer for 205 before 10:30", tone: "attend" as const, who: "Front Office" },
    { text: "Card authorisation failed for 208 — collect a new card at check-in", tone: "attend" as const, who: "Front Office" },
  ];

  const departments = [
    {
      name: "Front Office",
      icon: MessageSquare,
      lead: "Amélie Duprez",
      stat: `${tasks.filter((t) => t.department === "Front Office" && t.status !== "Completed").length} open tasks`,
      note: `${guestRequests.length} live guest requests · ${aiHandled} threads on autopilot`,
      progress: 68,
      tone: "pine" as const,
    },
    {
      name: "Housekeeping",
      icon: BedDouble,
      lead: "Rosa Ferreira",
      stat: `${roomsReady}/${rooms.length} rooms released`,
      note: `${roomsToClean} to clean · updates arriving on WhatsApp`,
      progress: Math.round((roomsReady / rooms.length) * 100),
      tone: "attend" as const,
    },
    {
      name: "Maintenance",
      icon: Wrench,
      lead: "Peter Janssens",
      stat: `${openIssues.length} open issues`,
      note: `${outOfService} rooms affected · 1 waiting for parts`,
      progress: 45,
      tone: "urgent" as const,
    },
  ];

  return (
    <AppShell title="Morning operational briefing">
      <div className="space-y-6">
        <div>
          <Eyebrow>{greeting()}, {user?.name.split(" ")[0]}</Eyebrow>
          <h1 className="mt-1.5 font-display text-[27px] leading-tight font-medium text-ink sm:text-[31px]">
            Here is your hotel this morning.
          </h1>
          <p className="mt-1.5 max-w-2xl text-[13.5px] text-ink-3">
            The AI has already handled everything routine. What is below is what still involves a person.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          <StatCard label="Arrivals" value={dailyStats.arrivals} hint={`${dailyStats.vipArrivals} VIP`} icon={LogIn} tone="pine" delay={0} />
          <StatCard label="Departures" value={dailyStats.departures} hint="4 late checkouts" icon={LogOut} tone="mute" delay={40} />
          <StatCard label="In-house" value={dailyStats.inHouse} hint={`${dailyStats.occupancy} occupancy`} icon={Users} tone="pine" delay={80} />
          <StatCard label="Guest requests" value={guestRequests.length} hint="open right now" icon={MessageSquare} tone="ai" delay={120} />
          <StatCard
            label="Escalations"
            value={escalations.length}
            hint="need a person"
            icon={TriangleAlert}
            tone="urgent"
            emphasis={escalations.length > 0}
            delay={160}
            onClick={() => navigate({ to: "/manager/conversations" })}
          />
          <StatCard label="Open tasks" value={openTasks.length} hint="across 3 departments" icon={ClipboardList} tone="attend" delay={200} onClick={() => navigate({ to: "/manager/tasks" })} />
          <StatCard label="Maintenance" value={openIssues.length} hint={`${outOfService} rooms affected`} icon={Wrench} tone="attend" delay={240} />
        </div>

        <Briefing
          opening="Two things need you: the air conditioning complaint in 302, and a billing dispute from room 411. Everything else is moving."
          lines={briefLines}
          action={
            <Button icon={ArrowRight} onClick={() => navigate({ to: "/manager/conversations" })}>
              View details
            </Button>
          }
          footnote="Compiled at 09:55 from WhatsApp, Gmail, your PMS and every department update received on WhatsApp since midnight."
        />

        <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr] lg:items-start">
          <div className="space-y-4">
            <section>
              <SectionTitle
                title="Needs you now"
                hint="Escalation cards — the AI has already prepared a reply for each"
                action={
                  escalations.length > 0 ? (
                    <Badge tone="urgent" dot>
                      {escalations.length} waiting
                    </Badge>
                  ) : undefined
                }
              />
              <div className="space-y-3">
                {escalations.length === 0 ? (
                  <Empty title="Nothing escalated" hint="The AI is handling every conversation on its own right now." icon={Sparkles} />
                ) : (
                  escalations.map((c) => (
                    <EscalationCard
                      key={c.id}
                      conversation={c}
                      staffName={user?.name ?? "Manager"}
                      onOpen={() => navigate({ to: "/manager/conversations" })}
                    />
                  ))
                )}
              </div>
            </section>

            <section>
              <SectionTitle title="Today's priorities" hint="Ordered by what will cost you a guest if it slips" />
              <Card pad={false}>
                <ol>
                  {priorities.map((p, i) => (
                    <li key={p.text} className="flex items-start gap-3 border-t border-line-soft px-4 py-3 first:border-t-0">
                      <span className="tnum mt-px font-mono text-[11px] text-ink-4">{String(i + 1).padStart(2, "0")}</span>
                      <p className="min-w-0 flex-1 text-[13.5px] leading-snug text-ink-2">{p.text}</p>
                      <Badge tone={p.tone}>{p.who}</Badge>
                    </li>
                  ))}
                </ol>
              </Card>
            </section>
          </div>

          <div className="space-y-4">
            <section>
              <SectionTitle title="Department status" />
              <div className="space-y-3">
                {departments.map((d) => {
                  const Icon = d.icon;
                  return (
                    <Card key={d.name} className="p-4">
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex size-8 items-center justify-center rounded-[9px] border border-line bg-paper">
                          <Icon className="size-4 text-ink-3" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13.5px] font-medium text-ink">{d.name}</p>
                          <p className="text-[11.5px] text-ink-4">{d.lead}</p>
                        </div>
                        <Badge tone={d.tone}>{d.stat}</Badge>
                      </div>
                      <Meter value={d.progress} tone={d.tone} className="mt-3" />
                      <p className="mt-2 text-[11.5px] leading-snug text-ink-3">{d.note}</p>
                    </Card>
                  );
                })}
              </div>
            </section>

            <section>
              <SectionTitle title="This week" hint="Simple numbers, no dashboards to interpret" />
              <Card className="space-y-4">
                {[
                  { label: "Conversations", values: conversationTrend, tone: "pine" as const, value: dailyStats.conversationsToday, suffix: "today" },
                  { label: "AI resolution rate", values: aiTrend, tone: "good" as const, value: `${dailyStats.aiResolutionRate}%`, suffix: "of all threads" },
                  { label: "Upsell revenue", values: upsellTrend, tone: "ai" as const, value: money(dailyStats.upsellToday), suffix: "accepted today" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3 border-t border-line-soft pt-4 first:border-t-0 first:pt-0">
                    <div>
                      <p className="text-[12px] text-ink-3">{row.label}</p>
                      <p className="tnum font-display text-[21px] leading-tight font-medium text-ink">{row.value}</p>
                      <p className="text-[11px] text-ink-4">{row.suffix}</p>
                    </div>
                    <div className="text-right">
                      <Sparkline values={row.values} tone={row.tone} />
                      <p className="tnum mt-1 font-mono text-[10px] text-ink-4">{weekdays.join(" ")}</p>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-line-soft pt-3">
                  <p className="text-[12px] text-ink-3">Accepted upsells, all time in view</p>
                  <p className="tnum inline-flex items-center gap-1 font-mono text-[13px] font-medium text-good">
                    <TrendingUp className="size-3.5" />
                    {money(upsellTotal)}
                  </p>
                </div>
              </Card>
            </section>

            <section>
              <SectionTitle title="What the AI has been doing" hint="Live, across every channel" />
              <Card>
                <ActivityFeed limit={10} compact />
              </Card>
            </section>
          </div>
        </div>

        <section>
          <SectionTitle title="Rooms at a glance" hint="Housekeeping and maintenance keep this current from WhatsApp" />
          <Card pad={false} className="overflow-x-auto">
            <div className="flex min-w-max gap-2 p-4">
              {rooms.map((r) => (
                <div key={r.number} className="w-[104px] shrink-0 rounded-[10px] border border-line bg-paper/60 p-2.5">
                  <p className="tnum font-mono text-[13px] font-medium text-ink">{r.number}</p>
                  <Badge tone={statusTone(r.status)} className="mt-1.5">
                    {r.status}
                  </Badge>
                  <p className="tnum mt-1.5 font-mono text-[10px] text-ink-4">{r.updatedAt}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
