'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { format, formatDistanceToNow } from 'date-fns'
import {
  Plus,
  Target,
  Calendar,
  CheckCircle2,
  Circle,
  MoreVertical,
  Trash2,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion'
import { cn } from '@/lib/utils'
import type { GoalType, GoalStatus } from '@/lib/models/Goal'

interface Goal {
  _id: string
  title: string
  description?: string
  type: GoalType
  status: GoalStatus
  targetDate: Date
  progress: number
  milestones: {
    title: string
    completed: boolean
  }[]
}

const goalTypeColors = {
  daily: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  weekly: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
  monthly: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
  semester: 'bg-pink-500/10 text-pink-500 border-pink-500/30',
}

const goalTypeLabels = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  semester: 'Semester',
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<GoalType | 'all'>('all')
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    type: 'daily' as GoalType,
    targetDate: '',
    milestones: [''],
  })

  useEffect(() => {
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    try {
      const res = await fetch('/api/goals')
      const data = await res.json()
      setGoals(data.map((g: Goal) => ({
        ...g,
        targetDate: new Date(g.targetDate),
      })))
    } catch (error) {
      console.error('Failed to fetch goals:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddGoal = async () => {
    if (!newGoal.title.trim() || !newGoal.targetDate) return

    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user',
          title: newGoal.title,
          description: newGoal.description,
          type: newGoal.type,
          status: 'active',
          targetDate: new Date(newGoal.targetDate),
          progress: 0,
          milestones: newGoal.milestones
            .filter((m) => m.trim())
            .map((m) => ({ title: m, completed: false })),
        }),
      })
      const data = await res.json()
      setGoals((prev) => [{ ...data, targetDate: new Date(data.targetDate) }, ...prev])
      setNewGoal({
        title: '',
        description: '',
        type: 'daily',
        targetDate: '',
        milestones: [''],
      })
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error('Failed to add goal:', error)
    }
  }

  const handleToggleMilestone = async (goalId: string, milestoneIndex: number) => {
    const goal = goals.find((g) => g._id === goalId)
    if (!goal) return

    const updatedMilestones = goal.milestones.map((m, i) =>
      i === milestoneIndex ? { ...m, completed: !m.completed } : m
    )
    const completedCount = updatedMilestones.filter((m) => m.completed).length
    const progress = Math.round((completedCount / updatedMilestones.length) * 100)

    setGoals((prev) =>
      prev.map((g) =>
        g._id === goalId
          ? { ...g, milestones: updatedMilestones, progress }
          : g
      )
    )

    try {
      await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: goalId,
          milestones: updatedMilestones,
          progress,
          status: progress === 100 ? 'completed' : 'active',
        }),
      })
    } catch (error) {
      console.error('Failed to update milestone:', error)
      fetchGoals()
    }
  }

  const handleDeleteGoal = async (id: string) => {
    setGoals((prev) => prev.filter((g) => g._id !== id))
    try {
      await fetch(`/api/goals?id=${id}`, { method: 'DELETE' })
    } catch (error) {
      console.error('Failed to delete goal:', error)
      fetchGoals()
    }
  }

  const addMilestoneField = () => {
    setNewGoal((prev) => ({
      ...prev,
      milestones: [...prev.milestones, ''],
    }))
  }

  const updateMilestone = (index: number, value: string) => {
    setNewGoal((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m, i) => (i === index ? value : m)),
    }))
  }

  const filteredGoals = activeTab === 'all'
    ? goals
    : goals.filter((g) => g.type === activeTab)

  const stats = {
    total: goals.length,
    completed: goals.filter((g) => g.status === 'completed').length,
    active: goals.filter((g) => g.status === 'active').length,
  }

  return (
    <div className="flex h-full flex-col p-4 md:p-6">
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">Goals</h1>
            <p className="text-muted-foreground">
              Track your academic and career objectives
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex gap-2 text-sm">
              <Badge variant="outline" className="bg-card">
                {stats.active} active
              </Badge>
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                {stats.completed} completed
              </Badge>
            </div>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  New Goal
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-panel border-border/50 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Goal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Goal Title</Label>
                    <Input
                      value={newGoal.title}
                      onChange={(e) =>
                        setNewGoal({ ...newGoal, title: e.target.value })
                      }
                      placeholder="e.g., Master Binary Trees"
                      className="bg-input border-border/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description (optional)</Label>
                    <Textarea
                      value={newGoal.description}
                      onChange={(e) =>
                        setNewGoal({ ...newGoal, description: e.target.value })
                      }
                      placeholder="Add more details..."
                      className="bg-input border-border/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Goal Type</Label>
                      <Select
                        value={newGoal.type}
                        onValueChange={(value) =>
                          setNewGoal({ ...newGoal, type: value as GoalType })
                        }
                      >
                        <SelectTrigger className="bg-input border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="semester">Semester</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Target Date</Label>
                      <Input
                        type="date"
                        value={newGoal.targetDate}
                        onChange={(e) =>
                          setNewGoal({ ...newGoal, targetDate: e.target.value })
                        }
                        className="bg-input border-border/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Milestones</Label>
                    {newGoal.milestones.map((milestone, index) => (
                      <Input
                        key={index}
                        value={milestone}
                        onChange={(e) => updateMilestone(index, e.target.value)}
                        placeholder={`Milestone ${index + 1}`}
                        className="bg-input border-border/50"
                      />
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addMilestoneField}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Milestone
                    </Button>
                  </div>

                  <Button
                    onClick={handleAddGoal}
                    className="w-full bg-primary text-primary-foreground"
                    disabled={!newGoal.title.trim() || !newGoal.targetDate}
                  >
                    Create Goal
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </FadeIn>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as GoalType | 'all')}>
        <TabsList className="mb-6 bg-secondary/50">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="semester">Semester</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-48 rounded-xl bg-muted/50 animate-pulse"
                />
              ))}
            </div>
          ) : filteredGoals.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground">No goals yet</h3>
              <p className="text-muted-foreground">
                Create your first goal to get started
              </p>
            </div>
          ) : (
            <StaggerContainer className="grid gap-4 md:grid-cols-2" staggerDelay={0.05}>
              {filteredGoals.map((goal) => (
                <StaggerItem key={goal._id}>
                  <GoalCard
                    goal={goal}
                    onToggleMilestone={handleToggleMilestone}
                    onDelete={handleDeleteGoal}
                  />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function GoalCard({
  goal,
  onToggleMilestone,
  onDelete,
}: {
  goal: Goal
  onToggleMilestone: (goalId: string, milestoneIndex: number) => void
  onDelete: (id: string) => void
}) {
  const isOverdue = new Date(goal.targetDate) < new Date() && goal.status !== 'completed'

  return (
    <motion.div
      layout
      className={cn(
        'rounded-xl glass-panel border p-4 space-y-4',
        goal.status === 'completed'
          ? 'border-green-500/30'
          : isOverdue
          ? 'border-destructive/30'
          : 'border-border/50'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={goalTypeColors[goal.type]}>
              {goalTypeLabels[goal.type]}
            </Badge>
            {goal.status === 'completed' && (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                Completed
              </Badge>
            )}
            {isOverdue && (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                Overdue
              </Badge>
            )}
          </div>
          <h3 className="font-semibold text-foreground">{goal.title}</h3>
          {goal.description && (
            <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(goal._id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium text-foreground">{goal.progress}%</span>
        </div>
        <Progress value={goal.progress} className="h-2" />
      </div>

      {goal.milestones.length > 0 && (
        <div className="space-y-2">
          {goal.milestones.map((milestone, index) => (
            <button
              key={index}
              onClick={() => onToggleMilestone(goal._id, index)}
              className="flex items-center gap-2 w-full text-left text-sm hover:bg-secondary/50 rounded p-1 -ml-1"
            >
              {milestone.completed ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span
                className={cn(
                  milestone.completed
                    ? 'text-muted-foreground line-through'
                    : 'text-foreground'
                )}
              >
                {milestone.title}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
        <Clock className="h-3 w-3" />
        <span>
          {isOverdue
            ? `Overdue by ${formatDistanceToNow(goal.targetDate)}`
            : `Due ${formatDistanceToNow(goal.targetDate, { addSuffix: true })}`}
        </span>
        <span className="text-border">|</span>
        <Calendar className="h-3 w-3" />
        <span>{format(goal.targetDate, 'MMM d, yyyy')}</span>
      </div>
    </motion.div>
  )
}
