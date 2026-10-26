/**
 * IPLytics API Client Service
 * Centralized API service layer connecting the React frontend to FastAPI backend engine.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// =========================================================
// TYPES & INTERFACES
// =========================================================

export interface HealthResponse {
  status: string;
  models_loaded: boolean;
  model_status: {
    match_winner: boolean;
    live_win_probability: boolean;
    score_prediction: boolean;
    player_of_match: boolean;
  };
}

export interface TeamsListResponse {
  teams: string[];
}

export interface TeamStats {
  team: string;
  matches: number;
  wins: number;
  losses: number;
  ties: number;
  no_results: number;
  win_percentage: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
}

export interface PlayerStats {
  player: string;
  matches: number;
  runs: number;
  balls: number;
  strike_rate: number;
  fours: number;
  sixes: number;
  fifties: number;
  hundreds: number;
  wickets: number;
  balls_bowled: number;
  runs_conceded: number;
  economy: number;
  bowling_average?: number | null;
}

export interface PlayersListResponse {
  count: number;
  players: PlayerStats[];
}

export interface RecentMeeting {
  date: string;
  venue: string;
  winner?: string | null;
  result: string;
  result_margin?: number | null;
}

export interface HeadToHeadResponse {
  team1: string;
  team2: string;
  total_matches: number;
  team1_wins: number;
  team2_wins: number;
  ties: number;
  no_result: number;
  team1_win_percentage: number;
  team2_win_percentage: number;
  recent_meetings: RecentMeeting[];
}

export interface MatchSchema {
  id: number;
  season: string;
  city?: string | null;
  date: string;
  match_type: string;
  player_of_match?: string | null;
  venue: string;
  team1: string;
  team2: string;
  toss_winner: string;
  toss_decision: string;
  winner?: string | null;
  result: string;
  result_margin?: number | null;
  target_runs?: number | null;
  target_overs?: number | null;
  super_over: string;
  method?: string | null;
  umpire1?: string | null;
  umpire2?: string | null;
}

export interface MatchesListResponse {
  count: number;
  matches: MatchSchema[];
}

export interface VenueStats {
  venue: string;
  matches: number;
  average_first_innings_score: number;
  average_second_innings_score: number;
  highest_score: number;
  bat_first_wins: number;
  chasing_wins: number;
  bat_first_win_percentage: number;
  chasing_win_percentage: number;
}

export interface VenuesListResponse {
  count: number;
  venues: VenueStats[];
}

export interface MatchWinnerRequest {
  team1: string;
  team2: string;
  venue: string;
  city: string;
  toss_winner: string;
  toss_decision: string;
  team1_historical_win_rate: number;
  team2_historical_win_rate: number;
  team1_recent_form_5: number;
  team2_recent_form_5: number;
  h2h_team1_wins: number;
  h2h_team2_wins: number;
  h2h_total_matches: number;
  h2h_team1_win_rate: number;
  team1_venue_win_rate: number;
  team2_venue_win_rate: number;
  venue_avg_first_innings_score_historical: number;
}

export interface MatchWinnerResponse {
  team1: string;
  team2: string;
  predicted_winner: string;
  probabilities: Record<string, number>;
}

export interface LiveWinProbabilityRequest {
  batting_team: string;
  bowling_team: string;
  venue: string;
  city: string;
  current_score: number;
  wickets_fallen: number;
  legal_balls_bowled: number;
  target: number;
  runs_last_6_balls: number;
  runs_last_30_balls: number;
  wickets_last_30_balls: number;
  boundaries_so_far: number;
  partnership_runs: number;
}

export interface LiveWinProbabilityResponse {
  batting_team: string;
  bowling_team: string;
  batting_team_win_probability: number;
  bowling_team_win_probability: number;
}

export interface ScorePredictionRequest {
  batting_team: string;
  bowling_team: string;
  venue: string;
  city: string;
  current_score: number;
  wickets_fallen: number;
  legal_balls_bowled: number;
  runs_last_6_balls: number;
  runs_last_30_balls: number;
  wickets_last_30_balls: number;
  boundaries_so_far: number;
  partnership_runs: number;
}

export interface ScorePredictionResponse {
  batting_team: string;
  bowling_team: string;
  predicted_final_score: number;
}

export interface PlayerOfMatchRequest {
  player: string;
  hist_runs: number;
  hist_balls_faced: number;
  hist_strike_rate: number;
  hist_wickets: number;
  hist_balls_bowled: number;
  hist_runs_conceded: number;
  hist_economy: number;
  hist_pom_count: number;
  recent_avg_runs_5: number;
  recent_avg_wickets_5: number;
}

export interface PlayerOfMatchResponse {
  predicted_player: string;
  is_player_of_match_predicted: number;
  probability: number;
  note: string;
}

export interface SimulatorMatch {
  match_id: number;
  season: string;
  date: string;
  venue: string;
  city?: string | null;
  team1: string;
  team2: string;
  winner: string;
  target_runs: number;
}

export interface SimulatorMatchesResponse {
  count: number;
  matches: SimulatorMatch[];
}

export interface SimulatorStartResponse {
  simulation_id: string;
  match_id: number;
  season: string;
  venue: string;
  city?: string | null;
  batting_team: string;
  bowling_team: string;
  target: number;
  current_score: number;
  wickets_fallen: number;
  balls_completed: number;
  balls_remaining: number;
  current_run_rate: number;
  required_run_rate: number;
  batting_team_win_probability: number;
  bowling_team_win_probability: number;
  simulation_started: boolean;
  match_finished: boolean;
}

export interface SimulatorStepResponse {
  simulation_id: string;
  match_id: number;
  delivery_number?: number | null;
  over?: number | null;
  ball?: number | null;
  over_display?: string | null;
  batter?: string | null;
  bowler?: string | null;
  runs_off_bat?: number | null;
  extra_runs?: number | null;
  extras_type?: string | null;
  total_runs?: number | null;
  is_wicket?: boolean | null;
  player_dismissed?: string | null;
  dismissal_kind?: string | null;
  current_score?: number | null;
  wickets_fallen?: number | null;
  overs_completed?: number | null;
  balls_remaining?: number | null;
  target?: number | null;
  runs_required?: number | null;
  current_run_rate?: number | null;
  required_run_rate?: number | null;
  batting_team_win_probability: number;
  bowling_team_win_probability: number;
  match_finished: boolean;
  actual_winner?: string | null;
  actual_result?: string | null;
  final_score?: string | null;
  message?: string | null;
}

export interface SimulatorResetResponse {
  simulation_id: string;
  match_id: number;
  status: string;
  current_score: number;
  wickets_fallen: number;
  balls_remaining: number;
  batting_team_win_probability: number;
  bowling_team_win_probability: number;
  match_finished: boolean;
}

// =========================================================
// HELPER FETCH FUNCTION
// =========================================================

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // fallback
    }
    throw new Error(`API Error [${response.status}]: ${errorDetail}`);
  }

  return response.json() as Promise<T>;
}

// =========================================================
// API SERVICE FUNCTIONS
// =========================================================

/** Health Check */
export async function getHealth(): Promise<HealthResponse> {
  return fetchJson<HealthResponse>('/health');
}

