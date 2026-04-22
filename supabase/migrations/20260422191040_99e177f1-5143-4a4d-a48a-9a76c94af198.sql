-- Product images bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Users upload own product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users update own product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users delete own product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Auto-assign a random online delivery agent
CREATE OR REPLACE FUNCTION public.assign_random_delivery_agent(_order_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  agent uuid;
BEGIN
  SELECT user_id INTO agent
  FROM public.user_roles
  WHERE role = 'delivery'
  ORDER BY random()
  LIMIT 1;

  IF agent IS NOT NULL THEN
    UPDATE public.orders SET delivery_agent_id = agent WHERE id = _order_id;
    INSERT INTO public.notifications (user_id, message)
    VALUES (agent, 'New delivery assigned to you on Tradie 🚴');
  END IF;
  RETURN agent;
END; $$;

-- Broadcast announcement (admin only)
CREATE OR REPLACE FUNCTION public.broadcast_announcement(_message text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can broadcast';
  END IF;

  INSERT INTO public.notifications (user_id, message)
  SELECT id, '📢 ' || _message FROM public.profiles;
  GET DIAGNOSTICS inserted = ROW_COUNT;
  RETURN inserted;
END; $$;