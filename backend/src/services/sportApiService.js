const env = require('../config/env');
const logger = require('../config/logger');

// Thin wrapper over external sport data provider. Uses global fetch (Node 18+).
// Implementations are stubbed; real providers plug in here.

async function fetchMatchEvents(match) {
  if (!match.externalId) return [];
  try {
    if (env.SPORT_API_PROVIDER === 'api_football') {
      if (!env.API_FOOTBALL_KEY) return [];
      const res = await fetch(
        `https://v3.football.api-sports.io/fixtures/events?fixture=${match.externalId}`,
        { headers: { 'x-apisports-key': env.API_FOOTBALL_KEY } }
      );
      if (!res.ok) {
        logger.warn({ status: res.status }, 'api-football events fetch failed');
        return [];
      }
      const json = await res.json();
      return normalizeApiFootball(json.response || []);
    }
    if (env.SPORT_API_PROVIDER === 'sportmonks') {
      if (!env.SPORTMONKS_API_KEY) return [];
      const res = await fetch(
        `https://api.sportmonks.com/v3/football/fixtures/${match.externalId}?include=events&api_token=${env.SPORTMONKS_API_KEY}`
      );
      if (!res.ok) return [];
      const json = await res.json();
      return normalizeSportmonks(json?.data?.events || []);
    }
  } catch (err) {
    logger.error({ err }, 'sport API fetch failed');
  }
  return [];
}

async function fetchLiveMatches() {
  try {
    if (env.SPORT_API_PROVIDER === 'api_football') {
      if (!env.API_FOOTBALL_KEY) return [];
      const res = await fetch(
        'https://v3.football.api-sports.io/fixtures?live=all',
        { headers: { 'x-apisports-key': env.API_FOOTBALL_KEY } }
      );
      if (!res.ok) {
        logger.warn({ status: res.status }, 'api-football live matches fetch failed');
        return [];
      }
      const json = await res.json();
      return normalizeApiFootballMatches(json.response || []);
    }
    if (env.SPORT_API_PROVIDER === 'sportmonks') {
      if (!env.SPORTMONKS_API_KEY) return [];
      const res = await fetch(
        `https://api.sportmonks.com/v3/football/fixtures?include=participant;league;events&filters=fixtureStates:inprogress&api_token=${env.SPORTMONKS_API_KEY}`
      );
      if (!res.ok) return [];
      const json = await res.json();
      return normalizeSportmonksMatches(json?.data || []);
    }
  } catch (err) {
    logger.error({ err }, 'live matches fetch failed');
  }
  return [];
}

async function fetchMatchStatistics(fixtureId) {
  try {
    if (env.SPORT_API_PROVIDER === 'api_football') {
      if (!env.API_FOOTBALL_KEY) return null;
      const res = await fetch(
        `https://v3.football.api-sports.io/fixtures/statistics?fixture=${fixtureId}`,
        { headers: { 'x-apisports-key': env.API_FOOTBALL_KEY } }
      );
      if (!res.ok) {
        logger.warn({ status: res.status }, 'api-football statistics fetch failed');
        return null;
      }
      const json = await res.json();
      return normalizeApiFootballStats(json.response || []);
    }
  } catch (err) {
    logger.error({ err }, 'match statistics fetch failed');
  }
  return null;
}

async function fetchMatchLineups(fixtureId) {
  try {
    if (env.SPORT_API_PROVIDER === 'api_football') {
      if (!env.API_FOOTBALL_KEY) return null;
      const res = await fetch(
        `https://v3.football.api-sports.io/fixtures/lineups?fixture=${fixtureId}`,
        { headers: { 'x-apisports-key': env.API_FOOTBALL_KEY } }
      );
      if (!res.ok) {
        logger.warn({ status: res.status }, 'api-football lineups fetch failed');
        return null;
      }
      const json = await res.json();
      return normalizeApiFootballLineups(json.response || []);
    }
  } catch (err) {
    logger.error({ err }, 'match lineups fetch failed');
  }
  return null;
}

