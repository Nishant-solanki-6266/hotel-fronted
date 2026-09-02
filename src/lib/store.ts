import { Store, useStore } from "@tanstack/react-store";
import {
  aiRules as seedRules,
  knowledgeDocs,
  seedActivity,
  seedConversations,
  seedIssues,
  seedRooms,
  seedTasks,
  seedUpsells,
  seedWaThreads,
  hotel,
  planTiers,
  subscription as seedSubscription,
} from "./data";
import type {
  ActivityItem,
  AiRule,
  Channel,
  Conversation,
  Department,
  EmailMethod,
  EmailServerSettings,
  HotelProfile,
  Issue,
  KnowledgeDoc,
  Message,
  Priority,
  OnboardingState,
  OnboardingStepKey,
  PlanKey,
  Role,
  Room,
  RoomStatus,
  Subscription,
  Task,
  TaskSource,
  TaskStatus,
  Upsell,
  WaConnection,
  WaConnectionType,
  WaTopology,
  WaThread,
} from "./types";
import { detectEmail, mockMetaIdentifiers } from "./onboarding";
import { clockNow, money, uid } from "./utils";

type Toast = { id: string; text: string; detail?: string; tone: "good" | "attend" | "urgent" | "ai" };

type AppState = {
  conversations: Conversation[];
  tasks: Task[];
  rooms: Room[];
  issues: Issue[];
  upsells: Upsell[];
  activity: ActivityItem[];
  waThreads: WaThread[];
  aiRules: AiRule[];
  knowledge: KnowledgeDoc[];
  hotelProfile: HotelProfile;
  subscription: Subscription;
  onboarding: OnboardingState;
  aiMode: "Autonomous" | "Approval Required" | "Suggestions Only";
  integrations: {
    pms: { provider: string; connected: boolean; lastSync: string };
    email: { provider: "google" | "microsoft" | "other"; account: string; connected: boolean };
    whatsapp: { connected: boolean; number: string; waba: string; quality: string; templates: number };
  };
  toasts: Toast[];
};

/* ------------------------------------------------------------ onboarding -- */

const allStepsDone: Record<OnboardingStepKey, boolean> = {
  profile: true,
  pms: true,
  email: true,
  "wa-guest": true,
  "wa-internal": true,
  knowledge: true,
  users: true,
  ai: true,
};

const noStepsDone: Record<OnboardingStepKey, boolean> = {
  profile: false,
  pms: false,
  email: false,
  "wa-guest": false,
  "wa-internal": false,
  knowledge: false,
  users: false,
  ai: false,
};

function blankWa(connectionType: WaConnectionType): WaConnection {
  return {
    state: "not-started",
    connectionType,
    hotelId: null,
    wabaId: null,
    phoneNumberId: null,
    displayPhoneNumber: null,
    canSend: false,
    canReceive: false,
    lastActivity: null,
    error: null,
  };
}

/** The seeded hotel is already live, so its wizard reads as finished. */
function connectedOnboarding(): OnboardingState {
  return {
    complete: true,
    startedAt: null,
    waTopology: "separate",
    done: { ...allStepsDone },
    pms: {
      state: "connected",
      provider: "Mews",
      propertyId: "MEWS-4471-MERCIER",
      propertyName: hotel.name,
      lastSync: "2 min ago",
      error: null,
    },
    email: {
      state: "connected",
      address: hotel.email,
      detection: null,
      method: "oauth",
      settings: null,
      connectedAt: "14 Feb 2026",
      lastMessage: "6 min ago",
      error: null,
    },
    waGuest: {
      state: "connected",
      connectionType: "guest",
      hotelId: "htl_mercier_01",
      wabaId: "waba_102944",
      phoneNumberId: "pn_884120",
      displayPhoneNumber: hotel.whatsappNumber,
      canSend: true,
      canReceive: true,
      lastActivity: "2 min ago",
      error: null,
    },
    waInternal: {
      state: "connected",
      connectionType: "internal",
      hotelId: "htl_mercier_01",
      wabaId: "waba_104471",
      phoneNumberId: "pn_884133",
      displayPhoneNumber: "+32 3 227 41 09",
      canSend: true,
      canReceive: true,
      lastActivity: "just now",
      error: null,
    },
    invites: [],
  };
}

/** A hotel opening the product for the first time. */
function freshOnboarding(): OnboardingState {
  return {
    complete: false,
    startedAt: clockNow(),
    waTopology: null,
    done: { ...noStepsDone },
    pms: { state: "not-started", provider: null, propertyId: null, propertyName: null, lastSync: null, error: null },
    email: {
      state: "not-started",
      address: "",
      detection: null,
      method: null,
      settings: null,
      connectedAt: null,
      lastMessage: null,
      error: null,
    },
    waGuest: blankWa("guest"),
    waInternal: blankWa("internal"),
    invites: [],
  };
}

