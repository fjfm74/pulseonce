
-- ============================================================
-- PULSE11 SCHEMA
-- ============================================================

-- Enums
CREATE TYPE public.player_position AS ENUM ('GK','DF','MF','FW');
CREATE TYPE public.profile_status AS ENUM ('active','deleted','suspended');
CREATE TYPE public.league_role AS ENUM ('admin','member');

-- ---------- TEAMS ----------
CREATE TABLE public.teams (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  country TEXT NOT NULL,
  league_external_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teams_public_read" ON public.teams FOR SELECT USING (true);

-- ---------- PLAYERS ----------
CREATE TABLE public.players (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  position public.player_position NOT NULL,
  team_id INT REFERENCES public.teams(id) ON DELETE SET NULL,
  birth_year INT,
  nationality TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "players_public_read" ON public.players FOR SELECT USING (true);
CREATE INDEX idx_players_position ON public.players(position);
CREATE INDEX idx_players_team ON public.players(team_id);

-- ---------- PROFILES ----------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  birth_year INT NOT NULL CHECK (birth_year <= 2012 AND birth_year >= 1900),
  favorite_team_id INT REFERENCES public.teams(id) ON DELETE SET NULL,
  avatar_id TEXT NOT NULL DEFAULT 'av-01',
  status public.profile_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_public_read_active" ON public.profiles
  FOR SELECT USING (status = 'active');
CREATE POLICY "profiles_self_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_self_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE INDEX idx_profiles_username ON public.profiles(lower(username));

-- ---------- MODES ----------
CREATE TABLE public.modes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.modes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "modes_public_read" ON public.modes FOR SELECT USING (true);

-- ---------- LINEUPS ----------
CREATE TABLE public.lineups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  mode_id UUID NOT NULL REFERENCES public.modes(id) ON DELETE RESTRICT,
  title TEXT NOT NULL DEFAULT 'Mi 11',
  formation TEXT NOT NULL DEFAULT '4-3-3',
  players JSONB NOT NULL DEFAULT '[]'::jsonb,
  pulses_count INT NOT NULL DEFAULT 0,
  forks_count INT NOT NULL DEFAULT 0,
  forked_from UUID REFERENCES public.lineups(id) ON DELETE SET NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lineups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lineups_public_read" ON public.lineups
  FOR SELECT USING (is_public = true OR auth.uid() = author_id);
CREATE POLICY "lineups_author_insert" ON public.lineups
  FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "lineups_author_update" ON public.lineups
  FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "lineups_author_delete" ON public.lineups
  FOR DELETE USING (auth.uid() = author_id);

-- 1 lineup per user per mode per ISO week (UTC)
CREATE UNIQUE INDEX uniq_lineup_per_user_mode_week
  ON public.lineups (author_id, mode_id, (date_trunc('week', created_at AT TIME ZONE 'UTC')::date))
  WHERE author_id IS NOT NULL;

CREATE INDEX idx_lineups_author ON public.lineups(author_id);
CREATE INDEX idx_lineups_mode ON public.lineups(mode_id);
CREATE INDEX idx_lineups_created ON public.lineups(created_at DESC);

-- ---------- PULSES ----------
CREATE TABLE public.pulses (
  lineup_id UUID NOT NULL REFERENCES public.lineups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (lineup_id, user_id)
);
ALTER TABLE public.pulses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pulses_public_read" ON public.pulses FOR SELECT USING (true);
CREATE POLICY "pulses_self_insert" ON public.pulses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pulses_self_delete" ON public.pulses
  FOR DELETE USING (auth.uid() = user_id);

-- No self-pulse trigger + maintain counter
CREATE OR REPLACE FUNCTION public.fn_pulses_validate_and_count()
RETURNS TRIGGER AS $$
DECLARE
  author UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT author_id INTO author FROM public.lineups WHERE id = NEW.lineup_id;
    IF author IS NOT NULL AND author = NEW.user_id THEN
      RAISE EXCEPTION 'No puedes hacer pulse a tu propia carta';
    END IF;
    UPDATE public.lineups SET pulses_count = pulses_count + 1 WHERE id = NEW.lineup_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.lineups SET pulses_count = GREATEST(pulses_count - 1, 0) WHERE id = OLD.lineup_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_pulses_ins
  AFTER INSERT ON public.pulses
  FOR EACH ROW EXECUTE FUNCTION public.fn_pulses_validate_and_count();
CREATE TRIGGER trg_pulses_del
  AFTER DELETE ON public.pulses
  FOR EACH ROW EXECUTE FUNCTION public.fn_pulses_validate_and_count();

-- ---------- LEAGUES ----------
CREATE TABLE public.leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  crest_id TEXT NOT NULL DEFAULT 'cr-01',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  active_mode_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.league_members (
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.league_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (league_id, user_id)
);
ALTER TABLE public.league_members ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER membership check (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_league_member(_league_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.league_members
    WHERE league_id = _league_id AND user_id = _user_id
  );
$$;

CREATE POLICY "leagues_member_read" ON public.leagues
  FOR SELECT USING (public.is_league_member(id, auth.uid()));
CREATE POLICY "leagues_creator_insert" ON public.leagues
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "leagues_creator_update" ON public.leagues
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "league_members_member_read" ON public.league_members
  FOR SELECT USING (public.is_league_member(league_id, auth.uid()));
CREATE POLICY "league_members_self_insert" ON public.league_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "league_members_self_delete" ON public.league_members
  FOR DELETE USING (auth.uid() = user_id);

-- ---------- COMMENTS ----------
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lineup_id UUID NOT NULL REFERENCES public.lineups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 300),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_public_read" ON public.comments FOR SELECT USING (true);
CREATE POLICY "comments_self_insert" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_self_delete" ON public.comments
  FOR DELETE USING (auth.uid() = user_id);

-- ---------- BLOCKS (symmetric) ----------
CREATE TABLE public.blocks (
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocks_self_read" ON public.blocks
  FOR SELECT USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);
CREATE POLICY "blocks_self_insert" ON public.blocks
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "blocks_self_delete" ON public.blocks
  FOR DELETE USING (auth.uid() = blocker_id);

-- ---------- REPORTS ----------
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('lineup','comment','profile')),
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (length(reason) BETWEEN 3 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_self_insert" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports_self_read" ON public.reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Modes
INSERT INTO public.modes (slug, name, description, rules, is_active) VALUES
('corazon', 'El 11 del corazón', 'Tu once ideal de siempre. Cualquier jugador.',
  '{"selection_mode":"open"}'::jsonb, true),
('sorpresa', 'Sorpresa de la jornada', 'Lista cerrada de 22 jugadores. Elige 11.',
  '{"selection_mode":"pool","pool_size":22}'::jsonb, true);

-- Teams (30)
INSERT INTO public.teams (name, country, league_external_id) VALUES
('Real Madrid','España','laliga'),
('Barcelona','España','laliga'),
('Atlético','España','laliga'),
('Sevilla','España','laliga'),
('Real Sociedad','España','laliga'),
('Athletic Club','España','laliga'),
('Villarreal','España','laliga'),
('Valencia','España','laliga'),
('Betis','España','laliga'),
('Celta','España','laliga'),
('Girona','España','laliga'),
('Osasuna','España','laliga'),
('Rayo Vallecano','España','laliga'),
('Getafe','España','laliga'),
('Mallorca','España','laliga'),
('Manchester City','Inglaterra','premier'),
('Liverpool','Inglaterra','premier'),
('Arsenal','Inglaterra','premier'),
('Chelsea','Inglaterra','premier'),
('Manchester United','Inglaterra','premier'),
('Bayern','Alemania','bundesliga'),
('Dortmund','Alemania','bundesliga'),
('PSG','Francia','ligue1'),
('Inter','Italia','seriea'),
('Milan','Italia','seriea'),
('Juventus','Italia','seriea'),
('Napoli','Italia','seriea'),
('España','España','nacional'),
('Argentina','Argentina','nacional'),
('Francia','Francia','nacional');

-- Players (50) — solo nombres, sin imágenes oficiales
INSERT INTO public.players (name, position, team_id, birth_year, nationality) VALUES
-- Históricos / leyendas
('Iker Casillas','GK',(SELECT id FROM public.teams WHERE name='España'),1981,'🇪🇸'),
('Xavi Hernández','MF',(SELECT id FROM public.teams WHERE name='Barcelona'),1980,'🇪🇸'),
('Andrés Iniesta','MF',(SELECT id FROM public.teams WHERE name='Barcelona'),1984,'🇪🇸'),
('Sergio Ramos','DF',(SELECT id FROM public.teams WHERE name='Real Madrid'),1986,'🇪🇸'),
('Carles Puyol','DF',(SELECT id FROM public.teams WHERE name='Barcelona'),1978,'🇪🇸'),
('Raúl González','FW',(SELECT id FROM public.teams WHERE name='Real Madrid'),1977,'🇪🇸'),
('Fernando Torres','FW',(SELECT id FROM public.teams WHERE name='Atlético'),1984,'🇪🇸'),
('David Villa','FW',(SELECT id FROM public.teams WHERE name='España'),1981,'🇪🇸'),
('Xabi Alonso','MF',(SELECT id FROM public.teams WHERE name='España'),1981,'🇪🇸'),
('Sergio Busquets','MF',(SELECT id FROM public.teams WHERE name='Barcelona'),1988,'🇪🇸'),
('Diego Maradona','MF',(SELECT id FROM public.teams WHERE name='Argentina'),1960,'🇦🇷'),
('Johan Cruyff','FW',(SELECT id FROM public.teams WHERE name='Barcelona'),1947,'🇳🇱'),
('Ronaldinho','MF',(SELECT id FROM public.teams WHERE name='Barcelona'),1980,'🇧🇷'),
('Ronaldo Nazário','FW',(SELECT id FROM public.teams WHERE name='Real Madrid'),1976,'🇧🇷'),
('Zinedine Zidane','MF',(SELECT id FROM public.teams WHERE name='Real Madrid'),1972,'🇫🇷'),
('Pep Guardiola','MF',(SELECT id FROM public.teams WHERE name='Barcelona'),1971,'🇪🇸'),
('Hugo Sánchez','FW',(SELECT id FROM public.teams WHERE name='Real Madrid'),1958,'🇲🇽'),
('Alfredo Di Stéfano','FW',(SELECT id FROM public.teams WHERE name='Real Madrid'),1926,'🇦🇷'),
-- Actuales LaLiga / Europa / selecciones
('Lionel Messi','FW',(SELECT id FROM public.teams WHERE name='Argentina'),1987,'🇦🇷'),
('Cristiano Ronaldo','FW',(SELECT id FROM public.teams WHERE name='Real Madrid'),1985,'🇵🇹'),
('Vinícius Jr.','FW',(SELECT id FROM public.teams WHERE name='Real Madrid'),2000,'🇧🇷'),
('Jude Bellingham','MF',(SELECT id FROM public.teams WHERE name='Real Madrid'),2003,'🏴󠁧󠁢󠁥󠁮󠁧󠁿'),
('Rodrygo','FW',(SELECT id FROM public.teams WHERE name='Real Madrid'),2001,'🇧🇷'),
('Eduardo Camavinga','MF',(SELECT id FROM public.teams WHERE name='Real Madrid'),2002,'🇫🇷'),
('Aurélien Tchouaméni','MF',(SELECT id FROM public.teams WHERE name='Real Madrid'),2000,'🇫🇷'),
('Thibaut Courtois','GK',(SELECT id FROM public.teams WHERE name='Real Madrid'),1992,'🇧🇪'),
('Antonio Rüdiger','DF',(SELECT id FROM public.teams WHERE name='Real Madrid'),1993,'🇩🇪'),
('Dani Carvajal','DF',(SELECT id FROM public.teams WHERE name='Real Madrid'),1992,'🇪🇸'),
('Robert Lewandowski','FW',(SELECT id FROM public.teams WHERE name='Barcelona'),1988,'🇵🇱'),
('Lamine Yamal','FW',(SELECT id FROM public.teams WHERE name='Barcelona'),2007,'🇪🇸'),
('Pedri','MF',(SELECT id FROM public.teams WHERE name='Barcelona'),2002,'🇪🇸'),
('Gavi','MF',(SELECT id FROM public.teams WHERE name='Barcelona'),2004,'🇪🇸'),
('Frenkie de Jong','MF',(SELECT id FROM public.teams WHERE name='Barcelona'),1997,'🇳🇱'),
('Ronald Araújo','DF',(SELECT id FROM public.teams WHERE name='Barcelona'),1999,'🇺🇾'),
('Marc-André ter Stegen','GK',(SELECT id FROM public.teams WHERE name='Barcelona'),1992,'🇩🇪'),
('Antoine Griezmann','FW',(SELECT id FROM public.teams WHERE name='Atlético'),1991,'🇫🇷'),
('Jan Oblak','GK',(SELECT id FROM public.teams WHERE name='Atlético'),1993,'🇸🇮'),
('Julián Álvarez','FW',(SELECT id FROM public.teams WHERE name='Atlético'),2000,'🇦🇷'),
('Koke','MF',(SELECT id FROM public.teams WHERE name='Atlético'),1992,'🇪🇸'),
('Nico Williams','FW',(SELECT id FROM public.teams WHERE name='Athletic Club'),2002,'🇪🇸'),
('Mikel Oyarzabal','FW',(SELECT id FROM public.teams WHERE name='Real Sociedad'),1997,'🇪🇸'),
('Erling Haaland','FW',(SELECT id FROM public.teams WHERE name='Manchester City'),2000,'🇳🇴'),
('Kevin De Bruyne','MF',(SELECT id FROM public.teams WHERE name='Manchester City'),1991,'🇧🇪'),
('Rodri','MF',(SELECT id FROM public.teams WHERE name='Manchester City'),1996,'🇪🇸'),
('Mohamed Salah','FW',(SELECT id FROM public.teams WHERE name='Liverpool'),1992,'🇪🇬'),
('Virgil van Dijk','DF',(SELECT id FROM public.teams WHERE name='Liverpool'),1991,'🇳🇱'),
('Kylian Mbappé','FW',(SELECT id FROM public.teams WHERE name='Real Madrid'),1998,'🇫🇷'),
('Harry Kane','FW',(SELECT id FROM public.teams WHERE name='Bayern'),1993,'🏴󠁧󠁢󠁥󠁮󠁧󠁿'),
('Lautaro Martínez','FW',(SELECT id FROM public.teams WHERE name='Inter'),1997,'🇦🇷'),
('Rafael Leão','FW',(SELECT id FROM public.teams WHERE name='Milan'),1999,'🇵🇹'),
('Unai Simón','GK',(SELECT id FROM public.teams WHERE name='Athletic Club'),1997,'🇪🇸');

-- Auto-create profile row trigger is NOT created; profiles are inserted explicitly during onboarding
-- so we can validate username + birth_year together.
