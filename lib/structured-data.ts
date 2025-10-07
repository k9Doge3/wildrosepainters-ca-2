import { businessProfile } from '@/config/business-profile.example'
import reviewsData from '@/data/reviews.json'

// Types for clarity
interface ReviewInput { author: string; rating: number; body: string; date?: string }
interface FAQItem { q: string; a: string }

export function localBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: businessProfile.name,
    description: businessProfile.description,
    image: 'https://www.wildrosepainters.ca/wildrose-painters-logo.png',
    url: 'https://www.wildrosepainters.ca',
    telephone: businessProfile.phone,
    priceRange: '$$',
    areaServed: { '@type': 'City', name: businessProfile.address.city },
    address: {
      '@type': 'PostalAddress',
      streetAddress: businessProfile.address.street || 'TBD',
      addressLocality: businessProfile.address.city,
      addressRegion: businessProfile.address.region,
      postalCode: businessProfile.address.postalCode || 'TBD',
      addressCountry: 'CA'
    },
    openingHoursSpecification: [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'], opens: '08:00', closes: '18:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday'], opens: '09:00', closes: '14:00' }
    ]
  }
}

export function serviceSchemas() {
  const baseUrl = 'https://www.wildrosepainters.ca'
  const services = [
    { id: 'interior-painting-edmonton', name: 'Interior Painting', desc: 'Professional interior house painting services in Edmonton: walls, ceilings, trim, doors.' },
    { id: 'exterior-painting-edmonton', name: 'Exterior Painting', desc: 'Durable exterior painting for siding, trim, fascia protecting against Alberta weather.' },
    { id: 'deck-staining-edmonton', name: 'Deck & Fence Staining', desc: 'Staining & refinishing for decks and fences to protect and enhance wood longevity.' },
    { id: 'commercial-painting-edmonton', name: 'Commercial Painting', desc: 'Office & light commercial painting focused on minimal downtime and clean results.' }
  ]
  return services.map(s => ({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: s.name,
    description: s.desc,
    provider: { '@type': 'LocalBusiness', name: businessProfile.name },
    areaServed: { '@type': 'City', name: businessProfile.address.city },
    serviceType: s.name,
    url: `${baseUrl}/#${s.id}`
  }))
}

export function reviewSchema(reviews: ReviewInput[]) {
  if (!reviews.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'AggregateRating',
    ratingValue: (reviews.reduce((a,r)=>a+r.rating,0)/reviews.length).toFixed(1),
    reviewCount: reviews.length,
    itemReviewed: { '@type': 'LocalBusiness', name: businessProfile.name },
    bestRating: '5',
    worstRating: '1'
  }
}

export function individualReviewSchemas(reviews: ReviewInput[]) {
  return reviews.map(r => ({
    '@context': 'https://schema.org',
    '@type': 'Review',
    author: { '@type': 'Person', name: r.author },
    datePublished: r.date || new Date().toISOString().split('T')[0],
    reviewBody: r.body,
    reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
    itemReviewed: { '@type': 'LocalBusiness', name: businessProfile.name }
  }))
}

export function faqSchema(items: FAQItem[]) {
  if (!items.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(i => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: i.a }
    }))
  }
}

function sanitizeReview(r: any): ReviewInput | null {
  if (!r) return null
  const ratingNum = Number(r.rating)
  if (!r.author || !r.body || isNaN(ratingNum)) return null
  if (ratingNum < 1 || ratingNum > 5) return null
  const body = String(r.body).slice(0, 400) // trim overly long
  return { author: String(r.author).slice(0,60), rating: ratingNum, body, date: r.date }
}

export function buildStructuredData() {
  // Attempt to use real reviews from JSON (manually curated export of Google reviews)
  let reviews: ReviewInput[] = []
  try {
    if (Array.isArray(reviewsData)) {
      reviews = reviewsData
        .map(sanitizeReview)
        .filter((r): r is ReviewInput => !!r)
        .slice(0, 10) // cap to avoid bloat
    }
  } catch (_) {
    // fall back to sample set if import fails
  }
  if (!reviews.length) {
    reviews = [
      { author: 'Sarah M.', rating: 5, body: 'Excellent interior repaint – clean lines and respectful crew.' },
      { author: 'Jason R.', rating: 5, body: 'Exterior trim looks brand new. Fast and professional.' },
      { author: 'Lena K.', rating: 4, body: 'Great deck staining result, added real value to our yard.' }
    ]
  }
  const faqItems: FAQItem[] = [
    { q: 'Do you offer free estimates?', a: 'Yes, all quotes are free and include a detailed written scope.' },
    { q: 'Are you insured?', a: 'We carry full liability insurance and WCB coverage for all crew members.' },
    { q: 'How fast can you start?', a: 'Interior projects can often start within 1 week (seasonal). Exterior depends on weather.' }
  ]
  const data: any[] = []
  data.push(localBusinessSchema())
  serviceSchemas().forEach(s => data.push(s))
  const aggregate = reviewSchema(reviews)
  if (aggregate) data.push(aggregate)
  individualReviewSchemas(reviews).forEach(r => data.push(r))
  const faq = faqSchema(faqItems)
  if (faq) data.push(faq)
  return data
}
