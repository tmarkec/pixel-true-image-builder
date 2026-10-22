import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EyeOff, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getModeration, moderateListing } from "@/lib/management.functions";
import { formatDate, sideLabel } from "@/lib/listings";
import { TypeBadge } from "@/components/TypeBadge";
import { ListingStatus } from "@/components/ListingStatus";
import { Button } from "@/components/ui/button";
import { ConfirmListingDelete } from "@/components/ConfirmListingDelete";
import { ManagementLoading, ManagementError, ManagementNotFound } from "@/components/ManagementStates";

const moderationQuery = queryOptions({ queryKey: ["moderation"], queryFn: () => getModeration() });

export const Route = createFileRoute("/_authenticated/moderation")({
  head: () => ({ meta: [
    { title: "Reported listings | OarExchange Ireland" },
    { name: "description", content: "Review reported oar listings." },
    { property: "og:title", content: "Reported listings | OarExchange Ireland" },
    { property: "og:description", content: "Review reported oar listings." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(moderationQuery),
  pendingComponent: ManagementLoading,
  errorComponent: ManagementError,
  notFoundComponent: ManagementNotFound,
  component: Moderation,
});

function Moderation() {
  const { data } = useSuspenseQuery(moderationQuery);
  const moderate = useServerFn(moderateListing);
  const qc = useQueryClient();
  const [deleting, setDeleting] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: (input: { id: string; action: "hide" | "restore" | "delete" }) => moderate({ data: input }),
    onSuccess: async (_result, input) => { setDeleting(null); toast.success(input.action === "hide" ? "Listing hidden." : input.action === "restore" ? "Listing restored." : "Listing deleted."); await qc.invalidateQueries(); },
    onError: (error) => toast.error(error.message),
  });
  const grouped = new Map<string, { listing: NonNullable<(typeof data)[number]["listings"]>; reports: typeof data }>();
  for (const report of data) {
    if (!report.listings) continue;
    const existing = grouped.get(report.listing_id);
    if (existing) existing.reports.push(report);
    else grouped.set(report.listing_id, { listing: report.listings, reports: [report] });
  }
  return <div className="mx-auto w-full max-w-6xl px-4 py-10">
    <div className="flex flex-wrap items-center justify-between gap-4"><h1 className="font-display text-4xl font-bold">Reported listings</h1><Button asChild variant="outline"><Link to="/my-listings">My listings</Link></Button></div>
    {!grouped.size ? <div className="mt-8 border-y py-10"><h2 className="font-display text-xl font-semibold">No reported listings.</h2></div> : <div className="mt-8 grid gap-4 md:grid-cols-2">{Array.from(grouped.values()).map(({ listing: l, reports }) => <article key={l.id} className="min-w-0 rounded-lg border bg-card p-5">
      <div className="flex items-start justify-between gap-3"><TypeBadge type={l.listing_type} /><ListingStatus status={l.status} expiresAt={l.expires_at} /></div>
      <h2 className="mt-4 font-display text-xl font-semibold">{l.quantity} x {l.brand} {l.discipline.toLowerCase()}</h2><p className="mt-1 text-sm text-muted-foreground">{sideLabel(l.side)} · {l.county}</p>
      {l.image_url && <img src={l.image_url} alt={`${l.brand} oar`} className="mt-4 aspect-video w-full rounded-md object-contain" />}
      {l.notes && <p className="mt-3 break-words text-sm">{l.notes}</p>}
      <div className="mt-5 divide-y border-y">{reports.map((r) => <div key={r.id} className="py-3"><p className="break-words text-sm font-medium">{r.reason}</p><p className="mt-1 text-xs text-muted-foreground">Reported {formatDate(r.created_at)}</p></div>)}</div>
      <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={mutation.isPending || l.status === "hidden"} onClick={() => mutation.mutate({ id: l.id, action: "hide" })}><EyeOff className="h-4 w-4" />Hide</Button><Button size="sm" variant="outline" disabled={mutation.isPending || l.status !== "hidden"} onClick={() => mutation.mutate({ id: l.id, action: "restore" })}><RotateCcw className="h-4 w-4" />Restore</Button><Button size="sm" variant="ghost" className="text-destructive" disabled={mutation.isPending} onClick={() => setDeleting(l.id)}><Trash2 className="h-4 w-4" />Delete</Button></div>
    </article>)}</div>}
    <ConfirmListingDelete open={!!deleting} onOpenChange={(open) => { if (!open) setDeleting(null); }} busy={mutation.isPending} onConfirm={() => { if (deleting) mutation.mutate({ id: deleting, action: "delete" }); }} />
  </div>;
}