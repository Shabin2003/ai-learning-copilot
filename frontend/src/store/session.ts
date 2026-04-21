// Global state management with Zustand

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  SessionResponse, QuestionResponse, EvaluationResult,
  SessionSummary, LearningPhase, UIFeedback
} from '@/types'

interface SessionStore {
  // Session
  session: SessionResponse | null
  summary: SessionSummary | null
  setSession: (session: SessionResponse) => void
  setSummary: (summary: SessionSummary) => void
  clearSession: () => void

  // Learning loop
  currentQuestion: QuestionResponse | null
  phase: LearningPhase
  lastEvaluation: EvaluationResult | null
  feedback: UIFeedback | null
  timerStart: number | null

  setQuestion: (question: QuestionResponse) => void
  setPhase: (phase: LearningPhase) => void
  setEvaluation: (evaluation: EvaluationResult) => void
  setFeedback: (feedback: UIFeedback | null) => void
  startTimer: () => void
  getElapsed: () => number

  // Streak & XP
  streak: number
  xpPoints: number
  level: number
  setStreak: (streak: number) => void
  addXP: (xp: number) => void

  // UI
  showExplainer: boolean
  explainerConcept: string
  setShowExplainer: (show: boolean, concept?: string) => void
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      session: null,
      summary: null,
      setSession: (session) => set({ session }),
      setSummary: (summary) => set({ summary }),
      clearSession: () => set({
        session: null, summary: null, currentQuestion: null,
        phase: 'idle', lastEvaluation: null, feedback: null,
        streak: 0, xpPoints: 0, level: 1,
      }),

      currentQuestion: null,
      phase: 'idle',
      lastEvaluation: null,
      feedback: null,
      timerStart: null,

      setQuestion: (question) => set({ currentQuestion: question, phase: 'answering' }),
      setPhase: (phase) => set({ phase }),
      setEvaluation: (evaluation) => set({ lastEvaluation: evaluation, phase: 'showing_result' }),
      setFeedback: (feedback) => set({ feedback }),
      startTimer: () => set({ timerStart: Date.now() }),
      getElapsed: () => {
        const start = get().timerStart
        return start ? Math.floor((Date.now() - start) / 1000) : 0
      },

      streak: 0,
      xpPoints: 0,
      level: 1,
      setStreak: (streak) => set({ streak }),
      addXP: (xp) => {
        const newXP = get().xpPoints + xp
        set({ xpPoints: newXP, level: Math.max(1, Math.floor(newXP / 100) + 1) })
      },

      showExplainer: false,
      explainerConcept: '',
      setShowExplainer: (show, concept = '') =>
        set({ showExplainer: show, explainerConcept: concept }),
    }),
    {
      name: 'learning-copilot-session',
      partialize: (state) => ({
        session: state.session,
        streak: state.streak,
        xpPoints: state.xpPoints,
        level: state.level,
      }),
    }
  )
)