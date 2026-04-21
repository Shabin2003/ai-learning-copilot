'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import { useSessionStore } from '@/store/session'
import type { QuestionResponse, AnswerResponse, SessionSummary } from '@/types'
import { toast } from 'sonner'
import QuestionCard from '@/components/session/QuestionCard'
import EvaluationCard from '@/components/session/EvaluationCard'
import SessionSidebar from '@/components/session/SessionSidebar'
import TopBar from '@/components/session/TopBar'
import ExplainerDrawer from '@/components/session/ExplainerDrawer'
import StreakCelebration from '@/components/session/StreakCelebration'

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string

  const {
    session, setSession, summary, setSummary,
    currentQuestion, setQuestion,
    lastEvaluation, setEvaluation,
    phase, setPhase,
    streak, setStreak,
    addXP, xpPoints,
    showExplainer, setShowExplainer,
    startTimer, getElapsed,
  } = useSessionStore()

  const [loading, setLoading] = useState(false)
  const [showStreak, setShowStreak] = useState(false)
  const [prevStreak, setPrevStreak] = useState(0)

  // Load session if not in store
  useEffect(() => {
    if (!session || session.session_id !== sessionId) {
      api.sessions.get(sessionId)
        .then(setSession)
        .catch(() => router.push('/'))
    }
  }, [sessionId])

  // Load summary periodically
  useEffect(() => {
    const load = () =>
      api.analytics.summary(sessionId)
        .then(setSummary)
        .catch(() => {})

    load()
    const interval = setInterval(load, 15_000)
    return () => clearInterval(interval)
  }, [sessionId])

  // Load first question
  useEffect(() => {
    if (session && phase === 'idle') {
      loadQuestion()
    }
  }, [session])

  const loadQuestion = async () => {
    setLoading(true)
    setPhase('questioning')
    try {
      const q = await api.questions.generate(sessionId)
      setQuestion(q)
      startTimer()
    } catch (err: any) {
      toast.error('Failed to load question')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = async (answer: string) => {
    if (!currentQuestion || loading) return
    const timeTaken = getElapsed()

    setLoading(true)
    setPhase('evaluating')

    try {
      const result: AnswerResponse = await api.questions.submit({
        session_id: sessionId,
        question_id: currentQuestion.question_id,
        student_answer: answer,
        time_taken_seconds: timeTaken,
      })

      setEvaluation(result.evaluation)

      // XP and streak
      const xpGained = result.evaluation.is_correct
        ? ({ beginner: 10, intermediate: 20, advanced: 35 }[currentQuestion.difficulty] ?? 15)
        : 0
      addXP(xpGained)

      // Check streak celebration
      if (result.streak >= 3 && result.streak !== prevStreak) {
        setPrevStreak(result.streak)
        setShowStreak(true)
        setTimeout(() => setShowStreak(false), 3000)
      }
      setStreak(result.streak)

      // Queue next question
      if (result.next_question) {
        useSessionStore.setState({ currentQuestion: result.next_question })
      }
    } catch (err: any) {
      toast.error('Error submitting answer')
      setPhase('answering')
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    setPhase('answering')
    startTimer()
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col">
      <TopBar session={session} summary={summary} xpPoints={xpPoints} />

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-6 gap-6">
        {/* Main content */}
        <main className="flex-1 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {loading && phase === 'questioning' ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="card p-10 flex items-center justify-center gap-3"
              >
                <div className="w-5 h-5 border-2 border-sage/30 border-t-sage rounded-full animate-spin" />
                <span className="text-ink-muted text-sm font-body">
                  Generating your next question...
                </span>
              </motion.div>
            ) : currentQuestion && phase !== 'idle' ? (
              <motion.div
                key={currentQuestion.question_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                {phase === 'showing_result' && lastEvaluation ? (
                  <EvaluationCard
                    question={currentQuestion}
                    evaluation={lastEvaluation}
                    onContinue={handleContinue}
                    onExplain={(concept) => setShowExplainer(true, concept)}
                    streak={streak}
                  />
                ) : (
                  <QuestionCard
                    question={currentQuestion}
                    onAnswer={handleAnswer}
                    onHint={() => {}}
                    onExplain={(c) => setShowExplainer(true, c)}
                    loading={loading}
                  />
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </main>

        {/* Sidebar */}
        <aside className="hidden lg:block w-80 flex-shrink-0">
          <SessionSidebar
            session={session}
            summary={summary}
            streak={streak}
            onViewAnalytics={() => router.push(`/analytics/${sessionId}`)}
          />
        </aside>
      </div>

      {/* Explainer drawer */}
      <ExplainerDrawer
        open={showExplainer}
        concept={useSessionStore.getState().explainerConcept}
        sessionId={sessionId}
        onClose={() => setShowExplainer(false)}
      />

      {/* Streak celebration */}
      <AnimatePresence>
        {showStreak && <StreakCelebration streak={streak} />}
      </AnimatePresence>
    </div>
  )
}
