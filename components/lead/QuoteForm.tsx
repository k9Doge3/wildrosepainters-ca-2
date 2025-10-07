"use client"
import React, { useCallback, useMemo, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, Paintbrush2, Clock, Layers, ClipboardList, Info, Home, Palette, Image as ImageIcon, UploadCloud, ChevronLeft, ChevronRight } from 'lucide-react'
import { businessProfile } from '@/config/business-profile.example'

interface QuoteFormProps { variant?: 'enhanced' | 'quick' }

type Step = 1 | 2 | 3 | 4 | 5 | 6

interface QuoteFormState {
  // Contact
  name: string
  email: string
  phone: string
  // Core
  projectType: string
  homeSize: string
  timeline: string
  budget: string
  urgency: string
  additionalInfo: string
  // Quiz enrichment
  surfaces: string[]
  goals: string[]
  propertyType: string
  floors: string
  rooms: string
  occupied: string
  finish: string
  colorsReady: string
  photos: { name: string; mime: string; size: number; base64: string }[]
  consentShare: boolean
}

const initialState: QuoteFormState = {
  name: '',
  email: '',
  phone: '',
  projectType: '',
  homeSize: '',
  timeline: '',
  budget: '',
  urgency: '',
  additionalInfo: '',
  surfaces: [],
  goals: [],
  propertyType: '',
  floors: '',
  rooms: '',
  occupied: '',
  finish: '',
  colorsReady: '',
  photos: []
  ,consentShare: false
}

const PROJECT_OPTIONS = [
  { id: 'interior', title: 'Interior Painting', desc: 'Rooms, walls, ceilings, trim' },
  { id: 'exterior', title: 'Exterior Painting', desc: 'Siding, trim, doors, windows' },
  { id: 'deck', title: 'Deck Staining', desc: 'Protect your deck' },
  { id: 'fence', title: 'Fence Painting', desc: 'Refresh your fence' },
  { id: 'commercial', title: 'Commercial Project', desc: 'Office / retail' },
  { id: 'multiple', title: 'Multiple Services', desc: 'Combination' }
];

const SURFACE_OPTIONS = ['Walls','Ceilings','Trim / Baseboards','Doors','Cabinets','Exterior Siding','Deck','Fence']
const GOAL_OPTIONS = ['Freshen Look','Color Change','Repair Damage','Prep To Sell','Protect Wood','Increase Curb Appeal']
const PROPERTY_TYPES = ['Detached House','Townhouse','Condo / Apartment','Commercial Space','Other']
const FINISH_OPTIONS = ['Matte','Eggshell','Satin','Semi-Gloss','High-Gloss','Unsure']

// Lightweight client validation messages
const validate = (data: QuoteFormState) => {
  const errors: Partial<Record<keyof QuoteFormState, string>> = {}
  if (!data.name.trim()) errors.name = 'Name required'
  if (!data.email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) errors.email = 'Valid email required'
  if (!data.phone.trim()) errors.phone = 'Phone required'
  return errors
}

// Shared header with progress bar
const Header: React.FC<{ step:number; total:number; icon:React.ReactNode; title:string; subtitle?:string }> = ({ step, total, icon, title, subtitle }) => (
  <div>
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-md bg-secondary/10 flex items-center justify-center">{icon}</div>
      <div>
        <h3 className="font-semibold leading-tight">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <span className="ml-auto text-xs text-gray-500">Step {step} / {total}</span>
    </div>
    <div className="h-2 rounded-full bg-gray-200 overflow-hidden" aria-label="progress">
      <div className="h-full bg-secondary transition-all" data-progress-bar data-total={total} data-step={step} data-percent={(step/total)*100} />
    </div>
  </div>
)

const StepOne: React.FC<{ onSelect:(id:string)=>void; loading:boolean; step:number; total:number; onSkip:()=>void }> = ({ onSelect, loading, step, total, onSkip }) => (
  <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="space-y-6">
    <Header step={step} total={total} icon={<Paintbrush2 className="h-6 w-6 text-secondary" />} title="What type of project?" subtitle="Pick the closest match" />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {PROJECT_OPTIONS.map(opt => (
        <button key={opt.id} type="button" disabled={loading} onClick={()=>onSelect(opt.id)} className="group relative text-left p-4 border-2 border-gray-200 rounded-xl hover:border-secondary hover:bg-secondary/5 transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-secondary">
          <div className="font-semibold flex items-center gap-2"><Paintbrush2 className="h-4 w-4 text-secondary" />{opt.title}</div>
          <div className="text-sm text-gray-600 mt-1 leading-snug">{opt.desc}</div>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition text-secondary text-xs">Select →</div>
        </button>
      ))}
    </div>
    <div className="flex justify-end"><button type="button" onClick={onSkip} className="text-xs text-gray-500 hover:text-secondary underline">Skip for now</button></div>
  </motion.div>
)

