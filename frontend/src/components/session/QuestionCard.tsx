'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, Lightbulb, HelpCircle, Zap } from 'lucide-react'
import type { QuestionResponse } from '@/types'

interface Props {
  question: QuestionResponse
  onAnswer: (answer: string) => void
  onHint: () => void
  onExplain: (concept: string) => void
  loading: boolean
}

const difficultyConfig = {
  beginner: { label: 'Beginner', color: 'badge-sage' },
  intermediate: { label: 'Intermediate', color: 'badge-amber' },
  advanced: { label: 'Advanced', color: 'badge-coral' },
}

export default function QuestionCard({ question, onAnswer, onHint, onExplain, loading }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [textAnswer, setTextAnswer] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    setSelected(null)
    setTextAnswer('')
    setShowHint(false)
    setElapsed(0)
  }, [question.question_id])

  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(interval)
  }, [question.question_id])

  const handleSubmit = () => {
    const answer =
      question.question_type === 'mcq' || question.question_type === 'true_false'
        ? selected || ''
        : textAnswer.trim()
    if (!answer) return
    onAnswer(answer)
  }

  const isMCQ = question.question_type === 'mcq' || question.question_type === 'true_false'
  const isText = question.question_type === 'short_answer' || question.question_type === 'fill_blank'
  const cfg = difficultyConfig[question.difficulty] || difficultyConfig.intermediate

  const timePercent = Math.min(100, (elapsed / question.estimated_time_seconds) * 100)
  const timeColor = timePercent > 80 ? 'var(--coral)' : timePercent > 60 ? 'var(--amber)' : 'var(--sage)'

  const canSubmit = isMCQ ? !!selected : textAnswer.trim().length > 0

  return (
    <div className="card overflow-hidden animate-slide-up">
      {/* Time bar */}
      <div className="h-1 bg-chalk-soft">
        <motion.div
          className="h-full transition-all duration-1000"
          style={{ width: `${100 - timePercent}%`, backgroundColor: timeColor }}
        />
      </div>

      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className={cfg.color}>{cfg.label}</span>
            <span className="badge" style={{ background: 'var(--surface-2)', color: 'var(--ink-muted)' }}>
              {question.topic}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-ink-muted text-xs font-mono">
            <Clock size={12} />
            {elapsed}s
          </div>
        </div>

        {/* Question */}
        <h2 className="font-display text-2xl md:text-3xl text-ink leading-snug mb-8">
          {question.question_text}
        </h2>

        {/* MCQ options */}
        {isMCQ && question.options && (
          <div className="grid gap-3 mb-6">
            {question.options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelected(opt.id)}
                disabled={loading}
                className={`flex items-center gap-3 px-5 py-4 rounded-xl border text-left transition-all duration-200 ${
                  selected === opt.id
                    ? 'border-sage bg-sage/5 shadow-sm'
                    : 'border-default hover:border-chalk-muted bg-white'
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-mono font-bold flex-shrink-0 transition-colors ${
                    selected === opt.id ? 'bg-sage text-white' : 'bg-surface-2 text-ink-muted'
                  }`}
                >
                  {opt.id}
                </span>
                <span className="font-body text-ink">{opt.text}</span>
              </button>
            ))}
          </div>
        )}

        {/* Text input */}
        {isText && (
          <div className="mb-6">
            {question.question_type === 'fill_blank' ? (
              <input
                type="text"
                placeholder="Fill in the blank..."
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && canSubmit && handleSubmit()}
                className="input-field text-lg"
                disabled={loading}
                autoFocus
              />
            ) : (
              <textarea
                placeholder="Type your answer here..."
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                rows={4}
                className="input-field resize-none leading-relaxed"
                disabled={loading}
                autoFocus
              />
            )}
          </div>
        )}

        {/* Hint */}
        {showHint && question.hint && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 p-4 rounded-xl mb-6"
            style={{ background: 'rgba(245, 166, 35, 0.08)', border: '1px solid rgba(245, 166, 35, 0.2)' }}
          >
            <Lightbulb size={16} className="text-amber flex-shrink-0 mt-0.5" style={{ color: 'var(--amber)' }} />
            <p className="text-sm text-ink-muted leading-relaxed">{question.hint}</p>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className="btn-sage flex-1 py-4"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Evaluating...
              </span>
            ) : (
              <>
                <Zap size={16} /> Submit Answer
              </>
            )}
          </button>

          {question.hint && !showHint && (
            <button
              onClick={() => setShowHint(true)}
              className="btn-ghost px-4 py-4"
              title="Show hint"
            >
              <Lightbulb size={16} />
            </button>
          )}

          <button
            onClick={() => onExplain(question.topic)}
            className="btn-ghost px-4 py-4"
            title="Explain concept"
          >
            <HelpCircle size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
