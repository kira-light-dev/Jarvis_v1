import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import DSAProblem, { type ProblemStatus, type ProblemDifficulty } from '@/lib/models/DSAProblem'

export async function GET() {
  try {
    const conn = await connectDB()
    
    if (!conn) {
      // Return mock data when DB is not connected
      return NextResponse.json(getMockProblems())
    }

    const problems = await DSAProblem.find().sort({ createdAt: -1 })
    return NextResponse.json(problems)
  } catch (error) {
    console.error('GET /api/dsa error:', error)
    return NextResponse.json(getMockProblems())
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const conn = await connectDB()

    if (!conn) {
      // Return mock created problem
      return NextResponse.json({
        _id: Date.now().toString(),
        ...body,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    const problem = await DSAProblem.create(body)
    return NextResponse.json(problem, { status: 201 })
  } catch (error) {
    console.error('POST /api/dsa error:', error)
    return NextResponse.json(
      { error: 'Failed to create problem' },
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

    const problem = await DSAProblem.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    )

    if (!problem) {
      return NextResponse.json(
        { error: 'Problem not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(problem)
  } catch (error) {
    console.error('PUT /api/dsa error:', error)
    return NextResponse.json(
      { error: 'Failed to update problem' },
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

    await DSAProblem.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/dsa error:', error)
    return NextResponse.json(
      { error: 'Failed to delete problem' },
      { status: 500 }
    )
  }
}

function getMockProblems() {
  const topics = ['Arrays', 'Linked List', 'Trees', 'Dynamic Programming', 'Graphs', 'Strings', 'Sorting', 'Binary Search']
  const difficulties: ProblemDifficulty[] = ['easy', 'medium', 'hard']
  const statuses: ProblemStatus[] = ['todo', 'in-progress', 'review', 'completed']
  
  const mockProblems = [
    { title: 'Two Sum', topic: 'Arrays', difficulty: 'easy', status: 'completed' },
    { title: 'Valid Parentheses', topic: 'Strings', difficulty: 'easy', status: 'completed' },
    { title: 'Merge Intervals', topic: 'Arrays', difficulty: 'medium', status: 'review' },
    { title: 'LRU Cache', topic: 'Linked List', difficulty: 'medium', status: 'in-progress' },
    { title: 'Binary Tree Level Order', topic: 'Trees', difficulty: 'medium', status: 'in-progress' },
    { title: 'Coin Change', topic: 'Dynamic Programming', difficulty: 'medium', status: 'todo' },
    { title: 'Course Schedule', topic: 'Graphs', difficulty: 'medium', status: 'todo' },
    { title: 'Serialize Binary Tree', topic: 'Trees', difficulty: 'hard', status: 'todo' },
    { title: 'Median of Two Sorted Arrays', topic: 'Binary Search', difficulty: 'hard', status: 'todo' },
    { title: 'Longest Valid Parentheses', topic: 'Dynamic Programming', difficulty: 'hard', status: 'todo' },
  ]

  return mockProblems.map((p, i) => ({
    _id: `mock-${i}`,
    userId: 'demo-user',
    title: p.title,
    topic: p.topic,
    difficulty: p.difficulty as ProblemDifficulty,
    status: p.status as ProblemStatus,
    link: '',
    notes: '',
    timesRevisited: Math.floor(Math.random() * 5),
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  }))
}
