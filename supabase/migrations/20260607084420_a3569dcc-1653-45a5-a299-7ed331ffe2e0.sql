
-- Wallet recharge requests
DO $$ BEGIN
  CREATE TYPE public.recharge_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.wallet_recharge_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  upi_ref text,
  screenshot_url text NOT NULL,
  status public.recharge_status NOT NULL DEFAULT 'pending',
  note text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.wallet_recharge_requests TO authenticated;
GRANT ALL ON public.wallet_recharge_requests TO service_role;

ALTER TABLE public.wallet_recharge_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user inserts own recharge"
  ON public.wallet_recharge_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user reads own recharge"
  ON public.wallet_recharge_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin updates recharge"
  ON public.wallet_recharge_requests FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_wrr_updated
BEFORE UPDATE ON public.wallet_recharge_requests
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Approval RPC: credits wallet + writes a wallet_transactions row atomically (admin only)
CREATE OR REPLACE FUNCTION public.approve_wallet_recharge(_request_id uuid, _note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r public.wallet_recharge_requests;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admins only';
  END IF;

  SELECT * INTO r FROM public.wallet_recharge_requests WHERE id = _request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Recharge request not found'; END IF;
  IF r.status <> 'pending' THEN RAISE EXCEPTION 'Already %', r.status; END IF;

  UPDATE public.wallet_recharge_requests
     SET status='approved', reviewed_by=auth.uid(), reviewed_at=now(), note=_note
   WHERE id=_request_id;

  INSERT INTO public.wallets (user_id, balance) VALUES (r.user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.wallets
     SET balance = balance + r.amount, updated_at = now()
   WHERE user_id = r.user_id;

  INSERT INTO public.wallet_transactions (user_id, amount, type, note)
  VALUES (r.user_id, r.amount, 'credit', COALESCE('Recharge approved' || CASE WHEN r.upi_ref IS NOT NULL THEN ' · ref ' || r.upi_ref ELSE '' END, 'Recharge approved'));
END $$;

CREATE OR REPLACE FUNCTION public.reject_wallet_recharge(_request_id uuid, _note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admins only';
  END IF;
  UPDATE public.wallet_recharge_requests
     SET status='rejected', reviewed_by=auth.uid(), reviewed_at=now(), note=_note
   WHERE id=_request_id AND status='pending';
END $$;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_recharge_requests;
