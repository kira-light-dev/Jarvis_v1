import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Exam, { type ExamType } from '@/lib/models/Exam'

export async function GET() {
  try {
    const conn = await connectDB()
    
    if (!conn) {
      return NextResponse.json(getMockExams())
    }

    const exams = await Exam.find().sort({ date: 1 })
    return NextResponse.json(exams)
  } catch (error) {
    console.error('GET /api/exams error:', error)
    return NextResponse.json(getMockExams())
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const conn = await connectDB()

    if (!conn) {
      return NextResponse.json({
        _id: Date.now().toString(),
        ...body,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    const exam = await Exam.create(body)
    return NextResponse.json(exam, { status: 201 })
  } catch (error) {
    console.error('POST /api/exams error:', error)
    return NextResponse.json(
      { error: 'Failed to create exam' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json()
    const conn = await connectDB()

    if (!conn) {
      return NextResponse.json({ _id: id, ...updates })
    }

    const exam = await Exam.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    )

    if (!exam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(exam)
  } catch (error) {
    console.error('PUT /api/exams error:', error)
    return NextResponse.json(
      { error: 'Failed to update exam' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }

    const conn = await connectDB()

    if (!conn) {
      return NextResponse.json({ success: true })
    }

    await Exam.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/exams error:', error)
    return NextResponse.json(
      { error: 'Failed to delete exam' },
      { status: 500 }
    )
  }
}

function getMockExams() {
  const now = new Date()
  
  return [
    {
      _id: 'exam-1',
      userId: 'demo-user',
      subject: 'Data Structures',
      examType: 'mid-semester' as ExamType,
      date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      syllabus: ['Arrays', 'Linked Lists', 'Stacks', 'Queues', 'Trees'],
      preparationStatus: 65,
      notes: 'Focus on tree traversals',
      reminders: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: 'exam-2',
      userId: 'demo-user',
      subject: 'Database Management',
      examType: 'quiz' as ExamType,
      date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      syllabus: ['SQL Basics', 'Normalization', 'ER Diagrams'],
      preparationStatus: 80,
      notes: '',
      reminders: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: 'exam-3',
      userId: 'demo-user',
      subject: 'Operating Systems',
      examType: 'end-semester' as ExamType,
      date: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
      syllabus: ['Process Management', 'Memory Management', 'File Systems', 'Deadlocks', 'CPU Scheduling'],
      preparationStatus: 30,
      notes: 'Need to cover deadlocks and scheduling',
      reminders: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: 'exam-4',
      userId: 'demo-user',
      subject: 'Computer Networks',
      examType: 'viva' as ExamType,
      date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      syllabus: ['OSI Model', 'TCP/IP', 'Routing', 'Network Security'],
      preparationStatus: 45,
      notes: 'Prepare common viva questions',
      reminders: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]
}
