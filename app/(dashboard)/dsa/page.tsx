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
import { Plus, ExternalLink, MoreVertical, Trash2, Edit, X, GripVertical } from 'lucide-react'
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
import { cn } from '@/lib/utils'
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
}

const columns: { id: ProblemStatus; title: string; color: string }[] = [
  { id: 'todo', title: 'To Do', color: 'text-muted-foreground' },
  { id: 'in-progress', title: 'In Progress', color: 'text-yellow-500' },
  { id: 'review', title: 'Review', color: 'text-blue-500' },
  { id: 'completed', title: 'Completed', color: 'text-green-500' },
]

const topics = [
  'Arrays',
  'Strings',
  'Linked List',
  'Trees',
  'Binary Search',
  'Dynamic Programming',
  'Graphs',
  'Sorting',
  'Heap',
  'Stack & Queue',
  'Backtracking',
  'Greedy',
  'Other',
]

const difficultyColors = {
  easy: 'bg-green-500/10 text-green-500 border-green-500/30',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
  hard: 'bg-red-500/10 text-red-500 border-red-500/30',
}

export default function DSAPage() {
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
      setProblems(data)
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

    // Check if dropped on a column
    const newStatus = columns.find((col) => col.id === overId)?.id

    if (newStatus) {
      const problem = problems.find((p) => p._id === activeId)
      if (problem && problem.status !== newStatus) {
        // Update locally first for instant feedback
        setProblems((prev) =>
          prev.map((p) => (p._id === activeId ? { ...p, status: newStatus } : p))
        )

        // Then update on server
        try {
          await fetch('/api/dsa', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: activeId, status: newStatus }),
          })
        } catch (error) {
          console.error('Failed to update problem:', error)
          // Revert on error
          fetchProblems()
        }
      }
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
        }),
      })
      const data = await res.json()
      setProblems((prev) => [data, ...prev])
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

  const stats = {
    total: problems.length,
    completed: problems.filter((p) => p.status === 'completed').length,
    easy: problems.filter((p) => p.difficulty === 'easy').length,
    medium: problems.filter((p) => p.difficulty === 'medium').length,
    hard: problems.filter((p) => p.difficulty === 'hard').length,
  }

  return (
    <div className="flex h-full flex-col p-4 md:p-6">
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">DSA Tracker</h1>
            <p className="text-muted-foreground">
              Track your problem-solving progress
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex gap-2 text-sm">
              <Badge variant="outline" className="bg-card">
                {stats.completed}/{stats.total} solved
              </Badge>
              <Badge variant="outline" className={difficultyColors.easy}>
                E: {stats.easy}
              </Badge>
              <Badge variant="outline" className={difficultyColors.medium}>
                M: {stats.medium}
              </Badge>
              <Badge variant="outline" className={difficultyColors.hard}>
                H: {stats.hard}
              </Badge>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 min-h-0">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              problems={problems.filter((p) => p.status === column.id)}
              onDelete={handleDeleteProblem}
              isLoading={isLoading}
            />
          ))}
        </div>

        <DragOverlay>
          {activeProblem && (
            <ProblemCard problem={activeProblem} isDragging />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

function KanbanColumn({
  column,
  problems,
  onDelete,
  isLoading,
}: {
  column: { id: ProblemStatus; title: string; color: string }
  problems: Problem[]
  onDelete: (id: string) => void
  isLoading: boolean
}) {
  const { setNodeRef, isOver } = useSortable({
    id: column.id,
    data: { type: 'column' },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col rounded-xl glass-panel border border-border/50 min-h-[300px]',
        isOver && 'border-primary/50 bg-primary/5'
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <span className={cn('font-semibold', column.color)}>{column.title}</span>
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
}: {
  problem: Problem
  onDelete: (id: string) => void
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
      />
    </div>
  )
}

function ProblemCard({
  problem,
  isDragging,
  dragHandleProps,
  onDelete,
}: {
  problem: Problem
  isDragging?: boolean
  dragHandleProps?: Record<string, unknown>
  onDelete?: (id: string) => void
}) {
  return (
    <motion.div
      layout
      className={cn(
        'rounded-lg border border-border/50 bg-card p-3 cursor-default',
        isDragging && 'opacity-50 shadow-lg'
      )}
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
        </div>
      </div>
    </motion.div>
  )
}
