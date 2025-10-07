import { NextRequest } from 'next/server'
import { getSession } from '@/lib/admin-auth'
import { leadEmitter } from '@/lib/realtime/emitter'
import { listStoredLeads } from '@/lib/logging/lead-logger'

export const runtime = 'nodejs' // ensure streaming works consistently

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return new Response('unauthorized', { status: 401 })
  }

  // Stream with cleanup tracking
  let heartbeatRef: any
  let unsubscribeRef: (() => void) | null = null
  const finalStream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: any) => {
        controller.enqueue(new TextEncoder().encode(`event: ${event}\n`))
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`))
      }
      const initial = await listStoredLeads(30)
      send('init', { leads: initial })
      unsubscribeRef = leadEmitter.subscribe(evt => {
        if (evt?.type === 'lead.new') send('lead', evt.data)
      })
      heartbeatRef = setInterval(() => {
        controller.enqueue(new TextEncoder().encode(`: hb ${Date.now()}\n\n`))
      }, 30000)
    },
    cancel() {
      if (heartbeatRef) clearInterval(heartbeatRef)
      if (unsubscribeRef) unsubscribeRef()
    }
  })

  return new Response(finalStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  })
}
