import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { listingQuery } from "@/lib/listings";
import { ListingCard } from "@/components/ListingDetailsDialog";
import { Dialog } from "@/components/ui/dialog";

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
  errorComponent: ({ error }) => <div role="alert" className="p-8">{error instanceof Error ? error.message : String(error)}</div>,
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
  if (!l) return null;
  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Link to="/" className="text-sm text-primary underline">Back to listings</Link>
      <Dialog open modal={false}>
        <div className="mt-4 overflow-hidden rounded-lg border-2 border-navy"><ListingCard listing={l} /></div>
      </Dialog>
    </div>
  );
}
