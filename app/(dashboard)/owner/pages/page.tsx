'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { createClient } from '@/lib/supabase/client';
import {
  Plus,
  FileEdit,
  Eye,
  Globe,
  MoreVertical,
  ExternalLink,
  Trash2,
  Copy
} from 'lucide-react';

type LandingPage = {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
  updated_at: string;
  views?: number;
};

type GymInfo = {
  slug: string;
  custom_domain: string | null;
};

export default function OwnerPagesPage() {
  const { getEffectiveGymId } = useAuthStore();
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [gymInfo, setGymInfo] = useState<GymInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const gymId = getEffectiveGymId();

      if (!gymId) {
        setLoading(false);
        return;
      }

      const supabase = createClient();

      // Fetch gym info for URL
      const { data: gym } = await supabase
        .from('gyms')
        .select('slug, custom_domain')
        .eq('id', gymId)
        .single();

      if (gym) {
        setGymInfo(gym);
      }

      // Fetch landing pages
      const { data: pagesData, error } = await supabase
        .from('landing_pages')
        .select('id, title, slug, is_published, updated_at')
        .eq('gym_id', gymId)
        .order('updated_at', { ascending: false });

      if (!error && pagesData) {
        setPages(pagesData);
      }

      setLoading(false);
    };

    fetchData();
  }, [getEffectiveGymId]);

  const baseUrl = gymInfo?.custom_domain || `${gymInfo?.slug || 'your-gym'}.gymtech.com`;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Landing Pages</h1>
          <p className="text-gray-400 mt-1">
            Create and manage your gym&apos;s website pages
          </p>
        </div>
        <Link
          href="/owner/pages/new"
          className="flex items-center gap-2 bg-linear-to-r from-orange-500 to-amber-500 text-white px-4 py-2.5 rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/25"
        >
          <Plus className="w-5 h-5" />
          Create Page
        </Link>
      </div>

      {/* Domain Info */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Your gym website</p>
              <p className="text-white font-medium">{baseUrl}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`https://${baseUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Visit Site
            </a>
            <Link
              href="/owner/settings/domain"
              className="text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors"
            >
              Custom Domain →
            </Link>
          </div>
        </div>
      </div>

      {/* Pages List */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Your Pages</h2>
        </div>

        <div className="divide-y divide-white/5">
          {pages.length === 0 ? (
            <div className="p-12 text-center">
              <FileEdit className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No pages yet</h3>
              <p className="text-gray-400 mb-6">Create your first landing page to get started</p>
              <Link
                href="/owner/pages/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-orange-500 to-amber-500 text-white font-medium rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all"
              >
                <Plus className="w-5 h-5" />
                Create Your First Page
              </Link>
            </div>
          ) : (
            pages.map((page) => (
              <div key={page.id} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
                  <FileEdit className="w-5 h-5 text-gray-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-white truncate">{page.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      page.is_published
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {page.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mt-0.5">
                    /{page.slug || '(homepage)'} • Updated {formatDate(page.updated_at)}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-white font-medium">{(page.views || 0).toLocaleString()}</p>
                    <p className="text-gray-500 text-xs">views</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/owner/pages/${page.id}`}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                      title="Edit"
                    >
                      <FileEdit className="w-4 h-4" />
                    </Link>
                    <a
                      href={`https://${baseUrl}/${page.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === page.id ? null : page.id)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openMenu === page.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-[#1a1a24] border border-white/10 rounded-xl shadow-xl z-10 py-1">
                          <button className="w-full px-4 py-2 text-left text-gray-300 hover:bg-white/5 flex items-center gap-2">
                            <Copy className="w-4 h-4" />
                            Duplicate
                          </button>
                          <button className="w-full px-4 py-2 text-left text-red-400 hover:bg-white/5 flex items-center gap-2">
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Templates */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Start with a Template</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <TemplateCard
            title="Class Schedule"
            description="Display your weekly schedule with booking"
          />
          <TemplateCard
            title="Pricing & Plans"
            description="Show membership options and pricing"
          />
          <TemplateCard
            title="About / Team"
            description="Introduce your coaches and gym story"
          />
        </div>
      </div>
    </div>
  );
}

function TemplateCard({ title, description }: { title: string; description: string }) {
  return (
    <button className="bg-white/5 border border-white/10 rounded-xl p-4 text-left hover:bg-white/10 hover:border-orange-500/30 transition-all group">
      <div className="w-full h-24 bg-white/5 rounded-lg mb-3 flex items-center justify-center">
        <Plus className="w-8 h-8 text-gray-600 group-hover:text-orange-400 transition-colors" />
      </div>
      <h3 className="font-medium text-white">{title}</h3>
      <p className="text-gray-500 text-sm mt-1">{description}</p>
    </button>
  );
}
