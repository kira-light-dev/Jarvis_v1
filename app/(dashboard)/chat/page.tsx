'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { FadeIn, TypingEffect } from '@/components/motion'
import { useUserStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const quickPrompts = [
  'Explain Binary Search with examples',
  'How to prepare for Google interviews?',
  'Create a study plan for this week',
  'Help me solve a LeetCode problem',
]

export default function ChatPage() {
  const user = useUserStore((state) => state.user)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
        }
        setMessages((prev) => [...prev, assistantMessage])
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
                <FadeIn>
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 animate-pulse-glow">
                    <Bot className="h-8 w-8 text-primary" />
                  </div>
                </FadeIn>

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
                  <div className="grid gap-3 md:grid-cols-2 max-w-xl mx-auto">
                    {quickPrompts.map((prompt, i) => (
                      <motion.button
                        key={prompt}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.5 + i * 0.1 }}
                        onClick={() => handleSubmit(prompt)}
                        className="p-3 text-left text-sm glass-panel rounded-lg hover:border-primary/50 transition-colors border border-border/50"
                      >
                        <Sparkles className="h-4 w-4 text-primary mb-2" />
                        {prompt}
                      </motion.button>
                    ))}
                  </div>
                </FadeIn>
              </motion.div>
            )}
          </AnimatePresence>

          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index === messages.length - 1 ? 0.1 : 0 }}
              className={cn(
                'flex gap-4',
                message.role === 'user' ? 'flex-row-reverse' : ''
              )}
            >
              <Avatar className={cn(
                'h-8 w-8 shrink-0',
                message.role === 'assistant' ? 'border border-primary/30' : ''
              )}>
                <AvatarFallback className={cn(
                  message.role === 'assistant' 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-secondary text-secondary-foreground'
                )}>
                  {message.role === 'assistant' ? (
                    <Bot className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </AvatarFallback>
              </Avatar>

              <div className={cn(
                'flex-1 max-w-[80%] rounded-xl p-4',
                message.role === 'assistant'
                  ? 'glass-panel border border-border/50'
                  : 'bg-primary text-primary-foreground'
              )}>
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                  {message.content}
                </div>
                <p className={cn(
                  'text-xs mt-2',
                  message.role === 'assistant' ? 'text-muted-foreground' : 'text-primary-foreground/70'
                )}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4"
            >
              <Avatar className="h-8 w-8 border border-primary/30">
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="glass-panel border border-border/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Processing...</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-border/50 p-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex gap-3">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask J.A.R.V.I.S. anything..."
              className="min-h-[50px] max-h-32 resize-none bg-input border-border/50 focus:border-primary"
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-[50px] w-[50px] bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Press Enter to send, Shift+Enter for new line
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
