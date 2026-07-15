CREATE TABLE public.old_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  exam_year INTEGER NOT NULL,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.old_questions TO authenticated;
GRANT ALL ON public.old_questions TO service_role;

ALTER TABLE public.old_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view old questions"
  ON public.old_questions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert old questions"
  ON public.old_questions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update old questions"
  ON public.old_questions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete old questions"
  ON public.old_questions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX old_questions_subject_id_idx ON public.old_questions(subject_id);

-- Storage policies for the old-question-files bucket
CREATE POLICY "Authenticated can read old question files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'old-question-files');

CREATE POLICY "Admins can upload old question files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'old-question-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update old question files storage"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'old-question-files' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'old-question-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete old question files storage"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'old-question-files' AND public.has_role(auth.uid(), 'admin'));