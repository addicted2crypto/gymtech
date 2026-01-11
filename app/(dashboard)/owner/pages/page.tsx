'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
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

// Demo pages data - will come from database
const demoPages = [
  {
    id: '1',
    title: 'Main Homepage',
    slug: '',
    isPublished: true,
    updatedAt: '2 hours ago',
    views: 1234
  },
  {
    id: '2',
    title: 'Class Schedule',
    slug: 'schedule',
    isPublished: true,
    updatedAt: '1 day ago',
    views: 567
  },
  {
    id: '3',
    title: 'New Year Promo',
    slug: 'new-year-2026',
    isPublished: false,
    updatedAt: '3 days ago',
    views: 0
  },
];

export default function OwnerPagesPage() {
  const { gym } = useAuthStore();
  const [pages] = useState(demoPages);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const baseUrl = gym?.custom_domain || `${gym?.slug}.gymtech.com`;

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
          {pages.map((page) => (
            <div key={page.id} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
              <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
                <FileEdit className="w-5 h-5 text-gray-400" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="font-medium text-white truncate">{page.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    page.isPublished
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {page.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mt-0.5">
                  /{page.slug || '(homepage)'} • Updated {page.updatedAt}
                </p>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-white font-medium">{page.views.toLocaleString()}</p>
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
          ))}
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