export const store = new Store<AppState>({
  conversations: seedConversations,
  tasks: seedTasks,
  rooms: seedRooms,
  issues: seedIssues,
  upsells: seedUpsells,
  activity: seedActivity,
  waThreads: seedWaThreads,
  aiRules: seedRules,
  knowledge: knowledgeDocs,
  hotelProfile: hotel,
  subscription: seedSubscription,
  onboarding: connectedOnboarding(),
  aiMode: "Autonomous",
  integrations: {
    pms: { provider: "Mews", connected: true, lastSync: "2 min ago" },
    email: { provider: "google", account: "reception@hotelmercier.be", connected: true },
    whatsapp: {
      connected: true,
      number: hotel.whatsappNumber,
      waba: "Hotel Mercier BV · WABA 1029-4471",
      quality: "High",
      templates: 11,
    },
  },
  toasts: [],
});

export function useApp<T>(selector: (state: AppState) => T): T {
  return useStore(store, selector);
}

function set(updater: (state: AppState) => Partial<AppState>) {
  store.setState((s) => ({ ...s, ...updater(s) }));
}

function pushActivity(item: Omit<ActivityItem, "id" | "at"> & { at?: string }) {
  set((s) => ({
    activity: [{ id: uid("a"), at: item.at ?? clockNow(), kind: item.kind, text: item.text, meta: item.meta }, ...s.activity],
  }));
}

function appendMessage(conversationId: string, message: Omit<Message, "id">) {
  set((s) => ({
    conversations: s.conversations.map((c) =>
      c.id === conversationId
        ? { ...c, messages: [...c.messages, { ...message, id: uid("m") }], lastAt: message.at }
        : c,
    ),
  }));
}

/* ---------------------------------------------------------------- toasts -- */

export function toast(text: string, tone: Toast["tone"] = "good", detail?: string) {
  const id = uid("toast");
  set((s) => ({ toasts: [...s.toasts, { id, text, detail, tone }] }));
  setTimeout(() => dismissToast(id), 5200);
}

export function dismissToast(id: string) {
  set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
}

/* --------------------------------------------------------- conversations -- */

export function takeOver(conversationId: string, staffName: string) {
  set((s) => ({
    conversations: s.conversations.map((c) =>
      c.id === conversationId ? { ...c, aiStatus: "human-takeover", escalation: undefined, unread: 0 } : c,
    ),
  }));
  appendMessage(conversationId, {
    author: "system",
    channel: "internal",
    at: clockNow(),
    body: `${staffName} took over this conversation. The AI will stop replying until it is handed back.`,
  });
  pushActivity({ kind: "escalation", text: `${staffName} took over a conversation`, meta: "Dashboard" });
  toast("You are handling this conversation", "ai", "The AI has paused automatic replies");
}

export function returnToAi(conversationId: string) {
  set((s) => ({
    conversations: s.conversations.map((c) => (c.id === conversationId ? { ...c, aiStatus: "ai-handling" } : c)),
  }));
  appendMessage(conversationId, {
    author: "system",
    channel: "internal",
    at: clockNow(),
    body: "Handed back to the AI. Automatic replies resumed for this guest.",
  });
  toast("Returned to the AI", "ai", "Automatic replies resumed");
}

export function sendReply(conversationId: string, body: string, as: "ai" | "staff", staffName?: string) {
  const conversation = store.state.conversations.find((c) => c.id === conversationId);
  if (!conversation) return;
  appendMessage(conversationId, {
    author: as,
    channel: conversation.primaryChannel,
    at: clockNow(),
    body,
    staffName,
    confidence: as === "ai" ? 0.95 : undefined,
  });
  set((s) => ({
    conversations: s.conversations.map((c) =>
      c.id === conversationId
        ? {
            ...c,
            unread: 0,
            escalation: undefined,
            aiStatus: as === "ai" ? "ai-handling" : c.aiStatus === "escalated" ? "human-takeover" : c.aiStatus,
            aiHandledCount: as === "ai" ? c.aiHandledCount + 1 : c.aiHandledCount,
          }
        : c,
    ),
  }));
  pushActivity({
    kind: "ai-reply",
    text:
      as === "ai"
        ? `Approved AI reply sent to ${conversation.guest.name}`
        : `${staffName ?? "Staff"} replied to ${conversation.guest.name}`,
    meta: channelLabel(conversation.primaryChannel),
  });
  toast(as === "ai" ? "AI reply approved and sent" : "Reply sent", "good", `${conversation.guest.name} · ${channelLabel(conversation.primaryChannel)}`);
}

export function addNote(conversationId: string, body: string, staffName: string) {
  appendMessage(conversationId, { author: "staff", channel: "internal", at: clockNow(), body, staffName });
  toast("Internal note added", "ai", "Visible to staff only");
}

export function escalateConversation(conversationId: string, reason: string) {
  set((s) => ({
    conversations: s.conversations.map((c) =>
      c.id === conversationId
        ? {
            ...c,
            aiStatus: "escalated",
            escalation: {
              reason,
              urgency: "High",
              suggested: c.suggestedReply || "Review the thread and reply personally.",
              raisedAt: clockNow(),
            },
          }
        : c,
    ),
  }));
  pushActivity({ kind: "escalation", text: `Conversation escalated — ${reason}`, meta: "Dashboard" });
  toast("Escalated to the manager", "urgent", reason);
}

