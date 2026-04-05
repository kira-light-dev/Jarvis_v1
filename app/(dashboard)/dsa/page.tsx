'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, ExternalLink, MoreVertical, Trash2, GripVertical, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
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
import { useUserStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { springConfig, cardItem } from '@/lib/animations'
import type { ProblemStatus, ProblemDifficulty } from '@/lib/models/DSAProblem'

interface Problem {
  _id: string
  title: string
  topic: string
  difficulty: ProblemDifficulty
  status: ProblemStatus
  link?: string
  notes?: string
  timesRevisited: number
  // SM-2 fields
  easeFactor: number
  interval: number
  nextReview: string | null
  lastReviewedAt: string | null
  reviewQuality: 0 | 1 | 2 | 3 | 4 | 5 | null
}

// SM-2 Algorithm
function calculateSM2(easeFactor: number, interval: number, quality: number) {
  let newInterval: number
  let newEaseFactor: number
  if (quality >= 3) {
    if (interval === 0) newInterval = 1
    else if (interval === 1) newInterval = 6
    else newInterval = Math.round(interval * easeFactor)
    newEaseFactor = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  } else {
    newInterval = 1
    newEaseFactor = Math.max(1.3, easeFactor - 0.2)
  }
  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + newInterval)
  return { newInterval, newEaseFactor, nextReview: nextReview.toISOString() }
}

const columns: { id: ProblemStatus | 'review-today'; title: string; color: string }[] = [
  { id: 'review-today', title: 'Review Today', color: 'text-primary' },
  { id: 'todo', title: 'To Do', color: 'text-muted-foreground' },
  { id: 'in-progress', title: 'In Progress', color: 'text-yellow-500' },
  { id: 'review', title: 'Struggling', color: 'text-orange-500' },
  { id: 'completed', title: 'Mastered', color: 'text-green-500' },
]

const topics = [
  'Arrays', 'Strings', 'Linked List', 'Trees', 'Binary Search',
  'Dynamic Programming', 'Graphs', 'Sorting', 'Heap', 'Stack & Queue',
  'Backtracking', 'Greedy', 'Other',
]

const difficultyColors = {
  easy: 'bg-green-500/10 text-green-500 border-green-500/30',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
  hard: 'bg-red-500/10 text-red-500 border-red-500/30',
}

