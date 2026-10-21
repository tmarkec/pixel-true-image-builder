import { createFileRoute } from "@tanstack/react-router";
import { ListingForm } from "@/components/ListingForm";

export const Route = createFileRoute("/_authenticated/listings/new")({
  head: () => ({
    meta: [
      { title: "List an oar | OarExchange Ireland" },
      { name: "description", content: "List a spare oar or one you're looking for." },
      { property: "og:title", content: "List an oar | OarExchange Ireland" },
      { property: "og:description", content: "List a spare oar or one you're looking for." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold">List an oar</h1>
      <p className="mb-8 mt-2 text-muted-foreground">Listings stay up for 60 days. Your email is added from your account.</p>
      <ListingForm />
    </div>
  ),
});
