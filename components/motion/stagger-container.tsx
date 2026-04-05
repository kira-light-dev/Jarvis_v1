'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'
import { forwardRef, type ReactNode } from 'react'

interface StaggerContainerProps extends Omit<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'variants'> {
  children: ReactNode
  staggerDelay?: number
  delayChildren?: number
}

const containerVariants = (staggerDelay: number, delayChildren: number) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren,
    },
  },
})

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.4, 0.25, 1],
    },
  },
}

const StaggerContainer = forwardRef<HTMLDivElement, StaggerContainerProps>(
  ({ children, staggerDelay = 0.1, delayChildren = 0, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        variants={containerVariants(staggerDelay, delayChildren)}
        initial="hidden"
        animate="visible"
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

StaggerContainer.displayName = 'StaggerContainer'

const StaggerItem = forwardRef<HTMLDivElement, Omit<HTMLMotionProps<'div'>, 'variants'>>(
  ({ children, ...props }, ref) => {
    return (
      <motion.div ref={ref} variants={itemVariants} {...props}>
        {children}
      </motion.div>
    )
  }
)

StaggerItem.displayName = 'StaggerItem'

export { StaggerContainer, StaggerItem }