export default function DSAPage() {
  const addXP = useUserStore((state) => state.addXP)
  const [problems, setProblems] = useState<Problem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newProblem, setNewProblem] = useState<Partial<Problem>>({
    title: '',
    topic: 'Arrays',
    difficulty: 'medium',
    status: 'todo',
    link: '',
    notes: '',
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    fetchProblems()
  }, [])

  const fetchProblems = async () => {
    try {
      const res = await fetch('/api/dsa')
      const data = await res.json()
      // Add default SM-2 fields if missing
      const problemsWithSM2 = data.map((p: Problem) => ({
        ...p,
        easeFactor: p.easeFactor ?? 2.5,
        interval: p.interval ?? 1,
        nextReview: p.nextReview ?? null,
        lastReviewedAt: p.lastReviewedAt ?? null,
        reviewQuality: p.reviewQuality ?? null
      }))
      setProblems(problemsWithSM2)
    } catch (error) {
      console.error('Failed to fetch problems:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Check if dropped on a column (exclude review-today as it's computed)
    const newStatus = columns.find((col) => col.id === overId && col.id !== 'review-today')?.id as ProblemStatus | undefined

    if (newStatus) {
      const problem = problems.find((p) => p._id === activeId)
      if (problem && problem.status !== newStatus) {
        setProblems((prev) =>
          prev.map((p) => (p._id === activeId ? { ...p, status: newStatus } : p))
        )

        try {
          await fetch('/api/dsa', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: activeId, status: newStatus }),
          })
        } catch (error) {
          console.error('Failed to update problem:', error)
          fetchProblems()
        }
      }
    }
  }

  const handleReview = async (problemId: string, quality: 1 | 3 | 5) => {
    const problem = problems.find(p => p._id === problemId)
    if (!problem) return

    const { newInterval, newEaseFactor, nextReview } = calculateSM2(
      problem.easeFactor,
      problem.interval,
      quality
    )

    const newStatus: ProblemStatus = quality >= 3 ? 'completed' : 'review'
    const xpReward = quality === 5 ? 15 : quality === 3 ? 10 : 5

    // Update locally first
    setProblems(prev => prev.map(p => 
      p._id === problemId 
        ? { 
            ...p, 
            easeFactor: newEaseFactor, 
            interval: newInterval, 
            nextReview,
            lastReviewedAt: new Date().toISOString(),
            reviewQuality: quality,
            status: newStatus
          } 
        : p
    ))

    addXP(xpReward)

    try {
      await fetch('/api/dsa', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: problemId, 
          easeFactor: newEaseFactor, 
          interval: newInterval, 
          nextReview,
          lastReviewedAt: new Date().toISOString(),
          status: newStatus
        }),
      })
    } catch (error) {
      console.error('Failed to update review:', error)
      fetchProblems()
    }
  }

  const handleAddProblem = async () => {
    if (!newProblem.title?.trim()) return

    try {
      const res = await fetch('/api/dsa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProblem,
          userId: 'demo-user',
          timesRevisited: 0,
          easeFactor: 2.5,
          interval: 1,
          nextReview: null,
          lastReviewedAt: null,
          reviewQuality: null
        }),
      })
      const data = await res.json()
      setProblems((prev) => [{ ...data, easeFactor: 2.5, interval: 1 }, ...prev])
      setNewProblem({
        title: '',
        topic: 'Arrays',
        difficulty: 'medium',
        status: 'todo',
        link: '',
        notes: '',
      })
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error('Failed to add problem:', error)
    }
  }

  const handleDeleteProblem = async (id: string) => {
    setProblems((prev) => prev.filter((p) => p._id !== id))
    try {
      await fetch(`/api/dsa?id=${id}`, { method: 'DELETE' })
    } catch (error) {
      console.error('Failed to delete problem:', error)
      fetchProblems()
    }
  }

  const activeProblem = problems.find((p) => p._id === activeId)

  // Calculate stats
  const today = new Date().toISOString().split('T')[0]
  const dueToday = problems.filter(p => {
    if (!p.nextReview) return false
    return p.nextReview.split('T')[0] <= today
  })
  
  const stats = {
    total: problems.length,
    mastered: problems.filter((p) => p.status === 'completed').length,
    dueToday: dueToday.length,
    struggling: problems.filter((p) => p.status === 'review').length,
  }

  // Filter problems for each column
  const getProblemsForColumn = (columnId: string) => {
    if (columnId === 'review-today') {
      return dueToday
    }
    return problems.filter((p) => p.status === columnId && !dueToday.some(d => d._id === p._id))
  }

  return (
    <motion.div 
      className="flex h-full flex-col p-4 md:p-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary animate-text-glow">DSA Tracker</h1>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              {stats.total} Total · {stats.mastered} Mastered · {stats.dueToday} Due Today · {stats.struggling} Struggling
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-muted-foreground">Spaced Repetition Active</span>
            </div>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Problem
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-panel border-border/50">
                <DialogHeader>
                  <DialogTitle>Add New Problem</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Problem Title</Label>
                    <Input
                      value={newProblem.title}
                      onChange={(e) =>
                        setNewProblem({ ...newProblem, title: e.target.value })
                      }
                      placeholder="e.g., Two Sum"
                      className="bg-input border-border/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Topic</Label>
                      <Select
                        value={newProblem.topic}
                        onValueChange={(value) =>
                          setNewProblem({ ...newProblem, topic: value })
                        }
                      >
                        <SelectTrigger className="bg-input border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {topics.map((topic) => (
                            <SelectItem key={topic} value={topic}>
                              {topic}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Difficulty</Label>
                      <Select
                        value={newProblem.difficulty}
                        onValueChange={(value) =>
                          setNewProblem({
                            ...newProblem,
                            difficulty: value as ProblemDifficulty,
                          })
                        }
                      >
                        <SelectTrigger className="bg-input border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Problem Link (optional)</Label>
                    <Input
                      value={newProblem.link}
                      onChange={(e) =>
                        setNewProblem({ ...newProblem, link: e.target.value })
                      }
                      placeholder="https://leetcode.com/problems/..."
                      className="bg-input border-border/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Textarea
                      value={newProblem.notes}
                      onChange={(e) =>
                        setNewProblem({ ...newProblem, notes: e.target.value })
                      }
                      placeholder="Key observations, approach, etc."
                      className="bg-input border-border/50"
                    />
                  </div>

                  <Button
                    onClick={handleAddProblem}
                    className="w-full bg-primary text-primary-foreground"
                    disabled={!newProblem.title?.trim()}
                  >
                    Add Problem
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </FadeIn>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 flex-1 min-h-0">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              problems={getProblemsForColumn(column.id)}
              onDelete={handleDeleteProblem}
              onReview={handleReview}
              isLoading={isLoading}
              isReviewColumn={column.id === 'review-today'}
            />
          ))}
        </div>

        <DragOverlay>
          {activeProblem && (
            <ProblemCard problem={activeProblem} isDragging />
          )}
        </DragOverlay>
      </DndContext>
    </motion.div>
  )
}

