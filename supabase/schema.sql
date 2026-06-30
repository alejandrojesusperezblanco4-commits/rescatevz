-- ============================================================
-- RescateVZ — Esquema de base de datos
-- Ejecutar en: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLAS
-- ============================================================

-- Perfiles de usuario (extiende auth.users de Supabase)
CREATE TABLE public.profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email       TEXT NOT NULL,
  full_name   TEXT NOT NULL DEFAULT '',
  role        TEXT NOT NULL DEFAULT 'family'
                CHECK (role IN ('admin', 'rescuer', 'medical', 'family')),
  cedula      TEXT,
  cedula_photo_url TEXT,
  selfie_url  TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hospitales, refugios y zonas de rescate
CREATE TABLE public.locations (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name              TEXT NOT NULL,
  type              TEXT NOT NULL CHECK (type IN ('hospital', 'shelter', 'rescue_zone')),
  lat               DECIMAL(10, 7) NOT NULL,
  lng               DECIMAL(10, 7) NOT NULL,
  address           TEXT,
  phone             TEXT,
  capacity          INTEGER,
  current_occupancy INTEGER NOT NULL DEFAULT 0,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Víctimas rescatadas
CREATE TABLE public.victims (
  id                   UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_by           UUID REFERENCES public.profiles(id) NOT NULL,
  name                 TEXT,                 -- puede ser NULL si se desconoce
  physical_description TEXT NOT NULL,
  estimated_age        INTEGER,
  is_minor             BOOLEAN NOT NULL DEFAULT FALSE,
  status               TEXT NOT NULL DEFAULT 'unknown'
                         CHECK (status IN ('alive', 'critical', 'deceased', 'unknown')),
  found_location       TEXT NOT NULL,
  current_location_id  UUID REFERENCES public.locations(id),
  photo_urls           TEXT[] NOT NULL DEFAULT '{}',
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Solicitudes de familias para ver perfil completo de una víctima
CREATE TABLE public.access_requests (
  id                       UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_user_id           UUID REFERENCES public.profiles(id) NOT NULL,
  victim_id                UUID REFERENCES public.victims(id) NOT NULL,
  id_document_url          TEXT NOT NULL,
  relationship_description TEXT NOT NULL,
  status                   TEXT NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by              UUID REFERENCES public.profiles(id),
  approved_at              TIMESTAMPTZ,
  expires_at               TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (family_user_id, victim_id)  -- un familiar solo solicita una vez por víctima
);

-- Registro de auditoría (append-only, nunca modificar ni borrar)
CREATE TABLE public.audit_log (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID REFERENCES public.profiles(id),
  action        TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id   UUID,
  metadata      JSONB,
  ip_address    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.victims         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log       ENABLE ROW LEVEL SECURITY;

-- Helper: rol del usuario actual
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_verified_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'rescuer', 'medical')
    AND is_verified = TRUE
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES
CREATE POLICY "profiles: leer propio"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: leer todos (admin)"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "profiles: insertar propio"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: actualizar propio"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "profiles: actualizar cualquiera (admin)"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- LOCATIONS: todos los usuarios autenticados pueden leer
CREATE POLICY "locations: leer activas"
  ON public.locations FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "locations: escribir (admin)"
  ON public.locations FOR ALL
  USING (public.is_admin());

-- VICTIMS: staff verificado puede crear; staff puede leer adultos; medical/admin pueden ver menores
CREATE POLICY "victims: crear (staff verificado)"
  ON public.victims FOR INSERT
  WITH CHECK (public.is_verified_staff());

CREATE POLICY "victims: leer adultos (staff)"
  ON public.victims FOR SELECT
  USING (
    is_minor = FALSE
    AND (
      public.current_user_role() IN ('admin', 'medical', 'rescuer')
    )
  );

CREATE POLICY "victims: leer menores (medical/admin)"
  ON public.victims FOR SELECT
  USING (
    is_minor = TRUE
    AND public.current_user_role() IN ('admin', 'medical')
  );

CREATE POLICY "victims: actualizar (medical/admin)"
  ON public.victims FOR UPDATE
  USING (public.current_user_role() IN ('admin', 'medical'));

-- ACCESS REQUESTS
CREATE POLICY "access_requests: insertar propio"
  ON public.access_requests FOR INSERT
  WITH CHECK (auth.uid() = family_user_id);

CREATE POLICY "access_requests: leer propio"
  ON public.access_requests FOR SELECT
  USING (auth.uid() = family_user_id);

CREATE POLICY "access_requests: leer/actualizar (admin)"
  ON public.access_requests FOR ALL
  USING (public.is_admin());

-- AUDIT LOG: cualquiera puede insertar; solo admin puede leer
CREATE POLICY "audit_log: insertar"
  ON public.audit_log FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "audit_log: leer (admin)"
  ON public.audit_log FOR SELECT
  USING (public.is_admin());

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-crear perfil al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'family')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-actualizar updated_at en victims
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER victims_updated_at
  BEFORE UPDATE ON public.victims
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- STORAGE BUCKETS (ejecutar desde Supabase Dashboard > Storage)
-- O usar SQL:
-- ============================================================

-- Crear buckets (si el cliente SQL lo permite)
INSERT INTO storage.buckets (id, name, public) VALUES
  ('victim-photos', 'victim-photos', FALSE),
  ('access-docs', 'access-docs', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage
CREATE POLICY "victim-photos: subir (staff verificado)"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'victim-photos'
    AND public.is_verified_staff()
  );

CREATE POLICY "victim-photos: leer (staff)"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'victim-photos'
    AND public.current_user_role() IN ('admin', 'medical', 'rescuer')
  );

