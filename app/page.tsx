'use client'

import React, { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RiDashboardLine, RiPhoneLine, RiFileListLine, RiSettings3Line, RiRestaurantLine, RiRadioButtonLine, RiUserFollowLine } from 'react-icons/ri'

import DashboardSection from './sections/DashboardSection'
import VoiceCallSection from './sections/VoiceCallSection'
import CallLogSection from './sections/CallLogSection'
import SettingsSection from './sections/SettingsSection'
import CustomerTrackingSection from './sections/CustomerTrackingSection'

interface CallLogEntry {
  id: string
  timestamp: string
  callerIntent: string
  duration: string
  status: string
  callerId?: string
  transcript?: string
  summary?: string
  actions?: string[]
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

type Section = 'dashboard' | 'voice' | 'calllog' | 'customers' | 'settings'

const NAV_ITEMS: Array<{ id: Section; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'dashboard', label: 'Dashboard', icon: RiDashboardLine },
  { id: 'voice', label: 'Voice Call', icon: RiPhoneLine },
  { id: 'calllog', label: 'Call Log', icon: RiFileListLine },
  { id: 'customers', label: 'Customers', icon: RiUserFollowLine },
  { id: 'settings', label: 'Settings', icon: RiSettings3Line },
]

const AGENTS = [
  { id: '69a279a0ad98307a3fb278ff', name: 'Voice Receptionist', type: 'voice', purpose: 'Handles inbound calls, books reservations, answers FAQs' },
  { id: '69a279818e6d0e51fd5cd358', name: 'Call Insights', type: 'json', purpose: 'Analyzes call data for trends and action items' },
]

export default function Page() {
  const [activeSection, setActiveSection] = useState<Section>('dashboard')
  const [showSample, setShowSample] = useState(false)
  const [callLog, setCallLog] = useState<CallLogEntry[]>([])
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('voicehost-calllog')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setCallLog(parsed)
        }
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (callLog.length > 0) {
      try {
        localStorage.setItem('voicehost-calllog', JSON.stringify(callLog))
      } catch {
        // ignore
      }
    }
  }, [callLog])

  const handleCallComplete = (entry: CallLogEntry) => {
    setCallLog(prev => [entry, ...prev])
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground flex">
        <aside className={`${sidebarCollapsed ? 'w-16' : 'w-60'} bg-card border-r border-border flex flex-col transition-all duration-300 shrink-0`}>
          <div className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <RiRestaurantLine className="h-5 w-5 text-primary-foreground" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="font-serif font-semibold text-base tracking-wide leading-tight">VoiceHost AI</h1>
                <p className="text-xs text-muted-foreground">Restaurant Receptionist</p>
              </div>
            )}
          </div>

          <Separator />

          <nav className="flex-1 p-2 space-y-1">
            {NAV_ITEMS.map(item => (
              <button key={item.id} onClick={() => setActiveSection(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeSection === item.id ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-secondary'}`}>
                <item.icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            ))}
          </nav>

          <Separator />

          {!sidebarCollapsed && (
            <div className="p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Agents</p>
              <div className="space-y-2">
                {AGENTS.map(agent => (
                  <div key={agent.id} className="flex items-start gap-2 p-2 rounded-md bg-secondary/50 text-xs">
                    <RiRadioButtonLine className={`h-3 w-3 mt-0.5 shrink-0 ${activeAgentId === agent.id ? 'text-green-500 animate-pulse' : 'text-muted-foreground'}`} />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{agent.name}</p>
                      <p className="text-muted-foreground truncate">{agent.purpose}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-3">
            <button onClick={() => setSidebarCollapsed(prev => !prev)} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center py-1">
              {sidebarCollapsed ? '>>' : '<< Collapse'}
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
          <header className="h-14 border-b border-border bg-card px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="font-serif font-semibold text-lg tracking-wide capitalize">
                {activeSection === 'calllog' ? 'Call Log' : activeSection === 'voice' ? 'Voice Call' : activeSection === 'customers' ? 'Customer Tracking' : activeSection}
              </h2>
              {activeAgentId && (
                <Badge variant="outline" className="text-xs gap-1 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Agent Active
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="sample-toggle" className="text-sm text-muted-foreground cursor-pointer">Sample Data</Label>
              <Switch id="sample-toggle" checked={showSample} onCheckedChange={setShowSample} />
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6">
            {activeSection === 'dashboard' && (
              <DashboardSection callLog={callLog} showSample={showSample} />
            )}
            {activeSection === 'voice' && (
              <VoiceCallSection onCallComplete={handleCallComplete} />
            )}
            {activeSection === 'calllog' && (
              <CallLogSection callLog={callLog} showSample={showSample} />
            )}
            {activeSection === 'customers' && (
              <CustomerTrackingSection />
            )}
            {activeSection === 'settings' && (
              <SettingsSection />
            )}
          </div>
        </main>
      </div>
    </ErrorBoundary>
  )
}
