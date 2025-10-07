import type React from "react"
import type { Metadata } from "next"
import { Playfair_Display, Source_Sans_3 } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
// Attempt to load user business profile if created
// Attempt to load example profile; if missing, fallback inline
let defaultProfile: any = {
  name: 'Wildrose Painters'
}
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  // @ts-ignore
  defaultProfile = require('../config/business-profile.example').businessProfile || defaultProfile
} catch {}
import { buildStructuredData } from "@/lib/structured-data"
import HydrationProbe from "@/components/HydrationProbe"

// In real usage user can copy example to business-profile.ts and we can prefer that.
let businessProfile = defaultProfile
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  // @ts-ignore - optional module
  const custom = require('../config/business-profile').businessProfile
  if (custom) businessProfile = custom
} catch (e) {
  // fallback to example
}

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
  display: "swap",
  weight: ["400", "700"],
})

const sourceSansPro = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans-pro",
  display: "swap",
  weight: ["400", "600"],
})

export const metadata: Metadata = {
  title: "Edmonton Painters | Wildrose Painters | Interior • Exterior • Deck & Fence",
  description: "Edmonton residential & exterior painting specialists. Fast quotes, winter interior promotion, insured & quality workmanship. Deck, fence, interior, staining.",
  applicationName: 'Wildrose Painters',
  keywords: [
    'Edmonton painters', 'residential painting Edmonton', 'deck staining Edmonton', 'fence painting Edmonton', 'interior painters Edmonton', 'exterior painting Edmonton', 'house painting Edmonton'
  ],
  openGraph: {
    title: 'Edmonton Painters | Wildrose Painters',
    description: 'Trusted local Edmonton painting company. Interior, exterior, deck & fence. Fast quotes – book your winter interior savings now.',
    url: 'https://www.wildrosepainters.ca',
    siteName: 'Wildrose Painters',
    locale: 'en_CA',
    type: 'website',
    images: [
      {
        url: '/wildrose-painters-logo.png',
        width: 600,
        height: 600,
        alt: 'Wildrose Painters Logo'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Edmonton Painters | Wildrose Painters',
    description: 'Interior & exterior painting specialists in Edmonton. Trusted, insured, fast quotes.',
    images: ['/wildrose-painters-logo.png']
  },
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/wildrose-painters-logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/wildrose-painters-logo.png', sizes: '16x16', type: 'image/png' }
    ],
    apple: { url: '/wildrose-painters-logo.png', sizes: '180x180', type: 'image/png' },
    shortcut: '/wildrose-painters-logo.png'
  },
  alternates: {
    canonical: 'https://www.wildrosepainters.ca'
  },
  category: 'home-improvement'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Dev debug: log server node version once per request in dev (helps confirm Node 20 usage)
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('[RootLayout] process.version', process.version)
  }
  return (
    <html lang="en" className={`${playfairDisplay.variable} ${sourceSansPro.variable}`}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          {process.env.NODE_ENV === 'development' && <HydrationProbe />}
          <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(buildStructuredData())
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
