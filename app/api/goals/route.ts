import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Goal, { type GoalType, type GoalStatus } from '@/lib/models/Goal'

export async function GET() {
  try {
    const conn = await connectDB()
    
    if (!conn) {
      return NextResponse.json(getMockGoals())
    }

    const goals = await Goal.find().sort({ createdAt: -1 })
    return NextResponse.json(goals)
  } catch (error) {
    console.error('GET /api/goals error:', error)
    return NextResponse.json(getMockGoals())
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

    const goal = await Goal.create(body)
    return NextResponse.json(goal, { status: 201 })
  } catch (error) {
    console.error('POST /api/goals error:', error)
    return NextResponse.json(
      { error: 'Failed to create goal' },
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

    const goal = await Goal.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    )

    if (!goal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(goal)
  } catch (error) {
    console.error('PUT /api/goals error:', error)
    return NextResponse.json(
      { error: 'Failed to update goal' },
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

    await Goal.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/goals error:', error)
    return NextResponse.json(
      { error: 'Failed to delete goal' },
      { status: 500 }
    )
  }
}

function getMockGoals() {
  const types: GoalType[] = ['daily', 'weekly', 'monthly', 'semester']
  
  return [
    {
      _id: 'goal-1',
      userId: 'demo-user',
      title: 'Solve 5 LeetCode problems',
      description: 'Focus on medium difficulty array problems',
      type: 'daily' as GoalType,
      status: 'active' as GoalStatus,
      targetDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      progress: 60,
      milestones: [
        { title: 'Easy problem', completed: true },
        { title: 'Medium problem 1', completed: true },
        { title: 'Medium problem 2', completed: true },
        { title: 'Medium problem 3', completed: false },
        { title: 'Hard problem', completed: false },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: 'goal-2',
      userId: 'demo-user',
      title: 'Complete Trees section',
      description: 'Master binary trees, BST, and tree traversals',
      type: 'weekly' as GoalType,
      status: 'active' as GoalStatus,
      targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      progress: 40,
      milestones: [
        { title: 'Binary Tree basics', completed: true },
        { title: 'Tree traversals', completed: true },
        { title: 'BST operations', completed: false },
        { title: 'Balanced trees', completed: false },
        { title: 'Practice problems', completed: false },
      ],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    },
    {
      _id: 'goal-3',
      userId: 'demo-user',
      title: 'Reach 150 problems solved',
      description: 'Build strong DSA foundation',
      type: 'monthly' as GoalType,
      status: 'active' as GoalStatus,
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      progress: 25,
      milestones: [
        { title: '50 problems', completed: true },
        { title: '100 problems', completed: false },
        { title: '150 problems', completed: false },
      ],
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    },
    {
      _id: 'goal-4',
      userId: 'demo-user',
      title: 'Get placed at FAANG',
      description: 'Prepare and clear interviews at top tech companies',
      type: 'semester' as GoalType,
      status: 'active' as GoalStatus,
      targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      progress: 15,
      milestones: [
        { title: 'Master DSA', completed: false },
        { title: 'Complete system design', completed: false },
        { title: 'Mock interviews', completed: false },
        { title: 'Apply to companies', completed: false },
        { title: 'Clear interviews', completed: false },
      ],
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    },
  ]
}
