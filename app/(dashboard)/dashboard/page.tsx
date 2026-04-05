'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { format, differenceInDays } from 'date-fns'
import {
  BookOpen,
  Target,
  Calendar,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Clock,
  Zap,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion'
import { useUserStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface Stats {
  dsa: {
    total: number
    completed: number
    inProgress: number
  }
  goals: {
    total: number
    completed: number
    active: number
  }
  exams: {
    upcoming: number
    urgent: number
  }
}

export default function DashboardPage() {
  const user = useUserStore((state) => state.user)
  const [stats, setStats] = useState<Stats>({
    dsa: { total: 0, completed: 0, inProgress: 0 },
    goals: { total: 0, completed: 0, active: 0 },
    exams: { upcoming: 0, urgent: 0 },
  })
  const [recentActivity, setRecentActivity] = useState<{ type: string; title: string; date: Date }[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
      const upcomingExams = examsData.filter((e: { date: string }) => new Date(e.date) >= now)
      const urgentExams = upcomingExams.filter((e: { date: string }) => 
        differenceInDays(new Date(e.date), now) <= 3
      )

      setStats({
        dsa: {
          total: dsaData.length,
          completed: dsaData.filter((p: { status: string }) => p.status === 'completed').length,
          inProgress: dsaData.filter((p: { status: string }) => p.status === 'in-progress').length,
        },
        goals: {
          total: goalsData.length,
          completed: goalsData.filter((g: { status: string }) => g.status === 'completed').length,
          active: goalsData.filter((g: { status: string }) => g.status === 'active').length,
        },
        exams: {
          upcoming: upcomingExams.length,
          urgent: urgentExams.length,
        },
      })

      // Create recent activity from all data
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
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const dsaProgress = stats.dsa.total > 0 
    ? Math.round((stats.dsa.completed / stats.dsa.total) * 100) 
    : 0

  return (
    <div className="flex h-full flex-col p-4 md:p-6 space-y-6">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">
              Welcome back, {user?.name?.split(' ')[0] || 'Student'}
            </h1>
            <p className="text-muted-foreground">
              Here is your progress overview
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </div>
        </div>
      </FadeIn>

      <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" staggerDelay={0.1}>
        <StaggerItem>
          <Card className="glass-panel border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                DSA Problems
              </CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.dsa.completed}/{stats.dsa.total}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.dsa.inProgress} in progress
              </p>
              <Progress value={dsaProgress} className="mt-2 h-1" />
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="glass-panel border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Goals
              </CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.goals.active}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.goals.completed} completed
              </p>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="glass-panel border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Upcoming Exams
              </CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.exams.upcoming}
              </div>
              {stats.exams.urgent > 0 && (
                <p className="text-xs text-destructive">
                  {stats.exams.urgent} within 3 days
                </p>
              )}
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="glass-panel border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Progress Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {dsaProgress}%
              </div>
              <p className="text-xs text-muted-foreground">
                Overall completion
              </p>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      <div className="grid gap-6 md:grid-cols-2">
        <FadeIn delay={0.3}>
          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/chat">
                <Button variant="outline" className="w-full justify-between hover:bg-primary/10 hover:border-primary/50">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    Chat with J.A.R.V.I.S.
                  </span>
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
                  <span>Set New Goal</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/exams">
                <Button variant="outline" className="w-full justify-between hover:bg-primary/10 hover:border-primary/50">
                  <span>Schedule Exam</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.4}>
          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
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
                <div className="space-y-3">
                  {recentActivity.map((activity, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
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
                        {format(activity.date, 'MMM d')}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {user?.targetCompanies && user.targetCompanies.length > 0 && (
        <FadeIn delay={0.5}>
          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">
                Target Companies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {user.targetCompanies.map((company) => (
                  <Badge
                    key={company}
                    variant="outline"
                    className="bg-primary/10 text-primary border-primary/30"
                  >
                    {company}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}
    </div>
  )
}
