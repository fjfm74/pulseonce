import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ADMIN_EMAIL = "nuriafrancis@gmail.com";

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
  const email = data.user?.email?.toLowerCase();
  if (email !== ADMIN_EMAIL) throw new Error("No autorizado");
  return email;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const POSITION_MAP: Record<string, "GK" | "DF" | "MF" | "FW"> = {
  Goalkeeper: "GK",
  Defender: "DF",
  Midfielder: "MF",
  Attacker: "FW",
};

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    return { isAdmin: data.user?.email?.toLowerCase() === ADMIN_EMAIL };
  });

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const [{ count: players }, { count: teams }, { data: distinct }] = await Promise.all([
      supabaseAdmin.from("players").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("teams").select("*", { count: "exact", head: true }),
      supabaseAdmin.rpc("count_distinct_historical_teams" as never).then(
        (r) => ({ data: r.data as number | null }),
        () => ({ data: null }),
      ),
    ]);
    // Fallback distinct count via SQL if RPC missing
    let distinctTeams = distinct ?? 0;
    if (!distinct) {
      const { data: rows } = await supabaseAdmin
        .from("players").select("historical_teams").not("historical_teams", "is", null);
      const set = new Set<string>();
      (rows ?? []).forEach((r) => (r.historical_teams as string[] | null)?.forEach((t) => t && set.add(t)));
      distinctTeams = set.size;
    }
    return { players: players ?? 0, teams: teams ?? 0, distinctHistoricalTeams: distinctTeams };
  });

export const syncApiFootballLeague = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    leagueId: z.number().int().positive(),
    season: z.number().int().min(2000).max(2100),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const apiKey = process.env.APIFOOTBALL_API_KEY;
    if (!apiKey) throw new Error("APIFOOTBALL_API_KEY no configurada");

    const started = Date.now();
    const errors: string[] = [];
    let totalProcessed = 0;
    let newCount = 0;
    let updatedCount = 0;
    let page = 1;
    let totalPages = 1;
    let rateRemaining: string | null = null;
    let dayRemaining: string | null = null;

    while (page <= totalPages) {
      const url = `https://v3.football.api-sports.io/players?league=${data.leagueId}&season=${data.season}&page=${page}`;
      let json: {
        response?: Array<{
          player: { id: number; name: string; nationality?: string | null; birth?: { date?: string | null } | null };
          statistics?: Array<{ team?: { id: number; name: string; country?: string | null }; games?: { position?: string | null } }>;
        }>;
        paging?: { current: number; total: number };
        errors?: unknown;
      };
      try {
        const res = await fetch(url, {
          headers: {
            "x-rapidapi-key": apiKey,
            "x-rapidapi-host": "v3.football.api-sports.io",
          },
        });
        rateRemaining = res.headers.get("x-ratelimit-remaining");
        dayRemaining = res.headers.get("x-ratelimit-requests-remaining");
        if (!res.ok) {
          errors.push(`Page ${page}: HTTP ${res.status}`);
          break;
        }
        json = await res.json();
      } catch (e) {
        errors.push(`Page ${page}: ${(e as Error).message}`);
        break;
      }

      totalPages = json.paging?.total ?? page;

      for (const item of json.response ?? []) {
        try {
          const player = item.player;
          const stat = item.statistics?.[0];
          const team = stat?.team;
          const posRaw = stat?.games?.position;
          const position = posRaw ? POSITION_MAP[posRaw] : undefined;
          if (!position || !team?.id) continue;

          const birthYear = player.birth?.date ? parseInt(player.birth.date.slice(0, 4), 10) : null;

          await supabaseAdmin.from("teams").upsert(
            { id: team.id, name: team.name, country: team.country ?? "", league_external_id: String(data.leagueId) },
            { onConflict: "id" },
          );

          // Check existence for new/updated counter
          const { data: existing } = await supabaseAdmin
            .from("players").select("id").eq("id", player.id).maybeSingle();

          const { error: upErr } = await supabaseAdmin.from("players").upsert(
            {
              id: player.id,
              name: player.name,
              position,
              team_id: team.id,
              birth_year: birthYear,
              nationality: player.nationality ?? null,
            },
            { onConflict: "id" },
          );
          if (upErr) {
            errors.push(`Player ${player.id}: ${upErr.message}`);
            continue;
          }
          if (existing) updatedCount++; else newCount++;

          await supabaseAdmin.rpc("append_historical_team", {
            p_player_id: player.id,
            p_team_name: team.name,
          });
          totalProcessed++;
        } catch (e) {
          errors.push((e as Error).message);
        }
      }

      page++;
      if (page <= totalPages) await sleep(7000);
    }

    return {
      leagueId: data.leagueId,
      season: data.season,
      newCount,
      updatedCount,
      totalProcessed,
      durationMs: Date.now() - started,
      rateRemaining,
      dayRemaining,
      errors: errors.slice(0, 20),
    };
  });

