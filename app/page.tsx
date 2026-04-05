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

// Chips for ALL questions
const QUESTION_CHIPS: Record<number, string[]> = {
  0: ["Reading / building things", "Doom-scrolling honestly", "Gaming or music", "Thinking too much"],
  1: ["My family's expectations", "Not living up to my potential", "A goal I keep postponing", "I'd rather type this"],
  2: ["Push harder", "Go quiet", "Spiral a bit", "Depends completely"],
  3: ["Deep focus, no interruptions", "Being outside, moving", "Creating something", "Just... rest"],
  4: ["Start working out", "Build something", "Learn a skill properly", "Read more"],
  5: ["Got placed at a good company", "Built something people use", "Figured out who I am", "Something else"],
  6: ["It teaches me", "It breaks me first, then teaches", "I avoid it honestly", "Both depending on the day"],
  7: ["Panic then hyperfocus", "Give up and sleep", "Ask for help", "Power through somehow"],
  8: ["Someone to just listen", "Honest advice, no sugarcoating", "A push when I'm slacking", "Space to figure it out"],
  9: ["Tired", "Okay", "Anxious", "Actually good"]
}

// Placeholder hints per question
const PLACEHOLDER_HINTS: Record<number, string> = {
  0: "or describe it in your own words...",
  1: "safe to be honest here...",
  2: "or describe what actually happens...",
  3: "or write anything...",
  4: "or write anything...",
  5: "or write anything...",
  6: "or write anything...",
  7: "or write anything...",
  8: "or write anything...",
  9: "or write anything..."
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
  const [initializingVisible, setInitializingVisible] = useState(false)
  const [lineDrawn, setLineDrawn] = useState(false)
  const [subtitleVisible, setSubtitleVisible] = useState(false)
  const [selectedChip, setSelectedChip] = useState<string | null>(null)
  const [processingText, setProcessingText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const chipSubmitTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isOnboarded) {
      router.push('/chat')
    }
  }, [isOnboarded, router])

  // Boot sequence animation
  useEffect(() => {
    if (titleComplete) {
      // Show INITIALIZING after JARVIS finishes
      const initTimer = setTimeout(() => setInitializingVisible(true), 200)
      // Draw line after INITIALIZING
      const lineTimer = setTimeout(() => setLineDrawn(true), 800)
      // Show subtitle after line
      const subtitleTimer = setTimeout(() => setSubtitleVisible(true), 1200)
      // Show input after everything
      const inputTimer = setTimeout(() => setShowInput(true), 2000)
      
      return () => {
        clearTimeout(initTimer)
        clearTimeout(lineTimer)
        clearTimeout(subtitleTimer)
        clearTimeout(inputTimer)
      }
    }
  }, [titleComplete])

  useEffect(() => {
    if (showInput && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [showInput, currentQuestion])

  // Cleanup chip submit timer on unmount
  useEffect(() => {
    return () => {
      if (chipSubmitTimerRef.current) {
        clearTimeout(chipSubmitTimerRef.current)
      }
    }
  }, [])

  const handleSubmit = () => {
    // Textarea value takes priority, then selected chip
    const valueToSubmit = inputValue.trim() || selectedChip
    if (!valueToSubmit) return
    
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = valueToSubmit
    setAnswers(newAnswers)
    setInputValue('')
    setSelectedChip(null)
    
    if (currentQuestion < 9) {
      setCurrentQuestion(prev => prev + 1)
    } else {
      setStage('processing')
      processOnboarding(newAnswers)
    }
  }

  const handleChipClick = (chip: string) => {
    // Clear any existing timer
    if (chipSubmitTimerRef.current) {
      clearTimeout(chipSubmitTimerRef.current)
    }
    
    setSelectedChip(chip)
    setInputValue(chip)
    
    // Auto-submit after 500ms
    chipSubmitTimerRef.current = setTimeout(() => {
      const newAnswers = [...answers]
      newAnswers[currentQuestion] = chip
      setAnswers(newAnswers)
      setInputValue('')
      setSelectedChip(null)
      
      if (currentQuestion < 9) {
        setCurrentQuestion(prev => prev + 1)
      } else {
        setStage('processing')
        processOnboarding(newAnswers)
      }
    }, 500)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      // Clear chip timer if user presses enter
      if (chipSubmitTimerRef.current) {
        clearTimeout(chipSubmitTimerRef.current)
      }
      handleSubmit()
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
    // Clear chip selection and timer when user types
    if (chipSubmitTimerRef.current) {
      clearTimeout(chipSubmitTimerRef.current)
    }
    if (e.target.value !== selectedChip) {
      setSelectedChip(null)
    }
  }

  const processOnboarding = async (finalAnswers: string[]) => {
    setProcessingText('Getting to know you...')
    
    await new Promise(resolve => setTimeout(resolve, 1500))
    setProcessingText('Building your profile...')
    
    // Create basic user profile
    const userProfile: UserProfile = {
      id: Date.now().toString(),
      name: 'Student',
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
            {/* Elegant JARVIS logo treatment */}
            <h1 className="text-7xl font-thin tracking-[0.3em] text-primary">
              <TypingEffect 
                text="JARVIS" 
                speed={80} 
                cursor={false}
                onComplete={() => setTitleComplete(true)}
              />
            </h1>
            
            {/* Thin horizontal rule - draws from center */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ 
                scaleX: lineDrawn ? 1 : 0, 
                opacity: lineDrawn ? 0.3 : 0 
              }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="w-16 h-px bg-primary mx-auto mt-4 origin-center"
            />
            
            {/* INITIALIZING text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: initializingVisible ? 0.5 : 0 }}
              transition={{ duration: 0.6 }}
              className="text-xs tracking-[0.4em] uppercase text-muted-foreground/50 mt-3"
            >
              INITIALIZING
            </motion.p>
            
            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: subtitleVisible ? 1 : 0,
                y: subtitleVisible ? 0 : 10
              }}
              transition={{ duration: 0.5 }}
              className="text-xl text-muted-foreground mt-6"
            >
              Let&apos;s get to know you.
            </motion.p>
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

                {/* Option Chips - above textarea */}
                {QUESTION_CHIPS[currentQuestion] && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-wrap gap-2"
                  >
                    {QUESTION_CHIPS[currentQuestion].map((chip) => (
                      <Badge
                        key={chip}
                        variant="outline"
                        className={cn(
                          "cursor-pointer border-primary/20 bg-transparent hover:bg-primary/10 hover:border-primary/50",
                          "text-xs text-muted-foreground hover:text-primary rounded-full px-3 py-1.5",
                          "transition-all duration-200 ease-in-out",
                          selectedChip === chip && "bg-primary/20 border-primary scale-95 text-primary"
                        )}
                        onClick={() => handleChipClick(chip)}
                      >
                        {chip}
                      </Badge>
                    ))}
                  </motion.div>
                )}

                {/* Textarea - below chips */}
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder={PLACEHOLDER_HINTS[currentQuestion] || "..."}
                    className="w-full bg-transparent border-0 border-b border-border/30 focus:border-primary transition-colors duration-300 resize-none min-h-[60px] outline-none text-foreground placeholder:text-muted-foreground/50 pb-2"
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
