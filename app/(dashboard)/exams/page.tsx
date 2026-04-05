'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { format, formatDistanceToNow, differenceInDays } from 'date-fns'
import {
  Plus,
  Calendar,
  Clock,
  BookOpen,
  MoreVertical,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
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
import type { ExamType } from '@/lib/models/Exam'

interface Exam {
  _id: string
  subject: string
  examType: ExamType
  date: Date
  syllabus: string[]
  preparationStatus: number
  notes?: string
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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newExam, setNewExam] = useState({
    subject: '',
    examType: 'mid-semester' as ExamType,
    date: '',
    syllabus: '',
    notes: '',
  })

  useEffect(() => {
    fetchExams()
  }, [])

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/exams')
      const data = await res.json()
      setExams(data.map((e: Exam) => ({
        ...e,
        date: new Date(e.date),
      })))
    } catch (error) {
      console.error('Failed to fetch exams:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddExam = async () => {
    if (!newExam.subject.trim() || !newExam.date) return

    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user',
          subject: newExam.subject,
          examType: newExam.examType,
          date: new Date(newExam.date),
          syllabus: newExam.syllabus.split(',').map((s) => s.trim()).filter(Boolean),
          preparationStatus: 0,
          notes: newExam.notes,
          reminders: [],
        }),
      })
      const data = await res.json()
      setExams((prev) => [...prev, { ...data, date: new Date(data.date) }].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ))
      setNewExam({
        subject: '',
        examType: 'mid-semester',
        date: '',
        syllabus: '',
        notes: '',
      })
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error('Failed to add exam:', error)
    }
  }

  const handleUpdatePreparation = async (id: string, preparationStatus: number) => {
    setExams((prev) =>
      prev.map((e) => (e._id === id ? { ...e, preparationStatus } : e))
    )

    try {
      await fetch('/api/exams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, preparationStatus }),
      })
    } catch (error) {
      console.error('Failed to update exam:', error)
      fetchExams()
    }
  }

  const handleDeleteExam = async (id: string) => {
    setExams((prev) => prev.filter((e) => e._id !== id))
    try {
      await fetch(`/api/exams?id=${id}`, { method: 'DELETE' })
    } catch (error) {
      console.error('Failed to delete exam:', error)
      fetchExams()
    }
  }

  const upcomingExams = exams.filter((e) => new Date(e.date) >= new Date())
  const pastExams = exams.filter((e) => new Date(e.date) < new Date())

  const urgentExams = upcomingExams.filter((e) => differenceInDays(new Date(e.date), new Date()) <= 3)

  return (
    <div className="flex h-full flex-col p-4 md:p-6">
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">Exams</h1>
            <p className="text-muted-foreground">
              Manage your exam schedule and preparation
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex gap-2 text-sm">
              <Badge variant="outline" className="bg-card">
                {upcomingExams.length} upcoming
              </Badge>
              {urgentExams.length > 0 && (
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                  {urgentExams.length} urgent
                </Badge>
              )}
            </div>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Exam
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-panel border-border/50">
                <DialogHeader>
                  <DialogTitle>Schedule New Exam</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Input
                      value={newExam.subject}
                      onChange={(e) =>
                        setNewExam({ ...newExam, subject: e.target.value })
                      }
                      placeholder="e.g., Data Structures"
                      className="bg-input border-border/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Exam Type</Label>
                      <Select
                        value={newExam.examType}
                        onValueChange={(value) =>
                          setNewExam({ ...newExam, examType: value as ExamType })
                        }
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
                        onChange={(e) =>
                          setNewExam({ ...newExam, date: e.target.value })
                        }
                        className="bg-input border-border/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Syllabus Topics (comma-separated)</Label>
                    <Input
                      value={newExam.syllabus}
                      onChange={(e) =>
                        setNewExam({ ...newExam, syllabus: e.target.value })
                      }
                      placeholder="Arrays, Linked Lists, Trees"
                      className="bg-input border-border/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Textarea
                      value={newExam.notes}
                      onChange={(e) =>
                        setNewExam({ ...newExam, notes: e.target.value })
                      }
                      placeholder="Important topics, resources, etc."
                      className="bg-input border-border/50"
                    />
                  </div>

                  <Button
                    onClick={handleAddExam}
                    className="w-full bg-primary text-primary-foreground"
                    disabled={!newExam.subject.trim() || !newExam.date}
                  >
                    Schedule Exam
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </FadeIn>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-56 rounded-xl bg-muted/50 animate-pulse"
            />
          ))}
        </div>
      ) : upcomingExams.length === 0 && pastExams.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">No exams scheduled</h3>
          <p className="text-muted-foreground">
            Add your upcoming exams to stay on track
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {upcomingExams.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Upcoming Exams
              </h2>
              <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" staggerDelay={0.05}>
                {upcomingExams.map((exam) => (
                  <StaggerItem key={exam._id}>
                    <ExamCard
                      exam={exam}
                      onUpdatePreparation={handleUpdatePreparation}
                      onDelete={handleDeleteExam}
                    />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </section>
          )}

          {pastExams.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-muted-foreground mb-4">
                Past Exams
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-60">
                {pastExams.map((exam) => (
                  <ExamCard
                    key={exam._id}
                    exam={exam}
                    onUpdatePreparation={handleUpdatePreparation}
                    onDelete={handleDeleteExam}
                    isPast
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function ExamCard({
  exam,
  onUpdatePreparation,
  onDelete,
  isPast = false,
}: {
  exam: Exam
  onUpdatePreparation: (id: string, status: number) => void
  onDelete: (id: string) => void
  isPast?: boolean
}) {
  const daysUntil = differenceInDays(new Date(exam.date), new Date())
  const isUrgent = daysUntil <= 3 && daysUntil >= 0

  return (
    <motion.div
      layout
      className={cn(
        'rounded-xl glass-panel border p-4 space-y-4',
        isUrgent && !isPast
          ? 'border-destructive/30'
          : 'border-border/50'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={examTypeColors[exam.examType]}>
              {examTypeLabels[exam.examType]}
            </Badge>
            {isUrgent && !isPast && (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Urgent
              </Badge>
            )}
          </div>
          <h3 className="font-semibold text-foreground">{exam.subject}</h3>
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
              onClick={() => onDelete(exam._id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span>{format(exam.date, 'EEEE, MMM d, yyyy')}</span>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>
          {isPast
            ? `Completed ${formatDistanceToNow(exam.date, { addSuffix: true })}`
            : `${formatDistanceToNow(exam.date, { addSuffix: true })}`}
        </span>
      </div>

      {exam.syllabus.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>Syllabus</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {exam.syllabus.map((topic, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {topic}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {!isPast && (
        <div className="space-y-2 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Preparation</span>
            <span className="font-medium text-foreground">{exam.preparationStatus}%</span>
          </div>
          <Slider
            value={[exam.preparationStatus]}
            onValueChange={([value]) => onUpdatePreparation(exam._id, value)}
            max={100}
            step={5}
            className="py-2"
          />
        </div>
      )}

      {exam.notes && (
        <p className="text-xs text-muted-foreground italic">
          {exam.notes}
        </p>
      )}
    </motion.div>
  )
}