CREATE POLICY "access-docs: subir (autenticado)"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'access-docs'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "access-docs: leer (admin)"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'access-docs'
    AND public.is_admin()
  );

-- ============================================================
-- DATOS INICIALES: hospitales y refugios en Caracas
-- ============================================================

INSERT INTO public.locations (name, type, lat, lng, address, capacity) VALUES
  ('Hospital Universitario de Caracas',       'hospital', 10.4929, -66.9005, 'Av. Neverí, Los Chaguaramos, Caracas',         500),
  ('Hospital de Clínicas Caracas',            'hospital', 10.4921, -66.8793, 'Av. Pantéon, San Bernardino, Caracas',          300),
  ('Hospital Militar Dr. Carlos Arvelo',      'hospital', 10.4856, -66.8854, 'Av. José Ángel Lamas, Caracas',                 400),
  ('Hospital Pérez Carreño',                  'hospital', 10.4756, -66.9543, 'Av. principal de Los Ruices, Caracas',          450),
  ('Hospital Domingo Luciani (El Llanito)',   'hospital', 10.5001, -66.8125, 'Av. Intercomunal El Llanito, Caracas',          350),
  ('Estadio Olímpico de la UCV (Refugio)',   'shelter',  10.4837, -66.9027, 'Av. Universidad, Ciudad Universitaria, Caracas', 2000),
  ('Poliedro de Caracas (Refugio)',           'shelter',  10.4557, -66.9183, 'Calle Río de Janeiro, Las Mercedes, Caracas',  3000),
  ('Sambil Caracas (Refugio temporal)',       'shelter',  10.5038, -66.8517, 'Av. Libertador, Chacao, Caracas',              1000),
  ('Centro Comercial El Valle (Refugio)',     'shelter',  10.4434, -66.9216, 'Av. El Valle, Caracas',                         800)
ON CONFLICT DO NOTHING;

-- ============================================================
-- PRIMER ADMINISTRADOR
-- Después de registrarte, ejecuta esto con tu UUID:
-- UPDATE public.profiles SET role = 'admin', is_verified = TRUE WHERE id = 'TU-UUID-AQUI';
-- ============================================================

-- ============================================================
-- MIGRACIÓN: búsqueda pública sin exponer datos sensibles
-- Seguro de re-ejecutar sobre una base ya creada con el bloque anterior.
-- ============================================================

