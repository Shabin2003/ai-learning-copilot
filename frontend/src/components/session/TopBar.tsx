'use client'

import { useRouter } from 'next/navigation'
import { Sparkles, ArrowLeft, Zap } from 'lucide-react'
import type { SessionResponse, SessionSummary } from '@/types'

interface Props {
  session: SessionResponse
  summary: SessionSummary | null
  xpPoints: number
}

export default function TopBar({ session, summary, xpPoints }: Props) {
  const router = useRouter()

  return (
    <header className="sticky top-0 z-40 border-b border-default bg-chalk/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-2">
          <div className="w-7 h-7 rounded-lg bg-ink flex items-center justify-center">
            <Sparkles size={13} className="text-chalk" />
          </div>
          <span className="font-display text-base text-ink hidden sm:block">LearnOS</span>
        </div>

        {/* Subject + topic breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-ink-muted font-body flex-1 min-w-0">
          <span className="capitalize font-medium text-ink">{session.subject}</span>
          <span className="text-chalk-muted">/</span>
          <span className="truncate">{session.current_topic}</span>
        </div>

        {/* XP pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-2 border border-default">
          <Zap size={12} style={{ color: 'var(--amber)' }} />
          <span className="text-xs font-mono font-medium text-ink">{xpPoints} XP</span>
        </div>

        {/* Accuracy pill */}
        {summary && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-2 border border-default">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor:
                  summary.accuracy >= 70
                    ? 'var(--sage)'
                    : summary.accuracy >= 50
                    ? 'var(--amber)'
                    : 'var(--coral)',
              }}
            />
            <span className="text-xs font-mono font-medium text-ink">{summary.accuracy}%</span>
          </div>
        )}

        {/* Leave */}
        <button
          onClick={() => router.push('/')}
          className="btn-ghost text-xs px-3 py-1.5 hidden sm:flex"
        >
          <ArrowLeft size={13} /> Leave
        </button>
      </div>
    </header>
  )
}
