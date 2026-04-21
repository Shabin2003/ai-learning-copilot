'use client'

import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'

interface Props {
  streak: number
}

const messages: Record<number, string> = {
  3: 'Triple! 🔥',
  5: 'On fire! ⚡',
  7: 'Unstoppable! 🌟',
  10: 'Legendary! 🏆',
}

export default function StreakCelebration({ streak }: Props) {
  const msg = Object.entries(messages)
    .reverse()
    .find(([k]) => streak >= Number(k))?.[1] ?? `${streak} streak!`

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      transition={{ type: 'spring', damping: 15, stiffness: 300 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
    >
      <div
        className="flex items-center gap-3 px-6 py-4 rounded-2xl shadow-modal text-white"
        style={{ background: 'linear-gradient(135deg, var(--amber-dark, #C27A0E), var(--amber))' }}
      >
        <Flame size={22} />
        <div>
          <p className="font-display text-2xl leading-none">{msg}</p>
          <p className="text-xs font-body opacity-80 mt-0.5">{streak} in a row</p>
        </div>
      </div>
    </motion.div>
  )
}
