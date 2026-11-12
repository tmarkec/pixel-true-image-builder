<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- All dropdown option lists live in src/config/oarOptions.ts; never hardcode them in components (owner edits them there).
- Contact details live only in listing_contacts (logged-in read); never add contact columns to listings, which is publicly readable.
- listing_contacts.email is set by DB triggers from the owner's account email; client code must never write it.
- App tables store user_id as plain uuid (no FK to auth.users); account deletion cleanup is done by a trigger.
- Auth is email and password (signUp / signInWithPassword), no magic links; protected pages live under src/routes/_authenticated/.
- Listing management reads use authenticated server functions and Query-backed protected loaders so private and hidden owner rows remain accessible.
- Privileged handlers validate confirmed identity and the protected user_roles admin role before loading the privileged client; browser role checks only control navigation visibility.
- Database triggers enforce listing quotas with per-owner transaction locks and a private durable posting ledger, preventing concurrent posts and deletion from bypassing daily limits. Daily boundaries use Europe/Dublin.
- Contact submission requires authenticated middleware and a confirmed account email checked before privileged writes; use that account email for replies to prevent impersonation.
- The shared listing reminder reads owner listings through the existing authenticated server function, keyed by account identity, so private rows remain private.
- Empty listing photos use the same bundled sweep-oar line art in details and form previews to avoid inconsistent equipment drawings.
- Resolve reporter account emails only inside the authorised moderation handler; never expose them through public listing reads or persist them on listings.
- Contact SELECT policies allow members only active, unexpired listing contacts or their own; public photo retrieval needs no storage.objects SELECT policy.
- Photo URLs and text bounds are database constraints; the photo bucket enforces 5 MiB and PNG/JPEG MIME types, and reports are unique per member and listing.
