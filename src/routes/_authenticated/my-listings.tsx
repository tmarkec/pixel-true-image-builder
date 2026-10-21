import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/my-listings")({
  head: () => ({
    meta: [
      { title: "My listings | OarExchange Ireland" },
      { name: "description", content: "Manage the oars you've listed." },
      { property: "og:title", content: "My listings | OarExchange Ireland" },
      { property: "og:description", content: "Manage the oars you've listed." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1 className="text-4xl font-bold">My listings</h1>
      <p className="mt-2 text-muted-foreground">Your listings will appear here.</p>
    </div>
  ),
});
