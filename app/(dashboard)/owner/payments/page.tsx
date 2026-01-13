'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { createClient } from '@/lib/supabase/client';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Receipt,
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  Search,
  MoreVertical,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';

interface PaymentStats {
  monthlyRevenue: number;
  lastMonthRevenue: number;
  activeSubscriptions: number;
  pendingPayments: number;
  failedPayments: number;
}

interface Transaction {
  id: string;
  member_name: string;
  amount: number;
  type: 'subscription' | 'one_time' | 'refund';
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  description: string;
  created_at: string;
}

const statusStyles: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  completed: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle },
  pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: Clock },
  failed: { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle },
  refunded: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: ArrowDownRight },
};

export default function PaymentsPage() {
  const { gym } = useAuthStore();
  const [stats, setStats] = useState<PaymentStats>({
    monthlyRevenue: 0,
    lastMonthRevenue: 0,
    activeSubscriptions: 0,
    pendingPayments: 0,
    failedPayments: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchPaymentData() {
      if (!gym?.id) {
        setLoading(false);
        return;
      }

      const supabase = createClient();

      // Fetch subscription count
      const { count: subCount } = await supabase
        .from('member_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // TODO: Integrate with Stripe for actual payment data
      // For now, showing placeholder structure

      setStats({
        monthlyRevenue: 0,
        lastMonthRevenue: 0,
        activeSubscriptions: subCount || 0,
        pendingPayments: 0,
        failedPayments: 0,
      });

      setTransactions([]);
      setLoading(false);
    }

    fetchPaymentData();
  }, [gym?.id]);

  const revenueChange = stats.lastMonthRevenue > 0
    ? ((stats.monthlyRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100
    : 0;

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.member_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Payments</h1>
          <p className="text-gray-400 mt-1">Loading...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 animate-pulse">
              <div className="h-10 w-10 bg-white/10 rounded-xl mb-4" />
              <div className="h-8 bg-white/10 rounded w-1/2 mb-2" />
              <div className="h-4 bg-white/10 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!gym?.id) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Payments</h1>
          <p className="text-gray-400 mt-1">Track revenue and transactions</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <DollarSign className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Gym Associated</h2>
          <p className="text-gray-400">You need to be associated with a gym to view payments.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Payments</h1>
          <p className="text-gray-400 mt-1">Track revenue and manage transactions</p>
        </div>
        <div className="flex gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-gray-300 rounded-xl hover:bg-white/10 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          <a
            href="/api/stripe/billing-portal"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-orange-500 to-amber-500 text-white font-medium rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/25"
          >
            <CreditCard className="w-4 h-4" />
            Stripe Dashboard
          </a>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            {revenueChange !== 0 && (
              <div className={`flex items-center gap-1 text-sm ${revenueChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {revenueChange > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {Math.abs(revenueChange).toFixed(1)}%
              </div>
            )}
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-white">{formatCurrency(stats.monthlyRevenue)}</p>
            <p className="text-gray-400 text-sm">Monthly Revenue</p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-white">{stats.activeSubscriptions}</p>
            <p className="text-gray-400 text-sm">Active Subscriptions</p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-white">{stats.pendingPayments}</p>
            <p className="text-gray-400 text-sm">Pending Payments</p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-white">{stats.failedPayments}</p>
            <p className="text-gray-400 text-sm">Failed Payments</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-colors"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:border-orange-500/50 transition-colors [&>option]:text-gray-900 [&>option]:bg-white"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
        </div>

        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Member</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Description</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Amount</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Date</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-400"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTransactions.map((transaction) => {
                  const statusStyle = statusStyles[transaction.status] || statusStyles.pending;
                  const StatusIcon = statusStyle.icon;
                  return (
                    <tr key={transaction.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-white font-medium">{transaction.member_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-300">{transaction.description}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${transaction.type === 'refund' ? 'text-red-400' : 'text-white'}`}>
                          {transaction.type === 'refund' ? '-' : ''}{formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                          <StatusIcon className="w-3 h-3" />
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-400 text-sm">{formatDate(transaction.created_at)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No transactions yet</h3>
            <p className="text-gray-400">
              Transactions will appear here once members make payments.
            </p>
            <p className="text-gray-500 text-sm mt-4">
              Connect your Stripe account to start accepting payments.
            </p>
          </div>
        )}
      </div>

      {/* Stripe Integration Notice */}
      {!gym.stripe_account_id && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-orange-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">Connect Stripe to Accept Payments</h3>
              <p className="text-gray-400 mt-1 text-sm">
                Link your Stripe account to start accepting membership payments, process refunds, and track revenue automatically.
              </p>
              <a
                href="/api/stripe/connect"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                Connect Stripe Account
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
