CREATE TABLE public.student_topic_flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  topic_id uuid NOT NULL REFERENCES public.lecture_files(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  flashcards jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, topic_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_topic_flashcards TO authenticated;
GRANT ALL ON public.student_topic_flashcards TO service_role;

ALTER TABLE public.student_topic_flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own flashcards"
  ON public.student_topic_flashcards FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Students insert own flashcards"
  ON public.student_topic_flashcards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students update own flashcards"
  ON public.student_topic_flashcards FOR UPDATE
  TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students delete own flashcards"
  ON public.student_topic_flashcards FOR DELETE
  TO authenticated
  USING (auth.uid() = student_id);

CREATE TRIGGER update_student_topic_flashcards_updated_at
  BEFORE UPDATE ON public.student_topic_flashcards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();