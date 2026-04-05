import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const conn = await connectDB()
    if (!conn) {
      return NextResponse.json({ user: null })
    }

    const user = await User.findOne({ email })
    return NextResponse.json({ user })
  } catch (error) {
    console.error('GET /api/user error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, ...updates } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const conn = await connectDB()
    if (!conn) {
      return NextResponse.json({ success: true, user: { email, ...updates } })
    }

    const user = await User.findOneAndUpdate(
      { email },
      { ...updates, updatedAt: new Date() },
      { upsert: true, new: true }
    )

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('PATCH /api/user error:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
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

    const user = await User.create(body)
    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('POST /api/user error:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
