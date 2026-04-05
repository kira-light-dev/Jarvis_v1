'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlowEffectProps {
  className?: string
  children: React.ReactNode
  glowColor?: string
  intensity?: 'low' | 'medium' | 'high'
}

export function GlowEffect({ 
  className, 
  children, 
  glowColor = 'var(--primary)',
  intensity = 'medium' 
}: GlowEffectProps) {
  const intensityValues = {
    low: { blur: '10px', spread: '5px' },
    medium: { blur: '20px', spread: '10px' },
    high: { blur: '30px', spread: '15px' },
  }

  const { blur, spread } = intensityValues[intensity]

  return (
    <motion.div
      className={cn('relative', className)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="absolute inset-0 rounded-lg opacity-0"
        style={{
          background: glowColor,
          filter: `blur(${blur})`,
        }}
        whileHover={{ opacity: 0.3 }}
        transition={{ duration: 0.3 }}
      />
      <motion.div
        className="absolute inset-0 rounded-lg"
        style={{
          boxShadow: `0 0 ${spread} ${glowColor}`,
          opacity: 0,
        }}
        whileHover={{ opacity: 0.5 }}
        transition={{ duration: 0.3 }}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}
