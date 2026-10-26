import React, { useEffect, useState, useCallback } from 'react';
import {
  Calendar,
  Search,
  Filter,
  RotateCcw,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Award,
  Trophy
} from 'lucide-react';
import { getMatches, getTeams } from '../services/api';
import type { MatchSchema } from '../services/api';

interface MatchesPageProps {
  onNavigate?: (path: string) => void;
}

const SEASONS = [
  '2024', '2023', '2022', '2021', '2020', '2019', '2018',
  '2017', '2016', '2015', '2014', '2013', '2012', '2011',
  '2010', '2009', '2008'
];

const PAGE_SIZE = 15;

export const MatchesPage: React.FC<MatchesPageProps> = () => {
  const [matches, setMatches] = useState<MatchSchema[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [teams, setTeams] = useState<string[]>([]);

  // Filter states
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [venueSearch, setVenueSearch] = useState<string>('');
  const [activeVenue, setActiveVenue] = useState<string>('');

  // Pagination & Loading
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load team list for filter dropdown
  useEffect(() => {
    getTeams()
      .then((res) => setTeams(res.teams))
      .catch(() => setTeams([]));
  }, []);

  // Fetch matches from FastAPI backend
  const fetchMatchesData = useCallback(() => {
    setLoading(true);
    setError(null);

    getMatches({
      season: selectedSeason || undefined,
      team: selectedTeam || undefined,
      venue: activeVenue || undefined,
      limit: 200,
    })
      .then((res) => {
        setMatches(res.matches);
        setTotalCount(res.count);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Unable to connect to IPLytics matches API.');
        setLoading(false);
      });
  }, [selectedSeason, selectedTeam, activeVenue]);

  useEffect(() => {
    fetchMatchesData();
  }, [fetchMatchesData]);

  // Handle venue search submit
  const handleVenueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setActiveVenue(venueSearch.trim());
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedSeason('');
    setSelectedTeam('');
    setVenueSearch('');
    setActiveVenue('');
    setCurrentPage(1);
  };

  // Pagination logic (client-side slicing over the filtered dataset)
  const totalPages = Math.ceil(matches.length / PAGE_SIZE) || 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedMatches = matches.slice(startIndex, startIndex + PAGE_SIZE);

  const formatResultMargin = (match: MatchSchema) => {
    if (!match.winner) {
      return match.result || 'No Result';
    }
    if (match.result === 'runs' && match.result_margin) {
      return `by ${match.result_margin} runs`;
    }
    if (match.result === 'wickets' && match.result_margin) {
      return `by ${match.result_margin} wkts`;
    }
    if (match.result === 'tie') {
      return 'Super Over';
    }
    return '';
  };

  return (
    <div className="predict-page-container">
      {/* Page Header */}
      <section className="page-header search-header">
        <div>
          <h1>Historical Matches Archive</h1>
          <p>Verified ball-by-ball match results, scores, toss decisions, and Player of the Match awards across 17 IPL seasons.</p>
        </div>
      </section>

      {/* Filter Toolbar Card */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', flex: 1 }}>
            {/* Season Select */}
            <div className="form-group" style={{ minWidth: 140 }}>
              <label htmlFor="filter-season" style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                <Calendar size={13} /> Season
              </label>
              <select
                id="filter-season"
                className="custom-select"
                value={selectedSeason}
                onChange={(e) => {
                  setSelectedSeason(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Seasons (2008–2024)</option>
                {SEASONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Team Select */}
            <div className="form-group" style={{ minWidth: 180 }}>
              <label htmlFor="filter-team" style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                <Filter size={13} /> Team
              </label>
              <select
                id="filter-team"
                className="custom-select"
                value={selectedTeam}
                onChange={(e) => {
                  setSelectedTeam(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Teams</option>
                {teams.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Venue Search Form */}
            <form onSubmit={handleVenueSubmit} className="form-group" style={{ minWidth: 200, flex: 1 }}>
              <label htmlFor="filter-venue" style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                <Search size={13} /> Venue / City
              </label>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <input
                  id="filter-venue"
                  type="text"
                  className="custom-input"
                  placeholder="e.g. Wankhede, Eden, Chennai..."
                  value={venueSearch}
                  onChange={(e) => setVenueSearch(e.target.value)}
                />
                <button type="submit" className="btn btn-secondary btn-sm" style={{ padding: '0 .8rem' }}>
                  Filter
                </button>
              </div>
            </form>
          </div>

          {/* Reset Filters */}
          {(selectedSeason || selectedTeam || activeVenue) && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleResetFilters}
              style={{ alignSelf: 'flex-end', height: 38 }}
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Meta Bar & Pagination */}
      <div className="players-meta-bar">
        <span className="results-count">
          Showing <strong>{matches.length > 0 ? startIndex + 1 : 0}–{Math.min(startIndex + PAGE_SIZE, matches.length)}</strong> of <strong>{matches.length}</strong> loaded matches
          {totalCount > matches.length ? ` (${totalCount} total in dataset)` : ''}
          {selectedSeason ? ` · Season ${selectedSeason}` : ''}
          {selectedTeam ? ` · ${selectedTeam}` : ''}
        </span>

        {totalPages > 1 && (
          <div className="pagination-controls">
            <button
              className="btn-pagination"
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} />
              <span>Prev</span>
            </button>
            <span className="pagination-text">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="btn-pagination"
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Content Table / States */}
      {loading ? (
        <div className="table-loading-card">
          <div className="loading-spinner" />
          <span>Loading historical match records from API...</span>
        </div>
      ) : error ? (
        <div className="table-error-card">
          <AlertCircle size={24} />
          <div>
            <h4>Unable to load match records</h4>
            <p>{error}</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={fetchMatchesData}>
            <RefreshCw size={14} />
            <span>Retry</span>
          </button>
        </div>
      ) : matches.length === 0 ? (
        <div className="table-empty-card">
          <Trophy size={32} />
          <h4>No matches found</h4>
          <p>No historical match records matched your active filter criteria.</p>
          <button className="btn btn-secondary btn-sm" onClick={handleResetFilters}>
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Season</th>
                <th>Matchup</th>
                <th>Venue</th>
                <th>Toss</th>
                <th>Winner & Margin</th>
                <th>Player of Match</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMatches.map((m) => {
                const marginText = formatResultMargin(m);
                return (
                  <tr key={m.id}>
                    <td className="cell-date">{m.date}</td>
                    <td className="cell-season">{m.season}</td>
                    <td className="cell-teams">
                      <span className="team-name">{m.team1}</span>
                      <span className="vs-tag">vs</span>
                      <span className="team-name">{m.team2}</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '.8rem' }}>
                      <div>{m.venue}</div>
                      {m.city && <div style={{ fontSize: '.72rem', color: '#64748b' }}>{m.city}</div>}
                    </td>
                    <td style={{ fontSize: '.78rem', color: 'var(--text-secondary)' }}>
                      <span style={{ fontWeight: 600 }}>{m.toss_winner}</span>
                      <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>
                        ({m.toss_decision === 'bat' ? 'Bat' : 'Field'})
                      </span>
                    </td>
                    <td>
                      {m.winner ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', flexWrap: 'wrap' }}>
                          <span className="winner-pill">{m.winner}</span>
                          {marginText && (
                            <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
                              {marginText}
                            </span>
                          )}
                          {m.method && (
                            <span style={{ fontSize: '.68rem', padding: '.1rem .35rem', borderRadius: 4, background: 'rgba(245,158,11,.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,.3)' }}>
                              {m.method}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="no-result-pill">{m.result || 'No Result'}</span>
                      )}
                    </td>
                    <td className="cell-pom">
                      {m.player_of_match ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}>
                          <Award size={13} style={{ color: 'var(--accent-cyan)' }} />
                          {m.player_of_match}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
