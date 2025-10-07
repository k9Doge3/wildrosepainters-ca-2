"use client"
import { AnimatedSection } from "./AnimatedSection"
import Image from "next/image"

export function AboutSection() {
  return (
    <AnimatedSection id="about" className="py-20 md:py-28 bg-muted">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold font-serif mb-6">About Wildrose Painters</h2>
            <div className="flex justify-center mb-8">
              <Image
                src="/logo.jpg"
                alt="Wildrose Painters Logo"
                width={240}
                height={240}
                className="w-56 h-56 object-cover rounded-full shadow-xl"
              />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-xl">
            <div className="space-y-6 text-lg leading-relaxed">
              <p className="text-xl font-semibold text-center text-primary">
                Established in 2020, Wildrose Painters has been serving the Greater Edmonton Area with quality painting services.
              </p>
              <p>
                We're a locally-owned painting company dedicated to transforming homes and businesses with professional craftsmanship. Our mission is simple: deliver exceptional quality at competitive prices that fit your budget.
              </p>
              <p>
                Whether you need your fence refreshed, your deck protected, or your interior spaces renovated, we bring the same level of attention to detail and commitment to excellence to every project. We believe quality painting shouldn't break the bank, which is why we offer budget-friendly solutions without compromising on results.
              </p>
              <p className="font-semibold text-center text-secondary text-xl pt-4">
                Quality is of our utmost importance. Every brush stroke matters.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  )
}
