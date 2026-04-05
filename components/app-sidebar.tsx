'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  MessageSquare, 
  Target, 
  Calendar, 
  LayoutDashboard, 
  Settings,
  BookOpen,
  Zap
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
import { useUserStore } from '@/lib/store'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const mainNavItems = [
  {
    title: 'Chat',
    href: '/chat',
    icon: MessageSquare,
    description: 'Talk with J.A.R.V.I.S.',
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

export function AppSidebar() {
  const pathname = usePathname()
  const user = useUserStore((state) => state.user)

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
