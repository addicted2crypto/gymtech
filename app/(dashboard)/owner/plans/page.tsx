'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { createClient } from '@/lib/supabase/client';
import {
  Plus,
  DollarSign,
  Users,
  Check,
  X,
  Edit2,
  MoreVertical,
  Clock,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Send,
} from 'lucide-react';

type MembershipPlan = {
  id: string;
  name: string;
  description: string | null;
  price: number; // in cents
  interval: 'week' | 'month' | 'year';
  features: string[];
  is_active: boolean;
  created_at: string;
  _count?: { subscriptions: number };
};

type PriceChangeRequest = {
  id: string;
  plan_id: string;
  current_price: number;
  requested_price: number;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'applied';
  requested_at: string;
  rejection_reason: string | null;
};

// Demo data
const demoPlans: MembershipPlan[] = [
  {
    id: '1',
    name: 'Basic',
    description: 'Perfect for beginners',
    price: 9900, // $99.00
    interval: 'month',
    features: ['Access to all classes', '2 classes per week', 'Locker access'],
    is_active: true,
    created_at: new Date().toISOString(),
    _count: { subscriptions: 45 },
  },
  {
    id: '2',
    name: 'Pro',
    description: 'For serious athletes',
    price: 14900, // $149.00
    interval: 'month',
    features: ['Unlimited classes', 'Open mat access', 'Locker access', 'Guest passes (2/mo)'],
    is_active: true,
    created_at: new Date().toISOString(),
    _count: { subscriptions: 82 },
  },
  {
    id: '3',
    name: 'Elite',
    description: 'Competition focused',
    price: 19900, // $199.00
    interval: 'month',
    features: ['Unlimited classes', 'Private lessons (1/mo)', 'Priority booking', 'Competition support', 'Nutrition guidance'],
    is_active: true,
    created_at: new Date().toISOString(),
    _count: { subscriptions: 28 },
  },
  {
    id: '4',
    name: 'Drop-in',
    description: 'Pay as you go',
    price: 3500, // $35.00
    interval: 'week',
    features: ['Single class access'],
    is_active: false,
    created_at: new Date().toISOString(),
    _count: { subscriptions: 0 },
  },
];

const demoPriceRequests: PriceChangeRequest[] = [
  {
    id: 'pr1',
    plan_id: '2',
    current_price: 14900,
    requested_price: 15900,
    reason: 'Increased operating costs and added new equipment',
    status: 'pending',
    requested_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    rejection_reason: null,
  },
];

const intervalLabels: Record<string, string> = {
  week: '/week',
  month: '/month',
  year: '/year',
};

