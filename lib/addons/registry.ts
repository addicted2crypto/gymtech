/**
 * GymTech Add-on Registry
 *
 * This is the central registry for all add-on components.
 * To add a new component:
 * 1. Create the component in /components/addons/
 * 2. Add its metadata to this registry
 * 3. The component will automatically appear in the owner's add-on marketplace
 *
 * Dev Team Guidelines:
 * - All add-ons should be self-contained
 * - Use the standardized props interface
 * - Include proper TypeScript types
 * - Add preview images to /public/addons/
 */

export type AddonCategory =
  | 'engagement'      // Loyalty, gamification, streaks
  | 'booking'         // Class booking, scheduling
  | 'payments'        // Checkout, pricing tables
  | 'social'          // Social proof, reviews, feed
  | 'marketing'       // Lead capture, popups, CTAs
  | 'content'         // Text, images, galleries
  | 'analytics'       // Stats, charts, metrics
  | 'communication'   // Chat, notifications
  | 'integrations';   // Third-party services

export type AddonTier = 'free' | 'pro' | 'enterprise';

export interface AddonConfig {
  [key: string]: {
    type: 'text' | 'number' | 'boolean' | 'select' | 'color' | 'image' | 'richtext';
    label: string;
    description?: string;
    default: unknown;
    options?: { label: string; value: string }[]; // For select type
    min?: number; // For number type
    max?: number;
  };
}

export interface AddonMetadata {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  category: AddonCategory;
  tier: AddonTier;
  icon: string; // Lucide icon name
  previewImage?: string;
  version: string;
  author: string;
  tags: string[];

  // Component configuration
  componentPath: string; // Path to the component
  configSchema: AddonConfig;
  defaultConfig: Record<string, unknown>;

  // Placement rules
  allowedPlacements: ('landing' | 'member-portal' | 'checkout' | 'email')[];
  maxInstances?: number; // How many times can this be added? Default: unlimited

  // Dependencies
  requiresStripe?: boolean;
  requiresSMS?: boolean;
  requiresEmail?: boolean;

  // Metrics
  installCount?: number;
  rating?: number;

  // Status
  isNew?: boolean;
  isPopular?: boolean;
  isBeta?: boolean;
}

// ============================================
// CORE ADD-ONS REGISTRY
// ============================================

