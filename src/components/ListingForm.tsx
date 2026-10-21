import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, ImagePlus, X } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TypeBadge } from "@/components/TypeBadge";
import { OarIcon } from "@/components/OarIcon";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  BRANDS, BRAND_SPECS, CLUBS, CONDITIONS, COUNTIES, DISCIPLINES, OFFER_TYPES, QUANTITY_MAX, QUANTITY_MIN,
  QUANTITY_PRESETS, SIDES,
} from "@/config/oarOptions";
import { sideLabel } from "@/lib/listings";
import { cn } from "@/lib/utils";

export type ListingFormValues = {
  listing_type: "have" | "want" | "";
  quantity: number;
  county: string;
  club_name: string;
  phone: string;
  brand: string;
  discipline: string;
  side: string;
  condition: string;
  offer_type: string;
  blade_type: string;
  shaft_type: string;
  sleeve_type: string;
  handle_type: string;
  grip_type: string;
  shaft_softness: string;
  length: string;
  pickup_event: string;
  notes: string;
  image_url: string;
};

export const EMPTY_LISTING: ListingFormValues = {
  listing_type: "", quantity: 1, county: "", club_name: "", phone: "", brand: "", discipline: "", side: "",
  condition: "", offer_type: "", blade_type: "", shaft_type: "", sleeve_type: "", handle_type: "", grip_type: "",
  shaft_softness: "", length: "", pickup_event: "", notes: "", image_url: "",
};

const REQUIRED: [keyof ListingFormValues, string, string][] = [
  ["listing_type", "Choose whether you have or want an oar.", "where"],
  ["county", "Choose a county.", "where"],
  ["brand", "Choose a brand.", "oar"],
  ["discipline", "Choose sweep or scull.", "oar"],
  ["side", "Choose a side, or Either.", "oar"],
  ["condition", "Choose a condition.", "oar"],
  ["offer_type", "Choose what's on offer.", "oar"],
];

const MAX_BYTES = 5 * 1024 * 1024;

async function compressImage(file: File): Promise<Blob> {
  if (file.size < 800 * 1024) return file;
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("Could not process photo"))), "image/jpeg", 0.82));
}

