'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, formatDistanceToNow } from 'date-fns'
import {
  Plus,
  BookOpen,
  User,
  Briefcase,
  Dumbbell,
  Check,
  Circle,
  MoreVertical,
  Trash2,
  Clock,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { FadeIn } from '@/components/motion'
import { useUserStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { pageVariants, springConfig, cardItem } from '@/lib/animations'
import type { GoalStatus } from '@/lib/models/Goal'

type GoalCategory = 'academic' | 'personal' | 'career' | 'fitness'

interface SubTask {
  id: string
  task: string
  done: boolean
}

interface Goal {
  _id: string
  title: string
  description?: string
  type: 'daily' | 'weekly' | 'monthly' | 'semester'
  status: GoalStatus
  targetDate: Date
  progress: number
  milestones: { title: string; completed: boolean }[]
  xpReward: number
  subTasks: SubTask[]
  category: GoalCategory
}

const categoryIcons = {
  academic: BookOpen,
  personal: User,
  career: Briefcase,
  fitness: Dumbbell,
}

const categoryLabels = {
  academic: 'Academic',
  personal: 'Personal',
  career: 'Career',
  fitness: 'Fitness',
}

export default function GoalsPage() {
  const user = useUserStore((state) => state.user)
  const addXP = useUserStore((state) => state.addXP)
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<GoalCategory | 'all'>('all')
  const [xpFloaters, setXpFloaters] = useState<{ id: string; x: number; y: number; amount: number }[]>([])
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'academic' as GoalCategory,
    targetDate: '',
    xpReward: 100,
    subTasks: [{ id: '1', task: '', done: false }],
  })

  const totalXP = user?.totalXP || 0
  const level = Math.floor(totalXP / 500) + 1
  const xpProgress = (totalXP % 500) / 500 * 100

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
        xpReward: g.xpReward ?? 100,
        subTasks: g.subTasks ?? g.milestones.map((m, i) => ({ 
          id: String(i), 
          task: m.title, 
          done: m.completed 
        })),
        category: g.category ?? 'academic',
      })))
    } catch (error) {
      console.error('Failed to fetch goals:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddGoal = async () => {
    if (!newGoal.title.trim() || !newGoal.targetDate) return

    const subTasksFiltered = newGoal.subTasks.filter(st => st.task.trim())

    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user',
          title: newGoal.title,
          description: newGoal.description,
          type: 'weekly',
          status: 'active',
          targetDate: new Date(newGoal.targetDate),
          progress: 0,
          milestones: subTasksFiltered.map(st => ({ title: st.task, completed: false })),
          xpReward: newGoal.xpReward,
          subTasks: subTasksFiltered,
          category: newGoal.category,
        }),
      })
      const data = await res.json()
      setGoals((prev) => [{ 
        ...data, 
        targetDate: new Date(data.targetDate),
        xpReward: newGoal.xpReward,
        subTasks: subTasksFiltered,
        category: newGoal.category,
      }, ...prev])
      setNewGoal({
        title: '',
        description: '',
        category: 'academic',
        targetDate: '',
        xpReward: 100,
        subTasks: [{ id: '1', task: '', done: false }],
      })
      setIsAddSheetOpen(false)
    } catch (error) {
      console.error('Failed to add goal:', error)
    }
  }

  const handleToggleSubTask = async (
    goalId: string, 
    subTaskId: string, 
    event: React.MouseEvent
  ) => {
    const goal = goals.find((g) => g._id === goalId)
    if (!goal) return

    const subTaskIndex = goal.subTasks.findIndex(st => st.id === subTaskId)
    if (subTaskIndex === -1) return

    const wasCompleted = goal.subTasks[subTaskIndex].done
    
    // Optimistic UI update
    const updatedSubTasks = goal.subTasks.map((st) =>
      st.id === subTaskId ? { ...st, done: !st.done } : st
    )
    const completedCount = updatedSubTasks.filter((st) => st.done).length
    const progress = Math.round((completedCount / updatedSubTasks.length) * 100)

    setGoals((prev) =>
      prev.map((g) =>
        g._id === goalId
          ? { ...g, subTasks: updatedSubTasks, progress }
          : g
      )
    )

    // Show XP floater if completing a task
    if (!wasCompleted) {
      const rect = (event.target as HTMLElement).getBoundingClientRect()
      const floaterId = Date.now().toString()
      setXpFloaters(prev => [...prev, { 
        id: floaterId, 
        x: rect.left + rect.width / 2, 
        y: rect.top,
        amount: 10
      }])
      addXP(10)
      
      setTimeout(() => {
        setXpFloaters(prev => prev.filter(f => f.id !== floaterId))
      }, 1000)
    }

    try {
      await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: goalId,
          milestones: updatedSubTasks.map(st => ({ title: st.task, completed: st.done })),
          progress,
          status: progress === 100 ? 'completed' : 'active',
        }),
      })
    } catch (error) {
      console.error('Failed to update subtask:', error)
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

  const addSubTaskField = () => {
    setNewGoal((prev) => ({
      ...prev,
      subTasks: [...prev.subTasks, { id: Date.now().toString(), task: '', done: false }],
    }))
  }

  const updateSubTask = (id: string, value: string) => {
    setNewGoal((prev) => ({
      ...prev,
      subTasks: prev.subTasks.map((st) => (st.id === id ? { ...st, task: value } : st)),
    }))
  }

  const filteredGoals = activeCategory === 'all'
    ? goals
    : goals.filter((g) => g.category === activeCategory)

  // Sort completed goals to the bottom
  const sortedGoals = [...filteredGoals].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1
    if (a.status !== 'completed' && b.status === 'completed') return -1
    return 0
  })

  return (
    <motion.div 
      className="flex h-full flex-col p-4 md:p-6"
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      {/* XP Floaters Portal */}
      <AnimatePresence>
        {xpFloaters.map((floater) => (
          <motion.div
            key={floater.id}
            initial={{ opacity: 1, y: 0, x: '-50%' }}
            animate={{ opacity: 0, y: -30 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="fixed text-primary font-mono text-sm font-bold pointer-events-none z-50"
            style={{ left: floater.x, top: floater.y }}
          >
            +{floater.amount} XP
          </motion.div>
        ))}
      </AnimatePresence>

      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary animate-text-glow">Quest Log</h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="font-mono text-sm text-primary flex items-center gap-1">
                <Zap className="h-4 w-4" />
                {totalXP} XP
              </span>
              <span className="text-xs text-muted-foreground">Level {level}</span>
            </div>
            <div className="w-48 mt-2">
              <motion.div 
                className="h-1 bg-primary/20 rounded-full overflow-hidden"
              >
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </motion.div>
            </div>
          </div>

          <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
            <SheetTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                New Quest
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="glass-panel border-border/50 h-[85vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Create New Quest</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label>Quest Title</Label>
                  <Input
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    placeholder="e.g., Master Binary Trees"
                    className="bg-input border-border/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                    placeholder="Add more details..."
                    className="bg-input border-border/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <div className="flex gap-2">
                    {(Object.keys(categoryIcons) as GoalCategory[]).map((cat) => {
                      const Icon = categoryIcons[cat]
                      return (
                        <Button
                          key={cat}
                          type="button"
                          variant={newGoal.category === cat ? 'default' : 'outline'}
                          size="icon"
                          onClick={() => setNewGoal({ ...newGoal, category: cat })}
                          className={cn(
                            newGoal.category === cat 
                              ? 'bg-primary text-primary-foreground' 
                              : 'border-border/50'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </Button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Target Date</Label>
                  <Input
                    type="date"
                    value={newGoal.targetDate}
                    onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                    className="bg-input border-border/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>XP Reward: {newGoal.xpReward}</Label>
                  <Slider
                    value={[newGoal.xpReward]}
                    onValueChange={([value]) => setNewGoal({ ...newGoal, xpReward: value })}
                    min={50}
                    max={500}
                    step={50}
                    className="py-2"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Sub-Tasks</Label>
                  {newGoal.subTasks.map((subTask, index) => (
                    <Input
                      key={subTask.id}
                      value={subTask.task}
                      onChange={(e) => updateSubTask(subTask.id, e.target.value)}
                      placeholder={`Sub-task ${index + 1}`}
                      className="bg-input border-border/50"
                    />
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSubTaskField}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Sub-Task
                  </Button>
                </div>

                <Button
                  onClick={handleAddGoal}
                  className="w-full bg-primary text-primary-foreground"
                  disabled={!newGoal.title.trim() || !newGoal.targetDate}
                >
                  Create Quest
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </FadeIn>

      {/* Category Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
        <Badge
          variant="outline"
          className={cn(
            'cursor-pointer px-3 py-1.5 whitespace-nowrap transition-colors',
            activeCategory === 'all'
              ? 'bg-primary/20 border-primary text-primary'
              : 'border-border/50 hover:border-primary/30'
          )}
          onClick={() => setActiveCategory('all')}
        >
          All
        </Badge>
        {(Object.keys(categoryIcons) as GoalCategory[]).map((cat) => {
          const Icon = categoryIcons[cat]
          return (
            <Badge
              key={cat}
              variant="outline"
              className={cn(
                'cursor-pointer px-3 py-1.5 whitespace-nowrap transition-colors flex items-center gap-1',
                activeCategory === cat
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'border-border/50 hover:border-primary/30'
              )}
              onClick={() => setActiveCategory(cat)}
            >
              <Icon className="h-3 w-3" />
              {categoryLabels[cat]}
            </Badge>
          )
        })}
      </div>

      {isLoading ? (
        <div className="columns-1 md:columns-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-muted/50 animate-pulse mb-4 break-inside-avoid" />
          ))}
        </div>
      ) : sortedGoals.length === 0 ? (
        <div className="text-center py-12">
          <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">No quests yet</h3>
          <p className="text-muted-foreground">Create your first quest to start earning XP</p>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 gap-4">
          <AnimatePresence>
            {sortedGoals.map((goal) => (
              <GoalCard
                key={goal._id}
                goal={goal}
                onToggleSubTask={handleToggleSubTask}
                onDelete={handleDeleteGoal}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}

function GoalCard({
  goal,
  onToggleSubTask,
  onDelete,
}: {
  goal: Goal
  onToggleSubTask: (goalId: string, subTaskId: string, event: React.MouseEvent) => void
  onDelete: (id: string) => void
}) {
  const isCompleted = goal.status === 'completed'
  const isOverdue = new Date(goal.targetDate) < new Date() && !isCompleted
  const Icon = categoryIcons[goal.category] || BookOpen

  return (
    <motion.div
      layout
      layoutId={goal._id}
      variants={cardItem}
      initial="initial"
      animate="animate"
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.01 }}
      transition={springConfig}
      className={cn(
        'mb-4 break-inside-avoid rounded-xl glass-panel border p-4 space-y-3',
        isCompleted && 'opacity-40 grayscale',
        'border-border/50 hover:border-primary/20 transition-all'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {isCompleted && (
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30 text-xs">
              <Check className="h-3 w-3 mr-1" />
              Done
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-primary/70 flex items-center gap-1">
            <Zap className="h-3 w-3" />
            {goal.xpReward}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
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
      </div>

      <h3 className="text-lg font-semibold text-foreground">{goal.title}</h3>
      
      {goal.description && (
        <p className="text-sm text-muted-foreground">{goal.description}</p>
      )}

      {/* Progress bar */}
      <div className="space-y-1">
        <motion.div className="h-1.5 bg-primary/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${goal.progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </motion.div>
        <p className="text-xs text-muted-foreground text-right">{goal.progress}%</p>
      </div>

      {/* SubTasks */}
      {goal.subTasks.length > 0 && (
        <div className="space-y-2">
          {goal.subTasks.map((subTask) => (
            <button
              key={subTask.id}
              onClick={(e) => onToggleSubTask(goal._id, subTask.id, e)}
              className="flex items-center gap-2 w-full text-left text-sm hover:bg-secondary/50 rounded p-1 -ml-1 group"
            >
              <div className="relative">
                {subTask.done ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </div>
              <span
                className={cn(
                  'transition-all',
                  subTask.done && 'text-muted-foreground line-through'
                )}
              >
                {subTask.task}
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
      </div>
    </motion.div>
  )
}
