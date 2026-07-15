
CREATE TABLE public.saved_flashcards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  subject_id UUID,
  topic_id UUID,
  subject_name TEXT NOT NULL,
  topic_name TEXT NOT NULL,
  flashcards JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, topic_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_flashcards TO authenticated;
GRANT ALL ON public.saved_flashcards TO service_role;

ALTER TABLE public.saved_flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own saved flashcards" ON public.saved_flashcards
  FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Students insert own saved flashcards" ON public.saved_flashcards
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students delete own saved flashcards" ON public.saved_flashcards
  FOR DELETE TO authenticated USING (auth.uid() = student_id);

CREATE TABLE public.saved_quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  subject_id UUID,
  topic_id UUID,
  subject_name TEXT NOT NULL,
  topic_name TEXT NOT NULL,
  questions JSONB NOT NULL,
  question_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, topic_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_quizzes TO authenticated;
GRANT ALL ON public.saved_quizzes TO service_role;

ALTER TABLE public.saved_quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own saved quizzes" ON public.saved_quizzes
  FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Students insert own saved quizzes" ON public.saved_quizzes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students delete own saved quizzes" ON public.saved_quizzes
  FOR DELETE TO authenticated USING (auth.uid() = student_id);