export function resolveConversation(conversationId: string) {
  const conversation = store.state.conversations.find((c) => c.id === conversationId);
  set((s) => ({
    conversations: s.conversations.map((c) =>
      c.id === conversationId ? { ...c, aiStatus: "resolved", escalation: undefined, unread: 0 } : c,
    ),
  }));
  pushActivity({ kind: "ai-reply", text: `Resolved the conversation with ${conversation?.guest.name ?? "the guest"}`, meta: "Dashboard" });
  toast("Marked as resolved", "good");
}

export function markRead(conversationId: string) {
  set((s) => ({
    conversations: s.conversations.map((c) => (c.id === conversationId ? { ...c, unread: 0 } : c)),
  }));
}

export function acceptUpsell(conversationId: string, label: string, value: string) {
  const conversation = store.state.conversations.find((c) => c.id === conversationId);
  if (!conversation) return;
  const numeric = Number(value.replace(/[^0-9.]/g, "")) || 0;
  set((s) => ({
    upsells: [
      {
        id: uid("up"),
        guest: conversation.guest.name,
        room: conversation.guest.room,
        offer: label,
        value: numeric,
        channel: conversation.primaryChannel,
        status: "Sent",
        date: `Today ${clockNow()}`,
      },
      ...s.upsells,
    ],
    conversations: s.conversations.map((c) =>
      c.id === conversationId ? { ...c, upsellIdeas: c.upsellIdeas.filter((u) => u.label !== label) } : c,
    ),
  }));
  appendMessage(conversationId, {
    author: "ai",
    channel: conversation.primaryChannel,
    at: clockNow(),
    confidence: 0.96,
    body: `One more thing — we can add ${label.toLowerCase()} for ${value}. Would you like me to arrange it?`,
    buttons: ["Yes please", "No thank you"],
  });
  pushActivity({ kind: "upsell", text: `Offered ${label} to ${conversation.guest.name}`, meta: value });
  toast("Offer sent to the guest", "good", `${label} · ${value}`);
}

/* ----------------------------------------------------------------- tasks -- */

export function createTask(input: {
  title: string;
  detail?: string;
  room?: string;
  guest?: string;
  department: Department;
  priority: Priority;
  due?: string;
  assignee?: string;
  source: TaskSource;
  conversationId?: string;
}) {
  const id = uid("t");
  const task: Task = {
    id,
    title: input.title,
    detail: input.detail,
    room: input.room,
    guest: input.guest,
    department: input.department,
    priority: input.priority,
    createdAt: clockNow(),
    due: input.due,
    assignee: input.assignee,
    status: input.assignee ? "Assigned" : "New",
    source: input.source,
    conversationId: input.conversationId,
    trail: [{ at: clockNow(), text: `Created from ${input.source}`, via: input.source.startsWith("Guest") ? "ai" : "dashboard" }],
  };
  set((s) => ({
    tasks: [task, ...s.tasks],
    conversations: input.conversationId
      ? s.conversations.map((c) => (c.id === input.conversationId ? { ...c, taskIds: [...c.taskIds, id] } : c))
      : s.conversations,
  }));
  pushActivity({
    kind: "task",
    text: `${input.department} task created — ${input.title}${input.room ? ` (${input.room})` : ""}`,
    meta: input.assignee ? `Sent to ${input.assignee} on WhatsApp` : "Unassigned",
  });
  toast("Task created", "good", `${input.department}${input.assignee ? ` · ${input.assignee}` : ""}`);
  return id;
}

const guestClosingLine: Record<Department, (room?: string) => string> = {
  Housekeeping: () => "That is taken care of now — housekeeping has confirmed it. Anything else I can arrange?",
  Maintenance: (room) => `Our technician has finished the work${room ? ` in ${room}` : ""}. Please let me know if anything is still not right.`,
  "Front Office": () => "All arranged — reception has confirmed it for you.",
  "Guest Request": () => "Your request has been completed. Let me know if you need anything else.",
  VIP: () => "Everything is prepared for your arrival. We look forward to welcoming you.",
  Billing: () => "Your invoice has been corrected and a copy is on its way by email.",
  "Follow-up": () => "This is now closed on our side — thank you for your patience.",
};

export function setTaskStatus(taskId: string, status: TaskStatus, note?: string) {
  const task = store.state.tasks.find((t) => t.id === taskId);
  if (!task) return;
  set((s) => ({
    tasks: s.tasks.map((t) =>
      t.id === taskId
        ? { ...t, status, trail: [...t.trail, { at: clockNow(), text: note ?? `Status set to ${status}`, via: "dashboard" as const }] }
        : t,
    ),
  }));
  if (status === "Completed") {
    pushActivity({ kind: "task", text: `Completed — ${task.title}${task.room ? ` (${task.room})` : ""}`, meta: task.department });
    if (task.conversationId) {
      appendMessage(task.conversationId, {
        author: "ai",
        channel: store.state.conversations.find((c) => c.id === task.conversationId)?.primaryChannel ?? "whatsapp",
        at: clockNow(),
        confidence: 0.97,
        body: guestClosingLine[task.department](task.room),
      });
      toast("Task completed — guest informed automatically", "good", task.title);
      return;
    }
    toast("Task completed", "good", task.title);
    return;
  }
  toast(`Task ${status.toLowerCase()}`, "ai", task.title);
}

