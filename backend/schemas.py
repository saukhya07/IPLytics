"""
IPLytics - Pydantic Schemas Module
Phase 5C: Extended API Schemas with Simulator Support

Defines Pydantic models for:
- System & Health endpoints
- ML Prediction endpoints (Tasks 1-4)
- Analytics & Data endpoints (Teams, Players, H2H, Matches, Venues)
- Historical Match Simulator endpoints
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional


# =========================================================
# SYSTEM & HEALTH SCHEMAS
# =========================================================

class RootResponse(BaseModel):
    project: str = "IPLytics"
    status: str = "running"


class ModelStatusSchema(BaseModel):
    match_winner: bool
    live_win_probability: bool
    score_prediction: bool
    player_of_match: bool


class HealthResponse(BaseModel):
    status: str
    models_loaded: bool
    model_status: ModelStatusSchema


# =========================================================
# ML PREDICTION SCHEMAS
# =========================================================

class MatchWinnerRequest(BaseModel):
    team1: str = Field(..., example="Chennai Super Kings")
    team2: str = Field(..., example="Mumbai Indians")
    venue: str = Field(..., example="MA Chidambaram Stadium, Chepauk")
    city: str = Field(..., example="Chennai")
    toss_winner: str = Field(..., example="Chennai Super Kings")
    toss_decision: str = Field(..., example="field")
    team1_historical_win_rate: float = Field(0.584, ge=0.0, le=1.0)
    team2_historical_win_rate: float = Field(0.558, ge=0.0, le=1.0)
    team1_recent_form_5: float = Field(0.600, ge=0.0, le=1.0)
    team2_recent_form_5: float = Field(0.400, ge=0.0, le=1.0)
    h2h_team1_wins: int = Field(15, ge=0)
    h2h_team2_wins: int = Field(20, ge=0)
    h2h_total_matches: int = Field(35, ge=0)
    h2h_team1_win_rate: float = Field(0.428, ge=0.0, le=1.0)
    team1_venue_win_rate: float = Field(0.650, ge=0.0, le=1.0)
    team2_venue_win_rate: float = Field(0.450, ge=0.0, le=1.0)
    venue_avg_first_innings_score_historical: float = Field(165.0, ge=50.0, le=300.0)


class MatchWinnerResponse(BaseModel):
    team1: str
    team2: str
    predicted_winner: str
    probabilities: Dict[str, float]


class LiveWinProbabilityRequest(BaseModel):
    batting_team: str = Field(..., example="Chennai Super Kings")
    bowling_team: str = Field(..., example="Mumbai Indians")
    venue: str = Field(..., example="Wankhede Stadium")
    city: str = Field(..., example="Mumbai")
    current_score: int = Field(..., ge=0, le=300, example=140)
    wickets_fallen: int = Field(..., ge=0, le=10, example=3)
    legal_balls_bowled: int = Field(..., ge=0, le=120, example=90)
    target: float = Field(..., ge=1.0, le=300.0, example=180.0)
    runs_last_6_balls: int = Field(10, ge=0, le=36)
    runs_last_30_balls: int = Field(45, ge=0, le=180)
    wickets_last_30_balls: int = Field(1, ge=0, le=10)
    boundaries_so_far: int = Field(12, ge=0)
    partnership_runs: int = Field(35, ge=0)


class LiveWinProbabilityResponse(BaseModel):
    batting_team: str
    bowling_team: str
    batting_team_win_probability: float
    bowling_team_win_probability: float


class ScorePredictionRequest(BaseModel):
    batting_team: str = Field(..., example="Mumbai Indians")
    bowling_team: str = Field(..., example="Sunrisers Hyderabad")
    venue: str = Field(..., example="Wankhede Stadium")
    city: str = Field(..., example="Mumbai")
    current_score: int = Field(..., ge=0, le=300, example=120)
    wickets_fallen: int = Field(..., ge=0, le=10, example=2)
    legal_balls_bowled: int = Field(..., ge=0, le=120, example=80)
    runs_last_6_balls: int = Field(8, ge=0, le=36)
    runs_last_30_balls: int = Field(40, ge=0, le=180)
    wickets_last_30_balls: int = Field(1, ge=0, le=10)
    boundaries_so_far: int = Field(10, ge=0)
    partnership_runs: int = Field(25, ge=0)


class ScorePredictionResponse(BaseModel):
    batting_team: str
    bowling_team: str
    predicted_final_score: float


class PlayerOfMatchRequest(BaseModel):
    player: str = Field(..., example="V Kohli")
    hist_runs: int = Field(8000, ge=0)
    hist_balls_faced: int = Field(6000, ge=0)
    hist_strike_rate: float = Field(132.0, ge=0.0)
    hist_wickets: int = Field(4, ge=0)
    hist_balls_bowled: int = Field(150, ge=0)
    hist_runs_conceded: int = Field(200, ge=0)
    hist_economy: float = Field(8.0, ge=0.0)
    hist_pom_count: int = Field(18, ge=0)
    recent_avg_runs_5: float = Field(45.0, ge=0.0)
    recent_avg_wickets_5: float = Field(0.0, ge=0.0)


class PlayerOfMatchResponse(BaseModel):
    predicted_player: str
    is_player_of_match_predicted: int
    probability: float
    note: str = "Experimental model trained under severe class imbalance (~4.6% positive target)."


# =========================================================
# ANALYTICS & HISTORICAL DATA SCHEMAS
# =========================================================

class TeamsListResponse(BaseModel):
    teams: List[str]


class TeamStatsSchema(BaseModel):
    team: str
    matches: int
    wins: int
    losses: int
    ties: int
    no_results: int
    win_percentage: float
    average_score: float
    highest_score: int
    lowest_score: int


class PlayerStatsSchema(BaseModel):
    player: str
    matches: int
    runs: int
    balls: int
    strike_rate: float
    fours: int
    sixes: int
    fifties: int
    hundreds: int
    wickets: int
    balls_bowled: int
    runs_conceded: int
    economy: float
    bowling_average: Optional[float] = None


class PlayersListResponse(BaseModel):
    count: int
    players: List[PlayerStatsSchema]


class RecentMeeting(BaseModel):
    date: str
    venue: str
    winner: Optional[str] = None
    result: str
    result_margin: Optional[float] = None


class HeadToHeadResponse(BaseModel):
    team1: str
    team2: str
    total_matches: int
    team1_wins: int
    team2_wins: int
    ties: int
    no_result: int
    team1_win_percentage: float
    team2_win_percentage: float
    recent_meetings: List[RecentMeeting] = []


class MatchSchema(BaseModel):
    id: int
    season: str
    city: Optional[str] = None
    date: str
    match_type: str
    player_of_match: Optional[str] = None
    venue: str
    team1: str
    team2: str
    toss_winner: str
    toss_decision: str
    winner: Optional[str] = None
    result: str
    result_margin: Optional[float] = None
    target_runs: Optional[float] = None
    target_overs: Optional[float] = None
    super_over: str
    method: Optional[str] = None
    umpire1: Optional[str] = None
    umpire2: Optional[str] = None


class MatchesListResponse(BaseModel):
    count: int
    matches: List[MatchSchema]


class VenueStatsSchema(BaseModel):
    venue: str
    matches: int
    average_first_innings_score: float
    average_second_innings_score: float
    highest_score: int
    bat_first_wins: int
    chasing_wins: int
    bat_first_win_percentage: float
    chasing_win_percentage: float


class VenuesListResponse(BaseModel):
    count: int
    venues: List[VenueStatsSchema]


# =========================================================
# HISTORICAL MATCH SIMULATOR SCHEMAS
# =========================================================

class SimulatorMatchSchema(BaseModel):
    match_id: int
    season: str
    date: str
    venue: str
    city: Optional[str] = None
    team1: str
    team2: str
    winner: str
    target_runs: int


class SimulatorMatchesResponse(BaseModel):
    count: int
    matches: List[SimulatorMatchSchema]


class SimulatorStartResponse(BaseModel):
    simulation_id: str
    match_id: int
    season: str
    venue: str
    city: Optional[str] = None
    batting_team: str
    bowling_team: str
    target: int
    current_score: int
    wickets_fallen: int
    balls_completed: int
    balls_remaining: int
    current_run_rate: float
    required_run_rate: float
    batting_team_win_probability: float
    bowling_team_win_probability: float
    simulation_started: bool
    match_finished: bool


class SimulatorStepResponse(BaseModel):
    simulation_id: str
    match_id: int
    delivery_number: Optional[int] = None
    over: Optional[int] = None
    ball: Optional[int] = None
    over_display: Optional[str] = None
    batter: Optional[str] = None
    bowler: Optional[str] = None
    runs_off_bat: Optional[int] = None
    extra_runs: Optional[int] = None
    extras_type: Optional[str] = None
    total_runs: Optional[int] = None
    is_wicket: Optional[bool] = None
    player_dismissed: Optional[str] = None
    dismissal_kind: Optional[str] = None
    current_score: Optional[int] = None
    wickets_fallen: Optional[int] = None
    overs_completed: Optional[float] = None
    balls_remaining: Optional[int] = None
    target: Optional[int] = None
    runs_required: Optional[int] = None
    current_run_rate: Optional[float] = None
    required_run_rate: Optional[float] = None
    batting_team_win_probability: float
    bowling_team_win_probability: float
    match_finished: bool
    actual_winner: Optional[str] = None
    actual_result: Optional[str] = None
    final_score: Optional[str] = None
    message: Optional[str] = None


class SimulatorResetResponse(BaseModel):
    simulation_id: str
    match_id: int
    status: str
    current_score: int
    wickets_fallen: int
    balls_remaining: int
    batting_team_win_probability: float
    bowling_team_win_probability: float
    match_finished: bool
