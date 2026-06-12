
REVOKE EXECUTE ON FUNCTION public.approve_wallet_recharge(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reject_wallet_recharge(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_wallet_recharge(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_wallet_recharge(uuid, text) TO authenticated;

-- Storage policies for wallet-screenshots
CREATE POLICY "user uploads own wallet screenshot"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='wallet-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "user reads own wallet screenshot"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='wallet-screenshots' AND ((storage.foldername(name))[1] = auth.uid()::text OR has_role(auth.uid(),'admin'::app_role)));
