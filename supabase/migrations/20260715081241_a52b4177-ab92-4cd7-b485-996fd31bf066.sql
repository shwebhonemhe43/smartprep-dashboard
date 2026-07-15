ALTER TABLE public.study_plans ADD COLUMN IF NOT EXISTS subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL;
ALTER TABLE public.study_plan_items DROP CONSTRAINT IF EXISTS study_plan_items_subject_id_fkey;
ALTER TABLE public.study_plan_items ADD CONSTRAINT study_plan_items_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE SET NULL;