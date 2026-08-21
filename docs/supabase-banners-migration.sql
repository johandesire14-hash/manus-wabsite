-- Migration additive uniquement pour les bannières administrables WapiGarage.
-- Ne contient ni DROP, ni DELETE, ni UPDATE.

CREATE TABLE IF NOT EXISTS public.app_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  banner_number integer NOT NULL UNIQUE CHECK (banner_number > 0),
  title text NOT NULL,
  image_key text NOT NULL,
  image_url text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS app_banners_status_idx
  ON public.app_banners(status);

CREATE INDEX IF NOT EXISTS app_banners_number_idx
  ON public.app_banners(banner_number);

ALTER TABLE public.app_banners ENABLE ROW LEVEL SECURITY;

-- Aucune policy publique n’est créée : RLS bloque anon/authenticated.
-- service_role contourne RLS côté serveur pour le dashboard.
