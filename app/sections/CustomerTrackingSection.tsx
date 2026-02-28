'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  RiCalendarCheckLine,
  RiEyeLine,
  RiRestaurantLine,
  RiUserLine,
  RiGroupLine,
  RiTimeLine,
  RiDeleteBinLine,
  RiRefreshLine,
  RiFileListLine,
  RiLinkM,
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiCheckboxCircleLine,
  RiInformationLine,
} from 'react-icons/ri'

interface BookingVisitor {
  id: string
  timestamp: string
  page: string
  referrer: string
}

interface MenuVisitor {
  id: string
  timestamp: string
  page: string
  referrer: string
}

interface Reservation {
  id: string
  timestamp: string
  guestName: string
  contact: string
  date: string
  time: string
  partySize: string
  specialRequests: string
  status: string
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function formatDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return dateStr
  }
}

function getToday(): string {
  return new Date().toISOString().split('T')[0] ?? ''
}

export default function CustomerTrackingSection() {
  const [bookingVisitors, setBookingVisitors] = useState<BookingVisitor[]>([])
  const [menuVisitors, setMenuVisitors] = useState<MenuVisitor[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [activeTab, setActiveTab] = useState<'reservations' | 'booking-visitors' | 'menu-visitors'>('reservations')
  const [expandedReservation, setExpandedReservation] = useState<string | null>(null)

  const loadData = () => {
    try {
      const bv = JSON.parse(localStorage.getItem('voicehost-booking-visitors') || '[]')
      setBookingVisitors(Array.isArray(bv) ? bv.reverse() : [])
    } catch { setBookingVisitors([]) }

    try {
      const mv = JSON.parse(localStorage.getItem('voicehost-menu-visitors') || '[]')
      setMenuVisitors(Array.isArray(mv) ? mv.reverse() : [])
    } catch { setMenuVisitors([]) }

    try {
      const res = JSON.parse(localStorage.getItem('voicehost-reservations') || '[]')
      setReservations(Array.isArray(res) ? res.reverse() : [])
    } catch { setReservations([]) }
  }

  useEffect(() => {
    loadData()
  }, [])

  const clearBookingVisitors = () => {
    localStorage.removeItem('voicehost-booking-visitors')
    setBookingVisitors([])
  }

  const clearMenuVisitors = () => {
    localStorage.removeItem('voicehost-menu-visitors')
    setMenuVisitors([])
  }

  const clearReservations = () => {
    localStorage.removeItem('voicehost-reservations')
    setReservations([])
  }

  const todayBookingVisits = bookingVisitors.filter(v => v?.timestamp?.startsWith(getToday())).length
  const todayMenuVisits = menuVisitors.filter(v => v?.timestamp?.startsWith(getToday())).length
  const todayReservations = reservations.filter(r => r?.timestamp?.startsWith(getToday())).length

  const tabs = [
    { id: 'reservations' as const, label: 'Reservations', count: reservations.length, icon: RiCalendarCheckLine, color: 'text-green-600' },
    { id: 'booking-visitors' as const, label: 'Booking Page Visitors', count: bookingVisitors.length, icon: RiEyeLine, color: 'text-blue-600' },
    { id: 'menu-visitors' as const, label: 'Menu Page Visitors', count: menuVisitors.length, icon: RiRestaurantLine, color: 'text-amber-600' },
  ]

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground tracking-wide">Total Reservations</span>
              <RiCalendarCheckLine className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-semibold font-serif tracking-wide">{reservations.length}</p>
            <p className="text-xs text-muted-foreground mt-1">{todayReservations} today</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground tracking-wide">Booking Page Visits</span>
              <RiEyeLine className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-semibold font-serif tracking-wide">{bookingVisitors.length}</p>
            <p className="text-xs text-muted-foreground mt-1">{todayBookingVisits} today</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground tracking-wide">Menu Page Visits</span>
              <RiRestaurantLine className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-2xl font-semibold font-serif tracking-wide">{menuVisitors.length}</p>
            <p className="text-xs text-muted-foreground mt-1">{todayMenuVisits} today</p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Rate */}
      {bookingVisitors.length > 0 && (
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                <RiCheckboxCircleLine className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold font-serif">Booking Conversion Rate</p>
                <p className="text-2xl font-semibold font-serif tracking-wide text-green-700">
                  {((reservations.length / bookingVisitors.length) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-muted-foreground">{reservations.length} bookings from {bookingVisitors.length} visits</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-foreground hover:bg-secondary/80'
            }`}
          >
            <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? '' : tab.color}`} />
            {tab.label}
            <Badge variant={activeTab === tab.id ? 'secondary' : 'outline'} className="text-xs ml-1">
              {tab.count}
            </Badge>
          </button>
        ))}
      </div>

      {/* Reservations Tab */}
      {activeTab === 'reservations' && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-serif tracking-wide flex items-center gap-2">
                <RiCalendarCheckLine className="h-5 w-5 text-green-600" />
                Customer Reservations
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={loadData}>
                  <RiRefreshLine className="h-3 w-3" /> Refresh
                </Button>
                {reservations.length > 0 && (
                  <Button variant="outline" size="sm" className="gap-1 text-xs text-destructive hover:text-destructive" onClick={clearReservations}>
                    <RiDeleteBinLine className="h-3 w-3" /> Clear All
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {reservations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <RiCalendarCheckLine className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No reservations yet</p>
                <p className="text-xs mt-1">When customers book through your booking page, their reservations will appear here.</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {reservations.map((res) => (
                    <div key={res?.id ?? Math.random().toString()} className="rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors">
                      <button
                        onClick={() => setExpandedReservation(expandedReservation === res?.id ? null : res?.id ?? null)}
                        className="w-full flex items-center justify-between p-3 text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                            <RiUserLine className="h-4 w-4 text-green-700" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{res?.guestName ?? 'Unknown Guest'}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(res?.date ?? '')} at {res?.time ?? '--'} -- Party of {res?.partySize ?? '?'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-600">
                            {res?.status ?? 'confirmed'}
                          </Badge>
                          {expandedReservation === res?.id
                            ? <RiArrowUpSLine className="h-4 w-4 text-muted-foreground" />
                            : <RiArrowDownSLine className="h-4 w-4 text-muted-foreground" />
                          }
                        </div>
                      </button>
                      {expandedReservation === res?.id && (
                        <div className="px-3 pb-3 pt-0">
                          <Separator className="mb-3" />
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <RiUserLine className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">Contact</p>
                                <p className="font-medium">{res?.contact ?? 'Not provided'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <RiGroupLine className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">Party Size</p>
                                <p className="font-medium">{res?.partySize ?? '?'} guests</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <RiCalendarCheckLine className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">Reservation Date</p>
                                <p className="font-medium">{formatDate(res?.date ?? '')} at {res?.time ?? '--'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <RiTimeLine className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">Booked On</p>
                                <p className="font-medium">{formatDateTime(res?.timestamp ?? '')}</p>
                              </div>
                            </div>
                            {res?.specialRequests && res.specialRequests !== 'None' && (
                              <div className="col-span-2 flex items-start gap-2">
                                <RiInformationLine className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Special Requests</p>
                                  <p className="font-medium">{res.specialRequests}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}

      {/* Booking Page Visitors Tab */}
      {activeTab === 'booking-visitors' && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-serif tracking-wide flex items-center gap-2">
                <RiEyeLine className="h-5 w-5 text-blue-600" />
                Booking Page Visitors
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={loadData}>
                  <RiRefreshLine className="h-3 w-3" /> Refresh
                </Button>
                {bookingVisitors.length > 0 && (
                  <Button variant="outline" size="sm" className="gap-1 text-xs text-destructive hover:text-destructive" onClick={clearBookingVisitors}>
                    <RiDeleteBinLine className="h-3 w-3" /> Clear All
                  </Button>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Every time a customer opens your booking page link, a visit is recorded here.</p>
          </CardHeader>
          <CardContent>
            {bookingVisitors.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <RiLinkM className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No visitors yet</p>
                <p className="text-xs mt-1">Share your booking link and visitor data will appear here.</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-1">
                  <div className="grid grid-cols-3 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b">
                    <span>Visit Time</span>
                    <span>Page</span>
                    <span>Referrer</span>
                  </div>
                  {bookingVisitors.map((visitor) => (
                    <div key={visitor?.id ?? Math.random().toString()} className="grid grid-cols-3 px-3 py-2.5 rounded-lg hover:bg-secondary/50 transition-colors text-sm items-center">
                      <span className="text-sm">{formatDateTime(visitor?.timestamp ?? '')}</span>
                      <Badge variant="outline" className="text-xs w-fit bg-blue-50 text-blue-700 border-blue-200">
                        <RiFileListLine className="h-3 w-3 mr-1" /> Booking
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate">{visitor?.referrer || 'direct'}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}

      {/* Menu Page Visitors Tab */}
      {activeTab === 'menu-visitors' && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-serif tracking-wide flex items-center gap-2">
                <RiRestaurantLine className="h-5 w-5 text-amber-600" />
                Menu Page Visitors
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={loadData}>
                  <RiRefreshLine className="h-3 w-3" /> Refresh
                </Button>
                {menuVisitors.length > 0 && (
                  <Button variant="outline" size="sm" className="gap-1 text-xs text-destructive hover:text-destructive" onClick={clearMenuVisitors}>
                    <RiDeleteBinLine className="h-3 w-3" /> Clear All
                  </Button>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Every time a customer opens your menu page link, a visit is recorded here.</p>
          </CardHeader>
          <CardContent>
            {menuVisitors.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <RiLinkM className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No visitors yet</p>
                <p className="text-xs mt-1">Share your menu link and visitor data will appear here.</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-1">
                  <div className="grid grid-cols-3 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b">
                    <span>Visit Time</span>
                    <span>Page</span>
                    <span>Referrer</span>
                  </div>
                  {menuVisitors.map((visitor) => (
                    <div key={visitor?.id ?? Math.random().toString()} className="grid grid-cols-3 px-3 py-2.5 rounded-lg hover:bg-secondary/50 transition-colors text-sm items-center">
                      <span className="text-sm">{formatDateTime(visitor?.timestamp ?? '')}</span>
                      <Badge variant="outline" className="text-xs w-fit bg-amber-50 text-amber-700 border-amber-200">
                        <RiRestaurantLine className="h-3 w-3 mr-1" /> Menu
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate">{visitor?.referrer || 'direct'}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