export function assignTask(taskId: string, assignee: string) {
  set((s) => ({
    tasks: s.tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            assignee,
            status: t.status === "New" ? "Assigned" : t.status,
            trail: [...t.trail, { at: clockNow(), text: `Assigned to ${assignee}, sent on WhatsApp`, via: "whatsapp" as const }],
          }
        : t,
    ),
  }));
  toast(`Sent to ${assignee}`, "good", "Delivered as a WhatsApp task card");
}

/* ----------------------------------------------------------------- rooms -- */

const statusFromButton: Record<string, RoomStatus> = {
  "Start Cleaning": "Cleaning",
  Cleaned: "Clean",
  "Needs Inspection": "Clean",
  "Guest Inside": "Guest Inside",
  DND: "DND",
  "Maintenance Issue": "Maintenance",
};

export function setRoomStatus(roomNumber: string, status: RoomStatus, via: "dashboard" | "whatsapp" = "dashboard") {
  const room = store.state.rooms.find((r) => r.number === roomNumber);
  set((s) => ({
    rooms: s.rooms.map((r) => (r.number === roomNumber ? { ...r, status, updatedAt: clockNow() } : r)),
  }));
  pushActivity({
    kind: "room",
    text: `Room ${roomNumber} is now ${status}`,
    meta: via === "whatsapp" ? "WhatsApp" : "Dashboard",
  });

  const released = status === "Clean" || status === "Inspected";
  if (released) {
    const housekeepingTasks = store.state.tasks.filter(
      (t) => t.room === roomNumber && t.department === "Housekeeping" && t.status !== "Completed",
    );
    housekeepingTasks.forEach((t) => {
      set((s) => ({
        tasks: s.tasks.map((x) =>
          x.id === t.id
            ? { ...x, status: "Completed" as TaskStatus, trail: [...x.trail, { at: clockNow(), text: "Room released — task closed", via }] }
            : x,
        ),
      }));
      if (t.conversationId) {
        appendMessage(t.conversationId, {
          author: "ai",
          channel: store.state.conversations.find((c) => c.id === t.conversationId)?.primaryChannel ?? "whatsapp",
          at: clockNow(),
          confidence: 0.98,
          body: "Good news — your room is ready. Come to reception whenever you like and we will hand over the key.",
        });
      }
    });
    if (room?.arrivalTime) {
      pushActivity({
        kind: "task",
        text: `Reception told room ${roomNumber} is ready for the ${room.arrivalTime} arrival`,
        meta: "Front Office",
      });
      toast(`Room ${roomNumber} released`, "good", `Reception notified for the ${room.arrivalTime} arrival`);
      return;
    }
    toast(`Room ${roomNumber} released`, "good", "Front Office dashboard updated");
    return;
  }
  toast(`Room ${roomNumber} — ${status}`, status === "Maintenance" ? "attend" : "ai");
}

/* ---------------------------------------------------------------- issues -- */

export function createIssue(input: {
  room: string;
  title: string;
  detail?: string;
  priority: Priority;
  reportedBy: string;
  via: string;
  assignee?: string;
}) {
  const numbers = store.state.issues.map((i) => Number(i.id.replace("MT-", "")) || 0);
  const id = `MT-${Math.max(100, ...numbers) + 1}`;
  const issue: Issue = {
    id,
    room: input.room,
    title: input.title,
    detail: input.detail,
    priority: input.priority,
    reportedBy: input.reportedBy,
    via: input.via,
    createdAt: clockNow(),
    assignee: input.assignee,
    status: input.assignee ? "Accepted" : "Open",
    outOfService: input.priority === "Urgent",
    updates: [{ at: clockNow(), text: `Reported by ${input.reportedBy} — ${input.via}`, via: "whatsapp" }],
  };
  set((s) => ({ issues: [issue, ...s.issues] }));
  pushActivity({ kind: "maintenance", text: `${id} opened — ${input.title} (${input.room})`, meta: input.via });
  return id;
}