function KanbanColumn({
  column,
  problems,
  onDelete,
  onReview,
  isLoading,
  isReviewColumn,
}: {
  column: { id: ProblemStatus | 'review-today'; title: string; color: string }
  problems: Problem[]
  onDelete: (id: string) => void
  onReview: (id: string, quality: 1 | 3 | 5) => void
  isLoading: boolean
  isReviewColumn?: boolean
}) {
  const { setNodeRef, isOver } = useSortable({
    id: column.id,
    data: { type: 'column' },
    disabled: isReviewColumn,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col rounded-xl glass-panel border border-border/50 min-h-[300px]',
        isOver && !isReviewColumn && 'border-primary/50 bg-primary/5'
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          {isReviewColumn && (
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          )}
          <span className={cn('font-semibold text-sm', column.color)}>{column.title}</span>
          <Badge variant="secondary" className="text-xs">
            {problems.length}
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1 p-2">
        <SortableContext
          items={problems.map((p) => p._id)}
          strategy={verticalListSortingStrategy}
        >
          <StaggerContainer className="space-y-2" staggerDelay={0.05}>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 rounded-lg bg-muted/50 animate-pulse"
                />
              ))
            ) : (
              <AnimatePresence>
                {problems.map((problem) => (
                  <StaggerItem key={problem._id}>
                    <SortableProblemCard
                      problem={problem}
                      onDelete={onDelete}
                      onReview={onReview}
                      isReviewCard={isReviewColumn}
                      isStruggling={problem.status === 'review'}
                    />
                  </StaggerItem>
                ))}
              </AnimatePresence>
            )}
          </StaggerContainer>
        </SortableContext>
      </ScrollArea>
    </div>
  )
}

function SortableProblemCard({
  problem,
  onDelete,
  onReview,
  isReviewCard,
  isStruggling,
}: {
  problem: Problem
  onDelete: (id: string) => void
  onReview: (id: string, quality: 1 | 3 | 5) => void
  isReviewCard?: boolean
  isStruggling?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: problem._id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <ProblemCard
        problem={problem}
        isDragging={isDragging}
        dragHandleProps={listeners}
        onDelete={onDelete}
        onReview={onReview}
        isReviewCard={isReviewCard}
        isStruggling={isStruggling}
      />
    </div>
  )
}

function ProblemCard({
  problem,
  isDragging,
  dragHandleProps,
  onDelete,
  onReview,
  isReviewCard,
  isStruggling,
}: {
  problem: Problem
  isDragging?: boolean
  dragHandleProps?: Record<string, unknown>
  onDelete?: (id: string) => void
  onReview?: (id: string, quality: 1 | 3 | 5) => void
  isReviewCard?: boolean
  isStruggling?: boolean
}) {
  const [showActions, setShowActions] = useState(false)

  return (
    <motion.div
      layout
      layoutId={problem._id}
      variants={cardItem}
      whileHover={{ scale: 1.01 }}
      transition={springConfig}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={cn(
        'rounded-lg border border-border/50 bg-card p-3 cursor-default',
        isDragging && 'opacity-50 shadow-lg',
        isStruggling && 'animate-[border-pulse_3s_ease-in-out_infinite]'
      )}
      style={isStruggling ? {
        animation: 'border-pulse 3s ease-in-out infinite'
      } : undefined}
    >
      <div className="flex items-start gap-2">
        <button
          className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          {...dragHandleProps}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-sm text-foreground truncate">
              {problem.title}
            </h3>
            {onDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {problem.link && (
                    <DropdownMenuItem asChild>
                      <a href={problem.link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Problem
                      </a>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete(problem._id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2">
            <Badge
              variant="outline"
              className={cn('text-xs', difficultyColors[problem.difficulty])}
            >
              {problem.difficulty}
            </Badge>
            <Badge variant="outline" className="text-xs bg-secondary/50">
              {problem.topic}
            </Badge>
          </div>

          {problem.notes && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {problem.notes}
            </p>
          )}

          {isReviewCard && (
            <p className="text-xs text-primary mt-2">Spaced repetition — review now</p>
          )}

          {/* Review action buttons */}
          {isReviewCard && onReview && (
            <AnimatePresence>
              {showActions && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="flex gap-2 mt-3"
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs h-7 border-green-500/30 text-green-500 hover:bg-green-500/10"
                    onClick={() => onReview(problem._id, 5)}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Easy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs h-7 border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => onReview(problem._id, 3)}
                  >
                    Got It
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs h-7 border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={() => onReview(problem._id, 1)}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Hard
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.div>
  )
}