async function fetchTeamMatches(teamId, season = 2026, limit = 50) {
  try {
    if (env.SPORT_API_PROVIDER === 'api_football') {
      if (!env.API_FOOTBALL_KEY) return [];
      // Remove 'last' parameter as it's restricted on free plan
      const res = await fetch(
        `https://v3.football.api-sports.io/fixtures?team=${teamId}&season=${season}`,
        { headers: { 'x-apisports-key': env.API_FOOTBALL_KEY } }
      );
      if (!res.ok) {
        logger.warn({ status: res.status, teamId, season }, 'api-football team matches fetch failed');
        return [];
      }
      const json = await res.json();
      return normalizeApiFootballMatches(json.response || []);
    }
    if (env.SPORT_API_PROVIDER === 'sportmonks') {
      if (!env.SPORTMONKS_API_KEY) return [];
      const res = await fetch(
        `https://api.sportmonks.com/v3/football/fixtures?include=participant;league;events&filters=participant:${teamId}&season=${season}&api_token=${env.SPORTMONKS_API_KEY}`
      );
      if (!res.ok) return [];
      const json = await res.json();
      return normalizeSportmonksMatches(json?.data || []);
    }
  } catch (err) {
    logger.error({ err, teamId, season }, 'team matches fetch failed');
  }
  return [];
}

async function fetchTeamLeagues(teamId, season = 2026) {
  try {
    if (env.SPORT_API_PROVIDER === 'api_football') {
      if (!env.API_FOOTBALL_KEY) return [];
      const res = await fetch(
        `https://v3.football.api-sports.io/leagues?team=${teamId}&season=${season}`,
        { headers: { 'x-apisports-key': env.API_FOOTBALL_KEY } }
      );
      if (!res.ok) {
        logger.warn({ status: res.status, teamId, season }, 'api-football team leagues fetch failed');
        return [];
      }
      const json = await res.json();
      return normalizeApiFootballLeagues(json.response || []);
    }
    if (env.SPORT_API_PROVIDER === 'sportmonks') {
      if (!env.SPORTMONKS_API_KEY) return [];
      const res = await fetch(
        `https://api.sportmonks.com/v3/football/seasons/${season}?include=leagues&filters=participant:${teamId}&api_token=${env.SPORTMONKS_API_KEY}`
      );
      if (!res.ok) return [];
      const json = await res.json();
      return normalizeSportmonksLeagues(json?.data?.leagues || []);
    }
  } catch (err) {
    logger.error({ err, teamId, season }, 'team leagues fetch failed');
  }
  return [];
}

async function fetchTeamInformation(teamId) {
  try {
    if (env.SPORT_API_PROVIDER === 'api_football') {
      if (!env.API_FOOTBALL_KEY) return null;
      const res = await fetch(
        `https://v3.football.api-sports.io/teams?id=${teamId}`,
        { headers: { 'x-apisports-key': env.API_FOOTBALL_KEY } }
      );
      if (!res.ok) {
        logger.warn({ status: res.status, teamId }, 'api-football team info fetch failed');
        return null;
      }
      const json = await res.json();
      return normalizeApiFootballTeam(json.response?.[0]?.team || null);
    }
  } catch (err) {
    logger.error({ err, teamId }, 'team information fetch failed');
  }
  return null;
}

async function fetchTeamPlayers(teamId, season = 2024) {
  try {
    if (env.SPORT_API_PROVIDER === 'api_football') {
      if (!env.API_FOOTBALL_KEY) return [];
      const res = await fetch(
        `https://v3.football.api-sports.io/players?team=${teamId}&season=${season}`,
        { headers: { 'x-apisports-key': env.API_FOOTBALL_KEY } }
      );
      if (!res.ok) {
        logger.warn({ status: res.status, teamId, season }, 'api-football team players fetch failed');
        return [];
      }
      const json = await res.json();
      return normalizeApiFootballPlayers(json.response || []);
    }
    if (env.SPORT_API_PROVIDER === 'sportmonks') {
      if (!env.SPORTMONKS_API_KEY) return [];
      const res = await fetch(
        `https://api.sportmonks.com/v3/football/players?include=team&filters=team:${teamId}&season=${season}&api_token=${env.SPORTMONKS_API_KEY}`
      );
      if (!res.ok) return [];
      const json = await res.json();
      return normalizeSportmonksPlayers(json?.data || []);
    }
  } catch (err) {
    logger.error({ err, teamId, season }, 'team players fetch failed');
  }
  return [];
}

