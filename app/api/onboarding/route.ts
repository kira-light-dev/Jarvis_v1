import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null

export async function POST(req: NextRequest) {
  try {
    const { answers, userProfile } = await req.json()

    if (!answers || !Array.isArray(answers) || answers.length !== 10) {
      return NextResponse.json(
        { error: 'Invalid answers format' },
        { status: 400 }
      )
    }

    let characterDNA = null

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
        
        const prompt = `Read these 10 answers from a student. Extract their profile as ONLY valid JSON with exactly: energyLevel (high/moderate/low), currentMood (driven/overwhelmed/anxious/focused/neutral), avoidancePatterns (array of 2-3 behavioral patterns you detected from the answers), focusWindow (when they seem most productive, infer from answers), dominantTrait (one brutally honest sentence about who they are), communicationStyle (direct/gentle/analytical/tough-love — pick what will work best), biggestFear (inferred), coreMotivation (what actually drives them based on what they said). Base everything on what they actually wrote. No generic answers.

Answers:
1. When you have free time and nobody's watching — what do you actually end up doing?
${answers[0]}

2. What's something you care about that you've never told anyone?
${answers[1]}

3. When things get hard, do you push harder, go quiet, or spiral?
${answers[2]}

4. What does a perfect day look like for you — the real one, not the ideal?
${answers[3]}

5. What's the one thing you keep telling yourself you'll start someday?
${answers[4]}

6. Five years from now, you're proud of yourself. What happened?
${answers[5]}

7. What's your relationship with failure? Does it teach you or break you?
${answers[6]}

8. Late night, deadline tomorrow, everything's behind — what do you actually do?
${answers[7]}

9. What kind of support do you actually want when you're struggling?
${answers[8]}

10. One word. How are you, really, right now?
${answers[9]}

Return ONLY the JSON object, no markdown, no explanation.`

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()
        
        // Parse JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          characterDNA = {
            energyLevel: parsed.energyLevel || 'moderate',
            currentMood: parsed.currentMood || 'neutral',
            avoidancePatterns: parsed.avoidancePatterns || [],
            focusWindow: parsed.focusWindow || 'Evening',
            dominantTrait: parsed.dominantTrait || 'A student finding their way',
            communicationStyle: parsed.communicationStyle || 'direct',
            biggestFear: parsed.biggestFear || 'Not reaching potential',
            coreMotivation: parsed.coreMotivation || 'Growth and success',
            lastUpdated: new Date().toISOString()
          }
        }
      } catch (aiError) {
        console.error('Gemini extraction error:', aiError)
        // Continue without AI extraction
      }
    }

    // Fallback CharacterDNA if AI extraction fails
    if (!characterDNA) {
      characterDNA = {
        energyLevel: 'moderate' as const,
        currentMood: 'neutral' as const,
        avoidancePatterns: ['Procrastination', 'Overthinking'],
        focusWindow: 'Evening',
        dominantTrait: 'A determined student ready to grow',
        communicationStyle: 'direct' as const,
        biggestFear: 'Not reaching full potential',
        coreMotivation: 'Building a successful career',
        lastUpdated: new Date().toISOString()
      }
    }

    // Try to save to MongoDB
    const conn = await connectDB()
    if (conn && userProfile?.email) {
      try {
        await User.findOneAndUpdate(
          { email: userProfile.email },
          {
            ...userProfile,
            onboardingAnswers: answers,
            characterDNA,
            totalXP: 100, // Starting XP for completing onboarding
            streak: 1,
            lastActiveDate: new Date().toISOString().split('T')[0]
          },
          { upsert: true, new: true }
        )
      } catch (dbError) {
        console.error('MongoDB save error:', dbError)
      }
    }

    return NextResponse.json({
      success: true,
      characterDNA,
      totalXP: 100,
      streak: 1
    })
  } catch (error) {
    console.error('Onboarding API error:', error)
    return NextResponse.json(
      { error: 'Failed to process onboarding' },
      { status: 500 }
    )
  }
}
