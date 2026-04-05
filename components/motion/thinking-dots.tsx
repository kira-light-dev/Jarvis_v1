'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ThinkingDotsProps {
  className?: string
  size?: number
}

export function ThinkingDots({ className, size = 6 }: ThinkingDotsProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="rounded-full bg-primary"
          style={{ width: size, height: size }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
