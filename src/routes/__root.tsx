/// <reference types="vite/client" />
import { useEffect } from "react";
import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { hydrateSession } from "@/lib/session";
import appCss from "@/styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Hotelogx Connect — AI front office & hotel operations" },
      {
        name: "description",
        content:
          "Hotelogx Connect is an AI front office and hotel operations assistant. It answers guests on WhatsApp and email, coordinates housekeeping and maintenance, and shows your team only what needs a human.",
      },
      { name: "theme-color", content: "#faf8f5" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=Instrument+Sans:wght@400..700&family=IBM+Plex+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
});

function NotFound() {
  return (
    <div className="grain flex min-h-dvh flex-col items-center justify-center gap-3 bg-paper px-4 text-center">
      <h1 className="font-display text-[22px] font-medium text-ink">Page not found</h1>
      <p className="text-[13px] text-ink-3">The page you were looking for doesn't exist.</p>
      <a
        href="/"
        className="mt-2 rounded-[9px] border border-line bg-surface px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:bg-paper"
      >
        Go to dashboard
      </a>
    </div>
  );
}

function RootDocument() {
  useEffect(() => {
    hydrateSession();
  }, []);

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
