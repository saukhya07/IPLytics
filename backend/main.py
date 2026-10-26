"""
IPLytics - FastAPI Main Application
Phase 5B: Unified ML Predictions & Analytics Backend

Exposes:
- GET  /                           : Root API status
- GET  /health                     : Model & Analytics data loading status
- POST /predict/match-winner       : Pre-match winner prediction
- POST /predict/live-win-probability: Live 2nd innings win probability
- POST /predict/score              : In-match 1st innings final score prediction
- POST /predict/player-of-match    : Player of the Match candidate probability
- GET  /teams                      : Standardized IPL teams list
- GET  /teams/{team_name}          : Team statistics
- GET  /players                    : Paginated IPL player statistics
- GET  /players/{player_name}      : Individual player statistics
- GET  /head-to-head/{team1}/{team2}: Order-independent historical head-to-head stats
- GET  /matches                    : Filtered historical match records
- GET  /matches/{match_id}         : Specific match details
- GET  /venues                     : IPL venue statistics list
- GET  /venues/{venue_name}        : Venue statistics
"""

import os
import sys
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

# Ensure project root is in sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from backend.model_loader import load_all_models, get_model_status, is_all_models_loaded
from backend.analytics_service import (
    load_analytics_data, get_teams_list, get_team_details,
    get_players_list, get_player_details, get_head_to_head,
    get_matches_list, get_match_by_id, get_venues_list, get_venue_details
)
from backend.simulator_service import (
    load_simulator_data, get_simulatable_matches,
    start_simulation, step_simulation, reset_simulation
)
from backend.schemas import (
    RootResponse, HealthResponse, ModelStatusSchema,
    MatchWinnerRequest, MatchWinnerResponse,
    LiveWinProbabilityRequest, LiveWinProbabilityResponse,
    ScorePredictionRequest, ScorePredictionResponse,
    PlayerOfMatchRequest, PlayerOfMatchResponse,
    TeamsListResponse, TeamStatsSchema,
    PlayersListResponse, PlayerStatsSchema,
    HeadToHeadResponse, MatchSchema, MatchesListResponse,
    VenueStatsSchema, VenuesListResponse,
    SimulatorMatchesResponse, SimulatorStartResponse,
    SimulatorStepResponse, SimulatorResetResponse
)
from backend.prediction_service import (
    predict_match_winner, predict_live_win_probability,
    predict_score, predict_player_of_match
)

app = FastAPI(
    title="IPLytics API",
    description="IPL Analytics & Machine Learning Platform Backend Engine",
    version="1.0.0"
)

# CORS Configuration for React Frontend
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    """Load ML models, analytics datasets, and simulator data into memory on startup."""
    print("=" * 60)
    print("Initializing IPLytics Backend Engine...")
    load_all_models()
    load_analytics_data()
    load_simulator_data()
    print("Initialization completed.")
    print("=" * 60)


# =========================================================
# SYSTEM & HEALTH ENDPOINTS
# =========================================================

@app.get("/", response_model=RootResponse)
def read_root():
    """Root endpoint returning project status."""
    return RootResponse(project="IPLytics", status="running")


@app.get("/health", response_model=HealthResponse)
def health_check():
    """Health endpoint returning actual model loading status."""
    status_dict = get_model_status()
    all_loaded = is_all_models_loaded()
    
    return HealthResponse(
        status="healthy" if all_loaded else "degraded",
        models_loaded=all_loaded,
        model_status=ModelStatusSchema(**status_dict)
    )


# =========================================================
# PHASE 5A: ML PREDICTION ENDPOINTS
# =========================================================

@app.post("/predict/match-winner", response_model=MatchWinnerResponse)
def api_predict_match_winner(req: MatchWinnerRequest):
    """Predict Match Winner before match start."""
    return predict_match_winner(req)


@app.post("/predict/live-win-probability", response_model=LiveWinProbabilityResponse)
def api_predict_live_win_probability(req: LiveWinProbabilityRequest):
    """Predict Live Win Probability during 2nd innings chase."""
    return predict_live_win_probability(req)


@app.post("/predict/score", response_model=ScorePredictionResponse)
def api_predict_score(req: ScorePredictionRequest):
    """Predict 1st innings final total score."""
    return predict_score(req)


