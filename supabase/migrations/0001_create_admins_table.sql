-- Create admins table
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create unique index on auth_user_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_auth_user_id ON public.admins(auth_user_id);

-- Create index on email
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);

-- Enable row level security
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admins to read their own data
CREATE POLICY "Admins can view own profile"
ON public.admins
FOR SELECT
USING (auth.uid() = auth_user_id);

-- Create policy to allow service role full access
-- (we'll use this in our server actions)
