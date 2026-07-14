
-- Roles infrastructure (needed for admin-only policies)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'student');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own roles" ON public.user_roles
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- pre_registered_students table
CREATE TABLE public.pre_registered_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  program TEXT NOT NULL DEFAULT 'NCC',
  email TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT pre_registered_students_student_id_format
    CHECK (student_id ~ '^[0-9]{4}D[0-9]{4}$'),
  CONSTRAINT pre_registered_students_program_ncc
    CHECK (program = 'NCC'),
  CONSTRAINT pre_registered_students_email_matches
    CHECK (email = lower(student_id) || '@student.strategyfirst.edu.mm')
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pre_registered_students TO authenticated;
GRANT ALL ON public.pre_registered_students TO service_role;

ALTER TABLE public.pre_registered_students ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can view all pre-registered students"
  ON public.pre_registered_students FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert pre-registered students"
  ON public.pre_registered_students FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update pre-registered students"
  ON public.pre_registered_students FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete pre-registered students"
  ON public.pre_registered_students FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Students can read their own approved record (by matching auth email)
CREATE POLICY "Students can view own approved record"
  ON public.pre_registered_students FOR SELECT TO authenticated
  USING (
    status = 'approved'
    AND email = (SELECT lower(u.email) FROM auth.users u WHERE u.id = auth.uid())
  );