export const ADDON_REGISTRY: AddonMetadata[] = [
  // ----------------
  // ENGAGEMENT
  // ----------------
  {
    id: 'consistency-leaderboard',
    name: 'Consistency Leaderboard',
    description: 'Show top members by attendance to drive friendly competition',
    category: 'engagement',
    tier: 'free',
    icon: 'Trophy',
    version: '1.0.0',
    author: 'GymTech',
    tags: ['gamification', 'motivation', 'leaderboard'],
    componentPath: '@/components/addons/engagement/ConsistencyLeaderboard',
    allowedPlacements: ['landing', 'member-portal'],
    configSchema: {
      title: { type: 'text', label: 'Title', default: 'Top Performers' },
      showCount: { type: 'number', label: 'Members to show', default: 10, min: 5, max: 50 },
      showAvatar: { type: 'boolean', label: 'Show member avatars', default: true },
      anonymize: { type: 'boolean', label: 'Anonymize names (first name + initial)', default: false },
      timeframe: {
        type: 'select',
        label: 'Timeframe',
        default: 'month',
        options: [
          { label: 'This Week', value: 'week' },
          { label: 'This Month', value: 'month' },
          { label: 'All Time', value: 'all' },
        ]
      },
    },
    defaultConfig: { title: 'Top Performers', showCount: 10, showAvatar: true, anonymize: false, timeframe: 'month' },
    isPopular: true,
  },
  {
    id: 'login-streak-display',
    name: 'Login Streak Display',
    description: 'Show member\'s current login streak with fire animation',
    category: 'engagement',
    tier: 'free',
    icon: 'Flame',
    version: '1.0.0',
    author: 'GymTech',
    tags: ['gamification', 'streaks', 'motivation'],
    componentPath: '@/components/addons/engagement/LoginStreakDisplay',
    allowedPlacements: ['member-portal'],
    maxInstances: 1,
    configSchema: {
      showMilestones: { type: 'boolean', label: 'Show milestone badges', default: true },
      animateOnMilestone: { type: 'boolean', label: 'Celebrate milestones', default: true },
    },
    defaultConfig: { showMilestones: true, animateOnMilestone: true },
  },
  {
    id: 'points-balance',
    name: 'Loyalty Points Display',
    description: 'Show member\'s points balance and progress to next reward',
    category: 'engagement',
    tier: 'free',
    icon: 'Coins',
    version: '1.0.0',
    author: 'GymTech',
    tags: ['loyalty', 'points', 'rewards'],
    componentPath: '@/components/addons/engagement/PointsBalance',
    allowedPlacements: ['member-portal'],
    maxInstances: 1,
    configSchema: {
      showProgress: { type: 'boolean', label: 'Show progress bar', default: true },
      showHistory: { type: 'boolean', label: 'Show recent points history', default: false },
    },
    defaultConfig: { showProgress: true, showHistory: false },
  },
  {
    id: 'achievement-badges',
    name: 'Achievement Badges',
    description: 'Display earned badges and achievements',
    category: 'engagement',
    tier: 'pro',
    icon: 'Award',
    version: '1.0.0',
    author: 'GymTech',
    tags: ['gamification', 'badges', 'achievements'],
    componentPath: '@/components/addons/engagement/AchievementBadges',
    allowedPlacements: ['member-portal'],
    configSchema: {
      layout: {
        type: 'select',
        label: 'Layout',
        default: 'grid',
        options: [
          { label: 'Grid', value: 'grid' },
          { label: 'Carousel', value: 'carousel' },
          { label: 'List', value: 'list' },
        ]
      },
      showLocked: { type: 'boolean', label: 'Show locked badges', default: true },
    },
    defaultConfig: { layout: 'grid', showLocked: true },
    isNew: true,
  },

  // ----------------
  // BOOKING
  // ----------------
  {
    id: 'class-schedule-widget',
    name: 'Class Schedule Widget',
    description: 'Interactive weekly class schedule with booking',
    category: 'booking',
    tier: 'free',
    icon: 'Calendar',
    version: '1.0.0',
    author: 'GymTech',
    tags: ['schedule', 'booking', 'classes'],
    componentPath: '@/components/addons/booking/ClassScheduleWidget',
    allowedPlacements: ['landing', 'member-portal'],
    configSchema: {
      daysToShow: { type: 'number', label: 'Days to display', default: 7, min: 1, max: 14 },
      showInstructor: { type: 'boolean', label: 'Show instructor', default: true },
      showCapacity: { type: 'boolean', label: 'Show spots remaining', default: true },
      allowBooking: { type: 'boolean', label: 'Enable booking (members only)', default: true },
      primaryColor: { type: 'color', label: 'Accent color', default: '#f97316' },
    },
    defaultConfig: { daysToShow: 7, showInstructor: true, showCapacity: true, allowBooking: true, primaryColor: '#f97316' },
    isPopular: true,
  },
  {
    id: 'upcoming-classes',
    name: 'Upcoming Classes Card',
    description: 'Show member\'s upcoming booked classes',
    category: 'booking',
    tier: 'free',
    icon: 'CalendarCheck',
    version: '1.0.0',
    author: 'GymTech',
    tags: ['schedule', 'booking', 'reminders'],
    componentPath: '@/components/addons/booking/UpcomingClasses',
    allowedPlacements: ['member-portal'],
    configSchema: {
      maxClasses: { type: 'number', label: 'Max classes to show', default: 5, min: 1, max: 10 },
      showCancelButton: { type: 'boolean', label: 'Allow cancellation', default: true },
    },
    defaultConfig: { maxClasses: 5, showCancelButton: true },
  },

  // ----------------
  // PAYMENTS
  // ----------------
  {
    id: 'pricing-table',
    name: 'Pricing Table',
    description: 'Display membership plans with Stripe checkout',
    category: 'payments',
    tier: 'free',
    icon: 'CreditCard',
    version: '1.0.0',
    author: 'GymTech',
    tags: ['pricing', 'memberships', 'checkout'],
    componentPath: '@/components/addons/payments/PricingTable',
    allowedPlacements: ['landing'],
    requiresStripe: true,
    configSchema: {
      layout: {
        type: 'select',
        label: 'Layout',
        default: 'cards',
        options: [
          { label: 'Cards', value: 'cards' },
          { label: 'Comparison Table', value: 'table' },
        ]
      },
      highlightPlan: { type: 'text', label: 'Featured plan ID', default: '' },
      showAnnualToggle: { type: 'boolean', label: 'Show monthly/annual toggle', default: true },
    },
    defaultConfig: { layout: 'cards', highlightPlan: '', showAnnualToggle: true },
    isPopular: true,
  },
  {
    id: 'active-flash-sales',
    name: 'Flash Sales Banner',
    description: 'Display active flash sales with countdown timer',
    category: 'payments',
    tier: 'free',
    icon: 'Zap',
    version: '1.0.0',
    author: 'GymTech',
    tags: ['sales', 'promotions', 'urgency'],
    componentPath: '@/components/addons/payments/FlashSalesBanner',
    allowedPlacements: ['landing', 'member-portal'],
    configSchema: {
      showCountdown: { type: 'boolean', label: 'Show countdown timer', default: true },
      position: {
        type: 'select',
        label: 'Position',
        default: 'top',
        options: [
          { label: 'Top Banner', value: 'top' },
          { label: 'Floating', value: 'floating' },
          { label: 'Inline', value: 'inline' },
        ]
      },
    },
    defaultConfig: { showCountdown: true, position: 'top' },
  },

  // ----------------
  // SOCIAL
  // ----------------
  {
    id: 'testimonials-carousel',
    name: 'Testimonials Carousel',
    description: 'Rotating member testimonials and reviews',
    category: 'social',
    tier: 'free',
    icon: 'Quote',
    version: '1.0.0',
    author: 'GymTech',
    tags: ['testimonials', 'reviews', 'social-proof'],
    componentPath: '@/components/addons/social/TestimonialsCarousel',
    allowedPlacements: ['landing'],
    configSchema: {
      autoPlay: { type: 'boolean', label: 'Auto-rotate', default: true },
      interval: { type: 'number', label: 'Rotation interval (seconds)', default: 5, min: 3, max: 15 },
      showRating: { type: 'boolean', label: 'Show star ratings', default: true },
    },
    defaultConfig: { autoPlay: true, interval: 5, showRating: true },
  },
  {
    id: 'instagram-feed',
    name: 'Instagram Feed',
    description: 'Display your gym\'s Instagram posts',
    category: 'social',
    tier: 'pro',
    icon: 'Instagram',
    version: '1.0.0',
    author: 'GymTech',
    tags: ['instagram', 'social-media', 'photos'],
    componentPath: '@/components/addons/social/InstagramFeed',
    allowedPlacements: ['landing'],
    configSchema: {
      postsToShow: { type: 'number', label: 'Posts to display', default: 6, min: 3, max: 12 },
      columns: { type: 'number', label: 'Columns', default: 3, min: 2, max: 4 },
    },
    defaultConfig: { postsToShow: 6, columns: 3 },
  },
  {
    id: 'member-spotlight',
    name: 'Member Spotlight',
    description: 'Feature a member of the month/week',
    category: 'social',
    tier: 'free',
    icon: 'Star',
    version: '1.0.0',
    author: 'GymTech',
    tags: ['community', 'recognition', 'motivation'],
    componentPath: '@/components/addons/social/MemberSpotlight',
    allowedPlacements: ['landing', 'member-portal'],
    configSchema: {
      title: { type: 'text', label: 'Section title', default: 'Member of the Month' },
      showStats: { type: 'boolean', label: 'Show member stats', default: true },
    },
    defaultConfig: { title: 'Member of the Month', showStats: true },
    isNew: true,
  },

  // ----------------
  // MARKETING
  // ----------------
  {
    id: 'lead-capture-form',
    name: 'Lead Capture Form',
    description: 'Collect leads with customizable form',
    category: 'marketing',
    tier: 'free',
    icon: 'UserPlus',
    version: '1.0.0',
    author: 'GymTech',
    tags: ['leads', 'forms', 'conversion'],
    componentPath: '@/components/addons/marketing/LeadCaptureForm',
    allowedPlacements: ['landing'],
    configSchema: {
      title: { type: 'text', label: 'Form title', default: 'Start Your Free Trial' },
      collectPhone: { type: 'boolean', label: 'Collect phone number', default: true },
      offerTrial: { type: 'boolean', label: 'Offer free trial', default: true },
      trialDays: { type: 'number', label: 'Trial length (days)', default: 7, min: 1, max: 30 },
      buttonText: { type: 'text', label: 'Button text', default: 'Get Started' },
    },
    defaultConfig: { title: 'Start Your Free Trial', collectPhone: true, offerTrial: true, trialDays: 7, buttonText: 'Get Started' },
    isPopular: true,
  },
  {
    id: 'exit-intent-popup',
    name: 'Exit Intent Popup',
    description: 'Show offer when visitor tries to leave',
    category: 'marketing',
    tier: 'pro',
    icon: 'MousePointerClick',
    version: '1.0.0',
    author: 'GymTech',
    tags: ['popup', 'conversion', 'offers'],
    componentPath: '@/components/addons/marketing/ExitIntentPopup',
    allowedPlacements: ['landing'],
    maxInstances: 1,
    configSchema: {
      headline: { type: 'text', label: 'Headline', default: 'Wait! Don\'t Leave Yet' },
      offerText: { type: 'text', label: 'Offer text', default: 'Get 20% off your first month!' },
      showOnce: { type: 'boolean', label: 'Show only once per session', default: true },
    },
    defaultConfig: { headline: 'Wait! Don\'t Leave Yet', offerText: 'Get 20% off your first month!', showOnce: true },
  },
  {
    id: 'countdown-timer',
    name: 'Countdown Timer',
    description: 'Create urgency with a countdown to offer expiry',
    category: 'marketing',
    tier: 'free',
    icon: 'Timer',
    version: '1.0.0',
    author: 'GymTech',
    tags: ['urgency', 'countdown', 'promotions'],
    componentPath: '@/components/addons/marketing/CountdownTimer',
    allowedPlacements: ['landing'],
    configSchema: {
      headline: { type: 'text', label: 'Headline', default: 'Offer Ends In:' },
      endDate: { type: 'text', label: 'End date (ISO format)', default: '' },
      style: {
        type: 'select',
        label: 'Style',
        default: 'flip',
        options: [
          { label: 'Flip Clock', value: 'flip' },
          { label: 'Simple', value: 'simple' },
          { label: 'Minimal', value: 'minimal' },
        ]
      },
    },
    defaultConfig: { headline: 'Offer Ends In:', endDate: '', style: 'flip' },
  },

  // ----------------
  // CONTENT
  // ----------------
  {
    id: 'hero-section',
    name: 'Hero Section',
    description: 'Full-width hero with image, title, and CTA',
    category: 'content',
    tier: 'free',
    icon: 'Image',
    version: '1.0.0',
    author: 'GymTech',
    tags: ['hero', 'header', 'banner'],
    componentPath: '@/components/addons/content/HeroSection',
    allowedPlacements: ['landing'],
    maxInstances: 1,
    configSchema: {
      headline: { type: 'text', label: 'Headline', default: 'Transform Your Body' },
      subheadline: { type: 'text', label: 'Subheadline', default: 'Join the best MMA gym in town' },
      backgroundImage: { type: 'image', label: 'Background image', default: '' },
      ctaText: { type: 'text', label: 'CTA button text', default: 'Start Free Trial' },
      ctaLink: { type: 'text', label: 'CTA link', default: '#pricing' },
      overlay: { type: 'boolean', label: 'Dark overlay', default: true },
    },
    defaultConfig: { headline: 'Transform Your Body', subheadline: 'Join the best MMA gym in town', backgroundImage: '', ctaText: 'Start Free Trial', ctaLink: '#pricing', overlay: true },
  },
  {
    id: 'team-section',
    name: 'Team / Instructors',
    description: 'Showcase your instructors and staff',
    category: 'content',
    tier: 'free',
    icon: 'Users',
    version: '1.0.0',
    author: 'GymTech',
    tags: ['team', 'instructors', 'staff'],
    componentPath: '@/components/addons/content/TeamSection',
    allowedPlacements: ['landing'],
    configSchema: {
      title: { type: 'text', label: 'Section title', default: 'Meet Our Instructors' },
      columns: { type: 'number', label: 'Columns', default: 4, min: 2, max: 6 },
      showBio: { type: 'boolean', label: 'Show bios', default: true },
      showSocial: { type: 'boolean', label: 'Show social links', default: true },
    },
    defaultConfig: { title: 'Meet Our Instructors', columns: 4, showBio: true, showSocial: true },
  },
  {
    id: 'image-gallery',
    name: 'Image Gallery',
    description: 'Photo gallery with lightbox',
    category: 'content',
    tier: 'free',
    icon: 'Images',
    version: '1.0.0',
    author: 'GymTech',
    tags: ['gallery', 'photos', 'images'],
    componentPath: '@/components/addons/content/ImageGallery',
    allowedPlacements: ['landing'],
    configSchema: {
      title: { type: 'text', label: 'Section title', default: 'Our Facility' },
      columns: { type: 'number', label: 'Columns', default: 3, min: 2, max: 5 },
      enableLightbox: { type: 'boolean', label: 'Enable lightbox', default: true },
    },
    defaultConfig: { title: 'Our Facility', columns: 3, enableLightbox: true },
  },
  {
    id: 'faq-section',
    name: 'FAQ Accordion',
    description: 'Frequently asked questions with expandable answers',
    category: 'content',
    tier: 'free',
    icon: 'HelpCircle',
    version: '1.0.0',
    author: 'GymTech',
    tags: ['faq', 'questions', 'help'],
    componentPath: '@/components/addons/content/FAQSection',
    allowedPlacements: ['landing'],
    configSchema: {
      title: { type: 'text', label: 'Section title', default: 'Frequently Asked Questions' },
      expandFirst: { type: 'boolean', label: 'Expand first item', default: true },
    },
    defaultConfig: { title: 'Frequently Asked Questions', expandFirst: true },
  },

  // ----------------
  // ANALYTICS
  // ----------------
  {
    id: 'attendance-chart',
    name: 'Attendance Chart',
    description: 'Visual chart of member\'s attendance history',
    category: 'analytics',
    tier: 'free',
    icon: 'BarChart3',
    version: '1.0.0',
    author: 'GymTech',
    tags: ['analytics', 'attendance', 'charts'],
    componentPath: '@/components/addons/analytics/AttendanceChart',
    allowedPlacements: ['member-portal'],
    configSchema: {
      timeframe: {
        type: 'select',
        label: 'Timeframe',
        default: '3months',
        options: [
          { label: 'Last Month', value: '1month' },
          { label: 'Last 3 Months', value: '3months' },
          { label: 'Last 6 Months', value: '6months' },
          { label: 'Last Year', value: '1year' },
        ]
      },
      chartType: {
        type: 'select',
        label: 'Chart type',
        default: 'bar',
        options: [
          { label: 'Bar Chart', value: 'bar' },
          { label: 'Line Chart', value: 'line' },
          { label: 'Calendar Heatmap', value: 'heatmap' },
        ]
      },
    },
    defaultConfig: { timeframe: '3months', chartType: 'bar' },
  },

  // ----------------
  // COMMUNICATION
  // ----------------
  {
    id: 'live-chat-widget',
    name: 'Live Chat Widget',
    description: 'Add live chat support to your site',
    category: 'communication',
    tier: 'enterprise',
    icon: 'MessageCircle',
    version: '1.0.0',
    author: 'GymTech',
    tags: ['chat', 'support', 'communication'],
    componentPath: '@/components/addons/communication/LiveChatWidget',
    allowedPlacements: ['landing', 'member-portal'],
    maxInstances: 1,
    configSchema: {
      greeting: { type: 'text', label: 'Welcome message', default: 'Hi! How can we help you today?' },
      position: {
        type: 'select',
        label: 'Position',
        default: 'bottom-right',
        options: [
          { label: 'Bottom Right', value: 'bottom-right' },
          { label: 'Bottom Left', value: 'bottom-left' },
        ]
      },
      accentColor: { type: 'color', label: 'Accent color', default: '#f97316' },
    },
    defaultConfig: { greeting: 'Hi! How can we help you today?', position: 'bottom-right', accentColor: '#f97316' },
    isBeta: true,
  },

  // ----------------
  // INTEGRATIONS
  // ----------------
  {
    id: 'google-reviews',
    name: 'Google Reviews',
    description: 'Display your Google Business reviews',
    category: 'integrations',
    tier: 'pro',
    icon: 'Star',
    version: '1.0.0',
    author: 'GymTech',
    tags: ['google', 'reviews', 'ratings'],
    componentPath: '@/components/addons/integrations/GoogleReviews',
    allowedPlacements: ['landing'],
    configSchema: {
      placeId: { type: 'text', label: 'Google Place ID', default: '' },
      minRating: { type: 'number', label: 'Minimum rating to show', default: 4, min: 1, max: 5 },
      maxReviews: { type: 'number', label: 'Max reviews to display', default: 6, min: 3, max: 12 },
    },
    defaultConfig: { placeId: '', minRating: 4, maxReviews: 6 },
  },
  {
    id: 'google-maps',
    name: 'Google Maps',
    description: 'Embed a map showing your location',
    category: 'integrations',
    tier: 'free',
    icon: 'MapPin',
    version: '1.0.0',
    author: 'GymTech',
    tags: ['google', 'maps', 'location'],
    componentPath: '@/components/addons/integrations/GoogleMaps',
    allowedPlacements: ['landing'],
    configSchema: {
      address: { type: 'text', label: 'Address', default: '' },
      zoom: { type: 'number', label: 'Zoom level', default: 15, min: 10, max: 20 },
      height: { type: 'number', label: 'Height (px)', default: 400, min: 200, max: 600 },
    },
    defaultConfig: { address: '', zoom: 15, height: 400 },
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getAddonById(id: string): AddonMetadata | undefined {
  return ADDON_REGISTRY.find(addon => addon.id === id);
}

export function getAddonsByCategory(category: AddonCategory): AddonMetadata[] {
  return ADDON_REGISTRY.filter(addon => addon.category === category);
}

export function getAddonsByTier(tier: AddonTier): AddonMetadata[] {
  return ADDON_REGISTRY.filter(addon => addon.tier === tier);
}

export function getFreeAddons(): AddonMetadata[] {
  return ADDON_REGISTRY.filter(addon => addon.tier === 'free');
}

export function getPopularAddons(): AddonMetadata[] {
  return ADDON_REGISTRY.filter(addon => addon.isPopular);
}

export function getNewAddons(): AddonMetadata[] {
  return ADDON_REGISTRY.filter(addon => addon.isNew);
}

export function searchAddons(query: string): AddonMetadata[] {
  const lowerQuery = query.toLowerCase();
  return ADDON_REGISTRY.filter(addon =>
    addon.name.toLowerCase().includes(lowerQuery) ||
    addon.description.toLowerCase().includes(lowerQuery) ||
    addon.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

export const ADDON_CATEGORIES: { value: AddonCategory; label: string; icon: string }[] = [
  { value: 'engagement', label: 'Engagement', icon: 'Trophy' },
  { value: 'booking', label: 'Booking', icon: 'Calendar' },
  { value: 'payments', label: 'Payments', icon: 'CreditCard' },
  { value: 'social', label: 'Social', icon: 'Users' },
  { value: 'marketing', label: 'Marketing', icon: 'Megaphone' },
  { value: 'content', label: 'Content', icon: 'FileText' },
  { value: 'analytics', label: 'Analytics', icon: 'BarChart3' },
  { value: 'communication', label: 'Communication', icon: 'MessageCircle' },
  { value: 'integrations', label: 'Integrations', icon: 'Plug' },
];
