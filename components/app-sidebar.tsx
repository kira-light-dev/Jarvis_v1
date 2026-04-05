'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  MessageSquare, 
  Target, 
  Calendar, 
  LayoutDashboard, 
  Settings,
  BookOpen,
  Zap,
  Dna,
  Crosshair,
  Clock,
} from 'lucide-react'
import { motion } from 'framer-motion'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useUserStore } from '@/lib/store'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const mainNavItems = [
  {
    title: 'Chat',
    href: '/chat',
    icon: MessageSquare,
    description: 'Talk with J.A.R.V.I.S.',
  },
  {
    title: 'Focus',
    href: '/focus',
    icon: Crosshair,
    description: 'One thing at a time',
  },
  {
    title: 'DSA Tracker',
    href: '/dsa',
    icon: BookOpen,
    description: 'Track your problems',
  },
  {
    title: 'Goals',
    href: '/goals',
    icon: Target,
    description: 'Manage your goals',
  },
  {
    title: 'Exams',
    href: '/exams',
    icon: Calendar,
    description: 'Exam schedule',
  },
]

const secondaryNavItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

const moodColors = {
  overwhelmed: 'text-destructive',
  driven: 'text-green-400',
  anxious: 'text-yellow-400',
  focused: 'text-primary',
  neutral: 'text-muted-foreground',
}

const moodLabels = {
  overwhelmed: 'Overwhelmed',
  driven: 'Driven',
  anxious: 'Anxious',
  focused: 'Focused',
  neutral: 'Neutral',
}

const energyLevels = {
  high: 100,
  moderate: 55,
  low: 20,
}

export function AppSidebar() {
  const pathname = usePathname()
  const user = useUserStore((state) => state.user)
  const [isObserverOpen, setIsObserverOpen] = useState(false)

  const characterDNA = user?.characterDNA

  return (
    <Sidebar className="border-r border-border/50">
      <SidebarHeader className="border-b border-border/50 p-4">
        <Link href="/chat" className="flex items-center gap-3">
          <motion.div
            className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/30"
            animate={{
              boxShadow: [
                '0 0 0px var(--glow)',
                '0 0 15px var(--glow)',
                '0 0 0px var(--glow)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Zap className="h-5 w-5 text-primary" />
          </motion.div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-primary animate-text-glow">
              J.A.R.V.I.S.
            </h1>
            <p className="text-xs text-muted-foreground">AI Study Companion</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/70 uppercase tracking-wider text-[10px]">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.description}
                      className={isActive ? 'bg-primary/10 text-primary border border-primary/30' : ''}
                    >
                      <Link href={item.href}>
                        <item.icon className={isActive ? 'text-primary' : ''} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/70 uppercase tracking-wider text-[10px]">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={isActive ? 'bg-primary/10 text-primary border border-primary/30' : ''}
                    >
                      <Link href={item.href}>
                        <item.icon className={isActive ? 'text-primary' : ''} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* DNA Button */}
        <div className="px-3 mt-auto">
          <Sheet open={isObserverOpen} onOpenChange={setIsObserverOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 border-primary/30 hover:bg-primary/10"
              >
                <Dna className="h-4 w-4 text-primary" />
                <span className="text-sm">DNA</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="glass-panel border-border/50 w-80">
              <SheetHeader>
                <SheetTitle className="text-xs tracking-widest uppercase text-muted-foreground/50">
                  What I know
                </SheetTitle>
              </SheetHeader>
              
              {characterDNA ? (
                <div className="space-y-6 mt-6">
                  {/* Current State */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Right now</p>
                    <p className={cn(
                      'text-lg font-semibold',
                      moodColors[characterDNA.currentMood]
                    )}>
                      {moodLabels[characterDNA.currentMood]}
                    </p>
                  </div>

                  {/* Energy Bar */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Energy</p>
                    <Progress 
                      value={energyLevels[characterDNA.energyLevel]} 
                      className="h-1"
                    />
                  </div>

                  {/* Focus Window */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{characterDNA.focusWindow}</span>
                  </div>

                  {/* Avoidance Patterns */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Tends to avoid</p>
                    <div className="flex flex-wrap gap-2">
                      {characterDNA.avoidancePatterns.map((pattern, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {pattern}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Dominant Trait */}
                  <div className="border-l-2 border-primary/30 pl-3">
                    <p className="text-sm text-muted-foreground italic">
                      {characterDNA.dominantTrait}
                    </p>
                  </div>

                  {/* Core Motivation */}
                  <div>
                    <p className="text-xs text-muted-foreground/60">
                      {characterDNA.coreMotivation}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Complete onboarding to unlock your profile
                  </p>
                  <Link href="/">
                    <Button variant="outline" className="border-primary/30">
                      Start Onboarding
                    </Button>
                  </Link>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-4">
        {user ? (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-primary/30">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {user.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{user.name}</span>
              <span className="text-xs text-muted-foreground">
                {user.branch} - Sem {user.semester}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 opacity-50">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-muted">?</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">Not signed in</span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
