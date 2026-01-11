'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createAuthClient, createClient } from '@/lib/supabase/client';
import { ArrowRight, Check } from 'lucide-react';

type SignupType = 'gym_owner' | 'member';

export default function SignupPage() {
  const [signupType, setSignupType] = useState<SignupType>('gym_owner');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gymName, setGymName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Use auth client for authentication (handles cookies properly)
    const authClient = createAuthClient();
    // Use typed client for database operations
    const dbClient = createClient();

    // Sign up the user
    const { data, error: signUpError } = await authClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: signupType,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
      return;
    }

    // If gym owner, create the gym
    if (signupType === 'gym_owner' && data.user) {
      const slug = gymName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      const { error: gymError } = await dbClient
        .from('gyms')
        .insert({ name: gymName, slug });

      if (gymError) {
        console.error('Error creating gym:', gymError);
      } else {
        // Update profile with gym_id
        const { data: gymData } = await dbClient
          .from('gyms')
          .select('id')
          .eq('slug', slug)
          .single();

        if (gymData) {
          await dbClient
            .from('profiles')
            .update({ gym_id: gymData.id, role: 'gym_owner' })
            .eq('id', data.user.id);
        }
      }
    }

    setSuccess(true);
    setIsLoading(false);
  };

  if (success) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
        <p className="text-gray-400 mb-6">
          We&apos;ve sent you a confirmation link. Please check your email to complete your registration.
        </p>
        <Link
          href="/login"
          className="inline-block bg-linear-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/25"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white">Create your account</h1>
        <p className="text-gray-400 mt-2">Start managing your gym today</p>
      </div>

      {/* Signup Type Toggle */}
      <div className="flex mb-6 bg-white/5 rounded-xl p-1 border border-white/10">
        <button
          type="button"
          onClick={() => setSignupType('gym_owner')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
            signupType === 'gym_owner'
              ? 'bg-linear-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Gym Owner
        </button>
        <button
          type="button"
          onClick={() => setSignupType('member')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
            signupType === 'member'
              ? 'bg-linear-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Member
        </button>
      </div>

      <form onSubmit={handleSignup} className="space-y-5">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        {signupType === 'gym_owner' && (
          <div>
            <label htmlFor="gymName" className="block text-sm font-medium text-gray-300 mb-2">
              Gym Name
            </label>
            <input
              id="gymName"
              type="text"
              value={gymName}
              onChange={(e) => setGymName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              placeholder="e.g., Iron Temple MMA"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
            placeholder="••••••••"
          />
          <p className="text-xs text-gray-500 mt-2">Minimum 8 characters</p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-linear-to-r from-orange-500 to-amber-500 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? 'Creating account...' : (
            <>
              Create Account
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      <p className="mt-4 text-xs text-gray-500 text-center">
        By signing up, you agree to our Terms of Service and Privacy Policy.
      </p>

      <div className="mt-6 text-center text-sm text-gray-400">
        Already have an account?{' '}
        <Link href="/login" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
          Sign in
        </Link>
      </div>
    </div>
  );
}
