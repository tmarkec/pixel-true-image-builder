import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About | OarExchange Ireland" },
      { name: "description", content: "A free noticeboard for Irish rowing clubs, schools and rowers to swap spare oars." },
      { property: "og:title", content: "About OarExchange Ireland" },
      { property: "og:description", content: "A free noticeboard for spare and missing oars in Ireland." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <article className="mx-auto w-full max-w-2xl space-y-4 px-4 py-12">
      <h1 className="text-4xl font-bold">About</h1>
      <p>
        OarExchange Ireland is a free noticeboard for rowing clubs, schools and rowers across all 32
        counties. Most boathouses have an odd oar or two sitting in the rafters, and most also have a
        set with one missing.
      </p>
      <p>
        List the oars you have spare, or post the ones you're looking for. Other members can get in
        touch and arrange a handover, often at a regatta or Irish Rowing event you're both attending.
      </p>
      <p>
        There are no fees and we don't handle payments. Any deal is between you and the other club or
        rower.
      </p>
    </article>
  ),
});
