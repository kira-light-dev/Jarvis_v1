'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { format, differenceInDays, formatDistanceToNow } from 'date-fns'
import {
  BookOpen,
  Target,
  Calendar,
  Flame,
  ArrowRight,
  Zap,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TypingEffect } from '@/components/motion'
import { useUserStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { pageVariants, cardItem, springConfig } from '@/lib/animations'
import { BarChart, Bar, ResponsiveContainer } from 'recharts'

interface Stats {
  dsa: {
    total: number
    completed: number
    inProgress: number
    dueToday: number
  }
  goals: {
    total: number
    completed: number
    active: number
    xpThisWeek: number
  }
  exams: {
    upcoming: number
    nextInDays: number
    nextSubject: string
  }
}

// Simple useCountUp hook
function useCountUp(target: number, duration = 1000) {
  const [count, setCount] = useState(0)
  const startTime = useRef<number | null>(null)
  
  useEffect(() => {
    if (target === 0) {
      setCount(0)
      return
    }
    
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp
      const progress = Math.min((timestamp - startTime.current) / duration, 1)
      setCount(Math.floor(progress * target))
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setCount(target)
      }
    }
    
    requestAnimationFrame(animate)
    
    return () => {
      startTime.current = null
    }
  }, [target, duration])
  
  return count
}

function getGreetingMessage(name: string, mood?: string, timeOfDay?: string) {
  const isMorning = timeOfDay === 'morning'
  const isEvening = timeOfDay === 'evening'
  
  if (mood === 'overwhelmed' || mood === 'anxious') {
    if (isMorning) return `Good morning, ${name}. Let's make sense of today together.`
    return `Hey, ${name}. You're here. That's what matters.`
  }
  
  if (mood === 'driven' || mood === 'focused') {
    if (isMorning) return `Good morning, ${name}. You're ready.`
    if (isEvening) return `Still going, ${name}. Good.`
    return `Good ${timeOfDay}, ${name}. Let's do this.`
  }
  
  return `Good ${timeOfDay}, ${name}.`
}

