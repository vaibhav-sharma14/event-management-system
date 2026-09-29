
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;

-- Storage policies for event-media bucket: organizers manage their folder; public can read
CREATE POLICY "event_media_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'event-media');
CREATE POLICY "event_media_owner_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'event-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "event_media_owner_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'event-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "event_media_owner_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'event-media' AND auth.uid()::text = (storage.foldername(name))[1]);
