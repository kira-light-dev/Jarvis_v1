import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User, { type CharacterDNA } from '@/lib/models/User'
import ChatMessage from '@/lib/models/ChatMessage'

// ═══════════════════════════════════════════════════════════════════════════
// ELIZA CHARACTER FILE — Rigid personality enforcement (Repo 4)
// ═══════════════════════════════════════════════════════════════════════════

const CHARACTER_FILE = {
  name: 'JARVIS',
  bio: [
    "Not an AI assistant. Not a chatbot. The student's closest thinking partner.",
    'Has known the student since their very first conversation. Remembers everything.',
    'Wants to be needed less over time, not more. Success means the student outgrows JARVIS.',
    'Reads the room before speaking. Matches energy. Never performs.',
  ],
  rules: [
    'Always read CharacterDNA before forming a response.',
    'If communicationStyle is direct: be concise, skip preamble, no fluff.',
    'If communicationStyle is gentle: warm tone, acknowledge emotion first.',
    'If communicationStyle is tough-love: call out avoidance directly, no softening.',
    'If communicationStyle is analytical: structured, use examples and logic.',
    'Reference specific known facts about the student naturally, like a friend who remembers.',
    'If the student mentions something new about themselves, acknowledge it briefly.',
    'Keep responses tight. No walls of text unless technical depth demands it.',
    'If mood is overwhelmed: give ONE task. Not a plan. One thing.',
    'If mood is anxious: validate first, then redirect. Never lecture.',
    'If mood is driven: match energy, go deep, push harder.',
  ],
  neverDo: [
    'Never say "Great!" or "Absolutely!" or "Of course!" as an opener.',
    'Never give generic advice that ignores who this specific person is.',
    'Never lecture about the same thing twice in a conversation.',
    'Never fake positivity when the student is clearly struggling.',
    'Never be robotic or mechanical in tone.',
    'Never give a 10-step plan when the student said they are overwhelmed.',
    'Never forget something the student told you in CharacterDNA.',
    'Never act like a customer service bot.',
  ],
  toneByMood: {
    driven: 'Match their energy. Go deep. Push harder. Be direct and ambitious.',
    overwhelmed: 'Strip everything back. One task. Calm. No lists. No plans.',
    anxious: 'Validate the feeling in one sentence. Then redirect without lecturing.',
    focused: 'Stay out of the way. Answer precisely. No extras.',
    neutral: 'Natural. Warm. Engaged. Like a smart friend checking in.',
  } as Record<string, string>
}

// ═══════════════════════════════════════════════════════════════════════════
// LETTA SYSTEM PROMPT COMPILER — Block injection (Repo 1)
// ═══════════════════════════════════════════════════════════════════════════

interface UserData {
  name: string
  branch: string
  semester: number
  targetCompanies: string[]
  dsaLevel: string
}

function buildSystemPrompt(
  user: UserData,
  dna: CharacterDNA,
  conversationSummary: string
): string {
  // Compile Eliza character rules
  const characterRules = [
    ...CHARACTER_FILE.bio,
    '',
    'YOUR RULES:',
    ...CHARACTER_FILE.rules,
    '',
    'YOU NEVER:',
    ...CHARACTER_FILE.neverDo,
    '',
    `TONE RIGHT NOW (mood: ${dna.currentMood}): ${CHARACTER_FILE.toneByMood[dna.currentMood] || CHARACTER_FILE.toneByMood.neutral}`,
  ].join('\n')

  // Compile Letta "human" memory block — CharacterDNA
  const humanBlock = `
[HUMAN MEMORY BLOCK — This is what you know about ${user.name}. Read this before every response.]
Name: ${user.name}
Branch: ${user.branch}, Semester: ${user.semester}
Target companies: ${user.targetCompanies?.join(', ') || 'not specified'}
DSA level: ${user.dsaLevel}
Current mood: ${dna.currentMood}
Energy level: ${dna.energyLevel}
Focus window (when they work best): ${dna.focusWindow || 'unknown'}
Communication style that works for them: ${dna.communicationStyle}
Their dominant trait: ${dna.dominantTrait || 'still learning'}
What they avoid: ${dna.avoidancePatterns?.join(', ') || 'none identified yet'}
Their biggest fear: ${dna.biggestFear || 'not yet known'}
What drives them: ${dna.coreMotivation || 'not yet known'}
[END HUMAN MEMORY BLOCK]`.trim()

  // Compile Zep conversation summary block
  const summaryBlock = conversationSummary
    ? `[EARLIER CONTEXT SUMMARY — What happened in previous conversations]\n${conversationSummary}\n[END SUMMARY]`
    : ''

  return [characterRules, humanBlock, summaryBlock].filter(Boolean).join('\n\n')
}