export default function DashboardPage() {
  const user = useUserStore((state) => state.user)
  const [stats, setStats] = useState<Stats>({
    dsa: { total: 0, completed: 0, inProgress: 0, dueToday: 0 },
    goals: { total: 0, completed: 0, active: 0, xpThisWeek: 0 },
    exams: { upcoming: 0, nextInDays: 0, nextSubject: '' },
  })
  const [insights, setInsights] = useState<string[]>([])
  const [recentActivity, setRecentActivity] = useState<{ type: string; title: string; date: Date }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [streakData, setStreakData] = useState<{ day: string; value: number }[]>([])

  const totalXP = user?.totalXP || 0
  const streak = user?.streak || 0
  const level = Math.floor(totalXP / 500) + 1
  const currentMood = user?.characterDNA?.currentMood || 'neutral'

  const hour = new Date().getHours()
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const greeting = getGreetingMessage(user?.name?.split(' ')[0] || 'Student', currentMood, timeOfDay)

  const dsaMastered = useCountUp(stats.dsa.completed)
  const goalsActive = useCountUp(stats.goals.active)
  const examsUpcoming = useCountUp(stats.exams.upcoming)
  const streakDays = useCountUp(streak)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
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
      
      // Calculate due today for DSA (SM-2)
      const dueToday = dsaData.filter((p: { nextReview?: string }) => {
        if (!p.nextReview) return false
        return p.nextReview.split('T')[0] <= today
      }).length

      const upcomingExams = examsData
        .filter((e: { date: string }) => new Date(e.date) >= now)
        .sort((a: { date: string }, b: { date: string }) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        )

      const nextExam = upcomingExams[0]

      setStats({
        dsa: {
          total: dsaData.length,
          completed: dsaData.filter((p: { status: string }) => p.status === 'completed').length,
          inProgress: dsaData.filter((p: { status: string }) => p.status === 'in-progress').length,
          dueToday,
        },
        goals: {
          total: goalsData.length,
          completed: goalsData.filter((g: { status: string }) => g.status === 'completed').length,
          active: goalsData.filter((g: { status: string }) => g.status === 'active').length,
          xpThisWeek: 150, // Placeholder - would need to track this
        },
        exams: {
          upcoming: upcomingExams.length,
          nextInDays: nextExam ? differenceInDays(new Date(nextExam.date), now) : 0,
          nextSubject: nextExam?.subject || '',
        },
      })

      // Generate insights
      const newInsights: string[] = []
      
      // DSA insight
      const oldProblems = dsaData.filter((p: { updatedAt: string; topic: string }) => {
        const daysSince = differenceInDays(now, new Date(p.updatedAt))
        return daysSince >= 7
      })
      if (oldProblems.length > 0) {
        const topic = oldProblems[0].topic
        const days = differenceInDays(now, new Date(oldProblems[0].updatedAt))
        newInsights.push(`You haven't touched ${topic} in ${days} days. The algorithm says it's fading.`)
      }
      
      // Exam insight
      if (nextExam && differenceInDays(new Date(nextExam.date), now) <= 5) {
        const examDays = differenceInDays(new Date(nextExam.date), now)
        newInsights.push(`Your ${nextExam.subject} exam is in ${examDays} days and prep is at ${nextExam.preparationStatus || 0}%.`)
      }
      
      // Streak insight
      if (streak > 0) {
        newInsights.push(`You've shown up ${streak} days in a row. Don't break it today.`)
      }
      
      setInsights(newInsights)

      // Create recent activity
      const activity = [
        ...dsaData.slice(0, 3).map((p: { title: string; updatedAt: string }) => ({
          type: 'dsa',
          title: p.title,
          date: new Date(p.updatedAt),
        })),
        ...goalsData.slice(0, 2).map((g: { title: string; updatedAt: string }) => ({
          type: 'goal',
          title: g.title,
          date: new Date(g.updatedAt),
        })),
      ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5)

      setRecentActivity(activity)

      // Generate streak data for chart
      const weekData = Array.from({ length: 7 }, (_, i) => ({
        day: `D${i + 1}`,
        value: Math.random() > 0.3 ? Math.floor(Math.random() * 100) + 20 : 0,
      }))
      setStreakData(weekData)

    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div 
      className="flex h-full flex-col p-4 md:p-6 space-y-6"
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          <TypingEffect text={greeting} speed={30} cursor={false} />
        </h1>
        
        {/* Streak & XP Row */}
        <div className="flex items-center gap-3 mt-3 text-sm font-mono text-muted-foreground">
          <span className="flex items-center gap-1 text-orange-500">
            <Flame className="h-4 w-4" />
            {streak} day streak
          </span>
          <span className="text-muted-foreground/30">·</span>
          <span className="flex items-center gap-1 text-primary">
            <Zap className="h-4 w-4" />
            {totalXP} XP
          </span>
          <span className="text-muted-foreground/30">·</span>
          <span>Level {level}</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <motion.div variants={cardItem} initial="initial" animate="animate">
          <Card className="glass-panel border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">DSA</CardTitle>
              <BookOpen className="h-8 w-8 text-primary/40" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono text-primary">{dsaMastered}</div>
              <p className="text-xs text-muted-foreground">mastered</p>
              {stats.dsa.dueToday > 0 && (
                <p className="text-xs text-destructive mt-1">{stats.dsa.dueToday} due today</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardItem} initial="initial" animate="animate" transition={{ delay: 0.1 }}>
          <Card className="glass-panel border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Goals</CardTitle>
              <Target className="h-8 w-8 text-primary/40" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono text-primary">{goalsActive}</div>
              <p className="text-xs text-muted-foreground">active</p>
              <p className="text-xs text-primary/70 mt-1 flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {stats.goals.xpThisWeek} this week
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardItem} initial="initial" animate="animate" transition={{ delay: 0.2 }}>
          <Card className="glass-panel border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Exams</CardTitle>
              <Calendar className="h-8 w-8 text-primary/40" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono text-primary">{examsUpcoming}</div>
              <p className="text-xs text-muted-foreground">upcoming</p>
              {stats.exams.nextSubject && (
                <p className="text-xs text-muted-foreground mt-1">
                  Next in {stats.exams.nextInDays} days
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardItem} initial="initial" animate="animate" transition={{ delay: 0.3 }}>
          <Card className="glass-panel border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Streak</CardTitle>
              <Flame className="h-8 w-8 text-orange-500/40" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono text-primary">{streakDays}</div>
              <p className="text-xs text-muted-foreground">days</p>
              <div className="h-12 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={streakData}>
                    <Bar dataKey="value" fill="var(--primary)" radius={2} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Pattern Insights */}
        <motion.div variants={cardItem} initial="initial" animate="animate" transition={{ delay: 0.4 }}>
          <div className="space-y-3">
            <h3 className="text-xs tracking-widest text-muted-foreground uppercase">
              What I&apos;ve noticed
            </h3>
            {insights.length === 0 ? (
              <div className="glass-panel border border-border/50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground italic">
                  Complete more tasks to generate insights.
                </p>
              </div>
            ) : (
              insights.map((insight, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="glass-panel border border-border/50 p-3 rounded-lg flex items-start gap-3"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <p className="text-sm text-muted-foreground">{insight}</p>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={cardItem} initial="initial" animate="animate" transition={{ delay: 0.5 }}>
          <div className="space-y-3">
            <h3 className="text-xs tracking-widest text-muted-foreground uppercase">Recent</h3>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-lg bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No recent activity</p>
                <p className="text-sm">Start tracking your progress!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((activity, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50"
                  >
                    <div className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center',
                      activity.type === 'dsa' 
                        ? 'bg-blue-500/10 text-blue-500'
                        : 'bg-purple-500/10 text-purple-500'
                    )}>
                      {activity.type === 'dsa' ? (
                        <BookOpen className="h-4 w-4" />
                      ) : (
                        <Target className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.type === 'dsa' ? 'DSA Problem' : 'Goal'}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDistanceToNow(activity.date, { addSuffix: true })}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={cardItem} initial="initial" animate="animate" transition={{ delay: 0.6 }}>
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Link href="/chat">
              <Button variant="outline" className="w-full justify-between hover:bg-primary/10 hover:border-primary/50">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  Chat with J.A.R.V.I.S.
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/focus">
              <Button variant="outline" className="w-full justify-between hover:bg-primary/10 hover:border-primary/50">
                <span>Enter Focus Mode</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dsa">
              <Button variant="outline" className="w-full justify-between hover:bg-primary/10 hover:border-primary/50">
                <span>Track DSA Problem</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/goals">
              <Button variant="outline" className="w-full justify-between hover:bg-primary/10 hover:border-primary/50">
                <span>New Quest</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
