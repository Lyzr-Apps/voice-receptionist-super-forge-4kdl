'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { RiPhoneLine, RiCalendarCheckLine, RiRouteLine, RiTimeLine, RiBarChartLine, RiArrowRightLine, RiSparklingLine, RiQuestionLine, RiAlertLine, RiCheckboxCircleLine, RiTrendUpLine, RiLinkM, RiFileCopyLine, RiCheckLine } from 'react-icons/ri'
import { callAIAgent } from '@/lib/aiAgent'

interface CallLogEntry {
  id: string
  timestamp: string
  callerIntent: string
  duration: string
  status: string
}

interface InsightsData {
  total_calls_analyzed?: number
  top_questions?: Array<{ question: string; count: number }>
  trends?: string[]
  missed_opportunities?: string[]
  action_items?: string[]
  service_quality_score?: number
  summary?: string
  period?: string
}

interface DashboardSectionProps {
  callLog: CallLogEntry[]
  showSample: boolean
}

const CALL_INSIGHTS_AGENT_ID = '69a279818e6d0e51fd5cd358'

const SAMPLE_STATS = {
  totalCalls: 47,
  reservations: 12,
  routed: 8,
  avgDuration: '2:34',
}

const EMPTY_STATS = {
  totalCalls: 0,
  reservations: 0,
  routed: 0,
  avgDuration: '0:00',
}

const SAMPLE_INSIGHTS: InsightsData = {
  total_calls_analyzed: 47,
  top_questions: [
    { question: 'What are your hours of operation?', count: 15 },
    { question: 'Do you take reservations for large parties?', count: 11 },
    { question: 'Is there outdoor seating available?', count: 8 },
    { question: 'Do you offer gluten-free options?', count: 6 },
    { question: 'What is the wait time right now?', count: 4 },
  ],
  trends: [
    'Weekend reservation requests increased by 30%',
    'Menu inquiries peak between 11am-1pm',
    'Repeat callers make up 22% of all calls',
  ],
  missed_opportunities: [
    'No catering menu available for party inquiries',
    'Gift card purchases not offered during holiday calls',
  ],
  action_items: [
    'Update hours on Google listing to match actual hours',
    'Create a catering package for groups of 20+',
    'Add allergy info to the voice knowledge base',
  ],
  service_quality_score: 87,
  summary: 'Overall call handling has been strong this week. The AI receptionist successfully resolved 89% of inquiries without human intervention. Most common topics were reservations, hours, and menu questions. Consider expanding the knowledge base to cover catering and private events.',
  period: 'Last 7 days',
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part)
}

const intentColors: Record<string, string> = {
  reservation: 'bg-green-100 text-green-800 border-green-200',
  menu: 'bg-blue-100 text-blue-800 border-blue-200',
  hours: 'bg-amber-100 text-amber-800 border-amber-200',
  general: 'bg-gray-100 text-gray-800 border-gray-200',
  complaint: 'bg-red-100 text-red-800 border-red-200',
  order: 'bg-purple-100 text-purple-800 border-purple-200',
}