const LEGENDS: Array<{
  id: number; name: string; position: "GK"|"DF"|"MF"|"FW"; birth_year: number; nationality: string; historical_teams: string[];
}> = [
  {id:9001, name:"Alfredo Di Stéfano", position:"FW", birth_year:1926, nationality:"Argentina", historical_teams:["Real Madrid","River Plate","Espanyol"]},
  {id:9002, name:"Ferenc Puskás", position:"FW", birth_year:1927, nationality:"Hungría", historical_teams:["Real Madrid","Honvéd"]},
  {id:9003, name:"Diego Armando Maradona", position:"MF", birth_year:1960, nationality:"Argentina", historical_teams:["Napoli","FC Barcelona","Boca Juniors","Sevilla FC","Newell's Old Boys"]},
  {id:9004, name:"Johan Cruyff", position:"MF", birth_year:1947, nationality:"Holanda", historical_teams:["FC Barcelona","Ajax","Feyenoord","Los Angeles Aztecs","Washington Diplomats","Levante UD"]},
  {id:9005, name:"Pelé", position:"FW", birth_year:1940, nationality:"Brasil", historical_teams:["Santos","New York Cosmos"]},
  {id:9006, name:"Franz Beckenbauer", position:"DF", birth_year:1945, nationality:"Alemania", historical_teams:["Bayern Munich","Hamburger SV","New York Cosmos"]},
  {id:9007, name:"Michel Platini", position:"MF", birth_year:1955, nationality:"Francia", historical_teams:["Juventus","Saint-Étienne","Nancy"]},
  {id:9008, name:"Eusébio", position:"FW", birth_year:1942, nationality:"Portugal", historical_teams:["Benfica","Boston Minutemen","Toronto Metros-Croatia","Monterrey"]},
  {id:9009, name:"George Best", position:"FW", birth_year:1946, nationality:"Irlanda del Norte", historical_teams:["Manchester United","Fulham","Los Angeles Aztecs"]},
  {id:9010, name:"Bobby Charlton", position:"MF", birth_year:1937, nationality:"Inglaterra", historical_teams:["Manchester United","Preston North End"]},
  {id:9011, name:"Gordon Banks", position:"GK", birth_year:1937, nationality:"Inglaterra", historical_teams:["Leicester City","Stoke City"]},
  {id:9012, name:"Gianni Rivera", position:"MF", birth_year:1943, nationality:"Italia", historical_teams:["AC Milan","Alessandria"]},
  {id:9013, name:"Roberto Baggio", position:"FW", birth_year:1967, nationality:"Italia", historical_teams:["Juventus","AC Milan","Inter","Fiorentina","Bologna","Brescia"]},
  {id:9014, name:"Marco van Basten", position:"FW", birth_year:1964, nationality:"Holanda", historical_teams:["AC Milan","Ajax"]},
  {id:9015, name:"Ruud Gullit", position:"MF", birth_year:1962, nationality:"Holanda", historical_teams:["AC Milan","PSV","Feyenoord","Sampdoria","Chelsea"]},
  {id:9016, name:"Frank Rijkaard", position:"MF", birth_year:1962, nationality:"Holanda", historical_teams:["AC Milan","Ajax","Real Zaragoza"]},
  {id:9017, name:"Lothar Matthäus", position:"MF", birth_year:1961, nationality:"Alemania", historical_teams:["Bayern Munich","Inter","Borussia Mönchengladbach"]},
  {id:9018, name:"Paolo Maldini", position:"DF", birth_year:1968, nationality:"Italia", historical_teams:["AC Milan"]},
  {id:9019, name:"Franco Baresi", position:"DF", birth_year:1960, nationality:"Italia", historical_teams:["AC Milan"]},
  {id:9020, name:"Marcel Desailly", position:"DF", birth_year:1968, nationality:"Francia", historical_teams:["AC Milan","Chelsea","Marseille","Nantes"]},
  {id:9021, name:"Lilian Thuram", position:"DF", birth_year:1972, nationality:"Francia", historical_teams:["Juventus","FC Barcelona","Parma","Monaco"]},
  {id:9022, name:"Fabio Cannavaro", position:"DF", birth_year:1973, nationality:"Italia", historical_teams:["Real Madrid","Juventus","Inter","Parma","Napoli"]},
  {id:9023, name:"Carles Puyol", position:"DF", birth_year:1978, nationality:"España", historical_teams:["FC Barcelona"]},
  {id:9024, name:"Fernando Hierro", position:"DF", birth_year:1968, nationality:"España", historical_teams:["Real Madrid","Real Valladolid","Bolton","Al-Rayyan"]},
  {id:9025, name:"Emilio Butragueño", position:"FW", birth_year:1963, nationality:"España", historical_teams:["Real Madrid","Atlético Celaya"]},
  {id:9026, name:"Manuel Sanchís", position:"DF", birth_year:1965, nationality:"España", historical_teams:["Real Madrid"]},
  {id:9027, name:"Hugo Sánchez", position:"FW", birth_year:1958, nationality:"México", historical_teams:["Real Madrid","Atlético de Madrid","América","Pumas","Rayo Vallecano"]},
  {id:9028, name:"Davor Šuker", position:"FW", birth_year:1968, nationality:"Croacia", historical_teams:["Real Madrid","Arsenal","West Ham","Sevilla FC","1860 Múnich"]},
  {id:9029, name:"Predrag Mijatović", position:"FW", birth_year:1969, nationality:"Montenegro", historical_teams:["Real Madrid","Fiorentina","Levante UD","Valencia CF","Partizan"]},
  {id:9030, name:"Iván Zamorano", position:"FW", birth_year:1967, nationality:"Chile", historical_teams:["Real Madrid","Inter","Sevilla FC","Cobresal","América"]},
  {id:9031, name:"Romário", position:"FW", birth_year:1966, nationality:"Brasil", historical_teams:["FC Barcelona","PSV","Flamengo","Vasco da Gama","Fluminense"]},
  {id:9032, name:"Ronaldo Nazário", position:"FW", birth_year:1976, nationality:"Brasil", historical_teams:["Real Madrid","FC Barcelona","Inter","AC Milan","Corinthians","PSV"]},
  {id:9033, name:"Ronaldinho", position:"MF", birth_year:1980, nationality:"Brasil", historical_teams:["FC Barcelona","AC Milan","Paris Saint-Germain","Grêmio","Atlético Mineiro","Flamengo"]},
  {id:9034, name:"Rivaldo", position:"MF", birth_year:1972, nationality:"Brasil", historical_teams:["FC Barcelona","AC Milan","Olympiacos","Cruzeiro","Palmeiras"]},
  {id:9035, name:"Cafu", position:"DF", birth_year:1970, nationality:"Brasil", historical_teams:["AC Milan","Roma","São Paulo","Palmeiras"]},
  {id:9036, name:"Roberto Carlos", position:"DF", birth_year:1973, nationality:"Brasil", historical_teams:["Real Madrid","Inter","Fenerbahçe","Corinthians","Anzhi"]},
  {id:9037, name:"Zinédine Zidane", position:"MF", birth_year:1972, nationality:"Francia", historical_teams:["Real Madrid","Juventus","Bordeaux","Cannes"]},
  {id:9038, name:"Patrick Vieira", position:"MF", birth_year:1976, nationality:"Francia", historical_teams:["Arsenal","Juventus","Inter","Manchester City"]},
  {id:9039, name:"Thierry Henry", position:"FW", birth_year:1977, nationality:"Francia", historical_teams:["Arsenal","FC Barcelona","Juventus","Monaco","New York Red Bulls"]},
  {id:9040, name:"Dennis Bergkamp", position:"FW", birth_year:1969, nationality:"Holanda", historical_teams:["Arsenal","Ajax","Inter"]},
  {id:9041, name:"Patrick Kluivert", position:"FW", birth_year:1976, nationality:"Holanda", historical_teams:["FC Barcelona","Ajax","AC Milan","Newcastle","Valencia CF","PSV"]},
  {id:9042, name:"Edwin van der Sar", position:"GK", birth_year:1970, nationality:"Holanda", historical_teams:["Manchester United","Ajax","Juventus","Fulham"]},
  {id:9043, name:"Oliver Kahn", position:"GK", birth_year:1969, nationality:"Alemania", historical_teams:["Bayern Munich","Karlsruher SC"]},
  {id:9044, name:"Iker Casillas", position:"GK", birth_year:1981, nationality:"España", historical_teams:["Real Madrid","Porto"]},
  {id:9045, name:"Gianluigi Buffon", position:"GK", birth_year:1978, nationality:"Italia", historical_teams:["Juventus","Parma","Paris Saint-Germain"]},
  {id:9046, name:"Petr Čech", position:"GK", birth_year:1982, nationality:"Rep. Checa", historical_teams:["Chelsea","Arsenal","Rennes","Sparta Praga"]},
  {id:9047, name:"Andoni Zubizarreta", position:"GK", birth_year:1961, nationality:"España", historical_teams:["FC Barcelona","Athletic Club","Valencia CF","Alavés"]},
  {id:9048, name:"Xavi Hernández", position:"MF", birth_year:1980, nationality:"España", historical_teams:["FC Barcelona","Al Sadd"]},
  {id:9049, name:"Andrés Iniesta", position:"MF", birth_year:1984, nationality:"España", historical_teams:["FC Barcelona","Vissel Kobe","Emirates Club"]},
  {id:9050, name:"Sergio Busquets", position:"MF", birth_year:1988, nationality:"España", historical_teams:["FC Barcelona","Inter Miami"]},
  {id:9051, name:"David Silva", position:"MF", birth_year:1986, nationality:"España", historical_teams:["Manchester City","Real Sociedad","Valencia CF"]},
  {id:9052, name:"Cesc Fàbregas", position:"MF", birth_year:1987, nationality:"España", historical_teams:["Arsenal","FC Barcelona","Chelsea","Monaco","Como"]},
  {id:9053, name:"Xabi Alonso", position:"MF", birth_year:1981, nationality:"España", historical_teams:["Real Madrid","Liverpool","Bayern Munich","Real Sociedad"]},
  {id:9054, name:"David Villa", position:"FW", birth_year:1981, nationality:"España", historical_teams:["FC Barcelona","Atlético de Madrid","Valencia CF","Sporting Gijón","New York City FC"]},
  {id:9055, name:"Fernando Torres", position:"FW", birth_year:1984, nationality:"España", historical_teams:["Atlético de Madrid","Liverpool","Chelsea","AC Milan","Sagan Tosu"]},
  {id:9056, name:"Raúl González", position:"FW", birth_year:1977, nationality:"España", historical_teams:["Real Madrid","Schalke 04","Al-Sadd","New York Cosmos"]},
  {id:9057, name:"Guti Hernández", position:"MF", birth_year:1976, nationality:"España", historical_teams:["Real Madrid","Beşiktaş"]},
  {id:9058, name:"Fernando Redondo", position:"MF", birth_year:1969, nationality:"Argentina", historical_teams:["Real Madrid","AC Milan","Tenerife"]},
  {id:9059, name:"Juan Sebastián Verón", position:"MF", birth_year:1975, nationality:"Argentina", historical_teams:["Manchester United","Chelsea","Lazio","Inter","Sampdoria","Parma","Estudiantes","Boca Juniors"]},
  {id:9060, name:"Juan Román Riquelme", position:"MF", birth_year:1978, nationality:"Argentina", historical_teams:["Boca Juniors","FC Barcelona","Villarreal","Argentinos Juniors"]},
  {id:9061, name:"Gabriel Batistuta", position:"FW", birth_year:1969, nationality:"Argentina", historical_teams:["Fiorentina","Roma","Inter","Boca Juniors","River Plate","Al-Arabi"]},
  {id:9062, name:"Hernán Crespo", position:"FW", birth_year:1975, nationality:"Argentina", historical_teams:["Inter","Chelsea","Lazio","Parma","AC Milan","Genoa","River Plate"]},
  {id:9063, name:"Diego Forlán", position:"FW", birth_year:1979, nationality:"Uruguay", historical_teams:["Atlético de Madrid","Manchester United","Villarreal","Inter","Internacional","Cerezo Osaka","Peñarol"]},
  {id:9064, name:"Diego Godín", position:"DF", birth_year:1986, nationality:"Uruguay", historical_teams:["Atlético de Madrid","Inter","Villarreal","Cagliari","Vélez Sarsfield"]},
  {id:9065, name:"Edinson Cavani", position:"FW", birth_year:1987, nationality:"Uruguay", historical_teams:["Paris Saint-Germain","Napoli","Manchester United","Valencia CF","Boca Juniors","Palermo"]},
  {id:9066, name:"Luis Suárez", position:"FW", birth_year:1987, nationality:"Uruguay", historical_teams:["FC Barcelona","Liverpool","Atlético de Madrid","Ajax","Inter Miami","Grêmio","Nacional"]},
  {id:9067, name:"Samuel Eto'o", position:"FW", birth_year:1981, nationality:"Camerún", historical_teams:["FC Barcelona","Inter","Mallorca","Chelsea","Antalyaspor","Anzhi","Sampdoria"]},
  {id:9068, name:"Didier Drogba", position:"FW", birth_year:1978, nationality:"Costa de Marfil", historical_teams:["Chelsea","Marseille","Galatasaray","Shanghai Shenhua","Montreal Impact"]},
  {id:9069, name:"Yaya Touré", position:"MF", birth_year:1983, nationality:"Costa de Marfil", historical_teams:["Manchester City","FC Barcelona","Olympiacos","Monaco"]},
  {id:9070, name:"George Weah", position:"FW", birth_year:1966, nationality:"Liberia", historical_teams:["AC Milan","Paris Saint-Germain","Chelsea","Manchester City","Monaco","Marseille"]},
  {id:9071, name:"Mohamed Salah", position:"FW", birth_year:1992, nationality:"Egipto", historical_teams:["Liverpool","Chelsea","Roma","Fiorentina","Basel"]},
  {id:9072, name:"Sadio Mané", position:"FW", birth_year:1992, nationality:"Senegal", historical_teams:["Bayern Munich","Liverpool","Southampton","Salzburg","Al-Nassr"]},
  {id:9073, name:"Marcelo Vieira", position:"DF", birth_year:1988, nationality:"Brasil", historical_teams:["Real Madrid","Olympiacos","Fluminense"]},
  {id:9074, name:"Dani Alves", position:"DF", birth_year:1983, nationality:"Brasil", historical_teams:["FC Barcelona","Sevilla FC","Juventus","Paris Saint-Germain","São Paulo","Pumas"]},
  {id:9075, name:"Sergio Ramos", position:"DF", birth_year:1986, nationality:"España", historical_teams:["Real Madrid","Sevilla FC","Paris Saint-Germain"]},
  {id:9076, name:"Pepe", position:"DF", birth_year:1983, nationality:"Portugal", historical_teams:["Real Madrid","Porto","Beşiktaş","Marítimo"]},
  {id:9077, name:"Gerard Piqué", position:"DF", birth_year:1987, nationality:"España", historical_teams:["FC Barcelona","Manchester United","Real Zaragoza"]},
  {id:9078, name:"Jordi Alba", position:"DF", birth_year:1989, nationality:"España", historical_teams:["FC Barcelona","Valencia CF","Inter Miami"]},
  {id:9079, name:"Nicolas Anelka", position:"FW", birth_year:1979, nationality:"Francia", historical_teams:["Real Madrid","Arsenal","Chelsea","Paris Saint-Germain","Manchester City","Bolton","Juventus"]},
  {id:9080, name:"Vicente del Bosque", position:"MF", birth_year:1950, nationality:"España", historical_teams:["Real Madrid","Castellón","Castilla"]},
];

export const seedLegends = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    let inserted = 0;
    let skipped = 0;
    for (const legend of LEGENDS) {
      const { data: exists } = await supabaseAdmin.from("players").select("id").eq("id", legend.id).maybeSingle();
      if (exists) { skipped++; continue; }
      const { error } = await supabaseAdmin.from("players").insert({
        id: legend.id,
        name: legend.name,
        position: legend.position,
        birth_year: legend.birth_year,
        nationality: legend.nationality,
        historical_teams: legend.historical_teams,
        team_id: null,
      });
      if (error) { skipped++; continue; }
      inserted++;
    }
    return { inserted, skipped, total: LEGENDS.length };
  });

export const listHistoricalTeams = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data: rows } = await supabaseAdmin
      .from("players").select("historical_teams");
    const counts = new Map<string, number>();
    (rows ?? []).forEach((r) => {
      (r.historical_teams as string[] | null)?.forEach((t) => {
        if (!t) return;
        counts.set(t, (counts.get(t) ?? 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .map(([team_name, player_count]) => ({ team_name, player_count }))
      .sort((a, b) => b.player_count - a.player_count || a.team_name.localeCompare(b.team_name))
      .slice(0, 60);
  });
