"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { MenuIcon, Phone, Mail, Award, Sparkles, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AnimatedSection } from "@/components/sections/AnimatedSection";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { WhyChooseUsSection } from "@/components/sections/WhyChooseUsSection";
import { TestimonialsSection } from "@/components/sections/Testimonials";
import { QuoteForm } from "@/components/lead/QuoteForm";
import { motion } from "framer-motion";

const sections = [
  { id: "home", name: "Home" },
  { id: "winter-deal", name: "Winter Special" },
  { id: "services", name: "Services" },
  { id: "about", name: "About Us" },
  { id: "standout", name: "Why Choose Us" },
  { id: "testimonials", name: "Reviews" },
  { id: "contact", name: "Get Quote" },
];

export default function WildrosePaintersLandingPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  // Debug gating: when SECTION_DEBUG is set (comma list or 'one-by-one'), we only render listed sections.
  // e.g. SECTION_DEBUG="hero" or "hero,winter". If not set, render all.
  const debug = (process.env.NEXT_PUBLIC_SECTION_DEBUG || '').toLowerCase();
  const activeList = debug.split(/[,\s]+/).filter(Boolean);
  const gate = (key: string) => {
    if (!debug) return true; // no gating
    // Provide some alias mapping
    const map: Record<string,string[]> = {
      hero: ['home','hero'],
      winter: ['winter','winter-deal'],
      services: ['services'],
      about: ['about'],
      why: ['standout','why'],
      testimonials: ['testimonials','reviews'],
      contact: ['contact','quote']
    };
    // If any alias group appears in list
    return activeList.some(token => {
      if (token === key) return true;
      const aliases = map[token] || [];
      return aliases.includes(key);
    });
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background text-foreground">
      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 inset-x-0 z-50 flex lg:hidden justify-between gap-2 px-4 py-3 bg-white/95 backdrop-blur-md border-t border-muted shadow-lg">
        <Button
          onClick={() => scrollToSection("contact")}
          className="flex-1 bg-secondary hover:bg-secondary/90 text-white font-semibold"
          size="lg"
        >
          Get Free Quote
        </Button>
        <Button asChild variant="outline" size="lg" className="flex-1 font-semibold">
          <a href="tel:+15875016994" aria-label="Call Wildrose Painters">Call Us</a>
        </Button>
      </div>

      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-md shadow-sm px-4 lg:px-8 h-20 flex items-center justify-between border-b border-muted">
        <Link
          href="#"
          className="flex items-center gap-3 font-serif text-xl md:text-2xl font-bold text-primary hover:opacity-80 transition-opacity"
          onClick={() => scrollToSection("home")}
        >
          <Image src="/logo.jpg" alt="Wildrose Painters Logo" width={64} height={64} className="h-16 w-16 object-contain rounded-full" />
          <span className="hidden sm:inline">WILDROSE PAINTERS</span>
        </Link>
        <nav className="hidden lg:flex gap-8 items-center">
          {sections.map((s) => (
            <Link
              key={s.id}
              href={`#${s.id}`}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(s.id);
              }}
              className="text-base font-medium hover:text-secondary transition-colors relative group"
            >
              {s.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full" />
            </Link>
          ))}
          <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-white shadow-md hover:shadow-lg transition-all" onClick={() => scrollToSection("contact")}>Get Free Quote</Button>
        </nav>
        <div className="lg:hidden">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <MenuIcon className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-white w-[300px]">
              <div className="flex flex-col gap-6 py-8">
                {sections.map((s) => (
                  <Link
                    key={s.id}
                    href={`#${s.id}`}
                    className="text-xl font-medium hover:text-secondary transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(s.id);
                      setIsSheetOpen(false);
                    }}
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1 pt-20">
        {/* Hero */}
        <SectionErrorBoundary label="Hero">
        {gate('home') && (
        <AnimatedSection id="home" className="relative w-full bg-gradient-to-br from-primary via-primary/95 to-primary/90 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 w-72 h-72 bg-secondary rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent rounded-full blur-3xl" />
          </div>
          <div className="container mx-auto px-4 md:px-6 py-16 md:py-24 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="space-y-6">
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-white leading-tight">Edmonton's Trusted Professional Painters</h1>
                <p className="text-lg md:text-xl text-white/90 max-w-xl">Interior & exterior painting done right: premium materials, clean workmanship, honest pricing. Get a fast, no-pressure quote today.</p>
                <div className="flex flex-wrap gap-4">
                  <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-white" onClick={() => scrollToSection('contact')}>Get Free Quote</Button>
                  <Button size="lg" variant="outline" asChild>
                    <a href="tel:+15875016994">Call (587) 501-6994</a>
                  </Button>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.15 }}>
                <Card className="bg-white p-8 md:p-10 rounded-2xl shadow-2xl border-0">
                  <div className="mb-6 flex justify-center">
                    <Image src="/logo.jpg" alt="Wildrose Painters" width={140} height={140} className="w-32 h-32 object-cover rounded-full shadow-lg mb-4" />
                  </div>
                  <QuoteForm variant="quick" />
                </Card>
              </motion.div>
            </div>
          </div>
  </AnimatedSection>
  )}
  </SectionErrorBoundary>

        {/* Winter Special */}
        <SectionErrorBoundary label="Winter Special">
        {gate('winter-deal') && (
        <AnimatedSection id="winter-deal" className="py-16 md:py-20 bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 border-y border-orange-200">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-4xl mx-auto">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }} className="mb-8">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-2 rounded-full text-sm font-medium mb-6"><Sparkles className="h-4 w-4" />LIMITED TIME OFFER</div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif mb-6 bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent">Winter is Coming Special!</h2>
                <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed">Beat the cold season rush! Get your interior painting done now and save big.</p>
              </motion.div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                <Card className="p-6 bg-white/80 backdrop-blur-sm border-2 border-orange-200 hover:border-orange-300 transition-all hover:shadow-lg">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-2xl font-bold text-white">15%</span></div>
                    <h3 className="text-xl font-bold mb-2 text-gray-800">Interior Painting</h3>
                    <p className="text-gray-600">Save 15% on all interior painting projects booked before December 31st, 2025</p>
                  </div>
                </Card>
                <Card className="p-6 bg-white/80 backdrop-blur-sm border-2 border-amber-200 hover:border-amber-300 transition-all hover:shadow-lg">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4"><Clock className="h-8 w-8 text-white" /></div>
                    <h3 className="text-xl font-bold mb-2 text-gray-800">Fast Scheduling</h3>
                    <p className="text-gray-600">Book now for priority scheduling before the holiday season</p>
                  </div>
                </Card>
                <Card className="p-6 bg-white/80 backdrop-blur-sm border-2 border-yellow-200 hover:border-yellow-300 transition-all hover:shadow-lg md:col-span-2 lg:col-span-1">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4"><Award className="h-8 w-8 text-white" /></div>
                    <h3 className="text-xl font-bold mb-2 text-gray-800">Quality Guarantee</h3>
                    <p className="text-gray-600">Premium Sherwin Williams & Dulux paints with extended warranty</p>
                  </div>
                </Card>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border-2 border-orange-300 shadow-xl">
                <h3 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800">🍂 Perfect Time for Interior Projects!</h3>
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">Fall and winter are ideal for interior painting - avoid the spring rush, enjoy comfortable indoor work conditions, and get your home refreshed before the holidays.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button size="lg" className="px-8 py-6 text-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-xl hover:shadow-2xl transition-all" onClick={() => scrollToSection("contact")}><Sparkles className="mr-2 h-5 w-5" />Claim Your 15% Discount</Button>
                  <Button size="lg" variant="outline" className="px-8 py-6 text-lg border-2 border-orange-500 text-orange-600 hover:bg-orange-50" asChild>
                    <a href="tel:5875016994"><Phone className="mr-2 h-5 w-5" />Call (587) 501-6994</a>
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-4">*Offer valid until December 31st, 2025. Minimum project value applies.</p>
              </div>
            </div>
          </div>
  </AnimatedSection>
  )}
  </SectionErrorBoundary>

  <SectionErrorBoundary label="Services">{gate('services') && <ServicesSection />}</SectionErrorBoundary>
  <SectionErrorBoundary label="About">{gate('about') && <AboutSection />}</SectionErrorBoundary>
  <SectionErrorBoundary label="Why Choose Us">{gate('standout') && <WhyChooseUsSection onCta={() => scrollToSection("contact")} />}</SectionErrorBoundary>
  <SectionErrorBoundary label="Testimonials">{gate('testimonials') && <TestimonialsSection />}</SectionErrorBoundary>

        {/* Contact */}
        <SectionErrorBoundary label="Contact">
        {gate('contact') && (
        <AnimatedSection id="contact" className="py-20 md:py-28 bg-muted">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold font-serif mb-4">Get Your Free Quote in 24 Hours</h2>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">Ready to transform your home? Contact Edmonton's trusted painting professionals for competitive pricing and quality results.</p>
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mt-4"><CheckCircle2 className="h-4 w-4" />No hidden costs • 15% off interior painting until Dec 31, 2025</div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="flex justify-center lg:justify-start">
                    <Image src="/logo.jpg" alt="Wildrose Painters" width={200} height={200} className="w-48 h-48 object-cover rounded-full shadow-xl" />
                  </div>
                  <Card className="bg-white p-6 rounded-xl shadow-lg border-2 border-secondary/20">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0"><Phone className="h-7 w-7 text-secondary" /></div>
                      <div>
                        <h3 className="text-lg font-bold font-serif mb-1">Call or Text Us</h3>
                        <a href="tel:5875016994" className="text-2xl text-secondary hover:underline font-bold">(587) 501-6994</a>
                      </div>
                    </div>
                  </Card>
                  <Card className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0"><Mail className="h-7 w-7 text-secondary" /></div>
                      <div>
                        <h3 className="text-lg font-bold font-serif mb-1">Visit Our Website</h3>
                        <a href="https://www.wildrosepainters.ca" target="_blank" rel="noopener noreferrer" className="text-xl text-secondary hover:underline font-semibold">www.wildrosepainters.ca</a>
                      </div>
                    </div>
                  </Card>
                  <div className="bg-gradient-to-br from-primary to-primary/90 rounded-xl p-6 text-white">
                    <h3 className="text-xl font-bold font-serif mb-3">Service Area</h3>
                    <p className="text-lg">Proudly serving the Greater Edmonton Area and surrounding communities</p>
                  </div>
                </div>
                <Card className="bg-white p-8 md:p-10 rounded-2xl shadow-xl border-0">
                  <QuoteForm variant="enhanced" />
                </Card>
              </div>
            </div>
          </div>
  </AnimatedSection>
  )}
  </SectionErrorBoundary>
      </main>

      <footer className="py-12 bg-primary text-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-3 mb-6">
              <Image src="/logo.jpg" alt="Wildrose Painters Logo" width={56} height={56} className="h-14 w-14 object-contain rounded-full" />
              <div>
                <p className="font-serif text-2xl font-bold">Wildrose Painters</p>
                <p className="text-sm text-white/80">Est. {new Date().getFullYear()}</p>
              </div>
            </div>
            <p className="mb-6 text-white/90">Quality & Budget-Friendly Painting Services</p>
            <div className="flex flex-wrap justify-center gap-6 mb-6">
              <a href="tel:5875016994" className="hover:text-secondary transition-colors">(587) 501-6994</a>
              <a href="https://www.wildrosepainters.ca" target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors">www.wildrosepainters.ca</a>
            </div>
            <p className="text-sm text-white/70">&copy; {new Date().getFullYear()} Wildrose Painters. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
