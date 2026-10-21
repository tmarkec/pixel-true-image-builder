CREATE TABLE public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  listing_type text NOT NULL CHECK (listing_type IN ('have','want')),
  brand text NOT NULL,
  discipline text NOT NULL CHECK (discipline IN ('Sweep','Scull')),
  side text NOT NULL CHECK (side IN ('Bow','Stroke','Unspecified / Either')),
  quantity int NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 16),
  blade_type text, shaft_type text, shaft_softness text, sleeve_type text, handle_type text, grip_type text, length text,
  condition text CHECK (condition IN ('New','Good','Worn','Damaged / for parts')),
  offer_type text CHECK (offer_type IN ('Free','Swap','Price negotiable','Fixed price')),
  county text NOT NULL,
  club_name text, pickup_event text, image_url text, notes text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','matched','archived','hidden')),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '60 days',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX listings_user_idx ON public.listings(user_id);
CREATE INDEX listings_active_idx ON public.listings(status, expires_at);
GRANT SELECT ON public.listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active listings" ON public.listings FOR SELECT TO anon, authenticated
  USING (status = 'active' AND expires_at > now());
CREATE POLICY "Owners can view own listings" ON public.listings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own listings" ON public.listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update own listings" ON public.listings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners delete own listings" ON public.listings FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER listings_updated_at BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.listing_contacts (
  listing_id uuid PRIMARY KEY REFERENCES public.listings(id) ON DELETE CASCADE,
  email text NOT NULL,
  phone text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_contacts TO authenticated;
GRANT ALL ON public.listing_contacts TO service_role;
ALTER TABLE public.listing_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Logged-in users view contacts" ON public.listing_contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owners update contacts" ON public.listing_contacts FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.user_id = auth.uid()));
CREATE POLICY "Owners delete contacts" ON public.listing_contacts FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.user_id = auth.uid()));

-- Contact row created automatically with the owner's account email
CREATE OR REPLACE FUNCTION public.create_listing_contact() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.listing_contacts(listing_id, email)
  SELECT NEW.id, u.email FROM auth.users u WHERE u.id = NEW.user_id
  ON CONFLICT (listing_id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER listings_create_contact AFTER INSERT ON public.listings FOR EACH ROW EXECUTE FUNCTION public.create_listing_contact();

-- Email can never be faked: always forced to the owner's account email
CREATE OR REPLACE FUNCTION public.lock_contact_email() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  SELECT u.email INTO NEW.email FROM public.listings l JOIN auth.users u ON u.id = l.user_id WHERE l.id = NEW.listing_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER listing_contacts_lock_email BEFORE INSERT OR UPDATE ON public.listing_contacts FOR EACH ROW EXECUTE FUNCTION public.lock_contact_email();

-- Keep contact email in step with account email changes
CREATE OR REPLACE FUNCTION public.sync_contact_emails() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.listing_contacts c SET email = NEW.email FROM public.listings l WHERE l.id = c.listing_id AND l.user_id = NEW.id;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_email_change AFTER UPDATE OF email ON auth.users FOR EACH ROW EXECUTE FUNCTION public.sync_contact_emails();

-- Remove a user's listings when the account is deleted
CREATE OR REPLACE FUNCTION public.delete_user_listings() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN DELETE FROM public.listings WHERE user_id = OLD.id; RETURN OLD; END; $$;
CREATE TRIGGER on_auth_user_deleted AFTER DELETE ON auth.users FOR EACH ROW EXECUTE FUNCTION public.delete_user_listings();

REVOKE EXECUTE ON FUNCTION public.create_listing_contact(), public.lock_contact_email(), public.sync_contact_emails(), public.delete_user_listings() FROM PUBLIC, anon, authenticated;

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL,
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Logged-in users can report" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

-- Storage policies for oar-photos
CREATE POLICY "Public read oar photos" ON storage.objects FOR SELECT USING (bucket_id = 'oar-photos');
CREATE POLICY "Users upload own oar photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'oar-photos' AND (storage.foldername(name))[1] = auth.uid()::text
    AND lower(storage.extension(name)) IN ('png','jpg','jpeg'));
CREATE POLICY "Users update own oar photos" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'oar-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own oar photos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'oar-photos' AND (storage.foldername(name))[1] = auth.uid()::text);