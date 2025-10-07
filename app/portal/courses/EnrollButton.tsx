"use client"
import { Button } from '@/components/ui/button'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

export function EnrollButton({ courseId }: { courseId: string }) {
  const [pending, start] = useTransition()
  const router = useRouter()
  return (
    <Button size="sm" disabled={pending} onClick={() => {
      start(async () => {
        const res = await fetch(`/api/hrm/courses/${courseId}/enroll`, { method: 'POST' })
        if (res.ok) router.refresh()
      })
    }}>Enroll</Button>
  )
}
