import type { GtgLog, GtgTargetHistory } from '../types'
import { addDaysLocalISO, getMondayLocalISO } from './dates'

export interface SparklineDay {
  dateISO: string
  dayLabel: string
  reps: number
  target: number
}

export interface PersonalBest {
  reps: number
  date: string | null
}

export interface ExerciseStats {
  selectedDateTotal: number
  selectedDateTarget: number
  todayTotal: number
  dailyTotals: Map<string, number>
  personalBest: PersonalBest
  currentStreak: number
  bestStreak: number
  last7Days: SparklineDay[]
  thisWeekTotal: number
  ytdTotal: number
  lifetimeTotal: number
}

export function getTargetForDate(
  dateISO: string,
  history: GtgTargetHistory[] = [],
  fallbackTarget: number = 20
): number {
  if (!history || history.length === 0) return fallbackTarget
  let effective = fallbackTarget
  for (const h of history) {
    if (h.effective_from <= dateISO) {
      effective = h.daily_target
    }
  }
  return effective
}

export function computeExerciseStats(
  logs: GtgLog[],
  dailyTarget: number,
  todayISO: string,
  selectedDateISO: string = todayISO,
  targetHistory: GtgTargetHistory[] = []
): ExerciseStats {
  const dailyTotals = new Map<string, number>()
  let lifetimeTotal = 0

  for (const log of logs) {
    dailyTotals.set(log.logged_at, (dailyTotals.get(log.logged_at) ?? 0) + log.reps)
    lifetimeTotal += log.reps
  }

  const todayTotal = dailyTotals.get(todayISO) ?? 0
  const selectedDateTotal = dailyTotals.get(selectedDateISO) ?? 0
  const selectedDateTarget = getTargetForDate(selectedDateISO, targetHistory, dailyTarget)

  // Personal Best
  let pbReps = 0
  let pbDate: string | null = null
  for (const [date, reps] of dailyTotals.entries()) {
    if (reps > pbReps) {
      pbReps = reps
      pbDate = date
    }
  }

  // Streaks
  let currentStreak = 0
  let bestStreak = 0

  const todayTarget = getTargetForDate(todayISO, targetHistory, dailyTarget)

  // Current streak
  let cursor = todayISO
  let cursorTarget = getTargetForDate(cursor, targetHistory, dailyTarget)

  if ((dailyTotals.get(todayISO) ?? 0) >= todayTarget) {
    currentStreak = 1
    cursor = addDaysLocalISO(todayISO, -1)
    cursorTarget = getTargetForDate(cursor, targetHistory, dailyTarget)
    while ((dailyTotals.get(cursor) ?? 0) >= cursorTarget) {
      currentStreak++
      cursor = addDaysLocalISO(cursor, -1)
      cursorTarget = getTargetForDate(cursor, targetHistory, dailyTarget)
    }
  } else {
    const yesterday = addDaysLocalISO(todayISO, -1)
    const yesterdayTarget = getTargetForDate(yesterday, targetHistory, dailyTarget)
    if ((dailyTotals.get(yesterday) ?? 0) >= yesterdayTarget) {
      currentStreak = 1
      cursor = addDaysLocalISO(yesterday, -1)
      cursorTarget = getTargetForDate(cursor, targetHistory, dailyTarget)
      while ((dailyTotals.get(cursor) ?? 0) >= cursorTarget) {
        currentStreak++
        cursor = addDaysLocalISO(cursor, -1)
        cursorTarget = getTargetForDate(cursor, targetHistory, dailyTarget)
      }
    }
  }

  // Best streak ever
  const allDates = Array.from(dailyTotals.keys()).sort()
  if (allDates.length > 0) {
    const earliestDate = allDates[0]
    let tempStreak = 0
    let dCursor = earliestDate
    while (dCursor <= todayISO) {
      const reps = dailyTotals.get(dCursor) ?? 0
      const dTarget = getTargetForDate(dCursor, targetHistory, dailyTarget)
      if (reps >= dTarget) {
        tempStreak++
        if (tempStreak > bestStreak) {
          bestStreak = tempStreak
        }
      } else {
        tempStreak = 0
      }
      dCursor = addDaysLocalISO(dCursor, 1)
    }
  }

  // Last 7 days
  const last7Days: SparklineDay[] = []
  for (let i = 6; i >= 0; i--) {
    const dISO = addDaysLocalISO(todayISO, -i)
    const [y, m, d] = dISO.split('-').map(Number)
    const dateObj = new Date(y, m - 1, d)
    const dayLabel = dateObj.toLocaleDateString(undefined, { weekday: 'short' })
    const dayTarget = getTargetForDate(dISO, targetHistory, dailyTarget)
    last7Days.push({
      dateISO: dISO,
      dayLabel,
      reps: dailyTotals.get(dISO) ?? 0,
      target: dayTarget,
    })
  }

  // Rolling volume
  const mondayISO = getMondayLocalISO(todayISO)
  const currentYearStr = todayISO.slice(0, 4)
  const yearStartISO = `${currentYearStr}-01-01`

  let thisWeekTotal = 0
  let ytdTotal = 0

  for (const [dateISO, reps] of dailyTotals.entries()) {
    if (dateISO >= mondayISO) {
      thisWeekTotal += reps
    }
    if (dateISO >= yearStartISO) {
      ytdTotal += reps
    }
  }

  return {
    selectedDateTotal,
    selectedDateTarget,
    todayTotal,
    dailyTotals,
    personalBest: { reps: pbReps, date: pbDate },
    currentStreak,
    bestStreak,
    last7Days,
    thisWeekTotal,
    ytdTotal,
    lifetimeTotal,
  }
}