const StepTwoQuiz: React.FC<{ form:QuoteFormState; toggle:(field:'surfaces'|'goals', value:string)=>void; next:()=>void; back:()=>void; step:number; total:number; }> = ({ form, toggle, next, back, step, total }) => (
  <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="space-y-8">
    <Header step={step} total={total} icon={<Layers className="h-6 w-6 text-secondary" />} title="Surfaces & goals" subtitle="Select all that apply" />
    <div className="space-y-5">
      <fieldset>
        <legend className="text-sm font-semibold mb-2 flex items-center gap-2"><ClipboardList className="h-4 w-4 text-secondary" /> Surfaces</legend>
        <div className="flex flex-wrap gap-2">
          {SURFACE_OPTIONS.map(s => {
            const active = form.surfaces.includes(s)
            return <button key={s} type="button" onClick={()=>toggle('surfaces', s)} className={`px-3 py-1.5 text-sm rounded-full border ${active ? 'bg-secondary text-white border-secondary' : 'border-gray-300 hover:border-secondary hover:text-secondary'}`}>{s}</button>
          })}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-semibold mb-2 flex items-center gap-2"><Info className="h-4 w-4 text-secondary" /> Goals</legend>
        <div className="flex flex-wrap gap-2">
          {GOAL_OPTIONS.map(g => {
            const active = form.goals.includes(g)
            return <button key={g} type="button" onClick={()=>toggle('goals', g)} className={`px-3 py-1.5 text-sm rounded-full border ${active ? 'bg-secondary text-white border-secondary' : 'border-gray-300 hover:border-secondary hover:text-secondary'}`}>{g}</button>
          })}
        </div>
      </fieldset>
    </div>
    <NavButtons back={back} next={next} canNext={true} />
  </motion.div>
)

const StepThreeDetails: React.FC<{ form:QuoteFormState; update:(name:string,value:string)=>void; next:()=>void; back:()=>void; step:number; total:number; }> = ({ form, update, next, back, step, total }) => (
  <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="space-y-6">
    <Header step={step} total={total} icon={<Home className="h-6 w-6 text-secondary" />} title="Property details" subtitle="Helpful for planning" />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <div><label className="text-sm font-semibold" htmlFor="propertyType">Property Type</label><select id="propertyType" aria-label="Property Type" title="Property Type" value={form.propertyType} onChange={e=>update('propertyType', e.target.value)} className="mt-1 w-full h-11 px-3 rounded-md border border-gray-300 bg-white"><option value="">Select...</option>{PROPERTY_TYPES.map(pt=> <option key={pt} value={pt}>{pt}</option>)}</select></div>
  <div><label className="text-sm font-semibold" htmlFor="floors">Floors</label><select id="floors" aria-label="Floors" title="Floors" value={form.floors} onChange={e=>update('floors', e.target.value)} className="mt-1 w-full h-11 px-3 rounded-md border border-gray-300 bg-white"><option value="">--</option>{['1','2','3','4+'].map(f=> <option key={f} value={f}>{f}</option>)}</select></div>
  <div><label className="text-sm font-semibold" htmlFor="rooms">Approx Rooms</label><select id="rooms" aria-label="Approx Rooms" title="Approx Rooms" value={form.rooms} onChange={e=>update('rooms', e.target.value)} className="mt-1 w-full h-11 px-3 rounded-md border border-gray-300 bg-white"><option value="">--</option>{['1-2','3-4','5-6','7-8','9+'].map(r=> <option key={r} value={r}>{r}</option>)}</select></div>
  <div><label className="text-sm font-semibold" htmlFor="occupied">Occupied?</label><select id="occupied" aria-label="Occupied" title="Occupied" value={form.occupied} onChange={e=>update('occupied', e.target.value)} className="mt-1 w-full h-11 px-3 rounded-md border border-gray-300 bg-white"><option value="">Select</option><option value="yes">Yes</option><option value="partially">Partially</option><option value="no">No / Vacant</option></select></div>
    </div>
    <NavButtons back={back} next={next} canNext={true} />
  </motion.div>
)

