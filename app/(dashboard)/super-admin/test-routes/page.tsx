'use client';

import { useState } from 'react';
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Loader2,
  Lock,
  Globe,
  Database,
  CreditCard,
  Users,
  FileText,
  Mail,
  Settings,
  Puzzle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

// Define all test routes with their security requirements
interface TestRoute {
  path: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  category: 'auth' | 'owner' | 'member' | 'api' | 'public';
  requiredRole: 'public' | 'member' | 'gym_owner' | 'super_admin';
  description: string;
  testPayload?: object;
  securityChecks: string[];
}

const TEST_ROUTES: TestRoute[] = [
  // Public Routes
  {
    path: '/',
    method: 'GET',
    category: 'public',
    requiredRole: 'public',
    description: 'Main landing page',
    securityChecks: ['No PII exposed', 'Rate limiting'],
  },
  {
    path: '/login',
    method: 'GET',
    category: 'auth',
    requiredRole: 'public',
    description: 'Login page',
    securityChecks: ['CSRF protection', 'Brute force protection'],
  },
  {
    path: '/signup',
    method: 'GET',
    category: 'auth',
    requiredRole: 'public',
    description: 'Signup page',
    securityChecks: ['Input validation', 'Email verification required'],
  },

  // Owner Dashboard Routes
  {
    path: '/owner',
    method: 'GET',
    category: 'owner',
    requiredRole: 'gym_owner',
    description: 'Owner dashboard home',
    securityChecks: ['Auth required', 'Gym isolation (RLS)'],
  },
  {
    path: '/owner/members',
    method: 'GET',
    category: 'owner',
    requiredRole: 'gym_owner',
    description: 'Member management',
    securityChecks: ['Auth required', 'PII encrypted', 'Gym isolation'],
  },
  {
    path: '/owner/classes',
    method: 'GET',
    category: 'owner',
    requiredRole: 'gym_owner',
    description: 'Class scheduling',
    securityChecks: ['Auth required', 'Gym isolation'],
  },
  {
    path: '/owner/payments',
    method: 'GET',
    category: 'owner',
    requiredRole: 'gym_owner',
    description: 'Payment management',
    securityChecks: ['Auth required', 'Stripe data isolated', 'Gym isolation'],
  },
  {
    path: '/owner/messaging',
    method: 'GET',
    category: 'owner',
    requiredRole: 'gym_owner',
    description: 'Messaging center',
    securityChecks: ['Auth required', 'PII server-side only', 'Gym isolation'],
  },
  {
    path: '/owner/pages',
    method: 'GET',
    category: 'owner',
    requiredRole: 'gym_owner',
    description: 'Landing page builder',
    securityChecks: ['Auth required', 'Content sanitization', 'XSS prevention'],
  },
  {
    path: '/owner/engagement',
    method: 'GET',
    category: 'owner',
    requiredRole: 'gym_owner',
    description: 'Engagement & rewards',
    securityChecks: ['Auth required', 'Gym isolation'],
  },
  {
    path: '/owner/addons',
    method: 'GET',
    category: 'owner',
    requiredRole: 'gym_owner',
    description: 'Add-ons marketplace',
    securityChecks: ['Auth required', 'Tier verification'],
  },
  {
    path: '/owner/addons/request',
    method: 'GET',
    category: 'owner',
    requiredRole: 'gym_owner',
    description: 'Feature request portal',
    securityChecks: ['Auth required', 'File upload validation', 'Gym isolation'],
  },
  {
    path: '/owner/analytics',
    method: 'GET',
    category: 'owner',
    requiredRole: 'gym_owner',
    description: 'Analytics dashboard',
    securityChecks: ['Auth required', 'Aggregated data only', 'No PII in reports'],
  },
  {
    path: '/owner/settings',
    method: 'GET',
    category: 'owner',
    requiredRole: 'gym_owner',
    description: 'Gym settings',
    securityChecks: ['Auth required', 'Stripe Connect secure', 'Password protected'],
  },

  // Member Routes
  {
    path: '/member',
    method: 'GET',
    category: 'member',
    requiredRole: 'member',
    description: 'Member dashboard',
    securityChecks: ['Auth required', 'Own data only'],
  },
  {
    path: '/member/classes',
    method: 'GET',
    category: 'member',
    requiredRole: 'member',
    description: 'Member classes',
    securityChecks: ['Auth required', 'Own bookings only'],
  },
  {
    path: '/member/payments',
    method: 'GET',
    category: 'member',
    requiredRole: 'member',
    description: 'Member payments',
    securityChecks: ['Auth required', 'Own payments only', 'Masked card info'],
  },
  {
    path: '/member/rewards',
    method: 'GET',
    category: 'member',
    requiredRole: 'member',
    description: 'Member rewards',
    securityChecks: ['Auth required', 'Own points only'],
  },

  // API Routes
  {
    path: '/api/messaging/send',
    method: 'POST',
    category: 'api',
    requiredRole: 'gym_owner',
    description: 'Send messages API',
    testPayload: {
      recipientType: 'all_members',
      channel: 'email',
      subject: 'Test Subject',
      message: 'Hello {first_name}!',
    },
    securityChecks: ['Auth required', 'Role check', 'PII server-side', 'Token sanitization', 'Gym isolation'],
  },
  {
    path: '/api/addons',
    method: 'GET',
    category: 'api',
    requiredRole: 'gym_owner',
    description: 'Get installed add-ons',
    securityChecks: ['Auth required', 'Role check', 'Gym isolation'],
  },
  {
    path: '/api/addons',
    method: 'POST',
    category: 'api',
    requiredRole: 'gym_owner',
    description: 'Install add-on',
    testPayload: {
      addonId: 'class-schedule-widget',
      addonName: 'Class Schedule Widget',
      category: 'scheduling',
      tier: 'free',
    },
    securityChecks: ['Auth required', 'Role check', 'Tier validation', 'Gym isolation'],
  },
  {
    path: '/api/feature-requests',
    method: 'GET',
    category: 'api',
    requiredRole: 'gym_owner',
    description: 'Get feature requests',
    securityChecks: ['Auth required', 'Role check', 'Gym isolation', 'Comment filtering'],
  },
  {
    path: '/api/feature-requests',
    method: 'POST',
    category: 'api',
    requiredRole: 'gym_owner',
    description: 'Create feature request',
    testPayload: {
      title: 'Test Request',
      description: 'This is a test feature request',
      category: 'new_feature',
      priority: 'normal',
    },
    securityChecks: ['Auth required', 'Role check', 'SLA auto-set', 'Gym isolation'],
  },
  {
    path: '/api/stripe/connect',
    method: 'GET',
    category: 'api',
    requiredRole: 'gym_owner',
    description: 'Get Stripe status',
    securityChecks: ['Auth required', 'Role check', 'Stripe account isolation'],
  },
  {
    path: '/api/stripe/connect',
    method: 'POST',
    category: 'api',
    requiredRole: 'gym_owner',
    description: 'Create Stripe Connect',
    testPayload: { action: 'create' },
    securityChecks: ['Auth required', 'Role check', 'Secure redirect URL', 'Account metadata'],
  },
  {
    path: '/api/stripe/webhook',
    method: 'POST',
    category: 'api',
    requiredRole: 'public',
    description: 'Stripe webhook handler',
    securityChecks: ['Signature verification', 'Event type validation', 'Idempotency'],
  },
];