async function fetchPlayerStatistics(playerId, season = 2024, leagueId) {
  try {
    if (env.SPORT_API_PROVIDER === 'api_football') {
      if (!env.API_FOOTBALL_KEY) return null;
      let url = `https://v3.football.api-sports.io/players/statistics?id=${playerId}&season=${season}`;
      if (leagueId) url += `&league=${leagueId}`;
      
      const res = await fetch(url, { headers: { 'x-apisports-key': env.API_FOOTBALL_KEY } });
      if (!res.ok) {
        logger.warn({ status: res.status, playerId, season }, 'api-football player statistics fetch failed');
        return null;
      }
      const json = await res.json();
      return normalizeApiFootballPlayerStats(json.response?.[0] || null);
    }
  } catch (err) {
    logger.error({ err, playerId, season }, 'player statistics fetch failed');
  }
  return null;
}

function normalizeApiFootball(list) {
  return list.map((e) => ({
    externalId: `${e.time?.elapsed || 0}-${e.player?.id || ''}-${e.type}-${e.detail}`,
    minute: e.time?.elapsed,
    eventType: mapType(e.type, e.detail),
    externalPlayerId: e.player?.id ? String(e.player.id) : null,
    isOwnGoal: e.detail === 'Own Goal',
    isPenalty: e.detail === 'Penalty',
  }));
}

function normalizeSportmonks(list) {
  return list.map((e) => ({
    externalId: String(e.id),
    minute: e.minute,
    eventType: mapType(e.type?.name || e.type, e.detail || ''),
    externalPlayerId: e.player_id ? String(e.player_id) : null,
    isOwnGoal: (e.detail || '').toLowerCase().includes('own'),
    isPenalty: (e.detail || '').toLowerCase().includes('penalty'),
  }));
}

function normalizeApiFootballMatches(matches) {
  return matches.map((m) => ({
    externalId: String(m.fixture.id),
    homeTeam: m.teams.home.name,
    awayTeam: m.teams.away.name,
    homeScore: m.goals.home,
    awayScore: m.goals.away,
    status: mapFixtureStatus(m.fixture.status.short),
    minute: m.fixture.status.elapsed,
    league: m.league.name,
    leagueId: String(m.league.id),
    date: new Date(m.fixture.date),
    venue: m.fixture.venue?.name,
  }));
}

function normalizeSportmonksMatches(matches) {
  return matches.map((m) => ({
    externalId: String(m.id),
    homeTeam: m.participants?.find(p => p.meta?.location === 'home')?.name || '',
    awayTeam: m.participants?.find(p => p.meta?.location === 'away')?.name || '',
    homeScore: m.scores?.home || 0,
    awayScore: m.scores?.away || 0,
    status: mapFixtureStatus(m.state),
    minute: m.minute,
    league: m.league?.name,
    leagueId: String(m.league?.id || ''),
    date: new Date(m.starting_at),
    venue: m.venue?.name,
  }));
}

function normalizeApiFootballStats(stats) {
  if (!stats || !Array.isArray(stats)) return null;
  
  const result = {};
  stats.forEach((team) => {
    const teamName = team.team.name === 'Home' ? 'home' : 'away';
    result[teamName] = team.statistics.reduce((acc, stat) => {
      acc[stat.type.toLowerCase().replace(/\s+/g, '_')] = stat.value;
      return acc;
    }, {});
  });
  return result;
}

function normalizeApiFootballLineups(lineups) {
  if (!lineups || !Array.isArray(lineups)) return null;
  
  return lineups.map((lineup) => ({
    team: lineup.team.name,
    formation: lineup.formation,
    startXI: lineup.startXI?.map((player) => ({
      externalId: String(player.player.id),
      name: player.player.name,
      position: player.player.pos,
      number: player.player.number,
    })) || [],
    substitutes: lineup.substitutes?.map((player) => ({
      externalId: String(player.player.id),
      name: player.player.name,
      position: player.player.pos,
      number: player.player.number,
    })) || [],
  }));
}

function normalizeApiFootballLeagues(leagues) {
  return leagues.map((league) => ({
    externalId: String(league.league.id),
    name: league.league.name,
    season: league.seasons?.[0]?.year || 2024,
    country: league.country.name,
    flag: league.country.flag,
    logo: league.league.logo,
    type: league.league.type,
    start: league.seasons?.[0]?.start,
    end: league.seasons?.[0]?.end,
  }));
}

function normalizeApiFootballTeam(team) {
  if (!team) return null;
  
  return {
    externalId: String(team.id),
    name: team.name,
    country: team.country?.name || 'Unknown',
    logo: team.logo,
    founded: team.founded,
    national: team.national,
  };
}

