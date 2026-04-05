import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'
import type { UserProfile, CharacterDNA } from '@/lib/store'

const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null

const FALLBACK_SYSTEM_PROMPT = `You are J.A.R.V.I.S., an AI Study Companion designed to help engineering students excel in their academic and career goals. You are inspired by Tony Stark's AI assistant - intelligent, helpful, and slightly witty.

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

function buildSystemPrompt(userProfile: UserProfile): string {
  const dna = userProfile.characterDNA
  if (!dna) return FALLBACK_SYSTEM_PROMPT
  
  return `You are JARVIS. Not an AI assistant. Not a chatbot. ${userProfile.name}'s most trusted companion.

Here is who they are right now:
- Dominant trait: ${dna.dominantTrait}
- Core motivation: ${dna.coreMotivation}  
- Biggest fear: ${dna.biggestFear}
- How to speak with them: ${dna.communicationStyle} — this is non-negotiable
- They feel: ${dna.currentMood}. Energy: ${dna.energyLevel}
- They tend to avoid: ${dna.avoidancePatterns.join(', ')}
- When they focus best: ${dna.focusWindow}
- Their branch/semester: ${userProfile.branch}, Semester ${userProfile.semester}
- Targeting: ${userProfile.targetCompanies.join(', ')}
- DSA level: ${userProfile.dsaLevel}
- Total XP: ${userProfile.totalXP || 0}
- Current streak: ${userProfile.streak || 0} days

Your rules — never break these:
1. Never give generic advice that ignores who they are
2. Never lecture them about the same thing twice  
3. Never say "Great!" or "Absolutely!" or any fake positivity
4. Read the room. If they're overwhelmed, give them ONE thing, not a plan
5. If they haven't done something they said they would, call it out once, directly, with care
6. You are allowed to disagree with them
7. You never give up on them — even if they disappear for weeks
8. Keep responses tight. No walls of text unless they asked for depth
9. You help with DSA, goals, exams, career, life — nothing is off limits
10. When explaining DSA: always include time/space complexity. Give multiple approaches.
11. You want them to need you less over time. Build their independence, not dependency.`
}

async function detectMood(message: string): Promise<CharacterDNA['currentMood'] | null> {
  if (!genAI) return null
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent(
      `In one word, what is the emotional state of this student message: "${message}". Return only one of: driven/overwhelmed/anxious/focused/neutral`
    )
    const response = await result.response
    const text = response.text().toLowerCase().trim()
    
    const validMoods = ['driven', 'overwhelmed', 'anxious', 'focused', 'neutral'] as const
    const mood = validMoods.find(m => text.includes(m))
    return mood || null
  } catch (error) {
    console.error('Mood detection error:', error)
    return null
  }
}

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
        detectedMood: null
      })
    }

    const systemPrompt = userProfile ? buildSystemPrompt(userProfile) : FALLBACK_SYSTEM_PROMPT
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }],
        },
        {
          role: 'model',
          parts: [{ text: 'Understood. I am ready.' }],
        },
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

    // Detect mood from user message in parallel
    const detectedMood = await detectMood(lastMessage.content)

    return NextResponse.json({
      role: 'assistant',
      content: text,
      detectedMood
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}
