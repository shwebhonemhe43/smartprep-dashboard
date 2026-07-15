
CREATE TABLE public.student_topic_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL,
  topic_id uuid NOT NULL REFERENCES public.lecture_files(id) ON DELETE CASCADE,
  notes_completed boolean NOT NULL DEFAULT false,
  flashcards_completed boolean NOT NULL DEFAULT false,
  quiz_completed boolean NOT NULL DEFAULT false,
  progress_percentage integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, topic_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_topic_progress TO authenticated;
GRANT ALL ON public.student_topic_progress TO service_role;

ALTER TABLE public.student_topic_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own progress"
  ON public.student_topic_progress FOR SELECT
  TO authenticated USING (auth.uid() = student_id);

CREATE POLICY "Students insert own progress"
  ON public.student_topic_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students update own progress"
  ON public.student_topic_progress FOR UPDATE
  TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students delete own progress"
  ON public.student_topic_progress FOR DELETE
  TO authenticated USING (auth.uid() = student_id);

CREATE TRIGGER update_student_topic_progress_updated_at
  BEFORE UPDATE ON public.student_topic_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
