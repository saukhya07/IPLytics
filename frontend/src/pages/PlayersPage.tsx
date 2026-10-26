import React, { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  X,
  Activity,
  Zap
} from 'lucide-react';
import { getPlayers, getPlayer } from '../services/api';
import type { PlayerStats } from '../services/api';

const PAGE_SIZE = 12;

export const PlayersPage: React.FC = () => {
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSearch, setActiveSearch] = useState<string>('');

  const [selectedPlayer, setSelectedPlayer] = useState<PlayerStats | null>(null);
  const [loadingPlayers, setLoadingPlayers] = useState<boolean>(true);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [errorPlayers, setErrorPlayers] = useState<string | null>(null);

  const fetchPlayerList = useCallback(() => {
    setLoadingPlayers(true);
    setErrorPlayers(null);

    const offset = (page - 1) * PAGE_SIZE;
    getPlayers({ search: activeSearch || undefined, limit: PAGE_SIZE, offset })
      .then((res) => {
        setPlayers(res.players);
        setTotalCount(res.count);
        setLoadingPlayers(false);
      })
      .catch((err) => {
        setErrorPlayers(err.message || 'Unable to connect to player database.');
        setLoadingPlayers(false);
      });
  }, [page, activeSearch]);

  useEffect(() => {
    fetchPlayerList();
  }, [fetchPlayerList]);

  // Handle Search submit / debounce
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setActiveSearch(searchQuery.trim());
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveSearch('');
    setPage(1);
  };

  const handleSelectPlayer = (playerObj: PlayerStats) => {
    setSelectedPlayer(playerObj);
    setLoadingDetail(true);
    getPlayer(playerObj.player)
      .then((data) => {
        setSelectedPlayer(data);
        setLoadingDetail(false);
      })
      .catch(() => {
        // fallback to original row data if detail fetch fails
        setLoadingDetail(false);
      });
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  return (
    <div className="players-page-container">
      {/* Page Header & Search Bar */}
      <section className="page-header search-header">
        <div>
          <h1>IPL Player Database</h1>
          <p>Explore batting strike rates, bowling economies, boundaries, and career statistics for 730+ IPL players.</p>
        </div>

        <form className="player-search-form" onSubmit={handleSearchSubmit}>
          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              className="search-input"
              placeholder="Search player name (e.g. V Kohli, MS Dhoni, JJ Bumrah)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={handleClearSearch}
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button type="submit" className="btn btn-primary">
            <span>Search</span>
          </button>
        </form>
      </section>

      {/* Main Grid + Detail Modal / Drawer Layout */}
      <section className="players-content-section">
        {/* Header Count & Pagination */}
        <div className="players-meta-bar">
          <span className="results-count">
            {activeSearch ? (
              <>Showing results for "<strong>{activeSearch}</strong>" ({totalCount} players)</>
            ) : (
              <>Showing <strong>{players.length}</strong> of <strong>{totalCount}</strong> IPL Players</>
            )}
          </span>

          {totalPages > 1 && (
            <div className="pagination-controls">
              <button
                className="btn-pagination"
                disabled={page <= 1 || loadingPlayers}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
                <span>Prev</span>
              </button>
              <span className="pagination-text">
                Page {page} of {totalPages}
              </span>
              <button
                className="btn-pagination"
                disabled={page >= totalPages || loadingPlayers}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Players Grid */}
        {loadingPlayers ? (
          <div className="player-cards-grid">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div key={i} className="player-card-skeleton" />
            ))}
          </div>
        ) : errorPlayers ? (
          <div className="state-card error">
            <AlertCircle size={24} />
            <div>
              <h4>Unable to load player database</h4>
              <p>{errorPlayers}</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={fetchPlayerList}>
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        ) : players.length === 0 ? (
          <div className="state-card empty">
            <Users size={32} />
            <h4>No players found</h4>
            <p>No player records matched your search query "{activeSearch}".</p>
            <button className="btn btn-secondary btn-sm" onClick={handleClearSearch}>
              Clear Search
            </button>
          </div>
        ) : (
          <div className="player-cards-grid">
            {players.map((p) => (
              <div
                key={p.player}
                className="player-card"
                onClick={() => handleSelectPlayer(p)}
              >
                <div className="player-card-header">
                  <div className="player-avatar">
                    {p.player
                      .split(' ')
                      .slice(-2)
                      .map((w) => w[0])
                      .join('')}
                  </div>
                  <div className="player-name-container">
                    <h3 className="player-card-name">{p.player}</h3>
                    <span className="player-card-matches">{p.matches} IPL Matches</span>
                  </div>
                </div>

                <div className="player-card-stats">
                  <div className="stat-pill">
                    <span className="stat-pill-label">Runs</span>
                    <span className="stat-pill-val">{p.runs}</span>
                  </div>
                  <div className="stat-pill">
                    <span className="stat-pill-label">Strike Rate</span>
                    <span className="stat-pill-val">{p.strike_rate.toFixed(1)}</span>
                  </div>
                  <div className="stat-pill">
                    <span className="stat-pill-label">Wickets</span>
                    <span className="stat-pill-val">{p.wickets}</span>
                  </div>
                </div>

                <button className="player-card-action">
                  <span>View Career Stats</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Selected Player Detail Modal / Panel */}
      {selectedPlayer && (
        <div className="modal-backdrop" onClick={() => setSelectedPlayer(null)}>
          <div className="modal-content player-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setSelectedPlayer(null)}
            >
              <X size={20} />
            </button>

            <div className="modal-header">
              <div className="modal-avatar">
                {selectedPlayer.player
                  .split(' ')
                  .slice(-2)
                  .map((w) => w[0])
                  .join('')}
              </div>
              <div>
                <h2>{selectedPlayer.player}</h2>
                <span className="modal-subtitle">
                  {selectedPlayer.matches} Matches Played {loadingDetail ? '(Refreshing...)' : ''}
                </span>
              </div>
            </div>

            <div className="modal-body">
              {/* Batting Statistics Section */}
              <div className="stat-section">
                <div className="stat-section-title">
                  <Zap size={16} />
                  <span>Batting Statistics</span>
                </div>
                <div className="modal-stats-grid">
                  <div className="modal-stat-box">
                    <span className="label">Total Runs</span>
                    <span className="val text-gold">{selectedPlayer.runs}</span>
                  </div>
                  <div className="modal-stat-box">
                    <span className="label">Balls Faced</span>
                    <span className="val">{selectedPlayer.balls}</span>
                  </div>
                  <div className="modal-stat-box">
                    <span className="label">Strike Rate</span>
                    <span className="val text-emerald">{selectedPlayer.strike_rate.toFixed(2)}</span>
                  </div>
                  <div className="modal-stat-box">
                    <span className="label">Fours (4s)</span>
                    <span className="val">{selectedPlayer.fours}</span>
                  </div>
                  <div className="modal-stat-box">
                    <span className="label">Sixes (6s)</span>
                    <span className="val">{selectedPlayer.sixes}</span>
                  </div>
                  <div className="modal-stat-box">
                    <span className="label">Fifties (50s)</span>
                    <span className="val">{selectedPlayer.fifties}</span>
                  </div>
                  <div className="modal-stat-box">
                    <span className="label">Hundreds (100s)</span>
                    <span className="val text-emerald">{selectedPlayer.hundreds}</span>
                  </div>
                </div>
              </div>

              {/* Bowling Statistics Section */}
              <div className="stat-section">
                <div className="stat-section-title">
                  <Activity size={16} />
                  <span>Bowling Statistics</span>
                </div>
                <div className="modal-stats-grid">
                  <div className="modal-stat-box">
                    <span className="label">Wickets Taken</span>
                    <span className="val text-emerald">{selectedPlayer.wickets}</span>
                  </div>
                  <div className="modal-stat-box">
                    <span className="label">Balls Bowled</span>
                    <span className="val">{selectedPlayer.balls_bowled}</span>
                  </div>
                  <div className="modal-stat-box">
                    <span className="label">Runs Conceded</span>
                    <span className="val">{selectedPlayer.runs_conceded}</span>
                  </div>
                  <div className="modal-stat-box">
                    <span className="label">Economy Rate</span>
                    <span className="val">{selectedPlayer.economy.toFixed(2)}</span>
                  </div>
                  <div className="modal-stat-box">
                    <span className="label">Bowling Average</span>
                    <span className="val">
                      {selectedPlayer.bowling_average != null
                        ? selectedPlayer.bowling_average.toFixed(2)
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
