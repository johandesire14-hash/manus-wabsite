CREATE TABLE IF NOT EXISTS public.finance_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_rate numeric(6, 3) NOT NULL DEFAULT 0 CHECK (commission_rate >= 0 AND commission_rate <= 100),
  currency text NOT NULL DEFAULT 'XAF',
  updated_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.finance_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_type text NOT NULL CHECK (entry_type IN ('advertising_revenue', 'expense')),
  category text NOT NULL,
  amount numeric(14, 2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'XAF',
  occurred_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS finance_entries_type_date_idx
ON public.finance_entries(entry_type, occurred_at DESC);

CREATE INDEX IF NOT EXISTS finance_entries_category_idx
ON public.finance_entries(category);

ALTER TABLE public.finance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_entries ENABLE ROW LEVEL SECURITY;
