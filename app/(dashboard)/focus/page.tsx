'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThinkingDots } from '@/components/motion'
import { useUserStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface FocusTask {
  type: 'exam' | 'dsa' | 'goal' | 'chat'
  id?: string
  title: string
  subtitle?: string
}

export default function FocusPage() {
  const router = useRouter()
  const addXP = useUserStore((state) => state.addXP)
  const [task, setTask] = useState<FocusTask | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)
  const [showCheckmark, setShowCheckmark] = useState(false)

  useEffect(() => {
    fetchPriorityTask()
  }, [])

  const fetchPriorityTask = async () => {
    try {
      // Fetch all data to determine priority
      const [dsaRes, goalsRes, examsRes] = await Promise.all([
        fetch('/api/dsa'),
        fetch('/api/goals'),
        fetch('/api/exams'),
      ])

      const [dsaData, goalsData, examsData] = await Promise.all([
        dsaRes.json(),
        goalsRes.json(),
        examsRes.json(),
      ])

      const now = new Date()
      const today = now.toISOString().split('T')[0]

      // Priority 1: Exam milestone due today
      const urgentExam = examsData.find((e: { date: string; milestones?: { completed: boolean; topic: string }[] }) => {
        if (!e.milestones) return false
        const examDate = new Date(e.date)
        if (examDate < now) return false
        return e.milestones.some((m) => !m.completed)
      })

      if (urgentExam && urgentExam.milestones) {
        const milestone = urgentExam.milestones.find((m: { completed: boolean }) => !m.completed)
        if (milestone) {
          setTask({
            type: 'exam',
            id: urgentExam._id,
            title: milestone.topic,
            subtitle: `Exam prep for ${urgentExam.subject}`,
          })
          setIsLoading(false)
          return
        }
      }

      // Priority 2: DSA problem due for review today
      const dueDSA = dsaData.find((p: { nextReview?: string }) => {
        if (!p.nextReview) return false
        return p.nextReview.split('T')[0] <= today
      })

      if (dueDSA) {
        setTask({
          type: 'dsa',
          id: dueDSA._id,
          title: dueDSA.title,
          subtitle: 'Spaced repetition review',
        })
        setIsLoading(false)
        return
      }

      // Priority 3: First incomplete goal subtask
      const activeGoal = goalsData.find((g: { status: string; milestones?: { completed: boolean; title: string }[] }) => {
        if (g.status !== 'active') return false
        return g.milestones?.some((m: { completed: boolean }) => !m.completed)
      })

      if (activeGoal && activeGoal.milestones) {
        const subtask = activeGoal.milestones.find((m: { completed: boolean }) => !m.completed)
        if (subtask) {
          setTask({
            type: 'goal',
            id: activeGoal._id,
            title: subtask.title,
            subtitle: activeGoal.title,
          })
          setIsLoading(false)
          return
        }
      }

      // Priority 4: Talk to JARVIS
      setTask({
        type: 'chat',
        title: 'Talk to JARVIS',
        subtitle: 'Check in and plan your day',
      })
      setIsLoading(false)

    } catch (error) {
      console.error('Failed to fetch priority task:', error)
      setTask({
        type: 'chat',
        title: 'Talk to JARVIS',
        subtitle: 'Something went wrong, but I am here',
      })
      setIsLoading(false)
    }
  }

  const handleComplete = async () => {
    if (!task) return
    
    setIsCompleting(true)
    
    // Add XP based on task type
    const xpReward = task.type === 'exam' ? 25 : task.type === 'dsa' ? 15 : task.type === 'goal' ? 10 : 5
    addXP(xpReward)
    
    // Mark as complete in API if applicable
    if (task.type === 'dsa' && task.id) {
      try {
        await fetch('/api/dsa', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id: task.id, 
            status: 'completed',
            lastReviewedAt: new Date().toISOString()
          }),
        })
      } catch (error) {
        console.error('Failed to mark DSA complete:', error)
      }
    }

    // Show completion animation
    await new Promise(resolve => setTimeout(resolve, 500))
    setShowCheckmark(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    router.push('/chat')
  }

  const handleNotNow = () => {
    router.back()
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-8 z-50">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <ThinkingDots size={8} />
            <p className="text-muted-foreground mt-4">Finding your focus...</p>
          </motion.div>
        ) : isCompleting ? (
          <motion.div
            key="completing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center"
          >
            {showCheckmark ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="mx-auto w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4"
              >
                <Check className="h-10 w-10 text-green-500" />
              </motion.div>
            ) : (
              <ThinkingDots size={8} />
            )}
            <p className="text-muted-foreground mt-4">
              {showCheckmark ? 'Well done!' : 'Completing...'}
            </p>
          </motion.div>
        ) : task ? (
          <motion.div
            key="task"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center max-w-md"
          >
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-6">
              Right now:
            </p>
            
            <h1 className="text-3xl font-semibold text-foreground mb-2">
              {task.title}
            </h1>
            
            {task.subtitle && (
              <p className="text-muted-foreground mb-12">
                {task.subtitle}
              </p>
            )}
            
            <div className="space-y-4">
              <Button
                size="lg"
                onClick={handleComplete}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg rounded-xl"
              >
                <Check className="h-5 w-5 mr-2" />
                Done
              </Button>
              
              <div>
                <button
                  onClick={handleNotNow}
                  className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  Not now
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