export function setIssueStatus(issueId: string, status: Issue["status"], note?: string) {
  const issue = store.state.issues.find((i) => i.id === issueId);
  if (!issue) return;
  set((s) => ({
    issues: s.issues.map((i) =>
      i.id === issueId
        ? {
            ...i,
            status,
            outOfService: status === "Completed" ? false : i.outOfService,
            updates: [...i.updates, { at: clockNow(), text: note ?? `Status set to ${status}`, via: "dashboard" as const }],
          }
        : i,
    ),
  }));

  if (status === "Completed") {
    const roomExists = store.state.rooms.some((r) => r.number === issue.room);
    if (roomExists) {
      set((s) => ({
        rooms: s.rooms.map((r) =>
          r.number === issue.room ? { ...r, status: "Dirty" as RoomStatus, updatedAt: clockNow(), note: "Recheck after maintenance" } : r,
        ),
      }));
    }
    store.state.tasks
      .filter((t) => t.room === issue.room && t.department === "Maintenance" && t.status !== "Completed")
      .forEach((t) => {
        set((s) => ({
          tasks: s.tasks.map((x) =>
            x.id === t.id
              ? { ...x, status: "Completed" as TaskStatus, trail: [...x.trail, { at: clockNow(), text: `${issueId} completed`, via: "whatsapp" as const }] }
              : x,
          ),
        }));
        if (t.conversationId) {
          appendMessage(t.conversationId, {
            author: "ai",
            channel: store.state.conversations.find((c) => c.id === t.conversationId)?.primaryChannel ?? "whatsapp",
            at: clockNow(),
            confidence: 0.96,
            body: `Our technician has finished the work in room ${issue.room}. Please tell me if anything is still not right and I will send someone back.`,
          });
        }
      });
    pushActivity({
      kind: "maintenance",
      text: `${issueId} completed — room ${issue.room} back for a recheck`,
      meta: "Front Office and Manager updated",
    });
    toast(`${issueId} completed`, "good", `Room ${issue.room} sent back to housekeeping for a recheck`);
    return;
  }

  pushActivity({ kind: "maintenance", text: `${issueId} — ${status}`, meta: issue.room });
  toast(`${issueId} — ${status}`, status === "Escalated" ? "urgent" : "attend", note);
}

export function assignIssue(issueId: string, assignee: string) {
  set((s) => ({
    issues: s.issues.map((i) =>
      i.id === issueId
        ? {
            ...i,
            assignee,
            status: i.status === "Open" ? "Accepted" : i.status,
            updates: [...i.updates, { at: clockNow(), text: `Assigned to ${assignee} on WhatsApp`, via: "whatsapp" as const }],
          }
        : i,
    ),
  }));
  toast(`${issueId} sent to ${assignee}`, "good", "WhatsApp ticket delivered");
}

/* ------------------------------------------------------- whatsapp engine -- */

function roomFromBody(body: string) {
  const match = body.match(/Room:?\s*(\d{3})/) ?? body.match(/\b(\d{3})\b/);
  return match?.[1];
}

function waPush(threadId: string, body: string, buttons?: string[]) {
  set((s) => ({
    waThreads: s.waThreads.map((t) =>
      t.id === threadId
        ? {
            ...t,
            messages: [
              ...t.messages,
              { id: uid("wa"), from: "hotelogx" as const, at: clockNow(), body, buttons: buttons?.map((label) => ({ label })) },
            ],
          }
        : t,
    ),
  }));
}

