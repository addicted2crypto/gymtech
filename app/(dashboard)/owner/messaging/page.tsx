'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Mail,
  MessageSquare,
  Users,
  UserPlus,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  Search,
  Filter,
  Tag,
  Percent,
  Gift,
  DollarSign,
  Eye,
  Plus,
  X,
  Sparkles
} from 'lucide-react';

type RecipientType = 'all_members' | 'trial_users' | 'inactive' | 'specific_level' | 'custom';
type ChannelType = 'email' | 'sms' | 'both';
type OfferType = 'none' | 'percent_off' | 'dollar_off' | 'free_class' | 'free_merch' | 'free_month';

interface Offer {
  type: OfferType;
  value?: number;
  description: string;
  expiryDays: number;
}

interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'promotional' | 'reminder' | 'welcome';
}

interface SentMessage {
  id: string;
  subject: string;
  recipients: string;
  channel: ChannelType;
  sentAt: string;
  delivered: number;
  opened: number;
  status: 'delivered' | 'sending' | 'failed';
}

// Personalization tokens that users can click to insert
const personalizationTokens = [
  { token: '{first_name}', label: 'First Name', preview: 'John' },
  { token: '{last_name}', label: 'Last Name', preview: 'Smith' },
  { token: '{gym_name}', label: 'Gym Name', preview: 'Iron Temple MMA' },
];

// Preset offer options
const offerPresets = [
  { type: 'percent_off' as OfferType, value: 10, label: '10% Off', icon: Percent },
  { type: 'percent_off' as OfferType, value: 15, label: '15% Off', icon: Percent },
  { type: 'percent_off' as OfferType, value: 20, label: '20% Off', icon: Percent },
  { type: 'percent_off' as OfferType, value: 25, label: '25% Off', icon: Percent },
  { type: 'dollar_off' as OfferType, value: 10, label: '$10 Off', icon: DollarSign },
  { type: 'dollar_off' as OfferType, value: 25, label: '$25 Off', icon: DollarSign },
  { type: 'dollar_off' as OfferType, value: 50, label: '$50 Off', icon: DollarSign },
  { type: 'free_class' as OfferType, label: 'Free Class', icon: Gift },
  { type: 'free_month' as OfferType, label: 'Free Month', icon: Gift },
  { type: 'free_merch' as OfferType, label: 'Free Merch', icon: Gift },
];

const templates: MessageTemplate[] = [
  {
    id: '1',
    name: 'Trial Conversion',
    subject: 'Ready to Join? Special Offer Inside!',
    content: 'Hey {first_name}! We loved having you try out our classes. Ready to become a full member?',
    type: 'promotional',
  },
  {
    id: '2',
    name: 'We Miss You',
    subject: 'We Miss You at {gym_name}!',
    content: 'Hey {first_name}, it\'s been a while since we\'ve seen you! Come back and check out our new classes.',
    type: 'promotional',
  },
  {
    id: '3',
    name: 'Flash Sale',
    subject: 'Limited Time Offer Just For You!',
    content: '{first_name}, we\'re running a special just for our members!',
    type: 'promotional',
  },
];

const sentMessages: SentMessage[] = [
  {
    id: '1',
    subject: 'New Year Special - 30% Off!',
    recipients: 'All Members (248)',
    channel: 'both',
    sentAt: '2 hours ago',
    delivered: 243,
    opened: 156,
    status: 'delivered',
  },
  {
    id: '2',
    subject: 'Trial Conversion Offer',
    recipients: 'Trial Users (12)',
    channel: 'email',
    sentAt: 'Yesterday',
    delivered: 12,
    opened: 8,
    status: 'delivered',
  },
];

const recipientOptions = [
  { value: 'all_members', label: 'All Members', count: 248, icon: Users },
  { value: 'trial_users', label: 'Trial Users', count: 12, icon: UserPlus },
  { value: 'inactive', label: 'Inactive (30+ days)', count: 34, icon: Clock },
  { value: 'specific_level', label: 'By Consistency Level', count: null, icon: Filter },
];

