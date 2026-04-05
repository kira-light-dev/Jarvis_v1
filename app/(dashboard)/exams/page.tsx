'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, differenceInDays, addDays } from 'date-fns'
import {
  Plus,
  Calendar,
  Check,
  Circle,
  MoreVertical,
  Trash2,
  Swords,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { FadeIn, ThinkingDots } from '@/components/motion'
import { cn } from '@/lib/utils'
import { pageVariants, springConfig, cardItem } from '@/lib/animations'
import type { ExamType } from '@/lib/models/Exam'

interface Milestone {
  topic: string
  date: Date
  completed: boolean
}

interface Exam {
  _id: string
  subject: string
  examType: ExamType
  date: Date
  syllabus: string[]
  preparationStatus: number
  notes?: string
  milestones: Milestone[]
}

const examTypeColors = {
  'mid-semester': 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  'end-semester': 'bg-purple-500/10 text-purple-500 border-purple-500/30',
  quiz: 'bg-green-500/10 text-green-500 border-green-500/30',
  assignment: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
  viva: 'bg-pink-500/10 text-pink-500 border-pink-500/30',
  other: 'bg-gray-500/10 text-gray-500 border-gray-500/30',
}

const examTypeLabels = {
  'mid-semester': 'Mid Semester',
  'end-semester': 'End Semester',
  quiz: 'Quiz',
  assignment: 'Assignment',
  viva: 'Viva',
  other: 'Other',
}

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false)
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null)
  const [newExam, setNewExam] = useState({
    subject: '',
    examType: 'mid-semester' as ExamType,
    date: '',
    syllabus: '',
    notes: '',
  })
  const [previewMilestones, setPreviewMilestones] = useState<Milestone[]>([])

  useEffect(() => {
    fetchExams()
  }, [])

  // Generate milestones preview when date and syllabus change
  useEffect(() => {
    if (newExam.date && newExam.syllabus) {
      const topics = newExam.syllabus.split(',').map(s => s.trim()).filter(Boolean)
      if (topics.length > 0) {
        const examDate = new Date(newExam.date)
        const today = new Date()
        const totalDays = Math.max(1, differenceInDays(examDate, today))
        const daysPerTopic = Math.floor(totalDays / topics.length)
        
        const milestones: Milestone[] = topics.map((topic, i) => ({
          topic,
          date: addDays(today, daysPerTopic * (i + 1)),
          completed: false,
        }))
        setPreviewMilestones(milestones)
      }
    } else {
      setPreviewMilestones([])
    }
  }, [newExam.date, newExam.syllabus])

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/exams')
      const data = await res.json()
      const examData = data.map((e: Exam) => ({
        ...e,
        date: new Date(e.date),
        milestones: e.milestones || e.syllabus.map((topic: string, i: number) => ({
          topic,
          date: new Date(e.date),
          completed: false,
        })),
      }))
      setExams(examData)
      if (examData.length > 0 && !selectedExamId) {
        setSelectedExamId(examData[0]._id)
      }
    } catch (error) {
      console.error('Failed to fetch exams:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddExam = async () => {
    if (!newExam.subject.trim() || !newExam.date) return

    const syllabusTopics = newExam.syllabus.split(',').map(s => s.trim()).filter(Boolean)

    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user',
          subject: newExam.subject,
          examType: newExam.examType,
          date: new Date(newExam.date),
          syllabus: syllabusTopics,
          preparationStatus: 0,
          notes: newExam.notes,
          milestones: previewMilestones,
          reminders: [],
        }),
      })
      const data = await res.json()
      const newExamData = { 
        ...data, 
        date: new Date(data.date),
        milestones: previewMilestones,
      }
      setExams((prev) => [...prev, newExamData].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ))
      setSelectedExamId(data._id)
      setNewExam({
        subject: '',
        examType: 'mid-semester',
        date: '',
        syllabus: '',
        notes: '',
      })
      setPreviewMilestones([])
      setIsAddSheetOpen(false)
    } catch (error) {
      console.error('Failed to add exam:', error)
    }
  }

  const handleToggleMilestone = async (examId: string, milestoneIndex: number) => {
    const exam = exams.find(e => e._id === examId)
    if (!exam) return

    const updatedMilestones = exam.milestones.map((m, i) =>
      i === milestoneIndex ? { ...m, completed: !m.completed } : m
    )
    const completedCount = updatedMilestones.filter(m => m.completed).length
    const progress = Math.round((completedCount / updatedMilestones.length) * 100)

    setExams(prev => prev.map(e =>
      e._id === examId ? { ...e, milestones: updatedMilestones, preparationStatus: progress } : e
    ))

    try {
      await fetch('/api/exams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: examId, preparationStatus: progress }),
      })
    } catch (error) {
      console.error('Failed to update milestone:', error)
    }
  }

  const handleDeleteExam = async (id: string) => {
    setExams((prev) => prev.filter((e) => e._id !== id))
    if (selectedExamId === id) {
      const remaining = exams.filter(e => e._id !== id)
      setSelectedExamId(remaining.length > 0 ? remaining[0]._id : null)
    }
    try {
      await fetch(`/api/exams?id=${id}`, { method: 'DELETE' })
    } catch (error) {
      console.error('Failed to delete exam:', error)
      fetchExams()
    }
  }

  const upcomingExams = exams.filter((e) => new Date(e.date) >= new Date())
  const selectedExam = exams.find(e => e._id === selectedExamId)

  return (
    <motion.div 
      className="flex h-full flex-col p-4 md:p-6"
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary animate-text-glow">Exams</h1>
            <p className="text-muted-foreground text-sm">
              {upcomingExams.length} upcoming
            </p>
          </div>

          <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
            <SheetTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Exam
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="glass-panel border-border/50 h-[85vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Schedule New Exam</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    value={newExam.subject}
                    onChange={(e) => setNewExam({ ...newExam, subject: e.target.value })}
                    placeholder="e.g., Data Structures"
                    className="bg-input border-border/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Exam Type</Label>
                    <Select
                      value={newExam.examType}
                      onValueChange={(value) => setNewExam({ ...newExam, examType: value as ExamType })}
                    >
                      <SelectTrigger className="bg-input border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mid-semester">Mid Semester</SelectItem>
                        <SelectItem value="end-semester">End Semester</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="assignment">Assignment</SelectItem>
                        <SelectItem value="viva">Viva</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Exam Date</Label>
                    <Input
                      type="date"
                      value={newExam.date}
                      onChange={(e) => setNewExam({ ...newExam, date: e.target.value })}
                      className="bg-input border-border/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Syllabus Topics (comma-separated)</Label>
                  <Input
                    value={newExam.syllabus}
                    onChange={(e) => setNewExam({ ...newExam, syllabus: e.target.value })}
                    placeholder="Arrays, Linked Lists, Trees"
                    className="bg-input border-border/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={newExam.notes}
                    onChange={(e) => setNewExam({ ...newExam, notes: e.target.value })}
                    placeholder="Important topics, resources, etc."
                    className="bg-input border-border/50"
                  />
                </div>

                {/* Milestones Preview */}
                {previewMilestones.length > 0 && (
                  <div className="space-y-2">
                    <Label>Auto-Generated Milestones</Label>
                    <div className="glass-panel border border-border/50 rounded-lg p-3 space-y-2">
                      {previewMilestones.map((m, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          <span className="text-xs font-mono text-muted-foreground w-20">
                            {format(m.date, 'MMM d')}
                          </span>
                          <span className="text-foreground">{m.topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleAddExam}
                  className="w-full bg-primary text-primary-foreground"
                  disabled={!newExam.subject.trim() || !newExam.date}
                >
                  Schedule Exam
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </FadeIn>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <ThinkingDots />
        </div>
      ) : exams.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">No exams scheduled</h3>
          <p className="text-muted-foreground">Add your upcoming exams to stay on track</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
          {/* Left: Exam Selector Cards */}
          <div className="space-y-4 overflow-y-auto">
            <AnimatePresence>
              {upcomingExams.map((exam) => {
                const daysUntil = differenceInDays(exam.date, new Date())
                const isUrgent = daysUntil <= 7 && daysUntil >= 0
                const isCritical = daysUntil <= 3 && daysUntil >= 0
                
                return (
                  <motion.div
                    key={exam._id}
                    layout
                    layoutId={exam._id}
                    variants={cardItem}
                    initial="initial"
                    animate="animate"
                    whileHover={{ scale: 1.01 }}
                    transition={springConfig}
                    onClick={() => setSelectedExamId(exam._id)}
                    className={cn(
                      'glass-panel border rounded-xl p-4 cursor-pointer transition-all',
                      selectedExamId === exam._id 
                        ? 'border-primary/50 bg-primary/5' 
                        : 'border-border/50 hover:border-primary/30',
                      isCritical && 'animate-[border-pulse_3s_ease-in-out_infinite]'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Badge variant="outline" className={cn('text-xs', examTypeColors[exam.examType])}>
                          {examTypeLabels[exam.examType]}
                        </Badge>
                        <h3 className="font-semibold text-foreground mt-2">{exam.subject}</h3>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          'text-3xl font-bold font-mono',
                          isCritical ? 'text-destructive' : isUrgent ? 'text-yellow-500' : 'text-foreground'
                        )}>
                          {daysUntil}
                        </p>
                        <p className="text-xs text-muted-foreground">days</p>
                        {isCritical && (
                          <div className="mt-2">
                            <ThinkingDots size={4} />
                            <p className="text-xs text-destructive mt-1">Critical</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-primary/20 rounded-full">
                        <motion.div
                          className="h-full bg-primary rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${exam.preparationStatus}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{exam.preparationStatus}%</span>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Right: Timeline */}
          <div className="overflow-y-auto">
            {selectedExam && (
              <ExamTimeline
                exam={selectedExam}
                onToggleMilestone={handleToggleMilestone}
                onDelete={handleDeleteExam}
              />
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}

function ExamTimeline({
  exam,
  onToggleMilestone,
  onDelete,
}: {
  exam: Exam
  onToggleMilestone: (examId: string, milestoneIndex: number) => void
  onDelete: (id: string) => void
}) {
  const daysUntil = differenceInDays(exam.date, new Date())
  const isCritical = daysUntil <= 3 && daysUntil >= 0
  const today = new Date().toDateString()

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">{exam.subject}</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(exam._id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Timeline */}
      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute left-2 top-0 bottom-0 w-px bg-border/50" />

        {/* Today marker */}
        <div className="relative mb-6">
          <motion.div 
            className="absolute -left-4 top-1 h-2 w-2 rounded-full bg-primary"
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <p className="text-xs font-mono text-muted-foreground">Today</p>
        </div>

        {/* Milestones */}
        {exam.milestones.map((milestone, i) => {
          const isToday = new Date(milestone.date).toDateString() === today
          const isPast = new Date(milestone.date) < new Date()
          const completedBefore = i > 0 && exam.milestones[i - 1].completed
          
          return (
            <motion.div 
              key={i} 
              className="relative mb-6"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              {/* Connecting line that changes color when previous is complete */}
              {i > 0 && (
                <div 
                  className={cn(
                    "absolute -left-4 -top-6 h-6 w-px",
                    completedBefore ? "bg-primary/40" : "bg-border/50"
                  )}
                />
              )}
              
              {/* Node */}
              <div className="absolute -left-4 top-1">
                {milestone.completed ? (
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                ) : isToday ? (
                  <motion.div 
                    className="h-1.5 w-1.5 rounded-full bg-primary"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                ) : (
                  <div className="h-1.5 w-1.5 rounded-full border border-border" />
                )}
              </div>

              {/* Content */}
              <div className="flex items-start gap-4">
                <p className="text-xs font-mono text-muted-foreground w-16 shrink-0">
                  {format(new Date(milestone.date), 'MMM d')}
                </p>
                <div 
                  className={cn(
                    'flex-1 glass-panel border rounded-lg p-3 cursor-pointer transition-all',
                    milestone.completed 
                      ? 'opacity-50 border-l-2 border-l-green-500' 
                      : 'border-border/50 hover:border-primary/30'
                  )}
                  onClick={() => onToggleMilestone(exam._id, i)}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={milestone.completed} 
                      className="pointer-events-none"
                    />
                    <span className={cn(
                      'text-sm',
                      milestone.completed && 'line-through text-muted-foreground'
                    )}>
                      {milestone.topic}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}

        {/* Boss Fight Node */}
        <motion.div 
          className="relative"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: exam.milestones.length * 0.1 }}
        >
          {/* Node */}
          <div className="absolute -left-5">
            <motion.div 
              className="h-3 w-3 rounded-full bg-destructive"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>

          {/* Content */}
          <div className="ml-4">
            <div className={cn(
              'glass-panel border rounded-lg p-4',
              'border-destructive/50'
            )}>
              <div className="flex items-center gap-2 mb-2">
                <Swords className="h-4 w-4 text-destructive" />
                <p className="text-xs font-mono text-destructive/70 tracking-widest uppercase">
                  Boss Fight
                </p>
              </div>
              <h3 className="text-xl font-bold text-primary">{exam.subject}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {format(exam.date, 'EEEE, MMM d, yyyy')}
              </p>
              <p className={cn(
                'text-4xl font-bold font-mono mt-2',
                isCritical ? 'text-destructive animate-pulse' : 'text-foreground'
              )}>
                {daysUntil} <span className="text-sm font-normal text-muted-foreground">days</span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
