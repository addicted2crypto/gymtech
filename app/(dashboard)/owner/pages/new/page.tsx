'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Layout,
  Type,
  Image,
  Video,
  Puzzle,
  Eye,
  Globe,
  Sparkles,
  Crown,
  Lock,
  Calendar,
  CreditCard,
  Users,
  Star,
  MessageSquare,
  Gift,
  ChevronDown,
  Upload,
  Trash2,
  GripVertical,
  Plus,
  Save,
  Loader2,
} from 'lucide-react';

// Wizard steps
type WizardStep = 'template' | 'content' | 'addons' | 'preview';

const STEPS: { id: WizardStep; label: string; icon: typeof Layout }[] = [
  { id: 'template', label: 'Choose Template', icon: Layout },
  { id: 'content', label: 'Add Content', icon: Type },
  { id: 'addons', label: 'Features', icon: Puzzle },
  { id: 'preview', label: 'Preview & Publish', icon: Eye },
];

// Template definitions
interface Template {
  id: string;
  name: string;
  description: string;
  category: 'homepage' | 'schedule' | 'pricing' | 'about' | 'promo';
  preview: string;
  sections: SectionType[];
}

const TEMPLATES: Template[] = [
  {
    id: 'hero-schedule',
    name: 'Hero + Schedule',
    description: 'Eye-catching hero section with class schedule below',
    category: 'homepage',
    preview: '/templates/hero-schedule.png',
    sections: ['hero', 'schedule', 'testimonials', 'cta'],
  },
  {
    id: 'video-hero',
    name: 'Video Hero',
    description: 'Full-width video background with call to action',
    category: 'homepage',
    preview: '/templates/video-hero.png',
    sections: ['video-hero', 'features', 'pricing', 'contact'],
  },
  {
    id: 'schedule-focus',
    name: 'Schedule Focus',
    description: 'Schedule-first layout with filtering',
    category: 'schedule',
    preview: '/templates/schedule.png',
    sections: ['header', 'schedule', 'instructors', 'cta'],
  },
  {
    id: 'pricing-tiers',
    name: 'Pricing Tiers',
    description: 'Compare membership plans side by side',
    category: 'pricing',
    preview: '/templates/pricing.png',
    sections: ['header', 'pricing', 'faq', 'cta'],
  },
  {
    id: 'team-story',
    name: 'Team & Story',
    description: 'Showcase your coaches and gym history',
    category: 'about',
    preview: '/templates/about.png',
    sections: ['hero', 'story', 'team', 'gallery', 'contact'],
  },
  {
    id: 'promo-landing',
    name: 'Promo Landing',
    description: 'Focused landing page for special offers',
    category: 'promo',
    preview: '/templates/promo.png',
    sections: ['promo-hero', 'benefits', 'testimonials', 'countdown', 'cta'],
  },
];

// Section types that can be added to pages
type SectionType =
  | 'hero' | 'video-hero' | 'promo-hero'
  | 'schedule' | 'pricing' | 'testimonials'
  | 'features' | 'team' | 'gallery'
  | 'contact' | 'faq' | 'cta'
  | 'header' | 'story' | 'instructors'
  | 'benefits' | 'countdown';

interface SectionConfig {
  type: SectionType;
  label: string;
  icon: typeof Type;
  description: string;
  fields: SectionField[];
}

