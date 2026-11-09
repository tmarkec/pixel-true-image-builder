import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy policy | OarExchange Ireland" },
      { name: "description", content: "How OarExchange Ireland uses account information, listing details and contact details." },
      { property: "og:title", content: "Privacy policy | OarExchange Ireland" },
      { property: "og:description", content: "How OarExchange Ireland uses account information, listing details and contact details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <article className="mx-auto w-full max-w-2xl space-y-4 px-4 py-12">
      <h1 className="text-4xl font-bold">Privacy policy</h1>
      <p className="text-sm text-muted-foreground">Last updated 09/11/2026.</p>
      <p>
        This policy explains how OarExchange Ireland uses your information when you create an account,
        post a listing or contact another member.
      </p>
      <h2 className="pt-2 text-2xl font-bold">Information we keep</h2>
      <p>
        We keep your account email address and the information you add to your listings, including any
        photos or notes. If you choose to add a phone number, we keep it with your listing's contact
        details. We also keep reports submitted about listings.
      </p>
      <h2 className="pt-2 text-2xl font-bold">How we use your information</h2>
      <p>
        We use your email address to manage your account and confirm your email when you sign up.
        Your listing details help other rowers find suitable oars. Reports help the site administrator
        review listings that may need to be removed.
      </p>
      <h2 className="pt-2 text-2xl font-bold">Who can see your information</h2>
      <p>
        Active listings can be viewed without an account. Your account email address and any phone
        number added to a listing are only shown to logged-in members. Visitors who are not logged in
        cannot access those contact details.
      </p>
      <p>
        Listing photos are stored publicly. Do not include personal information in a photo or in any
        listing field that you do not want others to see. The site administrator can review reports
        and manage listings.
      </p>
      <h2 className="pt-2 text-2xl font-bold">How long we keep it</h2>
      <p>
        Listings expire after 60 days unless renewed. Expiry removes a listing from the public
        noticeboard; it does not delete it from your account. You can edit or delete your own listings
        from My listings. Deleting a listing also removes its associated contact details.
      </p>
      <h2 className="pt-2 text-2xl font-bold">Your account and privacy requests</h2>
      <p>
        To ask for a copy of your personal information, correct account information or request account
        deletion, contact the site administrator. Closing your account also removes your listings.
      </p>
    </article>
  ),
});
