import { NextResponse, type NextRequest } from 'next/server'

// Build a CSP string with optional runtime additions.
function buildCSP() {
  const extraConnect = process.env.CSP_EXTRA_CONNECT?.trim()
  // Base directives (lean, can be extended later for SSE or analytics endpoints)
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    'style-src': ["'self'", 'https:', "'unsafe-inline'"], // Tailwind JIT sometimes injects inline in dev
    'img-src': ["'self'", 'data:', 'blob:', 'https:'],
    'font-src': ["'self'", 'https:', 'data:'],
    'connect-src': ["'self'", 'https:'],
    'frame-src': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': [],
  }
  if (extraConnect) {
    extraConnect.split(',').map(s => s.trim()).filter(Boolean).forEach(v => directives['connect-src'].push(v))
  }
  return Object.entries(directives)
    .map(([k, vals]) => (vals.length ? `${k} ${vals.join(' ')}` : k))
    .join('; ')
}

export function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Skip CSP on Next.js internal asset optimizations if desired (already covered by matcher but double guard)
  const urlPath = req.nextUrl.pathname
  const isAsset = urlPath.startsWith('/_next/')

  const csp = buildCSP()
  const reportOnly = process.env.CSP_REPORT_ONLY === '1'
  if (!isAsset) {
    if (reportOnly) {
      res.headers.set('Content-Security-Policy-Report-Only', csp)
    } else {
      res.headers.set('Content-Security-Policy', csp)
    }
  }

  // Standard security headers
  if (process.env.NODE_ENV === 'production') {
    res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), interest-cohort=()')
  res.headers.set('X-DNS-Prefetch-Control', 'off')
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  res.headers.set('Cross-Origin-Resource-Policy', 'same-origin')
  res.headers.set('X-Permitted-Cross-Domain-Policies', 'none')

  return res
}

export const config = {
  matcher: [
    // Apply to all app routes except static & public assets
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|assets/).*)'
  ]
}

// NOTE:
// For upcoming SSE endpoint, ensure its path matches the middleware and if additional domains are needed
// (e.g., a self-hosted tunnel), append them via CSP_EXTRA_CONNECT env var.
