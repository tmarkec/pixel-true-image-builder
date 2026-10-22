import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Archive, RotateCcw, Trash2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TypeBadge } from "@/components/TypeBadge";
import { formatDate, sideLabel } from "@/lib/listings";
import { getOwnListings, updateOwnListing } from "@/lib/management.functions";
import { ListingStatus } from "@/components/ListingStatus";
import { ConfirmListingDelete } from "@/components/ConfirmListingDelete";
import { ManagementLoading, ManagementError, ManagementNotFound } from "@/components/ManagementStates";

const ownListingsQuery = queryOptions({ queryKey: ["my-listings"], queryFn: () => getOwnListings() });

export const Route = createFileRoute("/_authenticated/my-listings")({
  head: () => ({
    meta: [
      { title: "My listings | OarExchange Ireland" },
      { name: "description", content: "Manage the oars you've listed." },
      { property: "og:title", content: "My listings | OarExchange Ireland" },
      { property: "og:description", content: "Manage the oars you've listed." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(ownListingsQuery),
  pendingComponent: ManagementLoading,
  errorComponent: ManagementError,
  notFoundComponent: ManagementNotFound,
  component: MyListings,
});

function MyListings() {
  const { data } = useSuspenseQuery(ownListingsQuery);
  const update = useServerFn(updateOwnListing);
  const qc = useQueryClient();
  const [deleting, setDeleting] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: (input: { id: string; action: "matched" | "archived" | "renew" | "delete" }) => update({ data: input }),
    onSuccess: async (_result, input) => {
      setDeleting(null);
      toast.success(input.action === "delete" ? "Listing deleted." : input.action === "renew" ? "Listing renewed for 60 days." : input.action === "matched" ? "Listing marked as matched." : "Listing archived.");
      await qc.invalidateQueries();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl font-bold">My listings</h1>
        <Button asChild><Link to="/listings/new"><Plus className="h-4 w-4" />List an oar</Link></Button>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {!data.length ? <div className="border-y py-10 md:col-span-2"><h2 className="font-display text-xl font-semibold">You haven't listed anything yet.</h2><Button asChild variant="outline" className="mt-4"><Link to="/listings/new">List an oar</Link></Button></div>
          : data.map((l) => (
            <div key={l.id} className="flex min-w-0 flex-col rounded-lg border bg-card p-5">
              <div className="flex items-start justify-between gap-3"><TypeBadge type={l.listing_type} /><ListingStatus status={l.status} expiresAt={l.expires_at} /></div>
              <h2 className="mt-4 font-display text-xl font-semibold">{l.quantity} x {l.brand} {l.discipline.toLowerCase()}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{sideLabel(l.side)} · {l.county}</p>
              <p className="mt-2 text-xs text-muted-foreground">Listed {formatDate(l.created_at)}</p>
              {l.status === "hidden" && <p className="mt-3 text-sm text-want-strong">Hidden by an admin. Only an admin can restore it.</p>}
              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                <Button asChild size="sm" variant="outline"><Link to="/listings/$id/edit" params={{ id: l.id }}><Pencil className="h-3.5 w-3.5" />Edit</Link></Button>
                {l.status !== "hidden" && <>
                  <Button size="sm" variant="outline" disabled={mutation.isPending || l.status === "matched"} onClick={() => mutation.mutate({ id: l.id, action: "matched" })}><Check className="h-3.5 w-3.5" />Mark as matched</Button>
                  <Button size="sm" variant="outline" disabled={mutation.isPending || l.status === "archived"} onClick={() => mutation.mutate({ id: l.id, action: "archived" })}><Archive className="h-3.5 w-3.5" />Archive</Button>
                  <Button size="sm" variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate({ id: l.id, action: "renew" })}><RotateCcw className="h-3.5 w-3.5" />Renew</Button>
                </>}
                <Button size="sm" variant="ghost" className="text-destructive" disabled={mutation.isPending} onClick={() => setDeleting(l.id)}><Trash2 className="h-3.5 w-3.5" />Delete</Button>
              </div>
            </div>
          ))}
      </div>
      <ConfirmListingDelete open={!!deleting} onOpenChange={(open) => { if (!open) setDeleting(null); }} busy={mutation.isPending} onConfirm={() => { if (deleting) mutation.mutate({ id: deleting, action: "delete" }); }} />
    </div>
  );
}