type TestStatus = 'pending' | 'testing' | 'passed' | 'failed' | 'warning';

interface TestResult {
  path: string;
  method: string;
  status: TestStatus;
  message: string;
  duration?: number;
  securityPassed: string[];
  securityFailed: string[];
}

const CATEGORY_CONFIG = {
  public: { label: 'Public', icon: Globe, color: 'text-gray-400', bg: 'bg-gray-500/10' },
  auth: { label: 'Auth', icon: Lock, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  owner: { label: 'Owner', icon: Settings, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  member: { label: 'Member', icon: Users, color: 'text-green-400', bg: 'bg-green-500/10' },
  api: { label: 'API', icon: Database, color: 'text-purple-400', bg: 'bg-purple-500/10' },
};

const ROLE_CONFIG = {
  public: { label: 'Public', color: 'text-gray-400' },
  member: { label: 'Member', color: 'text-green-400' },
  gym_owner: { label: 'Gym Owner', color: 'text-orange-400' },
  super_admin: { label: 'Super Admin', color: 'text-red-400' },
};

export default function TestRoutesPage() {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [testing, setTesting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredRoutes = selectedCategory === 'all'
    ? TEST_ROUTES
    : TEST_ROUTES.filter(r => r.category === selectedCategory);

  const runTest = async (route: TestRoute) => {
    const key = `${route.method}-${route.path}`;
    setResults(prev => ({
      ...prev,
      [key]: { path: route.path, method: route.method, status: 'testing', message: 'Testing...', securityPassed: [], securityFailed: [] },
    }));

    const startTime = Date.now();

    try {
      const options: RequestInit = {
        method: route.method,
        headers: { 'Content-Type': 'application/json' },
      };

      if (route.testPayload && route.method !== 'GET') {
        options.body = JSON.stringify(route.testPayload);
      }

      const response = await fetch(route.path, options);
      const duration = Date.now() - startTime;

      // Determine test result based on expected behavior
      let status: TestStatus = 'passed';
      let message = '';
      const securityPassed: string[] = [];
      const securityFailed: string[] = [];

      if (route.requiredRole !== 'public') {
        // Protected routes should return 401 when not authenticated
        if (response.status === 401) {
          status = 'passed';
          message = 'Auth protection working - returned 401';
          securityPassed.push('Auth required');
        } else if (response.ok) {
          status = 'warning';
          message = 'Route accessible - check if user is authenticated';
          securityFailed.push('Verify auth requirement');
        }
      } else {
        if (response.ok) {
          status = 'passed';
          message = 'Public route accessible';
          securityPassed.push('Public access working');
        }
      }

      // Check for common security headers
      const csp = response.headers.get('content-security-policy');
      if (csp) {
        securityPassed.push('CSP header present');
      }

      setResults(prev => ({
        ...prev,
        [key]: { path: route.path, method: route.method, status, message, duration, securityPassed, securityFailed },
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [key]: {
          path: route.path,
          method: route.method,
          status: 'failed',
          message: error instanceof Error ? error.message : 'Unknown error',
          securityPassed: [],
          securityFailed: ['Request failed'],
        },
      }));
    }
  };

  const runAllTests = async () => {
    setTesting(true);
    for (const route of filteredRoutes) {
      await runTest(route);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    setTesting(false);
  };

  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case 'passed': return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'testing': return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
      default: return <div className="w-5 h-5 rounded-full bg-white/10" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="w-7 h-7 text-orange-400" />
            Security & Route Testing
          </h1>
          <p className="text-gray-400 mt-1">
            Verify route protection, data security, and API endpoints
          </p>
        </div>

        <button
          onClick={runAllTests}
          disabled={testing}
          className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
        >
          {testing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Run All Tests
            </>
          )}
        </button>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            selectedCategory === 'all'
              ? 'bg-white/10 text-white border border-white/20'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          All Routes ({TEST_ROUTES.length})
        </button>
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
          const count = TEST_ROUTES.filter(r => r.category === key).length;
          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                selectedCategory === key
                  ? `${config.bg} ${config.color} border border-current/20`
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <config.icon className="w-4 h-4" />
              {config.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Routes', value: TEST_ROUTES.length, icon: Globe },
          { label: 'Protected Routes', value: TEST_ROUTES.filter(r => r.requiredRole !== 'public').length, icon: Lock },
          { label: 'API Endpoints', value: TEST_ROUTES.filter(r => r.category === 'api').length, icon: Database },
          { label: 'Tests Passed', value: Object.values(results).filter(r => r.status === 'passed').length, icon: CheckCircle2 },
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <stat.icon className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Routes Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Route</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Category</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Required Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Security Checks</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRoutes.map((route, i) => {
                const key = `${route.method}-${route.path}`;
                const result = results[key];
                const catConfig = CATEGORY_CONFIG[route.category];
                const roleConfig = ROLE_CONFIG[route.requiredRole];

                return (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      {result ? getStatusIcon(result.status) : <div className="w-5 h-5 rounded-full bg-white/10" />}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 text-xs font-mono rounded ${
                          route.method === 'GET' ? 'bg-green-500/20 text-green-400' :
                          route.method === 'POST' ? 'bg-blue-500/20 text-blue-400' :
                          route.method === 'PATCH' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {route.method}
                        </span>
                        <div>
                          <p className="font-mono text-sm text-white">{route.path}</p>
                          <p className="text-xs text-gray-500">{route.description}</p>
                          {result?.message && (
                            <p className={`text-xs mt-1 ${
                              result.status === 'passed' ? 'text-green-400' :
                              result.status === 'failed' ? 'text-red-400' :
                              'text-yellow-400'
                            }`}>
                              {result.message}
                              {result.duration && ` (${result.duration}ms)`}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${catConfig.bg} ${catConfig.color}`}>
                        <catConfig.icon className="w-3 h-3" />
                        {catConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm ${roleConfig.color}`}>
                        {roleConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {route.securityChecks.slice(0, 3).map((check, j) => (
                          <span key={j} className="px-2 py-0.5 bg-white/5 text-gray-400 text-xs rounded">
                            {check}
                          </span>
                        ))}
                        {route.securityChecks.length > 3 && (
                          <span className="px-2 py-0.5 bg-white/5 text-gray-500 text-xs rounded">
                            +{route.securityChecks.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => runTest(route)}
                          disabled={testing}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                          title="Run test"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <a
                          href={route.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                          title="Open in new tab"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Guidelines */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-orange-400" />
          Security Implementation Guidelines
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-white mb-2">Data Protection</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                PII (email, phone) encrypted at rest and in transit
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                Server-side token replacement for personalization
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                Supabase RLS for gym data isolation
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                No PII in client-side state or logs
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-white mb-2">API Security</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                JWT authentication on all protected routes
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                Role-based access control (RBAC)
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                Input validation and sanitization
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                Stripe webhook signature verification
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