const StepFourPreferences: React.FC<{ form:QuoteFormState; update:(name:string,value:string)=>void; next:()=>void; back:()=>void; step:number; total:number; }> = ({ form, update, next, back, step, total }) => (
  <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="space-y-6">
    <Header step={step} total={total} icon={<Palette className="h-6 w-6 text-secondary" />} title="Preferences" subtitle="Optional but helpful" />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <div><label className="text-sm font-semibold" htmlFor="finish">Finish Preference</label><select id="finish" aria-label="Finish Preference" title="Finish Preference" value={form.finish} onChange={e=>update('finish', e.target.value)} className="mt-1 w-full h-11 px-3 rounded-md border border-gray-300 bg-white"><option value="">Select</option>{FINISH_OPTIONS.map(f=> <option key={f} value={f}>{f}</option>)}</select></div>
  <div><label className="text-sm font-semibold" htmlFor="colorsReady">Colours Decided?</label><select id="colorsReady" aria-label="Colours Decided" title="Colours Decided" value={form.colorsReady} onChange={e=>update('colorsReady', e.target.value)} className="mt-1 w-full h-11 px-3 rounded-md border border-gray-300 bg-white"><option value="">Select</option><option value="yes">Yes - Ready</option><option value="shortlist">Shortlist / Need Advice</option><option value="no">No - Need Help</option></select></div>
      <div className="sm:col-span-2"><label className="text-sm font-semibold mb-1">Additional Info</label><Textarea name="additionalInfo" value={form.additionalInfo} onChange={e=>update('additionalInfo', e.target.value)} placeholder="Any specific paints, deadlines..." /></div>
    </div>
    <NavButtons back={back} next={next} canNext={true} />
  </motion.div>
)

