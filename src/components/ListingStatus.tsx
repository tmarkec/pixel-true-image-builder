import { listingState } from "@/lib/listing-management";
import { cn } from "@/lib/utils";

export function ListingStatus({ status, expiresAt }: { status: string; expiresAt: string }) {
  const state = listingState(status, expiresAt);
  return <div className="space-y-1.5"><span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", state.label === "Active" ? "bg-have-soft text-have-strong" : state.label === "Hidden" || state.label === "Expired" ? "bg-want-soft text-want-strong" : "bg-muted text-muted-foreground")}>{state.label}</span>{state.label === "Active" && <p className={cn("text-xs", state.urgent ? "font-semibold text-want-strong" : "text-muted-foreground")}>Expires in {state.days} {state.days === 1 ? "day" : "days"}</p>}</div>;
}