@app.post("/predict/player-of-match", response_model=PlayerOfMatchResponse)
def api_predict_player_of_match(req: PlayerOfMatchRequest):
    """Predict Player of the Match candidate probability (Experimental)."""
    return predict_player_of_match(req)


# =========================================================
# PHASE 5B: ANALYTICS & HISTORICAL DATA ENDPOINTS
# =========================================================

@app.get("/teams", response_model=TeamsListResponse)
def api_get_teams():
    """Return standardized list of IPL teams."""
    teams = get_teams_list()
    return TeamsListResponse(teams=teams)


@app.get("/teams/{team_name}", response_model=TeamStatsSchema)
def api_get_team_details(team_name: str):
    """Return statistics for a specific IPL team."""
    return get_team_details(team_name)


@app.get("/players", response_model=PlayersListResponse)
def api_get_players(
    search: Optional[str] = Query(None, description="Search player name substring"),
    limit: int = Query(100, ge=1, le=500, description="Number of player records to return"),
    offset: int = Query(0, ge=0, description="Offset pagination index")
):
    """Return list of player statistics."""
    result = get_players_list(search=search, limit=limit, offset=offset)
    return PlayersListResponse(count=result['total_count'], players=result['players'])


@app.get("/players/{player_name}", response_model=PlayerStatsSchema)
def api_get_player_details(player_name: str):
    """Return statistics for a specific player."""
    return get_player_details(player_name)


@app.get("/head-to-head/{team1}/{team2}", response_model=HeadToHeadResponse)
def api_get_head_to_head(team1: str, team2: str):
    """Return order-independent historical head-to-head stats between team1 and team2."""
    return get_head_to_head(team1, team2)


@app.get("/matches", response_model=MatchesListResponse)
def api_get_matches(
    season: Optional[str] = Query(None, description="Filter by season (e.g., '2024')"),
    team: Optional[str] = Query(None, description="Filter by team name"),
    venue: Optional[str] = Query(None, description="Filter by venue substring"),
    limit: int = Query(50, ge=1, le=200, description="Maximum matches to return")
):
    """Return filtered historical match records."""
    result = get_matches_list(season=season, team=team, venue=venue, limit=limit)
    return MatchesListResponse(count=result['total_count'], matches=result['matches'])


@app.get("/matches/{match_id}", response_model=MatchSchema)
def api_get_match_details(match_id: int):
    """Return match details for a specific match_id."""
    return get_match_by_id(match_id)


@app.get("/venues", response_model=VenuesListResponse)
def api_get_venues():
    """Return list of IPL venue statistics."""
    venues = get_venues_list()
    return VenuesListResponse(count=len(venues), venues=venues)


@app.get("/venues/{venue_name}", response_model=VenueStatsSchema)
def api_get_venue_details(venue_name: str):
    """Return venue statistics for a specific venue."""
    return get_venue_details(venue_name)


# =========================================================
# PHASE 5C: HISTORICAL MATCH SIMULATOR ENDPOINTS
# =========================================================

@app.get("/simulator/matches", response_model=SimulatorMatchesResponse)
def api_get_simulator_matches(
    limit: int = Query(50, ge=1, le=200, description="Maximum historical simulatable matches to return")
):
    """Return a list of historical matches suitable for 2nd-innings chase simulation."""
    matches = get_simulatable_matches(limit=limit)
    return SimulatorMatchesResponse(count=len(matches), matches=matches)


@app.post("/simulator/start/{match_id}", response_model=SimulatorStartResponse)
def api_start_simulation(match_id: int):
    """Initialize a 2nd-innings chase simulation session for the specified match_id."""
    return start_simulation(match_id)


@app.post("/simulator/{simulation_id}/step", response_model=SimulatorStepResponse)
def api_step_simulation(simulation_id: str):
    """Advance the active match simulation session by EXACTLY ONE delivery."""
    return step_simulation(simulation_id)


@app.post("/simulator/{simulation_id}/reset", response_model=SimulatorResetResponse)
def api_reset_simulation(simulation_id: str):
    """Reset the active simulation session back to the start of the 2nd innings."""
    return reset_simulation(simulation_id)

