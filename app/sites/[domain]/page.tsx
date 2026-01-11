'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Instagram,
  Facebook,
  ChevronRight,
  Star,
  Users,
  Zap,
} from 'lucide-react';

// This page renders the gym's public landing page
// Domain can be: "ironmma.gymtech.com" or "www.ironmma.com"

export default function GymLandingPage() {
  const params = useParams();
  const domain = params.domain as string;

  // In production, fetch gym data from Supabase based on domain
  // For now, demo data
  const gym = {
    name: 'Iron MMA Academy',
    tagline: 'Train Like a Champion',
    description: 'Premier mixed martial arts training in downtown. BJJ, Muay Thai, Wrestling, and MMA classes for all levels.',
    logo: null,
    heroImage: null,
    address: '123 Fight Street, Downtown',
    phone: '(555) 123-4567',
    email: 'info@ironmma.com',
    instagram: '@ironmma',
    facebook: 'ironmmaacademy',
    schedule: [
      { day: 'Monday', classes: ['6am BJJ Fundamentals', '12pm Open Mat', '6pm Muay Thai', '7:30pm MMA'] },
      { day: 'Tuesday', classes: ['6am Wrestling', '12pm BJJ', '6pm No-Gi', '7:30pm Striking'] },
      { day: 'Wednesday', classes: ['6am BJJ Fundamentals', '12pm Open Mat', '6pm Muay Thai', '7:30pm MMA'] },
      { day: 'Thursday', classes: ['6am Wrestling', '12pm BJJ', '6pm No-Gi', '7:30pm Striking'] },
      { day: 'Friday', classes: ['6am BJJ All Levels', '12pm Open Mat', '5pm Kids BJJ', '6pm Competition Training'] },
      { day: 'Saturday', classes: ['9am Open Mat', '10:30am Muay Thai', '12pm MMA Sparring'] },
      { day: 'Sunday', classes: ['10am Recovery Yoga', '11am Open Mat'] },
    ],
    plans: [
      { name: 'Drop-In', price: 25, interval: 'class', features: ['Single class access', 'Gear rental available'] },
      { name: 'Unlimited', price: 149, interval: 'month', features: ['Unlimited classes', 'Open mat access', 'Gear discounts', 'Free trial class for friends'], popular: true },
      { name: 'Annual', price: 1299, interval: 'year', features: ['Everything in Unlimited', '2 months free', 'Private lesson/month', 'Competition team access'] },
    ],
    testimonials: [
      { name: 'Mike R.', text: 'Best gym in the city. Coaches actually care about your progress.', rating: 5 },
      { name: 'Sarah K.', text: 'Started as a complete beginner. Now I compete!', rating: 5 },
      { name: 'James L.', text: 'The community here is like family.', rating: 5 },
    ],
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-linear-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center font-bold">
                {gym.name.charAt(0)}
              </div>
              <span className="font-bold text-lg">{gym.name}</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#schedule" className="text-gray-400 hover:text-white transition-colors">Schedule</a>
              <a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a>
              <a href="#about" className="text-gray-400 hover:text-white transition-colors">About</a>
              <a href="#contact" className="text-gray-400 hover:text-white transition-colors">Contact</a>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/sites/${domain}/member-login`}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Member Login
              </Link>
              <a
                href="#pricing"
                className="bg-linear-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-orange-600 hover:to-amber-600 transition-all"
              >
                Join Now
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        <div className="absolute inset-0 bg-linear-to-br from-orange-500/10 via-transparent to-amber-500/10" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl sm:text-7xl font-black mb-6">
            {gym.tagline}
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            {gym.description}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#pricing"
              className="bg-linear-to-r from-orange-500 to-amber-500 text-white px-8 py-4 rounded-xl text-lg font-bold hover:from-orange-600 hover:to-amber-600 transition-all shadow-xl shadow-orange-500/25"
            >
              Start Free Trial
            </a>
            <a
              href="#schedule"
              className="border border-white/20 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/5 transition-all"
            >
              View Schedule
            </a>
          </div>
        </div>
      </section>

      {/* Schedule Section */}
      <section id="schedule" className="py-24 bg-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">Class Schedule</h2>
            <p className="text-gray-400">Find the perfect class for your level</p>
          </div>

          <div className="grid md:grid-cols-7 gap-2">
            {gym.schedule.map((day) => (
              <div key={day.day} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="font-bold text-center mb-3 text-orange-400">{day.day}</h3>
                <div className="space-y-2">
                  {day.classes.map((cls, i) => (
                    <div key={i} className="text-sm text-gray-300 bg-white/5 rounded-lg p-2 text-center">
                      {cls}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">Membership Plans</h2>
            <p className="text-gray-400">No contracts. Cancel anytime.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {gym.plans.map((plan) => (
              <div
                key={plan.name}
                className={`bg-white/5 border rounded-2xl p-6 ${
                  plan.popular
                    ? 'border-orange-500/50 ring-2 ring-orange-500/20 scale-105'
                    : 'border-white/10'
                }`}
              >
                {plan.popular && (
                  <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                )}
                <h3 className="text-2xl font-bold mt-4">{plan.name}</h3>
                <div className="my-4">
                  <span className="text-4xl font-black">${plan.price}</span>
                  <span className="text-gray-400">/{plan.interval}</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-300">
                      <ChevronRight className="w-4 h-4 text-orange-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    plan.popular
                      ? 'bg-linear-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600'
                      : 'border border-white/20 text-white hover:bg-white/5'
                  }`}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">What Our Members Say</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {gym.testimonials.map((testimonial, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4">&quot;{testimonial.text}&quot;</p>
                <p className="font-semibold text-white">— {testimonial.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">Visit Us</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Address</p>
                  <p className="text-white">{gym.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <Phone className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Phone</p>
                  <p className="text-white">{gym.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <Mail className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Email</p>
                  <p className="text-white">{gym.email}</p>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <a href="#" className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-colors">
                  <Instagram className="w-6 h-6" />
                </a>
                <a href="#" className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-colors">
                  <Facebook className="w-6 h-6" />
                </a>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="font-bold mb-4">Send us a message</h3>
              <form className="space-y-4">
                <input
                  type="text"
                  placeholder="Your name"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                />
                <input
                  type="email"
                  placeholder="Your email"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                />
                <textarea
                  placeholder="Your message"
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 resize-none"
                />
                <button
                  type="submit"
                  className="w-full bg-linear-to-r from-orange-500 to-amber-500 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 transition-all"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer with "Powered by" */}
      <footer className="py-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} {gym.name}. All rights reserved.
            </p>
            <a
              href="https://gymtech.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-500 hover:text-gray-400 transition-colors text-sm"
            >
              <Zap className="w-4 h-4" />
              Powered by GymTech
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
