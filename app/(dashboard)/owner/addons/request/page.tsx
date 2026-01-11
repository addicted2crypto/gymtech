'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Image,
  Zap,
  MessageSquare,
  Calendar,
  ChevronDown,
  Upload,
  X,
  Sparkles
} from 'lucide-react';

type RequestPriority = 'normal' | 'urgent';
type RequestCategory = 'new_feature' | 'modification' | 'integration' | 'design' | 'bug_fix' | 'other';
type RequestStatus = 'pending' | 'in_progress' | 'completed' | 'clarification_needed';

interface FeatureRequest {
  id: string;
  title: string;
  category: RequestCategory;
  priority: RequestPriority;
  status: RequestStatus;
  description: string;
  createdAt: string;
  slaDeadline: string;
  estimatedCompletion?: string;
  devNotes?: string;
}

const categoryOptions = [
  { value: 'new_feature', label: 'New Feature', description: 'Add entirely new functionality' },
  { value: 'modification', label: 'Modification', description: 'Change existing feature behavior' },
  { value: 'integration', label: 'Integration', description: 'Connect with external service' },
  { value: 'design', label: 'Design Change', description: 'Visual or UX improvements' },
  { value: 'bug_fix', label: 'Bug Fix', description: 'Something isn\'t working correctly' },
  { value: 'other', label: 'Other', description: 'Anything else' },
];

// Demo: Previous requests
const previousRequests: FeatureRequest[] = [
  {
    id: '1',
    title: 'Add member check-in QR code scanner',
    category: 'new_feature',
    priority: 'normal',
    status: 'completed',
    description: 'I need a way for members to check in using a QR code on their phone.',
    createdAt: '2024-01-10T10:00:00Z',
    slaDeadline: '2024-01-11T10:00:00Z',
    estimatedCompletion: '2024-01-10T18:30:00Z',
    devNotes: 'Implemented QR check-in. Added to member portal and admin dashboard.',
  },
  {
    id: '2',
    title: 'Custom branded email templates',
    category: 'design',
    priority: 'urgent',
    status: 'in_progress',
    description: 'Want to add our gym logo and colors to all automated emails.',
    createdAt: '2024-01-12T14:00:00Z',
    slaDeadline: '2024-01-13T14:00:00Z',
    devNotes: 'Working on email template system. 60% complete.',
  },
  {
    id: '3',
    title: 'Integrate with our existing booking system',
    category: 'integration',
    priority: 'normal',
    status: 'clarification_needed',
    description: 'We use MindBody for some classes, need to sync.',
    createdAt: '2024-01-13T09:00:00Z',
    slaDeadline: '2024-01-14T09:00:00Z',
    devNotes: 'Need API access credentials and list of fields to sync.',
  },
];

