'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, BookOpen, Lightbulb, Beaker, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api'
import type { ExplainConceptResponse } from '@/types'

interface Props {
  open: boolean
  concept: string
  sessionId: string
  onClose: () => void
}

export default function ExplainerDrawer({ open, concept, sessionId, onClose }: Props) {
  const [data, setData] = useState<ExplainConceptResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [depth, setDepth] = useState<'brief' | 'detailed' | 'eli5'>('detailed')

  useEffect(() => {
    if (open && concept) {
      setData(null)
      setLoading(true)
      api.questions.explain(sessionId, concept, depth)
        .then(setData)
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [open, concept, depth])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-modal z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-default">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-azure/10 flex items-center justify-center">
                  <BookOpen size={15} style={{ color: 'var(--azure)' }} />
                </div>
                <div>
                  <p className="text-xs text-ink-muted font-body">Explaining</p>
                  <p className="font-display text-lg text-ink leading-tight">{concept}</p>
                </div>
              </div>
              <button onClick={onClose} className="btn-ghost px-2 py-2">
                <X size={16} />
              </button>
            </div>

            {/* Depth selector */}
            <div className="px-6 py-3 border-b border-default">
              <div className="flex gap-2">
                {(['brief', 'detailed', 'eli5'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDepth(d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-body transition-all ${
                      depth === d
                        ? 'bg-ink text-chalk'
                        : 'bg-surface-2 text-ink-muted hover:bg-chalk-soft'
                    }`}
                  >
                    {d === 'eli5' ? 'Simple' : d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3">
                  <div className="w-8 h-8 border-2 border-azure/30 border-t-azure rounded-full animate-spin"
                    style={{ borderTopColor: 'var(--azure)' }} />
                  <p className="text-sm text-ink-muted font-body">Generating explanation...</p>
                </div>
              ) : data ? (
                <div className="animate-stagger space-y-5">
                  {/* Explanation */}
                  <div>
                    <p className="text-ink leading-relaxed font-body">{data.explanation}</p>
                  </div>

                  {/* Examples */}
                  {data.examples?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Beaker size={14} style={{ color: 'var(--sage)' }} />
                        <p className="text-xs font-body font-medium text-ink uppercase tracking-wide">
                          Examples
                        </p>
                      </div>
                      <div className="space-y-2">
                        {data.examples.map((ex, i) => (
                          <div
                            key={i}
                            className="flex gap-3 p-3 rounded-xl bg-surface-2"
                          >
                            <span className="text-xs font-mono text-ink-muted mt-0.5 flex-shrink-0">
                              {i + 1}.
                            </span>
                            <p className="text-sm text-ink font-body leading-relaxed">{ex}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Analogies */}
                  {data.analogies?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb size={14} style={{ color: 'var(--amber)' }} />
                        <p className="text-xs font-body font-medium text-ink uppercase tracking-wide">
                          Think of it like...
                        </p>
                      </div>
                      <div className="space-y-2">
                        {data.analogies.map((a, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-xl italic text-sm text-ink-muted font-body"
                            style={{
                              background: 'rgba(245,166,35,0.07)',
                              border: '1px solid rgba(245,166,35,0.2)',
                            }}
                          >
                            "{a}"
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Practice suggestion */}
                  {data.practice_suggestion && (
                    <div
                      className="p-4 rounded-xl"
                      style={{
                        background: 'rgba(107,174,96,0.07)',
                        border: '1px solid rgba(107,174,96,0.2)',
                      }}
                    >
                      <p className="text-xs font-body font-medium mb-1.5" style={{ color: 'var(--sage-dark)' }}>
                        Try this →
                      </p>
                      <p className="text-sm text-ink font-body leading-relaxed">
                        {data.practice_suggestion}
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-default">
              <button onClick={onClose} className="btn-primary w-full">
                Got it — back to learning <ArrowRight size={15} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
