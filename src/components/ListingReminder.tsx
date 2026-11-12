import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getOwnListings } from "@/lib/management.functions";
import { activeListingCounts } from "@/lib/listing-reminder";
import { Button } from "@/components/ui/button";

export function ListingReminder() {
  const { user } = useAuth();
  const { data } = useQuery({ queryKey: ["listing-reminder", user?.id], queryFn: () => getOwnListings(), enabled: !!user });
  if (!user || !data) return null;
  const { have, want } = activeListingCounts(data);
  if (!have && !want) return null;
  return (
    <aside aria-label="Listing reminder" className="border-b bg-have-soft">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 text-sm">
        <Bell className="h-4 w-4 shrink-0 text-have-strong" aria-hidden="true" />
        <p className="min-w-0 flex-1">You have {have} spare-oar {have === 1 ? "listing" : "listings"} and {want} wanted {want === 1 ? "listing" : "listings"} still active. Sold an oar or found what you needed? Mark it as matched or delete it.</p>
        <Button asChild variant="outline" size="sm"><Link to="/my-listings">Review my listings</Link></Button>
      </div>
    </aside>
  );
}