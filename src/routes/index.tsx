import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BRANDS, DISCIPLINES, SIDES, COUNTIES } from "@/config/oarOptions";
import { listingsQuery, relativeTime, sideLabel, type ListingFilters } from "@/lib/listings";
import { TypeBadge } from "@/components/TypeBadge";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): ListingFilters => ({
    type: str(s.type), brand: str(s.brand), discipline: str(s.discipline), side: str(s.side), county: str(s.county),
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(listingsQuery(deps)),
  head: () => ({
    meta: [
      { title: "OarExchange Ireland | Spare and missing oars" },
      { name: "description", content: "A free noticeboard for Irish rowers and clubs to swap, give away or find odd oars." },
      { property: "og:title", content: "OarExchange Ireland" },
      { property: "og:description", content: "Spare oar? Missing oar? Find the other half." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
  errorComponent: ({ error }) => <div role="alert" className="p-8">{error instanceof Error ? error.message : String(error)}</div>,
  notFoundComponent: () => <div className="p-8">Not found.</div>,
});

type Row = Awaited<ReturnType<NonNullable<ReturnType<typeof listingsQuery>["queryFn"]>>>[number];

function Index() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const { data } = useSuspenseQuery(listingsQuery(search));
  const { user, loading } = useAuth();
  const set = (k: keyof ListingFilters, v: string | undefined) =>
    navigate({ search: (p) => ({ ...p, [k]: v || undefined }), replace: true, resetScroll: false });
  const anyFilter = Object.values(search).some(Boolean);

  return (
    <>
      <section className="border-b bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <h1 className="max-w-3xl text-4xl font-bold uppercase leading-none sm:text-6xl">
            Spare oar? Missing oar? Find the other half.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            A free noticeboard for Irish rowers and clubs to swap, give away or find odd oars.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div role="group" aria-label="Listing type" className="inline-flex rounded-full border bg-background p-1">
          {[
            { v: "have", label: "Spares available", dot: "bg-have" },
            { v: "want", label: "Oars wanted", dot: "bg-want" },
          ].map((o) => {
            const on = search.type === o.v;
            return (
              <button
                key={o.v}
                type="button"
                aria-pressed={on}
                onClick={() => set("type", on ? undefined : o.v)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                  on ? "bg-navy text-navy-foreground" : "text-foreground hover:bg-muted",
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", o.dot)} aria-hidden />
                {o.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <FilterSelect label="Brand" value={search.brand ?? ""} options={BRANDS} onChange={(v) => set("brand", v)} />
          <FilterSelect label="Discipline" value={search.discipline ?? ""} options={DISCIPLINES} onChange={(v) => set("discipline", v)} />
          <FilterSelect label="Side" value={search.side ?? ""} options={SIDES} onChange={(v) => set("side", v)} format={sideLabel} />
          <FilterSelect label="County" value={search.county ?? ""} options={COUNTIES} onChange={(v) => set("county", v)} />
          <Button
            variant="ghost"
            size="sm"
            disabled={!anyFilter}
            onClick={() => navigate({ search: {}, replace: true, resetScroll: false })}
          >
            Clear filters
          </Button>
        </div>

        <div className="mt-6">
          {data.length === 0 ? (
            <p className="rounded-md border bg-surface p-8 text-center text-muted-foreground">
              Nothing matching that yet. Try fewer filters, or list your own.
            </p>
          ) : (
            <>
              <DesktopTable rows={data} />
              <div className="space-y-2 md:hidden">
                {data.map((r) => <MobileCard key={r.id} r={r} />)}
              </div>
            </>
          )}
        </div>

        {!loading && !user && (
          <div className="mt-6 rounded-md border bg-accent p-4 text-sm">
            <Link to="/login" className="font-semibold text-primary underline">Log in</Link> or{" "}
            <Link to="/signup" className="font-semibold text-primary underline">sign up</Link> (it's free) to see
            contact details or list an oar.
          </div>
        )}
      </section>
    </>
  );
}

function FilterSelect({
  label, value, options, onChange, format = (s) => s,
}: { label: string; value: string; options: readonly string[]; onChange: (v: string) => void; format?: (s: string) => string }) {
  return (
    <Select value={value || "all"} onValueChange={(v) => onChange(v === "all" ? "" : v)}>
      <SelectTrigger aria-label={label} className="h-9 w-full sm:w-40">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{label}: any</SelectItem>
        {options.map((o) => <SelectItem key={o} value={o}>{format(o)}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

const dash = (v: string | null) => v || "-";
const handleGrip = (r: Row) => [r.handle_type, r.grip_type].filter(Boolean).join(" / ") || "-";

function DesktopTable({ rows }: { rows: Row[] }) {
  const heads = ["Type", "Qty", "Brand", "Discipline", "Side", "Blade", "Shaft", "Softness", "Handle / grip", "Length", "County", "Updated", ""];
  return (
    <div className="hidden max-h-[70vh] overflow-auto rounded-md border md:block">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-navy text-navy-foreground">
          <tr>{heads.map((h, i) => <th key={i} className="whitespace-nowrap px-2 py-2 text-left text-xs font-semibold uppercase">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t even:bg-surface">
              <td className="px-2 py-1.5"><TypeBadge type={r.listing_type} /></td>
              <td className="px-2 py-1.5 tabular-nums">{r.quantity}</td>
              <td className="px-2 py-1.5">{r.brand}</td>
              <td className="px-2 py-1.5">{r.discipline}</td>
              <td className="px-2 py-1.5">{sideLabel(r.side)}</td>
              <td className="px-2 py-1.5">{dash(r.blade_type)}</td>
              <td className="px-2 py-1.5">{dash(r.shaft_type)}</td>
              <td className="px-2 py-1.5">{dash(r.shaft_softness)}</td>
              <td className="px-2 py-1.5">{handleGrip(r)}</td>
              <td className="whitespace-nowrap px-2 py-1.5">{dash(r.length)}</td>
              <td className="px-2 py-1.5">{r.county}</td>
              <td className="whitespace-nowrap px-2 py-1.5 text-muted-foreground">{relativeTime(r.updated_at)}</td>
              <td className="px-2 py-1.5">
                <Button asChild size="sm" variant="outline" className="h-7">
                  <Link to="/listings/$id" params={{ id: r.id }}>View details</Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MobileCard({ r }: { r: Row }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center gap-2 p-3 text-left">
        <TypeBadge type={r.listing_type} />
        <span className="flex-1 text-sm font-semibold">
          {r.quantity} x {r.brand} {r.discipline.toLowerCase()}, {sideLabel(r.side).toLowerCase()}
          <span className="block text-xs font-normal text-muted-foreground">{r.county} · {relativeTime(r.updated_at)}</span>
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 border-t px-3 py-2 text-sm">
          {[["Blade", r.blade_type], ["Shaft", r.shaft_type], ["Softness", r.shaft_softness], ["Handle / grip", handleGrip(r)], ["Length", r.length]].map(([k, v]) => (
            <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd>{dash(v)}</dd></div>
          ))}
        </dl>
      )}
      <div className="border-t p-2">
        <Button asChild size="sm" variant="outline" className="w-full">
          <Link to="/listings/$id" params={{ id: r.id }}>View details</Link>
        </Button>
      </div>
    </div>
  );
}