export default function DashboardSection({ callLog, showSample }: DashboardSectionProps) {
  const [insights, setInsights] = useState<InsightsData | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insightsError, setInsightsError] = useState<string | null>(null)
  const [showInsights, setShowInsights] = useState(false)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  const stats = showSample ? SAMPLE_STATS : {
    totalCalls: callLog.length,
    reservations: callLog.filter(c => c?.callerIntent === 'reservation').length,
    routed: callLog.filter(c => c?.callerIntent === 'complaint' || c?.callerIntent === 'order').length,
    avgDuration: callLog.length > 0 ? (() => {
      const totalSec = callLog.reduce((sum, c) => {
        const parts = (c?.duration ?? '0:00').split(':')
        return sum + (parseInt(parts[0] ?? '0') * 60) + parseInt(parts[1] ?? '0')
      }, 0) / callLog.length
      return `${Math.floor(totalSec / 60)}:${String(Math.floor(totalSec % 60)).padStart(2, '0')}`
    })() : '0:00',
  }

  const recentCalls = showSample ? [
    { id: '1', timestamp: '2024-01-15 18:32', callerIntent: 'reservation', duration: '3:12', status: 'completed' },
    { id: '2', timestamp: '2024-01-15 17:45', callerIntent: 'menu', duration: '1:45', status: 'completed' },
    { id: '3', timestamp: '2024-01-15 16:20', callerIntent: 'hours', duration: '0:52', status: 'completed' },
    { id: '4', timestamp: '2024-01-15 15:10', callerIntent: 'reservation', duration: '4:05', status: 'completed' },
    { id: '5', timestamp: '2024-01-15 14:30', callerIntent: 'complaint', duration: '2:18', status: 'routed' },
  ] : callLog.slice(0, 5)

  const handleSummarize = async () => {
    if (showSample) {
      setShowInsights(true)
      setInsights(SAMPLE_INSIGHTS)
      return
    }
    setInsightsLoading(true)
    setInsightsError(null)
    setShowInsights(true)
    try {
      const callData = JSON.stringify(callLog.slice(0, 50))
      const result = await callAIAgent(
        `Analyze these call transcripts and provide insights: ${callData}`,
        CALL_INSIGHTS_AGENT_ID
      )
      if (result.success) {
        const data = result?.response?.result
        setInsights({
          total_calls_analyzed: data?.total_calls_analyzed,
          top_questions: Array.isArray(data?.top_questions) ? data.top_questions : [],
          trends: Array.isArray(data?.trends) ? data.trends : [],
          missed_opportunities: Array.isArray(data?.missed_opportunities) ? data.missed_opportunities : [],
          action_items: Array.isArray(data?.action_items) ? data.action_items : [],
          service_quality_score: data?.service_quality_score,
          summary: data?.summary,
          period: data?.period,
        })
      } else {
        setInsightsError(result?.error ?? 'Failed to fetch insights')
      }
    } catch {
      setInsightsError('An unexpected error occurred')
    } finally {
      setInsightsLoading(false)
    }
  }

  const statCards = [
    { label: 'Total Calls Today', value: stats.totalCalls, icon: RiPhoneLine, color: 'text-primary' },
    { label: 'Reservations Booked', value: stats.reservations, icon: RiCalendarCheckLine, color: 'text-green-600' },
    { label: 'Calls Routed', value: stats.routed, icon: RiRouteLine, color: 'text-blue-600' },
    { label: 'Avg Call Duration', value: stats.avgDuration, icon: RiTimeLine, color: 'text-amber-600' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="shadow-sm hover:shadow transition-shadow duration-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground tracking-wide">{stat.label}</span>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-semibold font-serif tracking-wide">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-serif tracking-wide">Recent Calls</CardTitle>
              <Badge variant="secondary" className="text-xs">{recentCalls.length} calls</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {recentCalls.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <RiPhoneLine className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No calls recorded yet</p>
                <p className="text-xs mt-1">Start a voice session to begin receiving calls</p>
              </div>
            ) : (
              <ScrollArea className="h-[260px]">
                <div className="space-y-2">
                  {recentCalls.map((call) => (
                    <div key={call?.id ?? Math.random().toString()} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <RiPhoneLine className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{call?.timestamp ?? 'Unknown'}</p>
                          <Badge variant="outline" className={`text-xs mt-0.5 ${intentColors[call?.callerIntent ?? 'general'] ?? intentColors.general}`}>
                            {call?.callerIntent ?? 'general'}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{call?.duration ?? '--'}</p>
                        <p className="text-xs text-muted-foreground capitalize">{call?.status ?? 'unknown'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-serif tracking-wide flex items-center gap-2">
              <RiSparklingLine className="h-5 w-5 text-accent" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Get AI-powered analysis of your call data to discover trends, top FAQs, and actionable recommendations.</p>
            <Button onClick={handleSummarize} disabled={insightsLoading} className="w-full gap-2">
              {insightsLoading ? (
                <><span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> Analyzing...</>
              ) : (
                <><RiBarChartLine className="h-4 w-4" /> Summarize Calls</>
              )}
            </Button>
            {insightsError && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <RiAlertLine className="inline h-4 w-4 mr-1" />
                {insightsError}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-serif tracking-wide flex items-center gap-2">
              <RiLinkM className="h-4 w-4 text-primary" />
              Customer Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground truncate">Booking Page</span>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1 shrink-0" onClick={() => { const url = typeof window !== 'undefined' ? `${window.location.origin}/book` : '/book'; navigator.clipboard.writeText(url).then(() => { setCopiedLink('book'); setTimeout(() => setCopiedLink(null), 2000) }) }}>
                {copiedLink === 'book' ? <><RiCheckLine className="h-3 w-3 text-green-600" /> <span className="text-green-600">Copied!</span></> : <><RiFileCopyLine className="h-3 w-3" /> Copy</>}
              </Button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground truncate">Menu Page</span>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1 shrink-0" onClick={() => { const url = typeof window !== 'undefined' ? `${window.location.origin}/menu` : '/menu'; navigator.clipboard.writeText(url).then(() => { setCopiedLink('menu'); setTimeout(() => setCopiedLink(null), 2000) }) }}>
                {copiedLink === 'menu' ? <><RiCheckLine className="h-3 w-3 text-green-600" /> <span className="text-green-600">Copied!</span></> : <><RiFileCopyLine className="h-3 w-3" /> Copy</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {showInsights && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-serif tracking-wide">Call Analysis Report</CardTitle>
              {insights?.period && <Badge variant="secondary" className="text-xs">{insights.period}</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            {insightsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : insights ? (
              <div className="space-y-6">
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <RiPhoneLine className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold font-serif">{insights.total_calls_analyzed ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Calls Analyzed</p>
                    </div>
                  </div>
                  {(insights.service_quality_score ?? 0) > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                        <RiCheckboxCircleLine className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-semibold font-serif">{insights.service_quality_score}%</p>
                        <p className="text-xs text-muted-foreground">Quality Score</p>
                      </div>
                    </div>
                  )}
                  {(insights.service_quality_score ?? 0) > 0 && (
                    <div className="flex-1 min-w-[200px]">
                      <Progress value={insights.service_quality_score} className="h-2" />
                    </div>
                  )}
                </div>

                {insights.summary && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-1"><RiBarChartLine className="h-4 w-4" /> Summary</h4>
                    <div className="p-4 rounded-lg bg-secondary/50">{renderMarkdown(insights.summary)}</div>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Array.isArray(insights.top_questions) && insights.top_questions.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-1"><RiQuestionLine className="h-4 w-4" /> Top Questions</h4>
                      <div className="space-y-2">
                        {insights.top_questions.map((q, i) => (
                          <div key={i} className="flex items-start justify-between gap-2 p-2 rounded bg-secondary/30">
                            <span className="text-sm flex-1">{q?.question ?? ''}</span>
                            <Badge variant="secondary" className="text-xs shrink-0">{q?.count ?? 0}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {Array.isArray(insights.trends) && insights.trends.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-1"><RiTrendUpLine className="h-4 w-4" /> Trends</h4>
                      <div className="space-y-2">
                        {insights.trends.map((t, i) => (
                          <div key={i} className="flex items-start gap-2 p-2 rounded bg-secondary/30">
                            <RiArrowRightLine className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                            <span className="text-sm">{t ?? ''}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {Array.isArray(insights.missed_opportunities) && insights.missed_opportunities.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-1"><RiAlertLine className="h-4 w-4 text-amber-500" /> Missed Opportunities</h4>
                      <div className="space-y-2">
                        {insights.missed_opportunities.map((m, i) => (
                          <div key={i} className="flex items-start gap-2 p-2 rounded bg-amber-50">
                            <RiAlertLine className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                            <span className="text-sm">{m ?? ''}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {Array.isArray(insights.action_items) && insights.action_items.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-1"><RiCheckboxCircleLine className="h-4 w-4 text-green-600" /> Action Items</h4>
                      <div className="space-y-2">
                        {insights.action_items.map((a, i) => (
                          <div key={i} className="flex items-start gap-2 p-2 rounded bg-green-50">
                            <RiCheckboxCircleLine className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                            <span className="text-sm">{a ?? ''}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
