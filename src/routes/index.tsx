import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OarExchange Ireland | Spare and missing oars" },
      { name: "description", content: "A free noticeboard where Irish rowing clubs, schools and rowers list spare oars or look for missing ones." },
      { property: "og:title", content: "OarExchange Ireland" },
      { property: "og:description", content: "List spare oars or find the ones you need to complete a pair or set." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="flex gap-2">
          <span className="rounded-sm bg-have px-2 py-0.5 text-xs font-bold uppercase text-have-foreground">Have</span>
          <span className="rounded-sm bg-want px-2 py-0.5 text-xs font-bold uppercase text-want-foreground">Want</span>
        </div>
        <h1 className="mt-4 max-w-3xl text-5xl font-bold uppercase leading-none sm:text-7xl">
          Find the oar that completes your set
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          A free noticeboard for Irish clubs, schools and rowers. List the oars you have spare, or post
          the ones you're missing.
        </p>
        <div className="mt-8 flex gap-3">
          <Button asChild size="lg"><Link to="/signup">Sign up</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/about">How it works</Link></Button>
        </div>
      </div>
    </section>
  );
}
