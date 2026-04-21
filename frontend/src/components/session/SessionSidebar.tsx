'use client'

import { BarChart3, BookOpen, Target, Trophy, ChevronRight, Flame } from 'lucide-react'
import type { SessionResponse, SessionSummary } from '@/types'

interface Props {
  session: SessionResponse
  summary: SessionSummary | null
  streak: number
  onViewAnalytics: () => void
}

export default function SessionSidebar({ session, summary, streak, onViewAnalytics }: Props) {
  const accuracy = summary?.accuracy ?? 0
  const level = summary?.level ?? 1
  const xp = summary?.xp_points ?? 0
  const nextLevelXp = level * 100
  const xpProgress = (xp % 100) / 100

  return (
    <div className="space-y-4 sticky top-20">
      {/* Student card */}
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-ink flex items-center justify-center text-chalk font-display text-lg">
            {session.student_name[0]}
          </div>
          <div>
            <p className="font-body font-medium text-ink text-sm">{session.student_name}</p>
            <p className="text-xs text-ink-muted">Grade {summary ? '—' : '—'} · {session.subject}</p>
          </div>
        </div>

        {/* Level & XP */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-ink-muted font-body mb-1.5">
            <span className="font-medium text-ink">Level {level}</span>
            <span>{xp % 100}/100 XP</span>
          </div>
          <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${xpProgress * 100}%`, backgroundColor: 'var(--sage)' }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-surface-2 rounded-xl p-2.5">
            <p className="font-display text-xl text-ink">{summary?.questions_answered ?? 0}</p>
            <p className="text-xs text-ink-muted font-body">Answered</p>
          </div>
          <div className="bg-surface-2 rounded-xl p-2.5">
            <p className="font-display text-xl" style={{ color: 'var(--sage)' }}>
              {accuracy}%
            </p>
            <p className="text-xs text-ink-muted font-body">Accuracy</p>
          </div>
          <div className="bg-surface-2 rounded-xl p-2.5">
            <div className="flex items-center justify-center gap-0.5">
              <Flame size={14} style={{ color: streak >= 3 ? 'var(--amber)' : 'var(--chalk-muted)' }} />
              <p className="font-display text-xl text-ink">{streak}</p>
            </div>
            <p className="text-xs text-ink-muted font-body">Streak</p>
          </div>
        </div>
      </div>

      {/* Current topic */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={14} className="text-ink-muted" />
          <p className="text-xs font-body font-medium text-ink-muted uppercase tracking-wide">
            Current Topic
          </p>
        </div>
        <p className="font-display text-xl text-ink">{session.current_topic}</p>
        <div className="badge-azure mt-2 text-xs">{session.difficulty}</div>
      </div>

      {/* Learning path */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Target size={14} className="text-ink-muted" />
          <p className="text-xs font-body font-medium text-ink-muted uppercase tracking-wide">
            Learning Path
          </p>
        </div>
        <div className="space-y-1.5">
          {session.learning_path.slice(0, 5).map((topic, i) => {
            const isCompleted = summary?.completed_topics
              ? i < summary.completed_topics
              : false
            const isCurrent = topic === session.current_topic
            return (
              <div
                key={topic}
                className={`flex items-center gap-2.5 py-1.5 px-2 rounded-lg text-sm font-body transition-colors ${
                  isCurrent ? 'bg-sage/10' : ''
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                    isCompleted
                      ? 'bg-sage text-white'
                      : isCurrent
                      ? 'border-2 border-sage bg-white'
                      : 'border-2 border-chalk-muted bg-white'
                  }`}
                >
                  {isCompleted ? '✓' : ''}
                </div>
                <span className={isCurrent ? 'text-ink font-medium' : 'text-ink-muted'}>
                  {topic}
                </span>
              </div>
            )
          })}
          {session.learning_path.length > 5 && (
            <p className="text-xs text-ink-muted pl-2">
              +{session.learning_path.length - 5} more topics
            </p>
          )}
        </div>
      </div>

      {/* Analytics button */}
      <button
        onClick={onViewAnalytics}
        className="btn-ghost w-full justify-between"
      >
        <span className="flex items-center gap-2">
          <BarChart3 size={14} />
          View Analytics
        </span>
        <ChevronRight size={14} />
      </button>

      {/* Trophy */}
      {streak >= 5 && (
        <div className="card p-4 text-center" style={{ borderColor: 'rgba(245,166,35,0.3)', background: 'rgba(245,166,35,0.05)' }}>
          <Trophy size={24} className="mx-auto mb-1" style={{ color: 'var(--amber)' }} />
          <p className="text-sm font-body font-medium" style={{ color: '#8B5E0A' }}>
            {streak}-streak champion!
          </p>
        </div>
      )}
    </div>
  )
}
