import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/listings/new")({
  head: () => ({
    meta: [
      { title: "List an oar | OarExchange Ireland" },
      { name: "description", content: "List a spare oar or one you're looking for." },
      { property: "og:title", content: "List an oar | OarExchange Ireland" },
      { property: "og:description", content: "List a spare oar or one you're looking for." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <h1 className="text-4xl font-bold">List an oar</h1>
      <p className="mt-2 text-muted-foreground">The listing form is coming next.</p>
    </div>
  ),
});
