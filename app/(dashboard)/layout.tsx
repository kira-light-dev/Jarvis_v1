'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { useUserStore } from '@/lib/store'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { scaleIn } from '@/lib/animations'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const isOnboarded = useUserStore((state) => state.isOnboarded)
  const user = useUserStore((state) => state.user)
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false)
  const [quickCaptureInput, setQuickCaptureInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOnboarded) {
      router.push('/')
    }
  }, [isOnboarded, router])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K for Quick Capture
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsQuickCaptureOpen(true)
      }
      
      // Cmd+Shift+F or Ctrl+Shift+F for Focus Mode
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'f') {
        e.preventDefault()
        router.push('/focus')
      }
      
      // Escape to close Quick Capture
      if (e.key === 'Escape' && isQuickCaptureOpen) {
        setIsQuickCaptureOpen(false)
        setQuickCaptureInput('')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router, isQuickCaptureOpen])

  // Focus input when Quick Capture opens
  useEffect(() => {
    if (isQuickCaptureOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isQuickCaptureOpen])

  const handleQuickCaptureSubmit = async () => {
    if (!quickCaptureInput.trim()) return

    const message = quickCaptureInput.trim()
    setIsQuickCaptureOpen(false)
    setQuickCaptureInput('')

    // Navigate to chat with the message
    // Store in sessionStorage so chat page can pick it up
    sessionStorage.setItem('jarvis-quick-message', message)
    router.push('/chat')
  }

  const handleQuickCaptureKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleQuickCaptureSubmit()
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/50 px-4">
          <SidebarTrigger className="text-muted-foreground hover:text-primary" />
          <Separator orientation="vertical" className="h-4" />
          <div className="flex-1" />
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px]">Cmd</kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px]">K</kbd>
            <span className="ml-2">Quick Capture</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>

      {/* Quick Capture Overlay */}
      <AnimatePresence>
        {isQuickCaptureOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsQuickCaptureOpen(false)
                setQuickCaptureInput('')
              }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            />
            
            {/* Quick Capture Dialog */}
            <motion.div
              variants={scaleIn}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
            >
              <div className="glass-panel border border-primary/20 rounded-2xl p-6">
                <p className="text-xs text-muted-foreground mb-3">
                  Tell JARVIS something...
                </p>
                <Input
                  ref={inputRef}
                  value={quickCaptureInput}
                  onChange={(e) => setQuickCaptureInput(e.target.value)}
                  onKeyDown={handleQuickCaptureKeyDown}
                  placeholder="What's on your mind?"
                  className="bg-transparent border-0 border-b border-primary/30 focus:border-primary text-lg rounded-none focus-visible:ring-0"
                />
                <p className="text-xs text-muted-foreground/50 mt-3">
                  Press Enter to send, Escape to close
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </SidebarProvider>
  )
}
