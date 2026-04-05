'use client'

import { motion, useAnimation } from 'framer-motion'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface TypingEffectProps {
  text: string
  className?: string
  speed?: number
  delay?: number
  cursor?: boolean
  onComplete?: () => void
}

export function TypingEffect({
  text,
  className,
  speed = 50,
  delay = 0,
  cursor = true,
  onComplete,
}: TypingEffectProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const cursorControls = useAnimation()

  useEffect(() => {
    let timeout: NodeJS.Timeout
    let currentIndex = 0

    const startTyping = () => {
      timeout = setTimeout(() => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1))
          currentIndex++
          timeout = setTimeout(startTyping, speed)
        } else {
          setIsComplete(true)
          onComplete?.()
        }
      }, currentIndex === 0 ? delay : speed)
    }

    startTyping()

    return () => clearTimeout(timeout)
  }, [text, speed, delay, onComplete])

  useEffect(() => {
    if (cursor) {
      cursorControls.start({
        opacity: [1, 0],
        transition: {
          duration: 0.8,
          repeat: Infinity,
          repeatType: 'reverse',
        },
      })
    }
  }, [cursor, cursorControls])

  return (
    <span className={cn('inline-flex items-center', className)}>
      <span>{displayedText}</span>
      {cursor && !isComplete && (
        <motion.span
          animate={cursorControls}
          className="ml-0.5 inline-block h-[1em] w-[2px] bg-primary"
        />
      )}
    </span>
  )
}