/** Teams API */
export async function getTeams(): Promise<TeamsListResponse> {
  return fetchJson<TeamsListResponse>('/teams');
}

export async function getTeam(teamName: string): Promise<TeamStats> {
  return fetchJson<TeamStats>(`/teams/${encodeURIComponent(teamName)}`);
}

/** Players API */
export async function getPlayers(params?: { search?: string; limit?: number; offset?: number }): Promise<PlayersListResponse> {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.offset) query.append('offset', params.offset.toString());
  
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return fetchJson<PlayersListResponse>(`/players${queryString}`);
}

export async function getPlayer(playerName: string): Promise<PlayerStats> {
  return fetchJson<PlayerStats>(`/players/${encodeURIComponent(playerName)}`);
}

/** Head to Head API */
export async function getHeadToHead(team1: string, team2: string): Promise<HeadToHeadResponse> {
  return fetchJson<HeadToHeadResponse>(`/head-to-head/${encodeURIComponent(team1)}/${encodeURIComponent(team2)}`);
}

/** Matches API */
export async function getMatches(params?: { season?: string; team?: string; venue?: string; limit?: number }): Promise<MatchesListResponse> {
  const query = new URLSearchParams();
  if (params?.season) query.append('season', params.season);
  if (params?.team) query.append('team', params.team);
  if (params?.venue) query.append('venue', params.venue);
  if (params?.limit) query.append('limit', params.limit.toString());

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return fetchJson<MatchesListResponse>(`/matches${queryString}`);
}

export async function getMatch(matchId: number): Promise<MatchSchema> {
  return fetchJson<MatchSchema>(`/matches/${matchId}`);
}

/** Venues API */
export async function getVenues(): Promise<VenuesListResponse> {
  return fetchJson<VenuesListResponse>('/venues');
}

export async function getVenue(venueName: string): Promise<VenueStats> {
  return fetchJson<VenueStats>(`/venues/${encodeURIComponent(venueName)}`);
}

/** Prediction ML APIs */
export async function predictMatchWinner(data: MatchWinnerRequest): Promise<MatchWinnerResponse> {
  return fetchJson<MatchWinnerResponse>('/predict/match-winner', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function predictLiveWinProbability(data: LiveWinProbabilityRequest): Promise<LiveWinProbabilityResponse> {
  return fetchJson<LiveWinProbabilityResponse>('/predict/live-win-probability', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function predictScore(data: ScorePredictionRequest): Promise<ScorePredictionResponse> {
  return fetchJson<ScorePredictionResponse>('/predict/score', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function predictPlayerOfMatch(data: PlayerOfMatchRequest): Promise<PlayerOfMatchResponse> {
  return fetchJson<PlayerOfMatchResponse>('/predict/player-of-match', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Historical Simulator APIs */
export async function getSimulatorMatches(limit: number = 50): Promise<SimulatorMatchesResponse> {
  return fetchJson<SimulatorMatchesResponse>(`/simulator/matches?limit=${limit}`);
}

export async function startSimulation(matchId: number): Promise<SimulatorStartResponse> {
  return fetchJson<SimulatorStartResponse>(`/simulator/start/${matchId}`, {
    method: 'POST',
  });
}

export async function stepSimulation(simulationId: string): Promise<SimulatorStepResponse> {
  return fetchJson<SimulatorStepResponse>(`/simulator/${simulationId}/step`, {
    method: 'POST',
  });
}

export async function resetSimulation(simulationId: string): Promise<SimulatorResetResponse> {
  return fetchJson<SimulatorResetResponse>(`/simulator/${simulationId}/reset`, {
    method: 'POST',
  });
}
