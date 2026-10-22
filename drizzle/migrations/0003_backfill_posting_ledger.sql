ALTER TABLE public.listing_post_log ADD COLUMN listing_id uuid;
INSERT INTO public.listing_post_log(user_id, posted_at, listing_id) SELECT user_id, created_at, id FROM public.listings;
CREATE OR REPLACE FUNCTION public.record_listing_post_id() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN UPDATE public.listing_post_log SET listing_id=NEW.id WHERE id=(SELECT id FROM public.listing_post_log WHERE user_id=NEW.user_id AND listing_id IS NULL ORDER BY posted_at DESC LIMIT 1); RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.record_listing_post_id() FROM PUBLIC;
CREATE TRIGGER listings_record_post_id AFTER INSERT ON public.listings FOR EACH ROW EXECUTE FUNCTION public.record_listing_post_id();