interface SectionField {
  name: string;
  type: 'text' | 'textarea' | 'image' | 'video' | 'color' | 'select';
  label: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

const SECTION_CONFIGS: Record<SectionType, SectionConfig> = {
  'hero': {
    type: 'hero',
    label: 'Hero Section',
    icon: Layout,
    description: 'Main banner with headline and CTA',
    fields: [
      { name: 'headline', type: 'text', label: 'Headline', placeholder: 'Train Like a Champion' },
      { name: 'subheadline', type: 'textarea', label: 'Subheadline', placeholder: 'Join the best MMA gym in town...' },
      { name: 'backgroundImage', type: 'image', label: 'Background Image' },
      { name: 'ctaText', type: 'text', label: 'Button Text', placeholder: 'Start Free Trial' },
      { name: 'ctaLink', type: 'text', label: 'Button Link', placeholder: '/signup' },
    ],
  },
  'video-hero': {
    type: 'video-hero',
    label: 'Video Hero',
    icon: Video,
    description: 'Video background with overlay text',
    fields: [
      { name: 'headline', type: 'text', label: 'Headline', placeholder: 'Train Like a Champion' },
      { name: 'videoUrl', type: 'video', label: 'Video URL' },
      { name: 'ctaText', type: 'text', label: 'Button Text', placeholder: 'Join Now' },
    ],
  },
  'promo-hero': {
    type: 'promo-hero',
    label: 'Promo Hero',
    icon: Sparkles,
    description: 'Special offer banner with countdown',
    fields: [
      { name: 'headline', type: 'text', label: 'Offer Headline', placeholder: '50% OFF First Month!' },
      { name: 'description', type: 'textarea', label: 'Description' },
      { name: 'expiryDate', type: 'text', label: 'Expiry Date', placeholder: '2026-01-31' },
    ],
  },
  'schedule': {
    type: 'schedule',
    label: 'Class Schedule',
    icon: Calendar,
    description: 'Weekly class schedule widget',
    fields: [
      { name: 'title', type: 'text', label: 'Section Title', placeholder: 'This Week\'s Schedule' },
      { name: 'showFilters', type: 'select', label: 'Show Filters', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
    ],
  },
  'pricing': {
    type: 'pricing',
    label: 'Pricing Plans',
    icon: CreditCard,
    description: 'Membership plan comparison',
    fields: [
      { name: 'title', type: 'text', label: 'Section Title', placeholder: 'Choose Your Plan' },
      { name: 'subtitle', type: 'text', label: 'Subtitle', placeholder: 'No contracts. Cancel anytime.' },
    ],
  },
  'testimonials': {
    type: 'testimonials',
    label: 'Testimonials',
    icon: MessageSquare,
    description: 'Member reviews and quotes',
    fields: [
      { name: 'title', type: 'text', label: 'Section Title', placeholder: 'What Our Members Say' },
    ],
  },
  'features': {
    type: 'features',
    label: 'Features Grid',
    icon: Star,
    description: 'Highlight gym amenities',
    fields: [
      { name: 'title', type: 'text', label: 'Section Title', placeholder: 'Why Train With Us' },
    ],
  },
  'team': {
    type: 'team',
    label: 'Team / Coaches',
    icon: Users,
    description: 'Instructor profiles',
    fields: [
      { name: 'title', type: 'text', label: 'Section Title', placeholder: 'Meet Our Coaches' },
    ],
  },
  'gallery': {
    type: 'gallery',
    label: 'Photo Gallery',
    icon: Image,
    description: 'Image gallery grid',
    fields: [
      { name: 'title', type: 'text', label: 'Section Title', placeholder: 'Our Gym' },
    ],
  },
  'contact': {
    type: 'contact',
    label: 'Contact Form',
    icon: MessageSquare,
    description: 'Contact form with map',
    fields: [
      { name: 'title', type: 'text', label: 'Section Title', placeholder: 'Get In Touch' },
      { name: 'showMap', type: 'select', label: 'Show Map', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
    ],
  },
  'faq': {
    type: 'faq',
    label: 'FAQ',
    icon: MessageSquare,
    description: 'Frequently asked questions',
    fields: [
      { name: 'title', type: 'text', label: 'Section Title', placeholder: 'Frequently Asked Questions' },
    ],
  },
  'cta': {
    type: 'cta',
    label: 'Call to Action',
    icon: Sparkles,
    description: 'Bottom CTA banner',
    fields: [
      { name: 'headline', type: 'text', label: 'Headline', placeholder: 'Ready to Start?' },
      { name: 'buttonText', type: 'text', label: 'Button Text', placeholder: 'Get Started' },
    ],
  },
  'header': {
    type: 'header',
    label: 'Page Header',
    icon: Type,
    description: 'Simple page header',
    fields: [
      { name: 'title', type: 'text', label: 'Page Title', placeholder: 'Class Schedule' },
      { name: 'subtitle', type: 'text', label: 'Subtitle', placeholder: 'Find the perfect class for you' },
    ],
  },
  'story': {
    type: 'story',
    label: 'Our Story',
    icon: Type,
    description: 'Gym history and values',
    fields: [
      { name: 'title', type: 'text', label: 'Section Title', placeholder: 'Our Story' },
      { name: 'content', type: 'textarea', label: 'Story Content' },
      { name: 'image', type: 'image', label: 'Featured Image' },
    ],
  },
  'instructors': {
    type: 'instructors',
    label: 'Instructors',
    icon: Users,
    description: 'Instructor cards',
    fields: [
      { name: 'title', type: 'text', label: 'Section Title', placeholder: 'Our Instructors' },
    ],
  },
  'benefits': {
    type: 'benefits',
    label: 'Benefits List',
    icon: Check,
    description: 'List of benefits/features',
    fields: [
      { name: 'title', type: 'text', label: 'Section Title', placeholder: 'What You Get' },
    ],
  },
  'countdown': {
    type: 'countdown',
    label: 'Countdown Timer',
    icon: Calendar,
    description: 'Countdown to offer expiry',
    fields: [
      { name: 'expiryDate', type: 'text', label: 'Expiry Date', placeholder: '2026-01-31T23:59:59' },
      { name: 'message', type: 'text', label: 'Message', placeholder: 'Offer ends in:' },
    ],
  },
};

// Add-ons available for pages
interface PageAddon {
  id: string;
  name: string;
  description: string;
  icon: typeof Puzzle;
  tier: 'free' | 'pro' | 'enterprise';
  enabled: boolean;
}

const PAGE_ADDONS: PageAddon[] = [
  { id: 'live-chat', name: 'Live Chat Widget', description: 'Real-time chat with visitors', icon: MessageSquare, tier: 'pro', enabled: false },
  { id: 'booking-widget', name: 'Quick Booking', description: 'Inline class booking', icon: Calendar, tier: 'free', enabled: true },
  { id: 'promo-banner', name: 'Promo Banner', description: 'Top banner for offers', icon: Gift, tier: 'free', enabled: false },
  { id: 'member-login', name: 'Member Portal Link', description: 'Login button in header', icon: Users, tier: 'free', enabled: true },
  { id: 'social-proof', name: 'Social Proof', description: 'Recent signups notification', icon: Star, tier: 'pro', enabled: false },
  { id: 'video-testimonials', name: 'Video Testimonials', description: 'Video reviews from members', icon: Video, tier: 'enterprise', enabled: false },
];

interface PageSection {
  id: string;
  type: SectionType;
  content: Record<string, string>;
}

export default function NewPageWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>('template');
  const [saving, setSaving] = useState(false);

  // Page state
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [pageTitle, setPageTitle] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [sections, setSections] = useState<PageSection[]>([]);
  const [addons, setAddons] = useState<PageAddon[]>(PAGE_ADDONS);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);
  // Demo: user is on Pro tier - cast to prevent TypeScript narrowing
  const currentTier = 'pro' as 'free' | 'pro' | 'enterprise';

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    // Initialize sections from template
    const initialSections: PageSection[] = template.sections.map((type, i) => ({
      id: `section-${i}`,
      type,
      content: {},
    }));
    setSections(initialSections);
    setPageTitle(template.name);
    setPageSlug(template.id);
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id);
    }
  };

  const handleSectionContentChange = (sectionId: string, field: string, value: string) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId
        ? { ...s, content: { ...s.content, [field]: value } }
        : s
    ));
  };

  const toggleAddon = (addonId: string) => {
    setAddons(prev => prev.map(a =>
      a.id === addonId
        ? { ...a, enabled: !a.enabled }
        : a
    ));
  };

  const addSection = (type: SectionType) => {
    const newSection: PageSection = {
      id: `section-${Date.now()}`,
      type,
      content: {},
    };
    setSections(prev => [...prev, newSection]);
  };

  const removeSection = (sectionId: string) => {
    setSections(prev => prev.filter(s => s.id !== sectionId));
  };

  const handlePublish = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSaving(false);
    router.push('/owner/pages');
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'template': return selectedTemplate !== null;
      case 'content': return sections.length > 0 && pageTitle.trim() !== '';
      case 'addons': return true;
      case 'preview': return true;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/owner/pages"
              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Create New Page</h1>
              <p className="text-sm text-gray-500">Step {currentStepIndex + 1} of {STEPS.length}</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="hidden md:flex items-center gap-2">
            {STEPS.map((step, i) => {
              const isActive = step.id === currentStep;
              const isComplete = i < currentStepIndex;
              return (
                <button
                  key={step.id}
                  onClick={() => i <= currentStepIndex && setCurrentStep(step.id)}
                  disabled={i > currentStepIndex}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      : isComplete
                      ? 'bg-green-500/10 text-green-400'
                      : 'text-gray-500 hover:text-gray-400'
                  }`}
                >
                  {isComplete ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <step.icon className="w-4 h-4" />
                  )}
                  {step.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            {currentStep !== 'template' && (
              <button
                onClick={handleBack}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Back
              </button>
            )}
            {currentStep === 'preview' ? (
              <button
                onClick={handlePublish}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-linear-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    Publish Page
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-2 bg-linear-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6">
        {/* Step 1: Template Selection */}
        {currentStep === 'template' && (
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Choose a Template</h2>
              <p className="text-gray-400">
                Pick a starting point for your page. You can customize everything after.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`group text-left p-4 rounded-2xl border transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'bg-orange-500/10 border-orange-500/50 ring-2 ring-orange-500/20'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Template Preview */}
                  <div className="aspect-video bg-[#0d0d12] rounded-xl mb-4 overflow-hidden border border-white/5">
                    <TemplatePreview templateId={template.id} />
                  </div>

                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                    </div>
                    {selectedTemplate?.id === template.id && (
                      <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 mt-3">
                    {template.sections.slice(0, 4).map((section, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white/5 text-gray-500 text-xs rounded">
                        {SECTION_CONFIGS[section]?.label || section}
                      </span>
                    ))}
                    {template.sections.length > 4 && (
                      <span className="px-2 py-0.5 bg-white/5 text-gray-500 text-xs rounded">
                        +{template.sections.length - 4} more
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Content Editor */}
        {currentStep === 'content' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Page Settings */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4">Page Settings</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Page Title</label>
                  <input
                    type="text"
                    value={pageTitle}
                    onChange={(e) => setPageTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                    placeholder="My Awesome Page"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">URL Slug</label>
                  <div className="flex items-center">
                    <span className="px-3 py-3 bg-white/5 border border-r-0 border-white/10 rounded-l-xl text-gray-500 text-sm">
                      yoursite.com/
                    </span>
                    <input
                      type="text"
                      value={pageSlug}
                      onChange={(e) => setPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-r-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                      placeholder="page-url"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sections Editor */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Page Sections</h3>
                <div className="relative group">
                  <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-gray-300 transition-colors">
                    <Plus className="w-4 h-4" />
                    Add Section
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-64 bg-[#1a1a24] border border-white/10 rounded-xl shadow-xl hidden group-hover:block z-10">
                    <div className="p-2 max-h-64 overflow-y-auto">
                      {Object.values(SECTION_CONFIGS).map((config) => (
                        <button
                          key={config.type}
                          onClick={() => addSection(config.type)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-300 hover:bg-white/5 rounded-lg transition-colors"
                        >
                          <config.icon className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">{config.label}</p>
                            <p className="text-xs text-gray-500">{config.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {sections.map((section, i) => {
                const config = SECTION_CONFIGS[section.type];
                const isExpanded = expandedSection === section.id;

                return (
                  <div
                    key={section.id}
                    className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                      className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors"
                    >
                      <GripVertical className="w-5 h-5 text-gray-600 cursor-grab" />
                      <div className="p-2 bg-white/5 rounded-lg">
                        <config.icon className="w-5 h-5 text-orange-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-white">{config.label}</p>
                        <p className="text-sm text-gray-500">{config.description}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}
                        className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {isExpanded && (
                      <div className="p-4 pt-0 space-y-4">
                        {config.fields.map((field) => (
                          <div key={field.name}>
                            <label className="block text-sm text-gray-400 mb-2">{field.label}</label>
                            {field.type === 'text' && (
                              <input
                                type="text"
                                value={section.content[field.name] || ''}
                                onChange={(e) => handleSectionContentChange(section.id, field.name, e.target.value)}
                                placeholder={field.placeholder}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                              />
                            )}
                            {field.type === 'textarea' && (
                              <textarea
                                value={section.content[field.name] || ''}
                                onChange={(e) => handleSectionContentChange(section.id, field.name, e.target.value)}
                                placeholder={field.placeholder}
                                rows={3}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 resize-none"
                              />
                            )}
                            {field.type === 'image' && (
                              <div className="flex items-center gap-4">
                                <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                                  <Image className="w-8 h-8 text-gray-600" />
                                </div>
                                <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 transition-colors">
                                  <Upload className="w-4 h-4" />
                                  Upload Image
                                </button>
                              </div>
                            )}
                            {field.type === 'video' && (
                              <input
                                type="text"
                                value={section.content[field.name] || ''}
                                onChange={(e) => handleSectionContentChange(section.id, field.name, e.target.value)}
                                placeholder="https://youtube.com/watch?v=..."
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                              />
                            )}
                            {field.type === 'select' && (
                              <select
                                value={section.content[field.name] || ''}
                                onChange={(e) => handleSectionContentChange(section.id, field.name, e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/50"
                              >
                                <option value="">Select...</option>
                                {field.options?.map((opt) => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Add-ons */}
        {currentStep === 'addons' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Add Features</h2>
              <p className="text-gray-400">
                Enable add-ons to enhance your page. Some features require upgraded plans.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {addons.map((addon) => {
                const isAvailable =
                  addon.tier === 'free' ||
                  (addon.tier === 'pro' && (currentTier === 'pro' || currentTier === 'enterprise')) ||
                  (addon.tier === 'enterprise' && currentTier === 'enterprise');

                return (
                  <div
                    key={addon.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      addon.enabled && isAvailable
                        ? 'bg-orange-500/10 border-orange-500/30'
                        : 'bg-white/5 border-white/10'
                    } ${!isAvailable ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${addon.enabled && isAvailable ? 'bg-orange-500/20' : 'bg-white/5'}`}>
                        <addon.icon className={`w-6 h-6 ${addon.enabled && isAvailable ? 'text-orange-400' : 'text-gray-500'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-white">{addon.name}</h3>
                          {addon.tier !== 'free' && (
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              addon.tier === 'pro'
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              {addon.tier === 'pro' ? <Crown className="w-3 h-3 inline mr-1" /> : null}
                              {addon.tier.charAt(0).toUpperCase() + addon.tier.slice(1)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{addon.description}</p>
                      </div>
                      {isAvailable ? (
                        <button
                          onClick={() => toggleAddon(addon.id)}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            addon.enabled ? 'bg-orange-500' : 'bg-white/20'
                          }`}
                        >
                          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                            addon.enabled ? 'right-1' : 'left-1'
                          }`} />
                        </button>
                      ) : (
                        <button className="flex items-center gap-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-400">
                          <Lock className="w-3 h-3" />
                          Upgrade
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Upgrade prompt */}
            {currentTier !== 'enterprise' && (
              <div className="bg-linear-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/20 rounded-xl">
                    <Crown className="w-8 h-8 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">Unlock All Features</h3>
                    <p className="text-gray-400 text-sm">
                      Upgrade to {currentTier === 'free' ? 'Pro' : 'Enterprise'} to access premium add-ons like live chat, video testimonials, and more.
                    </p>
                  </div>
                  <Link
                    href="/owner/settings"
                    className="px-6 py-2 bg-linear-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all"
                  >
                    View Plans
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Preview & Publish */}
        {currentStep === 'preview' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Preview Your Page</h2>
                <p className="text-gray-400">
                  Review how your page will look before publishing
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 transition-colors">
                  <Save className="w-4 h-4 inline mr-2" />
                  Save Draft
                </button>
              </div>
            </div>

            {/* Preview Frame */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/10">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 bg-red-500/80 rounded-full" />
                  <div className="w-3 h-3 bg-yellow-500/80 rounded-full" />
                  <div className="w-3 h-3 bg-green-500/80 rounded-full" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 bg-white/5 rounded-lg text-sm text-gray-400 font-mono">
                    {`https://yourgym.gymtech.com/${pageSlug}`}
                  </div>
                </div>
              </div>

              <div className="aspect-video bg-[#0a0a0f] flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto bg-orange-500/10 rounded-2xl flex items-center justify-center">
                    <Eye className="w-10 h-10 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{pageTitle || 'Your Page'}</h3>
                    <p className="text-gray-500 mt-1">
                      {sections.length} sections • {addons.filter(a => a.enabled).length} add-ons enabled
                    </p>
                  </div>
                  <button className="px-6 py-2 bg-orange-500/20 text-orange-400 rounded-xl font-medium hover:bg-orange-500/30 transition-colors">
                    Open Full Preview
                  </button>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Layout className="w-5 h-5 text-orange-400" />
                  Template
                </h3>
                <p className="text-gray-300">{selectedTemplate?.name}</p>
                <p className="text-sm text-gray-500 mt-1">{selectedTemplate?.description}</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Type className="w-5 h-5 text-orange-400" />
                  Sections
                </h3>
                <div className="flex flex-wrap gap-1">
                  {sections.map((s) => (
                    <span key={s.id} className="px-2 py-1 bg-white/5 text-gray-400 text-xs rounded">
                      {SECTION_CONFIGS[s.type]?.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Puzzle className="w-5 h-5 text-orange-400" />
                  Active Add-ons
                </h3>
                <div className="flex flex-wrap gap-1">
                  {addons.filter(a => a.enabled).map((a) => (
                    <span key={a.id} className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded">
                      {a.name}
                    </span>
                  ))}
                  {addons.filter(a => a.enabled).length === 0 && (
                    <span className="text-gray-500 text-sm">No add-ons enabled</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Visual CSS-based template previews
function TemplatePreview({ templateId }: { templateId: string }) {
  const previews: Record<string, React.ReactNode> = {
    'hero-schedule': (
      <div className="w-full h-full flex flex-col">
        {/* Hero */}
        <div className="flex-1 bg-linear-to-br from-orange-500/30 to-amber-500/20 flex items-center justify-center relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
          <div className="text-center z-10 px-2">
            <div className="w-16 h-1.5 bg-white/40 rounded mx-auto mb-1" />
            <div className="w-24 h-1 bg-white/20 rounded mx-auto mb-2" />
            <div className="w-10 h-3 bg-orange-500/60 rounded mx-auto" />
          </div>
        </div>
        {/* Schedule */}
        <div className="h-1/3 bg-white/5 p-2">
          <div className="grid grid-cols-7 gap-0.5 h-full">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="bg-white/5 rounded-sm flex flex-col gap-0.5 p-0.5">
                <div className="h-0.5 w-full bg-white/20 rounded" />
                <div className="flex-1 bg-orange-500/20 rounded-sm" />
                <div className="flex-1 bg-blue-500/20 rounded-sm" />
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    'video-hero': (
      <div className="w-full h-full flex flex-col">
        {/* Video Hero */}
        <div className="flex-1 bg-linear-to-br from-gray-800 to-gray-900 flex items-center justify-center relative">
          <div className="absolute inset-0 bg-black/40" />
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center z-10">
            <div className="w-0 h-0 border-l-[6px] border-l-white/60 border-y-4 border-y-transparent ml-0.5" />
          </div>
          <div className="absolute bottom-2 left-2 right-2">
            <div className="w-20 h-1.5 bg-white/40 rounded mb-1" />
            <div className="w-12 h-3 bg-orange-500/60 rounded" />
          </div>
        </div>
        {/* Features */}
        <div className="h-1/4 bg-white/5 p-2 flex gap-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-1 bg-white/5 rounded-sm p-1">
              <div className="w-3 h-3 bg-orange-500/30 rounded mb-0.5" />
              <div className="w-full h-0.5 bg-white/20 rounded" />
            </div>
          ))}
        </div>
      </div>
    ),
    'schedule-focus': (
      <div className="w-full h-full flex flex-col bg-white/5">
        {/* Header */}
        <div className="h-6 bg-white/10 flex items-center px-2">
          <div className="w-12 h-1 bg-white/30 rounded" />
        </div>
        {/* Filters */}
        <div className="flex gap-1 p-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`px-2 py-0.5 rounded text-[6px] ${i === 0 ? 'bg-orange-500/40' : 'bg-white/10'}`} />
          ))}
        </div>
        {/* Schedule Grid */}
        <div className="flex-1 p-1">
          <div className="grid grid-cols-7 gap-0.5 h-full">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="bg-white/5 rounded-sm p-0.5 flex flex-col gap-0.5">
                <div className="text-[5px] text-white/30 text-center">Day</div>
                <div className="flex-1 bg-purple-500/20 rounded-sm" />
                <div className="flex-1 bg-orange-500/20 rounded-sm" />
                <div className="flex-1 bg-green-500/20 rounded-sm" />
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    'pricing-tiers': (
      <div className="w-full h-full flex flex-col bg-white/5 p-2">
        {/* Header */}
        <div className="text-center mb-2">
          <div className="w-16 h-1 bg-white/30 rounded mx-auto mb-0.5" />
          <div className="w-10 h-0.5 bg-white/15 rounded mx-auto" />
        </div>
        {/* Pricing Cards */}
        <div className="flex-1 flex gap-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`flex-1 rounded-sm p-1 flex flex-col ${i === 1 ? 'bg-orange-500/20 ring-1 ring-orange-500/40' : 'bg-white/5'}`}>
              <div className="w-6 h-0.5 bg-white/30 rounded mb-1" />
              <div className="w-8 h-2 bg-white/20 rounded mb-1" />
              <div className="flex-1 space-y-0.5">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="flex items-center gap-0.5">
                    <div className="w-1 h-1 bg-green-500/50 rounded-full" />
                    <div className="flex-1 h-0.5 bg-white/10 rounded" />
                  </div>
                ))}
              </div>
              <div className={`h-2 rounded mt-1 ${i === 1 ? 'bg-orange-500/50' : 'bg-white/10'}`} />
            </div>
          ))}
        </div>
      </div>
    ),
    'team-story': (
      <div className="w-full h-full flex flex-col">
        {/* Hero */}
        <div className="h-1/3 bg-linear-to-r from-orange-500/20 to-amber-500/20 flex items-center justify-center">
          <div className="w-20 h-1.5 bg-white/40 rounded" />
        </div>
        {/* Story */}
        <div className="h-1/3 bg-white/5 p-2 flex gap-2">
          <div className="w-1/3 bg-white/10 rounded" />
          <div className="flex-1 space-y-1">
            <div className="w-full h-1 bg-white/20 rounded" />
            <div className="w-3/4 h-1 bg-white/10 rounded" />
            <div className="w-full h-1 bg-white/10 rounded" />
          </div>
        </div>
        {/* Team */}
        <div className="h-1/3 bg-white/5 p-2">
          <div className="flex gap-1 justify-center">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center">
                <div className="w-6 h-6 bg-white/10 rounded-full mx-auto mb-0.5" />
                <div className="w-5 h-0.5 bg-white/20 rounded mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    'promo-landing': (
      <div className="w-full h-full flex flex-col">
        {/* Promo Hero */}
        <div className="flex-1 bg-linear-to-br from-red-500/30 to-orange-500/30 flex flex-col items-center justify-center p-2">
          <div className="w-20 h-2 bg-white/50 rounded mb-1" />
          <div className="w-16 h-1 bg-white/25 rounded mb-2" />
          {/* Countdown */}
          <div className="flex gap-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-4 h-5 bg-black/30 rounded flex items-center justify-center">
                <span className="text-[8px] text-white/60">00</span>
              </div>
            ))}
          </div>
        </div>
        {/* Benefits */}
        <div className="h-1/4 bg-white/5 p-2 flex gap-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex-1 bg-white/5 rounded-sm p-1 flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500/30 rounded-full" />
              <div className="flex-1 h-0.5 bg-white/20 rounded" />
            </div>
          ))}
        </div>
      </div>
    ),
  };

  return previews[templateId] || (
    <div className="w-full h-full flex items-center justify-center">
      <Layout className="w-8 h-8 text-gray-600" />
    </div>
  );
}
