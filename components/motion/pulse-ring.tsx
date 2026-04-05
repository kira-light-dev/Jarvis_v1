'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PulseRingProps {
  className?: string
  size?: number
  color?: string
  rings?: number
}

export function PulseRing({
  className,
  size = 100,
  color = 'var(--primary)',
  rings = 3,
}: PulseRingProps) {
  return (
    <div
      className={cn('relative', className)}
      style={{ width: size, height: size }}
    >
      {Array.from({ length: rings }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border-2"
          style={{ borderColor: color }}
          initial={{ scale: 0.8, opacity: 0.8 }}
          animate={{
            scale: [0.8, 1.5],
            opacity: [0.8, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * (2 / rings),
            ease: 'easeOut',
          }}
        />
      ))}
      <motion.div
        className="absolute inset-[25%] rounded-full"
        style={{ backgroundColor: color }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  )
}
