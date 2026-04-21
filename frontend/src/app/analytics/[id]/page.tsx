'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
  LineChart, Line, CartesianGrid,
} from 'recharts'
import {
  ArrowLeft, Target, TrendingUp, TrendingDown, Minus,
  Trophy, Zap, BookOpen, Clock, BarChart3, AlertCircle
} from 'lucide-react'
import { api } from '@/lib/api'
import type { SessionAnalytics, TopicPerformance } from '@/types'

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'improving') return <TrendingUp size={13} style={{ color: 'var(--sage)' }} />
  if (trend === 'declining') return <TrendingDown size={13} style={{ color: 'var(--coral)' }} />
  return <Minus size={13} style={{ color: 'var(--ink-muted)' }} />
}

function StatCard({ label, value, sub, color }: {
  label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="card p-5"
    >
      <p className="text-xs text-ink-muted font-body uppercase tracking-wide mb-1">{label}</p>
      <p className="font-display text-3xl" style={{ color: color || 'var(--ink)' }}>{value}</p>
      {sub && <p className="text-xs text-ink-muted font-body mt-1">{sub}</p>}
    </motion.div>
  )
}

export default function AnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string

  const [analytics, setAnalytics] = useState<SessionAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.analytics.get(sessionId)
      .then(setAnalytics)
      .catch(() => router.push('/'))
      .finally(() => setLoading(false))
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
      </div>
    )
  }

  if (!analytics) return null

  const topicChartData = analytics.topic_performance.map((t) => ({
    topic: t.topic.length > 12 ? t.topic.slice(0, 12) + '…' : t.topic,
    accuracy: Math.round(t.accuracy * 100),
    attempts: t.attempts,
  }))

  const radarData = analytics.topic_performance.slice(0, 6).map((t) => ({
    subject: t.topic.split(' ')[0],
    score: Math.round(t.accuracy * 100),
  }))

  const levelXP = analytics.xp_points % 100
  const levelProgress = levelXP / 100

  return (
    <div className="min-h-screen bg-surface-0 bg-grid-pattern">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-default bg-chalk/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="btn-ghost text-xs px-3 py-1.5"
          >
            <ArrowLeft size={13} /> Back
          </button>
          <div className="flex-1">
            <span className="font-display text-base text-ink">
              {analytics.student_name}'s Analytics
            </span>
          </div>
          <button
            onClick={() => router.push(`/session/${sessionId}`)}
            className="btn-primary text-xs px-4 py-2"
          >
            Continue Learning →
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-6 animate-stagger">

        {/* Hero stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Overall Accuracy"
            value={`${Math.round(analytics.overall_accuracy * 100)}%`}
            sub={`${analytics.correct_answers}/${analytics.total_questions} correct`}
            color={analytics.overall_accuracy >= 0.7 ? 'var(--sage)' : analytics.overall_accuracy >= 0.5 ? 'var(--amber)' : 'var(--coral)'}
          />
          <StatCard
            label="XP Points"
            value={analytics.xp_points}
            sub={`Level ${analytics.level} · ${levelXP}/100 to next`}
            color="var(--amber)"
          />
          <StatCard
            label="Best Streak"
            value={analytics.streak}
            sub="consecutive correct"
            color="var(--coral)"
          />
          <StatCard
            label="Time Spent"
            value={`${analytics.total_time_minutes}m`}
            sub={`${analytics.total_questions} questions`}
          />
        </div>

        {/* Level progress */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy size={18} style={{ color: 'var(--amber)' }} />
              <span className="font-body font-medium text-ink">Level {analytics.level}</span>
            </div>
            <span className="text-sm text-ink-muted font-body">{levelXP}/100 XP</span>
          </div>
          <div className="h-3 bg-surface-2 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${levelProgress * 100}%` }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, var(--amber-light), var(--amber))' }}
            />
          </div>
          <p className="text-xs text-ink-muted font-body mt-2">
            {100 - levelXP} XP to Level {analytics.level + 1}
          </p>
        </div>

        {/* Charts row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Topic accuracy bar chart */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 size={16} className="text-ink-muted" />
              <h3 className="font-display text-xl text-ink">Topic Accuracy</h3>
            </div>
            {topicChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topicChartData} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,13,15,0.06)" />
                  <XAxis dataKey="topic" tick={{ fontSize: 10, fontFamily: 'var(--font-body)' }} />
                  <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip
                    formatter={(v) => [`${v}%`, 'Accuracy']}
                    contentStyle={{ borderRadius: 12, border: '1px solid rgba(13,13,15,0.08)', fontFamily: 'var(--font-body)' }}
                  />
                  <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                    {topicChartData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.accuracy >= 70 ? 'var(--sage)' : entry.accuracy >= 50 ? 'var(--amber)' : 'var(--coral)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-ink-muted text-sm font-body">
                Answer some questions to see topic data
              </div>
            )}
          </div>

          {/* Radar chart */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <Target size={16} className="text-ink-muted" />
              <h3 className="font-display text-xl text-ink">Skill Radar</h3>
            </div>
            {radarData.length >= 3 ? (
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(13,13,15,0.08)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontFamily: 'var(--font-body)' }} />
                  <Radar name="Score" dataKey="score" stroke="var(--sage)" fill="var(--sage)" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-ink-muted text-sm font-body">
                Need 3+ topics for radar chart
              </div>
            )}
          </div>
        </div>

        {/* Topic performance table */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-default">
            <h3 className="font-display text-xl text-ink">Topic Performance</h3>
          </div>
          {analytics.topic_performance.length > 0 ? (
            <div className="divide-y divide-default">
              {analytics.topic_performance.map((t) => (
                <div key={t.topic} className="px-6 py-4 flex items-center gap-4 hover:bg-surface-2/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-medium text-ink text-sm truncate">{t.topic}</p>
                    <p className="text-xs text-ink-muted font-body">{t.attempts} attempts · avg {t.avg_time_seconds}s</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-surface-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${t.accuracy * 100}%`,
                          backgroundColor: t.accuracy >= 0.7 ? 'var(--sage)' : t.accuracy >= 0.5 ? 'var(--amber)' : 'var(--coral)',
                        }}
                      />
                    </div>
                    <span className="text-sm font-mono font-medium text-ink w-10 text-right">
                      {Math.round(t.accuracy * 100)}%
                    </span>
                    <TrendIcon trend={t.trend} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-10 text-center text-ink-muted text-sm font-body">
              No topic data yet — answer some questions first!
            </div>
          )}
        </div>

        {/* Weak / Strong areas */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={15} style={{ color: 'var(--coral)' }} />
              <h3 className="font-display text-xl text-ink">Areas to Strengthen</h3>
            </div>
            {analytics.weak_areas.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {analytics.weak_areas.map((w) => (
                  <span key={w} className="badge-coral text-xs">{w}</span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-muted font-body">No weak areas identified yet 🎉</p>
            )}
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={15} style={{ color: 'var(--sage)' }} />
              <h3 className="font-display text-xl text-ink">Strong Areas</h3>
            </div>
            {analytics.strong_areas.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {analytics.strong_areas.map((s) => (
                  <span key={s} className="badge-sage text-xs">{s}</span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-muted font-body">Keep answering to discover your strengths!</p>
            )}
          </div>
        </div>

        {/* Learning path progress */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <BookOpen size={15} className="text-ink-muted" />
            <h3 className="font-display text-xl text-ink">Learning Path Progress</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {analytics.learning_path.map((topic) => {
              const completed = analytics.completed_topics.includes(topic)
              return (
                <div
                  key={topic}
                  className={`px-3 py-2 rounded-xl text-xs font-body font-medium border transition-all ${
                    completed
                      ? 'bg-sage/10 border-sage/30 text-sage-dark'
                      : 'bg-surface-2 border-default text-ink-muted'
                  }`}
                >
                  {completed && '✓ '}{topic}
                </div>
              )
            })}
          </div>
          <p className="text-xs text-ink-muted font-body mt-3">
            {analytics.completed_topics.length}/{analytics.learning_path.length} topics completed
          </p>
        </div>
      </div>
    </div>
  )
}
