
-- study_session_notes table
CREATE TABLE public.study_session_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  study_plan_item_id UUID NOT NULL REFERENCES public.study_plan_items(id) ON DELETE CASCADE,
  subject_id UUID,
  topic_id UUID,
  notes_content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, study_plan_item_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_session_notes TO authenticated;
GRANT ALL ON public.study_session_notes TO service_role;

ALTER TABLE public.study_session_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own session notes" ON public.study_session_notes
  FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Students insert own session notes" ON public.study_session_notes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students update own session notes" ON public.study_session_notes
  FOR UPDATE TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students delete own session notes" ON public.study_session_notes
  FOR DELETE TO authenticated USING (auth.uid() = student_id);

CREATE TRIGGER update_study_session_notes_updated_at
  BEFORE UPDATE ON public.study_session_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- study_session_tests table
CREATE TABLE public.study_session_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  study_plan_item_id UUID NOT NULL REFERENCES public.study_plan_items(id) ON DELETE CASCADE,
  questions_json JSONB NOT NULL,
  answers_json JSONB,
  score NUMERIC,
  feedback TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, study_plan_item_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_session_tests TO authenticated;
GRANT ALL ON public.study_session_tests TO service_role;

ALTER TABLE public.study_session_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own session tests" ON public.study_session_tests
  FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Students insert own session tests" ON public.study_session_tests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students update own session tests" ON public.study_session_tests
  FOR UPDATE TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students delete own session tests" ON public.study_session_tests
  FOR DELETE TO authenticated USING (auth.uid() = student_id);

CREATE TRIGGER update_study_session_tests_updated_at
  BEFORE UPDATE ON public.study_session_tests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