export function waChoose(threadId: string, messageId: string, label: string) {
  const thread = store.state.waThreads.find((t) => t.id === threadId);
  const message = thread?.messages.find((m) => m.id === messageId);
  if (!thread || !message || message.chosen) return;

  set((s) => ({
    waThreads: s.waThreads.map((t) =>
      t.id === threadId ? { ...t, messages: t.messages.map((m) => (m.id === messageId ? { ...m, chosen: label } : m)) } : t,
    ),
  }));

  const room = roomFromBody(message.body);

  /* housekeeping ---------------------------------------------------------- */
  if (thread.department === "Housekeeping") {
    if (/^\d{3}$/.test(label)) {
      const target = store.state.rooms.find((r) => r.number === label);
      waPush(
        threadId,
        `Room ${label} — ${target?.cleaningType ?? "Departure"}${target?.arrivalTime ? `\nArrival at ${target.arrivalTime}, please prioritise.` : ""}\n\nChoose status:`,
        ["Start Cleaning", "Guest Inside", "DND", "Maintenance Issue"],
      );
      return;
    }
    if (label === "Try again now" && room) {
      waPush(threadId, `Room ${room} — choose status:`, ["Start Cleaning", "Guest Inside", "DND", "Maintenance Issue"]);
      return;
    }

    const mapped = statusFromButton[label];
    if (!mapped || !room) return;

    if (label === "Maintenance Issue") {
      setRoomStatus(room, "Maintenance", "whatsapp");
      const issueId = createIssue({
        room,
        title: "Issue reported during cleaning",
        detail: `${thread.contact} flagged a problem in ${room} while cleaning. Awaiting technician assessment.`,
        priority: "High",
        reportedBy: thread.contact,
        via: "Housekeeping via WhatsApp",
      });
      createTask({
        title: `Check reported issue in ${room}`,
        detail: `Raised by ${thread.contact} during the clean. Ticket ${issueId}.`,
        room,
        department: "Maintenance",
        priority: "High",
        source: "Housekeeping",
      });
      waPush(
        threadId,
        `Thank you. Ticket ${issueId} has been opened for room ${room} and our technical team has been notified on WhatsApp. Reception knows the room is held.\n\nWhen you can continue:`,
        ["Start Cleaning", "Guest Inside", "DND"],
      );
      waPush("wa-peter", `New Maintenance Request\n\nRoom: ${room}\nIssue: Issue reported during cleaning\nPriority: High\nReported by: ${thread.contact} via WhatsApp`, [
        "Accept",
        "Unable to Handle",
      ]);
      return;
    }

    setRoomStatus(room, mapped, "whatsapp");

    if (label === "Start Cleaning") {
      waPush(threadId, `Room ${room} — cleaning in progress since ${clockNow()}.\n\nWhen you are done:`, [
        "Cleaned",
        "Needs Inspection",
        "Maintenance Issue",
      ]);
      return;
    }
    if (label === "Cleaned" || label === "Needs Inspection") {
      const target = store.state.rooms.find((r) => r.number === room);
      const next = store.state.rooms.find((r) => r.status === "Dirty" && r.cleaner === thread.contact);
      waPush(
        threadId,
        `Thank you. ${room} is released${target?.arrivalTime ? ` and reception has been told it is ready for the ${target.arrivalTime} arrival` : " and the dashboards are updated"}.${
          next ? `\n\nNext room: ${next.number} — ${next.cleaningType}${next.arrivalTime ? `, arrival ${next.arrivalTime}` : ""}.` : "\n\nThat is your list finished — thank you."
        }`,
        next ? ["Start Cleaning", "Guest Inside", "DND", "Maintenance Issue"] : undefined,
      );
      return;
    }
    if (label === "DND" || label === "Guest Inside") {
      waPush(
        threadId,
        `Noted — ${room} marked ${label}. I will remind you in 90 minutes and reception can see the room is not available yet.`,
        ["Try again now"],
      );
      return;
    }
    return;
  }

  /* maintenance ----------------------------------------------------------- */
  if (thread.department === "Maintenance") {
    const issue = room ? store.state.issues.find((i) => i.room === room && i.status !== "Completed") : undefined;

    if (label === "Accept" && issue) {
      assignIssue(issue.id, thread.contact);
      waPush(
        threadId,
        `Thank you. ${issue.id} is assigned to you and the guest has been told a technician is on the way.\n\nRoom ${issue.room} — when you have finished:`,
        ["Completed", "Parts Required", "External Technician Required"],
      );
      return;
    }
    if (label === "Unable to Handle" && issue) {
      setIssueStatus(issue.id, "Escalated", `${thread.contact} cannot handle this — external help needed`);
      waPush(threadId, `Understood. ${issue.id} has been escalated to the manager and an external technician will be arranged.`);
      return;
    }
    if (label === "Completed" && issue) {
      setIssueStatus(issue.id, "Completed", `${thread.contact} marked the work complete on WhatsApp`);
      waPush(
        threadId,
        `Thank you. ${issue.id} is closed, room ${issue.room} has gone back to housekeeping for a recheck and the guest has been informed automatically.`,
      );
      return;
    }
    if (label === "Parts Required" && issue) {
      setIssueStatus(issue.id, "Waiting Parts", `${thread.contact} needs parts before the work can continue`);
      createTask({
        title: `Order parts for ${issue.id} (${issue.room})`,
        detail: issue.title,
        room: issue.room,
        department: "Maintenance",
        priority: "Normal",
        source: "AI Detection",
        assignee: "Peter Janssens",
      });
      waPush(threadId, `Noted — ${issue.id} is on hold for parts. A purchase task has been created and reception knows the room stays out of service.`);
      return;
    }
    if (label === "External Technician Required" && issue) {
      setIssueStatus(issue.id, "Escalated", "External technician required — manager approval needed");
      waPush(threadId, `Understood. ${issue.id} has been escalated for an external technician and the manager can see it on the dashboard.`);
      return;
    }
    return;
  }
}

/* -------------------------------------------------------------- settings -- */

export function setAiMode(mode: AppState["aiMode"]) {
  set(() => ({ aiMode: mode }));
  toast(`AI mode set to ${mode}`, "ai");
}

export function setAiRule(topic: string, mode: AiRule["mode"]) {
  set((s) => ({ aiRules: s.aiRules.map((r) => (r.topic === topic ? { ...r, mode } : r)) }));
  toast(`${topic} — ${mode}`, "ai");
}

export function setEmailProvider(provider: "google" | "microsoft" | "other", account: string) {
  set((s) => ({ integrations: { ...s.integrations, email: { provider, account, connected: true } } }));
  toast("Mailbox connected", "good", account);
}

export function toggleWhatsApp() {
  set((s) => ({
    integrations: { ...s.integrations, whatsapp: { ...s.integrations.whatsapp, connected: !s.integrations.whatsapp.connected } },
  }));
  toast(store.state.integrations.whatsapp.connected ? "WhatsApp connected" : "WhatsApp disconnected", store.state.integrations.whatsapp.connected ? "good" : "urgent");
}

