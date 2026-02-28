'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RiRestaurantLine, RiCalendarCheckLine, RiTimeLine, RiMapPinLine, RiPhoneLine, RiGroupLine, RiUserLine, RiCheckboxCircleLine, RiAlertLine, RiStarLine } from 'react-icons/ri'
import { callAIAgent } from '@/lib/aiAgent'

const VOICE_AGENT_ID = '69a279a0ad98307a3fb278ff'

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
  availableSlots: string
  maxPartySize: string
}

const DEFAULT_TIME_SLOTS = [
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
  '2:00 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM',
  '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM'
]

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

export default function Page() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    date: '',
    time: '',
    partySize: '2',
    specialRequests: '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

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
  }, [])

  const restaurantName = settings?.businessName || 'Heritage Bistro'
  const address = settings?.address || ''
  const hours = settings?.hours || ''
  const maxParty = parseInt(settings?.maxPartySize || '10', 10)

  const timeSlots = settings?.availableSlots
    ? settings.availableSlots.split(',').map(s => s.trim()).filter(Boolean)
    : DEFAULT_TIME_SLOTS

  const getTodayString = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.date || !formData.time || !formData.partySize) {
      setResult({ success: false, message: 'Please fill in all required fields: Name, Date, Time, and Party Size.' })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const agentResult = await callAIAgent(
        `Please book a reservation: Guest name: ${formData.name}, Party size: ${formData.partySize}, Date: ${formData.date}, Time: ${formData.time}. Contact: ${formData.contact || 'Not provided'}. Special requests: ${formData.specialRequests || 'None'}`,
        VOICE_AGENT_ID
      )

      if (agentResult.success) {
        const responseText = agentResult?.response?.result?.text ?? agentResult?.response?.message ?? 'Reservation request has been submitted successfully.'
        setResult({ success: true, message: responseText })
        setFormData({ name: '', contact: '', date: '', time: '', partySize: '2', specialRequests: '' })
      } else {
        setResult({ success: false, message: agentResult?.error ?? 'We could not process your reservation at this time. Please try again or call us directly.' })
      }
    } catch {
      setResult({ success: false, message: 'An unexpected error occurred. Please try again or call us directly.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ErrorBoundary>
      <div style={THEME_VARS} className="min-h-screen bg-background text-foreground">
        <header className="bg-card border-b border-border">
          <div className="max-w-3xl mx-auto px-4 py-8 text-center">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-primary mb-4">
              <RiRestaurantLine className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-wide text-foreground">{restaurantName}</h1>
            <p className="text-muted-foreground mt-2 text-sm tracking-wide">Reserve Your Table</p>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          {result && (
            <Card className={`shadow-sm border-2 ${result.success ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <RiCheckboxCircleLine className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <RiAlertLine className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h3 className={`font-serif font-semibold text-lg ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                      {result.success ? 'Reservation Confirmed' : 'Unable to Complete Reservation'}
                    </h3>
                    <p className={`text-sm mt-1 ${result.success ? 'text-green-700' : 'text-red-700'}`}>{result.message}</p>
                    {result.success && (
                      <Button variant="outline" size="sm" className="mt-3" onClick={() => setResult(null)}>
                        Make Another Reservation
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {(!result || !result.success) && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-serif tracking-wide flex items-center gap-2">
                  <RiCalendarCheckLine className="h-5 w-5 text-primary" />
                  Book a Table
                </CardTitle>
                <p className="text-sm text-muted-foreground">Fill in your details and we will confirm your reservation.</p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="guest-name" className="text-sm font-medium">Guest Name <span className="text-red-500">*</span></Label>
                    <div className="relative mt-1">
                      <RiUserLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="guest-name" placeholder="Your full name" className="pl-9" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="guest-contact" className="text-sm font-medium">Phone or Email</Label>
                    <div className="relative mt-1">
                      <RiPhoneLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="guest-contact" placeholder="For confirmation" className="pl-9" value={formData.contact} onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="reservation-date" className="text-sm font-medium">Date <span className="text-red-500">*</span></Label>
                    <div className="relative mt-1">
                      <RiCalendarCheckLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="reservation-date" type="date" min={getTodayString()} className="pl-9" value={formData.date} onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="reservation-time" className="text-sm font-medium">Time <span className="text-red-500">*</span></Label>
                    <div className="relative mt-1">
                      <RiTimeLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <select id="reservation-time" className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 pl-9 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={formData.time} onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}>
                        <option value="">Select time</option>
                        {timeSlots.map(slot => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="party-size" className="text-sm font-medium">Party Size <span className="text-red-500">*</span></Label>
                    <div className="relative mt-1">
                      <RiGroupLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <select id="party-size" className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 pl-9 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={formData.partySize} onChange={(e) => setFormData(prev => ({ ...prev, partySize: e.target.value }))}>
                        {Array.from({ length: maxParty }, (_, i) => i + 1).map(n => (
                          <option key={n} value={String(n)}>{n} {n === 1 ? 'guest' : 'guests'}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="special-requests" className="text-sm font-medium">Special Requests</Label>
                  <Textarea id="special-requests" placeholder="Allergies, high chair, birthday celebration, seating preference..." rows={3} className="mt-1" value={formData.specialRequests} onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))} />
                </div>

                <Button onClick={handleSubmit} disabled={loading || !formData.name || !formData.date || !formData.time} className="w-full gap-2 h-11 text-base">
                  {loading ? (
                    <><span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> Confirming Reservation...</>
                  ) : (
                    <><RiCalendarCheckLine className="h-5 w-5" /> Book My Table</>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {(address || hours) && (
            <Card className="shadow-sm">
              <CardContent className="p-5">
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
