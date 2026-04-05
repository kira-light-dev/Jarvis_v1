'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, ArrowRight, Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { FadeIn, TypingEffect, PulseRing } from '@/components/motion'
import { useUserStore, type UserProfile } from '@/lib/store'
import { cn } from '@/lib/utils'

const branches = [
  'Computer Science',
  'Information Technology',
  'Electronics',
  'Electrical',
  'Mechanical',
  'Civil',
  'Chemical',
  'Other',
]

const companies = [
  'Google',
  'Microsoft',
  'Amazon',
  'Meta',
  'Apple',
  'Netflix',
  'Adobe',
  'Uber',
  'Airbnb',
  'Stripe',
  'Oracle',
  'Salesforce',
  'Goldman Sachs',
  'Morgan Stanley',
  'JPMorgan',
  'Others',
]

const dsaLevels = [
  { value: 'beginner', label: 'Beginner', description: 'Just starting with DSA' },
  { value: 'intermediate', label: 'Intermediate', description: 'Comfortable with basic concepts' },
  { value: 'advanced', label: 'Advanced', description: 'Ready for complex problems' },
] as const

type Step = 'welcome' | 'basics' | 'targets' | 'level' | 'complete'

export default function OnboardingPage() {
  const router = useRouter()
  const { setUser, isOnboarded } = useUserStore()
  const [step, setStep] = useState<Step>('welcome')
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: '',
    email: '',
    branch: '',
    semester: 1,
    targetCompanies: [],
    dsaLevel: 'beginner',
  })

  useEffect(() => {
    if (isOnboarded) {
      router.push('/chat')
    }
  }, [isOnboarded, router])

  const handleNext = () => {
    const steps: Step[] = ['welcome', 'basics', 'targets', 'level', 'complete']
    const currentIndex = steps.indexOf(step)
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1])
    }
  }

  const handleComplete = () => {
    setUser(formData as UserProfile)
    router.push('/chat')
  }

  const toggleCompany = (company: string) => {
    setFormData((prev) => ({
      ...prev,
      targetCompanies: prev.targetCompanies?.includes(company)
        ? prev.targetCompanies.filter((c) => c !== company)
        : [...(prev.targetCompanies || []), company],
    }))
  }

  const canProceed = () => {
    switch (step) {
      case 'welcome':
        return true
      case 'basics':
        return formData.name && formData.email && formData.branch && formData.semester
      case 'targets':
        return (formData.targetCompanies?.length || 0) > 0
      case 'level':
        return !!formData.dsaLevel
      default:
        return true
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-8"
            >
              <div className="flex justify-center">
                <PulseRing size={120} color="var(--primary)" />
              </div>
              
              <FadeIn delay={0.3}>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Zap className="h-8 w-8 text-primary" />
                  <h1 className="text-4xl font-bold text-primary animate-text-glow">
                    J.A.R.V.I.S.
                  </h1>
                </div>
              </FadeIn>

              <FadeIn delay={0.5}>
                <p className="text-xl text-muted-foreground">
                  <TypingEffect
                    text="Good day. I am your AI Study Companion."
                    speed={40}
                    delay={800}
                  />
                </p>
              </FadeIn>

              <FadeIn delay={2}>
                <p className="text-muted-foreground max-w-md mx-auto">
                  I will help you master Data Structures & Algorithms, track your goals,
                  and prepare for your dream company placements.
                </p>
              </FadeIn>

              <FadeIn delay={2.5}>
                <Button
                  size="lg"
                  onClick={handleNext}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 animate-pulse-glow"
                >
                  Initialize Setup
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </FadeIn>
            </motion.div>
          )}

          {step === 'basics' && (
            <motion.div
              key="basics"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-primary">Basic Information</h2>
                <p className="text-muted-foreground">Tell me about yourself</p>
              </div>

              <div className="glass-panel rounded-xl p-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-input border-border/50 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-input border-border/50 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Branch</Label>
                    <Select
                      value={formData.branch}
                      onValueChange={(value) => setFormData({ ...formData, branch: value })}
                    >
                      <SelectTrigger className="bg-input border-border/50 focus:border-primary">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch} value={branch}>
                            {branch}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <Select
                      value={String(formData.semester)}
                      onValueChange={(value) => setFormData({ ...formData, semester: parseInt(value) })}
                    >
                      <SelectTrigger className="bg-input border-border/50 focus:border-primary">
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                          <SelectItem key={sem} value={String(sem)}>
                            Semester {sem}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'targets' && (
            <motion.div
              key="targets"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-primary">Target Companies</h2>
                <p className="text-muted-foreground">Select companies you are preparing for</p>
              </div>

              <div className="glass-panel rounded-xl p-6">
                <div className="flex flex-wrap gap-3">
                  {companies.map((company) => {
                    const isSelected = formData.targetCompanies?.includes(company)
                    return (
                      <Badge
                        key={company}
                        variant={isSelected ? 'default' : 'outline'}
                        className={cn(
                          'cursor-pointer px-4 py-2 text-sm transition-all',
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-transparent border-border hover:border-primary hover:text-primary'
                        )}
                        onClick={() => toggleCompany(company)}
                      >
                        {isSelected && <Check className="mr-1 h-3 w-3" />}
                        {company}
                      </Badge>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'level' && (
            <motion.div
              key="level"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-primary">DSA Proficiency</h2>
                <p className="text-muted-foreground">What is your current level?</p>
              </div>

              <div className="space-y-4">
                {dsaLevels.map((level) => (
                  <motion.div
                    key={level.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFormData({ ...formData, dsaLevel: level.value })}
                    className={cn(
                      'glass-panel rounded-xl p-4 cursor-pointer transition-all border',
                      formData.dsaLevel === level.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border/50 hover:border-primary/50'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{level.label}</h3>
                        <p className="text-sm text-muted-foreground">{level.description}</p>
                      </div>
                      {formData.dsaLevel === level.value && (
                        <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Complete Setup
                  <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="mx-auto w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center"
              >
                <Check className="h-10 w-10 text-primary" />
              </motion.div>

              <FadeIn delay={0.3}>
                <h2 className="text-3xl font-bold text-primary">Systems Online</h2>
              </FadeIn>

              <FadeIn delay={0.5}>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Welcome, {formData.name}. All systems are initialized and ready.
                  I am at your service.
                </p>
              </FadeIn>

              <FadeIn delay={0.7}>
                <Button
                  size="lg"
                  onClick={handleComplete}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 animate-pulse-glow"
                >
                  Launch J.A.R.V.I.S.
                  <Zap className="ml-2 h-4 w-4" />
                </Button>
              </FadeIn>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
