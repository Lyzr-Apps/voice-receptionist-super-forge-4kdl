'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RiPhoneLine, RiPhoneFill, RiMicLine, RiMicOffLine, RiStopCircleLine, RiTimeLine, RiAlertLine, RiUserVoiceLine, RiRobot2Line } from 'react-icons/ri'

const VOICE_AGENT_ID = '69a279a0ad98307a3fb278ff'

type CallStatus = 'idle' | 'connecting' | 'active' | 'ended'

interface TranscriptEntry {
  role: 'user' | 'assistant' | 'system'
  text: string
  timestamp: string
}

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

interface VoiceCallSectionProps {
  onCallComplete: (entry: CallLogEntry) => void
}

function floatTo16BitPCM(float32Array: Float32Array): Int16Array {
  const int16 = new Int16Array(float32Array.length)
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]))
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  return int16
}

function int16ToBase64(int16: Int16Array): string {
  const bytes = new Uint8Array(int16.buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToInt16(base64: string): Int16Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Int16Array(bytes.buffer)
}

export default function VoiceCallSection({ onCallComplete }: VoiceCallSectionProps) {
  const [callStatus, setCallStatus] = useState<CallStatus>('idle')
  const [isMuted, setIsMuted] = useState(false)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [callDuration, setCallDuration] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)

  const wsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const nextPlayTimeRef = useRef(0)
  const isMutedRef = useRef(false)
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const callStartTimeRef = useRef<number>(0)
  const transcriptRef = useRef<TranscriptEntry[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    isMutedRef.current = isMuted
  }, [isMuted])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [transcript])

  const addTranscriptEntry = useCallback((role: 'user' | 'assistant' | 'system', text: string) => {
    const now = new Date()
    const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
    const entry: TranscriptEntry = { role, text, timestamp: ts }
    transcriptRef.current = [...transcriptRef.current, entry]
    setTranscript([...transcriptRef.current])
  }, [])

  const stopCall = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    if (processorRef.current) {
      processorRef.current.disconnect()
      processorRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }
    nextPlayTimeRef.current = 0
    setAudioLevel(0)
    setCallStatus('ended')

    const dur = Math.floor((Date.now() - callStartTimeRef.current) / 1000)
    const mins = Math.floor(dur / 60)
    const secs = dur % 60
    const durationStr = `${mins}:${secs.toString().padStart(2, '0')}`

    const fullTranscript = transcriptRef.current
      .filter(e => e.role !== 'system')
      .map(e => `${e.role === 'user' ? 'Caller' : 'AI'}: ${e.text}`)
      .join('\n')

    const newEntry: CallLogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString(),
      callerIntent: 'general',
      duration: durationStr,
      status: 'completed',
      callerId: 'Browser Call',
      transcript: fullTranscript || 'No transcript recorded',
      summary: 'Voice call via browser',
    }
    onCallComplete(newEntry)
  }, [onCallComplete])

  const startCall = async () => {
    setError(null)
    setTranscript([])
    transcriptRef.current = []
    setCallStatus('connecting')
    setCallDuration(0)

    try {
      const res = await fetch('https://voice-sip.studio.lyzr.ai/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: VOICE_AGENT_ID }),
      })

      if (!res.ok) {
        throw new Error(`Session start failed: ${res.status}`)
      }

      const data = await res.json()
      const wsUrl = data?.wsUrl
      const sampleRate = data?.audioConfig?.sampleRate ?? 24000

      if (!wsUrl) {
        throw new Error('No WebSocket URL received')
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const audioContext = new AudioContext({ sampleRate })
      audioContextRef.current = audioContext

      const source = audioContext.createMediaStreamSource(stream)
      const processor = audioContext.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor

      const silentGain = audioContext.createGain()
      silentGain.gain.value = 0
      silentGain.connect(audioContext.destination)

      source.connect(processor)
      processor.connect(silentGain)

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setCallStatus('active')
        callStartTimeRef.current = Date.now()
        addTranscriptEntry('system', 'Call connected')
        durationIntervalRef.current = setInterval(() => {
          setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000))
        }, 1000)
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'audio' && msg.audio) {
            const int16 = base64ToInt16(msg.audio)
            const float32 = new Float32Array(int16.length)
            for (let i = 0; i < int16.length; i++) {
              float32[i] = int16[i] / 0x8000
            }
            const playBuffer = audioContext.createBuffer(1, float32.length, sampleRate)
            playBuffer.getChannelData(0).set(float32)
            const sourceNode = audioContext.createBufferSource()
            sourceNode.buffer = playBuffer
            sourceNode.connect(audioContext.destination)
            const now = audioContext.currentTime
            const startTime = Math.max(now, nextPlayTimeRef.current)
            sourceNode.start(startTime)
            nextPlayTimeRef.current = startTime + playBuffer.duration
          } else if (msg.type === 'transcript') {
            const role = msg.role === 'user' ? 'user' : 'assistant'
            if (msg.text) {
              addTranscriptEntry(role as 'user' | 'assistant', msg.text)
            }
          } else if (msg.type === 'thinking') {
            // ignore thinking
          } else if (msg.type === 'clear') {
            // clear pending audio
            nextPlayTimeRef.current = 0
          } else if (msg.type === 'error') {
            setError(msg.message ?? 'Voice error occurred')
          }
        } catch {
          // ignore parse errors
        }
      }

      ws.onerror = () => {
        setError('WebSocket connection error')
        stopCall()
      }

      ws.onclose = () => {
        stopCall()
      }

      processor.onaudioprocess = (e) => {
        if (isMutedRef.current) return
        const inputData = e.inputBuffer.getChannelData(0)

        let sum = 0
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i]
        }
        const rms = Math.sqrt(sum / inputData.length)
        setAudioLevel(Math.min(1, rms * 5))

        if (ws.readyState === WebSocket.OPEN) {
          const pcm16 = floatTo16BitPCM(inputData)
          const b64 = int16ToBase64(pcm16)
          ws.send(JSON.stringify({ type: 'audio', audio: b64, sampleRate }))
        }
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start call'
      setError(message)
      setCallStatus('idle')
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
    }
  }

  const toggleMute = () => {
    setIsMuted(prev => !prev)
  }

  const formatDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const WaveformBars = () => {
    const barCount = 16
    return (
      <div className="flex items-end justify-center gap-1 h-16">
        {Array.from({ length: barCount }).map((_, i) => {
          const baseHeight = callStatus === 'active' ? 20 + audioLevel * 60 : 8
          const variation = callStatus === 'active' ? Math.sin((i / barCount) * Math.PI) * audioLevel * 40 : 0
          const h = Math.max(4, baseHeight + variation)
          return (
            <div key={i} className="w-1.5 rounded-full bg-primary transition-all duration-150" style={{ height: `${h}%`, opacity: callStatus === 'active' ? 0.4 + audioLevel * 0.6 : 0.2 }} />
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <div className={`h-32 w-32 rounded-full flex items-center justify-center transition-all duration-500 ${callStatus === 'active' ? 'bg-green-100 shadow-lg shadow-green-200/50' : callStatus === 'connecting' ? 'bg-amber-100 animate-pulse' : 'bg-secondary'}`}>
                {callStatus === 'active' ? (
                  <RiPhoneFill className="h-14 w-14 text-green-600" />
                ) : callStatus === 'connecting' ? (
                  <span className="h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <RiPhoneLine className="h-14 w-14 text-muted-foreground" />
                )}
              </div>
              {callStatus === 'active' && (
                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 animate-pulse" />
              )}
            </div>

            <div>
              <h2 className="text-2xl font-serif font-semibold tracking-wide">
                {callStatus === 'idle' ? 'Ready to Call' : callStatus === 'connecting' ? 'Connecting...' : callStatus === 'active' ? 'Call in Progress' : 'Call Ended'}
              </h2>
              {callStatus === 'active' && (
                <div className="flex items-center justify-center gap-2 mt-2 text-muted-foreground">
                  <RiTimeLine className="h-4 w-4" />
                  <span className="font-mono text-lg">{formatDuration(callDuration)}</span>
                </div>
              )}
              {callStatus === 'idle' && (
                <p className="text-sm text-muted-foreground mt-1">Press the button below to start a test voice call with your AI receptionist</p>
              )}
            </div>

            <WaveformBars />

            <div className="flex items-center gap-4">
              {callStatus === 'idle' || callStatus === 'ended' ? (
                <Button size="lg" onClick={startCall} className="gap-2 px-8 py-6 text-base rounded-full">
                  <RiPhoneLine className="h-5 w-5" /> Start Call
                </Button>
              ) : callStatus === 'active' ? (
                <>
                  <Button variant={isMuted ? 'destructive' : 'outline'} size="lg" onClick={toggleMute} className="rounded-full h-14 w-14 p-0">
                    {isMuted ? <RiMicOffLine className="h-6 w-6" /> : <RiMicLine className="h-6 w-6" />}
                  </Button>
                  <Button variant="destructive" size="lg" onClick={stopCall} className="gap-2 px-8 py-6 text-base rounded-full">
                    <RiStopCircleLine className="h-5 w-5" /> End Call
                  </Button>
                </>
              ) : null}
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2 max-w-md">
                <RiAlertLine className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-serif tracking-wide">Live Transcript</CardTitle>
            {transcript.length > 0 && (
              <Badge variant="secondary" className="text-xs">{transcript.length} messages</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {transcript.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <RiUserVoiceLine className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No transcript yet</p>
              <p className="text-xs mt-1">{callStatus === 'idle' ? 'Start a call to see the conversation' : 'Waiting for audio...'}</p>
            </div>
          ) : (
            <div ref={scrollRef} className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {transcript.map((entry, i) => (
                <div key={i} className={`flex gap-3 ${entry.role === 'system' ? 'justify-center' : entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {entry.role === 'system' ? (
                    <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">{entry.text}</span>
                  ) : (
                    <div className={`max-w-[80%] ${entry.role === 'assistant' ? '' : 'order-1'}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        {entry.role === 'assistant' ? (
                          <RiRobot2Line className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <RiUserVoiceLine className="h-3.5 w-3.5 text-accent" />
                        )}
                        <span className="text-xs font-medium text-muted-foreground">
                          {entry.role === 'assistant' ? 'VoiceHost AI' : 'You'}
                        </span>
                        <span className="text-xs text-muted-foreground">{entry.timestamp}</span>
                      </div>
                      <div className={`rounded-lg px-3 py-2 text-sm ${entry.role === 'assistant' ? 'bg-primary/10' : 'bg-secondary'}`}>
                        {entry.text}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
