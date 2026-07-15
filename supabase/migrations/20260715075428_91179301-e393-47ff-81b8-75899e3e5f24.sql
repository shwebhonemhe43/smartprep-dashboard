
CREATE TABLE public.study_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  plan_type text NOT NULL CHECK (plan_type IN ('topic', 'priority')),
  exam_date date NOT NULL,
  available_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  priorities jsonb,
  generated_plan jsonb,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_plans TO authenticated;
GRANT ALL ON public.study_plans TO service_role;

ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own study plans" ON public.study_plans
  FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Students create own study plans" ON public.study_plans
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students update own study plans" ON public.study_plans
  FOR UPDATE TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students delete own study plans" ON public.study_plans
  FOR DELETE TO authenticated USING (auth.uid() = student_id);

CREATE INDEX idx_study_plans_student ON public.study_plans(student_id, created_at DESC);

CREATE TRIGGER trg_study_plans_updated_at
  BEFORE UPDATE ON public.study_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.study_plan_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_plan_id uuid NOT NULL REFERENCES public.study_plans(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  date date NOT NULL,
  start_time text,
  end_time text,
  subject_id uuid,
  topic_id uuid,
  title text NOT NULL,
  description text,
  duration_minutes integer NOT NULL DEFAULT 60,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_plan_items TO authenticated;
GRANT ALL ON public.study_plan_items TO service_role;

ALTER TABLE public.study_plan_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own plan items" ON public.study_plan_items
  FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Students create own plan items" ON public.study_plan_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students update own plan items" ON public.study_plan_items
  FOR UPDATE TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students delete own plan items" ON public.study_plan_items
  FOR DELETE TO authenticated USING (auth.uid() = student_id);

CREATE INDEX idx_plan_items_plan ON public.study_plan_items(study_plan_id, date);
CREATE INDEX idx_plan_items_student_date ON public.study_plan_items(student_id, date);

CREATE TRIGGER trg_study_plan_items_updated_at
  BEFORE UPDATE ON public.study_plan_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