const StepFivePhotos: React.FC<{ form:QuoteFormState; add:(f:FileList|null)=>void; remove:(i:number)=>void; next:()=>void; back:()=>void; step:number; total:number; }> = ({ form, add, remove, next, back, step, total }) => (
  <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="space-y-6">
    <Header step={step} total={total} icon={<ImageIcon className="h-6 w-6 text-secondary" />} title="Upload photos" subtitle="Optional - up to 3 images" />
    <div>
      <label className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-xl cursor-pointer hover:border-secondary/60 transition">
        <UploadCloud className="h-8 w-8 text-secondary mb-2" />
        <span className="text-sm">Click or drop images here</span>
        <input type="file" accept="image/*" multiple className="hidden" onChange={e=>add(e.target.files)} />
      </label>
      {form.photos.length>0 && <div className="grid grid-cols-3 gap-3 mt-4">{form.photos.map((p,i)=> <div key={i} className="relative group border rounded-md overflow-hidden">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={p.base64} alt={p.name} className="h-24 w-full object-cover" /><button type="button" onClick={()=>remove(i)} className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1 rounded opacity-0 group-hover:opacity-100">✕</button></div>)}</div>}
    </div>
    <NavButtons back={back} next={next} canNext={true} />
  </motion.div>
)

const SummaryBlock: React.FC<{ form:QuoteFormState }> = ({ form }) => {
  const lines = [
    form.projectType && `Project: ${form.projectType}`,
    form.surfaces.length && `Surfaces: ${form.surfaces.join(', ')}`,
    form.goals.length && `Goals: ${form.goals.join(', ')}`,
    form.propertyType && `Property: ${form.propertyType}`,
    form.floors && `Floors: ${form.floors}`,
    form.rooms && `Rooms: ${form.rooms}`,
    form.occupied && `Occupied: ${form.occupied}`,
    form.finish && `Finish: ${form.finish}`,
    form.colorsReady && `Colours: ${form.colorsReady}`
  ].filter(Boolean)
  if (!lines.length) return null
  return <div className="bg-gray-50 p-4 rounded-md text-xs leading-relaxed border border-gray-200"><div className="font-semibold mb-1 flex items-center gap-1"><Info className="h-3 w-3 text-secondary" /> Summary</div><ul className="list-disc ml-4 space-y-0.5">{lines.map((l,i)=> <li key={i}>{l}</li>)}</ul>{form.photos.length>0 && <div className="mt-2">Photos attached: {form.photos.length}</div>}</div>
}

const StepSixContact: React.FC<{ variant:'enhanced'|'quick'; form:QuoteFormState; status:'idle'|'success'|'error'; isSubmitting:boolean; errors:Partial<Record<keyof QuoteFormState,string>>; onChange:(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>)=>void; onBack:()=>void; onSubmit:(e:React.FormEvent)=>void; step:number; total:number; }> = ({ variant, form, status, isSubmitting, errors, onChange, onBack, onSubmit, step, total }) => (
  <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}>
    <Header step={step} total={total} icon={<CheckCircle2 className="h-6 w-6 text-secondary" />} title="Your contact details" subtitle="We respond within 24 hours" />
    <form onSubmit={onSubmit} className="space-y-5" aria-label="Quote contact form">
      <input type="text" id={variant === 'quick' ? 'website' : 'website-alt'} name="website" className="hidden" tabIndex={-1} aria-hidden="true" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="block text-sm font-semibold mb-1">Full Name *</label><Input name="name" required value={form.name} onChange={onChange} placeholder="John Smith" aria-invalid={!!errors.name} />{errors.name && <p className="mt-1 text-xs text-red-600" role="alert">{errors.name}</p>}</div>
        <div><label className="block text-sm font-semibold mb-1">Email *</label><Input name="email" type="email" required value={form.email} onChange={onChange} placeholder="john@example.com" aria-invalid={!!errors.email} />{errors.email && <p className="mt-1 text-xs text-red-600" role="alert">{errors.email}</p>}</div>
        <div><label className="block text-sm font-semibold mb-1">Phone *</label><Input name="phone" required value={form.phone} onChange={onChange} placeholder="(587) 501-6994" aria-invalid={!!errors.phone} />{errors.phone && <p className="mt-1 text-xs text-red-600" role="alert">{errors.phone}</p>}</div>
  <div><label className="block text-sm font-semibold mb-1" htmlFor="timeline">Ideal Timeline</label><select id="timeline" aria-label="Ideal Timeline" title="Ideal Timeline" name="timeline" value={form.timeline} onChange={onChange} className="w-full h-11 px-3 rounded-md border border-gray-300 bg-white"><option value="">Select timeline</option><option value="immediately">Immediately</option><option value="within-2-weeks">Within 2 weeks</option><option value="within-month">Within 1 month</option><option value="within-3-months">Within 3 months</option><option value="flexible">Flexible</option></select></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div><label className="block text-sm font-semibold mb-1" htmlFor="budget">Budget</label><select id="budget" aria-label="Budget" title="Budget" name="budget" value={form.budget} onChange={onChange} className="w-full h-11 px-3 rounded-md border border-gray-300 bg-white"><option value="">Prefer not to say</option><option value="under-1000">Under $1,000</option><option value="1000-2500">$1,000 - $2,500</option><option value="2500-5000">$2,500 - $5,000</option><option value="5000-10000">$5,000 - $10,000</option><option value="10000-20000">$10,000 - $20,000</option><option value="over-20000">Over $20,000</option></select></div>
  <div><label className="block text-sm font-semibold mb-1" htmlFor="urgency">Urgency</label><select id="urgency" aria-label="Urgency" title="Urgency" name="urgency" value={form.urgency} onChange={onChange} className="w-full h-11 px-3 rounded-md border border-gray-300 bg-white"><option value="">Select urgency</option><option value="urgent">Urgent - ASAP</option><option value="soon">Soon - Within a week</option><option value="planning">Planning ahead</option></select></div>
      </div>
      <SummaryBlock form={form} />
      {status === 'success' && <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex items-center gap-2 bg-green-100 text-green-800 p-4 rounded-lg"><CheckCircle2 className="h-5 w-5" /><span>🎉 Thank you! We'll contact you within 24 hours.</span></motion.div>}
      {status === 'error' && <div className="flex items-center gap-2 bg-red-100 text-red-800 p-3 rounded-lg"><span>⚠️ Something went wrong. Please call us.</span></div>}
  <div className="space-y-4">
        <label className="flex items-start gap-3 text-xs md:text-sm bg-gray-50 p-3 rounded-md border border-gray-200">
          <input type="checkbox" name="consentShare" checked={form.consentShare} onChange={e=>onChange({ ...(e as any), target: { ...(e.target as any), name: 'consentShare', value: e.target.checked ? 'true' : 'false' } })} required className="mt-0.5 h-4 w-4" />
          <span>I agree my project details and contact information may be shared with a painting contractor solely for the purpose of providing a quote. I understand I can request deletion at any time.</span>
        </label>
        <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1" disabled={isSubmitting}><ChevronLeft className="mr-1 h-4 w-4" />Back</Button>
        <Button type="submit" disabled={isSubmitting || Object.keys(errors).length > 0} className="flex-1 bg-secondary hover:bg-secondary/90 text-white text-lg py-6 disabled:opacity-50">{isSubmitting ? 'Sending...' : 'Get My Free Quote! 🎨'}</Button>
        </div>
      </div>
    </form>
  </motion.div>
)

const NavButtons: React.FC<{ back:()=>void; next:()=>void; canNext:boolean }> = ({ back, next, canNext }) => (
  <div className="flex justify-between pt-2">
    <Button type="button" variant="outline" onClick={back} className="gap-1"><ChevronLeft className="h-4 w-4" />Back</Button>
    <Button type="button" onClick={next} disabled={!canNext} className="bg-secondary hover:bg-secondary/90 gap-1">Next<ChevronRight className="h-4 w-4" /></Button>
  </div>
)

// (Removed old StepTwo replaced by multi-step quiz components)

export const QuoteForm: React.FC<QuoteFormProps> = ({ variant = 'enhanced' }) => {
  const quizMode = variant === 'enhanced'
  const twoStep = businessProfile.twoStepForm !== false
  const [step, setStep] = useState<Step>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [form, setForm] = useState<QuoteFormState>(initialState)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const totalSteps = quizMode ? 6 : (twoStep ? 2 : 1)

  const errors = useMemo(() => validate(form), [form])

  const update = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name === 'consentShare') {
      setForm(prev => ({ ...prev, consentShare: value === 'true' }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }, [])

  const updateDirect = (name:string,value:string) => setForm(prev => ({ ...prev, [name]: value }))

  const toggle = (field: 'surfaces' | 'goals', value: string) => {
    setForm(prev => ({ ...prev, [field]: prev[field].includes(value) ? prev[field].filter(v=>v!==value) : [...prev[field], value] }))
  }

  const selectProject = useCallback((id: string) => {
    setForm(prev => ({ ...prev, projectType: id }))
    if (quizMode) setStep(2)
    else if (twoStep) setStep(2)
  }, [quizMode, twoStep])

  const addPhotos = (files: FileList | null) => {
    if (!files) return
    const allow = 3 - form.photos.length
    Array.from(files).slice(0, allow).forEach(file => {
      if (!file.type.startsWith('image/') || file.size > 5*1024*1024) return
      const reader = new FileReader()
      reader.onload = () => {
        setForm(prev => ({ ...prev, photos: [...prev.photos, { name: file.name, mime: file.type, size: file.size, base64: reader.result as string }] }))
      }
      reader.readAsDataURL(file)
    })
  }
  const removePhoto = (i:number) => setForm(prev => ({ ...prev, photos: prev.photos.filter((_,idx)=>idx!==i) }))

  const reset = () => { setForm(initialState); setStep(1) }

  const assembleMessage = () => {
    const lines = [
      form.projectType && `Project: ${form.projectType}`,
      form.surfaces.length && `Surfaces: ${form.surfaces.join(', ')}`,
      form.goals.length && `Goals: ${form.goals.join(', ')}`,
      form.propertyType && `Property Type: ${form.propertyType}`,
      form.floors && `Floors: ${form.floors}`,
      form.rooms && `Rooms: ${form.rooms}`,
      form.occupied && `Occupied: ${form.occupied}`,
      form.finish && `Finish Preference: ${form.finish}`,
      form.colorsReady && `Colours Ready: ${form.colorsReady}`,
      form.timeline && `Timeline: ${form.timeline}`,
      form.budget && `Budget: ${form.budget}`,
      form.urgency && `Urgency: ${form.urgency}`,
      form.additionalInfo && `Notes: ${form.additionalInfo}`
    ].filter(Boolean)
    return lines.join('\n')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const currentErrors = validate(form)
    if (Object.keys(currentErrors).length) return
    setIsSubmitting(true); setStatus('idle')
    try {
      const hp = (document.getElementById(variant === 'quick' ? 'website' : 'website-alt') as HTMLInputElement | null)?.value
      if (hp) { setStatus('success'); setIsSubmitting(false); reset(); return }
      const attachments = form.photos.map(p => ({ filename: p.name, mime: p.mime, data: p.base64.split(',')[1] }))
  const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone, service: form.projectType || 'general', message: assembleMessage(), attachments, consentShare: form.consentShare }) })
      if (!res.ok) throw new Error('failed')
      setStatus('success'); reset()
    } catch (e) {
      setStatus('error')
    } finally { setIsSubmitting(false) }
  }

  if (!twoStep && !quizMode) {
    const simpleErrors = validate(form)
    return (
      <form onSubmit={submit} className="space-y-5" aria-label="Simple quote form">
        <input type="text" name="website" className="hidden" tabIndex={-1} aria-hidden="true" />
        <h2 className="text-2xl font-bold font-serif text-center">Request a Quote</h2>
        <Input name="name" placeholder="Full Name" value={form.name} onChange={update} required aria-invalid={!!simpleErrors.name} />
        {simpleErrors.name && <p className="text-xs text-red-600" role="alert">{simpleErrors.name}</p>}
        <Input name="email" type="email" placeholder="Email" value={form.email} onChange={update} required aria-invalid={!!simpleErrors.email} />
        {simpleErrors.email && <p className="text-xs text-red-600" role="alert">{simpleErrors.email}</p>}
        <Input name="phone" placeholder="Phone" value={form.phone} onChange={update} required aria-invalid={!!simpleErrors.phone} />
        {simpleErrors.phone && <p className="text-xs text-red-600" role="alert">{simpleErrors.phone}</p>}
        <Textarea name="additionalInfo" placeholder="Project details" value={form.additionalInfo} onChange={update} />
        {status === 'success' && <div className="flex items-center gap-2 bg-green-100 text-green-800 p-3 rounded"><CheckCircle2 className="h-4 w-4" />Thanks! We'll reply shortly.</div>}
        {status === 'error' && <div className="bg-red-100 text-red-800 p-3 rounded text-sm">Error sending. Please call us.</div>}
        <Button type="submit" disabled={isSubmitting || Object.keys(simpleErrors).length>0} className="w-full bg-secondary hover:bg-secondary/90">{isSubmitting ? 'Sending...' : 'Get My Free Quote'}</Button>
      </form>
    )
  }

  if (!quizMode) {
    return (
      <div className="rounded-2xl shadow-xl border border-gray-200/70 bg-white p-6 space-y-6 max-w-xl mx-auto">
        <div className="space-y-1">
          <h3 className="text-xl font-bold tracking-tight flex items-center gap-2"><Paintbrush2 className="h-5 w-5 text-secondary" /> {variant === 'quick' ? 'Quick Quote' : 'Get Your Free Quote'}</h3>
          <p className="text-sm text-gray-500 flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Takes less than a minute</p>
        </div>
        {step === 1 && <StepOne onSelect={selectProject} loading={isSubmitting} step={1} total={totalSteps} onSkip={()=>setStep(2)} />}
        {step === 2 && (
          <StepSixContact
            variant={variant}
            form={form}
            status={status}
            isSubmitting={isSubmitting}
            errors={errors}
            onChange={update}
            onBack={()=>setStep(1)}
            onSubmit={submit}
            step={2}
            total={totalSteps}
          />
        )}
      </div>
    )
  }

  // Enhanced quiz mode
  return (
    <div className="rounded-3xl shadow-2xl border border-gray-200/80 bg-white/80 backdrop-blur-sm p-6 md:p-8 space-y-8 max-w-2xl mx-auto">
      <div className="space-y-2">
        <h3 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Paintbrush2 className="h-6 w-6 text-secondary" /> Smart Project Quiz</h3>
        <p className="text-sm text-gray-500 flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> About 60–90 seconds • Helps us give a faster, more accurate quote</p>
      </div>
      {step === 1 && <StepOne onSelect={selectProject} loading={isSubmitting} step={1} total={totalSteps} onSkip={()=>setStep(2)} />}
      {step === 2 && <StepTwoQuiz form={form} toggle={toggle} next={()=>setStep(3)} back={()=>setStep(1)} step={2} total={totalSteps} />}
      {step === 3 && <StepThreeDetails form={form} update={updateDirect} next={()=>setStep(4)} back={()=>setStep(2)} step={3} total={totalSteps} />}
      {step === 4 && <StepFourPreferences form={form} update={updateDirect} next={()=>setStep(5)} back={()=>setStep(3)} step={4} total={totalSteps} />}
      {step === 5 && <StepFivePhotos form={form} add={addPhotos} remove={removePhoto} next={()=>setStep(6)} back={()=>setStep(4)} step={5} total={totalSteps} />}
      {step === 6 && <StepSixContact variant={variant} form={form} status={status} isSubmitting={isSubmitting} errors={errors} onChange={update} onBack={()=>setStep(5)} onSubmit={submit} step={6} total={totalSteps} />}
    </div>
  )
}

export default QuoteForm