export default function FeatureRequestPage() {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<RequestCategory>('new_feature');
  const [priority, setPriority] = useState<RequestPriority>('normal');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [referenceUrl, setReferenceUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setSubmitted(true);
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full">
            <Clock className="w-3 h-3" />
            Pending Review
          </span>
        );
      case 'in_progress':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
            <Zap className="w-3 h-3" />
            In Progress
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      case 'clarification_needed':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
            <MessageSquare className="w-3 h-3" />
            Needs Clarification
          </span>
        );
    }
  };

  const formatTimeRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();

    if (diff <= 0) return 'Overdue';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      return `${Math.floor(hours / 24)}d ${hours % 24}h remaining`;
    }
    return `${hours}h ${minutes}m remaining`;
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">Request Submitted!</h1>
        <p className="text-gray-400 mb-2">
          Your feature request has been received. Our dev team has been notified.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-xl mb-8">
          <Clock className="w-5 h-5" />
          <span className="font-medium">24-Hour SLA Guaranteed</span>
        </div>
        <p className="text-gray-500 text-sm mb-8">
          Expected completion: <span className="text-white font-medium">Within 24 hours</span>
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/owner/addons"
            className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-medium hover:bg-white/10 transition-colors"
          >
            Back to Add-ons
          </Link>
          <button
            onClick={() => {
              setSubmitted(false);
              setTitle('');
              setDescription('');
              setCategory('new_feature');
              setPriority('normal');
              setAttachments([]);
              setReferenceUrl('');
            }}
            className="px-6 py-3 bg-linear-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium hover:from-orange-600 hover:to-amber-600 transition-all"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/owner/addons"
          className="p-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-white/20 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Request Custom Feature</h1>
          <p className="text-gray-400 mt-1">
            Tell us what you need and we'll build it within 24 hours
          </p>
        </div>
      </div>

      {/* SLA Banner */}
      <div className="bg-linear-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-2xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-orange-500/20 rounded-xl flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-orange-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">24-Hour SLA Guarantee</h3>
            <p className="text-gray-400 text-sm">
              All feature requests are reviewed and implemented within 24 hours as per your contract
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-orange-400">24h</p>
          <p className="text-gray-500 text-sm">Max turnaround</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab('new')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'new'
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          New Request
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'history'
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Request History ({previousRequests.length})
        </button>
      </div>

      {activeTab === 'new' ? (
        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                What do you need?
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Add member check-in QR code scanner"
                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                required
              />
            </div>

            {/* Category */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <label className="block text-sm font-medium text-gray-400 mb-3">
                Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categoryOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCategory(opt.value as RequestCategory)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      category === opt.value
                        ? 'bg-orange-500/20 border-orange-500/30 text-orange-400'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <p className="font-medium text-white">{opt.label}</p>
                    <p className="text-xs mt-1">{opt.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Describe what you need in detail
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Be as specific as possible. Include:&#10;- What problem this solves&#10;- How you want it to work&#10;- Where it should appear&#10;- Any specific design preferences"
                rows={6}
                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 resize-none"
                required
              />
            </div>

            {/* Reference URL */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Reference URL (optional)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Link to an example of what you're looking for
              </p>
              <input
                type="url"
                value={referenceUrl}
                onChange={(e) => setReferenceUrl(e.target.value)}
                placeholder="https://example.com/feature-i-like"
                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
              />
            </div>

            {/* Attachments */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Attachments (optional)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Upload screenshots, mockups, or documents
              </p>

              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg"
                    >
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-white">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                        className="text-gray-500 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-white/20 transition-colors">
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-gray-400">Drop files here or click to upload</span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Priority */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <label className="block text-sm font-medium text-gray-400 mb-3">
                Priority
              </label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setPriority('normal')}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                    priority === 'normal'
                      ? 'bg-blue-500/20 border-blue-500/30'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <Calendar className="w-5 h-5 text-blue-400" />
                  <div className="text-left">
                    <p className="font-medium text-white">Normal</p>
                    <p className="text-xs text-gray-400">Within 24 hours</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('urgent')}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                    priority === 'urgent'
                      ? 'bg-red-500/20 border-red-500/30'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <Zap className="w-5 h-5 text-red-400" />
                  <div className="text-left">
                    <p className="font-medium text-white">Urgent</p>
                    <p className="text-xs text-gray-400">Same day if possible</p>
                  </div>
                </button>
              </div>
            </div>

            {/* What to Expect */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4">What to Expect</h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-orange-400 text-xs font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-white">Immediate Review</p>
                    <p className="text-gray-400">Our team reviews your request within 1 hour</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-orange-400 text-xs font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-white">Clarification (if needed)</p>
                    <p className="text-gray-400">We'll reach out if we need more details</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-orange-400 text-xs font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-white">Implementation</p>
                    <p className="text-gray-400">Feature built and deployed</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Notification</p>
                    <p className="text-gray-400">You'll be notified when it's ready</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!title || !description || isSubmitting}
              className="w-full flex items-center justify-center gap-2 p-4 bg-linear-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Request History */
        <div className="space-y-4">
          {previousRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-white">{request.title}</h3>
                    {getStatusBadge(request.status)}
                    {request.priority === 'urgent' && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                        <Zap className="w-3 h-3" />
                        Urgent
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{request.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm text-gray-500">Submitted</p>
                  <p className="text-sm text-white">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* SLA Progress */}
              <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-400">SLA Progress</span>
                    <span className={request.status === 'completed' ? 'text-green-400' : 'text-orange-400'}>
                      {request.status === 'completed'
                        ? 'Completed on time'
                        : formatTimeRemaining(request.slaDeadline)
                      }
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        request.status === 'completed' ? 'bg-green-500' : 'bg-orange-500'
                      }`}
                      style={{
                        width: request.status === 'completed' ? '100%' :
                          request.status === 'in_progress' ? '60%' : '20%'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Dev Notes */}
              {request.devNotes && (
                <div className="mt-4 p-3 bg-white/5 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Dev Team Notes:</p>
                  <p className="text-sm text-gray-300">{request.devNotes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