function normalizeSportmonksLeagues(leagues) {
  return leagues.map((league) => ({
    externalId: String(league.id),
    name: league.name,
    season: league.current_season_id || 2024,
    country: league.country?.name || '',
    flag: league.image_path || '',
    logo: league.logo_path || '',
    type: league.type || 'league',
    start: league.current_season?.start_date,
    end: league.current_season?.end_date,
  }));
}

function normalizeApiFootballPlayers(players) {
  return players.map((player) => {
    // Get position and jersey number from statistics
    const stats = player.statistics && player.statistics[0];
    const position = stats?.games?.position;
    const jerseyNumber = stats?.games?.number;
    
    return {
      externalId: String(player.player.id),
      nameEn: player.player.name,
      nameAr: null, // API-Football doesn't provide Arabic names on free plan
      position: mapPosition(position),
      jerseyNumber: jerseyNumber || null,
      photoUrl: player.player.photo,
      age: player.player.age,
      height: player.player.height,
      weight: player.player.weight,
      nationality: player.player.nationality,
      injured: player.player.injured || false,
    };
  });
}

function normalizeSportmonksPlayers(players) {
  return players.map((player) => ({
    externalId: String(player.id),
    nameEn: player.display_name || player.name,
    nameAr: player.name_ar || null,
    position: mapPosition(player.position?.name || player.position),
    jerseyNumber: player.jersey_number || null,
    photoUrl: player.image_path,
    age: player.age,
    height: player.height,
    weight: player.weight,
    nationality: player.nationality?.name || null,
    injured: player.injured || false,
  }));
}

function normalizeApiFootballPlayerStats(stats) {
  if (!stats) return null;
  
  return {
    externalId: String(stats.player.id),
    season: stats.league.season,
    league: stats.league.name,
    leagueId: stats.league.id,
    team: stats.team.name,
    teamId: stats.team.id,
    appearances: stats.games?.appearences || 0,
    minutes: stats.games?.minutes || 0,
    goals: stats.goals?.total || 0,
    assists: stats.goals?.assists || 0,
    yellowCards: stats.cards?.yellow || 0,
    redCards: stats.cards?.red || 0,
    cleanSheets: stats.goals?.conceded && stats.goals.conceded === 0 ? 1 : 0,
  };
}

function mapPosition(position) {
  if (!position) return 'MID';
  
  const pos = String(position).toLowerCase();
  if (pos.includes('goalkeeper') || pos === 'gk') return 'GK';
  if (pos.includes('defender') || pos.includes('back') || pos === 'def') return 'DEF';
  if (pos.includes('midfielder') || pos.includes('mid') || pos === 'mid') return 'MID';
  if (pos.includes('forward') || pos.includes('attacker') || pos === 'fwd') return 'FWD';
  
  // Fallback for common abbreviations
  if (pos === 'd') return 'DEF';
  if (pos === 'm') return 'MID';
  if (pos === 'a' || pos === 's') return 'FWD';
  
  return 'MID'; // Default to midfielder
}

function mapFixtureStatus(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'ns' || s === 'ns' || s === 'not started') return 'scheduled';
  if (s === '1h' || s === '2h' || s === 'ht' || s === 'live' || s === 'inprogress') return 'live';
  if (s === 'ft' || s === 'finished' || s === 'complete') return 'finished';
  if (s === 'aet' || s === 'p' || s === 'postponed') return 'postponed';
  if (s === 'canc' || s === 'cancelled') return 'cancelled';
  return 'unknown';
}

function mapType(type, detail) {
  const t = String(type || '').toLowerCase();
  const d = String(detail || '').toLowerCase();
  if (t.includes('goal') && d.includes('own')) return 'own_goal';
  if (t.includes('goal')) return 'goal';
  if (t.includes('card') && d.includes('red')) return 'red_card';
  if (t.includes('card') && d.includes('yellow')) return 'yellow_card';
  if (t.includes('subst')) return 'substitution';
  if (t.includes('assist')) return 'assist';
  return 'goal';
}

module.exports = { 
  fetchMatchEvents, 
  fetchLiveMatches, 
  fetchMatchStatistics, 
  fetchMatchLineups,
  fetchTeamMatches,
  fetchTeamLeagues,
  fetchTeamInformation,
  fetchTeamPlayers,
  fetchPlayerStatistics
};
