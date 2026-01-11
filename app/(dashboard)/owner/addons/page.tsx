'use client';

import { useState } from 'react';
import {
  Search,
  Plus,
  Check,
  Settings,
  Sparkles,
  Zap,
  Crown,
  Filter,
  Grid,
  List,
  ExternalLink,
  ChevronRight,
  // Category icons
  Trophy,
  Calendar,
  CreditCard,
  Users,
  Megaphone,
  FileText,
  BarChart3,
  MessageCircle,
  Plug,
  Star,
  Flame,
  Award,
  Image,
  HelpCircle,
  MapPin,
  Timer,
  Quote
} from 'lucide-react';
import {
  ADDON_REGISTRY,
  ADDON_CATEGORIES,
  type AddonMetadata,
  type AddonCategory,
  type AddonTier
} from '@/lib/addons/registry';

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Trophy, Calendar, CreditCard, Users, Megaphone, FileText, BarChart3,
  MessageCircle, Plug, Star, Flame, Award, Image, HelpCircle, MapPin,
  Timer, Quote, Zap, Crown
};

// Demo: which add-ons are currently installed
const installedAddonIds = ['class-schedule-widget', 'lead-capture-form', 'pricing-table'];

export default function AddonsMarketplace() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AddonCategory | 'all'>('all');
  const [selectedTier, setSelectedTier] = useState<AddonTier | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showInstalled, setShowInstalled] = useState(false);

  // Filter add-ons
  const filteredAddons = ADDON_REGISTRY.filter(addon => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        addon.name.toLowerCase().includes(query) ||
        addon.description.toLowerCase().includes(query) ||
        addon.tags.some(tag => tag.includes(query));
      if (!matchesSearch) return false;
    }

    // Category filter
    if (selectedCategory !== 'all' && addon.category !== selectedCategory) {
      return false;
    }

    // Tier filter
    if (selectedTier !== 'all' && addon.tier !== selectedTier) {
      return false;
    }

    // Installed filter
    if (showInstalled && !installedAddonIds.includes(addon.id)) {
      return false;
    }

    return true;
  });

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName];
    return IconComponent || Zap;
  };

  const getTierBadge = (tier: AddonTier) => {
    switch (tier) {
      case 'free':
        return null;
      case 'pro':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
            <Crown className="w-3 h-3" />
            Pro
          </span>
        );
      case 'enterprise':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
            <Sparkles className="w-3 h-3" />
            Enterprise
          </span>
        );
    }
  };

  const isInstalled = (addonId: string) => installedAddonIds.includes(addonId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Add-ons Marketplace</h1>
          <p className="text-gray-400 mt-1">
            Enhance your gym website with one-click add-ons
          </p>
        </div>
        <a
          href="/owner/addons/request"
          className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium hover:from-orange-600 hover:to-amber-600 transition-all"
        >
          <Plus className="w-5 h-5" />
          Request Custom Feature
        </a>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{installedAddonIds.length}</p>
          <p className="text-sm text-gray-400">Installed Add-ons</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{ADDON_REGISTRY.filter(a => a.tier === 'free').length}</p>
          <p className="text-sm text-gray-400">Free Add-ons</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <p className="text-2xl font-bold text-purple-400">{ADDON_REGISTRY.filter(a => a.tier === 'pro').length}</p>
          <p className="text-sm text-gray-400">Pro Add-ons</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <p className="text-2xl font-bold text-amber-400">{ADDON_REGISTRY.filter(a => a.isNew).length}</p>
          <p className="text-sm text-gray-400">New This Month</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search add-ons..."
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as AddonCategory | 'all')}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/50"
          >
            <option value="all">All Categories</option>
            {ADDON_CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          {/* Tier Filter */}
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value as AddonTier | 'all')}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/50"
          >
            <option value="all">All Tiers</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>

          {/* Installed Toggle */}
          <button
            onClick={() => setShowInstalled(!showInstalled)}
            className={`px-4 py-3 rounded-xl border transition-all ${
              showInstalled
                ? 'bg-orange-500/20 border-orange-500/30 text-orange-400'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            Installed Only
          </button>

          {/* View Toggle */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-400'}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-400'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selectedCategory === 'all'
              ? 'bg-orange-500 text-white'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          All
        </button>
        {ADDON_CATEGORIES.map(cat => {
          const Icon = getIcon(cat.icon);
          return (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat.value
                  ? 'bg-orange-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Results Count */}
      <p className="text-sm text-gray-400">
        Showing {filteredAddons.length} of {ADDON_REGISTRY.length} add-ons
      </p>

      {/* Add-ons Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAddons.map((addon) => {
            const Icon = getIcon(addon.icon);
            const installed = isInstalled(addon.id);

            return (
              <div
                key={addon.id}
                className={`bg-white/5 backdrop-blur-sm border rounded-2xl p-6 transition-all hover:border-white/20 ${
                  installed ? 'border-green-500/30' : 'border-white/10'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      installed ? 'bg-green-500/20' : 'bg-orange-500/20'
                    }`}>
                      <Icon className={`w-6 h-6 ${installed ? 'text-green-400' : 'text-orange-400'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{addon.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getTierBadge(addon.tier)}
                        {addon.isNew && (
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                            New
                          </span>
                        )}
                        {addon.isPopular && (
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                            Popular
                          </span>
                        )}
                        {addon.isBeta && (
                          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                            Beta
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-400 text-sm mb-4">{addon.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {addon.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-white/5 text-gray-500 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {installed ? (
                    <>
                      <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl text-sm font-medium">
                        <Check className="w-4 h-4" />
                        Installed
                      </button>
                      <button className="p-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-white/20 transition-colors">
                        <Settings className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-linear-to-r from-orange-500 to-amber-500 text-white rounded-xl text-sm font-medium hover:from-orange-600 hover:to-amber-600 transition-all">
                      <Plus className="w-4 h-4" />
                      Install Add-on
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAddons.map((addon) => {
            const Icon = getIcon(addon.icon);
            const installed = isInstalled(addon.id);

            return (
              <div
                key={addon.id}
                className={`bg-white/5 backdrop-blur-sm border rounded-xl p-4 flex items-center gap-4 transition-all hover:border-white/20 ${
                  installed ? 'border-green-500/30' : 'border-white/10'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  installed ? 'bg-green-500/20' : 'bg-orange-500/20'
                }`}>
                  <Icon className={`w-6 h-6 ${installed ? 'text-green-400' : 'text-orange-400'}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{addon.name}</h3>
                    {getTierBadge(addon.tier)}
                    {addon.isNew && (
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">New</span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm truncate">{addon.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {installed ? (
                    <>
                      <span className="flex items-center gap-1 text-green-400 text-sm">
                        <Check className="w-4 h-4" />
                        Installed
                      </span>
                      <button className="p-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-white/20 transition-colors">
                        <Settings className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <button className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-orange-500 to-amber-500 text-white rounded-xl text-sm font-medium hover:from-orange-600 hover:to-amber-600 transition-all">
                      <Plus className="w-4 h-4" />
                      Install
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredAddons.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No add-ons found</h3>
          <p className="text-gray-400 mb-4">Try adjusting your search or filters</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedTier('all');
              setShowInstalled(false);
            }}
            className="text-orange-400 font-medium hover:text-orange-300"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Request Custom Feature CTA */}
      <div className="bg-linear-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-2xl p-8 text-center">
        <h3 className="text-xl font-bold text-white mb-2">Need something custom?</h3>
        <p className="text-gray-400 mb-6 max-w-lg mx-auto">
          Can't find what you're looking for? Submit a feature request and our dev team will implement it within 24 hours.
        </p>
        <a
          href="/owner/addons/request"
          className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 transition-all"
        >
          Request Custom Feature
          <ChevronRight className="w-5 h-5" />
        </a>
      </div>
    </div>
  );
}
