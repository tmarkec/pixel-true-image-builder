import { useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TypeBadge } from "@/components/TypeBadge";
import { OarGraphic } from "@/components/OarGraphic";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { REPORT_REASONS } from "@/config/oarOptions";
import { formatDate, sideLabel, type PublicListing } from "@/lib/listings";
import { cn } from "@/lib/utils";
import { useServerFn } from "@tanstack/react-start";
import { moderateListing } from "@/lib/management.functions";
import { isAdminEmail } from "@/lib/listing-management";
import { ADMIN_EMAILS } from "@/config/oarOptions";

export function ListingDetailsDialog({ listing, onClose }: { listing: PublicListing | null; onClose: () => void }) {
  return (
    <Dialog open={!!listing} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[92vh] flex-col overflow-y-auto rounded-2xl bg-card p-0 sm:max-w-lg [&>button:last-child]:text-navy-foreground [&>button:last-child]:opacity-90">
        {listing && <ListingCard listing={listing} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

export function ListingCard({ listing: l, onClose }: { listing: PublicListing; onClose?: (() => void) | undefined }) {
  const { user, loading } = useAuth();
  const title = `${l.brand} ${l.discipline.toLowerCase()} oar${l.quantity > 1 ? "s" : ""}`;

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Loading</div>;

  return (
    <div>
      <div className="bg-navy px-5 pb-4 pt-5 text-navy-foreground">
        <div className="flex items-center gap-2">
          <TypeBadge type={l.listing_type} />
          <span className="text-xs uppercase tracking-wider opacity-70">Listed {formatDate(l.created_at)}</span>
        </div>
        <div className="mt-2 flex items-end justify-between gap-4">
          <DialogTitle className="font-display text-3xl font-bold uppercase leading-none">{title}</DialogTitle>
          <div className="text-right">
            <div className="font-display text-5xl font-bold leading-none">{l.quantity}</div>
            <div className="text-[10px] uppercase tracking-wider opacity-70">Qty</div>
          </div>
        </div>
        <DialogDescription className="mt-1 text-sm text-navy-foreground/80">
          {l.discipline} · {sideLabel(l.side)} · {l.county}
        </DialogDescription>
      </div>

      <DetailsView l={l} userId={user?.id ?? null} onClose={onClose} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="rounded-lg bg-muted px-3 py-2">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value || "-"}</div>
    </div>
  );
}

function LockedContact() {
  return (
    <div className="rounded-xl border border-dashed p-5 text-center">
      <Lock className="mx-auto h-5 w-5 text-muted-foreground" aria-hidden />
      <p className="mt-2 text-sm">Contact details are only shown to logged-in members. Log in or sign up to see them.</p>
      <div className="mt-4 flex justify-center gap-2">
        <Button asChild size="sm"><Link to="/login">Log in</Link></Button>
        <Button asChild size="sm" variant="outline"><Link to="/signup">Sign up</Link></Button>
      </div>
    </div>
  );
}

function OarPlaceholder({ brand }: { brand: string }) {
  const theme =
    brand === "Concept2" ? "bg-primary text-primary-foreground" : brand === "Croker" ? "bg-have text-have-foreground" : "bg-navy text-navy-foreground";
  return (
    <div className={cn("relative flex aspect-[16/7] items-start justify-start overflow-hidden", theme)}>
      <OarGraphic className="absolute inset-0 h-full w-full opacity-30" />
      <span className="relative m-5 font-display text-xl font-bold uppercase tracking-widest">{brand === "Other" ? "Oar" : brand}</span>
    </div>
  );
}

function AdminDelete({ id, onClose }: { id: string; onClose?: (() => void) | undefined }) {
  const qc = useQueryClient();
  const router = useRouter();
  const moderate = useServerFn(moderateListing);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const del = async () => {
    setBusy(true);
    try {
      await moderate({ data: { id, action: "delete" } });
      toast.success("Listing deleted.");
      await qc.invalidateQueries();
      onClose ? onClose() : router.navigate({ to: "/" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete the listing. Try again.");
    } finally { setBusy(false); }
  };
  return (
    <div className="rounded-xl border border-destructive/40 p-4">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Admin</div>
      <div className="mt-3 flex gap-2">
        {confirm ? (
          <>
            <Button size="sm" variant="destructive" disabled={busy} onClick={del}>{busy ? "Deleting..." : "Yes, delete"}</Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirm(false)}>Cancel</Button>
          </>
        ) : (
          <Button size="sm" variant="destructive" onClick={() => setConfirm(true)}>Delete listing</Button>
        )}
      </div>
    </div>
  );
}

function DetailsView({ l, userId, onClose }: { l: PublicListing; userId: string | null; onClose?: (() => void) | undefined }) {
  const { user } = useAuth();
  const { data: isOwner } = useQuery({
    queryKey: ["listing-owner", l.id, userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return false;
      const { data } = await supabase.from("listings").select("id").eq("id", l.id).eq("user_id", userId).maybeSingle();
      return !!data;
    },
  });
  const croker = l.brand === "Croker";
  const handleLength = [l.handle_type, l.length].filter(Boolean).join(" · ");
  const sleeveGrip = [l.sleeve_type, l.grip_type].filter(Boolean).join(" · ");
  const shaft = [l.shaft_type, l.shaft_softness].filter(Boolean).join(" · ");

  return (
    <>
      {l.image_url ? (
        <img src={l.image_url} alt={`Photo of ${l.brand} oar`} className="aspect-[16/9] w-full object-cover" />
      ) : (
        <OarPlaceholder brand={l.brand} />
      )}
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Discipline and side" value={`${l.discipline} · ${sideLabel(l.side)}`} />
          <Stat label="Blade" value={l.blade_type} />
          <Stat label="Shaft" value={shaft} />
          {croker && <Stat label="Sleeve / grip" value={sleeveGrip} />}
          <Stat label="Handle and length" value={handleLength} />
          <Stat label="Condition" value={l.condition} />
          <Stat label="On offer" value={l.offer_type} />
        </div>

        <div className="rounded-md border p-3 text-sm">
          <div className="flex items-center gap-1.5 font-semibold"><MapPin className="h-4 w-4" aria-hidden />{l.county}</div>
          {l.club_name && <div className="mt-1">{l.club_name}</div>}
          {l.pickup_event && <div className="mt-1 text-muted-foreground">Pickup: {l.pickup_event}</div>}
        </div>

        {!userId ? (
          <>
            {l.notes && <p className="text-sm text-muted-foreground">{l.notes}</p>}
            <LockedContact />
          </>
        ) : isOwner === undefined ? null : isOwner ? (
          <OwnerActions id={l.id} onClose={onClose} />
        ) : (
          <ContactBox l={l} />
        )}

        {userId && isOwner === false && isAdminEmail(user?.email, ADMIN_EMAILS) && <AdminDelete id={l.id} onClose={onClose} />}
        {userId && isOwner === false && <ReportLink listingId={l.id} userId={userId} />}
      </div>
    </>
  );
}

function ContactBox({ l }: { l: PublicListing }) {
  const { data, isLoading } = useQuery({
    queryKey: ["listing-contact", l.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("listing_contacts").select("email, phone").eq("listing_id", l.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  return (
    <div className="rounded-xl border p-4">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Contact</div>
      {isLoading ? (
        <p className="mt-2 text-sm text-muted-foreground">Loading</p>
      ) : !data ? (
        <p className="mt-2 text-sm text-muted-foreground">No contact details for this listing.</p>
      ) : (
        <div className="mt-2 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="break-all font-semibold">{data.email}</span>
            <Button asChild size="sm"><a href={`mailto:${data.email}`}><Mail className="h-4 w-4" aria-hidden />Email</a></Button>
          </div>
          {data.phone && (
            <a href={`tel:${data.phone}`} className="flex items-center gap-1.5 text-primary underline">
              <Phone className="h-4 w-4" aria-hidden />{data.phone}
            </a>
          )}
        </div>
      )}
      {l.notes && <p className="mt-3 border-t pt-3 text-sm">{l.notes}</p>}
    </div>
  );
}

function OwnerActions({ id, onClose }: { id: string; onClose?: (() => void) | undefined }) {
  const qc = useQueryClient();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const del = async () => {
    setBusy(true);
    const { error } = await supabase.from("listings").delete().eq("id", id);
    setBusy(false);
    if (error) { toast.error("Could not delete the listing. Try again."); return; }
    toast.success("Listing deleted.");
    await qc.invalidateQueries({ queryKey: ["listings"] });
    onClose ? onClose() : router.navigate({ to: "/" });
  };
  return (
    <div className="rounded-xl border p-4">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">This is your listing</div>
      <div className="mt-3 flex gap-2">
        <Button asChild size="sm" variant="outline"><Link to="/listings/$id/edit" params={{ id }}>Edit</Link></Button>
        {confirm ? (
          <>
            <Button size="sm" variant="destructive" disabled={busy} onClick={del}>Yes, delete</Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button>
          </>
        ) : (
          <Button size="sm" variant="destructive" onClick={() => setConfirm(true)}>Delete</Button>
        )}
      </div>
    </div>
  );
}

function ReportLink({ listingId, userId }: { listingId: string; userId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  if (sent) return <p className="text-xs text-muted-foreground">Thanks. We'll take a look.</p>;
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-muted-foreground underline">
        Report this listing
      </button>
    );

  const submit = async () => {
    setBusy(true);
    const text = detail.trim() ? `${reason}: ${detail.trim().slice(0, 500)}` : reason;
    const { error } = await supabase.from("reports").insert({ listing_id: listingId, reporter_id: userId, reason: text });
    setBusy(false);
    if (error) { toast.error("Could not send the report. Try again."); return; }
    setSent(true);
  };

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="text-sm font-semibold">Why are you reporting this?</div>
      <div className="flex flex-wrap gap-1.5">
        {REPORT_REASONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setReason(r)}
            className={cn("rounded-full border px-2.5 py-1 text-xs", reason === r ? "bg-navy text-navy-foreground" : "hover:bg-muted")}
          >
            {r}
          </button>
        ))}
      </div>
      <Textarea value={detail} onChange={(e) => setDetail(e.target.value)} maxLength={500} placeholder="Anything else we should know (optional)" rows={2} />
      <div className="flex gap-2">
        <Button size="sm" disabled={busy} onClick={submit}>Send report</Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}
