'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RiPhoneLine, RiSearchLine, RiFilterLine, RiTimeLine, RiArrowUpLine, RiArrowDownLine, RiFileTextLine } from 'react-icons/ri'

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

interface CallLogSectionProps {
  callLog: CallLogEntry[]
  showSample: boolean
}

const SAMPLE_CALLS: CallLogEntry[] = [
  { id: '1', timestamp: '2024-01-15 18:32', callerIntent: 'reservation', duration: '3:12', status: 'completed', callerId: '+1 (555) 234-5678', transcript: 'Caller: Hi, I would like to make a reservation for tonight.\nAI: Of course! I would be happy to help you with a reservation. How many guests will be joining you tonight?\nCaller: We will be a party of 4.\nAI: Wonderful! I have availability at 7:00 PM and 8:30 PM tonight. Which would you prefer?\nCaller: 7 PM works perfectly.\nAI: Great, I have reserved a table for 4 at 7:00 PM tonight. Could I get a name for the reservation?\nCaller: Smith, please.\nAI: All set! Reservation for Smith, party of 4, tonight at 7:00 PM. Is there anything else I can help with?\nCaller: No, that is all. Thank you!\nAI: You are welcome! We look forward to seeing you tonight. Goodbye!', summary: 'Successfully booked a dinner reservation for a party of 4 at 7:00 PM under the name Smith.', actions: ['Reservation created in Google Calendar', 'Confirmation text sent'] },
  { id: '2', timestamp: '2024-01-15 17:45', callerIntent: 'menu', duration: '1:45', status: 'completed', callerId: '+1 (555) 876-5432', transcript: 'Caller: Hi, do you have any gluten-free options on your menu?\nAI: Absolutely! We have several gluten-free options available. Our grilled salmon, the house salad with our special herb dressing, and the roasted chicken breast are all prepared gluten-free. We also offer gluten-free pasta as a substitute for any of our pasta dishes.\nCaller: That sounds great. Do you have dessert options too?\nAI: Yes! We offer a flourless chocolate cake and a seasonal fruit sorbet, both of which are gluten-free.\nCaller: Thank you so much for the info!\nAI: You are welcome! Let me know if you would like to make a reservation or if you have any other questions.', summary: 'Caller inquired about gluten-free menu options. Provided details on main courses and desserts available.', actions: ['FAQ answered from knowledge base'] },
  { id: '3', timestamp: '2024-01-15 16:20', callerIntent: 'hours', duration: '0:52', status: 'completed', callerId: '+1 (555) 111-2233', transcript: 'Caller: What are your hours today?\nAI: Today being Monday, we are open from 11:00 AM to 10:00 PM. Our kitchen closes at 9:30 PM for last orders.\nCaller: Thanks!', summary: 'Quick inquiry about business hours. Answered from configured hours.', actions: ['FAQ answered from knowledge base'] },
  { id: '4', timestamp: '2024-01-15 15:10', callerIntent: 'reservation', duration: '4:05', status: 'completed', callerId: '+1 (555) 444-5566', transcript: 'Caller: I need to book a table for a birthday dinner this Saturday.\nAI: Happy to help with that! How many guests are you expecting?\nCaller: About 12 people.\nAI: For a party of 12, I would recommend our private dining room. We have availability this Saturday at 6:00 PM and 7:30 PM. Would either of those work?\nCaller: 6 PM would be ideal.\nAI: Wonderful! I have reserved the private dining room for 12 guests this Saturday at 6:00 PM. Would you like to arrange any special birthday decorations or a cake?\nCaller: Yes please, can you do a chocolate cake?\nAI: Absolutely! I will note that in your reservation. The name for the booking?\nCaller: Johnson.\nAI: All set! Private dining room, Saturday at 6 PM, party of 12 under Johnson, with a chocolate birthday cake. Is there anything else?\nCaller: That covers everything. Thank you!', summary: 'Booked private dining room for a birthday dinner. Party of 12, Saturday at 6 PM under Johnson. Special request for chocolate birthday cake.', actions: ['Private room reserved', 'Birthday cake ordered', 'Confirmation email sent'] },
  { id: '5', timestamp: '2024-01-15 14:30', callerIntent: 'complaint', duration: '2:18', status: 'routed', callerId: '+1 (555) 777-8899', transcript: 'Caller: I had a bad experience during my last visit and I want to speak to a manager.\nAI: I am sorry to hear about your experience. I want to make sure your concern is addressed properly. Let me connect you with our manager right away.\nCaller: Thank you.', summary: 'Caller had a negative experience and requested to speak with management. Call was routed to the manager.', actions: ['Routed to manager extension'] },
  { id: '6', timestamp: '2024-01-15 13:15', callerIntent: 'order', duration: '5:22', status: 'completed', callerId: '+1 (555) 321-6547', transcript: 'Caller: Hi, I would like to place a takeout order.\nAI: Of course! What can I get for you today?\nCaller: I will have the grilled salmon, a Caesar salad, and two orders of garlic bread.\nAI: Great choices! That is one grilled salmon, one Caesar salad, and two garlic breads. Would you like to add any drinks?\nCaller: A bottle of sparkling water, please.\nAI: Perfect. Your total comes to $47.50. The order will be ready in about 25 minutes. Can I get a name?\nCaller: Davis.\nAI: Thank you, Davis! Your order will be ready for pickup in 25 minutes.', summary: 'Takeout order placed: grilled salmon, Caesar salad, 2x garlic bread, sparkling water. Total $47.50, pickup in 25 min under Davis.', actions: ['Order placed in POS', 'Kitchen notified'] },
  { id: '7', timestamp: '2024-01-15 12:00', callerIntent: 'general', duration: '1:10', status: 'completed', callerId: '+1 (555) 999-0011', transcript: 'Caller: Where are you located?\nAI: We are located at 123 Heritage Lane, downtown. There is a public parking garage right next door on Main Street, and we also have a small private lot behind the building.\nCaller: Perfect, thanks!', summary: 'Location inquiry answered with parking information.', actions: ['FAQ answered from knowledge base'] },
]

