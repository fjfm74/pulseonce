ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS historical_teams TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS players_historical_teams_gin
  ON public.players USING GIN (historical_teams);

UPDATE public.players p
SET historical_teams = ARRAY(SELECT name FROM public.teams t WHERE t.id = p.team_id)
WHERE team_id IS NOT NULL AND (array_length(historical_teams, 1) IS NULL OR array_length(historical_teams,1) = 0);

CREATE OR REPLACE FUNCTION public.append_historical_team(
  p_player_id INT,
  p_team_name TEXT
) RETURNS VOID
LANGUAGE SQL
SET search_path = public
AS $$
  UPDATE public.players
  SET historical_teams = (
    SELECT COALESCE(array_agg(DISTINCT x ORDER BY x), '{}')
    FROM unnest(historical_teams || ARRAY[p_team_name]) x
    WHERE x IS NOT NULL AND x <> ''
  )
  WHERE id = p_player_id;
$$;

GRANT EXECUTE ON FUNCTION public.append_historical_team(INT, TEXT) TO authenticated, anon, service_role;