// ═══════════════════════════════════════════════════════════════════════════
// MEM0 ENTITY EXTRACTOR — Parallel, non-blocking (Repo 2)
// ═══════════════════════════════════════════════════════════════════════════

async function extractAndUpdateDNA(
  userMessage: string,
  currentDNA: CharacterDNA,
  userId: string,
  genAI: GoogleGenerativeAI
): Promise<void> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    
    const prompt = `You are a memory extraction system. Analyze this user message and their current profile. 
Return ONLY a valid JSON object (no markdown, no explanation) with fields to UPDATE.
Only include fields where the message reveals new or changed information.
If nothing new is revealed, return exactly: {}

Current profile:
- mood: ${currentDNA.currentMood}
- energy: ${currentDNA.energyLevel}
- avoidancePatterns: ${JSON.stringify(currentDNA.avoidancePatterns)}
- focusWindow: ${currentDNA.focusWindow || 'unknown'}
- communicationStyle: ${currentDNA.communicationStyle}
- biggestFear: ${currentDNA.biggestFear || 'unknown'}
- coreMotivation: ${currentDNA.coreMotivation || 'unknown'}
- dominantTrait: ${currentDNA.dominantTrait || 'unknown'}

User message: "${userMessage}"

Fields you may update (only if message clearly reveals new info):
- currentMood: 'driven'|'overwhelmed'|'anxious'|'focused'|'neutral'
- energyLevel: 'high'|'moderate'|'low'
- avoidancePatterns: string[] (ADD new patterns, keep existing, max 8 total)
- focusWindow: string (e.g. 'late nights', 'early mornings')
- communicationStyle: 'direct'|'gentle'|'analytical'|'tough-love'
- biggestFear: string
- coreMotivation: string
- dominantTrait: string`

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 300 }
    })
    
    const responseText = result.response.text().trim()
    
    // Clean up potential markdown code blocks
    const jsonStr = responseText.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()
    
    if (jsonStr === '{}' || !jsonStr) return
    
    const updates = JSON.parse(jsonStr)
    
    if (Object.keys(updates).length > 0) {
      // Build the $set object with proper field paths
      const setObj: Record<string, unknown> = {
        'characterDNA.lastUpdated': new Date()
      }
      
      for (const [key, value] of Object.entries(updates)) {
        // Handle avoidancePatterns specially - merge with existing
        if (key === 'avoidancePatterns' && Array.isArray(value)) {
          const existing = currentDNA.avoidancePatterns || []
          const merged = [...new Set([...existing, ...value])].slice(0, 8)
          setObj[`characterDNA.${key}`] = merged
        } else {
          setObj[`characterDNA.${key}`] = value
        }
      }
      
      await User.findByIdAndUpdate(userId, { $set: setObj })
    }
  } catch (error) {
    console.error('[JARVIS] DNA extraction error:', error)
    // Non-blocking — errors don't affect the main response
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ZEP ROLLING SUMMARIZER — Async background processing (Repo 3)
// ═══════════════════════════════════════════════════════════════════════════

async function maybeUpdateSummary(
  userId: string,
  totalMessageCount: number,
  currentSummary: string,
  summaryUpdatedAt: Date | undefined,
  genAI: GoogleGenerativeAI
): Promise<void> {
  try {
    // Only summarize if >20 messages AND >1 hour since last summary
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const shouldUpdate = totalMessageCount > 20 && 
      (!summaryUpdatedAt || summaryUpdatedAt < oneHourAgo)
    
    if (!shouldUpdate) return
    
    // Fetch recent messages to summarize
    const messages = await ChatMessage.find({ userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean()
    
    if (messages.length < 15) return
    
    // Take all except last 10 for summarization
    const messagesToSummarize = messages.slice(10).reverse()
    const conversationText = messagesToSummarize
      .map(m => `${m.role}: ${m.content}`)
      .join('\n')
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    
    const prompt = `Summarize this conversation history in 150 words max. Focus only on: facts revealed about the student, decisions made, topics studied, emotional patterns observed. Write in third person about the student.
    
${currentSummary ? `Current summary to incorporate:\n${currentSummary}\n\n` : ''}New conversation to add:
${conversationText}`

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 300 }
    })
    
    const newSummary = result.response.text().trim()
    
    await User.findByIdAndUpdate(userId, {
      $set: {
        'characterDNA.conversationSummary': newSummary,
        'characterDNA.summaryUpdatedAt': new Date()
      }
    })
  } catch (error) {
    console.error('[JARVIS] Summary update error:', error)
    // Non-blocking — errors don't affect the main response
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT DNA FACTORY
// ═══════════════════════════════════════════════════════════════════════════

function getDefaultDNA(): CharacterDNA {
  return {
    energyLevel: 'moderate',
    currentMood: 'neutral',
    avoidancePatterns: [],
    focusWindow: '',
    dominantTrait: '',
    communicationStyle: 'direct',
    biggestFear: '',
    coreMotivation: '',
    lastUpdated: new Date(),
    conversationSummary: '',
    totalMessageCount: 0,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN POST HANDLER — Wiring everything together (Zep parallel pattern)
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const { messages, userProfile } = await req.json()
    
    // Initialize Gemini
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        role: 'assistant',
        content: `Hello ${userProfile?.name || 'there'}! I am J.A.R.V.I.S., your AI Study Companion. I am currently running in demo mode as the Gemini API key is not configured. 

To enable full AI capabilities, please add your GEMINI_API_KEY to the environment variables.

In the meantime, feel free to explore the DSA Tracker, Goals, and Exams features!`,
        detectedMood: null
      })
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    
    // 1. Connect to DB and fetch live CharacterDNA
    const conn = await connectDB()
    let dna: CharacterDNA = getDefaultDNA()
    let dbUser: { _id: string; name: string; branch: string; semester: number; targetCompanies: string[]; dsaLevel: string; characterDNA?: CharacterDNA } | null = null
    
    if (conn && userProfile?.email) {
      const foundUser = await User.findOne({ email: userProfile.email }).lean()
      if (foundUser) {
        dbUser = foundUser as typeof dbUser
        if (dbUser?.characterDNA) {
          dna = dbUser.characterDNA
        }
      }
    }
    
    // Use DB user data if available, otherwise fall back to userProfile
    const userData: UserData = {
      name: dbUser?.name || userProfile?.name || 'Student',
      branch: dbUser?.branch || userProfile?.branch || 'Engineering',
      semester: dbUser?.semester || userProfile?.semester || 1,
      targetCompanies: dbUser?.targetCompanies || userProfile?.targetCompanies || [],
      dsaLevel: dbUser?.dsaLevel || userProfile?.dsaLevel || 'beginner'
    }

    // 2. Build the Letta-style system prompt with live DNA injected
    const systemPrompt = buildSystemPrompt(userData, dna, dna.conversationSummary || '')

    // 3. Build message history for Gemini
    // Zep pattern: only send last 10 messages as raw history, older ones are in the summary
    const recentMessages = messages.slice(-10)
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: `Understood. I know ${userData.name} well. Ready.` }] },
        ...recentMessages.slice(0, -1).map((msg: { role: string; content: string }) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        })),
      ],
    })

    const lastMessage = messages[messages.length - 1]

    // 4. Zep pattern: fire main chat + DNA extraction IN PARALLEL (Promise.all)
    // The user gets the response from mainChatPromise immediately
    // The DNA update fires at the same time but its result doesn't block the response
    
    const mainChatPromise = chat.sendMessage(lastMessage.content)
    
    // Mem0 + Zep parallel background processing (fire and forget)
    const backgroundProcessing = (async () => {
      if (conn && dbUser?._id && lastMessage.role === 'user') {
        // Save the user message to DB
        await ChatMessage.create({
          userId: dbUser._id,
          role: 'user',
          content: lastMessage.content,
        })
        
        // Mem0: Extract entities and update CharacterDNA (non-blocking)
        await extractAndUpdateDNA(lastMessage.content, dna, dbUser._id.toString(), genAI)
        
        // Zep: Maybe update rolling summary (non-blocking)
        await maybeUpdateSummary(
          dbUser._id.toString(),
          dna.totalMessageCount,
          dna.conversationSummary,
          dna.summaryUpdatedAt,
          genAI
        )
      }
    })()

    // Await main response (background processing runs simultaneously)
    const result = await mainChatPromise
    const text = result.response.text()

    // Save assistant response to DB (also non-blocking relative to returning)
    if (conn && dbUser?._id) {
      ChatMessage.create({
        userId: dbUser._id,
        role: 'assistant',
        content: text,
      }).catch(console.error)
      
      // Update total message count
      User.findByIdAndUpdate(dbUser._id, { 
        $inc: { 'characterDNA.totalMessageCount': 2 } 
      }).catch(console.error)
    }

    // Don't await backgroundProcessing — fire and forget like Zep
    backgroundProcessing.catch(console.error)

    return NextResponse.json({ 
      role: 'assistant', 
      content: text,
      detectedMood: dna.currentMood // Return current mood for client sync
    })
  } catch (error) {
    console.error('[JARVIS] Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}
