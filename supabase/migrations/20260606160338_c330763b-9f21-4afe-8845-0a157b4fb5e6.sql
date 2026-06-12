
-- Slice 1: Driver Partner Applications + Customer T&C + auto-promote skyluper admin

-- 1. Enums
CREATE TYPE public.vehicle_type AS ENUM ('water_tanker','mini_tanker','large_tanker','other');
CREATE TYPE public.application_status AS ENUM ('pending','approved','rejected','suspended');

-- 2. driver_applications
CREATE TABLE public.driver_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  mobile text NOT NULL,
  email text NOT NULL,
  address text NOT NULL,
  vehicle_number text NOT NULL,
  vehicle_type public.vehicle_type NOT NULL,
  aadhaar_number text NOT NULL,
  pan_number text NOT NULL,
  aadhaar_url text NOT NULL,
  pan_url text NOT NULL,
  dl_url text NOT NULL,
  rc_url text NOT NULL,
  terms_accepted_at timestamptz NOT NULL,
  status public.application_status NOT NULL DEFAULT 'pending',
  review_note text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.driver_applications TO authenticated;
GRANT ALL ON public.driver_applications TO service_role;
ALTER TABLE public.driver_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "applicant reads own"
  ON public.driver_applications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "applicant inserts own"
  ON public.driver_applications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin updates"
  ON public.driver_applications FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_driver_applications_updated
  BEFORE UPDATE ON public.driver_applications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3. customer_terms_acceptances
CREATE TABLE public.customer_terms_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version text NOT NULL DEFAULT 'v1',
  accepted_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.customer_terms_acceptances TO authenticated;
GRANT ALL ON public.customer_terms_acceptances TO service_role;
ALTER TABLE public.customer_terms_acceptances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own acceptance read"
  ON public.customer_terms_acceptances FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own acceptance insert"
  ON public.customer_terms_acceptances FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 4. Auto-promote skyluper@gmail.com to admin when they sign up
CREATE OR REPLACE FUNCTION public.auto_promote_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF lower(NEW.email) IN ('skyluper@gmail.com','skylooperr@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created_promote ON auth.users;
CREATE TRIGGER on_auth_user_created_promote
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_promote_admin();

-- 5. Storage bucket policies for driver-docs (bucket created via tool separately)
-- Users upload to their own folder {user_id}/...
CREATE POLICY "drivers upload own docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'driver-docs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "drivers read own docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'driver-docs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'admin')));
