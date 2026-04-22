DROP POLICY IF EXISTS "Public read product image objects" ON storage.objects;
-- No SELECT policy on product-images: bucket is public, so getPublicUrl() still serves bytes,
-- but no one can list the bucket contents via the API.