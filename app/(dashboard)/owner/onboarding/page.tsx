'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { createClient } from '@/lib/supabase/client';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Clock,
  Palette,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Upload,
  Loader2,
} from 'lucide-react';

type OnboardingStep = 'basics' | 'contact' | 'hours' | 'complete';

interface GymData {
  name: string;
  description: string;
  logo_url: string | null;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  opening_time: string;
  closing_time: string;
  timezone: string;
}

const STEPS: { id: OnboardingStep; label: string; icon: React.ElementType }[] = [
  { id: 'basics', label: 'Basic Info', icon: Building2 },
  { id: 'contact', label: 'Contact', icon: Mail },
  { id: 'hours', label: 'Hours', icon: Clock },
  { id: 'complete', label: 'Complete', icon: CheckCircle2 },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { getEffectiveGymId, gym } = useAuthStore();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('basics');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [gymData, setGymData] = useState<GymData>({
    name: '',
    description: '',
    logo_url: null,
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    opening_time: '06:00',
    closing_time: '22:00',
    timezone: 'America/New_York',
  });

  // Load existing gym data
  useEffect(() => {
    const loadGymData = async () => {
      const gymId = getEffectiveGymId();
      if (!gymId) {
        setIsLoading(false);
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from('gyms')
        .select('*')
        .eq('id', gymId)
        .single();

      if (!error && data) {
        setGymData({
          name: data.name || '',
          description: data.description || '',
          logo_url: data.logo_url || null,
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          zip_code: data.zip_code || '',
          opening_time: data.opening_time || '06:00',
          closing_time: data.closing_time || '22:00',
          timezone: data.timezone || 'America/New_York',
        });
      }

      setIsLoading(false);
    };

    loadGymData();
  }, [getEffectiveGymId]);

  const handleSaveStep = async () => {
    const gymId = getEffectiveGymId();
    if (!gymId) return;

    setIsSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('gyms')
      .update({
        name: gymData.name,
        description: gymData.description,
        logo_url: gymData.logo_url,
        email: gymData.email,
        phone: gymData.phone,
        address: gymData.address,
        city: gymData.city,
        state: gymData.state,
        zip_code: gymData.zip_code,
        opening_time: gymData.opening_time,
        closing_time: gymData.closing_time,
        timezone: gymData.timezone,
      })
      .eq('id', gymId);

    setIsSaving(false);

    if (error) {
      console.error('Failed to save:', error);
      alert('Failed to save. Please try again.');
      return false;
    }

    return true;
  };

  const handleNext = async () => {
    const saved = await handleSaveStep();
    if (!saved) return;

    const stepOrder: OnboardingStep[] = ['basics', 'contact', 'hours', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const stepOrder: OnboardingStep[] = ['basics', 'contact', 'hours', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleComplete = async () => {
    await handleSaveStep();
    router.push('/owner');
  };

  const handleSkip = () => {
    router.push('/owner');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">Set Up Your Gym</h1>
        <p className="text-gray-400 mt-2">
          Complete these steps to get your gym ready for members
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((step, index) => {
          const isActive = step.id === currentStep;
          const isPast = STEPS.findIndex(s => s.id === currentStep) > index;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  isActive
                    ? 'bg-orange-500 text-white'
                    : isPast
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-white/5 text-gray-500'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
              </div>
              {index < STEPS.length - 1 && (
                <ArrowRight className="w-4 h-4 text-gray-600 mx-2" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
        {currentStep === 'basics' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Basic Information</h2>
              <p className="text-gray-400 text-sm">Tell us about your gym</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Gym Name *
                </label>
                <input
                  type="text"
                  value={gymData.name}
                  onChange={(e) => setGymData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Iron Temple MMA"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={gymData.description}
                  onChange={(e) => setGymData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="A brief description of your gym..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Logo
                </label>
                <div className="flex items-center gap-4">
                  {gymData.logo_url ? (
                    <img
                      src={gymData.logo_url}
                      alt="Gym logo"
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-gray-500" />
                    </div>
                  )}
                  <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 transition-colors">
                    <Upload className="w-4 h-4" />
                    Upload Logo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'contact' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Contact Information</h2>
              <p className="text-gray-400 text-sm">How can members reach you?</p>
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="email"
                      value={gymData.email}
                      onChange={(e) => setGymData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="info@yourgym.com"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="tel"
                      value={gymData.phone}
                      onChange={(e) => setGymData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(555) 123-4567"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Street Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={gymData.address}
                    onChange={(e) => setGymData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Main Street"
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={gymData.city}
                    onChange={(e) => setGymData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="New York"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={gymData.state}
                    onChange={(e) => setGymData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="NY"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={gymData.zip_code}
                    onChange={(e) => setGymData(prev => ({ ...prev, zip_code: e.target.value }))}
                    placeholder="10001"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'hours' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Business Hours</h2>
              <p className="text-gray-400 text-sm">Set your standard operating hours</p>
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Opening Time
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="time"
                      value={gymData.opening_time}
                      onChange={(e) => setGymData(prev => ({ ...prev, opening_time: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Closing Time
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="time"
                      value={gymData.closing_time}
                      onChange={(e) => setGymData(prev => ({ ...prev, closing_time: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/50"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Timezone
                </label>
                <select
                  value={gymData.timezone}
                  onChange={(e) => setGymData(prev => ({ ...prev, timezone: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/50 [&>option]:bg-gray-900"
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="America/Anchorage">Alaska Time (AKT)</option>
                  <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
                </select>
              </div>

              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-sm text-gray-400">
                  You can set specific hours for each day of the week in Settings after completing onboarding.
                </p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'complete' && (
          <div className="text-center py-8 space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">You're All Set!</h2>
              <p className="text-gray-400">
                Your gym is configured and ready to go. You can always update these settings later.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 text-left">
              <div className="p-4 bg-white/5 rounded-xl">
                <h3 className="font-medium text-white mb-1">Next: Add Classes</h3>
                <p className="text-sm text-gray-400">Create your class schedule for members to book.</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl">
                <h3 className="font-medium text-white mb-1">Next: Invite Staff</h3>
                <p className="text-sm text-gray-400">Add instructors and employees to your team.</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl">
                <h3 className="font-medium text-white mb-1">Next: Build Website</h3>
                <p className="text-sm text-gray-400">Create a landing page for your gym.</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
          <div>
            {currentStep !== 'basics' && currentStep !== 'complete' && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep !== 'complete' && (
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Skip for now
              </button>
            )}

            {currentStep !== 'complete' ? (
              <button
                onClick={handleNext}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
