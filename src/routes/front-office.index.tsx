import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BedDouble,
  ClipboardList,
  Crown,
  LogIn,
  LogOut,
  MessageSquare,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Briefing } from "@/components/Briefing";
import type { BriefLine } from "@/components/Briefing";
import { TaskRow } from "@/components/TaskRow";
import { Badge, Button, Card, Empty, Eyebrow, SectionTitle, StatCard, statusTone } from "@/components/ui";
import { dailyStats } from "@/lib/data";
import { useCurrentUser } from "@/lib/session";
import { selectors, useApp } from "@/lib/store";
import { greeting } from "@/lib/utils";

export const Route = createFileRoute("/front-office/")({
  component: FrontOfficeDashboard,
});

function FrontOfficeDashboard() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const escalations = useApp(selectors.escalations);
  const tasks = useApp((s) => s.tasks);
  const rooms = useApp((s) => s.rooms);
  const conversations = useApp((s) => s.conversations);
  const guestRequests = useApp(selectors.guestRequests);

  const myTasks = tasks
    .filter((t) => t.status !== "Completed" && (t.department === "Front Office" || t.department === "VIP" || t.department === "Billing"))
    .slice(0, 6);
  const readyRooms = rooms.filter((r) => r.status === "Clean" || r.status === "Inspected");
  const arrivalsWaiting = rooms.filter((r) => r.arrivalTime && r.status !== "Clean" && r.status !== "Inspected");
  const aiHandling = conversations.filter((c) => c.aiStatus === "ai-handling").length;

  const lines: BriefLine[] = [
    {
      text: `${dailyStats.arrivals} arrivals today. ${readyRooms.length} rooms are released and ${arrivalsWaiting.length} arrivals are still waiting on housekeeping.`,
      tone: "attend",
    },
    { text: "Room 401 was released at 12:26 — Grace Okonkwo's 13:00 early arrival can check in immediately.", tone: "good", meta: "12:26" },
    { text: "Yuki Tanabe (VIP, 5th stay) arrives at 14:00. Amélie is confirming a 20:00 table at De Kleine Zavel.", tone: "pine" },
    { text: "307 is out of service with a shower leak and it is the VIP room. Milan expects to finish within 30 minutes.", tone: "urgent", meta: "MT-115" },
    { text: "Hendrik Vos in 205 is waiting for an answer on a 15:00 checkout — occupancy says 14:00 is safer.", tone: "attend", meta: "before 10:30" },
    { text: `The AI answered ${dailyStats.conversationsToday} messages so far and is holding ${aiHandling} conversations without you.`, tone: "ai" },
    { text: "Priya Raghavan's card authorisation failed twice — ask for a new card at check-in.", tone: "urgent", meta: "208" },
    { text: "Baby cot for 208 and the anniversary package for 310 are both in housekeeping's list.", tone: "good" },
  ];

  return (
    <AppShell title="Front office — your shift, prepared">
      <div className="space-y-6">
        <div>
          <Eyebrow>{greeting()}, {user?.name.split(" ")[0]}</Eyebrow>
          <h1 className="mt-1.5 font-display text-[27px] leading-tight font-medium text-ink sm:text-[30px]">
            You are ahead of the desk today.
          </h1>
          <p className="mt-1.5 max-w-2xl text-[13.5px] text-ink-3">
            The AI has answered everything routine and prepared the rest. Read down, then work the list.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Arrivals" value={dailyStats.arrivals} hint={`${dailyStats.earlyCheckIns} early`} icon={LogIn} tone="pine" delay={0} />
          <StatCard label="Departures" value={dailyStats.departures} hint="4 late checkouts" icon={LogOut} tone="mute" delay={40} />
          <StatCard label="Rooms ready" value={`${readyRooms.length}/${rooms.length}`} hint={`${arrivalsWaiting.length} arrivals waiting`} icon={BedDouble} tone="attend" delay={80} />
          <StatCard label="Open requests" value={guestRequests.length} hint="in-house guests" icon={MessageSquare} tone="ai" delay={120} />
          <StatCard label="VIP arrivals" value={dailyStats.vipArrivals} hint="1 at 14:00" icon={Crown} tone="pine" delay={160} />
          <StatCard
            label="Escalated"
            value={escalations.length}
            hint="need a person"
            icon={TriangleAlert}
            tone="urgent"
            emphasis={escalations.length > 0}
            delay={200}
            onClick={() => navigate({ to: "/front-office/conversations" })}
          />
        </div>

        <Briefing
          eyebrow="AI front office brief"
          opening="Two rooms decide your morning: 401 is ready for the early arrival, 307 is not ready for the VIP."
          lines={lines}
          action={
            <Button icon={ArrowRight} onClick={() => navigate({ to: "/front-office/conversations" })}>
              Open conversations
            </Button>
          }
          footnote="Updated continuously from guest messages, housekeeping and maintenance replies on WhatsApp, and your PMS."
        />

        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr] lg:items-start">
          <section>
            <SectionTitle
              title="Priority tasks"
              hint="Yours first — housekeeping and maintenance have their own lists"
              action={
                <Button size="sm" variant="outline" onClick={() => navigate({ to: "/front-office/tasks" })}>
                  All tasks
                </Button>
              }
            />
            <Card pad={false}>
              {myTasks.length === 0 ? (
                <div className="p-4">
                  <Empty title="Nothing waiting on you" hint="The AI will put anything new here." icon={ClipboardList} />
                </div>
              ) : (
                <ul>
                  {myTasks.map((t) => (
                    <TaskRow key={t.id} task={t} showDepartment={false} />
                  ))}
                </ul>
              )}
            </Card>

            <SectionTitle className="mt-6" title="Arrivals waiting on a room" hint="Live from housekeeping's WhatsApp updates" />
            <Card pad={false}>
              <ul>
                {rooms
                  .filter((r) => r.arrivalTime)
                  .sort((a, b) => (a.arrivalTime ?? "").localeCompare(b.arrivalTime ?? ""))
                  .map((r) => (
                    <li key={r.number} className="flex items-center gap-3 border-b border-line-soft px-4 py-3 last:border-b-0">
                      <span className="tnum inline-flex h-7 min-w-11 items-center justify-center rounded-[7px] border border-line bg-paper-2 font-mono text-[12px] font-medium text-ink-2">
                        {r.number}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-ink">
                          Arrival {r.arrivalTime}
                          {r.vip && <span className="ml-1.5 text-[11px] text-pine-600">VIP</span>}
                        </p>
                        <p className="text-[11.5px] text-ink-4">
                          {r.cleaningType} · {r.cleaner ?? "unassigned"} · updated {r.updatedAt}
                        </p>
                      </div>
                      <Badge tone={statusTone(r.status)} dot>
                        {r.status}
                      </Badge>
                    </li>
                  ))}
              </ul>
            </Card>
          </section>

          <section>
            <SectionTitle title="Recent AI activity" hint="What was handled without you" />
            <Card>
              <ActivityFeed limit={14} compact />
            </Card>

            <Card className="mt-4">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-ai" />
                <Eyebrow>Handover note</Eyebrow>
              </span>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-3">
                Night shift left nothing open. Clara Bertrand in 302 has now written three times about the air conditioning —
                the manager is deciding between an upgrade to 310 and a rate reduction. Do not promise either.
              </p>
            </Card>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