export function ListingForm({ initial, listingId }: { initial?: ListingFormValues; listingId?: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [v, setV] = useState<ListingFormValues>(initial ?? EMPTY_LISTING);
  const [errors, setErrors] = useState<Partial<Record<keyof ListingFormValues, string>>>({});
  const [open, setOpen] = useState<string[]>(["where", "oar", "photo"]);
  const [customQty, setCustomQty] = useState(!QUANTITY_PRESETS.includes((initial?.quantity ?? 1) as 1));
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>(initial?.image_url ?? "");
  const [saving, setSaving] = useState(false);

  const specs = v.brand ? BRAND_SPECS[v.brand] : undefined;

  useEffect(() => () => { if (preview.startsWith("blob:")) URL.revokeObjectURL(preview); }, [preview]);

  function set<K extends keyof ListingFormValues>(k: K, val: ListingFormValues[K]) {
    setV((p) => ({ ...p, [k]: val }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function changeBrand(brand: string) {
    setV((p) => ({ ...p, brand, blade_type: "", shaft_type: "", sleeve_type: "", handle_type: "", grip_type: "", shaft_softness: "", length: "" }));
    setErrors((e) => ({ ...e, brand: undefined }));
  }

  function pickFile(f: File | undefined) {
    if (!f) return;
    if (!["image/png", "image/jpeg"].includes(f.type)) return setErrors((e) => ({ ...e, image_url: "Photo must be PNG or JPG." }));
    if (f.size > MAX_BYTES) return setErrors((e) => ({ ...e, image_url: "Photo must be 5MB or smaller." }));
    setErrors((e) => ({ ...e, image_url: undefined }));
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function clearPhoto() {
    setFile(null);
    setPreview("");
    set("image_url", "");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const errs: typeof errors = {};
    const sections = new Set<string>();
    for (const [k, msg, sec] of REQUIRED) if (!v[k]) { errs[k] = msg; sections.add(sec); }
    if (!Number.isInteger(v.quantity) || v.quantity < QUANTITY_MIN || v.quantity > QUANTITY_MAX) {
      errs.quantity = `Quantity must be between ${QUANTITY_MIN} and ${QUANTITY_MAX}.`;
      sections.add("where");
    }
    if (v.phone && !/^[+\d][\d\s()-]{6,19}$/.test(v.phone.trim())) { errs.phone = "That phone number doesn't look right."; sections.add("where"); }
    setErrors(errs);
    if (Object.keys(errs).length) {
      setOpen((o) => Array.from(new Set([...o, ...sections])));
      toast.error("Some details are missing. Check the highlighted fields.");
      return;
    }

    setSaving(true);
    try {
      let image_url = v.image_url;
      if (file) {
        const blob = await compressImage(file);
        const ext = blob.type === "image/png" ? "png" : "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("oar-photos").upload(path, blob, { contentType: blob.type || "image/jpeg" });
        if (error) throw new Error("The photo didn't upload. Try a smaller one.");
        image_url = supabase.storage.from("oar-photos").getPublicUrl(path).data.publicUrl;
      }
      const opt = (s: string) => s.trim() || null;
      const row = {
        listing_type: v.listing_type as "have" | "want",
        quantity: v.quantity,
        county: v.county,
        club_name: opt(v.club_name),
        brand: v.brand,
        discipline: v.discipline,
        side: v.side,
        condition: v.condition,
        offer_type: v.offer_type,
        blade_type: opt(v.blade_type),
        shaft_type: opt(v.shaft_type),
        sleeve_type: opt(v.sleeve_type),
        handle_type: opt(v.handle_type),
        grip_type: opt(v.grip_type),
        shaft_softness: opt(v.shaft_softness),
        length: opt(v.length),
        pickup_event: opt(v.pickup_event),
        notes: opt(v.notes),
        image_url: image_url || null,
      };
      let id = listingId;
      if (id) {
        const { error } = await supabase.from("listings").update(row).eq("id", id);
        if (error) throw new Error(error.message);
      } else {
        const { data, error } = await supabase.from("listings").insert({ ...row, user_id: user.id }).select("id").single();
        if (error) throw new Error(error.message);
        id = data.id;
      }
      // Email is added by the database. Only the phone is written here.
      const { error: pErr } = await supabase.from("listing_contacts").update({ phone: opt(v.phone) }).eq("listing_id", id!);
      if (pErr) throw new Error(pErr.message);

      await qc.invalidateQueries();
      toast.success(listingId ? "Your listing has been updated." : "Your listing is live.");
      navigate({ to: "/my-listings" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const previewCard = <PreviewCard v={v} photo={preview} />;

  return (
    <form onSubmit={submit} noValidate className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        <Accordion type="multiple" value={open} onValueChange={setOpen} className="space-y-4">
          <Section value="where" title="1. What and where">
            <Field label="Listing type" error={errors.listing_type}>
              <div className="grid grid-cols-2 gap-2">
                {([["have", "I have an oar"], ["want", "I want an oar"]] as const).map(([val, label]) => (
                  <button key={val} type="button" onClick={() => set("listing_type", val)}
                    className={cn("rounded-lg border px-3 py-3 text-sm font-semibold transition",
                      v.listing_type === val
                        ? val === "have" ? "border-have-strong bg-have-soft text-have-strong" : "border-want-strong bg-want-soft text-want-strong"
                        : "border-border bg-background hover:bg-muted")}>
                    {label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Quantity" error={errors.quantity}>
              <div className="flex flex-wrap items-center gap-2">
                {QUANTITY_PRESETS.map((q) => (
                  <Chip key={q} active={!customQty && v.quantity === q} onClick={() => { setCustomQty(false); set("quantity", q); }}>{q}</Chip>
                ))}
                <Chip active={customQty} onClick={() => setCustomQty(true)}>Custom</Chip>
                {customQty && (
                  <Input type="number" min={QUANTITY_MIN} max={QUANTITY_MAX} className="w-24" value={v.quantity}
                    onChange={(e) => set("quantity", Number(e.target.value))} aria-label="Custom quantity" />
                )}
              </div>
            </Field>
            <Field label="County" error={errors.county}>
              <Select value={v.county} onChange={(x) => set("county", x)} options={COUNTIES} placeholder="Choose a county" invalid={!!errors.county} />
            </Field>
            <Field label="Club or institution" hint="Optional. Pick from the list or type your own.">
              <Input list="club-list" value={v.club_name} onChange={(e) => set("club_name", e.target.value)} placeholder="Start typing a club name" maxLength={120} />
              <datalist id="club-list">{CLUBS.map((c) => <option key={c} value={c} />)}</datalist>
            </Field>
            <Field label="Phone number" hint="Optional. Only logged-in members can see it." error={errors.phone}>
              <Input type="tel" value={v.phone} onChange={(e) => set("phone", e.target.value)} placeholder="e.g. 087 123 4567" maxLength={20} />
            </Field>
          </Section>

          <Section value="oar" title="2. The oar">
            <Field label="Brand" error={errors.brand}>
              <div className="flex flex-wrap gap-2">
                {BRANDS.map((b) => <Chip key={b} active={v.brand === b} onClick={() => changeBrand(b)}>{b}</Chip>)}
              </div>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Discipline" error={errors.discipline}>
                <Select value={v.discipline} onChange={(x) => set("discipline", x)} options={DISCIPLINES} placeholder="Sweep or scull" invalid={!!errors.discipline} />
              </Field>
              <Field label="Side" hint="Only got one oar? Say which side it's for." error={errors.side}>
                <Select value={v.side} onChange={(x) => set("side", x)} options={SIDES} placeholder="Choose a side" invalid={!!errors.side} />
              </Field>
              <Field label="Condition" error={errors.condition}>
                <Select value={v.condition} onChange={(x) => set("condition", x)} options={CONDITIONS} placeholder="Choose a condition" invalid={!!errors.condition} />
              </Field>
              <Field label="Offer type" error={errors.offer_type}>
                <Select value={v.offer_type} onChange={(x) => set("offer_type", x)} options={OFFER_TYPES} placeholder="Free, swap or price" invalid={!!errors.offer_type} />
              </Field>
            </div>
            {specs ? (
              <div className="grid gap-4 rounded-xl border border-dashed border-border p-4 sm:grid-cols-2">
                <Field label="Blade type"><Select value={v.blade_type} onChange={(x) => set("blade_type", x)} options={specs.blade} placeholder="Optional" /></Field>
                {specs.shaft && <Field label="Shaft type"><Select value={v.shaft_type} onChange={(x) => set("shaft_type", x)} options={specs.shaft} placeholder="Optional" /></Field>}
                {specs.sleeve && <Field label="Sleeve type"><Select value={v.sleeve_type} onChange={(x) => set("sleeve_type", x)} options={specs.sleeve} placeholder="Optional" /></Field>}
                {specs.handle && <Field label="Handle type"><Select value={v.handle_type} onChange={(x) => set("handle_type", x)} options={specs.handle} placeholder="Optional" /></Field>}
                {specs.grip && <Field label="Grip / handle"><Select value={v.grip_type} onChange={(x) => set("grip_type", x)} options={specs.grip} placeholder="Optional" /></Field>}
                {specs.softness && <Field label="Shaft softness"><Select value={v.shaft_softness} onChange={(x) => set("shaft_softness", x)} options={specs.softness} placeholder="Optional" /></Field>}
                <Field label="Length">
                  {specs.length
                    ? <Select value={v.length} onChange={(x) => set("length", x)} options={specs.length} placeholder="Optional" />
                    : <Input value={v.length} onChange={(e) => set("length", e.target.value)} placeholder="e.g. 288cm" maxLength={40} />}
                </Field>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Choose a brand to see blade, shaft and handle options.</p>
            )}
          </Section>

          <Section value="photo" title="3. Photo and notes">
            <Field label="Photo" hint="Optional. PNG or JPG, up to 5MB." error={errors.image_url}>
              {preview ? (
                <div className="relative w-fit">
                  <img src={preview} alt="Oar photo preview" className="h-32 w-48 rounded-lg border border-border object-cover" />
                  <button type="button" onClick={clearPhoto} aria-label="Remove photo"
                    className="absolute -right-2 -top-2 rounded-full bg-foreground p-1 text-background shadow"><X className="h-3 w-3" /></button>
                </div>
              ) : (
                <label className="flex h-32 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-muted/40 text-sm text-muted-foreground hover:bg-muted">
                  <ImagePlus className="h-5 w-5" />
                  Add a photo
                  <input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={(e) => pickFile(e.target.files?.[0])} />
                </label>
              )}
            </Field>
            <Field label="Event hand-off" hint="Optional.">
              <Input value={v.pickup_event} onChange={(e) => set("pickup_event", e.target.value)} placeholder="e.g. I'll be at Irish Champs, Inniscarra" maxLength={200} />
            </Field>
            <Field label="Notes" hint="Optional.">
              <Textarea value={v.notes} onChange={(e) => set("notes", e.target.value)} rows={4} placeholder="Serial numbers, condition, wear, missing hardware" maxLength={1000} />
            </Field>
          </Section>
        </Accordion>

        <div className="lg:hidden">
          <Collapsible>
            <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold">
              Oar preview <ChevronDown className="h-4 w-4 transition group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">{previewCard}</CollapsibleContent>
          </Collapsible>
        </div>

        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={saving}>
          {saving ? "Saving" : listingId ? "Save changes" : "Publish listing"}
        </Button>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-6">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Oar preview</div>
          {previewCard}
        </div>
      </aside>
    </form>
  );
}

function Section({ value, title, children }: { value: string; title: string; children: React.ReactNode }) {
  return (
    <AccordionItem value={value} className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <AccordionTrigger className="px-5 font-display text-lg font-bold hover:no-underline">{title}</AccordionTrigger>
      <AccordionContent className="space-y-5 px-5 pb-5">{children}</AccordionContent>
    </AccordionItem>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string | undefined; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-sm font-semibold">{label}</div>
      {children}
      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={cn("rounded-full border px-4 py-1.5 text-sm font-semibold transition",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted")}>
      {children}
    </button>
  );
}

function Select({ value, onChange, options, placeholder, invalid }: {
  value: string; onChange: (v: string) => void; options: readonly string[]; placeholder: string; invalid?: boolean;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid}
      className={cn("h-10 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring",
        invalid ? "border-destructive" : "border-input", !value && "text-muted-foreground")}>
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o} className="text-foreground">{o}</option>)}
    </select>
  );
}

function PreviewCard({ v, photo }: { v: ListingFormValues; photo: string }) {
  const title = v.brand ? `${v.brand} ${v.discipline ? v.discipline.toLowerCase() + " " : ""}oar${v.quantity > 1 ? "s" : ""}` : "Your oar";
  const rows = useMemo(() => [
    ["Blade", v.blade_type], ["Shaft", v.shaft_type], ["Sleeve", v.sleeve_type], ["Handle", v.handle_type],
    ["Grip", v.grip_type], ["Softness", v.shaft_softness], ["Length", v.length], ["Condition", v.condition], ["Offer", v.offer_type],
  ].filter(([, x]) => x), [v]);
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="bg-navy px-5 pb-4 pt-5 text-navy-foreground">
        <div className="flex h-6 items-center">{v.listing_type && <TypeBadge type={v.listing_type} />}</div>
        <div className="mt-2 flex items-end justify-between gap-4">
          <div className="font-display text-2xl font-bold uppercase leading-none">{title}</div>
          <div className="text-right">
            <div className="font-display text-4xl font-bold leading-none">{v.quantity || "-"}</div>
            <div className="text-[10px] uppercase tracking-wider opacity-70">Qty</div>
          </div>
        </div>
        <div className="mt-1 text-sm text-navy-foreground/80">
          {[v.discipline, v.side && sideLabel(v.side), v.county].filter(Boolean).join(" · ") || "Discipline · side · county"}
        </div>
      </div>
      {photo ? (
        <img src={photo} alt="" className="aspect-[16/9] w-full object-cover" />
      ) : (
        <div className="flex aspect-[16/9] items-center justify-center bg-muted text-muted-foreground"><OarIcon className="h-16 w-16" /></div>
      )}
      <div className="grid grid-cols-2 gap-2 p-4">
        {rows.length ? rows.map(([k, x]) => (
          <div key={k} className="rounded-lg bg-muted px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{k}</div>
            <div className="text-sm font-semibold">{x}</div>
          </div>
        )) : <p className="col-span-2 text-sm text-muted-foreground">Specs appear here as you fill in the form.</p>}
        {(v.club_name || v.pickup_event) && (
          <div className="col-span-2 rounded-lg border border-border px-3 py-2 text-sm">
            {v.club_name && <div className="font-semibold">{v.club_name}</div>}
            {v.pickup_event && <div className="text-muted-foreground">{v.pickup_event}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
