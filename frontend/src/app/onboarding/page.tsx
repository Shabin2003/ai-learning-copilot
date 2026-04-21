'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, User, BookOpen, BarChart2, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'
import { useSessionStore } from '@/store/session'
import type { SubjectArea, DifficultyLevel } from '@/types'
import { toast } from 'sonner'

const subjects: { id: SubjectArea; label: string; emoji: string; description: string }[] = [
  { id: 'math', label: 'Mathematics', emoji: '∑', description: 'Algebra, geometry, calculus & more' },
  { id: 'science', label: 'Science', emoji: '⚗', description: 'Physics, chemistry, biology' },
  { id: 'english', label: 'English', emoji: 'A', description: 'Grammar, writing, comprehension' },
  { id: 'coding', label: 'Coding', emoji: '</>', description: 'Programming fundamentals & CS' },
  { id: 'history', label: 'History', emoji: '📜', description: 'World history & civics' },
]

const difficulties: { id: DifficultyLevel; label: string; desc: string }[] = [
  { id: 'beginner', label: 'Beginner', desc: 'Start from the fundamentals' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Build on existing knowledge' },
  { id: 'advanced', label: 'Advanced', desc: 'Push to the limits' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const setSession = useSessionStore((s) => s.setSession)

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    student_name: '',
    grade_level: 8,
    subject: (searchParams.get('subject') || 'math') as SubjectArea,
    difficulty_preference: 'intermediate' as DifficultyLevel,
  })

  const steps = [
    { title: "What's your name?", icon: User },
    { title: 'Choose your subject', icon: BookOpen },
    { title: 'Set your level', icon: BarChart2 },
  ]

  const canProceed = () => {
    if (step === 0) return form.student_name.trim().length >= 2
    if (step === 1) return !!form.subject
    if (step === 2) return !!form.difficulty_preference
    return false
  }

  const handleStart = async () => {
    setLoading(true)
    try {
      const session = await api.sessions.create(form)
      setSession(session)
      router.push(`/session/${session.session_id}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to create session')
      setLoading(false)
    }
  }

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1)
    else handleStart()
  }

  return (
    <div className="min-h-screen bg-surface-0 bg-grid-pattern flex items-center justify-center px-4">
      {/* Back to home */}
      <button
        onClick={() => router.push('/')}
        className="fixed top-6 left-6 btn-ghost text-xs"
      >
        <ArrowLeft size={14} /> Home
      </button>

      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex gap-2 mb-10 justify-center">
          {steps.map((s, i) => (
            <div
              key={i}
              className="h-1 rounded-full transition-all duration-500 flex-1"
              style={{
                backgroundColor: i <= step ? 'var(--sage)' : 'var(--chalk-muted)',
                maxWidth: '80px',
              }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Step 0 — Name */}
            {step === 0 && (
              <div className="card p-10">
                <div className="w-12 h-12 rounded-xl bg-ink flex items-center justify-center mb-6">
                  <User size={22} className="text-chalk" />
                </div>
                <h2 className="font-display text-4xl text-ink mb-2">Hello there!</h2>
                <p className="text-ink-muted mb-8">What should we call you?</p>
                <input
                  type="text"
                  placeholder="Your name..."
                  value={form.student_name}
                  onChange={(e) => setForm({ ...form, student_name: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && canProceed() && next()}
                  className="input-field text-lg"
                  autoFocus
                />
                <div className="mt-4">
                  <label className="text-sm text-ink-muted font-body block mb-2">Grade Level</label>
                  <div className="flex gap-2 flex-wrap">
                    {[5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                      <button
                        key={g}
                        onClick={() => setForm({ ...form, grade_level: g })}
                        className={`px-3 py-1.5 rounded-lg text-sm font-body border transition-all ${
                          form.grade_level === g
                            ? 'bg-ink text-chalk border-ink'
                            : 'border-default text-ink-muted hover:border-ink-muted'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 1 — Subject */}
            {step === 1 && (
              <div className="card p-10">
                <h2 className="font-display text-4xl text-ink mb-2">
                  Hi, {form.student_name}!
                </h2>
                <p className="text-ink-muted mb-8">What would you like to study today?</p>
                <div className="grid gap-3">
                  {subjects.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setForm({ ...form, subject: s.id })}
                      className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 ${
                        form.subject === s.id
                          ? 'border-sage bg-sage/5 shadow-sm'
                          : 'border-default hover:border-chalk-muted'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center font-mono font-bold text-lg flex-shrink-0">
                        {s.emoji}
                      </div>
                      <div>
                        <p className="font-body font-medium text-ink">{s.label}</p>
                        <p className="text-xs text-ink-muted">{s.description}</p>
                      </div>
                      {form.subject === s.id && (
                        <div className="ml-auto w-4 h-4 rounded-full bg-sage flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2 — Difficulty */}
            {step === 2 && (
              <div className="card p-10">
                <div className="w-12 h-12 rounded-xl bg-ink flex items-center justify-center mb-6">
                  <BarChart2 size={22} className="text-chalk" />
                </div>
                <h2 className="font-display text-4xl text-ink mb-2">Starting level</h2>
                <p className="text-ink-muted mb-8">
                  Don't worry — the AI adapts automatically as you go.
                </p>
                <div className="grid gap-3">
                  {difficulties.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setForm({ ...form, difficulty_preference: d.id })}
                      className={`flex items-center gap-4 p-5 rounded-xl border text-left transition-all duration-200 ${
                        form.difficulty_preference === d.id
                          ? 'border-sage bg-sage/5'
                          : 'border-default hover:border-chalk-muted'
                      }`}
                    >
                      <div>
                        <p className="font-body font-medium text-ink">{d.label}</p>
                        <p className="text-xs text-ink-muted">{d.desc}</p>
                      </div>
                      {form.difficulty_preference === d.id && (
                        <div className="ml-auto w-4 h-4 rounded-full bg-sage" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="btn-ghost px-6">
              <ArrowLeft size={16} />
            </button>
          )}
          <button
            onClick={next}
            disabled={!canProceed() || loading}
            className="btn-sage flex-1 py-4"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating your session...
              </span>
            ) : step === steps.length - 1 ? (
              <>
                <Sparkles size={16} /> Start Learning
              </>
            ) : (
              <>
                Continue <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
