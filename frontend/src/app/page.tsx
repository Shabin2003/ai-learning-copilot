'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Brain, Zap, Target, BarChart3, ArrowRight, Sparkles } from 'lucide-react'
import { useSessionStore } from '@/store/session'
import { useEffect } from 'react'

const features = [
  {
    icon: Brain,
    title: 'Adaptive Intelligence',
    desc: 'Six AI agents work together — diagnosing gaps, planning your path, generating questions, evaluating answers, explaining concepts, and tracking engagement.',
    color: 'sage',
  },
  {
    icon: Target,
    title: 'Zone of Proximal Development',
    desc: 'Questions automatically calibrate to keep you in the sweet spot — hard enough to stretch you, easy enough to keep you winning.',
    color: 'amber',
  },
  {
    icon: Zap,
    title: 'Real-Time Feedback',
    desc: 'Every answer triggers instant, nuanced evaluation with partial scoring, personalized explanations, and concept-level diagnostics.',
    color: 'coral',
  },
  {
    icon: BarChart3,
    title: 'Deep Analytics',
    desc: 'Track accuracy trends, identify weak spots, celebrate mastery. Your learning data tells a story — we help you read it.',
    color: 'azure',
  },
]

const subjects = [
  { id: 'math', label: 'Mathematics', emoji: '∑', color: '#4A90D9' },
  { id: 'science', label: 'Science', emoji: '⚗', color: '#6BAE60' },
  { id: 'english', label: 'English', emoji: 'A', color: '#F5A623' },
  { id: 'coding', label: 'Coding', emoji: '</', color: '#E85D42' },
]

export default function HomePage() {
  const router = useRouter()
  const clearSession = useSessionStore((s) => s.clearSession)

  useEffect(() => { clearSession() }, [clearSession])

  return (
    <div className="min-h-screen bg-surface-0 bg-grid-pattern overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-default bg-chalk/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center">
              <Sparkles size={16} className="text-chalk" />
            </div>
            <span className="font-display text-lg text-ink">LearnOS</span>
          </div>
          <button
            onClick={() => router.push('/onboarding')}
            className="btn-primary text-xs"
          >
            Start Learning <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="badge-sage mb-8 inline-flex">
            <Sparkles size={12} /> Multi-Agent AI Tutor
          </div>

          <h1 className="font-display text-6xl md:text-7xl text-ink mb-6 leading-[1.05]">
            Learning that
            <br />
            <span className="italic" style={{ color: 'var(--sage)' }}>
              adapts to you.
            </span>
          </h1>

          <p className="text-ink-muted text-lg md:text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
            Six specialized AI agents collaborate to understand exactly where you are,
            where you need to go, and the fastest way to get there.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push('/onboarding')}
              className="btn-sage px-8 py-4 text-base"
            >
              Begin Your Session <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>

        {/* Subject cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20"
        >
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => router.push(`/onboarding?subject=${s.id}`)}
              className="card p-6 text-center hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 group"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 text-xl font-mono font-bold text-white"
                style={{ backgroundColor: s.color }}
              >
                {s.emoji}
              </div>
              <p className="font-body font-medium text-ink text-sm">{s.label}</p>
              <p className="text-xs text-ink-muted mt-1 group-hover:text-ink transition-colors">
                Adaptive AI →
              </p>
            </button>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="font-display text-4xl md:text-5xl text-ink mb-4">
            Six agents. One goal.
          </h2>
          <p className="text-ink-muted text-lg max-w-xl mx-auto">
            A coordinated system that runs end-to-end adaptive learning in real time.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="card p-8 hover:shadow-elevated transition-shadow duration-300"
            >
              <div className={`badge-${f.color} w-fit mb-4`}>
                <f.icon size={14} />
                {f.title}
              </div>
              <p className="text-ink-muted leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Agent architecture diagram */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="card p-10 bg-ink text-chalk">
          <h3 className="font-display text-3xl mb-8 text-center">Agent Architecture</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {[
              { name: 'Diagnostic', icon: '🔍', desc: 'Finds gaps' },
              { name: 'Planner', icon: '🗺', desc: 'Maps path' },
              { name: 'Generator', icon: '✍️', desc: 'Creates Qs' },
              { name: 'Evaluator', icon: '⚖️', desc: 'Scores answers' },
              { name: 'Explainer', icon: '💡', desc: 'Clarifies' },
              { name: 'Engagement', icon: '📊', desc: 'Adapts flow' },
            ].map((agent) => (
              <div key={agent.name} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-2 text-xl">
                  {agent.icon}
                </div>
                <p className="text-xs font-medium text-chalk/90 font-body">{agent.name}</p>
                <p className="text-xs text-chalk/50 font-body mt-0.5">{agent.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-3 gap-6 text-center">
            {[
              { label: 'LangChain', sub: 'Agent orchestration' },
              { label: 'FastAPI', sub: 'Real-time backend' },
              { label: 'MongoDB', sub: 'Persistent memory' },
            ].map((tech) => (
              <div key={tech.label}>
                <p className="font-mono text-sm text-sage-light">{tech.label}</p>
                <p className="text-xs text-chalk/50 font-body mt-0.5">{tech.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-16 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-4xl md:text-5xl text-ink mb-6">
            Ready to learn smarter?
          </h2>
          <button
            onClick={() => router.push('/onboarding')}
            className="btn-primary px-10 py-4 text-base"
          >
            Start Your Session <ArrowRight size={16} />
          </button>
        </motion.div>
      </section>
    </div>
  )
}
