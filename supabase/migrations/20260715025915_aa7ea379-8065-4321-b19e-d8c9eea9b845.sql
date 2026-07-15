CREATE TABLE public.lecture_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lecture_files TO authenticated;
GRANT ALL ON public.lecture_files TO service_role;

ALTER TABLE public.lecture_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view lecture files"
  ON public.lecture_files FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert lecture files"
  ON public.lecture_files FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update lecture files"
  ON public.lecture_files FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete lecture files"
  ON public.lecture_files FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX lecture_files_subject_id_idx ON public.lecture_files(subject_id);

-- Storage policies for the lecture-files bucket
CREATE POLICY "Authenticated can read lecture files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'lecture-files');

CREATE POLICY "Admins can upload lecture files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'lecture-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update lecture files storage"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'lecture-files' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'lecture-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete lecture files storage"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'lecture-files' AND public.has_role(auth.uid(), 'admin'));