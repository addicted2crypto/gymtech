'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Mail,
  Phone,
  Building2,
  Clock,
  CheckCircle2,
  Reply,
  Archive,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  business_name: string | null;
  inquiry_type: string;
  message: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  new: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: Mail },
  read: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: Clock },
  replied: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle2 },
  archived: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: Archive },
};

const INQUIRY_LABELS: Record<string, string> = {
  general: 'General',
  pricing: 'Pricing',
  demo: 'Demo Request',
  support: 'Support',
  partnership: 'Partnership',
  enterprise: 'Enterprise',
};

export default function ContactSubmissionsPage() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Cast needed: contact_submissions isn't in generated types until migration runs + types regenerated
  const getDb = () => {
    const supabase = createClient();
    return supabase as unknown as { from: (table: string) => ReturnType<typeof supabase.from> };
  };

  const fetchSubmissions = async () => {
    const db = getDb();
    const { data, error } = await db
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching submissions:', error);
    } else {
      setSubmissions((data ?? []) as ContactSubmission[]);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSubmissions();
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const db = getDb();
    const { error } = await db
      .from('contact_submissions')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      setSubmissions(prev =>
        prev.map(s => s.id === id ? { ...s, status: newStatus } : s)
      );
    }
  };

  const filtered = submissions.filter(s =>
    filterStatus === 'all' || s.status === filterStatus
  );

  const selected = submissions.find(s => s.id === selectedId);
  const newCount = submissions.filter(s => s.status === 'new').length;

  if (loading) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-white">Contact Submissions</h1>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/super-admin"
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              Contact Submissions
              {newCount > 0 && (
                <span className="bg-orange-500 text-white text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {newCount} new
                </span>
              )}
            </h1>
            <p className="text-gray-400 mt-1">{submissions.length} total submissions</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 text-sm focus:outline-none focus:border-orange-500/50"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="archived">Archived</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* List */}
        <div className="lg:col-span-2 space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
              <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No submissions yet</p>
            </div>
          ) : (
            filtered.map((sub) => {
              const statusStyle = STATUS_STYLES[sub.status] || STATUS_STYLES.new;
              return (
                <button
                  key={sub.id}
                  onClick={() => {
                    setSelectedId(sub.id);
                    if (sub.status === 'new') updateStatus(sub.id, 'read');
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedId === sub.id
                      ? 'bg-orange-500/10 border-orange-500/30'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`font-medium truncate ${sub.status === 'new' ? 'text-white' : 'text-gray-300'}`}>
                          {sub.name}
                        </p>
                        {sub.status === 'new' && (
                          <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">{sub.message}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                        {INQUIRY_LABELS[sub.inquiry_type] || sub.inquiry_type}
                      </span>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Detail */}
        <div className="lg:col-span-3">
          {selected ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
              {/* Contact info */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">{selected.name}</h2>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-400">
                    <a href={`mailto:${selected.email}`} className="flex items-center gap-1.5 hover:text-orange-400 transition-colors">
                      <Mail className="w-4 h-4" /> {selected.email}
                    </a>
                    {selected.phone && (
                      <a href={`tel:${selected.phone}`} className="flex items-center gap-1.5 hover:text-orange-400 transition-colors">
                        <Phone className="w-4 h-4" /> {selected.phone}
                      </a>
                    )}
                    {selected.business_name && (
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4" /> {selected.business_name}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${STATUS_STYLES[selected.status]?.bg} ${STATUS_STYLES[selected.status]?.text}`}>
                  {selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
                </span>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {new Date(selected.created_at).toLocaleString()}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium bg-white/5`}>
                  {INQUIRY_LABELS[selected.inquiry_type] || selected.inquiry_type}
                </span>
              </div>

              {/* Message */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">{selected.message}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <a
                  href={`mailto:${selected.email}?subject=Re: Your GymTech inquiry`}
                  onClick={() => updateStatus(selected.id, 'replied')}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                >
                  <Reply className="w-4 h-4" />
                  Reply via Email
                </a>
                {selected.status !== 'archived' && (
                  <button
                    onClick={() => updateStatus(selected.id, 'archived')}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-gray-300 rounded-lg font-medium hover:bg-white/10 transition-colors"
                  >
                    <Archive className="w-4 h-4" />
                    Archive
                  </button>
                )}
                {selected.status === 'archived' && (
                  <button
                    onClick={() => updateStatus(selected.id, 'read')}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-gray-300 rounded-lg font-medium hover:bg-white/10 transition-colors"
                  >
                    Unarchive
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
              <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Select a submission to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
