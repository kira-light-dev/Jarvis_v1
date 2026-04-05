'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp, Sparkles } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FadeIn, TypingEffect, ThinkingDots, WordReveal } from '@/components/motion'
import { useUserStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isNew?: boolean
}

const MOOD_HINTS: Record<string, string> = {
  overwhelmed: "One thing at a time. What's the most pressing right now?",
  anxious: "I'm here. What's weighing on you?",
  focused: "You're in the zone. What are we tackling?",
  driven: "Let's go. What's the mission today?",
  neutral: "What's on your mind?"
}

const MOOD_PROMPTS: Record<string, string[]> = {
  overwhelmed: [
    "What's the one thing that actually matters right now?",
    "Help me cut my task list down",
    "I need to vent for a second"
  ],
  anxious: [
    "Be honest — am I behind?",
    "Give me something small I can finish right now",
    "Talk me through my exam plan"
  ],
  focused: [
    "Deep dive: let's do DSA today",
    "Review my goals with me",
    "Give me a hard problem to solve"
  ],
  driven: [
    "What should I conquer today?",
    "Push me harder on DSA",
    "Let's map out this week"
  ],
  neutral: [
    "What should I focus on today?",
    "Review my week with me",
    "Help me think through something"
  ]
}

export default function ChatPage() {
  const user = useUserStore((state) => state.user)
  const updateMood = useUserStore((state) => state.updateMood)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const currentMood = user?.characterDNA?.currentMood || 'neutral'
  const hintText = MOOD_HINTS[currentMood] || MOOD_HINTS.neutral
  const quickPrompts = MOOD_PROMPTS[currentMood] || MOOD_PROMPTS.neutral

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async (content: string = input) => {
    if (!content.trim() || isLoading) return

    setShowWelcome(false)
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userProfile: user,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.content,
          timestamp: new Date(),
          isNew: true,
        }
        setMessages((prev) => [...prev, assistantMessage])
        
        // Update mood if detected
        if (data.detectedMood && user?.characterDNA) {
          updateMood(data.detectedMood)
        }

        // Mark message as not new after animation completes
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id ? { ...m, isNew: false } : m
            )
          )
        }, 2000)
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex h-full flex-col">
      <ScrollArea ref={scrollRef} className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <AnimatePresence>
            {showWelcome && messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-12 space-y-8"
              >
                <FadeIn delay={0.2}>
                  <h1 className="text-2xl font-bold text-foreground">
                    Good {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}
                  </h1>
                  <p className="text-muted-foreground mt-2">
                    <TypingEffect
                      text="How may I assist you today?"
                      speed={50}
                      delay={500}
                    />
                  </p>
                </FadeIn>

                <FadeIn delay={1.5}>
                  <div className="flex flex-wrap justify-center gap-3 max-w-xl mx-auto">
                    {quickPrompts.map((prompt, i) => (
                      <motion.button
                        key={prompt}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.5 + i * 0.1 }}
                        onClick={() => handleSubmit(prompt)}
                        className="px-4 py-2 text-left text-sm glass-panel rounded-lg hover:border-primary/50 transition-colors border border-border/50"
                      >
                        <Sparkles className="h-3 w-3 text-primary inline mr-2" />
                        {prompt}
                      </motion.button>
                    ))}
                  </div>
                </FadeIn>
              </motion.div>
            )}
          </AnimatePresence>

          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'group',
                message.role === 'user' ? 'flex justify-end' : ''
              )}
            >
              {message.role === 'assistant' ? (
                <div className="max-w-[65%]">
                  <div className="text-base text-foreground leading-relaxed whitespace-pre-wrap">
                    {message.isNew ? (
                      <WordReveal text={message.content} />
                    ) : (
                      message.content
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground/40 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ) : (
                <div className="max-w-[55%]">
                  <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-2">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground/40 mt-2 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <ThinkingDots />
            </motion.div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-border/50 p-4">
        <div className="mx-auto max-w-3xl">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask J.A.R.V.I.S. anything..."
              className="min-h-[50px] max-h-32 resize-none bg-transparent border-0 border-b border-border/30 focus:border-primary transition-colors duration-300 pr-12 rounded-none focus-visible:ring-0"
              disabled={isLoading}
            />
            
            <AnimatePresence>
              {input.trim() && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  onClick={() => handleSubmit()}
                  disabled={isLoading}
                  className="absolute right-3 bottom-3 h-8 w-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
                >
                  <ArrowUp className="h-4 w-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          
          <p className="text-xs text-muted-foreground/50 italic text-center mt-2">
            {hintText}
          </p>
        </div>
      </div>
    </div>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
