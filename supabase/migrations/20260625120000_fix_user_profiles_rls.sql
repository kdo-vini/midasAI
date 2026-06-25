-- Allow authenticated users to manage only their own profile.
-- The ownership checks are required even when the table grant exists.

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON TABLE public.user_profiles TO authenticated;

DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
CREATE POLICY "Users can read own profile"
ON public.user_profiles
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own profile" ON public.user_profiles;
CREATE POLICY "Users can create own profile"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);
