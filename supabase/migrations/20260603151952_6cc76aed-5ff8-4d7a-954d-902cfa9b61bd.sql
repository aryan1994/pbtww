DROP POLICY IF EXISTS "Anyone submits contact" ON public.contact_requests;
CREATE POLICY "Anyone submits contact" ON public.contact_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (length(trim(name)) > 0 AND length(trim(message)) > 0);