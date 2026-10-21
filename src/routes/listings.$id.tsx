import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { listingQuery, sideLabel, formatDate } from "@/lib/listings";
import { TypeBadge } from "@/components/TypeBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/listings/$id")({
  loader: async ({ context, params }) => {
    const l = await context.queryClient.ensureQueryData(listingQuery(params.id));
    if (!l) throw notFound();
    return { title: `${l.quantity} x ${l.brand} ${l.discipline.toLowerCase()} oar, ${l.county}` };
  },
  head: ({ loaderData }) => {
    const t = loaderData?.title ?? "Listing";
    return {
      meta: [
        { title: `${t} | OarExchange Ireland` },
        { name: "description", content: `Oar listing on OarExchange Ireland: ${t}.` },
        { property: "og:title", content: t },
        { property: "og:description", content: "Oar listing on OarExchange Ireland." },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: ListingPage,
  errorComponent: ({ error }) => <div role="alert" className="p-8">{error.message}</div>,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Listing not found</h1>
      <p className="mt-2 text-muted-foreground">It may have expired or been removed.</p>
      <Link to="/" className="mt-4 inline-block text-primary underline">Back to listings</Link>
    </div>
  ),
});

function ListingPage() {
  const { id } = Route.useParams();
  const { data: l } = useSuspenseQuery(listingQuery(id));
  const { user } = useAuth();
  if (!l) return null;
  const rows: [string, string | number | null][] = [
    ["Quantity", l.quantity], ["Brand", l.brand], ["Discipline", l.discipline], ["Side", sideLabel(l.side)],
    ["Blade", l.blade_type], ["Shaft", l.shaft_type], ["Softness", l.shaft_softness], ["Sleeve", l.sleeve_type],
    ["Handle", l.handle_type], ["Grip", l.grip_type], ["Length", l.length], ["Condition", l.condition],
    ["Offer", l.offer_type], ["County", l.county], ["Club", l.club_name], ["Pickup", l.pickup_event],
    ["Listed", formatDate(l.created_at)], ["Expires", formatDate(l.expires_at)],
  ];
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/" className="text-sm text-primary underline">Back to listings</Link>
      <div className="mt-4 flex items-center gap-3">
        <TypeBadge type={l.listing_type} />
        <h1 className="text-3xl font-bold">{l.quantity} x {l.brand} {l.discipline.toLowerCase()}</h1>
      </div>
      {l.notes && <p className="mt-3 text-muted-foreground">{l.notes}</p>}
      <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        {rows.filter(([, v]) => v !== null && v !== "").map(([k, v]) => (
          <div key={k} className="flex justify-between border-b py-1.5 text-sm">
            <dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      {!user && (
        <div className="mt-8 rounded-md border bg-surface p-4 text-sm">
          <Link to="/login" className="text-primary underline">Log in</Link> or{" "}
          <Link to="/signup" className="text-primary underline">sign up</Link> (it's free) to see contact details.
        </div>
      )}
      {user && <Button className="mt-8" variant="outline" disabled>Contact details coming soon</Button>}
    </div>
  );
}
