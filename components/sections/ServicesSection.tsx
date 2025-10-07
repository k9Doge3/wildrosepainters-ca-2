"use client"
import { AnimatedSection } from "./AnimatedSection"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import { Award } from "lucide-react"

// Temporary extraction of Services section; content copied from monolithic page.
export function ServicesSection() {
  const services = [
    {
      title: "Fence Painting & Staining",
      description:
        "Professional fence painting and staining services with summer discounts. Quality finishes that protect and beautify your outdoor space.",
      badge: "Summer Special",
      image: "/images/fence-staining.jpg",
    },
    {
      title: "Deck Staining & Sealing",
      description:
        "Expert deck staining and sealing to protect your outdoor living area. Special summer pricing on all deck projects.",
      badge: "Summer Special",
      image: "/images/deck-staining.jpg",
    },
    {
      title: "Interior Painting",
      description:
        "Transform your indoor spaces with professional interior painting. We can do renovating and decorating too!",
      badge: null as string | null,
      image: "/images/interior-painting.jpg",
    },
  ]
  return (
    <AnimatedSection id="services" className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold font-serif mb-4">Our Painting Services</h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Professional painting services for Edmonton homes. Year-round quality with seasonal specials - get competitive pricing with exceptional results.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {services.map((service, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -8, boxShadow: "0px 20px 40px rgba(0,0,0,0.12)" }}
              className="transition-all duration-300"
            >
              <Card className="bg-card p-0 rounded-xl shadow-lg h-full border-2 border-muted hover:border-secondary/30 relative overflow-hidden">
                {service.badge && (
                  <div className="absolute top-4 right-4 bg-secondary text-white px-4 py-1 rounded-full text-sm font-bold z-10">
                    {service.badge}
                  </div>
                )}
                <div className="relative w-full h-64 overflow-hidden">
                  <Image
                    src={service.image || "/placeholder.svg"}
                    alt={service.title}
                    fill
                    className="object-cover hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold font-serif mb-4 text-center">{service.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-center">{service.description}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
        <div className="bg-gradient-to-r from-secondary/10 via-accent/10 to-secondary/10 rounded-2xl p-10 md:p-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Award className="h-10 w-10 text-secondary" />
            <h3 className="text-3xl font-bold font-serif">Premium Paint Products</h3>
          </div>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            We use only the best quality paint products from trusted brands like <span className="font-bold text-foreground">Sherwin Williams</span> and <span className="font-bold text-foreground">Dulux</span> to ensure lasting, beautiful results for every project.
          </p>
        </div>
      </div>
    </AnimatedSection>
  )
}