-- Búsqueda pública: solo confirma ubicación + estado de salud.
-- Nunca expone nombre, cédula, descripción física, notas ni fotos.
-- SECURITY DEFINER + columnas fijas en RETURNS TABLE = el llamante
-- jamás puede pedir una columna distinta a las cuatro listadas aquí,
-- a diferencia de exponer la tabla victims directamente vía RLS.
CREATE OR REPLACE FUNCTION public.search_victims_public(p_query TEXT)
RETURNS TABLE (
  victim_id     UUID,
  location_name TEXT,
  location_type TEXT,
  victim_status TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    v.id,
    COALESCE(l.name, 'Ubicación no registrada'),
    COALESCE(l.type, 'unknown'),
    v.status
  FROM public.victims v
  LEFT JOIN public.locations l ON l.id = v.current_location_id
  WHERE v.is_minor = FALSE
    AND length(trim(p_query)) >= 3
    AND (v.name ILIKE '%' || p_query || '%' OR v.physical_description ILIKE '%' || p_query || '%')
  LIMIT 20;
$$;

REVOKE ALL ON FUNCTION public.search_victims_public(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_victims_public(TEXT) TO anon, authenticated;

-- Reportes de menores: nunca se busca por texto libre ni se hace
-- matching automático. Cualquiera puede reportar; solo admin lee/revisa
-- y cruza manualmente contra los menores ya registrados.
CREATE TABLE IF NOT EXISTS public.minor_inquiries (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reporter_name    TEXT NOT NULL,
  reporter_contact TEXT NOT NULL,
  description      TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'reviewed')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.minor_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "minor_inquiries: insertar" ON public.minor_inquiries;
CREATE POLICY "minor_inquiries: insertar"
  ON public.minor_inquiries FOR INSERT
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "minor_inquiries: leer (admin)" ON public.minor_inquiries;
CREATE POLICY "minor_inquiries: leer (admin)"
  ON public.minor_inquiries FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "minor_inquiries: actualizar (admin)" ON public.minor_inquiries;
CREATE POLICY "minor_inquiries: actualizar (admin)"
  ON public.minor_inquiries FOR UPDATE
  USING (public.is_admin());

-- Tipo de documento de identidad para la solicitud de acceso familiar.
-- Un menor de ~9 años en Venezuela aún no tiene cédula, por lo que el
-- familiar prueba el parentesco con el acta de nacimiento del menor.
ALTER TABLE public.access_requests
  ADD COLUMN IF NOT EXISTS id_document_type TEXT NOT NULL DEFAULT 'cedula'
    CHECK (id_document_type IN ('cedula', 'acta_nacimiento'));

-- Un familiar con solicitud aprobada y vigente puede ver el perfil
-- completo de ESA víctima puntual (no de todas). Esto no afecta las
-- políticas de staff de arriba: en RLS, varias policies permisivas para
-- el mismo comando se combinan con OR.
DROP POLICY IF EXISTS "victims: leer (familiar aprobado)" ON public.victims;
CREATE POLICY "victims: leer (familiar aprobado)"
  ON public.victims FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.access_requests ar
      WHERE ar.victim_id = victims.id
        AND ar.family_user_id = auth.uid()
        AND ar.status = 'approved'
        AND ar.expires_at > NOW()
    )
  );

-- ============================================================
-- MIGRACIÓN: verificación obligatoria en reportes de menores
-- Ante el aumento de desapariciones de menores y de tráfico, un reporte
-- anónimo sin ningún rastro es un riesgo: cualquiera podría usarlo para
-- intentar ubicar a un menor sin dejar forma de verificar quién pregunta.
-- Por eso el reporte ahora exige sesión iniciada + documento que pruebe
-- parentesco (reutiliza el bucket privado access-docs, ya solo lo lee
-- admin). Nada de esto habilita búsqueda ni matching automático: sigue
-- siendo 100% revisión manual de un admin.
-- ============================================================

ALTER TABLE public.minor_inquiries
  ADD COLUMN IF NOT EXISTS reporter_user_id UUID REFERENCES public.profiles(id);

ALTER TABLE public.minor_inquiries
  ADD COLUMN IF NOT EXISTS id_document_url TEXT;

DROP POLICY IF EXISTS "minor_inquiries: insertar" ON public.minor_inquiries;
CREATE POLICY "minor_inquiries: insertar"
  ON public.minor_inquiries FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND reporter_user_id = auth.uid()
    AND id_document_url IS NOT NULL
    AND length(id_document_url) > 0
  );

-- ============================================================
-- MIGRACIÓN: rescatistas pueden actualizar sus propias víctimas
-- Ejecutar en Supabase SQL Editor
-- ============================================================

DROP POLICY IF EXISTS "victims: actualizar (rescuer propio)" ON public.victims;
CREATE POLICY "victims: actualizar (rescuer propio)"
  ON public.victims FOR UPDATE
  USING (
    public.is_verified_staff()
    AND public.current_user_role() = 'rescuer'
    AND created_by = auth.uid()
  )
  WITH CHECK (
    public.is_verified_staff()
    AND public.current_user_role() = 'rescuer'
    AND created_by = auth.uid()
  );


-- rescatistas en campo pueden reportar una estructura ("poner una issue")
-- que entra como 'pending' hasta que un ingeniero la evalúe. La lectura es
-- pública (se muestra en el mapa); solo ingenieros/admin asignan el color.
-- Seguro de re-ejecutar sobre una base ya creada.
-- ============================================================

