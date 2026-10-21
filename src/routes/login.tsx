import { createFileRoute } from "@tanstack/react-router";
import { MagicLinkForm } from "@/components/MagicLinkForm";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in | OarExchange Ireland" },
      { name: "description", content: "Log in to OarExchange Ireland with a link sent to your email." },
      { property: "og:title", content: "Log in | OarExchange Ireland" },
      { property: "og:description", content: "Log in with a link sent to your email." },
    ],
  }),
  component: () => (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <h1 className="text-4xl font-bold">Log in</h1>
      <p className="mt-2 mb-6 text-muted-foreground">No password needed. We'll email you a link.</p>
      <MagicLinkForm mode="login" />
    </div>
  ),
});
