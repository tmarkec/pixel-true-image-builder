ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS moderation_previous_status text;
CREATE TABLE public.listing_post_log (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, posted_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.listing_post_log TO service_role;
ALTER TABLE public.listing_post_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX listing_post_log_user_day ON public.listing_post_log(user_id, posted_at);
CREATE INDEX listings_owner_status_expiry ON public.listings(user_id, status, expires_at);
CREATE OR REPLACE FUNCTION public.enforce_listing_limits() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE active_count integer; daily_count integer; day_start timestamptz; privileged boolean;
BEGIN
  privileged := coalesce(auth.role(), '') = 'service_role' OR auth.uid() IS NULL;
  IF TG_OP = 'UPDATE' THEN
    IF NOT privileged AND (NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.created_at IS DISTINCT FROM OLD.created_at) THEN RAISE EXCEPTION 'The listing owner and listed date cannot be changed.'; END IF;
    IF NOT privileged AND (NEW.status = 'hidden' OR OLD.status = 'hidden') AND (NEW.status IS DISTINCT FROM OLD.status OR NEW.expires_at IS DISTINCT FROM OLD.expires_at OR NEW.moderation_previous_status IS DISTINCT FROM OLD.moderation_previous_status) THEN RAISE EXCEPTION 'Only an admin can hide or restore a hidden listing.'; END IF;
    IF NOT privileged AND NEW.moderation_previous_status IS DISTINCT FROM OLD.moderation_previous_status THEN RAISE EXCEPTION 'Only an admin can change moderation details.'; END IF;
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.user_id::text, 0));
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := now(); NEW.expires_at := now() + interval '60 days';
    IF NOT privileged THEN NEW.status := 'active'; NEW.moderation_previous_status := NULL; END IF;
    day_start := date_trunc('day', now() AT TIME ZONE 'Europe/Dublin') AT TIME ZONE 'Europe/Dublin';
    SELECT count(*) INTO daily_count FROM public.listing_post_log WHERE user_id = NEW.user_id AND posted_at >= day_start;
    IF daily_count >= 10 THEN RAISE EXCEPTION 'You can post no more than 10 new listings a day. Try again tomorrow.'; END IF;
  ELSIF NEW.expires_at IS DISTINCT FROM OLD.expires_at AND NOT privileged THEN
    NEW.expires_at := now() + interval '60 days';
  END IF;
  IF NEW.status = 'active' AND NEW.expires_at > now() THEN
    SELECT count(*) INTO active_count FROM public.listings WHERE user_id = NEW.user_id AND status = 'active' AND expires_at > now() AND id <> NEW.id;
    IF active_count >= 20 THEN RAISE EXCEPTION 'You can have no more than 20 active listings. Archive or mark one as matched first.'; END IF;
  END IF;
  IF TG_OP = 'INSERT' THEN INSERT INTO public.listing_post_log(user_id) VALUES (NEW.user_id); END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.enforce_listing_limits() FROM PUBLIC;
CREATE TRIGGER listings_enforce_limits BEFORE INSERT OR UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.enforce_listing_limits();