export function updateHotelProfile(patch: Partial<HotelProfile>) {
  set((s) => ({ hotelProfile: { ...s.hotelProfile, ...patch } }));
  toast("Hotel profile saved", "good", "The AI uses these details when it answers guests");
}

export function setBillingCycle(billingCycle: Subscription["billingCycle"]) {
  set((s) => ({ subscription: { ...s.subscription, billingCycle } }));
  toast(
    billingCycle === "yearly" ? "Switched to yearly billing" : "Switched to monthly billing",
    "good",
    billingCycle === "yearly" ? "Two months free — applied at the next renewal" : "Billed on the 14th of each month",
  );
}

export function setPlan(plan: PlanKey) {
  const tier = planTiers.find((t) => t.key === plan);
  if (!tier) return;
  set((s) => ({ subscription: { ...s.subscription, plan } }));
  const rooms = store.state.subscription.rooms;
  toast(`Plan changed to ${tier.name}`, "good", `${rooms} rooms · ${money(tier.pricePerRoom * rooms)} per month`);
}

export function addKnowledgeDoc(name: string, category: KnowledgeDoc["category"]) {
  const format = (name.split(".").pop() ?? "pdf").toUpperCase();
  const doc: KnowledgeDoc = {
    id: uid("k"),
    name,
    category,
    format: format === "DOC" ? "DOCX" : (format as KnowledgeDoc["format"]),
    size: "—",
    updated: "Just now",
    status: "Processing",
    aiReady: false,
    usedToday: 0,
  };
  set((s) => ({ knowledge: [doc, ...s.knowledge] }));
  toast("Uploaded — indexing", "ai", `${name} will be available to the AI shortly`);
  setTimeout(() => {
    set((s) => ({ knowledge: s.knowledge.map((k) => (k.id === doc.id ? { ...k, status: "Indexed", aiReady: true } : k)) }));
    toast("Indexed and ready", "good", name);
  }, 2600);
}

export function removeKnowledgeDoc(id: string) {
  const doc = store.state.knowledge.find((k) => k.id === id);
  set((s) => ({ knowledge: s.knowledge.filter((k) => k.id !== id) }));
  toast("Source removed", "attend", doc?.name);
}

/* ------------------------------------------------------ onboarding flow -- */

export function startOnboarding() {
  set(() => ({
    onboarding: freshOnboarding(),
    integrations: {
      pms: { provider: "", connected: false, lastSync: "never" },
      email: { provider: "google", account: "", connected: false },
      whatsapp: { connected: false, number: "", waba: "", quality: "—", templates: 0 },
    },
  }));
}

export function markOnboardingStep(step: OnboardingStepKey, done = true) {
  set((s) => ({ onboarding: { ...s.onboarding, done: { ...s.onboarding.done, [step]: done } } }));
}

export function setWaTopology(waTopology: WaTopology) {
  set((s) => ({
    onboarding: {
      ...s.onboarding,
      waTopology,
      // a single number covers both roles; guest-only leaves staff on the dashboard
      done: { ...s.onboarding.done, "wa-internal": waTopology === "separate" ? s.onboarding.done["wa-internal"] : true },
    },
  }));
}

export function connectPms(provider: string, propertyId: string) {
  set((s) => ({
    onboarding: {
      ...s.onboarding,
      pms: {
        state: "connected",
        provider,
        propertyId,
        propertyName: s.hotelProfile.name,
        lastSync: "just now",
        error: null,
      },
      done: { ...s.onboarding.done, pms: true },
    },
    integrations: { ...s.integrations, pms: { provider, connected: true, lastSync: "just now" } },
  }));
  toast(`${provider} connected`, "good", "Read-only — availability, rates and arrivals");
}

/**
 * Runs the backend lookup chain (MX -> provider, then autodiscovery) and stores the
 * verdict. Connecting is a separate step, because the method depends on the answer.
 */
export async function runEmailDetection(address: string) {
  set((s) => ({
    onboarding: {
      ...s.onboarding,
      email: { ...s.onboarding.email, address, state: "in-progress", detection: null, error: null },
    },
  }));

  const detection = await detectEmail(address);

  set((s) => ({
    onboarding: {
      ...s.onboarding,
      email: {
        ...s.onboarding.email,
        address,
        state: "in-progress",
        detection,
        method: detection.method,
        settings: detection.settings,
      },
    },
  }));

  return detection;
}

export function connectEmail(method: EmailMethod, settings: EmailServerSettings | null = null) {
  const detection = store.state.onboarding.email.detection;
  const address = store.state.onboarding.email.address;
  const provider: "google" | "microsoft" | "other" =
    detection?.provider === "google" ? "google" : detection?.provider === "microsoft" ? "microsoft" : "other";

  set((s) => ({
    onboarding: {
      ...s.onboarding,
      email: {
        ...s.onboarding.email,
        state: "connected",
        method,
        settings: settings ?? s.onboarding.email.settings,
        connectedAt: "just now",
        lastMessage: "waiting for the first message",
        error: null,
      },
      done: { ...s.onboarding.done, email: true },
    },
    integrations: { ...s.integrations, email: { provider, account: address, connected: true } },
  }));

  toast("Mailbox connected", "good", `${address} · ${detection?.providerName ?? "manual setup"}`);
}

