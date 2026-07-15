CREATE TABLE public.student_subject_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, subject_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_subject_enrollments TO authenticated;
GRANT ALL ON public.student_subject_enrollments TO service_role;

ALTER TABLE public.student_subject_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view their own enrollments"
  ON public.student_subject_enrollments FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Students create their own enrollments"
  ON public.student_subject_enrollments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students delete their own enrollments"
  ON public.student_subject_enrollments FOR DELETE
  TO authenticated
  USING (auth.uid() = student_id);

CREATE INDEX idx_sse_student ON public.student_subject_enrollments(student_id);