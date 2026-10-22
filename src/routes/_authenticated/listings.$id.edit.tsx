import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ListingForm, EMPTY_LISTING, type ListingFormValues } from "@/components/ListingForm";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/BackLink";

export const Route = createFileRoute("/_authenticated/listings/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit listing | OarExchange Ireland" },
      { name: "description", content: "Change the details of your oar listing." },
      { property: "og:title", content: "Edit listing | OarExchange Ireland" },
      { property: "og:description", content: "Change the details of your oar listing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EditListing,
});

function EditListing() {
  const { id } = Route.useParams();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["edit-listing", id],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data: l, error } = await supabase.from("listings").select("*").eq("id", id).eq("user_id", u.user?.id ?? "").maybeSingle();
      if (error) throw new Error(error.message);
      if (!l) return null;
      const { data: c, error: contactError } = await supabase.from("listing_contacts").select("phone").eq("listing_id", id).maybeSingle();
      if (contactError) throw new Error("Your contact details could not be loaded. Try again.");
      const values: ListingFormValues = { ...EMPTY_LISTING };
      for (const k of Object.keys(EMPTY_LISTING) as (keyof ListingFormValues)[]) {
        const val = (l as Record<string, unknown>)[k];
        if (val !== null && val !== undefined) (values as Record<string, unknown>)[k] = val;
      }
      values.phone = c?.phone ?? "";
      return values;
    },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <BackLink to="/my-listings" label="Back to my listings" />
      <h1 className="mb-8 font-display text-4xl font-bold">Edit listing</h1>
      {isLoading ? <p role="status" className="text-muted-foreground">Loading</p>
        : error ? <div role="alert"><p>{error.message}</p><Button variant="outline" className="mt-4" onClick={() => refetch()}>Try again</Button></div>
        : data ? <ListingForm initial={data} listingId={id} />
        : <p className="text-muted-foreground">This listing isn't yours or no longer exists. <Link to="/my-listings" className="underline">Back to my listings</Link></p>}
    </div>
  );
}
