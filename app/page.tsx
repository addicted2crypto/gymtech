import Link from 'next/link';
import {
  Users,
  Calendar,
  CreditCard,
  BarChart3,
  Zap,
  Share2,
  CheckCircle2,
  ArrowRight,
  Play,
  Globe,
  MessageSquare,
  Gift,
  Shield,
  Headphones,
  TrendingUp,
  Mail,
  Bell,
  Star,
  X,
  Crown,
  Building2,
  Palette,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-linear-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-2xl tracking-tight">GymTech</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-gray-400 hover:text-white transition-colors">Features</Link>
              <Link href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">How It Works</Link>
              <Link href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link>
              <Link href="#faq" className="text-gray-400 hover:text-white transition-colors">FAQ</Link>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-300 hover:text-white transition-colors font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="bg-linear-to-r from-orange-500 to-amber-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/25"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-orange-500/10 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-200 bg-orange-500/20 rounded-full blur-[120px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Star className="w-4 h-4" />
              Trusted by Leading Martial Arts Gyms
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-8 leading-[1.1]">
              Run Your Gym.
              <br />
              <span className="bg-linear-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                We Handle The Tech.
              </span>
            </h1>

            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
              Payments, scheduling, marketing, member engagement, and a professional website —
              all managed for you. <span className="text-white font-semibold">Focus on training fighters, not fighting software.</span>
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
              <Link
                href="/signup"
                className="group bg-linear-to-r from-orange-500 to-amber-500 text-white px-8 py-4 rounded-xl text-lg font-bold hover:from-orange-600 hover:to-amber-600 transition-all shadow-2xl shadow-orange-500/30 flex items-center justify-center gap-2"
              >
                Start 14-Day Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#demo"
                className="group border border-white/20 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/5 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Watch 2-Min Demo(video coming soon)
              </Link>
            </div>

            <p className="text-gray-500 text-sm">
              No credit card required • Setup in 5 minutes • Cancel anytime
            </p>
          </div>

          {/* Dashboard Preview Placeholder */}
          {/* <div className="mt-16 relative">
            <div className="bg-linear-to-b from-white/5 to-transparent rounded-2xl border border-white/10 p-1">
              <div className="bg-[#12121a] rounded-xl aspect-video flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Play className="w-10 h-10 text-orange-400" />
                  </div>
                  <p className="text-gray-400">Dashboard Preview Coming Soon</p>
                </div>
              </div>
            </div>
          </div> */}
        </div>
      </section>

      {/* "We Handle Everything" Section */}
      <section className="py-24 bg-linear-to-b from-[#0a0a0f] via-[#0d0d14] to-[#0a0a0f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black mb-6">
              We Handle
              <span className="bg-linear-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent"> Everything</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Stop paying for 10 different tools. Stop spending nights fixing tech issues.
              Starting at <span className="text-white font-bold">$79/month</span>, we handle your entire digital operation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <WeHandleCard
              icon={Globe}
              title="Your Website"
              description="Professional landing page with your branding, class schedule, and online booking"
            />
            <WeHandleCard
              icon={CreditCard}
              title="All Payments"
              description="Memberships, drop-ins, merchandise — money goes straight to your bank"
            />
            <WeHandleCard
              icon={Users}
              title="Member Management"
              description="Sign-ups, check-ins, attendance tracking, and automated follow-ups"
            />
            <WeHandleCard
              icon={Calendar}
              title="Class Scheduling"
              description="Recurring schedules, online booking, waitlists, and instructor management"
            />
            <WeHandleCard
              icon={Mail}
              title="Email & SMS"
              description="Automated reminders, marketing campaigns, and member communications"
            />
            <WeHandleCard
              icon={Gift}
              title="Loyalty & Rewards"
              description="Login streaks, points system, flash sales, and member retention"
            />
            <WeHandleCard
              icon={BarChart3}
              title="Analytics"
              description="Revenue, attendance trends, popular classes, and growth metrics"
            />
            <WeHandleCard
              icon={Headphones}
              title="24/7 Support"
              description="Dedicated support team that understands the fitness industry"
            />
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 px-6 py-3 rounded-xl">
              <Shield className="w-5 h-5" />
              <span className="font-medium">Bank-Level Security • Your Members&apos; Data is Safe</span>
            </div>
          </div>
        </div>
      </section>

      {/* All Features Section */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black mb-6">
              Every Feature You Need,
              <span className="bg-linear-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent"> Nothing You Don&apos;t</span>
            </h2>
            <p className="text-xl text-gray-400">
              All the tools to run a modern gym, designed specifically for martial arts.
            </p>
          </div>

          {/* Feature Categories */}
          <div className="space-y-16">
            {/* Core Features */}
            <FeatureCategory
              title="Core Operations"
              badge="All Plans"
              features={[
                { icon: Users, name: 'Member Database', desc: 'Unlimited member profiles with photo, belt rank, contact info' },
                { icon: Calendar, name: 'Class Scheduling', desc: 'Recurring weekly schedules with instructor assignment' },
                { icon: CreditCard, name: 'Payment Processing', desc: 'Stripe-powered subscriptions and one-time payments' },
                { icon: CheckCircle2, name: 'Check-In System', desc: 'QR code or manual check-in with attendance tracking' },
                { icon: BarChart3, name: 'Basic Analytics', desc: 'Revenue, attendance, and member count dashboards' },
                { icon: Globe, name: 'Subdomain Site', desc: 'yourgym.gymtech.com with schedule and pricing' },
              ]}
            />

            {/* Pro Features */}
            <FeatureCategory
              title="Marketing & Engagement"
              badge="Pro Plan"
              badgeColor="purple"
              features={[
                { icon: Palette, name: 'Landing Page Builder', desc: 'Drag-and-drop website builder with 6 templates' },
                { icon: Gift, name: 'Loyalty Rewards', desc: 'Login streaks, points, and redeemable rewards' },
                { icon: Bell, name: 'Flash Sales', desc: 'Time-limited offers for high-engagement members' },
                { icon: MessageSquare, name: 'SMS Marketing', desc: 'Automated texts for reminders and promotions' },
                { icon: TrendingUp, name: 'Advanced Analytics', desc: 'Retention rates, class tendencies, revenue forecasting' },
                { icon: Globe, name: 'Custom Domain', desc: 'Use yourgym.com with free SSL certificate' },
              ]}
            />

            {/* Enterprise Features */}
            <FeatureCategory
              title="Scale & Automation"
              badge="Enterprise"
              badgeColor="amber"
              features={[
                { icon: Share2, name: 'Social Cross-Posting', desc: 'Post to Instagram, Facebook, TikTok in one click', comingSoon: true },
                { icon: Building2, name: 'Multi-Location', desc: 'Manage multiple gyms from one dashboard' },
                { icon: Users, name: 'Trial Lead Data', desc: 'Access anonymized trial-taker behavior patterns', comingSoon: true },
                { icon: Crown, name: 'White Label', desc: 'Remove "Powered by GymTech" branding' },
                { icon: Zap, name: 'API Access', desc: 'Integrate with your existing tools and workflows' },
                { icon: Headphones, name: 'Dedicated Manager', desc: 'Personal account manager and priority support' },
              ]}
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-linear-to-b from-[#0a0a0f] via-[#0d0d14] to-[#0a0a0f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black mb-6">
              Go Live in
              <span className="bg-linear-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent"> 5 Minutes</span>
            </h2>
            <p className="text-xl text-gray-400">
              No tech skills needed. We guide you through every step.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <StepCard
              number="1"
              title="Sign Up"
              description="Create your account and pick a plan. No credit card for 14-day trial."
            />
            <StepCard
              number="2"
              title="Add Your Classes"
              description="Enter your schedule. We have templates for BJJ, Muay Thai, MMA, and more."
            />
            <StepCard
              number="3"
              title="Customize Your Site"
              description="Choose a template, add your logo and photos. Done in minutes."
            />
            <StepCard
              number="4"
              title="Go Live"
              description="Share your link. Members can book classes and pay online immediately."
            />
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-400 mb-6">
              Need help? Our team will set everything up for you — free.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-linear-to-r from-orange-500 to-amber-500 text-white px-8 py-4 rounded-xl text-lg font-bold hover:from-orange-600 hover:to-amber-600 transition-all"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black mb-6">
              Simple, Flat
              <span className="bg-linear-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent"> Pricing</span>
            </h2>
            <p className="text-xl text-gray-400">
              No per-member fees. No hidden charges. No surprises.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-2">Starter</h3>
              <p className="text-gray-400 mb-6">For new gyms getting started</p>
              <div className="mb-6">
                <span className="text-5xl font-black">$79</span>
                <span className="text-gray-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <PricingFeature text="Up to 25 members" />
                <PricingFeature text="3 staff accounts" />
                <PricingFeature text="Class scheduling" />
                <PricingFeature text="Payment processing" />
                <PricingFeature text="Basic analytics" />
                <PricingFeature text="Subdomain website" />
                <PricingFeature text="Check-in system" />
              </ul>
              <Link href="/signup" className="block text-center py-3 border border-white/20 rounded-xl font-semibold hover:bg-white/5 transition-all">
                Start Free Trial
              </Link>
            </div>

            {/* Pro - Popular */}
            <div className="relative bg-white/5 border-2 border-orange-500/50 rounded-2xl p-8 ring-1 ring-orange-500/20 scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-linear-to-r from-orange-500 to-amber-500 text-white text-sm font-bold px-4 py-1.5 rounded-full">
                  MOST POPULAR
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <p className="text-gray-400 mb-6">For growing gyms that want it all</p>
              <div className="mb-6">
                <span className="text-5xl font-black">$149</span>
                <span className="text-gray-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <PricingFeature text="Up to 150 members" />
                <PricingFeature text="10 staff accounts" />
                <PricingFeature text="Everything in Starter" highlight />
                <PricingFeature text="Landing page builder" highlight />
                <PricingFeature text="Custom domain" highlight />
                <PricingFeature text="Loyalty & rewards system" highlight />
                <PricingFeature text="SMS marketing (200/mo)" highlight />
                <PricingFeature text="Flash sales" highlight />
                <PricingFeature text="Advanced analytics" highlight />
              </ul>
              <Link href="/signup" className="block text-center py-3 bg-linear-to-r from-orange-500 to-amber-500 rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/25">
                Start Free Trial
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
              <p className="text-gray-400 mb-6">For multi-location & franchises</p>
              <div className="mb-6">
                <span className="text-5xl font-black">$299</span>
                <span className="text-gray-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <PricingFeature text="Unlimited members" />
                <PricingFeature text="Unlimited staff" />
                <PricingFeature text="Everything in Pro" highlight />
                <PricingFeature text="Multi-location support" highlight />
                <PricingFeature text="White-label branding" highlight />
                <PricingFeature text="Social cross-posting" soon />
                <PricingFeature text="Trial lead insights" soon />
                <PricingFeature text="API access" highlight />
                <PricingFeature text="Dedicated account manager" highlight />
              </ul>
              <Link href="/signup" className="block text-center py-3 border border-white/20 rounded-xl font-semibold hover:bg-white/5 transition-all">
                Start Free Trial
              </Link>
            </div>
          </div>

          {/* Comparison Toggle */}
          <div className="mt-16 text-center">
            <Link href="#comparison" className="text-orange-400 hover:text-orange-300 font-medium">
              See full feature comparison →
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section id="comparison" className="py-24 bg-linear-to-b from-[#0a0a0f] via-[#0d0d14] to-[#0a0a0f]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-black text-center mb-12">Feature Comparison</h3>
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 font-semibold">Feature</th>
                  <th className="text-center p-4 font-semibold">Starter<br /><span className="text-gray-400 text-sm font-normal">$79/mo</span></th>
                  <th className="text-center p-4 font-semibold text-orange-400">Pro<br /><span className="text-gray-400 text-sm font-normal">$149/mo</span></th>
                  <th className="text-center p-4 font-semibold">Enterprise<br /><span className="text-gray-400 text-sm font-normal">$299/mo</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <ComparisonRow feature="Members" starter="25" pro="150" enterprise="Unlimited" />
                <ComparisonRow feature="Staff Accounts" starter="3" pro="10" enterprise="Unlimited" />
                <ComparisonRow feature="Class Scheduling" starter pro enterprise />
                <ComparisonRow feature="Payment Processing" starter pro enterprise />
                <ComparisonRow feature="Check-In System" starter pro enterprise />
                <ComparisonRow feature="Basic Analytics" starter pro enterprise />
                <ComparisonRow feature="Subdomain Website" starter pro enterprise />
                <ComparisonRow feature="Landing Page Builder" pro enterprise />
                <ComparisonRow feature="Custom Domain" pro enterprise />
                <ComparisonRow feature="Loyalty & Rewards" pro enterprise />
                <ComparisonRow feature="SMS Marketing" pro enterprise />
                <ComparisonRow feature="Flash Sales" pro enterprise />
                <ComparisonRow feature="Advanced Analytics" pro enterprise />
                <ComparisonRow feature="Multi-Location" enterprise />
                <ComparisonRow feature="White-Label" enterprise />
                <ComparisonRow feature="Social Cross-Posting" enterprise soon />
                <ComparisonRow feature="API Access" enterprise />
                <ComparisonRow feature="Dedicated Manager" enterprise />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-black text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <FAQItem
              question="How long does it take to set up?"
              answer="Most gym owners are up and running in under 30 minutes. If you need help, our team can set everything up for you — free of charge."
            />
            <FAQItem
              question="Can I import my existing members?"
              answer="Yes! You can import members via CSV file. We also support migrations from MindBody, Zen Planner, and other platforms."
            />
            <FAQItem
              question="Do you charge per member?"
              answer="No. Our pricing is flat monthly — no matter how many members you have (within your plan's limit). This saves you hundreds compared to per-member pricing."
            />
            <FAQItem
              question="What payment processors do you support?"
              answer="We use Stripe for all payment processing. Funds go directly to your bank account, typically within 2 business days."
            />
            <FAQItem
              question="Can members book classes from their phone?"
              answer="Yes! Your website works perfectly on mobile. Members can view the schedule, book classes, and manage their membership from any device."
            />
            <FAQItem
              question="What happens after my free trial?"
              answer="After 14 days, you can choose to continue with a paid plan or cancel. We don't require a credit card to start, so there's no surprise charges."
            />
            <FAQItem
              question="Can I use my own domain name?"
              answer="Yes, on Pro and Enterprise plans. We handle the technical setup — just point your domain to us and we'll configure SSL automatically."
            />
            <FAQItem
              question="Is my members' data secure?"
              answer="Absolutely. We use bank-level encryption, and all sensitive data (like payment info) is handled by Stripe. We're also SOC 2 compliant."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-orange-500/20 via-amber-500/20 to-orange-500/20" />
        <div className="absolute inset-0 bg-[#0a0a0f]/80" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-black mb-6">
            Ready to Simplify Your Gym?
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Join 500+ martial arts gyms who stopped fighting their software and started growing their business.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-linear-to-r from-orange-500 to-amber-500 text-white px-10 py-5 rounded-xl text-xl font-bold hover:from-orange-600 hover:to-amber-600 transition-all shadow-2xl shadow-orange-500/30"
          >
            Start Your Free Trial
            <ArrowRight className="w-6 h-6" />
          </Link>
          <p className="mt-6 text-gray-500">No credit card required • Setup in 5 minutes • Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#050508]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-linear-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-xl">GymTech</span>
              </div>
              <p className="text-gray-500">
                The complete platform for martial arts, boxing, and MMA gyms.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <div className="space-y-3 text-gray-400">
                <Link href="#features" className="block hover:text-white transition-colors">Features</Link>
                <Link href="#pricing" className="block hover:text-white transition-colors">Pricing</Link>
                <Link href="#comparison" className="block hover:text-white transition-colors">Compare Plans</Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <div className="space-y-3 text-gray-400">
                <Link href="#faq" className="block hover:text-white transition-colors">FAQ</Link>
                <Link href="#" className="block hover:text-white transition-colors">Help Center</Link>
                <Link href="#" className="block hover:text-white transition-colors">Contact</Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <div className="space-y-3 text-gray-400">
                <Link href="#" className="block hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="#" className="block hover:text-white transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} GymTech. All rights reserved.
            </p>
            <p className="text-gray-600 text-sm">
              Built for fighters, by fighters.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Component: "We Handle" Card
function WeHandleCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
      <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-orange-400" />
      </div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

// Component: Feature Category
function FeatureCategory({
  title,
  badge,
  badgeColor = 'green',
  features
}: {
  title: string;
  badge: string;
  badgeColor?: 'green' | 'purple' | 'amber';
  features: { icon: React.ElementType; name: string; desc: string; comingSoon?: boolean }[];
}) {
  const badgeColors = {
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h3 className="text-2xl font-bold">{title}</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${badgeColors[badgeColor]}`}>
          {badge}
        </span>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature) => (
          <div key={feature.name} className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
              <feature.icon className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">{feature.name}</h4>
                {feature.comingSoon && (
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">Soon</span>
                )}
              </div>
              <p className="text-gray-500 text-sm mt-1">{feature.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Component: Step Card
function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 text-orange-400 font-bold text-xl">
        {number}
      </div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

// Component: Pricing Feature
function PricingFeature({ text, highlight, soon }: { text: string; highlight?: boolean; soon?: boolean }) {
  return (
    <li className={`flex items-center gap-2 ${highlight ? 'text-white' : 'text-gray-400'}`}>
      <CheckCircle2 className={`w-5 h-5 shrink-0 ${highlight ? 'text-orange-400' : 'text-gray-600'}`} />
      {text}
      {soon && <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">Soon</span>}
    </li>
  );
}

// Component: Comparison Row
function ComparisonRow({
  feature,
  starter,
  pro,
  enterprise,
  soon
}: {
  feature: string;
  starter?: boolean | string;
  pro?: boolean | string;
  enterprise?: boolean | string;
  soon?: boolean;
}) {
  const renderCell = (value: boolean | string | undefined) => {
    if (value === undefined || value === false) {
      return <X className="w-5 h-5 text-gray-600 mx-auto" />;
    }
    if (value === true) {
      return <CheckCircle2 className="w-5 h-5 text-green-400 mx-auto" />;
    }
    return <span className="text-white">{value}</span>;
  };

  return (
    <tr>
      <td className="p-4 text-gray-300">
        {feature}
        {soon && <span className="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">Soon</span>}
      </td>
      <td className="p-4 text-center">{renderCell(starter)}</td>
      <td className="p-4 text-center bg-orange-500/5">{renderCell(pro)}</td>
      <td className="p-4 text-center">{renderCell(enterprise)}</td>
    </tr>
  );
}

// Component: FAQ Item
function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group bg-white/5 border border-white/10 rounded-xl">
      <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
        <span className="font-semibold">{question}</span>
        <span className="text-gray-400 group-open:rotate-180 transition-transform">
          <ArrowRight className="w-5 h-5 rotate-90" />
        </span>
      </summary>
      <div className="px-4 pb-4 text-gray-400">
        {answer}
      </div>
    </details>
  );
}
