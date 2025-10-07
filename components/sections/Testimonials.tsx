import reviews from '@/data/reviews.json'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface ReviewItem {
  author: string
  rating: number
  body: string
  date?: string
}

const sanitized = (Array.isArray(reviews) ? reviews : []).filter(r => {
  return r && typeof r.author === 'string' && typeof r.body === 'string' && typeof r.rating === 'number'
}).slice(0, 9) as ReviewItem[]

function Stars({ value }: { value: number }) {
  const full = Math.round(Math.min(5, Math.max(0, value)))
  return (
    <div className="flex gap-0.5" aria-label={`Rating ${full} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
            className={`h-4 w-4 ${i < full ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'} transition-colors`}
            viewBox="0 0 20 20" fill={i < full ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1">
          <path d="M10 15.27 16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19 10 15.27Z"/>
        </svg>
      ))}
    </div>
  )
}

export function TestimonialsSection() {
  if (!sanitized.length) return null
  const avg = (sanitized.reduce((a, r) => a + r.rating, 0) / sanitized.length).toFixed(1)
  return (
    <section id="testimonials" className="py-16 bg-muted/30">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end gap-6 mb-10">
          <div className="flex-1 space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">What Homeowners Say</h2>
            <p className="text-muted-foreground text-sm md:text-base">
              Real client feedback from recent Edmonton painting projects. Quality, cleanliness and communication are common themes.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Stars value={Number(avg)} />
            <div className="text-sm">
              <span className="font-semibold">{avg}</span>/5 · {sanitized.length} reviews
            </div>
          </div>
        </div>
        <Separator className="mb-10" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sanitized.map((r, idx) => (
            <Card key={idx} className="flex flex-col shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="text-base font-semibold flex-1 truncate" title={r.author}>{r.author}</CardTitle>
                  <Stars value={r.rating} />
                </div>
                {r.date && (
                  <time className="text-[10px] uppercase tracking-wide text-muted-foreground" dateTime={r.date}>{r.date}</time>
                )}
              </CardHeader>
              <CardContent className="pt-0 text-sm leading-relaxed">
                {r.body.length > 300 ? r.body.slice(0, 300) + '…' : r.body}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export default TestimonialsSection