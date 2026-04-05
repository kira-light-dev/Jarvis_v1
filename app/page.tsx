'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { TypingEffect, ThinkingDots } from '@/components/motion'
import { useUserStore, type UserProfile, type CharacterDNA } from '@/lib/store'
import { cn } from '@/lib/utils'
import { questionTransition } from '@/lib/animations'

const QUESTIONS = [
  "When you have free time and nobody's watching — what do you actually end up doing?",
  "What's something you care about that you've never told anyone?",
  "When things get hard, do you push harder, go quiet, or spiral?",
  "What does a perfect day look like for you — the real one, not the ideal?",
  "What's the one thing you keep telling yourself you'll start someday?",
  "Five years from now, you're proud of yourself. What happened?",
  "What's your relationship with failure? Does it teach you or break you?",
  "Late night, deadline tomorrow, everything's behind — what do you actually do?",
  "What kind of support do you actually want when you're struggling?",
  "One word. How are you, really, right now?"
]

const HYBRID_CHIPS: Record<number, string[]> = {
  2: ["Push harder", "Go quiet", "Spiral", "Depends on the day"],
  5: ["Got my dream job", "Built something meaningful", "Found balance", "Made an impact"],
  8: ["Just listen", "Give me a plan", "Challenge me", "Leave me alone"]
}

type Stage = 'opening' | 'questions' | 'processing'

export default function OnboardingPage() {
  const router = useRouter()
  const { setUser, isOnboarded } = useUserStore()
  const [stage, setStage] = useState<Stage>('opening')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<string[]>(Array(10).fill(''))
  const [inputValue, setInputValue] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [titleComplete, setTitleComplete] = useState(false)
  const [processingText, setProcessingText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOnboarded) {
      router.push('/chat')
    }
  }, [isOnboarded, router])

  useEffect(() => {
    if (stage === 'opening' && titleComplete) {
      const timer = setTimeout(() => setShowInput(true), 1800)
      return () => clearTimeout(timer)
    }
  }, [stage, titleComplete])

  useEffect(() => {
    if (showInput && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [showInput, currentQuestion])

  const handleSubmit = () => {
    if (!inputValue.trim()) return
    
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = inputValue.trim()
    setAnswers(newAnswers)
    setInputValue('')
    
    if (currentQuestion < 9) {
      setCurrentQuestion(prev => prev + 1)
    } else {
      setStage('processing')
      processOnboarding(newAnswers)
    }
  }

  const handleChipClick = (chip: string) => {
    setInputValue(chip)
    setTimeout(() => {
      const newAnswers = [...answers]
      newAnswers[currentQuestion] = chip
      setAnswers(newAnswers)
      setInputValue('')
      
      if (currentQuestion < 9) {
        setCurrentQuestion(prev => prev + 1)
      } else {
        setStage('processing')
        processOnboarding(newAnswers)
      }
    }, 400)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const processOnboarding = async (finalAnswers: string[]) => {
    setProcessingText('Getting to know you...')
    
    await new Promise(resolve => setTimeout(resolve, 1500))
    setProcessingText('Building your profile...')
    
    // Create basic user profile
    const userProfile: UserProfile = {
      id: Date.now().toString(),
      name: 'Student', // Will be extracted or asked later
      email: `user-${Date.now()}@jarvis.app`,
      branch: 'Computer Science',
      semester: 4,
      targetCompanies: ['Google', 'Microsoft', 'Amazon'],
      dsaLevel: 'intermediate',
      onboardingAnswers: finalAnswers,
      characterDNA: null,
      totalXP: 100,
      streak: 1,
      lastActiveDate: new Date().toISOString().split('T')[0]
    }

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: finalAnswers, userProfile })
      })
      
      const data = await response.json()
      
      if (data.characterDNA) {
        userProfile.characterDNA = data.characterDNA as CharacterDNA
      }
      if (data.totalXP) {
        userProfile.totalXP = data.totalXP
      }
    } catch (error) {
      console.error('Onboarding API error:', error)
      // Continue with default profile
    }

    setUser(userProfile)
    
    await new Promise(resolve => setTimeout(resolve, 500))
    router.push('/chat')
  }

  const progress = ((currentQuestion + 1) / 10) * 100

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <AnimatePresence mode="wait">
        {stage === 'opening' && !showInput && (
          <motion.div
            key="title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <h1 className="text-6xl font-bold tracking-tight text-primary">
              <TypingEffect 
                text="J.A.R.V.I.S." 
                speed={60} 
                cursor={false}
                onComplete={() => setTitleComplete(true)}
              />
            </h1>
            
            {titleComplete && (
              <>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-xl text-muted-foreground mt-4"
                >
                  Let&apos;s get to know you.
                </motion.p>
                
                <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 0.3, scaleX: 1 }}
                  transition={{ delay: 1.4 }}
                  className="w-48 h-px bg-primary mx-auto mt-6"
                />
              </>
            )}
          </motion.div>
        )}

        {(stage === 'opening' && showInput) || stage === 'questions' ? (
          <motion.div
            key="questions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-2xl space-y-8"
          >
            {/* Previous questions stack */}
            <div className="space-y-3">
              {answers.slice(0, currentQuestion).map((answer, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0.2 }}
                  animate={{ opacity: 0.2 }}
                  className="text-sm text-muted-foreground"
                >
                  <span className="text-primary mr-2">●</span>
                  {QUESTIONS[i]}
                </motion.div>
              ))}
            </div>

            {/* Current question */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion}
                variants={questionTransition}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
                onAnimationComplete={() => {
                  if (stage === 'opening') setStage('questions')
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-primary mt-1">●</span>
                  <p className="text-lg text-foreground leading-relaxed">
                    {QUESTIONS[currentQuestion]}
                  </p>
                </div>

                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="..."
                    className="w-full bg-transparent border-0 border-b border-border/50 focus:border-primary transition-colors duration-300 resize-none min-h-[60px] outline-none text-foreground placeholder:text-muted-foreground/50 pb-2"
                    rows={2}
                  />
                  
                  {inputValue.trim() && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      onClick={handleSubmit}
                      className="absolute right-2 bottom-4 p-2 text-primary hover:text-primary/80"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </motion.button>
                  )}
                </div>

                {/* Hybrid chips for specific questions */}
                {HYBRID_CHIPS[currentQuestion] && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-wrap gap-2"
                  >
                    {HYBRID_CHIPS[currentQuestion].map((chip) => (
                      <Badge
                        key={chip}
                        variant="outline"
                        className={cn(
                          "cursor-pointer border-primary/30 hover:bg-primary/10 transition-colors px-3 py-1.5",
                          inputValue === chip && "bg-primary/10 border-primary"
                        )}
                        onClick={() => handleChipClick(chip)}
                      >
                        {chip}
                      </Badge>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        ) : null}

        {stage === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-6"
          >
            <ThinkingDots className="justify-center" size={8} />
            <motion.p
              key={processingText}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-muted-foreground"
            >
              {processingText}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar at bottom */}
      {stage !== 'processing' && showInput && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-0 left-0 right-0 h-0.5 bg-primary/30"
        >
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
      )}
    </div>
  )
}
