-- Make student_id optional in student_profiles so registration can proceed without it.
ALTER TABLE public.student_profiles
  ALTER COLUMN student_id DROP NOT NULL;

-- Make student_id optional in pre_registered_students.
ALTER TABLE public.pre_registered_students
  ALTER COLUMN student_id DROP NOT NULL;

-- Remove the constraint that forced the email to match the student_id pattern.
ALTER TABLE public.pre_registered_students
  DROP CONSTRAINT IF EXISTS pre_registered_students_email_matches;

-- Drop the format constraint since student_id is no longer collected at registration.
ALTER TABLE public.pre_registered_students
  DROP CONSTRAINT IF EXISTS pre_registered_students_student_id_format;

-- Also drop the program-only-NCC constraint since program options now include HNC/HND.
ALTER TABLE public.pre_registered_students
  DROP CONSTRAINT IF EXISTS pre_registered_students_program_ncc;