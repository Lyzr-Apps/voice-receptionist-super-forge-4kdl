'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RiSave3Line, RiCheckLine, RiUploadCloud2Line, RiDeleteBinLine, RiFileTextLine, RiAlertLine, RiBuilding2Line, RiPhoneLine, RiCalendarCheckLine, RiUserVoiceLine, RiLinkM, RiFileCopyLine } from 'react-icons/ri'
import { useRAGKnowledgeBase } from '@/lib/ragKnowledgeBase'

const RAG_ID = '69a2794f00c2d274880f6c71'

interface BusinessSettings {
  businessName: string
  hours: string
  address: string
  menuHighlights: string
  specials: string
  hostExtension: string
  managerExtension: string
  kitchenExtension: string
  maxPartySize: string
  availableSlots: string
  voiceTone: string
  greeting: string
}

const DEFAULT_SETTINGS: BusinessSettings = {
  businessName: '',
  hours: '',
  address: '',
  menuHighlights: '',
  specials: '',
  hostExtension: '',
  managerExtension: '',
  kitchenExtension: '',
  maxPartySize: '10',
  availableSlots: '',
  voiceTone: 'warm',
  greeting: '',
}

export default function SettingsSection() {
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  const { documents, loading: docsLoading, error: docsError, fetchDocuments, uploadDocument, removeDocuments } = useRAGKnowledgeBase()

  useEffect(() => {
    try {
      const saved = localStorage.getItem('voicehost-settings')
      if (saved) {
        const parsed = JSON.parse(saved)
        setSettings(prev => ({ ...prev, ...parsed }))
      }
    } catch {
      // ignore parse errors
    }
    fetchDocuments(RAG_ID)
  }, [])

  const updateField = (field: keyof BusinessSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    setSaveStatus('saving')
    try {
      localStorage.setItem('voicehost-settings', JSON.stringify(settings))
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2500)
    } catch {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadStatus('Uploading...')
    setUploadError(null)
    try {
      const result = await uploadDocument(RAG_ID, file)
      if (result.success) {
        setUploadStatus('File uploaded and training started')
        setTimeout(() => setUploadStatus(null), 3000)
      } else {
        setUploadError(result?.error ?? 'Upload failed')
        setUploadStatus(null)
      }
    } catch {
      setUploadError('An unexpected error occurred')
      setUploadStatus(null)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDeleteDoc = async (fileName: string) => {
    if (!fileName) return
    try {
      await removeDocuments(RAG_ID, [fileName])
    } catch {
      // handle silently
    }
  }

  const docsList = Array.isArray(documents) ? documents : []

  return (
    <ScrollArea className="h-[calc(100vh-120px)]">
      <div className="space-y-6 pr-4 pb-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-serif tracking-wide flex items-center gap-2">
              <RiBuilding2Line className="h-5 w-5 text-primary" />
              Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessName" className="text-sm">Business Name</Label>
                <Input id="businessName" placeholder="Heritage Bistro" value={settings.businessName} onChange={(e) => updateField('businessName', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="address" className="text-sm">Address</Label>
                <Input id="address" placeholder="123 Heritage Lane, Downtown" value={settings.address} onChange={(e) => updateField('address', e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="hours" className="text-sm">Hours of Operation</Label>
              <Textarea id="hours" placeholder="Mon-Thu: 11am-10pm&#10;Fri-Sat: 11am-11pm&#10;Sun: 10am-9pm" rows={3} value={settings.hours} onChange={(e) => updateField('hours', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="menuHighlights" className="text-sm">Menu Highlights</Label>
              <Textarea id="menuHighlights" placeholder="Grilled salmon, House salad, Wagyu steak, Truffle pasta..." rows={2} value={settings.menuHighlights} onChange={(e) => updateField('menuHighlights', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="specials" className="text-sm">Current Specials</Label>
              <Textarea id="specials" placeholder="Happy Hour 4-6pm: Half-price appetizers&#10;Tuesday: Wine pairing dinner $65pp" rows={2} value={settings.specials} onChange={(e) => updateField('specials', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-serif tracking-wide flex items-center gap-2">
              <RiLinkM className="h-5 w-5 text-primary" />
              Customer Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Share these links with your customers so they can book tables and view your menu online.</p>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Booking Page</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input readOnly value={typeof window !== 'undefined' ? `${window.location.origin}/book` : '/book'} className="text-sm bg-secondary/50" />
                  <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={() => { const url = typeof window !== 'undefined' ? `${window.location.origin}/book` : '/book'; navigator.clipboard.writeText(url).then(() => { setCopiedLink('book'); setTimeout(() => setCopiedLink(null), 2000) }) }}>
                    {copiedLink === 'book' ? <><RiCheckLine className="h-4 w-4 text-green-600" /> <span className="text-green-600">Copied!</span></> : <><RiFileCopyLine className="h-4 w-4" /> Copy Link</>}
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Menu Page</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input readOnly value={typeof window !== 'undefined' ? `${window.location.origin}/menu` : '/menu'} className="text-sm bg-secondary/50" />
                  <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={() => { const url = typeof window !== 'undefined' ? `${window.location.origin}/menu` : '/menu'; navigator.clipboard.writeText(url).then(() => { setCopiedLink('menu'); setTimeout(() => setCopiedLink(null), 2000) }) }}>
                    {copiedLink === 'menu' ? <><RiCheckLine className="h-4 w-4 text-green-600" /> <span className="text-green-600">Copied!</span></> : <><RiFileCopyLine className="h-4 w-4" /> Copy Link</>}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-serif tracking-wide flex items-center gap-2">
              <RiPhoneLine className="h-5 w-5 text-primary" />
              Call Routing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="hostExt" className="text-sm">Host Stand Extension</Label>
                <Input id="hostExt" placeholder="101" value={settings.hostExtension} onChange={(e) => updateField('hostExtension', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="managerExt" className="text-sm">Manager Extension</Label>
                <Input id="managerExt" placeholder="102" value={settings.managerExtension} onChange={(e) => updateField('managerExtension', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="kitchenExt" className="text-sm">Kitchen Extension</Label>
                <Input id="kitchenExt" placeholder="103" value={settings.kitchenExtension} onChange={(e) => updateField('kitchenExtension', e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-serif tracking-wide flex items-center gap-2">
              <RiCalendarCheckLine className="h-5 w-5 text-primary" />
              Reservation Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxParty" className="text-sm">Max Party Size</Label>
                <Input id="maxParty" type="number" min="1" max="100" placeholder="10" value={settings.maxPartySize} onChange={(e) => updateField('maxPartySize', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="slots" className="text-sm">Available Time Slots</Label>
                <Input id="slots" placeholder="5:00 PM, 5:30 PM, 6:00 PM, ..." value={settings.availableSlots} onChange={(e) => updateField('availableSlots', e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-serif tracking-wide flex items-center gap-2">
              <RiUserVoiceLine className="h-5 w-5 text-primary" />
              Voice Personality
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="voiceTone" className="text-sm">Tone</Label>
              <div className="flex gap-2 mt-1">
                {['warm', 'professional', 'casual', 'formal'].map(tone => (
                  <Button key={tone} variant={settings.voiceTone === tone ? 'default' : 'outline'} size="sm" className="capitalize" onClick={() => updateField('voiceTone', tone)}>
                    {tone}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="greeting" className="text-sm">Custom Greeting</Label>
              <Textarea id="greeting" placeholder="Thank you for calling Heritage Bistro! How may I help you today?" rows={2} value={settings.greeting} onChange={(e) => updateField('greeting', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saveStatus === 'saving'} className="gap-2">
            {saveStatus === 'saving' ? (
              <><span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> Saving...</>
            ) : saveStatus === 'saved' ? (
              <><RiCheckLine className="h-4 w-4" /> Saved</>
            ) : (
              <><RiSave3Line className="h-4 w-4" /> Save Settings</>
            )}
          </Button>
          {saveStatus === 'error' && (
            <span className="text-sm text-destructive flex items-center gap-1"><RiAlertLine className="h-4 w-4" /> Failed to save</span>
          )}
        </div>

        <Separator />

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-serif tracking-wide flex items-center gap-2">
              <RiUploadCloud2Line className="h-5 w-5 text-primary" />
              Knowledge Base
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Upload documents (PDF, DOCX, TXT) to train the voice receptionist with your restaurant's specific information, menus, policies, and FAQs.</p>

            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <RiUploadCloud2Line className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Click to upload a document</p>
              <p className="text-xs text-muted-foreground mt-1">Supports PDF, DOCX, TXT</p>
              <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleFileUpload} />
            </div>

            {uploadStatus && (
              <div className="p-3 rounded-lg bg-green-50 text-green-800 text-sm flex items-center gap-2">
                <RiCheckLine className="h-4 w-4" /> {uploadStatus}
              </div>
            )}
            {uploadError && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                <RiAlertLine className="h-4 w-4" /> {uploadError}
              </div>
            )}

            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Uploaded Documents</Label>
              {docsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : docsError ? (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                  <RiAlertLine className="h-4 w-4" /> {docsError}
                </div>
              ) : docsList.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <RiFileTextLine className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No documents uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {docsList.map((doc, i) => (
                    <div key={doc?.id ?? i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-2">
                        <RiFileTextLine className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{doc?.fileName ?? 'Unknown file'}</span>
                        <Badge variant="outline" className="text-xs">{doc?.fileType ?? 'file'}</Badge>
                        {doc?.status && (
                          <Badge variant={doc.status === 'active' ? 'default' : 'secondary'} className="text-xs capitalize">{doc.status}</Badge>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteDoc(doc?.fileName ?? '')}>
                        <RiDeleteBinLine className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