// Generate a random coupon code
function generateCouponCode(prefix: string = 'GYM'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = prefix;
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function MessagingContent() {
  const searchParams = useSearchParams();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [activeTab, setActiveTab] = useState<'compose' | 'history' | 'templates'>('compose');
  const [recipientType, setRecipientType] = useState<RecipientType>('all_members');
  const [channel, setChannel] = useState<ChannelType>('email');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  // Offer state
  const [includeOffer, setIncludeOffer] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<typeof offerPresets[0] | null>(null);
  const [customOfferValue, setCustomOfferValue] = useState<number>(0);
  const [offerExpiry, setOfferExpiry] = useState(7); // days
  const [couponCode, setCouponCode] = useState('');

  // Preview state
  const [showPreview, setShowPreview] = useState(false);

  // Read recipient type from URL query params
  useEffect(() => {
    const recipients = searchParams.get('recipients');
    if (recipients && ['all_members', 'trial_users', 'inactive', 'specific_level'].includes(recipients)) {
      setRecipientType(recipients as RecipientType);
    }
  }, [searchParams]);

  // Generate coupon code when offer is selected
  useEffect(() => {
    if (includeOffer && selectedOffer && !couponCode) {
      setCouponCode(generateCouponCode());
    }
  }, [includeOffer, selectedOffer, couponCode]);

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setMessage(prev => prev + text);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newMessage = message.substring(0, start) + text + message.substring(end);
    setMessage(newMessage);

    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const handleTemplateSelect = (template: MessageTemplate) => {
    setSelectedTemplate(template.id);
    setSubject(template.subject);
    setMessage(template.content);
  };

  const handleOfferSelect = (offer: typeof offerPresets[0]) => {
    setSelectedOffer(offer);
    if (offer.value) {
      setCustomOfferValue(offer.value);
    }
    // Generate new coupon code
    setCouponCode(generateCouponCode());
  };

  const getOfferText = (): string => {
    if (!selectedOffer) return '';

    const value = customOfferValue || selectedOffer.value;
    switch (selectedOffer.type) {
      case 'percent_off':
        return `${value}% off`;
      case 'dollar_off':
        return `$${value} off`;
      case 'free_class':
        return 'a FREE class';
      case 'free_month':
        return 'a FREE month';
      case 'free_merch':
        return 'FREE merchandise';
      default:
        return '';
    }
  };

  const getPreviewMessage = (): string => {
    let preview = message;
    personalizationTokens.forEach(token => {
      preview = preview.replace(new RegExp(token.token.replace(/[{}]/g, '\\$&'), 'g'), token.preview);
    });

    if (includeOffer && selectedOffer && couponCode) {
      preview += `\n\nUse code ${couponCode} for ${getOfferText()}! Valid for ${offerExpiry} days.`;
    }

    return preview;
  };

  const getFinalMessage = (): string => {
    let finalMsg = message;

    if (includeOffer && selectedOffer && couponCode) {
      finalMsg += `\n\nUse code ${couponCode} for ${getOfferText()}! Valid for ${offerExpiry} days.`;
    }

    return finalMsg;
  };

  const handleSend = async () => {
    setIsSending(true);
    setSendResult(null);

    try {
      const response = await fetch('/api/messaging/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientType,
          consistencyLevel: recipientType === 'specific_level' ? selectedLevel : undefined,
          channel,
          subject: channel !== 'sms' ? subject : undefined,
          message: getFinalMessage(),
          offer: includeOffer && selectedOffer ? {
            type: selectedOffer.type,
            value: customOfferValue || selectedOffer.value,
            couponCode,
            expiryDays: offerExpiry,
          } : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSendResult({ success: false, message: data.error || 'Failed to send messages' });
        return;
      }

      setSendResult({ success: true, message: data.message });
      // Reset form on success
      setSubject('');
      setMessage('');
      setSelectedTemplate(null);
      setIncludeOffer(false);
      setSelectedOffer(null);
      setCouponCode('');
    } catch (error) {
      setSendResult({ success: false, message: 'Network error. Please try again.' });
    } finally {
      setIsSending(false);
    }
  };

  const getRecipientCount = () => {
    const option = recipientOptions.find(o => o.value === recipientType);
    return option?.count || 0;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Messaging Center</h1>
        <p className="text-gray-400 mt-1">
          Send SMS and email campaigns to your members
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab('compose')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'compose'
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Compose Message
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'history'
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Message History
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'templates'
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Templates
        </button>
      </div>

      {/* Compose Tab */}
      {activeTab === 'compose' && (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Compose Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recipients */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recipients</h3>

              <div className="relative">
                <button
                  onClick={() => setShowRecipientDropdown(!showRecipientDropdown)}
                  className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {recipientOptions.find(o => o.value === recipientType)?.icon && (
                      <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                        {(() => {
                          const Icon = recipientOptions.find(o => o.value === recipientType)?.icon || Users;
                          return <Icon className="w-5 h-5 text-orange-400" />;
                        })()}
                      </div>
                    )}
                    <div className="text-left">
                      <p className="font-medium text-white">
                        {recipientOptions.find(o => o.value === recipientType)?.label}
                      </p>
                      <p className="text-sm text-gray-400">
                        {getRecipientCount()} recipients
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showRecipientDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showRecipientDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a24] border border-white/10 rounded-xl overflow-hidden z-10">
                    {recipientOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setRecipientType(option.value as RecipientType);
                          setShowRecipientDropdown(false);
                        }}
                        className={`w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors ${
                          recipientType === option.value ? 'bg-orange-500/10' : ''
                        }`}
                      >
                        <option.icon className="w-5 h-5 text-gray-400" />
                        <span className="text-white">{option.label}</span>
                        {option.count !== null && (
                          <span className="ml-auto text-sm text-gray-500">({option.count})</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {recipientType === 'specific_level' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Select Consistency Level
                  </label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/50"
                  >
                    <option value="">Choose a level...</option>
                    <option value="platinum">Platinum (95%+ attendance)</option>
                    <option value="gold">Gold (85%+ attendance)</option>
                    <option value="silver">Silver (70%+ attendance)</option>
                    <option value="bronze">Bronze (50%+ attendance)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Channel Selection */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Channel</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => setChannel('email')}
                  className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                    channel === 'email'
                      ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <Mail className="w-5 h-5" />
                  <span className="font-medium">Email</span>
                </button>
                <button
                  onClick={() => setChannel('sms')}
                  className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                    channel === 'sms'
                      ? 'bg-green-500/20 border-green-500/30 text-green-400'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <MessageSquare className="w-5 h-5" />
                  <span className="font-medium">SMS</span>
                </button>
                <button
                  onClick={() => setChannel('both')}
                  className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                    channel === 'both'
                      ? 'bg-purple-500/20 border-purple-500/30 text-purple-400'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <Mail className="w-5 h-5" />
                  <MessageSquare className="w-5 h-5" />
                  <span className="font-medium">Both</span>
                </button>
              </div>
            </div>

            {/* Message Content */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Message</h3>

              {channel !== 'sms' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter email subject..."
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                  />
                </div>
              )}

              {/* Personalization Tokens */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Click to personalize your message
                </label>
                <div className="flex flex-wrap gap-2">
                  {personalizationTokens.map((token) => (
                    <button
                      key={token.token}
                      onClick={() => insertAtCursor(token.token)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/20 transition-colors"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      {token.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Message Content
                </label>
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your message here..."
                  rows={5}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 resize-none"
                />
              </div>

              {channel === 'sms' && (
                <p className="text-sm text-gray-400 mt-2">
                  Character count: {message.length}/160
                  {message.length > 160 && <span className="text-amber-400"> (will be sent as {Math.ceil(message.length / 160)} messages)</span>}
                </p>
              )}
            </div>

            {/* Offer/Coupon Section */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Include an Offer</h3>
                <button
                  onClick={() => {
                    setIncludeOffer(!includeOffer);
                    if (!includeOffer) {
                      setSelectedOffer(null);
                      setCouponCode('');
                    }
                  }}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    includeOffer ? 'bg-orange-500' : 'bg-white/20'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    includeOffer ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>

              {includeOffer && (
                <div className="space-y-4">
                  {/* Offer Presets */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-3">
                      Select an offer type
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {offerPresets.map((offer, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleOfferSelect(offer)}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                            selectedOffer?.type === offer.type &&
                            (offer.value ? selectedOffer?.value === offer.value : true)
                              ? 'bg-orange-500/20 border-orange-500/30 text-orange-400'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                          }`}
                        >
                          <offer.icon className="w-5 h-5" />
                          <span className="text-xs font-medium">{offer.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Value for Percent/Dollar Off */}
                  {selectedOffer && (selectedOffer.type === 'percent_off' || selectedOffer.type === 'dollar_off') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Custom Amount
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">
                          {selectedOffer.type === 'dollar_off' ? '$' : ''}
                        </span>
                        <input
                          type="number"
                          min="1"
                          max={selectedOffer.type === 'percent_off' ? 100 : 1000}
                          value={customOfferValue}
                          onChange={(e) => setCustomOfferValue(parseInt(e.target.value) || 0)}
                          className="w-24 p-2 bg-white/5 border border-white/10 rounded-lg text-white text-center focus:outline-none focus:border-orange-500/50"
                        />
                        <span className="text-gray-400">
                          {selectedOffer.type === 'percent_off' ? '%' : ''}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Coupon Code */}
                  {selectedOffer && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Coupon Code (auto-generated)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="flex-1 p-2 bg-white/5 border border-white/10 rounded-lg text-white font-mono tracking-wider focus:outline-none focus:border-orange-500/50"
                        />
                        <button
                          onClick={() => setCouponCode(generateCouponCode())}
                          className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:border-white/20 transition-colors"
                          title="Generate new code"
                        >
                          <Sparkles className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Expiry */}
                  {selectedOffer && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Offer valid for
                      </label>
                      <div className="flex gap-2">
                        {[3, 7, 14, 30].map((days) => (
                          <button
                            key={days}
                            onClick={() => setOfferExpiry(days)}
                            className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                              offerExpiry === days
                                ? 'bg-orange-500/20 border-orange-500/30 text-orange-400'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                            }`}
                          >
                            {days} days
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Offer Preview */}
                  {selectedOffer && couponCode && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                      <p className="text-green-400 text-sm">
                        <span className="font-semibold">Offer will be added:</span> Use code <span className="font-mono font-bold">{couponCode}</span> for {getOfferText()}! Valid for {offerExpiry} days.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Preview Button */}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="w-full flex items-center justify-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Eye className="w-5 h-5" />
              {showPreview ? 'Hide Preview' : 'Preview Message'}
            </button>

            {/* Message Preview */}
            {showPreview && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
                <div className="p-4 bg-[#0a0a0f] rounded-xl border border-white/10">
                  {channel !== 'sms' && subject && (
                    <p className="font-semibold text-white mb-2 pb-2 border-b border-white/10">
                      {subject.replace(/{gym_name}/g, 'Iron Temple MMA')}
                    </p>
                  )}
                  <p className="text-gray-300 whitespace-pre-wrap">{getPreviewMessage()}</p>
                </div>
              </div>
            )}

            {/* Send Result Notification */}
            {sendResult && (
              <div className={`p-4 rounded-xl border ${
                sendResult.success
                  ? 'bg-green-500/10 border-green-500/20 text-green-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                <div className="flex items-center gap-2">
                  {sendResult.success ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  <span>{sendResult.message}</span>
                </div>
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!message || (channel !== 'sms' && !subject) || isSending}
              className="w-full flex items-center justify-center gap-2 p-4 bg-linear-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send to {getRecipientCount()} Recipients
                </>
              )}
            </button>
          </div>

          {/* Quick Templates Sidebar */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Quick Templates</h3>
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className={`w-full text-left p-4 bg-white/5 border rounded-xl transition-all ${
                  selectedTemplate === template.id
                    ? 'border-orange-500/30 bg-orange-500/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <p className="font-medium text-white">{template.name}</p>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{template.content}</p>
              </button>
            ))}

            <div className="pt-4 border-t border-white/10">
              <h4 className="text-sm font-medium text-gray-400 mb-3">Popular Offers</h4>
              <div className="space-y-2">
                {offerPresets.slice(0, 4).map((offer, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setIncludeOffer(true);
                      handleOfferSelect(offer);
                    }}
                    className="w-full flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-colors text-left"
                  >
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <offer.icon className="w-4 h-4 text-green-400" />
                    </div>
                    <span className="text-sm text-gray-300">{offer.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                />
              </div>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {sentMessages.map((msg) => (
              <div key={msg.id} className="p-6 hover:bg-white/5 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium text-white">{msg.subject}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        msg.channel === 'email' ? 'bg-blue-500/20 text-blue-400' :
                        msg.channel === 'sms' ? 'bg-green-500/20 text-green-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {msg.channel.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{msg.recipients}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm">
                      {msg.status === 'delivered' ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : msg.status === 'failed' ? (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-400" />
                      )}
                      <span className={
                        msg.status === 'delivered' ? 'text-green-400' :
                        msg.status === 'failed' ? 'text-red-400' : 'text-amber-400'
                      }>
                        {msg.status.charAt(0).toUpperCase() + msg.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{msg.sentAt}</p>
                  </div>
                </div>
                <div className="flex gap-6 mt-4">
                  <div>
                    <p className="text-xs text-gray-500">Delivered</p>
                    <p className="text-lg font-semibold text-white">{msg.delivered}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Opened</p>
                    <p className="text-lg font-semibold text-white">{msg.opened}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Open Rate</p>
                    <p className="text-lg font-semibold text-orange-400">
                      {Math.round((msg.opened / msg.delivered) * 100)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="grid md:grid-cols-2 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-medium text-white">{template.name}</h4>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${
                    template.type === 'promotional' ? 'bg-purple-500/20 text-purple-400' :
                    template.type === 'reminder' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {template.type}
                  </span>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-400">
                  <span className="text-gray-500">Subject:</span> {template.subject}
                </p>
                <p className="text-sm text-gray-300">{template.content}</p>
              </div>
              <button
                onClick={() => {
                  handleTemplateSelect(template);
                  setActiveTab('compose');
                }}
                className="text-sm text-orange-400 font-medium hover:text-orange-300 transition-colors"
              >
                Use this template →
              </button>
            </div>
          ))}

          {/* Add New Template Card */}
          <div className="bg-white/5 backdrop-blur-sm border border-dashed border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center min-h-50">
            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4">
              <Plus className="w-6 h-6 text-gray-400" />
            </div>
            <h4 className="font-medium text-white mb-1">Create Template</h4>
            <p className="text-sm text-gray-400 mb-4">Save time with reusable message templates</p>
            <button className="text-sm text-orange-400 font-medium hover:text-orange-300 transition-colors">
              + Add Template
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessagingPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="h-8 bg-white/10 rounded w-1/4 animate-pulse" />
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 animate-pulse">
          <div className="h-4 bg-white/10 rounded w-1/2 mb-4" />
          <div className="h-32 bg-white/10 rounded" />
        </div>
      </div>
    }>
      <MessagingContent />
    </Suspense>
  );
}
