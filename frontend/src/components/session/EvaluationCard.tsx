'use client'

import { motion } from 'framer-motion'
import { CheckCircle, XCircle, ArrowRight, BookOpen, Flame, Star } from 'lucide-react'
import type { QuestionResponse, EvaluationResult } from '@/types'

interface Props {
  question: QuestionResponse
  evaluation: EvaluationResult
  onContinue: () => void
  onExplain: (concept: string) => void
  streak: number
}

export default function EvaluationCard({ question, evaluation, onContinue, onExplain, streak }: Props) {
  const isCorrect = evaluation.is_correct
  const isPartial = !isCorrect && evaluation.score > 0.3

  const bgClass = isCorrect
    ? 'border-l-4 border-l-green-400'
    : isPartial
    ? 'border-l-4 border-l-amber-400'
    : 'border-l-4 border-l-red-400'

  const scorePercent = Math.round(evaluation.score * 100)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`card overflow-hidden ${bgClass}`}
    >
      <div className="p-8">
        {/* Result header */}
        <div className="flex items-start gap-4 mb-6">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isCorrect ? 'bg-green-50' : isPartial ? 'bg-amber-50' : 'bg-red-50'
            }`}
          >
            {isCorrect ? (
              <CheckCircle size={24} style={{ color: 'var(--sage)' }} />
            ) : (
              <XCircle size={24} style={{ color: isPartial ? 'var(--amber)' : 'var(--coral)' }} />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display text-2xl text-ink">
                {isCorrect ? 'Correct!' : isPartial ? 'Partially correct' : 'Not quite'}
              </h3>
              {isCorrect && (
                <span className="badge-sage text-xs">+{scorePercent > 80 ? '20' : '10'} XP</span>
              )}
            </div>
            <p className="text-ink-muted text-sm">{evaluation.feedback}</p>
          </div>
        </div>

        {/* Score bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-ink-muted mb-1.5 font-body">
            <span>Score</span>
            <span className="font-medium">{scorePercent}%</span>
          </div>
          <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${scorePercent}%` }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              style={{
                backgroundColor: isCorrect ? 'var(--sage)' : isPartial ? 'var(--amber)' : 'var(--coral)',
              }}
            />
          </div>
        </div>

        {/* Correct answer (if wrong) */}
        {!isCorrect && (
          <div
            className="p-4 rounded-xl mb-5"
            style={{ background: 'var(--surface-2)' }}
          >
            <p className="text-xs text-ink-muted font-body mb-1">Correct Answer</p>
            <p className="font-body font-medium text-ink">{evaluation.correct_answer}</p>
          </div>
        )}

        {/* Explanation */}
        {evaluation.explanation && (
          <div
            className="p-4 rounded-xl mb-5"
            style={{ background: 'rgba(74, 144, 217, 0.06)', border: '1px solid rgba(74, 144, 217, 0.15)' }}
          >
            <p className="text-xs font-body font-medium mb-2" style={{ color: 'var(--azure)' }}>
              Explanation
            </p>
            <p className="text-sm text-ink-muted leading-relaxed">{evaluation.explanation}</p>
          </div>
        )}

        {/* Encouragement */}
        <div className="flex items-center gap-2 mb-6 p-3 rounded-lg bg-surface-2">
          <Star size={14} style={{ color: 'var(--amber)' }} />
          <p className="text-sm text-ink-muted font-body italic">{evaluation.encouragement}</p>
        </div>

        {/* Streak indicator */}
        {streak >= 2 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 mb-5 p-3 rounded-xl"
            style={{ background: 'rgba(245, 166, 35, 0.08)', border: '1px solid rgba(245, 166, 35, 0.2)' }}
          >
            <Flame size={16} style={{ color: 'var(--amber)' }} />
            <span className="text-sm font-body font-medium" style={{ color: '#8B5E0A' }}>
              {streak} streak! Keep going!
            </span>
          </motion.div>
        )}

        {/* Weak concepts */}
        {evaluation.weak_concepts.length > 0 && (
          <div className="mb-6">
            <p className="text-xs text-ink-muted font-body mb-2">Concepts to review:</p>
            <div className="flex flex-wrap gap-2">
              {evaluation.weak_concepts.map((c) => (
                <button
                  key={c}
                  onClick={() => onExplain(c)}
                  className="badge-coral text-xs cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <BookOpen size={10} /> {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Continue button */}
        <button onClick={onContinue} className="btn-primary w-full py-4">
          Next Question <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  )
}
