'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { User, LogOut, Trash2, Check, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { FadeIn } from '@/components/motion'
import { useUserStore, type UserProfile } from '@/lib/store'
import { toast } from 'sonner'
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

export default function SettingsPage() {
  const router = useRouter()
  const { user, setUser, clearUser } = useUserStore()
  const [formData, setFormData] = useState<Partial<UserProfile>>(user || {})
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.branch) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSaving(true)
    try {
      setUser(formData as UserProfile)
      toast.success('Settings saved successfully')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = () => {
    clearUser()
    router.push('/')
  }

  const toggleCompany = (company: string) => {
    setFormData((prev) => ({
      ...prev,
      targetCompanies: prev.targetCompanies?.includes(company)
        ? prev.targetCompanies.filter((c) => c !== company)
        : [...(prev.targetCompanies || []), company],
    }))
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-full flex-col p-4 md:p-6 max-w-3xl mx-auto">
      <FadeIn>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary">Settings</h1>
          <p className="text-muted-foreground">
            Manage your profile and preferences
          </p>
        </div>
      </FadeIn>

      <div className="space-y-6">
        <FadeIn delay={0.1}>
          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-input border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-input border-border/50"
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
                    <SelectTrigger className="bg-input border-border/50">
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
                    <SelectTrigger className="bg-input border-border/50">
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

              <div className="space-y-2">
                <Label>DSA Level</Label>
                <Select
                  value={formData.dsaLevel}
                  onValueChange={(value) => setFormData({ ...formData, dsaLevel: value as UserProfile['dsaLevel'] })}
                >
                  <SelectTrigger className="bg-input border-border/50">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.2}>
          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle>Target Companies</CardTitle>
              <CardDescription>
                Select companies you are preparing for
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {companies.map((company) => {
                  const isSelected = formData.targetCompanies?.includes(company)
                  return (
                    <Badge
                      key={company}
                      variant={isSelected ? 'default' : 'outline'}
                      className={cn(
                        'cursor-pointer px-3 py-1 transition-all',
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
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10">
                  <LogOut className="h-4 w-4 mr-2" />
                  Reset & Logout
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="glass-panel border-border/50">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Reset All Data?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will clear all your local data including profile, goals, and preferences.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleLogout}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Reset & Logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </FadeIn>
      </div>
    </div>
  )
}
