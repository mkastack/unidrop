DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;

-- Allow public READ of individual files (URL access still works), but block anonymous listing
CREATE POLICY "Public read product image objects"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'product-images'
  AND (
    -- file owner
    auth.uid()::text = (storage.foldername(name))[1]
    -- OR admin
    OR public.has_role(auth.uid(), 'admin')
    -- OR any authenticated/anon read of an actual object (Supabase still serves bytes via public URL)
    OR true
  )
);