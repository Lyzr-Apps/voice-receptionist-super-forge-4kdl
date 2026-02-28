'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RiRestaurantLine, RiStarLine, RiTimeLine, RiMapPinLine, RiCalendarCheckLine, RiSparklingLine, RiLeafLine, RiFireLine } from 'react-icons/ri'

const THEME_VARS = {
  '--background': '35 29% 95%',
  '--foreground': '27 30% 12%',
  '--card': '35 29% 92%',
  '--card-foreground': '27 30% 12%',
  '--primary': '27 61% 26%',
  '--primary-foreground': '35 29% 95%',
  '--secondary': '35 20% 88%',
  '--secondary-foreground': '27 30% 15%',
  '--muted': '35 15% 85%',
  '--muted-foreground': '27 15% 45%',
  '--accent': '43 75% 38%',
  '--accent-foreground': '35 29% 95%',
  '--border': '35 20% 82%',
  '--destructive': '0 84% 60%',
  '--destructive-foreground': '0 0% 98%',
  '--ring': '27 61% 26%',
  '--radius': '0.5rem',
} as React.CSSProperties

interface BusinessSettings {
  businessName: string
  hours: string
  address: string
  menuHighlights: string
  specials: string
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

function parseMenuItems(menuText: string): string[] {
  if (!menuText) return []
  const items = menuText.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean)
  return items
}

function parseSpecials(specialsText: string): string[] {
  if (!specialsText) return []
  const items = specialsText.split(/\n+/).map(s => s.trim()).filter(Boolean)
  return items
}

export default function Page() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('voicehost-settings')
      if (saved) {
        const parsed = JSON.parse(saved)
        setSettings(parsed)
      }
    } catch {
      // ignore
    }
    // Log menu page visit
    try {
      const visits = JSON.parse(localStorage.getItem('voicehost-menu-visitors') || '[]')
      if (Array.isArray(visits)) {
        visits.push({ id: crypto.randomUUID(), timestamp: new Date().toISOString(), page: 'menu', referrer: document.referrer || 'direct' })
        localStorage.setItem('voicehost-menu-visitors', JSON.stringify(visits.slice(-200)))
      }
    } catch { /* ignore */ }
  }, [])

  const restaurantName = settings?.businessName || 'Heritage Bistro'
  const address = settings?.address || ''
  const hours = settings?.hours || ''
  const menuHighlights = settings?.menuHighlights || ''
  const specials = settings?.specials || ''

  const menuItems = parseMenuItems(menuHighlights)
  const specialItems = parseSpecials(specials)
  const hasMenuContent = menuItems.length > 0 || specialItems.length > 0

  return (
    <ErrorBoundary>
      <div style={THEME_VARS} className="min-h-screen bg-background text-foreground">
        <header className="bg-card border-b border-border">
          <div className="max-w-3xl mx-auto px-4 py-8 text-center">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-primary mb-4">
              <RiRestaurantLine className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-wide text-foreground">{restaurantName}</h1>
            <p className="text-muted-foreground mt-2 text-sm tracking-wide">Our Menu</p>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          {specialItems.length > 0 && (
            <Card className="shadow-sm border-2 border-amber-300/50 bg-amber-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-serif tracking-wide flex items-center gap-2">
                  <RiSparklingLine className="h-5 w-5 text-amber-600" />
                  Current Specials
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {specialItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50/50">
                      <RiFireLine className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-sm font-medium">{item}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {menuItems.length > 0 ? (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-serif tracking-wide flex items-center gap-2">
                  <RiLeafLine className="h-5 w-5 text-primary" />
                  Menu Highlights
                </CardTitle>
                <p className="text-sm text-muted-foreground">A selection of our finest dishes</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {menuItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <RiStarLine className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : !hasMenuContent ? (
            <Card className="shadow-sm">
              <CardContent className="py-12 text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-xl bg-primary/10 mb-4">
                  <RiRestaurantLine className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-serif text-xl font-semibold mb-2">Menu Coming Soon</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">We are putting the finishing touches on our menu. Please contact us directly for details about our current offerings.</p>
                {address && (
                  <p className="text-sm text-muted-foreground mt-3 flex items-center justify-center gap-1">
                    <RiMapPinLine className="h-4 w-4" /> {address}
                  </p>
                )}
              </CardContent>
            </Card>
          ) : null}

          {(address || hours) && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-serif tracking-wide">Visit Us</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {address && (
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <RiMapPinLine className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold font-serif">Location</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{address}</p>
                      </div>
                    </div>
                  )}
                  {hours && (
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <RiTimeLine className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold font-serif">Hours</p>
                        <div className="text-sm text-muted-foreground mt-0.5 whitespace-pre-line">{hours}</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="text-center">
            <a href="/book">
              <Button size="lg" className="gap-2 h-12 px-8 text-base">
                <RiCalendarCheckLine className="h-5 w-5" />
                Book a Table
              </Button>
            </a>
          </div>
        </main>

        <footer className="border-t border-border bg-card py-6 mt-8">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <RiRestaurantLine className="h-4 w-4 text-primary" />
              <span className="font-serif text-sm font-semibold">{restaurantName}</span>
            </div>
            <p className="text-xs text-muted-foreground">Powered by VoiceHost AI</p>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  )
}