export function failEmailConnection(message: string) {
  set((s) => ({ onboarding: { ...s.onboarding, email: { ...s.onboarding.email, state: "error", error: message } } }));
  toast("Could not connect the mailbox", "urgent", message);
}

/**
 * Stands in for the callback of Meta's Embedded Signup: the identifiers arrive from
 * Meta, we store them and never ask the manager for a token.
 */
export function connectWhatsAppNumber(connectionType: WaConnectionType, phone: string) {
  const ids = mockMetaIdentifiers(connectionType, phone);
  const connection: WaConnection = {
    state: "connected",
    connectionType,
    hotelId: ids.hotelId,
    wabaId: ids.wabaId,
    phoneNumberId: ids.phoneNumberId,
    displayPhoneNumber: ids.displayPhoneNumber,
    canSend: true,
    canReceive: true,
    lastActivity: "just now",
    error: null,
  };

  set((s) => {
    const single = s.onboarding.waTopology === "single";
    return {
      onboarding: {
        ...s.onboarding,
        waGuest: connectionType === "guest" || single ? { ...connection, connectionType: "guest" } : s.onboarding.waGuest,
        waInternal:
          connectionType === "internal" || single ? { ...connection, connectionType: "internal" } : s.onboarding.waInternal,
        done: {
          ...s.onboarding.done,
          "wa-guest": connectionType === "guest" || single ? true : s.onboarding.done["wa-guest"],
          "wa-internal": connectionType === "internal" || single ? true : s.onboarding.done["wa-internal"],
        },
      },
      integrations: {
        ...s.integrations,
        whatsapp: {
          connected: true,
          number: connectionType === "guest" || single ? phone : s.integrations.whatsapp.number || phone,
          waba: `${s.hotelProfile.legalName} · ${ids.wabaId}`,
          quality: "Pending",
          templates: 0,
        },
      },
    };
  });

  toast(`${connectionType === "guest" ? "Guest" : "Internal"} WhatsApp connected`, "good", phone);
}

export function testWhatsApp(connectionType: WaConnectionType) {
  set((s) => ({
    onboarding: {
      ...s.onboarding,
      waGuest:
        connectionType === "guest" ? { ...s.onboarding.waGuest, lastActivity: "just now" } : s.onboarding.waGuest,
      waInternal:
        connectionType === "internal" ? { ...s.onboarding.waInternal, lastActivity: "just now" } : s.onboarding.waInternal,
    },
  }));
  toast("Test message delivered", "good", connectionType === "guest" ? "Sent to your own number" : "Sent to the duty manager");
}

export function addOnboardingInvite(email: string, role: Role) {
  set((s) => ({
    onboarding: {
      ...s.onboarding,
      invites: [...s.onboarding.invites, { email, role }],
      done: { ...s.onboarding.done, users: true },
    },
  }));
  toast("Invitation sent", "good", email);
}

export function removeOnboardingInvite(email: string) {
  set((s) => ({ onboarding: { ...s.onboarding, invites: s.onboarding.invites.filter((i) => i.email !== email) } }));
}

export function completeOnboarding() {
  set((s) => ({ onboarding: { ...s.onboarding, complete: true } }));
  toast("Setup finished", "good", "Your workspace is live");
}

/* ------------------------------------------------------------- selectors -- */

export function channelLabel(channel: Channel) {
  switch (channel) {
    case "whatsapp":
      return "WhatsApp";
    case "gmail":
      return "Gmail";
    case "outlook":
      return "Outlook";
    case "email":
      return "Email";
    case "ai":
      return "AI";
    case "staff":
      return "Staff";
    default:
      return "Internal";
  }
}

export const selectors = {
  openTasks: (s: AppState) => s.tasks.filter((t) => t.status !== "Completed"),
  escalations: (s: AppState) => s.conversations.filter((c) => c.aiStatus === "escalated"),
  openIssues: (s: AppState) => s.issues.filter((i) => i.status !== "Completed"),
  urgentIssues: (s: AppState) => s.issues.filter((i) => i.status !== "Completed" && i.priority === "Urgent"),
  roomsToClean: (s: AppState) => s.rooms.filter((r) => r.status === "Dirty"),
  roomsCleaning: (s: AppState) => s.rooms.filter((r) => r.status === "Cleaning"),
  roomsClean: (s: AppState) => s.rooms.filter((r) => r.status === "Clean" || r.status === "Inspected"),
  pendingRelease: (s: AppState) => s.rooms.filter((r) => r.arrivalTime && r.status !== "Clean" && r.status !== "Inspected"),
  guestRequests: (s: AppState) => s.conversations.filter((c) => c.aiStatus !== "resolved" && c.stage === "in-house"),
  acceptedUpsellTotal: (s: AppState) =>
    s.upsells.filter((u) => u.status === "Accepted").reduce((sum, u) => sum + u.value, 0),
};
