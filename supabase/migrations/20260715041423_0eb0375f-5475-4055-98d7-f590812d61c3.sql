
ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending'
  CHECK (approval_status IN ('pending','approved'));

CREATE INDEX IF NOT EXISTS student_profiles_approval_status_idx
  ON public.student_profiles(approval_status);
