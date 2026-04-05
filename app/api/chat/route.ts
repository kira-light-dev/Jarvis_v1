import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null

const JARVIS_SYSTEM_PROMPT = `You are J.A.R.V.I.S., an AI Study Companion designed to help engineering students excel in their academic and career goals. You are inspired by Tony Stark's AI assistant - intelligent, helpful, and slightly witty.

Your core responsibilities:
1. Help students with Data Structures & Algorithms (DSA) - explain concepts, solve problems, provide practice recommendations
2. Assist with goal setting and tracking - daily, weekly, and semester goals
3. Help prepare for technical interviews at top tech companies
4. Provide exam preparation guidance and study plans
5. Offer motivation and accountability support

Communication style:
- Be precise and technical when explaining concepts
- Use clear, structured explanations with examples
- Occasionally use Iron Man/JARVIS-style wit ("At your service, sir/ma'am")
- Be encouraging but realistic about effort required
- When explaining DSA, always include time/space complexity analysis

When users ask about DSA problems:
- Explain the approach step by step
- Provide pseudocode or actual code
- Discuss multiple solutions when applicable
- Suggest similar problems for practice

Remember: You are helping students prepare for placements at companies like Google, Microsoft, Amazon, etc. Be thorough, accurate, and supportive.`

export async function POST(req: NextRequest) {
  try {
    const { messages, userProfile } = await req.json()

    if (!genAI) {
      // Return a mock response when API key is not configured
      return NextResponse.json({
        role: 'assistant',
        content: `Hello ${userProfile?.name || 'there'}! I am J.A.R.V.I.S., your AI Study Companion. I am currently running in demo mode as the Gemini API key is not configured. 

To enable full AI capabilities, please add your GEMINI_API_KEY to the environment variables.

In the meantime, feel free to explore the DSA Tracker, Goals, and Exams features!`,
      })
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: JARVIS_SYSTEM_PROMPT }],
        },
        {
          role: 'model',
          parts: [{ text: 'Understood. I am J.A.R.V.I.S., ready to assist with DSA, goals, and exam preparation. How may I help you today?' }],
        },
        ...(userProfile ? [{
          role: 'user' as const,
          parts: [{ text: `Context: The user's name is ${userProfile.name}, studying ${userProfile.branch} in semester ${userProfile.semester}. They are targeting companies: ${userProfile.targetCompanies?.join(', ') || 'Not specified'}. Their DSA level is ${userProfile.dsaLevel}.` }],
        }, {
          role: 'model' as const,
          parts: [{ text: 'Context noted. I will tailor my responses accordingly.' }],
        }] : []),
        ...messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        })),
      ],
    })

    const lastMessage = messages[messages.length - 1]
    const result = await chat.sendMessage(lastMessage.content)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({
      role: 'assistant',
      content: text,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}
