'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface WordRevealProps {
  text: string
  className?: string
  staggerDelay?: number
}

export function WordReveal({ text, className, staggerDelay = 0.04 }: WordRevealProps) {
  const words = text.split(' ')

  return (
    <span className={cn('inline', className)}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, filter: 'blur(4px)', y: 4 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          transition={{
            duration: 0.3,
            ease: [0.22, 1, 0.36, 1],
            delay: i * staggerDelay,
          }}
        >
          {word}
          {i < words.length - 1 && '\u00A0'}
        </motion.span>
      ))}
    </span>
  )
}
