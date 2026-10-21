import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { TypeBadge } from "@/components/TypeBadge";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, sideLabel } from "@/lib/listings";

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
  component: MyListings,
});

function MyListings() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-listings"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase.from("listings")
        .select("id, listing_type, brand, discipline, side, quantity, county, status, expires_at, created_at")
        .eq("user_id", u.user?.id ?? "").order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-4xl font-bold">My listings</h1>
        <Button asChild><Link to="/listings/new">List an oar</Link></Button>
      </div>
      <div className="mt-8 space-y-3">
        {isLoading ? <p className="text-muted-foreground">Loading</p>
          : !data?.length ? <p className="text-muted-foreground">You haven't listed anything yet.</p>
          : data.map((l) => (
            <div key={l.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-soft">
              <TypeBadge type={l.listing_type} />
              <div className="flex-1">
                <div className="font-semibold">{l.quantity} x {l.brand} {l.discipline.toLowerCase()}, {sideLabel(l.side)}</div>
                <div className="text-sm text-muted-foreground">{l.county} · listed {formatDate(l.created_at)} · {new Date(l.expires_at) < new Date() ? "expired" : l.status}</div>
              </div>
              <Button asChild size="sm" variant="outline"><Link to="/listings/$id/edit" params={{ id: l.id }}>Edit</Link></Button>
            </div>
          ))}
      </div>
    </div>
  );
}
