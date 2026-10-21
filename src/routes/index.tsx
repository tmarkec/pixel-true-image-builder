import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BRANDS, DISCIPLINES, SIDES, COUNTIES } from "@/config/oarOptions";
import { listingsQuery, sideLabel, type ListingFilters } from "@/lib/listings";
import { TypeBadge } from "@/components/TypeBadge";
import { useAuth } from "@/hooks/useAuth";
import { ListingDetailsDialog } from "@/components/ListingDetailsDialog";
import { cn } from "@/lib/utils";

const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): ListingFilters => ({
    type: str(s['type']), brand: str(s['brand']), discipline: str(s['discipline']), side: str(s['side']), county: str(s['county']),
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
  const [viewing, setViewing] = useState<Row | null>(null);
  const set = (k: keyof ListingFilters, v: string | undefined) =>
    navigate({ search: (p) => ({ ...p, [k]: v || undefined }), replace: true, resetScroll: false });
  const anyFilter = Object.values(search).some(Boolean);

  return (
    <>
      <section className="bg-hero">
        <div className="mx-auto max-w-5xl px-4 pb-10 pt-14 sm:pt-20">
          <h1 className="max-w-3xl text-4xl font-bold leading-[0.95] sm:text-6xl">
            Spare oar? Missing oar? Find the other half.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            A free noticeboard for Irish rowers and clubs to swap, give away or find odd oars.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="-mt-4 rounded-2xl border bg-card p-4 shadow-soft sm:p-5">
          <div role="group" aria-label="Listing type" className="inline-flex rounded-full bg-muted p-1">
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
                    "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                    on ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
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
            {anyFilter && (
              <Button variant="ghost" size="sm" onClick={() => navigate({ search: {}, replace: true, resetScroll: false })}>
                Clear filters
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6">
          {data.length === 0 ? (
            <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
              Nothing matching that yet. Try fewer filters, or list your own.
            </p>
          ) : (
            <>
              <DesktopTable rows={data} onView={setViewing} />
              <div className="space-y-2 md:hidden">
                {data.map((r) => <MobileCard key={r.id} r={r} onView={setViewing} />)}
              </div>
            </>
          )}
        </div>

        {!loading && !user && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link> or{" "}
            <Link to="/signup" className="font-medium text-primary hover:underline">sign up</Link> (it's free) to see
            contact details or list an oar.
          </p>
        )}
      </section>
      <ListingDetailsDialog listing={viewing} onClose={() => setViewing(null)} />
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

function DesktopTable({ rows, onView }: { rows: Row[]; onView: (r: Row) => void }) {
  const heads = ["Type", "Qty", "Brand", "Discipline", "Side", "County", ""];
  return (
    <div className="hidden max-h-[70vh] overflow-auto rounded-2xl border bg-card md:block">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur">
          <tr className="border-b">
            {heads.map((h, i) => (
              <th key={i} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/50" onClick={() => onView(r)}>
              <td className="px-4 py-3"><TypeBadge type={r.listing_type} /></td>
              <td className="px-4 py-3 font-semibold tabular-nums">{r.quantity}</td>
              <td className="px-4 py-3 font-medium">{r.brand}</td>
              <td className="px-4 py-3">{r.discipline}</td>
              <td className="px-4 py-3">{sideLabel(r.side)}</td>
              <td className="px-4 py-3">{r.county}</td>
              <td className="px-4 py-3 text-right">
                <Button size="sm" variant="ghost" className="text-primary" onClick={(e) => { e.stopPropagation(); onView(r); }}>
                  View details
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MobileCard({ r, onView }: { r: Row; onView: (r: Row) => void }) {
  return (
    <button type="button" onClick={() => onView(r)} className="flex w-full items-center gap-3 rounded-2xl border bg-card p-4 text-left">
      <TypeBadge type={r.listing_type} />
      <span className="flex-1">
        <span className="block text-sm font-semibold">
          {r.quantity} x {r.brand} {r.discipline.toLowerCase()}, {sideLabel(r.side).toLowerCase()}
        </span>
        <span className="block text-xs text-muted-foreground">{r.county}</span>
      </span>
      <span className="text-sm font-medium text-primary">View details</span>
    </button>
  );
}
