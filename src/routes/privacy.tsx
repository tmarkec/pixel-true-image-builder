import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy policy | OarExchange Ireland" },
      { name: "description", content: "How OarExchange Ireland stores and shows your details." },
      { property: "og:title", content: "Privacy policy | OarExchange Ireland" },
      { property: "og:description", content: "How we store and show your details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <article className="mx-auto w-full max-w-2xl space-y-4 px-4 py-12">
      <h1 className="text-4xl font-bold">Privacy policy</h1>
      <h2 className="pt-2 text-2xl font-bold">What we keep</h2>
      <p>
        Your email address, so you can log in, and the details you add to a listing. If you add a phone
        number to a listing, we keep that too.
      </p>
      <h2 className="pt-2 text-2xl font-bold">Who can see it</h2>
      <p>
        Listings can be seen by anyone. Contact details are only shown to logged-in members. They are
        never shown to visitors who aren't logged in.
      </p>
      <h2 className="pt-2 text-2xl font-bold">Younger rowers</h2>
      <p>
        You need to be 18 or over, or have permission from a parent, guardian or your club, to sign up.
      </p>
      <h2 className="pt-2 text-2xl font-bold">Removing your details</h2>
      <p>
        You can delete your listings at any time. Listings expire after 60 days. To close your account,
        contact us and we'll remove it along with your listings.
      </p>
      <p className="text-sm text-muted-foreground">
        This page is placeholder text and will be updated. Last updated 21/10/2026.
      </p>
    </article>
  ),
});