const intentColors: Record<string, string> = {
  reservation: 'bg-green-100 text-green-800 border-green-200',
  menu: 'bg-blue-100 text-blue-800 border-blue-200',
  hours: 'bg-amber-100 text-amber-800 border-amber-200',
  general: 'bg-gray-100 text-gray-800 border-gray-200',
  complaint: 'bg-red-100 text-red-800 border-red-200',
  order: 'bg-purple-100 text-purple-800 border-purple-200',
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{line.slice(2)}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm">{line.replace(/^\d+\.\s/, '')}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{line}</p>
      })}
    </div>
  )
}

export default function CallLogSection({ callLog, showSample }: CallLogSectionProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [intentFilter, setIntentFilter] = useState('all')
  const [sortField, setSortField] = useState<'timestamp' | 'duration'>('timestamp')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selectedCall, setSelectedCall] = useState<CallLogEntry | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const entries = showSample ? SAMPLE_CALLS : callLog

  const filtered = useMemo(() => {
    let result = [...entries]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(c =>
        (c?.callerIntent ?? '').toLowerCase().includes(q) ||
        (c?.callerId ?? '').toLowerCase().includes(q) ||
        (c?.timestamp ?? '').toLowerCase().includes(q)
      )
    }
    if (intentFilter !== 'all') {
      result = result.filter(c => c?.callerIntent === intentFilter)
    }
    result.sort((a, b) => {
      if (sortField === 'timestamp') {
        const cmp = (a?.timestamp ?? '').localeCompare(b?.timestamp ?? '')
        return sortDir === 'desc' ? -cmp : cmp
      }
      const aDur = (a?.duration ?? '0:00').split(':').reduce((acc, v, i) => acc + parseInt(v ?? '0') * (i === 0 ? 60 : 1), 0)
      const bDur = (b?.duration ?? '0:00').split(':').reduce((acc, v, i) => acc + parseInt(v ?? '0') * (i === 0 ? 60 : 1), 0)
      return sortDir === 'desc' ? bDur - aDur : aDur - bDur
    })
    return result
  }, [entries, searchQuery, intentFilter, sortField, sortDir])

  const toggleSort = (field: 'timestamp' | 'duration') => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const SortIcon = ({ field }: { field: 'timestamp' | 'duration' }) => {
    if (sortField !== field) return null
    return sortDir === 'desc' ? <RiArrowDownLine className="h-3 w-3" /> : <RiArrowUpLine className="h-3 w-3" />
  }

  const openCallDetail = (call: CallLogEntry) => {
    setSelectedCall(call)
    setSheetOpen(true)
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-serif tracking-wide">Call History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search calls..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-2">
              <Select value={intentFilter} onValueChange={setIntentFilter}>
                <SelectTrigger className="w-[160px]">
                  <RiFilterLine className="h-4 w-4 mr-1" />
                  <SelectValue placeholder="Filter by intent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Intents</SelectItem>
                  <SelectItem value="reservation">Reservation</SelectItem>
                  <SelectItem value="menu">Menu</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="order">Order</SelectItem>
                  <SelectItem value="complaint">Complaint</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <RiFileTextLine className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No calls found</p>
              <p className="text-xs mt-1">{entries.length === 0 ? 'Start a voice session to begin recording calls' : 'Try adjusting your filters'}</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-secondary/50">
                      <th className="text-left text-xs font-medium text-muted-foreground p-3 cursor-pointer select-none" onClick={() => toggleSort('timestamp')}>
                        <span className="flex items-center gap-1">Timestamp <SortIcon field="timestamp" /></span>
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3">Caller ID</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3">Intent</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3 cursor-pointer select-none" onClick={() => toggleSort('duration')}>
                        <span className="flex items-center gap-1">Duration <SortIcon field="duration" /></span>
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((call) => (
                      <tr key={call?.id ?? ''} className="border-t hover:bg-secondary/30 cursor-pointer transition-colors" onClick={() => openCallDetail(call)}>
                        <td className="p-3 text-sm">{call?.timestamp ?? '--'}</td>
                        <td className="p-3 text-sm text-muted-foreground">{call?.callerId ?? 'Unknown'}</td>
                        <td className="p-3">
                          <Badge variant="outline" className={`text-xs ${intentColors[call?.callerIntent ?? 'general'] ?? intentColors.general}`}>
                            {call?.callerIntent ?? 'general'}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm flex items-center gap-1">
                          <RiTimeLine className="h-3 w-3 text-muted-foreground" />
                          {call?.duration ?? '--'}
                        </td>
                        <td className="p-3">
                          <Badge variant={call?.status === 'routed' ? 'secondary' : 'outline'} className="text-xs capitalize">
                            {call?.status ?? 'unknown'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-3 text-xs text-muted-foreground text-right">
            Showing {filtered.length} of {entries.length} calls
          </div>
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-serif">Call Details</SheetTitle>
            <SheetDescription>
              {selectedCall?.timestamp ?? ''} - {selectedCall?.callerId ?? 'Unknown Caller'}
            </SheetDescription>
          </SheetHeader>
          {selectedCall && (
            <div className="mt-6 space-y-5">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline" className={`${intentColors[selectedCall?.callerIntent ?? 'general'] ?? intentColors.general}`}>
                  {selectedCall?.callerIntent ?? 'general'}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <RiTimeLine className="h-3 w-3 mr-1" />
                  {selectedCall?.duration ?? '--'}
                </Badge>
                <Badge variant={selectedCall?.status === 'routed' ? 'destructive' : 'outline'} className="text-xs capitalize">
                  {selectedCall?.status ?? 'unknown'}
                </Badge>
              </div>

              {selectedCall?.summary && (
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">AI Summary</Label>
                  <div className="p-3 rounded-lg bg-secondary/50 text-sm">{renderMarkdown(selectedCall.summary)}</div>
                </div>
              )}

              {Array.isArray(selectedCall?.actions) && selectedCall.actions.length > 0 && (
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Actions Taken</Label>
                  <div className="space-y-1.5">
                    {selectedCall.actions.map((action, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm p-2 rounded bg-green-50 text-green-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                        {action ?? ''}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {selectedCall?.transcript && (
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Full Transcript</Label>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3 p-3 rounded-lg bg-card border text-sm">
                      {selectedCall.transcript.split('\n').map((line, i) => {
                        const isAI = line.startsWith('AI:')
                        const isCaller = line.startsWith('Caller:')
                        if (!line.trim()) return null
                        return (
                          <div key={i} className={`flex gap-2 ${isAI ? 'justify-start' : isCaller ? 'justify-end' : ''}`}>
                            <div className={`max-w-[85%] rounded-lg px-3 py-2 ${isAI ? 'bg-primary/10 text-foreground' : isCaller ? 'bg-secondary text-foreground' : 'bg-muted/50'}`}>
                              <span className="text-xs font-semibold block mb-0.5">{isAI ? 'VoiceHost AI' : isCaller ? 'Caller' : ''}</span>
                              <span className="text-sm">{line.replace(/^(AI|Caller):\s*/, '')}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
