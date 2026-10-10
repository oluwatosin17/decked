import { describe, expect, it } from 'vitest'
import { commandCentrePath, comparisonDelta, comparisonDescription, completeDeviceBreakdown, formatMetric, formatTrendBucketLabel, isCommandCentrePath, normalizeOverview, overviewDashboardViewState, overviewViewState, parseDashboardFilters, sectionFromPath, serializeDashboardFilters, trendLabelIndexes, type DashboardFilters, type OverviewDashboardResponse } from './model'

const overviewFixture = (overrides: Partial<OverviewDashboardResponse['current']> = {}): OverviewDashboardResponse => ({
  current: { daily_active: 12, weekly_active: 30, monthly_active: 70, new_players: 4, returning_players: 8, game_starts: 10, completions: 7, cards_played: 35, replays: 2, median_session_duration_seconds: 180, rooms_created: 3, rooms_started: 2, eligible_rooms: 2, rematch_starts: 1, sessions: 12, error_sessions: 1, ...overrides },
  previous: { daily_active: 10, weekly_active: 28, monthly_active: 65, new_players: 3, returning_players: 7, game_starts: 8, completions: 5, cards_played: 25, replays: 1, median_session_duration_seconds: 160, rooms_created: 2, rooms_started: 1, eligible_rooms: 2, rematch_starts: 0, sessions: 10, error_sessions: 2 },
  trend: [{ metric_date: '2026-10-01', starts: 10, completions: 7 }], top_games: [], refreshed_at: '2026-10-02T00:00:00Z', partial_warnings: [],
})

describe('Command Centre routing and fixtures', () => {
  it('resolves protected section routes without affecting gameplay paths', () => {
    expect(isCommandCentrePath('/command-centre')).toBe(true)
    expect(isCommandCentrePath('/command-centre/games')).toBe(true)
    expect(isCommandCentrePath('/command-centre-impersonator')).toBe(false)
    expect(isCommandCentrePath('/browse')).toBe(false)
    expect(sectionFromPath('/command-centre/multiplayer')).toBe('multiplayer')
    expect(sectionFromPath('/command-centre/geography')).toBe('geography')
    expect(sectionFromPath('/command-centre/acquisition')).toBe('acquisition')
    expect(sectionFromPath('/command-centre/unknown')).toBe('overview')
    expect(commandCentrePath('games')).toBe('/command-centre/games')
    expect(commandCentrePath('geography')).toBe('/command-centre/geography')
  })
  it('normalizes realistic filtered and empty responses', () => {
    const filtered = normalizeOverview({ kpis: { active_players: 25, game_sessions: 42, completed_sessions: 30, completion_rate: 71.4, multiplayer_sessions: 12 }, games: [{ game_id: 'charades', sessions: 12, completed: 10, completion_rate: 83.3 }] })
    const empty = normalizeOverview(null)
    expect(filtered.games[0].sessions).toBe(12)
    expect(overviewViewState('ready', filtered)).toBe('data')
    expect(overviewViewState('ready', empty)).toBe('empty')
    expect(overviewViewState('loading', null)).toBe('loading')
    expect(overviewViewState('error', null)).toBe('error')
  })
  it('formats metrics and accessible comparison values', () => {
    expect(formatMetric(1250)).toBe('1,250')
    expect(formatMetric(72.34, 'percent')).toBe('72.3%')
    expect(formatMetric(4.26, 'decimal')).toBe('4.3')
    expect(formatMetric(125, 'duration')).toBe('2m 5s')
    expect(formatMetric(null, 'duration')).toBe('—')
    expect(comparisonDelta(120, 100)).toBe(20)
    expect(comparisonDelta(4, 0)).toBeNull()
    expect(comparisonDescription(120, 100, 220)).toBe('20.0% higher than previous period')
    expect(comparisonDescription(4, 3, 7)).toBe('Small sample; comparison withheld')
    expect(comparisonDescription(4, 0, 40)).toBe('No prior-period baseline')
  })

  it('formats readable trend bucket labels',()=>{
    expect(formatTrendBucketLabel('2026-10-05','day',0)).toContain('Mon')
    expect(formatTrendBucketLabel('2026-10-05','week',1)).toBe('Week 2 · Oct 5')
    expect(formatTrendBucketLabel('2026-01-01','month',0)).toBe('Jan 2026')
    expect(formatTrendBucketLabel('2026-01-01','year',0)).toBe('2026')
    expect(trendLabelIndexes(12,'month')).toHaveLength(12)
    expect(trendLabelIndexes(24,'month')).toEqual([0,3,6,9,12,15,18,21,23])
  })
  it('covers loading, empty, populated, error-only, and query-failure states', () => {
    const zero = overviewFixture({ daily_active: 0, weekly_active: 0, monthly_active: 0, new_players: 0, returning_players: 0, game_starts: 0, completions: 0, cards_played: 0, replays: 0, median_session_duration_seconds: null, rooms_created: 0, rooms_started: 0, eligible_rooms: 0, rematch_starts: 0, sessions: 0, error_sessions: 0 })
    expect(overviewDashboardViewState('loading', null)).toBe('loading')
    expect(overviewDashboardViewState('ready', zero)).toBe('empty')
    expect(overviewDashboardViewState('ready', overviewFixture())).toBe('data')
    expect(overviewDashboardViewState('ready', { ...zero, current: { ...zero.current, sessions: 1, error_sessions: 1 } })).toBe('data')
    expect(overviewDashboardViewState('error', null)).toBe('error')
  })
  it('round-trips supported URL filters and ignores invalid values', () => {
    const fallback: DashboardFilters = { environment: 'production', from: '2026-09-01', to: '2026-09-30', gameId: '', playMode: '', deviceClass: 'all', comparison: 'previous_period' }
    const selected = { ...fallback, environment: 'preview' as const, gameId: 'charades', playMode: 'play_together' as const }
    expect(parseDashboardFilters(`?${serializeDashboardFilters(selected)}`, fallback)).toEqual(selected)
    expect(parseDashboardFilters('?env=invalid&from=nope', fallback).environment).toBe('production')
  })
  it('keeps zero-value device rows visible',()=>{
    const result=completeDeviceBreakdown({devices:[{device_class:'mobile',active_players:2,sessions:3,game_starts:1,completions:0}],access_modes:[{access_mode:'browser',active_players:2,sessions:3,game_starts:1,completions:0}],refreshed_at:null,partial_warnings:[]})
    expect(result?.devices.map(row=>[row.device_class,row.active_players])).toEqual([['mobile',2],['tablet',0],['desktop',0],['unknown',0]])
    expect(result?.access_modes.map(row=>[row.access_mode,row.sessions])).toEqual([['browser',3],['pwa',0],['unknown',0]])
  })
})
