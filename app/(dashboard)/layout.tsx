'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { useUserStore } from '@/lib/store'
import { Separator } from '@/components/ui/separator'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const isOnboarded = useUserStore((state) => state.isOnboarded)

  useEffect(() => {
    if (!isOnboarded) {
      router.push('/')
    }
  }, [isOnboarded, router])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/50 px-4">
          <SidebarTrigger className="text-muted-foreground hover:text-primary" />
          <Separator orientation="vertical" className="h-4" />
          <div className="flex-1" />
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
