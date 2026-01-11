'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Zap } from 'lucide-react';

// Member login page for a specific gym
// This is where gym members log in to access their portal

export default function GymMemberLoginPage() {
  const params = useParams();
  const domain = params.domain as string;
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Demo gym data - in production, fetch from DB based on domain
  const gym = {
    name: 'Iron MMA Academy',
    logo: null,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login
    await new Promise(resolve => setTimeout(resolve, 1500));
    // In production: authenticate member, set session, redirect to /member
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Back to gym site */}
      <div className="p-4">
        <Link
          href={`/sites/${domain}`}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {gym.name}
        </Link>
      </div>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            {/* Gym Branding */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-linear-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                {gym.name.charAt(0)}
              </div>
              <h1 className="text-2xl font-bold text-white">{gym.name}</h1>
              <p className="text-gray-400 mt-1">Member Portal</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-gray-400">
                  <input type="checkbox" className="rounded bg-white/5 border-white/10" />
                  Remember me
                </label>
                <a href="#" className="text-orange-400 hover:text-orange-300">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-linear-to-r from-orange-500 to-amber-500 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 transition-all disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-500 text-sm">
                Not a member yet?{' '}
                <Link href={`/sites/${domain}#pricing`} className="text-orange-400 hover:text-orange-300">
                  Join today
                </Link>
              </p>
            </div>
          </div>

          {/* Powered by */}
          <div className="text-center mt-6">
            <a
              href="https://gymtech.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-500 transition-colors text-sm"
            >
              <Zap className="w-4 h-4" />
              Powered by GymTech
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
