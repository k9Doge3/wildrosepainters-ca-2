"use client"
import { motion } from "framer-motion"
import { useRef } from "react"
import { useInView } from "framer-motion"
import type { PropsWithChildren } from "react"

const fadeInVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8 }
  }
}

export function AnimatedSection({ id, className, children }: PropsWithChildren<{ id: string; className?: string }>) {
  const ref = useRef<HTMLElement | null>(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })
  return (
    <motion.section
      id={id}
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={fadeInVariants}
      className={className}
    >
      {children}
    </motion.section>
  )
}