export default function PlansPage() {
  const { gym } = useAuthStore();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [priceRequests, setPriceRequests] = useState<PriceChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Price change modal state
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [priceReason, setPriceReason] = useState('');
  const [submittingPrice, setSubmittingPrice] = useState(false);

  // New plan modal state
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: '',
    description: '',
    price: '',
    interval: 'month' as 'week' | 'month' | 'year',
    features: [''],
  });
  const [creatingPlan, setCreatingPlan] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (!supabaseUrl || !gym?.id) {
        // Demo mode
        setPlans(demoPlans);
        setPriceRequests(demoPriceRequests);
        setLoading(false);
        return;
      }

      const supabase = createClient();

      // Fetch plans
      const { data: plansData, error: plansError } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('gym_id', gym.id)
        .order('price');

      if (!plansError && plansData) {
        setPlans(plansData.map((p) => ({
          ...p,
          features: (p.features as string[]) || [],
        })));
      } else {
        setPlans(demoPlans);
      }

      // Fetch pending price change requests
      const { data: requests } = await supabase
        .from('price_change_requests')
        .select('*')
        .eq('gym_id', gym.id)
        .in('status', ['pending', 'rejected'])
        .order('requested_at', { ascending: false });

      setPriceRequests(requests || []);
      setLoading(false);
    };

    fetchPlans();
  }, [gym?.id]);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const openPriceChangeModal = (plan: MembershipPlan) => {
    setSelectedPlan(plan);
    setNewPrice((plan.price / 100).toFixed(2));
    setPriceReason('');
    setShowPriceModal(true);
    setOpenMenuId(null);
  };

  const submitPriceChange = async () => {
    if (!selectedPlan) return;

    const priceInCents = Math.round(parseFloat(newPrice) * 100);
    if (isNaN(priceInCents) || priceInCents <= 0) {
      return;
    }

    if (priceInCents === selectedPlan.price) {
      setShowPriceModal(false);
      return;
    }

    setSubmittingPrice(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl) {
      // Demo mode
      setTimeout(() => {
        const newRequest: PriceChangeRequest = {
          id: `pr-${Date.now()}`,
          plan_id: selectedPlan.id,
          current_price: selectedPlan.price,
          requested_price: priceInCents,
          reason: priceReason || null,
          status: 'pending',
          requested_at: new Date().toISOString(),
          rejection_reason: null,
        };
        setPriceRequests([newRequest, ...priceRequests]);
        setSubmittingPrice(false);
        setShowPriceModal(false);
      }, 500);
      return;
    }

    const supabase = createClient();

    // Call the submit_price_change_request function
    const { data, error } = await supabase.rpc('submit_price_change_request', {
      p_plan_id: selectedPlan.id,
      p_new_price: priceInCents,
      p_reason: priceReason || null,
    });

    if (!error && data) {
      // Refresh price requests
      const { data: requests } = await supabase
        .from('price_change_requests')
        .select('*')
        .eq('gym_id', gym?.id)
        .in('status', ['pending', 'rejected'])
        .order('requested_at', { ascending: false });

      setPriceRequests(requests || []);
    }

    setSubmittingPrice(false);
    setShowPriceModal(false);
  };

  const createNewPlan = async () => {
    if (!newPlan.name.trim() || !newPlan.price) return;

    setCreatingPlan(true);

    const priceInCents = Math.round(parseFloat(newPlan.price) * 100);
    const features = newPlan.features.filter((f) => f.trim());

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl) {
      // Demo mode
      setTimeout(() => {
        const plan: MembershipPlan = {
          id: `plan-${Date.now()}`,
          name: newPlan.name,
          description: newPlan.description || null,
          price: priceInCents,
          interval: newPlan.interval,
          features,
          is_active: true,
          created_at: new Date().toISOString(),
          _count: { subscriptions: 0 },
        };
        setPlans([...plans, plan].sort((a, b) => a.price - b.price));
        setCreatingPlan(false);
        setShowNewPlanModal(false);
        setNewPlan({ name: '', description: '', price: '', interval: 'month', features: [''] });
      }, 500);
      return;
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from('membership_plans')
      .insert({
        gym_id: gym?.id,
        name: newPlan.name,
        description: newPlan.description || null,
        price: priceInCents,
        interval: newPlan.interval,
        features,
      })
      .select()
      .single();

    if (!error && data) {
      setPlans([...plans, { ...data, features: data.features || [] }].sort((a, b) => a.price - b.price));
    }

    setCreatingPlan(false);
    setShowNewPlanModal(false);
    setNewPlan({ name: '', description: '', price: '', interval: 'month', features: [''] });
  };

  const getPendingRequest = (planId: string) => {
    return priceRequests.find((r) => r.plan_id === planId && r.status === 'pending');
  };

  const getRejectedRequest = (planId: string) => {
    return priceRequests.find((r) => r.plan_id === planId && r.status === 'rejected');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Membership Plans</h1>
          <p className="text-gray-400 mt-1">
            Manage your pricing and membership tiers
          </p>
        </div>
        <button
          onClick={() => setShowNewPlanModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/25"
        >
          <Plus className="w-5 h-5" />
          Add Plan
        </button>
      </div>

      {/* Price Change Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-300 font-medium">Price Changes Require Approval</p>
          <p className="text-sm text-gray-400 mt-1">
            To protect your members and ensure fair pricing, price changes must be submitted for review.
            You can freely add new plans and modify plan names, descriptions, and features.
          </p>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => {
          const pendingRequest = getPendingRequest(plan.id);
          const rejectedRequest = getRejectedRequest(plan.id);

          return (
            <div
              key={plan.id}
              className={`relative bg-white/5 border rounded-2xl overflow-hidden transition-all ${
                plan.is_active ? 'border-white/10' : 'border-white/5 opacity-60'
              }`}
            >
              {/* Pending Price Change Badge */}
              {pendingRequest && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs rounded-full">
                  <Clock className="w-3 h-3" />
                  Price change pending
                </div>
              )}

              <div className="p-6">
                {/* Plan Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                    {plan.description && (
                      <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === plan.id ? null : plan.id)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>

                    {openMenuId === plan.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute right-0 mt-1 w-48 bg-[#1a1a24] border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden">
                          <button
                            className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:bg-white/5 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit Details
                          </button>
                          <button
                            onClick={() => openPriceChangeModal(plan)}
                            disabled={!!pendingRequest}
                            className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <DollarSign className="w-4 h-4" />
                            Request Price Change
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">{formatPrice(plan.price)}</span>
                    <span className="text-gray-500">{intervalLabels[plan.interval]}</span>
                  </div>

                  {/* Pending price change indicator */}
                  {pendingRequest && (
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <ArrowUpRight className={`w-4 h-4 ${
                        pendingRequest.requested_price > pendingRequest.current_price
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`} />
                      <span className="text-gray-400">
                        Requested: {formatPrice(pendingRequest.requested_price)}
                      </span>
                    </div>
                  )}

                  {/* Rejected price change */}
                  {rejectedRequest && (
                    <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-xs text-red-400 font-medium">Previous request rejected</p>
                      {rejectedRequest.rejection_reason && (
                        <p className="text-xs text-gray-500 mt-1">{rejectedRequest.rejection_reason}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-green-400 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Stats */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>{plan._count?.subscriptions || 0} subscribers</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    plan.is_active
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {plans.length === 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No membership plans yet</h3>
          <p className="text-gray-400 mb-6">
            Create your first plan to start accepting members
          </p>
          <button
            onClick={() => setShowNewPlanModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all"
          >
            <Plus className="w-5 h-5" />
            Create Your First Plan
          </button>
        </div>
      )}

      {/* Price Change Modal */}
      {showPriceModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12121a] border border-white/10 rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-white mb-2">Request Price Change</h2>
            <p className="text-gray-400 text-sm mb-6">
              Submit a price change request for <span className="text-white">{selectedPlan.name}</span>.
              This will be reviewed before taking effect.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Current Price
                </label>
                <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-400">
                  {formatPrice(selectedPlan.price)}{intervalLabels[selectedPlan.interval]}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Price *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                    placeholder="0.00"
                  />
                </div>
                {newPrice && parseFloat(newPrice) * 100 !== selectedPlan.price && (
                  <p className={`mt-2 text-sm flex items-center gap-1 ${
                    parseFloat(newPrice) * 100 > selectedPlan.price ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {parseFloat(newPrice) * 100 > selectedPlan.price ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {Math.abs(((parseFloat(newPrice) * 100 - selectedPlan.price) / selectedPlan.price) * 100).toFixed(1)}% change
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reason for Change
                </label>
                <textarea
                  value={priceReason}
                  onChange={(e) => setPriceReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-colors resize-none"
                  placeholder="Explain why you need to change the price..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPriceModal(false)}
                className="flex-1 px-4 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitPriceChange}
                disabled={submittingPrice || !newPrice || parseFloat(newPrice) * 100 === selectedPlan.price}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingPrice ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Plan Modal */}
      {showNewPlanModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12121a] border border-white/10 rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-white mb-6">Create New Plan</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Plan Name *
                </label>
                <input
                  type="text"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-colors"
                  placeholder="e.g., Basic, Pro, Elite"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={newPlan.description}
                  onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-colors"
                  placeholder="Brief description of this plan"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newPlan.price}
                      onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
                      className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Billing Interval
                  </label>
                  <select
                    value={newPlan.interval}
                    onChange={(e) => setNewPlan({ ...newPlan, interval: e.target.value as 'week' | 'month' | 'year' })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                  >
                    <option value="week" className="bg-[#12121a]">Weekly</option>
                    <option value="month" className="bg-[#12121a]">Monthly</option>
                    <option value="year" className="bg-[#12121a]">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Features
                </label>
                <div className="space-y-2">
                  {newPlan.features.map((feature, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => {
                          const features = [...newPlan.features];
                          features[i] = e.target.value;
                          setNewPlan({ ...newPlan, features });
                        }}
                        className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-colors"
                        placeholder="e.g., Unlimited classes"
                      />
                      {newPlan.features.length > 1 && (
                        <button
                          onClick={() => {
                            const features = newPlan.features.filter((_, idx) => idx !== i);
                            setNewPlan({ ...newPlan, features });
                          }}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setNewPlan({ ...newPlan, features: [...newPlan.features, ''] })}
                    className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add feature
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowNewPlanModal(false);
                  setNewPlan({ name: '', description: '', price: '', interval: 'month', features: [''] });
                }}
                className="flex-1 px-4 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createNewPlan}
                disabled={creatingPlan || !newPlan.name.trim() || !newPlan.price}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingPlan ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Create Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
