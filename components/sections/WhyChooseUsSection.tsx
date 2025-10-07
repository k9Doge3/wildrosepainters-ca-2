"use client"
import { AnimatedSection } from "./AnimatedSection"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function WhyChooseUsSection({ onCta }: { onCta?: () => void }) {
  return (
    <AnimatedSection id="standout" className="py-20 md:py-28 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold font-serif mb-4">Why Customers Love Us</h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Edmonton's trusted painting professionals with proven results
          </p>
        </div>
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-6 text-center md:text-left">Why Customers Choose Us</h3>
              <div className="space-y-4">
                {[
                  ["Only Sherwin Williams & Dulux", "Long-lasting, professional finish"],
                  ["15% off interior painting", "Book by Dec 31, 2025"],
                  ["24h free quotes", "No hidden costs"],
                  ["Edmonton locals only", "Knows your area's needs"],
                ].map(([title, subtitle]) => (
                  <div className="flex items-start gap-3" key={title}>
                    <CheckCircle2 className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">{title}</span>
                      <p className="text-gray-600">{subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="text-center">
                <div className="text-6xl mb-4">⭐</div>
                <blockquote className="text-lg italic text-gray-700 mb-4">
                  "We transformed our 3000 sq ft home in 3 days without rushing the quality."
                </blockquote>
                <cite className="text-sm font-semibold text-gray-600">– Sarah K., Edmonton</cite>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-primary to-primary/90 rounded-2xl p-10 md:p-12 text-white">
            <h3 className="text-3xl font-bold font-serif mb-4">Winter Interior Special!</h3>
            <p className="text-xl mb-6 max-w-2xl mx-auto leading-relaxed">
              Beat the winter rush and save 15% on interior painting. Book now for priority scheduling before the holiday season.
            </p>
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 text-lg px-10 py-6 shadow-xl"
              onClick={onCta}
            >
              Claim Your 15% Discount
            </Button>
          </div>
        </div>
      </div>
    </AnimatedSection>
  )
}