-- Añadir 'engineer' al CHECK de roles (constraint con nombre autogenerado)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'rescuer', 'medical', 'family', 'engineer'));

CREATE TABLE IF NOT EXISTS public.structures (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name             TEXT NOT NULL,
  address          TEXT,
  lat              DECIMAL(10, 7),
  lng              DECIMAL(10, 7),
  structure_type   TEXT CHECK (structure_type IN
                     ('residential', 'school', 'hospital', 'commercial',
                      'government', 'bridge', 'other')),
  habitability     TEXT NOT NULL DEFAULT 'pending'
                     CHECK (habitability IN ('pending', 'green', 'yellow', 'red')),
  report_notes     TEXT,                          -- lo que reportó quien la dio de alta
  assessment_notes TEXT,                          -- observaciones del ingeniero
  reported_by      UUID REFERENCES public.profiles(id),
  assessed_by      UUID REFERENCES public.profiles(id),
  assessed_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.structures ENABLE ROW LEVEL SECURITY;

-- Lectura pública: el estado de habitabilidad es información de interés
-- público (se muestra en el mapa). No contiene datos personales.
DROP POLICY IF EXISTS "structures: leer (público)" ON public.structures;
CREATE POLICY "structures: leer (público)"
  ON public.structures FOR SELECT
  USING (TRUE);

-- Crear/reportar: admin e ingenieros verificados crean con cualquier
-- estado; rescatistas verificados solo pueden añadir estructuras 'pending'
-- (reportar para que un ingeniero las evalúe).
DROP POLICY IF EXISTS "structures: crear/reportar" ON public.structures;
CREATE POLICY "structures: crear/reportar"
  ON public.structures FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (
          p.role = 'admin'
          OR (p.role = 'engineer' AND p.is_verified = TRUE)
          OR (p.role = 'rescuer' AND p.is_verified = TRUE AND habitability = 'pending')
        )
    )
  );

-- Evaluar (asignar/cambiar el color del semáforo): solo ingenieros
-- verificados y admin.
DROP POLICY IF EXISTS "structures: evaluar (ingeniero/admin)" ON public.structures;
CREATE POLICY "structures: evaluar (ingeniero/admin)"
  ON public.structures FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (p.role = 'admin' OR (p.role = 'engineer' AND p.is_verified = TRUE))
    )
  );

DROP POLICY IF EXISTS "structures: borrar (admin)" ON public.structures;
CREATE POLICY "structures: borrar (admin)"
  ON public.structures FOR DELETE
  USING (public.is_admin());

CREATE OR REPLACE TRIGGER structures_updated_at
  BEFORE UPDATE ON public.structures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Datos de ejemplo (solo si la tabla está vacía): mezcla de evaluadas y
-- pendientes para que el semáforo y el mapa no salgan vacíos.
INSERT INTO public.structures
  (name, address, lat, lng, structure_type, habitability, assessment_notes, report_notes, assessed_at)
SELECT v.* FROM (VALUES
  ('Edificio Residencial Parque Central', 'Av. Lecuna, Parque Central, Caracas',     10.4945::decimal, -66.9075::decimal, 'residential', 'red',     'Daño estructural severo en columnas del nivel 1. Evacuación total.', NULL::text, NOW()),
  ('Escuela Básica Andrés Bello',         'Av. Sucre, Catia, Caracas',               10.5096::decimal, -66.9295::decimal, 'school',      'yellow',  'Grietas no estructurales. Acceso restringido a planta baja.',       NULL::text, NOW()),
  ('Centro Comercial El Recreo',          'Av. Casanova, Sabana Grande, Caracas',    10.4915::decimal, -66.8765::decimal, 'commercial',  'green',   'Inspeccionado. Sin daños estructurales. Apto para uso.',            NULL::text, NOW()),
  ('Edificio sin identificar — Av. Baralt','Av. Baralt, Caracas',                    10.5050::decimal, -66.9180::decimal, 'residential', 'pending', NULL::text, 'Reportado por rescatista: fachada con grietas visibles.',           NULL::timestamptz),
  ('Ambulatorio Urbano La Pastora',       'La Pastora, Caracas',                     10.5135::decimal, -66.9210::decimal, 'hospital',    'pending', NULL::text, 'Reportado en campo: requiere inspección de ingeniero.',             NULL::timestamptz)
) AS v(name, address, lat, lng, structure_type, habitability, assessment_notes, report_notes, assessed_at)
WHERE NOT EXISTS (SELECT 1 FROM public.structures);
