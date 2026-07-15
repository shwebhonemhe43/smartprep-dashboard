
CREATE TABLE public.student_topic_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  topic_id uuid NOT NULL REFERENCES public.lecture_files(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  notes_content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, topic_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_topic_notes TO authenticated;
GRANT ALL ON public.student_topic_notes TO service_role;

ALTER TABLE public.student_topic_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own notes"
  ON public.student_topic_notes FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Students insert own notes"
  ON public.student_topic_notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students update own notes"
  ON public.student_topic_notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students delete own notes"
  ON public.student_topic_notes FOR DELETE
  TO authenticated
  USING (auth.uid() = student_id);

CREATE TRIGGER update_student_topic_notes_updated_at
  BEFORE UPDATE ON public.student_topic_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
