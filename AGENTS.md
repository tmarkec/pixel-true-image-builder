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
