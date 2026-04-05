'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'
import { forwardRef, type ReactNode } from 'react'

interface FadeInProps extends Omit<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'exit'> {
  children: ReactNode
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  distance?: number
}

const FadeIn = forwardRef<HTMLDivElement, FadeInProps>(
  ({ children, delay = 0, duration = 0.5, direction = 'up', distance = 20, ...props }, ref) => {
    const directions = {
      up: { y: distance },
      down: { y: -distance },
      left: { x: distance },
      right: { x: -distance },
      none: {},
    }

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, ...directions[direction] }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{
          duration,
          delay,
          ease: [0.25, 0.4, 0.25, 1],
        }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

FadeIn.displayName = 'FadeIn'

export { FadeIn }
