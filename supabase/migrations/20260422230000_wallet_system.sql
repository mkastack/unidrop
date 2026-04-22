-- Add momo details to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS momo_number text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS momo_network text;

-- Create withdrawal_requests table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  momo_number text NOT NULL,
  momo_network text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- RLS for withdrawal requests
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Sellers can view their own requests
CREATE POLICY "Sellers can view own withdrawal requests" 
ON withdrawal_requests FOR SELECT 
USING (auth.uid() = seller_id);

-- Sellers can create their own requests
CREATE POLICY "Sellers can create withdrawal requests" 
ON withdrawal_requests FOR INSERT 
WITH CHECK (auth.uid() = seller_id);

-- Only admins can update the status of requests
-- (Assuming we will have an admin role or handle this manually in Supabase Dashboard)
-- For now we allow sellers to see but not update.

-- Add realtime for withdrawal requests
alter publication supabase_realtime add table withdrawal_requests;
