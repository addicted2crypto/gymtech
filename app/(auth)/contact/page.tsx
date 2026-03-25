'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, MessageSquare, Mail, Phone, Building2 } from 'lucide-react';

const INQUIRY_TYPES = [
  { value: 'general', label: 'General Question' },
  { value: 'pricing', label: 'Pricing Info' },
  { value: 'demo', label: 'Request a Demo' },
  { value: 'support', label: 'Support' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'enterprise', label: 'Enterprise Inquiry' },
];

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [inquiryType, setInquiryType] = useState('general');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          business_name: businessName || undefined,
          inquiry_type: inquiryType,
          message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        setIsLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Message Sent!</h2>
        <p className="text-gray-400 mb-6">
          Thanks for reaching out. We&apos;ll get back to you within 24 hours.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-block bg-linear-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/25"
          >
            Back to Home
          </Link>
          <Link
            href="/signup"
            className="inline-block border border-white/20 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/5 transition-all"
          >
            Start Free Trial
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-lg w-full">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-orange-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-7 h-7 text-orange-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">Get in Touch</h1>
        <p className="text-gray-400 mt-2">
          Have questions about GymTech? We&apos;d love to hear from you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              <span className="flex items-center gap-1.5">Name <span className="text-orange-400">*</span></span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={200}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              placeholder="Your name"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              <span className="flex items-center gap-1.5">Email <span className="text-orange-400">*</span></span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={320}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              placeholder="you@example.com"
            />
          </div>
        </div>

        {/* Phone & Business */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
              <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={30}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              placeholder="(optional)"
            />
          </div>
          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-gray-300 mb-2">
              <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Gym / Business</span>
            </label>
            <input
              id="businessName"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              maxLength={200}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              placeholder="(optional)"
            />
          </div>
        </div>

        {/* Inquiry Type */}
        <div>
          <label htmlFor="inquiryType" className="block text-sm font-medium text-gray-300 mb-2">
            <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> What can we help with?</span>
          </label>
          <select
            id="inquiryType"
            value={inquiryType}
            onChange={(e) => setInquiryType(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
          >
            {INQUIRY_TYPES.map((type) => (
              <option key={type.value} value={type.value} className="bg-[#1a1a2e] text-white">
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
            <span className="flex items-center gap-1.5">Message <span className="text-orange-400">*</span></span>
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            maxLength={5000}
            rows={4}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none"
            placeholder="Tell us about your gym and what you're looking for..."
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-linear-to-r from-orange-500 to-amber-500 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? 'Sending...' : (
            <>
              Send Message
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      <p className="mt-4 text-xs text-gray-500 text-center">
        We typically respond within 24 hours.
      </p>

      <div className="mt-6 text-center text-sm text-gray-400">
        Ready to get started?{' '}
        <Link href="/signup" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
          Start your free trial
        </Link>
      </div>
    </div>
  );
}
