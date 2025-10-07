// Centralized environment variable validation and access.
// If you prefer Zod, install it and replace the simple checks below.

type RequiredEnvKeys =
  | 'SMTP_EMAIL'
  | 'SMTP_PASSWORD'
  | 'CONTACT_FORM_TO'
  | 'COMPANY_NAME'
  | 'COMPANY_PHONE'
  | 'COMPANY_DOMAIN'

const REQUIRED_KEYS: RequiredEnvKeys[] = [
  'SMTP_EMAIL',
  'SMTP_PASSWORD',
  'CONTACT_FORM_TO',
  'COMPANY_NAME',
  'COMPANY_PHONE',
  'COMPANY_DOMAIN',
]

interface EnvShape {
  SMTP_EMAIL: string
  SMTP_PASSWORD: string
  CONTACT_FORM_TO: string
  COMPANY_NAME: string
  COMPANY_PHONE: string
  COMPANY_DOMAIN: string
}

let cached: EnvShape | null = null
let warned = false

function validate(): EnvShape {
  if (cached) return cached

  const missing: string[] = []
  const values: Partial<EnvShape> = {}

  for (const key of REQUIRED_KEYS) {
    const raw = process.env[key]
    if (!raw || raw.trim() === '') {
      missing.push(key)
    } else {
      // Basic normalization for phone (remove spaces)
      values[key as keyof EnvShape] = key === 'COMPANY_PHONE' ? raw.trim() : raw
    }
  }

  if (missing.length && !warned) {
    console.warn('[env] Missing required environment variables:', missing.join(', '))
    warned = true
  }

  cached = values as EnvShape
  return cached
}

export const env = validate()

export function envStatus() {
  return REQUIRED_KEYS.map((k) => ({
    key: k,
    set: Boolean(process.env[k] && process.env[k]!.trim() !== ''),
  }))
}

export function assertAllEnvPresent() {
  const missing = envStatus().filter((e) => !e.set).map((e) => e.key)
  if (missing.length) {
    throw new Error('Missing required env vars: ' + missing.join(', '))
  }
}
