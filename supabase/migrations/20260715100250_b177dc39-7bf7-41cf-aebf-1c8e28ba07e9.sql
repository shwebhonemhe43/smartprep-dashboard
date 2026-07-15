
CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  topic_id uuid NOT NULL,
  subject_id uuid,
  correct_count integer NOT NULL,
  total_count integer NOT NULL,
  score_pct integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students select own attempts" ON public.quiz_attempts
  FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Students insert own attempts" ON public.quiz_attempts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students delete own attempts" ON public.quiz_attempts
  FOR DELETE TO authenticated USING (auth.uid() = student_id);

CREATE INDEX quiz_attempts_student_idx ON public.quiz_attempts(student_id, created_at DESC);
