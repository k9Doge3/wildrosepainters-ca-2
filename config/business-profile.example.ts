// Business Profile Configuration Example
// Copy this file to `config/business-profile.ts` and fill in real values.
// This structure is reusable for any local service business.

export interface Testimonial {
  quote: string
  author: string
  location?: string
  rating?: number
}

export interface BusinessProfile {
  name: string
  internalBrandKey?: string // short machine key for multi-business routing/logging
  legalName?: string
  description?: string // Short business profile description (Google Business Profile)
  longDescription?: string // Extended version if needed elsewhere (web About section)
  phone: string
  email: string
  address: {
    street?: string
    city: string
    region: string
    postalCode?: string
    country: string
  }
  founded?: string | number
  yearsInBusinessApprox?: number
  licensedInsuredBonded?: string
  warranty?: string
  services: string[]
  serviceAreas: string[]
  turnaroundMessaging?: string
  socialLinks?: { platform: string; url: string }[]
  certifications?: string[]
  rating?: { value: number; count: number }
  milestones?: string[]
  testimonials?: Testimonial[]
  promotion?: { label: string; details?: string; expires?: string }
  paymentTerms?: string
  hours?: { days: string; opens: string; closes: string }[]
  responseTimeMessaging?: string
  rushService?: string
  twoStepForm?: boolean
  leadLogging?: boolean
  rateLimiting?: boolean
  callTrackingPlaceholder?: boolean
  crm?: 'hubspot' | 'espo' | 'none'
  googleAds?: boolean
  metaPixel?: boolean
  heatmap?: boolean
}

export const businessProfile: BusinessProfile = {
  name: "Wildrose Painters",
  internalBrandKey: "wildrose",
  description: "Edmonton residential & exterior painting specialists providing interior, exterior, deck and fence painting with clean prep, quality finishes, and a 2-Year Workmanship Warranty.",
  longDescription: "Wildrose Painters is a locally-focused Edmonton painting company delivering professional interior, exterior, deck and fence finishes. We combine careful surface preparation, premium coatings, and clear communication to create durable, beautiful results. Serving homeowners across Edmonton, Sherwood Park, St. Albert, Spruce Grove, Leduc, Beaumont and surrounding communities, our team emphasizes protection of your space, tidy daily cleanup, and predictable timelines. Ask about our seasonal interior promotions and 2-Year Workmanship Warranty for lasting peace of mind.",
  phone: "+15875016994",
  email: "ky.group.solutions@gmail.com",
  address: {
    street: "TBD",
    city: "Edmonton",
    region: "AB",
    postalCode: "T6W 4C5",
    country: "CA",
  },
  founded: "2024",
  licensedInsuredBonded: "not yet (in progress)",
  warranty: "2-Year Workmanship Warranty",
  services: [
    "Interior Painting",
    "Exterior Painting",
    "Deck Staining",
    "Fence Painting"
  ],
  serviceAreas: [
    "Edmonton",
    "Sherwood Park",
    "St. Albert",
    "Spruce Grove",
    "Leduc",
    "Beaumont",
    "Fort Saskatchewan"
  ],
  turnaroundMessaging: "Most interior projects completed in 2–5 days",
  socialLinks: [
    { platform: "facebook", url: "https://www.facebook.com/wildrosepainters/" },
    { platform: "google", url: "https://g.page/r/CcX3J9mY5b8dEBM/review" }
  ],
  certifications: ["Sherwin-Williams Preferred (placeholder)"],
  rating: { value: 4.9, count: 57 },
  milestones: ["Experienced Painters with many succesful Local Projects Completed"],
  testimonials: [
    { quote: "They transformed our living room beautifully.", author: "Sarah", location: "Edmonton", rating: 5 },
    { quote: "Fast, clean, professional results.", author: "Mark", location: "Sherwood Park", rating: 5 },
  ],
  promotion: { label: "Winter Interior Painting 15% Off", details: "Limited time seasonal offer" },
  paymentTerms: "50% deposit, balance on completion",
  hours: [
    { days: "Mon-Fri", opens: "08:00", closes: "18:00" },
    { days: "Sat", opens: "09:00", closes: "18:00" }
  ],
  responseTimeMessaging: "We respond within 1 hour during business hours.",
  rushService: "Ask about accelerated scheduling for urgent projects.",
  twoStepForm: true,
  leadLogging: true,
  rateLimiting: true,
  callTrackingPlaceholder: false,
  crm: "hubspot",
  googleAds: false,
  metaPixel: false,
  heatmap: false,
}
